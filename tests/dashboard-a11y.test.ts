/**
 * Phase 6 of the dashboard redesign: accessibility + motion polish on top of
 * the markup shipped by Phases 1-5 (sidebar shell, Mission Control, SSE +
 * Telemetry, Benchmarks). Pure presentation — no functional/behavioral
 * change; every assertion here targets markup/CSS shape, never business
 * logic (that's covered by the other dashboard test files).
 */
import { describe, it, expect } from 'vitest';
import {
  renderPage,
  renderSparkline,
  renderOdometerFragment,
  renderTimelineFragment,
  renderRecentFragment,
  renderFlowFragment,
  renderBenchFragment,
  renderStatsTableFragment,
} from '../src/dashboard/fragments.js';
import type {
  StatsPayload,
  RecentPayload,
  RecentRow,
  FullStatsPayload,
} from '../src/dashboard/types.js';
import type { BenchFragmentData, BenchFragmentOpts } from '../src/dashboard/fragments.js';

// ---- fixtures --------------------------------------------------------------

function stats(p: Partial<StatsPayload>): StatsPayload {
  return {
    requests: 0,
    compressed_requests: 0,
    passthrough: 0,
    baseline_input_weighted: 0,
    actual_input_weighted: 0,
    saved_input_tokens: 0,
    saved_usd: 0,
    output_weighted: 0,
    measured_text_chars: 0,
    measured_thinking_chars: 0,
    measured_tool_use_chars: 0,
    compression_enabled: true,
    pricing_assumptions: { output_multiplier: 5 },
    ...p,
  } as StatsPayload;
}

function recentRows(rows: Partial<RecentRow>[]): RecentPayload {
  return {
    recent: rows.map((r) => ({ ts: 0, method: 'POST', path: '/v1/messages', status: 200, compressed: true, ...r })),
    has_preview: false,
    preview_meta: '',
  };
}

function sparklineRows(): RecentRow[] {
  return [
    { ts: 1, method: 'POST', path: '/v1/messages', status: 200, compressed: true, baseline_input: 100, actual_input: 40 },
    { ts: 2, method: 'POST', path: '/v1/messages', status: 200, compressed: true, baseline_input: 200, actual_input: 20 },
    { ts: 3, method: 'POST', path: '/v1/messages', status: 200, compressed: true, baseline_input: 150, actual_input: 60 },
  ];
}

function benchData(): BenchFragmentData {
  return {
    billingSweep: { totalProbes: 0, measuredProbes: 0, residualMax: 0, residualTotal: 0, models: [] },
    densityFrontier: { totalRows: 0, models: [] },
  };
}
function benchOpts(): BenchFragmentOpts {
  return { harnessAvailable: true, canLive: false, running: null };
}

function fullStatsPayload(): FullStatsPayload {
  return {
    parsed: 10,
    dropped: 0,
    summary: {
      total: 10,
      ok2xx: 10,
      err4xx: 0,
      err5xx: 0,
      compressed: 8,
      passthrough: 2,
      inputTokensTotal: 1000,
      cacheCreateTokensTotal: 100,
      cacheReadTokensTotal: 200,
      outputTokensTotal: 300,
      cacheHitEvents: 4,
      eventsWithBaseline: 8,
      origCharsTotal: 5000,
      imageBytesTotal: 2000,
      durationP50: 100,
      durationP95: 200,
      firstByteP50: 50,
      firstByteP95: 90,
    },
  };
}

// ---- 1. navigation / landmarks ---------------------------------------------

describe('a11y — navigation & landmarks', () => {
  const html = renderPage(47821, 'overview');

  it('declares the document language', () => {
    expect(html).toContain('<html lang="en">');
  });

  it('the sidebar nav is an accessible landmark', () => {
    expect(html).toMatch(/<nav class="sidebar" aria-label="[^"]+"/);
  });

  it('the active nav item is marked aria-current="page"', () => {
    expect(html).toMatch(/nav-active[^]*?aria-current="page"|aria-current="page"[^]*?nav-active/);
  });

  it('page content is wrapped in a <main> landmark', () => {
    expect(html).toMatch(/<main[^>]*class="main"/);
    expect(html).toContain('</main>');
  });

  it('has a skip-to-content link, before the sidebar, targeting <main>', () => {
    const skipIdx = html.indexOf('skip-link');
    const navIdx = html.indexOf('<nav class="sidebar"');
    expect(skipIdx).toBeGreaterThan(-1);
    expect(navIdx).toBeGreaterThan(-1);
    expect(skipIdx).toBeLessThan(navIdx);
    const hrefMatch = html.match(/class="skip-link" href="#([^"]+)"/);
    expect(hrefMatch).not.toBeNull();
    const targetId = hrefMatch![1];
    expect(html).toContain(`id="${targetId}"`);
    expect(html).toMatch(new RegExp(`<main[^>]*id="${targetId}"`));
  });

  it('skip link is visually hidden until focus (CSS uses off-screen positioning + :focus)', () => {
    expect(html).toMatch(/\.skip-link\s*\{[^}]*(position:\s*absolute|left:\s*-\d)/);
    expect(html).toMatch(/\.skip-link:focus\s*\{/);
  });
});

