/**
 * Phase 3 of the dashboard redesign: Overview becomes "Mission Control" — a
 * KPI card row, a savings sparkline embedded in the Savings % card, and a
 * live-ish event feed (htmx poll in this phase; SSE lands in Phase 4).
 *
 * Honesty rule (see tests/hero.test.ts for the precedent): the Savings %
 * card MUST use the cache-weighted pair (baseline_input_weighted vs
 * actual_input_weighted), never a raw count_tokens ratio, and a net loss
 * must render red (kpi-neg), never disguised as a win.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  renderKpisFragment,
  renderFeedFragment,
  renderSparkline,
  renderPage,
} from '../src/dashboard/fragments.js';
import { DashboardState } from '../src/dashboard.js';
import type {
  StatsPayload,
  RecentPayload,
  RecentRow,
  FullStatsSummary,
} from '../src/dashboard/types.js';

function stats(p: Partial<StatsPayload>): StatsPayload {
  return {
    requests: 0,
    compressed_requests: 0,
    passthrough: 0,
    baseline_input_weighted: 0,
    actual_input_weighted: 0,
    saved_usd: 0,
    measured_text_chars: 0,
    measured_thinking_chars: 0,
    measured_tool_use_chars: 0,
    ...p,
  } as StatsPayload;
}

function fullSummary(p: Partial<FullStatsSummary>): FullStatsSummary {
  return {
    total: 0,
    ok2xx: 0,
    err4xx: 0,
    err5xx: 0,
    compressed: 0,
    passthrough: 0,
    inputTokensTotal: 0,
    cacheCreateTokensTotal: 0,
    cacheReadTokensTotal: 0,
    outputTokensTotal: 0,
    cacheHitEvents: 0,
    eventsWithBaseline: 0,
    origCharsTotal: 0,
    imageBytesTotal: 0,
    durationP50: 0,
    durationP95: 0,
    firstByteP50: 0,
    firstByteP95: 0,
    ...p,
  };
}

function row(p: Partial<RecentRow>): RecentRow {
  return {
    ts: 0,
    method: 'POST',
    path: '/v1/messages',
    status: 200,
    compressed: true,
    ...p,
  };
}

function recentPayload(rows: RecentRow[]): RecentPayload {
  return { recent: rows, has_preview: false, preview_meta: '' };
}

// ---- renderKpisFragment ----------------------------------------------------

describe('renderKpisFragment', () => {
  it('renders exactly 8 kpi cards', () => {
    const html = renderKpisFragment(stats({}), null, recentPayload([]));
    const count = (html.match(/class="kpi-card/g) ?? []).length;
    expect(count).toBe(8);
  });

  it('Savings % is green (kpi-pos) on a cache-weighted win — 74% (7000 -> 1800)', () => {
    const html = renderKpisFragment(
      stats({ baseline_input_weighted: 7000, actual_input_weighted: 1800 }),
      null,
      recentPayload([]),
    );
    expect(html).toContain('74%');
    expect(html).toContain('kpi-pos');
    expect(html).not.toContain('kpi-neg');
  });

  it('Savings % flips to red (kpi-neg, not kpi-pos) on a net loss even though raw text looks like a win', () => {
    // Same trap as tests/hero.test.ts: cache-weighted baseline (1546) is below
    // what imaging actually sent (1863) — a loss, must render red.
    const html = renderKpisFragment(
      stats({ baseline_input_weighted: 1546, actual_input_weighted: 1863 }),
      null,
      recentPayload([]),
    );
    expect(html).toContain('kpi-neg');
    expect(html).not.toContain('kpi-pos');
  });

  it('shows an em-dash (not NaN) for latency/first-byte/errors when full stats are unavailable', () => {
    const html = renderKpisFragment(stats({}), null, recentPayload([]));
    expect(html).toContain('—');
    expect(html).not.toMatch(/NaN/);
    expect(html).not.toMatch(/Infinity/);
  });

  it('surfaces real latency p95 / first-byte p50 / cache-hit% / error counts when full stats exist', () => {
    const html = renderKpisFragment(
      stats({}),
      fullSummary({
        durationP95: 1234,
        firstByteP50: 210,
        total: 10,
        cacheHitEvents: 4,
        err4xx: 2,
        err5xx: 1,
      }),
      recentPayload([]),
    );
    expect(html).toContain('1.23s'); // durationP95 formatted
    expect(html).toContain('210ms'); // firstByteP50 formatted
    expect(html).toContain('40%'); // 4/10 cache hits
    expect(html).toContain('3'); // err4xx + err5xx
    expect(html).toContain('kpi-alert'); // errors > 0 highlighted red
    expect(html).not.toMatch(/NaN/);
  });

  it('never emits NaN/Infinity on zero traffic', () => {
    const html = renderKpisFragment(stats({}), null, recentPayload([]));
    expect(html).not.toMatch(/NaN/);
    expect(html).not.toMatch(/Infinity/);
  });

  it('embeds a sparkline in the Savings % card once there are 2+ recent rows', () => {
    const html = renderKpisFragment(
      stats({ baseline_input_weighted: 7000, actual_input_weighted: 1800 }),
      null,
      recentPayload([
        row({ ts: 1, baseline_input: 1000, actual_input: 400 }),
        row({ ts: 2, baseline_input: 2000, actual_input: 500 }),
      ]),
    );
    expect(html).toContain('<svg');
  });
});

// ---- renderFeedFragment -----------------------------------------------------

describe('renderFeedFragment', () => {
  it('lists the most recent request first', () => {
    const html = renderFeedFragment(
      recentPayload([
        row({ ts: 1000, model: 'claude-sonnet-5' }),
        row({ ts: 2000, model: 'claude-opus-4' }),
      ]),
    );
    expect(html.indexOf('claude-opus-4')).toBeLessThan(html.indexOf('claude-sonnet-5'));
  });

  it('shows saved tokens (baseline - actual) and feed-img on a compressed row', () => {
    const html = renderFeedFragment(
      recentPayload([row({ ts: 1, compressed: true, baseline_input: 1000, actual_input: 400 })]),
    );
    expect(html).toContain('feed-img');
    expect(html).toContain('600');
  });

  it('marks a passthrough row feed-txt', () => {
    const html = renderFeedFragment(recentPayload([row({ ts: 1, compressed: false })]));
    expect(html).toContain('feed-txt');
  });

  it('marks a >=400 status row feed-err', () => {
    const html = renderFeedFragment(recentPayload([row({ ts: 1, status: 500 })]));
    expect(html).toContain('feed-err');
  });

  it('shows "No traffic yet" for an empty feed', () => {
    const html = renderFeedFragment(recentPayload([]));
    expect(html).toContain('No traffic yet');
  });

  it('never emits NaN when baseline/actual are missing on a row', () => {
    const html = renderFeedFragment(recentPayload([row({ ts: 1, baseline_input: undefined, actual_input: undefined })]));
    expect(html).not.toMatch(/NaN/);
  });
});

// ---- renderSparkline ---------------------------------------------------------

describe('renderSparkline', () => {
  it('returns an empty string for 0 or 1 points', () => {
    expect(renderSparkline([])).toBe('');
    expect(renderSparkline([row({ baseline_input: 100, actual_input: 50 })])).toBe('');
  });

  it('renders an inline <svg> polyline for 2+ points', () => {
    const svg = renderSparkline([
      row({ baseline_input: 1000, actual_input: 400 }),
      row({ baseline_input: 2000, actual_input: 500 }),
    ]);
    expect(svg).toContain('<svg');
    expect(svg).not.toMatch(/NaN/);
  });

  it('never emits NaN when every delta is identical (zero range)', () => {
    const svg = renderSparkline([
      row({ baseline_input: 1000, actual_input: 1000 }),
      row({ baseline_input: 1000, actual_input: 1000 }),
    ]);
    expect(svg).not.toMatch(/NaN/);
  });

  it('skips rows with a missing baseline/actual pair rather than emitting NaN', () => {
    const svg = renderSparkline([
      row({ baseline_input: 1000, actual_input: 400 }),
      row({ baseline_input: undefined, actual_input: undefined }),
      row({ baseline_input: 2000, actual_input: 500 }),
    ]);
    expect(svg).not.toMatch(/NaN/);
  });
});

// ---- renderPage wiring -------------------------------------------------------

describe('renderPage() overview — mission control mounts', () => {
  it('mounts #frag-kpis and #frag-feed', () => {
    const html = renderPage(47821, 'overview');
    expect(html).toContain('id="frag-kpis"');
    expect(html).toContain('id="frag-feed"');
  });
});

// ---- DashboardState.serveFragment wiring -------------------------------------

function makeTmp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-missioncontrol-'));
  return {
    eventsFile: path.join(dir, 'events.jsonl'),
    sidecarDir: path.join(dir, '4xx-bodies'),
  };
}

describe('DashboardState.serveFragment — kpis / feed', () => {
  it('kpis fragment returns 200 with kpi-card html, even with no events file on disk', async () => {
    const tmp = makeTmp();
    const dash = new DashboardState(tmp, async () => new Map());
    const url = new URL('http://localhost/fragments/kpis');
    const res = await dash.serveFragment('kpis', url, 47821);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('kpi-card');
  });

  it('feed fragment returns 200 with feed- html', async () => {
    const tmp = makeTmp();
    const dash = new DashboardState(tmp, async () => new Map());
    const url = new URL('http://localhost/fragments/feed');
    const res = await dash.serveFragment('feed', url, 47821);
    expect(res.status).toBe(200);
    expect(await res.text()).toContain('feed-');
  });
});
