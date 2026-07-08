/**
 * Phase 4 of the dashboard redesign: the Telemetry page grows an odometer
 * (headline counters that tick on SSE — tests/sse-stream.test.ts) and a
 * timeline (replaces the flat "recent requests" table with newest-first
 * rows carrying a per-gate marker). The x-ray trio (context-map + latest)
 * stays; #frag-recent's mount leaves the page (the timeline replaces it),
 * but the fragment/route itself is untouched — other pages/tests still use
 * renderRecentFragment directly.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  renderOdometerFragment,
  renderTimelineFragment,
  renderPage,
} from '../src/dashboard/fragments.js';
import { DashboardState } from '../src/dashboard.js';
import type { SessionsPaths } from '../src/sessions.js';
import type { StatsPayload, RecentPayload } from '../src/dashboard/types.js';

function stats(p: Partial<StatsPayload>): StatsPayload {
  return {
    requests: 0,
    saved_input_tokens: 0,
    saved_usd: 0,
    ...p,
  } as StatsPayload;
}

// ---- renderOdometerFragment ------------------------------------------------

describe('renderOdometerFragment', () => {
  it('renders the odometer with stable ids for the SSE client to target', () => {
    const html = renderOdometerFragment(stats({ saved_input_tokens: 12345, saved_usd: 3.4, requests: 7 }));
    expect(html).toContain('odometer');
    expect(html).toContain('id="od-tokens"');
    expect(html).toContain('id="od-usd"');
    expect(html).toContain('id="od-reqs"');
    expect(html).toContain('12.3k'); // kFmt(12345)
    expect(html).toContain('$3.40');
    expect(html).toContain('7');
  });

  it('zero traffic renders 0s, never NaN or Infinity', () => {
    const html = renderOdometerFragment(stats({ saved_input_tokens: 0, saved_usd: 0, requests: 0 }));
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    expect(html).toContain('$0.00');
  });

  it('tolerates a missing saved_usd/saved_input_tokens without NaN', () => {
    const html = renderOdometerFragment(stats({}));
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });
});

// ---- renderTimelineFragment -------------------------------------------------

function recent(rows: RecentPayload['recent']): RecentPayload {
  return { recent: rows, has_preview: false, preview_meta: '' };
}

describe('renderTimelineFragment', () => {
  it('shows the empty state with no traffic', () => {
    const html = renderTimelineFragment(recent([]));
    expect(html).toContain('No traffic yet');
  });

  it('orders rows most-recent-first', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 1000, method: 'POST', path: '/v1/messages', status: 200, compressed: true, model: 'first' },
        { ts: 2000, method: 'POST', path: '/v1/messages', status: 200, compressed: true, model: 'second' },
      ]),
    );
    expect(html.indexOf('second')).toBeLessThan(html.indexOf('first'));
  });

  it('renders time as HH:MM:SS, an imaged gate marker, tokens saved, and a Details link', () => {
    const html = renderTimelineFragment(
      recent([
        {
          ts: Date.UTC(2026, 0, 1, 13, 5, 9) / 1000,
          method: 'POST',
          path: '/v1/messages',
          status: 200,
          model: 'claude-opus-4-20260514',
          compressed: true,
          session_saved_so_far_delta: 4200,
          img_ids: [7],
        },
      ]),
    );
    expect(html).toContain('tl-row');
    expect(html).toContain('13:05:09');
    expect(html).toContain('tl-gate');
    expect(html).toContain('✓ imaged');
    expect(html).toContain('+4,200');
    expect(html).toContain('hx-get="/fragments/context-map?req=7"');
    expect(html).toContain('hx-target="#frag-context-map"');
  });

  it('marks a passthrough row with the passthrough marker, not imaged', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 0, method: 'POST', path: '/v1/messages', status: 200, compressed: false },
      ]),
    );
    expect(html).toContain('○ passthrough');
    expect(html).not.toContain('✓ imaged');
  });

  it('shows an em-dash for tokens when no baseline was measured, never NaN', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 0, method: 'POST', path: '/v1/messages', status: 200, compressed: false },
      ]),
    );
    expect(html).not.toContain('NaN');
    expect(html).toContain('—');
  });

  it('flags a 4xx/5xx row with the tl-err class', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 0, method: 'POST', path: '/v1/messages', status: 429, compressed: false },
      ]),
    );
    expect(html).toContain('tl-err');
  });

  it('does not flag a 2xx row with tl-err', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 0, method: 'POST', path: '/v1/messages', status: 200, compressed: true },
      ]),
    );
    expect(html).not.toContain('tl-err');
  });

  it('a request with no image id renders a plain dash instead of a Details link', () => {
    const html = renderTimelineFragment(
      recent([
        { ts: 0, method: 'POST', path: '/v1/messages', status: 200, compressed: false },
      ]),
    );
    expect(html).not.toContain('hx-get="/fragments/context-map?req=');
  });
});

// ---- renderPage('telemetry') wiring ----------------------------------------

describe("renderPage(47821, 'telemetry')", () => {
  const html = renderPage(47821, 'telemetry');

  it('mounts the odometer and the timeline', () => {
    expect(html).toContain('id="frag-odometer"');
    expect(html).toContain('id="frag-timeline"');
  });

  it('keeps the x-ray pair: context-map and latest', () => {
    expect(html).toContain('id="frag-context-map"');
    expect(html).toContain('id="frag-latest"');
  });

  it('no longer mounts #frag-recent — the timeline replaces it', () => {
    expect(html).not.toContain('id="frag-recent"');
  });
});

// ---- serveFragment('odometer' | 'timeline') --------------------------------

describe('serveFragment odometer/timeline', () => {
  let tmp: SessionsPaths;
  let dash: DashboardState;
  beforeEach(() => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-telemetry-'));
    tmp = {
      eventsFile: path.join(dir, 'events.jsonl'),
      sidecarDir: path.join(dir, '4xx-bodies'),
    };
    dash = new DashboardState(tmp, async () => new Map());
  });
  afterEach(() => {
    try {
      fs.rmSync(path.dirname(tmp.eventsFile), { recursive: true, force: true });
    } catch {
      /* leak the tmpdir; OS will reap */
    }
  });

  it('serveFragment("odometer") returns 200 with the odometer markup', async () => {
    const res = await dash.serveFragment('odometer', new URL('http://x/fragments/odometer'), 47821);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('odometer');
    expect(body).toContain('id="od-tokens"');
  });

  it('serveFragment("timeline") returns 200 with the empty state on no traffic', async () => {
    const res = await dash.serveFragment('timeline', new URL('http://x/fragments/timeline'), 47821);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toContain('No traffic yet');
  });

  it('serveFragment("timeline") reflects a live update()', async () => {
    dash.update({
      method: 'POST',
      path: '/v1/messages',
      model: 'claude-opus-4',
      status: 200,
      durationMs: 10,
      usage: { input_tokens: 100, output_tokens: 10, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
      info: { compressed: true, firstUserSha8: 'telsess' },
    } as never);
    const res = await dash.serveFragment('timeline', new URL('http://x/fragments/timeline'), 47821);
    const body = await res.text();
    expect(body).toContain('tl-row');
    expect(body).toContain('claude-opus-4');
  });
});