// ---- 2. icon-only buttons / hx-get pseudo-buttons --------------------------

describe('a11y — controls have accessible names / correct roles', () => {
  it('the theme toggle button has a real aria-label', () => {
    const html = renderPage(47821, 'overview');
    expect(html).toMatch(/id="theme-btn"[^>]*aria-label="[^"]+"/);
  });

  it('timeline "Details" hx-get pseudo-link exposes button behavior', () => {
    const html = renderTimelineFragment(recentRows([{ img_ids: [7] }]));
    expect(html).toMatch(/<a class="row-view"[^>]*role="button"[^>]*>Details/);
  });

  it('recent-table "Details" hx-get pseudo-link exposes button behavior', () => {
    const html = renderRecentFragment(recentRows([{ img_id: 3 }]));
    expect(html).toMatch(/<a class="row-view"[^>]*role="button"[^>]*>Details/);
  });

  it('toast dismiss control is a real button with an accessible name', () => {
    const html = renderPage(47821, 'overview');
    // NOTE: not `[^>]*` — the toast's Alpine @click handler contains `=>`,
    // whose `>` would truncate a naive "no closing bracket" match.
    expect(html).toMatch(/<button type="button"[^]*?aria-label="dismiss"[^]*?>/);
  });
});

// ---- 3. informative SVGs + live regions -------------------------------------

describe('a11y — informative SVGs and live regions', () => {
  it('the flow graph SVG is labeled for screen readers', () => {
    const html = renderFlowFragment(stats({ requests: 10, compressed_requests: 8, passthrough: 2 }));
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="[^"]+"/);
  });

  it('the sparkline SVG is labeled, not hidden', () => {
    const html = renderSparkline(sparklineRows());
    expect(html).toMatch(/<svg[^>]*role="img"[^>]*aria-label="[^"]+"/);
    expect(html).not.toContain('aria-hidden="true"');
  });

  it('the odometer announces SSE-pushed updates politely', () => {
    const html = renderOdometerFragment(stats({ saved_input_tokens: 100, saved_usd: 1, requests: 5 }));
    expect(html).toMatch(/class="odometer"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  });
});

// ---- 4. prefers-reduced-motion consolidation --------------------------------

