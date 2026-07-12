/**
 * Mid-session enable protection (upstream "instant drain" report).
 *
 * A session that ran WITHOUT OmniGlyph has its whole text prefix cached by
 * Anthropic at the 0.1x read rate (Claude Code marks it with cache_control).
 * The FIRST imaged request breaks that prefix match, so the caller re-pays the
 * entire session as a fresh 1.25x cache write in one prompt. The profitability
 * gate already models this burn (priorWarmTokens x (CC - CR)) — these tests pin
 * that the PROXY actually feeds it: a first-seen session with a large marked
 * text prefix must NOT flip to images; sessions OmniGlyph already images keep
 * compressing.
 */
import { describe, it, expect } from 'vitest';
import { createProxy, type ProxyEvent } from '../src/core/proxy.js';

function mockUpstream(handler: (req: Request) => Promise<Response> | Response) {
  const real = globalThis.fetch;
  globalThis.fetch = ((req: Request | string | URL, init?: RequestInit) => {
    const r = req instanceof Request ? req : new Request(String(req), init);
    return Promise.resolve(handler(r));
  }) as typeof fetch;
  return () => {
    globalThis.fetch = real;
  };
}

const big = (n: number) => 'x'.repeat(n);

/** N closed turns, ~chars each; first user message text pins the session key. */
function convo(n: number, chars: number, sessionTag: string): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < n; i++) {
    const text = i === 0 ? `session ${sessionTag}: hello` : `turn ${i}: ` + big(chars);
    out.push({ role: i % 2 === 0 ? 'user' : 'assistant', content: text });
  }
  return out;
}

/** Marked = Claude Code style: system slab + a trailing history marker. */
function requestBody(opts: {
  sessionTag: string;
  historyTurns: number;
  historyChars: number;
  marked: boolean;
}): string {
  const messages = convo(opts.historyTurns, opts.historyChars, opts.sessionTag) as Array<{
    role: string;
    content: unknown;
  }>;
  if (opts.marked && messages.length > 1) {
    const last = messages[messages.length - 2]!; // a late, closed turn carries the roaming marker
    last.content = [
      { type: 'text', text: last.content as string, cache_control: { type: 'ephemeral' } },
    ];
  }
  return JSON.stringify({
    model: 'claude-fable-5',
    max_tokens: 128,
    system: [
      {
        type: 'text',
        text: big(80_000),
        ...(opts.marked ? { cache_control: { type: 'ephemeral' } } : {}),
      },
    ],
    messages,
  });
}

/** Drive one request through the proxy; return the forwarded upstream body + event. */
async function runOnce(
  proxy: (req: Request) => Promise<Response>,
  body: string,
  onForward: (forwarded: string) => void,
): Promise<void> {
  const res = await proxy(
    new Request('http://localhost/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  );
  await res.text();
  expect(onForward).toBeDefined();
}

function makeHarness() {
  const forwarded: string[] = [];
  const events: ProxyEvent[] = [];
  const restore = mockUpstream(async (req) => {
    if (req.url.endsWith('/count_tokens')) {
      return new Response(JSON.stringify({ input_tokens: 1 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    forwarded.push(await req.text());
    return new Response(JSON.stringify({ usage: { input_tokens: 1, output_tokens: 1 } }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });
  const proxy = createProxy({
    transform: {},
    onRequest: (e) => {
      events.push(e);
    },
  });
  return { proxy, forwarded, events, restore };
}

describe('warm-session gate (mid-session enable must not re-pay the cached prefix)', () => {
  it('first-seen session with a huge MARKED text prefix stays text (no images forwarded)', async () => {
    const { proxy, forwarded, restore } = makeHarness();
    try {
      // ~1M chars of already-cached history (≈250k warm tokens) dwarfs the
      // slab's per-turn savings — flipping to images would re-pay it all once.
      await runOnce(proxy, requestBody({ sessionTag: 'drain', historyTurns: 21, historyChars: 50_000, marked: true }), () => {});
    } finally {
      restore();
    }
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0]).not.toContain('"type":"image"');
  });

  it('a session OmniGlyph already images keeps compressing as it grows (no penalty)', async () => {
    const { proxy, forwarded, restore } = makeHarness();
    try {
      // Turn 1: session starts WITH the proxy — small history, compresses.
      await runOnce(proxy, requestBody({ sessionTag: 'ours', historyTurns: 3, historyChars: 2_000, marked: true }), () => {});
      // Later turn of the SAME session: history has grown large; its cache is
      // already the imaged prefix, so no warm penalty applies.
      await runOnce(proxy, requestBody({ sessionTag: 'ours', historyTurns: 21, historyChars: 50_000, marked: true }), () => {});
    } finally {
      restore();
    }
    expect(forwarded).toHaveLength(2);
    expect(forwarded[0]).toContain('"type":"image"');
    expect(forwarded[1]).toContain('"type":"image"');
  });

  it('an UNMARKED big session has no cached prefix to lose — still compresses', async () => {
    const { proxy, forwarded, restore } = makeHarness();
    try {
      await runOnce(proxy, requestBody({ sessionTag: 'nocache', historyTurns: 21, historyChars: 50_000, marked: false }), () => {});
    } finally {
      restore();
    }
    expect(forwarded).toHaveLength(1);
    expect(forwarded[0]).toContain('"type":"image"');
  });
});
