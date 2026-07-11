import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { isModelImageable, setAllowedModelBases } from '../src/core/applicability.js';
import { createProxy, type ProxyEvent } from '../src/core/proxy.js';

afterEach(() => { delete process.env.OMNIGLYPH_UNVERIFIED_MODELS; });

describe('unverified-model gate', () => {
  it('a verified model is always imageable', () => {
    expect(isModelImageable('gpt-5.6')).toBe(true);
    expect(isModelImageable('claude-fable-5')).toBe(true);
  });
  it('grok is NOT imageable without an explicit ack', () => {
    expect(isModelImageable('grok-4.5')).toBe(false);
  });
  it('grok becomes imageable with OMNIGLYPH_UNVERIFIED_MODELS ack', () => {
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'grok-4.5';
    expect(isModelImageable('grok-4.5')).toBe(true);
  });
  it('an ack for a different grok variant does not cover this one', () => {
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'grok-9';
    expect(isModelImageable('grok-4.5')).toBe(false);
  });
  it('fails closed on non-canonical casing (a safety gate must not be case-sensitive)', () => {
    // isGrokModel/resolveModelProfile lowercase, so `Grok-4.5` still gets the
    // Grok render + pixel pricing; the gate must match and require the ack too.
    expect(isModelImageable('Grok-4.5')).toBe(false);
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'Grok-4.5';
    expect(isModelImageable('grok-4.5')).toBe(true); // ack casing must not matter either
  });
});

// ===========================================================================
// PROXY-LEVEL e2e: the gate's reason + no image_url leak while unverified.
// fakeUpstream/driveAndCapture copied from tests/savings-math-e2e.test.ts.
// ===========================================================================

function fakeUpstream() {
  const main: { url: string; body: string }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (input: Request | string | URL, init?: RequestInit) => {
    const req = input instanceof Request ? input : new Request(String(input), init);
    const path = new URL(req.url).pathname;
    if (path.endsWith('/count_tokens')) {
      return new Response(JSON.stringify({ input_tokens: 9999 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }
    main.push({ url: req.url, body: await req.clone().text() });
    return new Response(
      JSON.stringify({
        id: 'c1',
        object: 'chat.completion',
        choices: [{ message: { role: 'assistant', content: 'ok' } }],
        usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  }) as typeof fetch;
  return { main, restore: () => { globalThis.fetch = real; } };
}

async function driveAndCapture(
  path: string,
  body: string,
  transform: Record<string, unknown> = {}, // realistic gate — DEFAULTS (charsPerToken 4, minCompressChars 2000)
): Promise<{ event: ProxyEvent; out: string }> {
  const cap = fakeUpstream();
  let event: ProxyEvent | undefined;
  const proxy = createProxy({
    upstream: 'http://anthropic.test',
    apiKey: 'sk-ant',
    openAIUpstream: 'https://openai.test',
    openAIApiKey: 'sk-oai',
    transform,
    onRequest: (e) => { event = e; },
  });
  const res = await proxy(
    new Request(`http://localhost${path}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
    }),
  );
  await res.text();
  await new Promise((r) => setTimeout(r, 30)); // let onRequest fire
  cap.restore();
  return { event: event!, out: cap.main[0]?.body ?? '' };
}

const slab = (n: number) =>
  '# CLAUDE.md\nYou are a helpful coding assistant.\n' + 'Follow the rules carefully. '.repeat(Math.ceil(n / 28));

const grokBody = () =>
  JSON.stringify({
    model: 'grok-4.5',
    messages: [
      { role: 'system', content: slab(60_000) },
      { role: 'user', content: 'hello' },
    ],
  });

describe('proxy e2e: grok stays text-only until acked', () => {
  const prevModels = process.env.OMNIGLYPH_MODELS;
  const prevAck = process.env.OMNIGLYPH_UNVERIFIED_MODELS;

  beforeAll(() => {
    setAllowedModelBases(null);
    process.env.OMNIGLYPH_MODELS = 'grok-4.5';
  });

  afterAll(() => {
    setAllowedModelBases(null);
    if (prevModels === undefined) delete process.env.OMNIGLYPH_MODELS;
    else process.env.OMNIGLYPH_MODELS = prevModels;
    if (prevAck === undefined) delete process.env.OMNIGLYPH_UNVERIFIED_MODELS;
    else process.env.OMNIGLYPH_UNVERIFIED_MODELS = prevAck;
  });

  afterEach(() => { delete process.env.OMNIGLYPH_UNVERIFIED_MODELS; });

  it('without an ack: reason is model_unverified and no image_url is forwarded', async () => {
    delete process.env.OMNIGLYPH_UNVERIFIED_MODELS;
    const { event, out } = await driveAndCapture('/v1/chat/completions', grokBody());
    expect(event.info?.compressed).toBe(false);
    expect(event.info?.reason).toBe('model_unverified');
    expect(out).not.toContain('image_url');
  });

  it('with the ack set: grok compresses normally', async () => {
    process.env.OMNIGLYPH_UNVERIFIED_MODELS = 'grok-4.5';
    // FORCE (same idiom as cache-stability-e2e/design-behavior-e2e/refusal-retry):
    // this test isolates the ACK gate flow, not the profitability math (that's
    // covered by grok-billing.test.ts's evalOpenAIGate assertions). At the
    // realistic charsPerToken=4 default, Grok's dense 9x12 strip genuinely
    // costs more than plain prose text for this slab shape — see the
    // profitability-gate fix (2026-07-11): the gate now derives image cost
    // from the RESOLVED render geometry instead of the base 5x8 cell, so it
    // correctly prices Grok's wider/taller strip instead of under-costing it.
    const { event, out } = await driveAndCapture(
      '/v1/chat/completions',
      grokBody(),
      { charsPerToken: 1, minCompressChars: 1 },
    );
    expect(event.info?.compressed).toBe(true);
    expect(out).toContain('image_url');
  });
});