describe('a11y — prefers-reduced-motion is a single consolidated block', () => {
  const html = renderPage(47821, 'overview');

  it('defines exactly one @media (prefers-reduced-motion: reduce) block', () => {
    const matches = html.match(/@media \(prefers-reduced-motion:\s*reduce\)/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it('that block neutralizes every animated class: odometer tick, timeline dot, flow edges, flow particle', () => {
    const block = html.match(/@media \(prefers-reduced-motion:\s*reduce\)\s*\{([^]*?)\n {2}\}/);
    expect(block).not.toBeNull();
    const body = block![1];
    expect(body).toContain('.od-tick');
    expect(body).toContain('.tl-dot');
    expect(body).toContain('.flow-view .fe.live');
    expect(body).toContain('.flow-particle');
  });
});

// ---- 5. focus-visible ---------------------------------------------------

describe('a11y — keyboard focus is visible', () => {
  const html = renderPage(47821, 'overview');

  it('defines a --focus-ring token', () => {
    expect(html).toMatch(/--focus-ring:\s*[^;]+;/);
  });

  it('applies :focus-visible to links and buttons using the ring token', () => {
    expect(html).toMatch(/a:focus-visible[^{]*\{[^}]*box-shadow:\s*var\(--focus-ring\)/);
    expect(html).toMatch(/button:focus-visible[^{]*\{[^}]*box-shadow:\s*var\(--focus-ring\)/);
  });
});

// ---- 6. contrast --------------------------------------------------------

// Minimal WCAG relative-luminance/contrast helpers — no new dependency, just
// enough math to guard the muted-text tokens against a future regression.
function hexToRgb(hex: string): [number, number, number] {
  const c = hex.replace('#', '');
  return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)];
}
function relLuminance([r, g, b]: [number, number, number]): number {
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}
function contrastRatio(hexA: string, hexB: string): number {
  const la = relLuminance(hexToRgb(hexA));
  const lb = relLuminance(hexToRgb(hexB));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
function blendOverBg(fg: [number, number, number], alpha: number, bgHex: string): [number, number, number] {
  const bg = hexToRgb(bgHex);
  return [0, 1, 2].map((i) => fg[i] * alpha + bg[i] * (1 - alpha)) as [number, number, number];
}

describe('a11y — muted-text contrast on the new surfaces (both themes)', () => {
  // Original light --muted (#71717a) cleared 4.5:1 on pure white (~4.83:1)
  // but NOT on --surface-2 (#f5f5fa, ~4.45:1) — the KPI/tile sub-labels and
  // hints that sit on --surface-2 were sub-AA. Darkened to #6c6c75 (barely
  // perceptible) to clear both surfaces with margin.
  it('light-theme --muted (#6c6c75) on --surface (#ffffff) clears 4.5:1', () => {
    expect(contrastRatio('#6c6c75', '#ffffff')).toBeGreaterThanOrEqual(4.5);
  });

  it('light-theme --muted (#6c6c75) on --surface-2 (#f5f5fa) clears 4.5:1', () => {
    expect(contrastRatio('#6c6c75', '#f5f5fa')).toBeGreaterThanOrEqual(4.5);
  });

  it('dark-theme --muted (#a1a1aa) on --surface (#161b22) clears 4.5:1', () => {
    expect(contrastRatio('#a1a1aa', '#161b22')).toBeGreaterThanOrEqual(4.5);
  });

  it('dark-theme --muted (#a1a1aa) on --surface-2 (#1c2230) clears 4.5:1', () => {
    expect(contrastRatio('#a1a1aa', '#1c2230')).toBeGreaterThanOrEqual(4.5);
  });

  it('sidebar nav-item text (rgba(255,255,255,.68) on --color-sidebar #10141e) clears 4.5:1 in both themes', () => {
    const blended = blendOverBg([255, 255, 255], 0.68, '#10141e');
    const blendedHex =
      '#' + blended.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
    expect(contrastRatio(blendedHex, '#10141e')).toBeGreaterThanOrEqual(4.5);
  });

  it('the rendered light --muted token is the darkened, AA-passing value', () => {
    const html = renderPage(47821, 'overview');
    expect(html).toContain('--muted: #6c6c75');
  });
});

// ---- 7. tables + list semantics -------------------------------------------

describe('a11y — tables use scoped headers', () => {
  it('the recent-requests table (rtable) marks every column header', () => {
    const html = renderRecentFragment(recentRows([{}]));
    const headers = html.match(/<th\b[^>]*>/g) ?? [];
    expect(headers.length).toBeGreaterThan(0);
    for (const th of headers) expect(th).toContain('scope="col"');
  });

  it('the benchmarks billing-sweep table marks every column header', () => {
    const data = benchData();
    data.billingSweep.models = [{ model: 'claude-fable-5', probes: 3, measured: 3, residualMax: 1, residualTotal: 2 }];
    const html = renderBenchFragment(data, benchOpts());
    const headers = html.match(/<th\b[^>]*>/g) ?? [];
    expect(headers.length).toBeGreaterThan(0);
    for (const th of headers) expect(th).toContain('scope="col"');
  });

  it('the full-history key/value table (dtable) uses row headers, not bare <td> labels', () => {
    const html = renderStatsTableFragment(fullStatsPayload());
    expect(html).toContain('<th scope="row">requests</th>');
    expect(html).not.toMatch(/<td>requests<\/td>/);
  });
});

describe('a11y — timeline uses list semantics', () => {
  it('renders as a <ul>/<li> list, not bare <div>s, when there are rows', () => {
    const html = renderTimelineFragment(recentRows([{ model: 'claude-fable-5' }]));
    expect(html).toMatch(/<ul class="timeline">/);
    expect(html).toMatch(/<li class="tl-row">/);
  });
});
