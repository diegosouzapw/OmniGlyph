/**
 * Phase 4 of the dashboard redesign: real-time push over SSE.
 *
 * `GET /events/stream` gives the dashboard a live channel so the odometer
 * and timeline (tests/telemetry.test.ts) update the instant a request
 * lands, instead of waiting for the next htmx poll. It's a progressive
 * enhancement — every fragment still polls, so a host that can't do SSE
 * (or a client that disconnects) keeps working exactly as before.
 *
 * DashboardState.update() is the single ingestion point (see
 * tests/dashboard-api.test.ts for the same construction pattern); the
 * stream just taps it and broadcasts a small frame to every subscriber.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { DashboardState, dashboardPath } from '../src/dashboard.js';
import type { SessionsPaths } from '../src/sessions.js';

function makeTmp(): SessionsPaths {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-sse-'));
  return {
    eventsFile: path.join(dir, 'events.jsonl'),
    sidecarDir: path.join(dir, '4xx-bodies'),
  };
}

// Same shape dashboard-api.test.ts uses to poke DashboardState.update()
// directly with a minimal ProxyEvent-like object.
function antEvt(over: Record<string, unknown> = {}): unknown {
  return {
    method: 'POST',
    path: '/v1/messages',
    model: 'claude-opus-4',
    status: 200,
    durationMs: 42,
    usage: {
      input_tokens: 100,
      output_tokens: 50,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
    info: {
      compressed: true,
      firstUserSha8: 'ssesess',
      baselineProbeStatus: 'ok',
      baselineTokens: 500,
      baselineCacheableTokens: 500,
    },
    ...over,
  };
}

/** Read one SSE chunk off the stream and decode it as text. */
async function readFrame(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
  const { value, done } = await reader.read();
  if (done || !value) throw new Error('stream ended unexpectedly');
  return new TextDecoder().decode(value);
}

function parseSseData(frame: string): unknown {
  // Frames are `data: {...}\n\n`; strip the prefix and trailing blank line.
  const line = frame.split('\n').find((l) => l.startsWith('data: '));
  if (!line) throw new Error(`no data: line in frame: ${JSON.stringify(frame)}`);
  return JSON.parse(line.slice('data: '.length));
}

let tmp: SessionsPaths;
let dash: DashboardState;
beforeEach(() => {
  tmp = makeTmp();
  dash = new DashboardState(tmp, async () => new Map());
});
afterEach(() => {
  try {
    fs.rmSync(path.dirname(tmp.eventsFile), { recursive: true, force: true });
  } catch {
    /* leak the tmpdir; OS will reap */
  }
});

describe('dashboardPath("/events/stream")', () => {
  it('routes to the sse kind', () => {
    expect(dashboardPath('/events/stream')).toEqual({ kind: 'sse' });
  });
});

describe('serveEventsStream()', () => {
  it('returns an SSE response with the right headers', () => {
    const res = dash.serveEventsStream();
    expect(res.headers.get('content-type')).toBe('text/event-stream');
    expect(res.headers.get('cache-control')).toBe('no-cache');
    expect(res.body).not.toBeNull();
  });

  it('sends an initial frame immediately on connect, before any request', async () => {
    const res = dash.serveEventsStream();
    const reader = res.body!.getReader();
    const frame = await readFrame(reader);
    expect(frame.startsWith('data: ')).toBe(true);
    const parsed = parseSseData(frame) as { hello?: boolean; stats?: Record<string, unknown> };
    expect(parsed.hello).toBe(true);
    // Snapshot for the odometer — zero traffic, no NaN.
    expect(parsed.stats).toBeDefined();
    expect(parsed.stats!.requests).toBe(0);
    expect(parsed.stats!.saved_input_tokens).toBe(0);
    expect(JSON.stringify(parsed)).not.toContain('NaN');
    await reader.cancel();
  });

  it('broadcasts a frame with ts/status/compressed/model/saved/stats when update() fires', async () => {
    const res = dash.serveEventsStream();
    const reader = res.body!.getReader();
    await readFrame(reader); // initial hello frame

    dash.update(antEvt() as never);

    const frame = await readFrame(reader);
    const parsed = parseSseData(frame) as {
      ts: number;
      status: number;
      compressed: boolean;
      model?: string;
      saved: number | null;
      stats: { saved_input_tokens: number; saved_usd: number; requests: number };
    };
    expect(typeof parsed.ts).toBe('number');
    expect(parsed.status).toBe(200);
    expect(parsed.compressed).toBe(true);
    expect(parsed.model).toBe('claude-opus-4');
    // baselineTokens=500, cacheable=0, cr=0 → cold text baseline = 500*1.25 = 625;
    // actual = 100 (no cache create/read) → saved = 525.
    expect(parsed.saved).toBe(525);
    expect(parsed.stats.requests).toBe(1);
    expect(parsed.stats.saved_input_tokens).toBeGreaterThan(0);
    await reader.cancel();
  });

  it('reports saved: null when the row has no measured baseline', async () => {
    const res = dash.serveEventsStream();
    const reader = res.body!.getReader();
    await readFrame(reader);

    dash.update(
      antEvt({
        info: { compressed: false, firstUserSha8: 'ssesess2' },
      }) as never,
    );

    const frame = await readFrame(reader);
    const parsed = parseSseData(frame) as { saved: number | null };
    expect(parsed.saved).toBeNull();
    await reader.cancel();
  });

  it('cancel() removes the subscriber; a later update() does not throw', async () => {
    const res = dash.serveEventsStream();
    const reader = res.body!.getReader();
    await readFrame(reader);
    await reader.cancel();

    expect(() => dash.update(antEvt() as never)).not.toThrow();
  });

  it('cancelling one subscriber does not break broadcasts to a second', async () => {
    const res1 = dash.serveEventsStream();
    const reader1 = res1.body!.getReader();
    await readFrame(reader1);
    await reader1.cancel();

    const res2 = dash.serveEventsStream();
    const reader2 = res2.body!.getReader();
    await readFrame(reader2); // hello

    expect(() => dash.update(antEvt() as never)).not.toThrow();
    const frame = await readFrame(reader2);
    const parsed = parseSseData(frame) as { status: number };
    expect(parsed.status).toBe(200);
    await reader2.cancel();
  });
});
