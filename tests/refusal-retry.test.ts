/**
 * Retry-on-refusal (H11): when a TRANSFORMED request gets a classifier
 * refusal (stop_reason:"refusal" with empty content — we measured ~50%
 * incidence on transcription batches, stochastic per call), the proxy
 * re-sends the ORIGINAL body (no images) ONCE and serves that response.
 * Fail-open: if the retry fails, the original refusal is delivered. Normal
 * responses do not pay the cost: the sniffer releases the stream at the
 * first content_block_delta.
 */
import { describe, expect, it } from 'vitest';
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

const DENSE = `${'X'.repeat(500)}\n${Array.from({ length: 300 }, (_, i) => `const row_${i} = fn(${i});`).join('\n')}`;
const BIG_BODY = JSON.stringify({
  model: 'claude-fable-5',
  max_tokens: 128,
  system: DENSE,
  messages: [{ role: 'user', content: [{ type: 'text', text: 'oi' }] }],
});

const REFUSAL_JSON = JSON.stringify({
  id: 'msg_r', type: 'message', role: 'assistant', content: [],
  stop_reason: 'refusal',
  usage: { input_tokens: 10, output_tokens: 1 },
});
const OK_JSON = JSON.stringify({
  id: 'msg_ok', type: 'message', role: 'assistant',
  content: [{ type: 'text', text: 'resposta normal' }],
  stop_reason: 'end_turn',
  usage: { input_tokens: 10, output_tokens: 5 },
});

const REFUSAL_SSE = [
  'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":10}}}\n\n',
  'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"refusal"},"usage":{"output_tokens":1}}\n\n',
  'event: message_stop\ndata: {"type":"message_stop"}\n\n',
].join('');
const OK_SSE = [
  'event: message_start\ndata: {"type":"message_start","message":{"usage":{"input_tokens":10}}}\n\n',
  'event: content_block_start\ndata: {"type":"content_block_start","index":0,"content_block":{"type":"text","text":""}}\n\n',
  'event: content_block_delta\ndata: {"type":"content_block_delta","index":0,"delta":{"type":"text_delta","text":"resposta"}}\n\n',
  'event: message_delta\ndata: {"type":"message_delta","delta":{"stop_reason":"end_turn"},"usage":{"output_tokens":5}}\n\n',
  'event: message_stop\ndata: {"type":"message_stop"}\n\n',
].join('');

function sse(body: string): Response {
  return new Response(body, { status: 200, headers: { 'content-type': 'text/event-stream' } });
}

async function post(proxy: (r: Request) => Promise<Response>, body = BIG_BODY): Promise<Response> {
  return proxy(new Request('http://localhost/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body,
  }));
}

describe('retry-on-refusal', () => {
  it('JSON: refusal on the transformed body → retry with the original, client receives the success', async () => {
    const messageBodies: string[] = [];
    const restore = mockUpstream(async (req) => {
      if (req.url.includes('/count_tokens')) return new Response('{"input_tokens":1}', { status: 200 });
      const body = await req.text();
      messageBodies.push(body);
      return body.includes('"type":"image"')
        ? new Response(REFUSAL_JSON, { status: 200, headers: { 'content-type': 'application/json' } })
        : new Response(OK_JSON, { status: 200, headers: { 'content-type': 'application/json' } });
    });
    let captured: ProxyEvent | undefined;
    const proxy = createProxy({
      transform: { minCompressChars: 1, charsPerToken: 1 },
      onRequest: (e) => { captured = e; },
    });
    const res = await post(proxy);
    const out = await res.json() as { stop_reason: string };
    await new Promise((r) => setTimeout(r, 30));
    restore();

    expect(out.stop_reason).toBe('end_turn');
    expect(messageBodies).toHaveLength(2);
    expect(messageBodies[0]).toContain('"type":"image"');
    expect(messageBodies[1]).not.toContain('"type":"image"');
    expect(captured?.info?.refusalRetried).toBe(true);
  });

  it('SSE: refusal in stream → retry, client receives the success stream', async () => {
    let messageCalls = 0;
    const restore = mockUpstream(async (req) => {
      if (req.url.includes('/count_tokens')) return new Response('{"input_tokens":1}', { status: 200 });
      const body = await req.text();
      messageCalls++;
      return body.includes('"type":"image"') ? sse(REFUSAL_SSE) : sse(OK_SSE);
    });
    const proxy = createProxy({ transform: { minCompressChars: 1, charsPerToken: 1 } });
    const res = await post(proxy);
    const text = await res.text();
    restore();

    expect(messageCalls).toBe(2);
    expect(text).toContain('content_block_delta');
    expect(text).not.toContain('"refusal"');
  });

  it('normal SSE: no retry — 1 call, stream passes through intact', async () => {
    let messageCalls = 0;
    const restore = mockUpstream(async (req) => {
      if (req.url.includes('/count_tokens')) return new Response('{"input_tokens":1}', { status: 200 });
      await req.text();
      messageCalls++;
      return sse(OK_SSE);
    });
    let captured: ProxyEvent | undefined;
    const proxy = createProxy({
      transform: { minCompressChars: 1, charsPerToken: 1 },
      onRequest: (e) => { captured = e; },
    });
    const res = await post(proxy);
    const text = await res.text();
    await new Promise((r) => setTimeout(r, 30));
    restore();

    expect(messageCalls).toBe(1);
    expect(text).toContain('resposta');
    expect(captured?.info?.refusalRetried).toBeUndefined();
  });

  it('retryRefusalWithOriginal:false → refusal passes to the client without retry', async () => {
    let messageCalls = 0;
    const restore = mockUpstream(async (req) => {
      if (req.url.includes('/count_tokens')) return new Response('{"input_tokens":1}', { status: 200 });
      await req.text();
      messageCalls++;
      return new Response(REFUSAL_JSON, { status: 200, headers: { 'content-type': 'application/json' } });
    });
    const proxy = createProxy({
      transform: { minCompressChars: 1, charsPerToken: 1 },
      retryRefusalWithOriginal: false,
    });
    const res = await post(proxy);
    const out = await res.json() as { stop_reason: string };
    restore();

    expect(messageCalls).toBe(1);
    expect(out.stop_reason).toBe('refusal');
  });
});
