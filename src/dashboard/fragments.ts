// Server-rendered HTML dashboard — htmx polls fragments, Alpine drives the toast tray.
// Presentation only; server code (src/dashboard.ts, src/node.ts) needs no edits.

import { HTMX_JS, ALPINE_JS } from './vendor.js';
import { CACHE_CREATE_RATE, CACHE_READ_RATE } from '../core/baseline.js';
import type {
  StatsPayload,
  RecentPayload,
  RecentRow,
  SessionsPayload,
  SessionRow,
  FullStatsPayload,
  FullStatsSummary,
} from './types.js';
import type {
  BillingSweepAggregate,
  DensityFrontierAggregate,
  BenchRunnerState,
} from './bench.js';

// ---- helpers --------------------------------------------------------

export function escapeHtml(s: string | null | undefined): string {
  if (s == null) return '';
  return String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}

function numFmt(n: number | null | undefined): string {
  const v = Math.round(Number(n) || 0);
  return v.toLocaleString('en-US');
}

/** "12.3k" / "1.2M" compact formatter for headline numbers. */
function kFmt(n: number | null | undefined): string {
  const v = Number(n) || 0;
  const a = Math.abs(v);
  if (a >= 1_000_000) return (v / 1_000_000).toFixed(a >= 10_000_000 ? 0 : 1) + 'M';
  if (a >= 1000) return (v / 1000).toFixed(a >= 100_000 ? 0 : 1) + 'k';
  return String(Math.round(v));
}

function formatDuration(s: number): string {
  s = Math.floor(s);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (h ? h + 'h ' : '') + (m || h ? m + 'm ' : '') + sec + 's';
}

/** "1234" -> "1.23s"; "210" -> "210ms". Em-dash for missing/non-finite —
 *  callers use this to keep the Mission Control KPI cards NaN-free when the
 *  events file (full stats) isn't available yet. */
function fmtMs(ms: number | null | undefined): string {
  if (ms == null || !Number.isFinite(ms)) return '—';
  if (ms >= 1000) return (ms / 1000).toFixed(ms >= 10_000 ? 1 : 2) + 's';
  return Math.round(ms) + 'ms';
}

function shortPath(p: string | null | undefined): string {
  if (!p) return '-';
  const parts = String(p).split('/');
  return parts[parts.length - 1] || p;
}

// ---- compression toggle (kill switch) ------------------------------------

export function renderToggleFragment(enabled: boolean): string {
  // NOTE: "PASSTHROUGH MODE", "Disable compression", "Enable compression" are asserted by tests.
  const banner = enabled
    ? ''
    : `<div class="banner"><strong>PASSTHROUGH MODE</strong> — compression is off. Every request goes to Claude unchanged: no images, no savings. Use this to A/B test, or if the upstream API is having problems.</div>`;
  // Button POSTs the OPPOSITE of current state; 2s poll keeps it fresh.
  const confirm = enabled
    ? ` hx-confirm="Turn compression off?\n\nRequests will pass straight through to Claude, unchanged. Restarting the proxy turns it back on."`
    : '';
  return (
    banner +
    `<div class="switch">` +
    `<span class="switch-state ${enabled ? 'on' : 'off'}"><span class="switch-dot"></span>${enabled ? 'Compression on' : 'Compression off'}</span>` +
    `<button class="switch-btn" type="button" hx-post="/fragments/toggle" hx-target="#frag-toggle" hx-vals='{"enabled": ${!enabled}}'${confirm}>` +
    (enabled ? 'Disable compression' : 'Enable compression') +
    `</button>` +
    `<span class="hint">kill switch · resets to on when you restart</span>` +
    `</div>`
  );
}

// ---- compress scope (which models get imaged) ----------------------------

/** Chip catalog — UNION with env scope + active set, so env-var models stay toggleable. Labels are cosmetic. */
const MODEL_CATALOG: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'claude-fable-5', label: 'Fable 5' },
  { id: 'claude-opus-4-8', label: 'Opus 4.8' },
  { id: 'claude-opus-4-7', label: 'Opus 4.7' },
  { id: 'claude-sonnet-5', label: 'Sonnet 5' },
  { id: 'claude-sonnet-4-6', label: 'Sonnet 4.6' },
];

const GPT_MODEL_CATALOG: ReadonlyArray<{ id: string; label: string }> = [
  { id: 'gpt-5.6', label: 'GPT 5.6' },
  { id: 'gpt-5.5', label: 'GPT 5.5' },
];

export function renderModelsFragment(
  active: string[],
  configured: string[],
  enabled: boolean,
): string {
  const on = new Set(active);
  const labelOf = new Map(
    [...MODEL_CATALOG, ...GPT_MODEL_CATALOG].map((m) => [m.id, m.label]),
  );
  // Union the catalog with env-configured + active ids so OMNIGLYPH_MODELS-enabled
  // families always show as toggles, then split by family for the two sections.
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const id of [
    ...MODEL_CATALOG.map((m) => m.id),
    ...GPT_MODEL_CATALOG.map((m) => m.id),
    ...configured,
    ...active,
  ]) {
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  }
  const chipFor = (id: string): string => {
    const lit = on.has(id);
    const label = labelOf.get(id) ?? id;
    return (
      `<button class="chip${lit ? ' on' : ''}" type="button" ` +
      `hx-post="/fragments/models" hx-target="#frag-models" ` +
      `hx-vals='${escapeHtml(`{"model":${JSON.stringify(id)},"on":${!lit}}`)}'>${escapeHtml(label)}${lit ? ' ✓' : ''}</button>`
    );
  };
  const claudeChips = ids.filter((id) => !id.startsWith('gpt')).map(chipFor).join('');
  const gptChips = ids.filter((id) => id.startsWith('gpt')).map(chipFor).join('');
  const moot = enabled ? '' : ` <span class="hint">compression is off, so this has no effect right now</span>`;
  return (
    `<div class="models">` +
    `<span class="models-label">Image Claude models</span>` +
    claudeChips +
    `<span class="hint">everything else is sent as normal text · runtime only · persist with OMNIGLYPH_MODELS</span>${moot}` +
    `</div>` +
    `<div class="models" style="display:none">` +
    `<span class="models-label">Image GPT models</span>` +
    gptChips +
    `<span class="hint">imaging only, no Anthropic cache_control · one scope for all families · set OMNIGLYPH_MODELS (CSV of bases, or off) to persist</span>${moot}` +
    `</div>`
  );
}

// ---- session hero --------------------------------------------------------

// Must stay in lockstep with ASSUMED_INPUT_USD_PER_MTOK in src/dashboard.ts.
const INPUT_USD_PER_MTOK = 10.0;
void INPUT_USD_PER_MTOK; // suppress unused-var; renderHeaderFragment uses the server's pricing block.

// Lifetime hero. Reads the SAME cumulative weighted totals as the header strip
// (serveStats), so the headline and the "$ saved" tiles can never disagree, and
// the number stops swinging on tiny per-session samples. Cache-weighted on
// purpose ("lifeweight"): it answers "did OmniGlyph move my real, cache-discounted
// bill since this proxy started", not a raw token count.
export function renderSessionSummaryFragment(s: StatsPayload): string {
  const measured = s.compressed_requests ?? 0;
  if (measured <= 0) {
    return (
      `<div class="hero hero-empty">` +
      `<div class="hero-eyebrow">Since start</div>` +
      `<div class="hero-headline">Warming up…</div>` +
      `<div class="hero-sub">Point Claude Code at this proxy and send a message. The moment a request flows through, your running savings show up right here.</div>` +
      `</div>`
    );
  }
  // Cache-aware reduction — same basis as the Details panel + Saved column.
  // Raw count_tokens would over-claim: most of the text baseline would have been
  // cheap cache-reads (~0.1×), not full-price tokens. Weighting both sides at their
  // real cache rate is the only comparison that can't contradict the Saved column.
  // Input-only: OmniGlyph never touches output, so lumping it in just dampened the %.
  const baselineW = s.baseline_input_weighted ?? 0; // same context as text, cache-aware
  const actualW = s.actual_input_weighted ?? 0; // what we actually sent, cache-aware
  const outMult = s.pricing_assumptions?.output_multiplier || 5;
  const rawOutput = (s.output_weighted ?? 0) / outMult; // reply — never compressed
  const inputPct = baselineW > 0 ? (1 - actualW / baselineW) * 100 : 0;
  const positive = inputPct >= 0;
  const bigNum = `${Math.abs(inputPct).toFixed(0)}%`;
  const word = positive ? 'fewer tokens' : 'more tokens';

  return (
    `<div class="hero${positive ? '' : ' hero-neg'}">` +
    `<div class="hero-eyebrow">Since start · ${numFmt(measured)} request${measured === 1 ? '' : 's'} imaged</div>` +
    `<div class="hero-headline"><span class="hero-num">${bigNum}</span> ${word} after caching</div>` +
    `<div class="hero-sub">` +
    `<strong>${kFmt(actualW)}</strong> effective tokens vs <strong>${kFmt(baselineW)}</strong> if this same context ` +
    `stayed plain text — both counted after normal cache discounts since this proxy started. ` +
    `Your latest messages and Claude's live output are never compressed.` +
    `</div>` +
    `<div class="hero-meta">` +
    `Cache-aware — cached reads counted at their real ~0.1× weight, not full price · ` +
    `output untouched (${kFmt(rawOutput)}) · no $ assumptions` +
    `</div>` +
    `</div>`
  );
}

// ---- stat strip + "Show the math" drawer ----------------------------------

function mathRow(key: string, val: number | string | undefined, note = ''): string {
  const v = typeof val === 'number' ? numFmt(val) : String(val ?? '-');
  return `<div><span class="k">${key}:</span> <span class="v">${escapeHtml(v)}</span> <span class="k">${note}</span></div>`;
}

function mathBlock(title: string, body: string): string {
  return `<section class="math-block"><h4>${title}</h4><div class="formula">${body}</div></section>`;
}

/** Stat tile; `tip` adds a hover "?" explainer. */
function statTile(
  label: string,
  value: string,
  sub: string,
  cls = '',
  tip = '',
): string {
  const t = tip ? ` title="${escapeHtml(tip)}"` : '';
  const q = tip ? `<span class="q">?</span>` : '';
  return (
    `<div class="tile"${t}>` +
    `<div class="tile-label">${label}${q}</div>` +
    `<div class="tile-value ${cls}">${value}</div>` +
    `<div class="tile-sub">${sub}</div>` +
    `</div>`
  );
}

export function renderHeaderFragment(s: StatsPayload, port: number): string {
  const pa = s.pricing_assumptions;

  // stat strip
  const splitReady = s.split_sufficient_sample;
  const cAvg = s.compressed_avg_usd_per_request ?? 0;
  const pAvg = s.passthrough_avg_usd_per_request ?? 0;
  const costTile = splitReady
    ? statTile(
        'Cost per request',
        `$${cAvg.toFixed(4)}`,
        `vs $${pAvg.toFixed(4)} without OmniGlyph`,
        cAvg <= pAvg ? 'pos' : 'neg',
        'Average real cost of a request with imaging on vs off (passthrough), measured on your own traffic.',
      )
    : statTile(
        'Cost per request',
        'collecting…',
        `${numFmt(s.compressed_paid_requests)} imaged · ${numFmt(s.passthrough_paid_requests)} passthrough so far`,
        'muted-val',
        `Needs at least ${s.split_min_sample_per_bucket} paid requests on each path before the comparison is trustworthy.`,
      );

  const strip =
    `<div class="strip">` +
    statTile('Requests', numFmt(s.requests), `${numFmt(s.compressed_requests)} turned into images`) +
    statTile(
      'Input tokens saved',
      numFmt(s.saved_input_tokens),
      'vs sending the same context as text',
      'pos',
      'Bulky context (system prompt, tool output, old turns) sent as compact images instead of text. Cache-aware, input side only — recent turns and the live output stay text.',
    ) +
    statTile(
      'Estimated saved',
      `$${(s.saved_usd ?? 0).toFixed(2)}`,
      `at $${pa.input_per_mtok}/M input tokens`,
      '',
      'A rough dollar figure: saved tokens × the input price. Actual savings depend on your plan and caching — see the math drawer.',
    ) +
    costTile +
    `</div>`;

  // math drawer
  const savedMath =
    `<div><span class="k">formula:</span> <span class="v">saved = baseline − actual</span></div>` +
    `<div><span class="k">weights:</span> <span class="v">input×1.0, cache_create×1.25, cache_read×0.10</span></div>` +
    `<div class="sp"></div>` +
    mathRow('baseline', s.baseline_input_weighted, '(cache-aware: cacheable×weight + cold_tail)') +
    mathRow('actual', s.actual_input_weighted, '(input + cc×1.25 + cr×0.10 from usage)') +
    mathRow('saved', s.saved_input_tokens, `<span class="op">=</span> baseline − actual`) +
    `<span class="src">output excluded — identical with/without compression</span>`;

  const usdMath =
    `<div><span class="k">formula:</span> <span class="v">$ saved = saved_tokens × $${pa.input_per_mtok}/Mtok</span></div>` +
    `<div class="sp"></div>` +
    mathRow('saved_tokens', s.saved_input_tokens, '(cache-aware, input-side)') +
    mathRow('saved_usd', `$${(s.saved_usd || 0).toFixed(4)} `, `<span class="op">=</span> saved_tokens × input_rate / 1e6`) +
    `<span class="src">source: ${escapeHtml(pa.source || 'docs.anthropic.com pricing')}</span>`;

  const splitMath =
    `<div><span class="k">formula:</span> <span class="v">bucket_$ = (Σ actual_input + Σ output × ${pa.output_multiplier}) × $${pa.input_per_mtok}/Mtok</span></div>` +
    `<div><span class="k">why:</span> <span class="v">partition the paid-rows set by which path actually ran (compressed vs passthrough). Same $/Mtok on both sides so the rate assumption cancels in the delta. Selection bias (the gate routes each turn) does NOT cancel — read with the sample counts.</span></div>` +
    `<div class="sp"></div>` +
    mathRow(`compressed (n=${s.compressed_paid_requests})`, `$${(s.compressed_actual_usd || 0).toFixed(4)}`, `total · avg $${(s.compressed_avg_usd_per_request || 0).toFixed(4)}/req`) +
    mathRow(`passthrough (n=${s.passthrough_paid_requests})`, `$${(s.passthrough_actual_usd || 0).toFixed(4)}`, `total · avg $${(s.passthrough_avg_usd_per_request || 0).toFixed(4)}/req`) +
    mathRow(
      'compressed − passthrough',
      `$${(s.compressed_minus_passthrough_avg_usd || 0).toFixed(4)}/req`,
      s.split_sufficient_sample
        ? `(both buckets ≥ ${s.split_min_sample_per_bucket} — delta is meaningful)`
        : `(small sample: need ≥ ${s.split_min_sample_per_bucket} per bucket; treat as noisy)`,
    ) +
    `<span class="src">no counterfactual, no probe gate — pure observed $/req on each path</span>`;

  const pctMath =
    `<div><span class="k">formula:</span> <span class="v">share_of_spend = saved / (all_baseline_equivalent + all_output × ${pa.output_multiplier})</span></div>` +
    `<div><span class="k">diagnostic, not the headline:</span> <span class="v">this is a counterfactual ("what you WOULD have paid"). It leans on the count_tokens probe, the cache-aware split, and an input-rate assumption. Useful as a sanity check; the real-traffic answer is the compressed-vs-passthrough split above.</span></div>` +
    `<div class="sp"></div>` +
    mathRow('saved', s.saved_input_tokens, '(measured-rows numerator; cache-aware)') +
    mathRow('all_baseline_equivalent', s.all_baseline_equivalent_weighted, '(every paid request; baseline on measured + actual on the rest)') +
    mathRow(`all_output × ${pa.output_multiplier}`, s.all_output_weighted, '(every paid request)') +
    mathRow('share_of_spend', (s.saved_pct_of_all_spend || 0).toFixed(1) + '%', `<span class="op">=</span> saved / counterfactual_total × 100`) +
    mathRow('all_usage_requests', s.all_usage_requests, '(denominator request count — compressed + passthrough + probe-failed)') +
    `<span class="src">measured numerator, all-rows counterfactual denominator — bounded at 100%</span>`;

  const tokeqMath =
    `<div><span class="k">formula:</span> <span class="v">token_equivalent = input + output × ${pa.output_multiplier}</span></div>` +
    `<div><span class="k">why:</span> <span class="v">matches Anthropic's per-Mtok price ratio ($${pa.input_per_mtok} input vs $${pa.input_per_mtok * pa.output_multiplier} output) — this is what the weekly-limit meter counts.</span></div>` +
    `<div class="sp"></div>` +
    mathRow('actual_token_equivalent', s.actual_token_equivalent) +
    mathRow('baseline_token_equivalent', s.baseline_token_equivalent, `(unproxied counterfactual, same ×${pa.output_multiplier} on output)`) +
    `<div class="sp"></div>` +
    mathRow('events_with_measurement', s.events_with_measurement, '(events where the SSE/JSON scanner produced char counts)') +
    mathRow('measured_text_chars', s.measured_text_chars, '') +
    mathRow('measured_thinking_chars', s.measured_thinking_chars, '') +
    mathRow('measured_tool_use_chars', s.measured_tool_use_chars, '') +
    mathRow('measured_redacted_blocks', s.measured_redacted_block_count, '(opaque encrypted blocks — billed but unmeasurable)') +
    `<span class="src">measured — no estimation</span>`;

  const drawer =
    `<details class="drawer" id="math-drawer">` +
    `<summary>Show the math &amp; honesty receipts</summary>` +
    `<div class="drawer-intro">Every number above, derived from the same per-event log. The proxy only moves <em>input</em> tokens; output is shown on both sides so percentages stay honest.</div>` +
    `<div class="math-grid">` +
    mathBlock('Input tokens saved', savedMath) +
    mathBlock('Dollars saved', usdMath) +
    mathBlock('Compressed vs passthrough, per request', splitMath) +
    mathBlock('Share of total spend (diagnostic)', pctMath) +
    mathBlock('Token-equivalent (what the weekly cap counts)', tokeqMath) +
    `</div></details>`;

  // NOTE: tests assert the header fragment contains the port number.
  const updated = `<div class="updated"><span class="live-dot"></span>live · port ${port} · uptime ${formatDuration(s.uptime_sec)}</div>`;

  return strip + drawer + updated;
}

// ---- Mission Control: KPI row + savings sparkline + live feed ------------
//
// Phase 3 of the dashboard redesign. Overview swaps its old "hero + strip"
// layout for a row of compact KPI cards plus a live-ish event feed (htmx
// poll here; SSE lands in Phase 4). Honesty rule carried over from the hero
// (tests/hero.test.ts): the Savings % card is the cache-weighted pair
// (baseline_input_weighted vs actual_input_weighted), never raw count_tokens,
// and a net loss renders red (kpi-neg) — never disguised as a win. Only that
// one card uses the kpi-pos/kpi-neg convention; other cards use their own
// (kpi-loss / kpi-alert) so a loss elsewhere can't accidentally satisfy or
// break an assertion about the savings-% card's color.

function kpiCard(
  icon: string,
  label: string,
  value: string,
  sub: string,
  valueCls = '',
  extraHtml = '',
): string {
  return (
    `<div class="kpi-card">` +
    `<div class="kpi-icon">${icon}</div>` +
    `<div class="kpi-label">${label}</div>` +
    `<div class="kpi-value${valueCls ? ' ' + valueCls : ''}">${value}</div>` +
    `<div class="kpi-sub">${sub}</div>` +
    extraHtml +
    `</div>`
  );
}

/** Inline SVG sparkline of saved tokens (baseline_input − actual_input) per
 *  recent request, oldest → newest left to right. Rows missing either side
 *  of the pair are skipped rather than counted as a zero (would fake a flat
 *  line); fewer than 2 usable points can't draw a line, so it's blank rather
 *  than a single dot or a divide-by-zero NaN path. */
export function renderSparkline(rows: RecentRow[]): string {
  const pts = rows
    .filter(
      (r) =>
        r.baseline_input != null &&
        r.actual_input != null &&
        Number.isFinite(r.baseline_input) &&
        Number.isFinite(r.actual_input),
    )
    .map((r) => (r.baseline_input as number) - (r.actual_input as number));
  if (pts.length < 2) return '';
  const w = 160;
  const h = 36;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const range = max - min || 1; // flat series -> mid-line instead of NaN
  const step = w / (pts.length - 1);
  const coords = pts
    .map((v, i) => `${(i * step).toFixed(1)},${(h - ((v - min) / range) * h).toFixed(1)}`)
    .join(' ');
  // Conveys the trend (not just decoration), so it's labeled for screen
  // readers rather than aria-hidden — the KPI card's numeric value next to
  // it is the precise figure, this is the shape over time.
  return (
    `<svg class="sparkline-svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="Tokens saved trend across recent requests">` +
    `<polyline class="spark-fill" points="0,${h} ${coords} ${w},${h}"></polyline>` +
    `<polyline class="spark-line" points="${coords}"></polyline>` +
    `</svg>`
  );
}

/** Eight-card KPI row for the Overview page. `full` is null when the events
 *  file isn't available (503/404 from /api/stats.json) — latency/first-byte/
 *  cache-hit/error cards fall back to an em-dash rather than a fabricated 0
 *  or a NaN from dividing by a summary that doesn't exist. */
export function renderKpisFragment(
  s: StatsPayload,
  full: FullStatsSummary | null,
  recent: RecentPayload,
): string {
  // Same cache-weighted pair and direction as the hero (renderSessionSummaryFragment).
  const baselineW = s.baseline_input_weighted ?? 0;
  const actualW = s.actual_input_weighted ?? 0;
  const pct = baselineW > 0 ? (1 - actualW / baselineW) * 100 : 0;
  const pctCls = pct >= 0 ? 'kpi-pos' : 'kpi-neg';
  const savedUsd = s.saved_usd ?? 0;

  const reqs = s.requests ?? 0;
  const imaged = s.compressed_requests ?? 0;
  const passthrough = s.passthrough ?? 0;

  const cacheHitPct =
    full && full.total > 0 ? Math.round((full.cacheHitEvents / full.total) * 100) : null;
  const errs = full ? (full.err4xx ?? 0) + (full.err5xx ?? 0) : null;

  const imagedChars =
    (s.measured_text_chars ?? 0) + (s.measured_thinking_chars ?? 0) + (s.measured_tool_use_chars ?? 0);

  const spark = renderSparkline(recent.recent ?? []);
  const sparkHtml = spark ? `<div class="sparkline">${spark}</div>` : '';

  const cards = [
    kpiCard(
      '📉',
      'Savings %',
      `${Math.abs(pct).toFixed(0)}%`,
      baselineW > 0 ? 'weighted, cache-aware' : 'warming up',
      pctCls,
      sparkHtml,
    ),
    kpiCard(
      '💰',
      'Saved',
      `$${savedUsd.toFixed(2)}`,
      'estimated, at input rate',
      savedUsd < 0 ? 'kpi-loss' : '',
    ),
    kpiCard(
      '🔀',
      'Requests',
      numFmt(reqs),
      `${numFmt(imaged)} imaged · ${numFmt(passthrough)} passthrough`,
    ),
    kpiCard('⏱️', 'Latency p95', full ? fmtMs(full.durationP95) : '—', 'end-to-end, from disk log'),
    kpiCard(
      '⚡',
      'First byte p50',
      full ? fmtMs(full.firstByteP50) : '—',
      'time to first streamed byte',
    ),
    kpiCard(
      '💾',
      'Cache hits',
      cacheHitPct != null ? `${cacheHitPct}%` : '—',
      'of all logged requests',
    ),
    kpiCard(
      '⚠️',
      'Errors',
      errs != null ? numFmt(errs) : '—',
      '4xx + 5xx, from disk log',
      errs != null && errs > 0 ? 'kpi-alert' : '',
    ),
    kpiCard('🖼️', 'Imaged', kFmt(imagedChars), 'chars measured into pages'),
  ].join('');

  return `<div class="kpi-grid">${cards}</div>`;
}

/** Compact live feed, most-recent request first. Poll-driven (htmx `every
 *  2s`) in this phase; a later phase swaps the transport for SSE without
 *  touching this render function. */
export function renderFeedFragment(p: RecentPayload): string {
  const rows = (p.recent ?? []).slice().reverse();
  if (rows.length === 0) {
    return `<div class="feed-empty">No traffic yet</div>`;
  }
  const items = rows
    .map((r) => {
      const time = new Date((r.ts ?? 0) * 1000).toISOString().slice(11, 19);
      const typeCls = r.compressed ? 'feed-img' : 'feed-txt';
      const errCls = r.status >= 400 ? ' feed-err' : '';
      const saved =
        r.baseline_input != null && r.actual_input != null
          ? r.baseline_input - r.actual_input
          : null;
      const deltaHtml =
        saved == null
          ? `<span class="feed-delta muted">—</span>`
          : `<span class="feed-delta ${saved >= 0 ? 'pos' : 'neg'}">${saved >= 0 ? '+' : ''}${numFmt(saved)}</span>`;
      const model = r.model ? escapeHtml(r.model) : '—';
      return (
        `<div class="feed-item ${typeCls}${errCls}">` +
        `<span class="feed-dot"></span>` +
        `<span class="feed-time">${time}</span>` +
        `<span class="feed-model" title="${model}">${model}</span>` +
        deltaHtml +
        `<span class="feed-status pill pill-${statusCls(r.status)}">${r.status}</span>` +
        `</div>`
      );
    })
    .join('');
  return `<div class="feed-list">${items}</div>`;
}

// ---- odometer (Telemetry headline counters) -------------------------------

/** Three big live counters at the top of Telemetry. Ids are stable
 *  (`od-tokens` / `od-usd` / `od-reqs`) so the SSE client (GLUE_JS) can
 *  update them in place on every broadcast frame without a full htmx swap —
 *  the fragment itself stays the poll-driven fallback for hosts without SSE. */
export function renderOdometerFragment(s: StatsPayload): string {
  const tokens = kFmt(s.saved_input_tokens ?? 0);
  const usd = (Number(s.saved_usd) || 0).toFixed(2);
  const reqs = numFmt(s.requests ?? 0);
  // aria-live so screen readers get the SSE-pushed ticks without a focus
  // change; aria-atomic so a single-cell update is announced as the whole
  // (short) sentence, not a fragment of digits.
  return (
    `<div class="odometer" aria-live="polite" aria-atomic="true">` +
    `<div class="od-cell"><div id="od-tokens" class="od-value od-grad">${tokens}</div><div class="od-label">tokens saved</div></div>` +
    `<div class="od-cell"><div id="od-usd" class="od-value od-grad">$${usd}</div><div class="od-label">saved</div></div>` +
    `<div class="od-cell"><div id="od-reqs" class="od-value">${reqs}</div><div class="od-label">requests</div></div>` +
    `</div>`
  );
}

// ---- timeline (Telemetry live request log) ---------------------------------

function shortModel(m: string | null | undefined): string {
  if (!m) return '—';
  const s = String(m);
  const parts = s.split('/');
  return parts[parts.length - 1] || s;
}

/** Newest-first request log — replaces the flat recent-requests table on the
 *  Telemetry page. Each row carries a `tl-gate` marker for imaged vs
 *  passthrough (the dot on the imaged marker is a CSS animation, killed
 *  under prefers-reduced-motion) and a Details link into the SAME
 *  context-map fragment the old table linked to, so nothing downstream of
 *  "click a request" changes. `renderRecentFragment` (the table this
 *  replaces on this page) is untouched — /fragments/recent and the legacy
 *  /proxy-recent HTML still render it for any other caller. */
export function renderTimelineFragment(p: RecentPayload): string {
  const rows = (p.recent ?? []).slice().reverse();
  if (rows.length === 0) {
    return `<div class="timeline empty-note">No traffic yet</div>`;
  }
  const body = rows
    .map((e: RecentRow) => {
      const viewId = (e.img_ids ?? (e.img_id != null ? [e.img_id] : []))[0];
      // hx-get on an <a href="#"> performs an action (fetch a fragment), not
      // navigation — htmx intercepts the click, but role="button" keeps the
      // announced semantics honest for assistive tech and no-JS fallback.
      const details =
        viewId != null
          ? `<a class="row-view" href="#" role="button" hx-get="/fragments/context-map?req=${viewId}" hx-target="#frag-context-map" hx-swap="innerHTML">Details →</a>`
          : `<span class="muted">—</span>`;
      const gate = e.compressed
        ? `<span class="tl-gate tl-gate-img"><span class="tl-dot"></span>✓ imaged</span>`
        : `<span class="tl-gate tl-gate-txt">○ passthrough</span>`;
      const saved = e.session_saved_so_far_delta;
      const tokens =
        saved == null
          ? `<span class="muted">—</span>`
          : saved > 0
            ? `<span class="pos">+${numFmt(saved)}</span>`
            : saved < 0
              ? `<span class="neg">${numFmt(saved)}</span>`
              : `<span>0</span>`;
      const time = new Date((e.ts ?? 0) * 1000).toISOString().slice(11, 19);
      const statusTone = e.status >= 400 ? 'tl-err' : 'tl-ok';
      return (
        `<li class="tl-row">` +
        `<span class="tl-time">${time}</span>` +
        `<span class="tl-model"><code>${escapeHtml(shortModel(e.model))}</code></span>` +
        `<span class="tl-pipeline">${gate}</span>` +
        `<span class="tl-tokens">${tokens}</span>` +
        `<span class="tl-status ${statusTone}">${e.status}</span>` +
        `<span class="tl-details">${details}</span>` +
        `</li>`
      );
    })
    .join('');
  return `<ul class="timeline">${body}</ul>`;
}

// ---- request x-ray (image vs text breakdown) -----------------------------

export interface ContextMapData {
  id: number; // first image id (matches recent-table link)
  baselineTokens: number; // RAW count_tokens as plain text (cache-blind; sub-line only)
  realInput: number; // RAW input + cache_create + cache_read (cache-blind)
  baselineInputEff: number; // cache-WEIGHTED baseline — what text would actually be billed
  actualInputEff: number; // cache-WEIGHTED actual — what the images were actually billed
  haveBaseline: boolean; // weighted pair is trustworthy (baseline probe resolved)
  cacheRead: number; // cache_read tokens this turn. >0 ⇒ the actual request hit cache.
  warm: boolean; // did the TEXT baseline's prefix read warm? Server-observed only:
  // true iff the actual request had cache_read > 0. This keeps the text baseline
  // on the same cache state as the image path; no wall-clock-only inference.
  output: number;
  imageCount: number;
  buckets: Partial<Record<string, number>>; // bucket → chars rendered to PNG
  imageIds: number[]; // image-ring ids for the gallery
  compressed: boolean;
  restored?: boolean; // rebuilt from JSONL after a restart — PNG thumbnails are gone
}

const CTXMAP_BUCKETS: ReadonlyArray<readonly [string, string]> = [
  ['static_slab', 'System prompt + tool docs'],
  ['reminder', 'System-reminder blocks'],
  ['tool_result_prose', 'Tool results — prose'],
  ['tool_result_log', 'Tool results — logs'],
  ['tool_result_json', 'Tool results — JSON'],
  ['history', 'Older conversation turns'],
];

/** Image-vs-text breakdown for one request. */
export function renderContextMapFragment(
  c: ContextMapData | undefined,
  history: ContextMapData[] = [],
  notFound = false,
): string {
  const isLatest = c !== undefined && c.id === (history.at(-1)?.id ?? -1);
  if (notFound) {
    return `<div class="ctxmap"><div class="empty-note">That request's breakdown isn't kept anymore — only the most recent requests are. Pick <strong>Details</strong> on a newer row.</div></div>`;
  }
  if (!c || (c.baselineTokens <= 0 && c.imageCount <= 0)) {
    return `<div class="ctxmap"><div class="empty-note">Pick <strong>Details</strong> on a request to see exactly which parts became images and which stayed as text.</div></div>`;
  }
  // Cache-aware billing-equivalent basis — identical to the recent row's
  // As-text / Sent / Saved/lost columns. These are not raw token counts; they apply
  // Anthropic's cache rates so create/read misses are visible in the comparison.
  // The two panels can never contradict each other. The raw
  // count_tokens ratio is cache-blind: it over-states savings whenever the
  // prefix would have been a cheap cache-read, so it must NOT drive the
  // headline. It survives only as a clarifying sub-line below.
  const showCompare = c.haveBaseline && c.baselineInputEff > 0;
  const base = c.baselineInputEff;
  const real = c.actualInputEff;
  const pct = showCompare ? Math.round((1 - real / base) * 100) : 0;
  const rawShrink = c.baselineTokens > 0 ? Math.round((1 - c.realInput / c.baselineTokens) * 100) : 0;
  const totalImagedChars = CTXMAP_BUCKETS.reduce((a, [key]) => a + (c.buckets[key] ?? 0), 0);

  const imgRows = CTXMAP_BUCKETS.map(([key, label]) => [label, c.buckets[key] ?? 0] as const)
    .filter(([, ch]) => ch > 0)
    .map(
      ([label, ch]) =>
        `<div class="ctx-row"><span class="ctx-lbl">${label}</span><span class="ctx-val">${kFmt(ch)} chars</span></div>`,
    )
    .join('');

  const ids = c.imageIds ?? [];
  const gallery = ids.length
    ? `<div class="pages-title">${ids.length} image page${ids.length === 1 ? '' : 's'} sent to Claude — click one to read the exact text behind it:</div>` +
      `<div class="pages">` +
      ids
        .map(
          (id) =>
            `<img class="page" src="/proxy-latest-png?id=${id}" alt="page ${id}" loading="lazy" title="Click to read the source text behind page ${id}" onclick="ppPin(${id});ppSource(true)" onerror="this.classList.add('page-gone'); this.alt='page ${id} expired from buffer';" />`,
        )
        .join('') +
      `</div>`
    : c.restored && c.imageCount > 0
      ? `<div class="pages-title">${c.imageCount} image page${c.imageCount === 1 ? '' : 's'} were sent — thumbnails expired when the proxy restarted. The breakdown above is reconstructed from the saved log.</div>`
      : '';

  // Did the TEXT baseline's prefix read warm this turn? This follows the actual
  // request's observed cache state: cache_read > 0 means warm, cache_read === 0
  // means cold. No wall-clock-only counterfactual is credited.
  const warm = showCompare && c.warm;
  const textNoun = warm ? 'cached text' : 'text';
  // Raw count_tokens can grow (imaging bloated a short prompt), so say so rather
  // than rendering a nonsensical "shrank -36%".
  const rawPhrase =
    rawShrink >= 0 ? `Raw content shrank ${rawShrink}%.` : `Raw content grew ${-rawShrink}%.`;
  const headline = !showCompare
    ? `<strong>${kFmt(c.actualInputEff || c.realInput)}</strong> billing-equivalent input tokens sent`
    : pct >= 0
      ? `<span class="ctx-big">${pct}%</span> smaller — ${textNoun} would bill as <strong>${kFmt(base)}</strong> input tokens; images billed as <strong>${kFmt(real)}</strong>`
      : `<span class="ctx-big">${-pct}%</span> bigger — images billed as <strong>${kFmt(real)}</strong> input tokens vs <strong>${kFmt(base)}</strong> for ${textNoun}`;
  // Clarifying sub-line. It must match the actual request's cache state: claiming
  // a 0.1× read discount when cache_read===0 would count hypothetical cache as a
  // OmniGlyph effect, so cold rows price both paths cold.
  const subnote = !showCompare
    ? 'Billed tokens count cache discounts (reads at 0.1×) — no trustworthy text baseline for this request yet.'
    : !warm
      ? `No warm text cache this turn — the text counterfactual's prefix is priced at the 1.25× create rate (the same event the imaged path pays), identical basis to the Saved column. The gap is purely token count. ${rawPhrase}`
      : pct < 0 && rawShrink > 0
          ? `Billed = after cache discounts (reads at 0.1×), same basis as the Saved column. The raw text is ${rawShrink}% smaller, but most of it would have been a cheap cache-read — so imaging it cost more.`
          : `Billed = after cache discounts (reads at 0.1×), same basis as the Saved column. ${rawPhrase}`;
  const title = isLatest ? 'Latest request' : 'Selected request';

  return (
    `<div class="ctxmap">` +
    `<div class="ctx-headline"><span class="ctx-title">${title}</span> ${headline}</div>` +
    `<div class="split-note ctx-subnote">${subnote}</div>` +
    `<div class="legend"><span class="tag tag-img">Became an image</span><span class="tag tag-txt">Stayed as text</span></div>` +
    `<div class="split">` +
    `<div class="split-col split-img">` +
    `<div class="split-head">Compressed into images <span class="split-sum">${kFmt(totalImagedChars)} chars · ${c.imageCount} page${c.imageCount === 1 ? '' : 's'}</span></div>` +
    (imgRows || `<div class="ctx-row muted-row">nothing imaged this request</div>`) +
    `<div class="split-note">OmniGlyph can misread exact values inside images — treat these as gist, not byte-exact.</div>` +
    `</div>` +
    `<div class="split-col split-txt">` +
    `<div class="split-head">Kept as plain text <span class="split-sum">byte-exact</span></div>` +
    `<div class="ctx-row"><span class="ctx-lbl">Your latest messages</span><span class="ctx-val">verbatim</span></div>` +
    `<div class="ctx-row"><span class="ctx-lbl">Claude's reply (output)</span><span class="ctx-val">${kFmt(c.output)} tok</span></div>` +
    `<div class="split-note">never imaged — safe for IDs, hashes and exact numbers.</div>` +
    `</div>` +
    `</div>` +
    gallery +
    `</div>`
  );
}

// ---- live pipeline flow view ----------------------------------------------

/** One node card of the flow graph. SVG-only (no JS graph lib) so the
 *  dashboard stays offline/single-file; styled to read like a node editor. */
function flowNode(
  x: number,
  y: number,
  w: number,
  h: number,
  cls: string,
  title: string,
  value: string,
  sub: string,
): string {
  const cx = x + w / 2;
  return (
    `<g class="fnode ${cls}">` +
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"></rect>` +
    `<text class="fn-title" x="${cx}" y="${y + 22}" text-anchor="middle">${title}</text>` +
    `<text class="fn-value" x="${cx}" y="${y + 44}" text-anchor="middle">${value}</text>` +
    `<text class="fn-sub" x="${cx}" y="${y + 61}" text-anchor="middle">${sub}</text>` +
    `<circle class="fn-port" cx="${x}" cy="${y + h / 2}" r="3.5"></circle>` +
    `<circle class="fn-port" cx="${x + w}" cy="${y + h / 2}" r="3.5"></circle>` +
    `</g>`
  );
}

/** Live pipeline graph: client → gate → imaged/passthrough → upstream →
 *  response. The savings ribbon follows the hero's honesty rule — the
 *  cache-weighted pair (baseline_input_weighted vs actual_input_weighted)
 *  drives the headline, and a weighted net loss is shown as a loss. */
export function renderFlowFragment(s: StatsPayload): string {
  const reqs = s.requests || 0;
  const imaged = s.compressed_requests || 0;
  const passthrough = s.passthrough || 0;
  const base = s.baseline_input_weighted || 0;
  const real = s.actual_input_weighted || 0;
  const enabled = s.compression_enabled !== false;
  const imagedChars =
    (s.measured_text_chars || 0) + (s.measured_thinking_chars || 0) + (s.measured_tool_use_chars || 0);
  const live = reqs > 0 ? ' live' : '';

  // Edges. The imaged branch carries the flame accent, passthrough the text-blue.
  const edges =
    `<path class="fe${live}" d="M186 160 L232 160"></path>` +
    `<path class="fe fe-img${imaged > 0 ? live : ''}" d="M410 160 C 436 160, 430 57, 456 57"></path>` +
    `<path class="fe fe-txt${passthrough > 0 ? live : ''}" d="M410 160 C 436 160, 430 263, 456 263"></path>` +
    `<path class="fe fe-img${imaged > 0 ? live : ''}" d="M634 57 C 660 57, 654 160, 680 160"></path>` +
    `<path class="fe fe-txt${passthrough > 0 ? live : ''}" d="M634 263 C 660 263, 654 160, 680 160"></path>` +
    `<path class="fe${live}" d="M858 160 L886 160"></path>`;

  // End-anchored just left of the branch nodes (x=456) so the labels can
  // never clip under the node cards.
  const edgeLabels =
    `<text class="fe-lbl fe-lbl-img" x="448" y="84" text-anchor="end">${kFmt(imaged)} imaged</text>` +
    `<text class="fe-lbl fe-lbl-txt" x="448" y="252" text-anchor="end">${kFmt(passthrough)} passthrough</text>`;

  const nodes =
    flowNode(8, 121, 178, 78, 'fn-client', 'Claude Code', kFmt(reqs), 'requests through the proxy') +
    flowNode(
      232,
      121,
      178,
      78,
      enabled ? 'fn-gate' : 'fn-gate flow-off',
      'Gate',
      enabled ? 'ON' : 'OFF',
      'billing math + model gate',
    ) +
    flowNode(456, 18, 178, 78, 'fn-render', 'Renderer', `${kFmt(imagedChars)} chars`, 'dense 1-bit PNG pages') +
    flowNode(456, 224, 178, 78, 'fn-pass', 'Passthrough', 'byte-identical', 'unprofitable · recent turns') +
    flowNode(
      680,
      121,
      178,
      78,
      'fn-api',
      'Anthropic API',
      `${kFmt(real)} tok billed`,
      `vs ${kFmt(base)} as text (weighted)`,
    ) +
    flowNode(886, 121, 166, 78, 'fn-resp', 'Response', 'untouched', 'output is never compressed');

  // Savings ribbon — same cache-weighted basis and loss-honesty as the hero.
  const showCompare = base > 0 && real > 0;
  const pct = showCompare ? Math.round((1 - real / base) * 100) : 0;
  const ribbon =
    reqs === 0
      ? `<div class="flow-ribbon flow-wait">Waiting for the first request — point Claude Code at this proxy to see it flow.</div>`
      : !showCompare
        ? `<div class="flow-ribbon flow-wait">Measuring — no cache-weighted baseline yet.</div>`
        : pct >= 0
          ? `<div class="flow-ribbon flow-pos"><strong>${pct}%</strong> fewer weighted input tokens · ${kFmt(s.saved_input_tokens || 0)} tok · <strong>$${(s.saved_usd || 0).toFixed(2)}</strong> saved</div>`
          : `<div class="flow-ribbon flow-neg"><strong>${-pct}%</strong> more weighted input tokens than plain text so far — the gate keeps unprofitable requests as passthrough</div>`;

  return (
    `<div class="flow-view">` +
    `<svg viewBox="0 0 1060 320" role="img" aria-label="Request pipeline: client to gate to renderer or passthrough to Anthropic API to response">` +
    edges +
    edgeLabels +
    nodes +
    `</svg>` +
    ribbon +
    `</div>`
  );
}

// ---- recent requests table -----------------------------------------------

function statusCls(status: number): string {
  if (status >= 500) return 'bad';
  if (status >= 400) return 'warn';
  return 'good';
}

export function renderRecentFragment(p: RecentPayload): string {
  const rows = (p.recent ?? []).slice().reverse();
  const body =
    rows.length === 0
      ? `<tr><td colspan="10" class="empty-cell">No requests yet — they stream in here live.</td></tr>`
      : rows
          .map((e: RecentRow, i: number) => {
            const viewId = (e.img_ids ?? (e.img_id != null ? [e.img_id] : []))[0];
            const viewLink =
              viewId != null
                ? `<a class="row-view" href="#" role="button" hx-get="/fragments/context-map?req=${viewId}" hx-target="#frag-context-map" hx-swap="innerHTML">Details →</a>`
                : `<span class="muted">—</span>`;
            const saved = e.session_saved_so_far_delta;
            // A loss that disappears when the newly written prefix is repriced at
            // the read rate is just the one-time cache-create premium — the
            // purchase price of the cheap cache reads on the turns that follow.
            // Mark it so create turns don't read as gate failures.
            const cc = e.cache_create ?? 0;
            const createLoss =
              saved != null &&
              saved < 0 &&
              cc > 0 &&
              saved + cc * (CACHE_CREATE_RATE - CACHE_READ_RATE) > 0;
            const createNote = createLoss
              ? ` <span class="mk-create" title="Cache-create turn: this loss is the one-time ${CACHE_CREATE_RATE}× premium for writing ${numFmt(cc)} tokens to cache. Later turns re-read that prefix at ${CACHE_READ_RATE}×, which typically recoups it.">create</span>`
              : '';
            const savedCell = saved == null
              ? `<td class="num muted">—</td>`
              : saved > 0
                ? `<td class="num pos">${numFmt(saved)}</td>`
                : saved < 0
                  ? `<td class="num neg">${numFmt(saved)}${createNote}</td>`
                  : `<td class="num">0</td>`;
            const imaged = e.cc_added
              ? `<span class="badge badge-img">image</span>`
              : `<span class="badge badge-txt">text</span>`;
            return (
              `<tr>` +
              `<td class="muted">${i + 1}</td>` +
              `<td><span class="pill pill-${statusCls(e.status)}">${e.status}</span></td>` +
              `<td class="endp">${escapeHtml(shortPath(e.path))}</td>` +
              `<td>${e.model ? `<code>${escapeHtml(e.model)}</code>` : '<span class="muted">—</span>'}</td>` +
              `<td>${imaged}</td>` +
              `<td class="num">${e.cache_read != null ? numFmt(e.cache_read) : '—'}</td>` +
              `<td class="num">${e.baseline_input != null ? numFmt(e.baseline_input) : '—'}</td>` +
              `<td class="num">${e.actual_input != null ? numFmt(e.actual_input) : '—'}</td>` +
              savedCell +
              `<td class="num">${viewLink}</td>` +
              `</tr>`
            );
          })
          .join('');
  return (
    `<table class="rtable"><thead><tr>` +
    `<th scope="col">#</th>` +
    `<th scope="col">Result</th>` +
    `<th scope="col">Endpoint</th>` +
    `<th scope="col">Model</th>` +
    `<th scope="col" title="Was this request's context compressed into an image?">Sent as</th>` +
    `<th scope="col" class="num" title="Tokens served from Claude's cache (cheap)">Cache hits</th>` +
    `<th scope="col" class="num" title="Billing-equivalent input if kept as plain text, after cache create/read rates">As text</th>` +
    `<th scope="col" class="num" title="Actual billing-equivalent input after imaging, after cache create/read rates">Sent</th>` +
    `<th scope="col" class="num" title="As-text minus Sent; negative means imaging cost more">Saved/lost</th>` +
    `<th scope="col"></th>` +
    `</tr></thead><tbody>${body}</tbody></table>`
  );
}

// ---- image ↔ source inspector --------------------------------------------

export interface LatestFragmentInput {
  payload: RecentPayload;
  pin: number | null; // pinned image id, or null to follow latest
  showSource: boolean;
  sourceText: string | null; // null = not captured
}

export function renderLatestFragment(inp: LatestFragmentInput): string {
  const { payload, pin, showSource, sourceText } = inp;
  const hasPreview = payload.has_preview === true;
  const meta = payload.preview_meta ?? '';
  const imageIds = payload.image_ids ?? [];
  const pinnedEvicted = pin != null && !imageIds.includes(pin);

  // Pinned id, or latest (cache-busted by meta).
  const imgSrc =
    pin != null
      ? `/proxy-latest-png?id=${pin}`
      : `/proxy-latest-png?t=${encodeURIComponent(meta)}`;

  const pinBar =
    pin != null
      ? `<div class="viewer-bar"><button class="mini-btn" type="button" onclick="ppPin(null)">← back to latest</button><span class="mini-label">image #${pin}</span></div>`
      : '';

  let main: string;
  if (pin != null && pinnedEvicted) {
    main = `<div class="evicted">image #${pin} is no longer in the buffer</div>`;
  } else if (pin != null || hasPreview) {
    // When source pane is open the image appears inside the pairing — don't duplicate it.
    main = showSource ? '' : `<div class="frame"><img src="${imgSrc}" alt="rendered page" /></div>`;
  } else {
    main = `<div class="empty-note">No images yet — they appear the instant OmniGlyph compresses a request.</div>`;
  }

  const showBtn = pin != null ? !pinnedEvicted : hasPreview;
  const caption =
    pin != null ? `image #${pin}` : meta ? `${escapeHtml(meta)} · top-left at native size` : '';
  const srcBtn = showBtn
    ? `<button class="mini-btn" type="button" onclick="ppSource(${showSource ? 'false' : 'true'})">${showSource ? 'hide source text' : 'show the text behind this image'}</button>`
    : '';

  let pane = '';
  if (showSource) {
    pane =
      sourceText == null
        ? `<div class="evicted">source text wasn't captured for this image</div>`
        : `<div class="pairing">` +
          `<div class="pair-col"><div class="pair-head pair-img">What Claude sees · image</div><div class="frame frame-sm"><img src="${imgSrc}" alt="rendered page" /></div></div>` +
          `<div class="pair-mid">made from ↓</div>` +
          `<div class="pair-col"><div class="pair-head pair-txt">The original text · byte-exact</div><pre class="src-pane">${escapeHtml(sourceText)}</pre></div>` +
          `</div>`;
  }

  return pinBar + main + `<div class="viewer-caption">${caption} ${srcBtn}</div>` + pane;
}

// ---- sessions bar chart --------------------------------------------------

const TOP_N = 8;

export function renderSessionsFragment(p: SessionsPayload): string {
  const all = p.sessions ?? [];
  const rows = [...all]
    .sort((a, b) => (b.tokensSavedEst ?? 0) - (a.tokensSavedEst ?? 0))
    .slice(0, TOP_N);
  const max = rows.reduce((m, s) => Math.max(m, s.tokensSavedEst ?? 0), 0);

  const label = (s: SessionRow) => {
    const proj = s.claudeCode?.projectPath || s.project;
    return proj ? shortPath(proj) : s.id.slice(0, 8);
  };
  const barPct = (v: number) => (max <= 0 || v <= 0 ? 0 : (v / max) * 100);

  const status = `<div class="status">${all.length} session${all.length === 1 ? '' : 's'} tracked</div>`;
  if (rows.length === 0) return status + `<div class="empty">No sessions yet.</div>`;

  const chart = rows
    .map((s) => {
      const v = s.tokensSavedEst ?? 0;
      const pct = barPct(v);
      const fill = pct > 0 ? `<div class="bar-fill" style="width:max(3px,${pct}%)"></div>` : '';
      return (
        `<div class="bar-row">` +
        `<div class="bar-label" title="${escapeHtml(s.claudeCode?.projectPath || s.project || s.id)}">${escapeHtml(label(s))}</div>` +
        `<div class="bar-track">${fill}</div>` +
        `<div class="bar-val${v < 0 ? ' neg' : ''}">${numFmt(v)}</div>` +
        `</div>`
      );
    })
    .join('');

  return (
    status +
    `<div class="bars">${chart}</div>` +
    `<div class="axis">tokens saved per session (cache-aware) · top ${rows.length} of ${all.length}</div>`
  );
}

// ---- full-history stats table --------------------------------------------

export function renderStatsTableFragment(p: FullStatsPayload): string {
  if (p.error || !p.summary) {
    return `<div class="status">${escapeHtml(p.error || 'no data')}</div><table class="dtable"><tbody></tbody></table>`;
  }
  const s = p.summary;
  const totalIn = (s.inputTokensTotal || 0) + (s.cacheCreateTokensTotal || 0) + (s.cacheReadTokensTotal || 0);
  const hitRateTok = totalIn > 0 ? ((s.cacheReadTokensTotal / totalIn) * 100).toFixed(1) + '%' : '-';
  const hitRateEv =
    s.eventsWithBaseline > 0 ? ((s.cacheHitEvents / s.eventsWithBaseline) * 100).toFixed(1) + '%' : '-';
  const charRatio =
    s.origCharsTotal > 0 ? ((s.imageBytesTotal / s.origCharsTotal) * 100).toFixed(3) + 'x' : '-';

  // NOTE: the literal word "requests" is asserted by tests.
  // Each row is a label/value pair, not a column header — the label is the
  // ROW's header (scope="row"), not a column one.
  const tr = (k: string, v: string) => `<tr><th scope="row">${k}</th><td class="num">${v}</td></tr>`;
  return (
    `<div class="status">${numFmt(p.parsed)} events parsed from disk</div>` +
    `<table class="dtable"><tbody>` +
    tr('requests', numFmt(s.total)) +
    tr('2xx / 4xx / 5xx', `${numFmt(s.ok2xx)} / ${numFmt(s.err4xx)} / ${numFmt(s.err5xx)}`) +
    tr('compressed', numFmt(s.compressed)) +
    tr('passthrough', numFmt(s.passthrough)) +
    tr('input tokens', numFmt(s.inputTokensTotal)) +
    tr('cache create', numFmt(s.cacheCreateTokensTotal)) +
    tr('cache read', numFmt(s.cacheReadTokensTotal)) +
    tr('cache hit (by tokens)', hitRateTok) +
    tr('cache hit (by events)', hitRateEv) +
    tr('original chars', numFmt(s.origCharsTotal)) +
    tr('image bytes', numFmt(s.imageBytesTotal)) +
    tr('bytes / char', charRatio) +
    tr('latency p50 / p95', `${numFmt(s.durationP50)} / ${numFmt(s.durationP95)} ms`) +
    tr('first-byte p50 / p95', `${numFmt(s.firstByteP50)} / ${numFmt(s.firstByteP95)} ms`) +
    `</tbody></table>`
  );
}

// ---- benchmarks (Phase 5) ----------------------------------------------------

export interface BenchFragmentData {
  billingSweep: BillingSweepAggregate;
  densityFrontier: DensityFrontierAggregate;
}

export interface BenchFragmentOpts {
  /** false when benchmarks/ isn't on disk (npm install without the repo
   *  checkout) — every run button is disabled and a note explains why. */
  harnessAvailable: boolean;
  /** ANTHROPIC_API_KEY present in this process — both harnesses require it
   *  for a live run. Gates the live button independent of harnessAvailable
   *  so the dry button can still work with no key at all. */
  canLive: boolean;
  /** Non-null while a run is in flight — swaps the run buttons for a
   *  streaming terminal + cancel button. */
  running: BenchRunnerState | null;
}

function renderBillingModelTable(models: BillingSweepAggregate['models']): string {
  if (models.length === 0) return `<div class="empty">no probes recorded yet</div>`;
  const rows = models
    .map(
      (m) =>
        `<tr><td><code>${escapeHtml(m.model)}</code></td><td class="num">${m.probes}</td>` +
        `<td class="num">${m.residualMax}</td><td class="num">${m.residualTotal}</td></tr>`,
    )
    .join('');
  return (
    `<table class="dtable"><thead><tr>` +
    `<th scope="col">model</th><th scope="col">probes</th><th scope="col">residual max</th><th scope="col">residual total</th>` +
    `</tr></thead>` +
    `<tbody>${rows}</tbody></table>`
  );
}

function renderDensityModelBars(models: DensityFrontierAggregate['models']): string {
  if (models.length === 0) return `<div class="empty">no attempts recorded yet</div>`;
  // Newest experiments first — the historical sweeps sink to the bottom.
  const ordered = [...models].sort((a, b) => (b.lastDate ?? '').localeCompare(a.lastDate ?? ''));
  const rows = ordered
    .map((m) => {
      const pct = m.attempts > 0 ? (m.correct / m.attempts) * 100 : 0;
      return (
        `<div class="bar-row" title="last run ${escapeHtml(m.lastDate ?? 'n/a')}">` +
        `<div class="bar-head"><code>${escapeHtml(m.model)}</code>` +
        `<span class="bar-config">${escapeHtml(m.config)}</span>` +
        `<span class="bar-val">${m.correct}/${m.attempts} exact · ${m.abstained} abst.</span></div>` +
        `<div class="bar-track"><div class="bar-fill" style="width:${pct.toFixed(1)}%"></div></div>` +
        `</div>`
      );
    })
    .join('');
  // Per-experiment on purpose: a per-model rollup would mix production-config
  // reads with deliberately-overdense experiments and misstate both.
  return (
    `<div class="bars">${rows}</div>` +
    `<div class="split-note">one row per (model · config) experiment — densities differ by design; the production-config numbers are the ones the gate enforces.</div>`
  );
}

function benchRunButtons(
  harness: 'billing-sweep' | 'density-frontier',
  opts: BenchFragmentOpts,
): string {
  const dryDisabled = !opts.harnessAvailable || opts.running !== null ? ' disabled' : '';
  const liveDisabled = dryDisabled || !opts.canLive ? ' disabled' : '';
  const liveTitle = !opts.canLive
    ? ' title="ANTHROPIC_API_KEY not set in this process — required for a live run"'
    : '';
  // /api/bench/run answers JSON ({started} | an error body), not a fragment —
  // hx-swap="none" leaves the DOM alone on the response itself; the terminal
  // appears from the next #frag-bench poll (every 2s, or sooner via the
  // pp-refresh an SSE bench frame triggers on document.body). A non-2xx
  // status (400/409/412) still surfaces via the existing htmx:responseError
  // → toast wiring in GLUE_JS, so a rejected run isn't silent.
  return (
    `<div class="bench-actions">` +
    `<button type="button" id="bench-run-dry-${harness}" class="switch-btn bench-run-dry"${dryDisabled}` +
    ` hx-post="/api/bench/run" hx-swap="none"` +
    ` hx-vals='{"harness":"${harness}","mode":"dry"}'>Run dry ($0)</button>` +
    `<button type="button" id="bench-run-live-${harness}" class="switch-btn bench-run-live"${liveDisabled}${liveTitle}` +
    ` hx-post="/api/bench/run" hx-swap="none"` +
    ` hx-vals='{"harness":"${harness}","mode":"live","confirm":true}'` +
    ` hx-confirm="This calls the real provider API and can incur real cost. Results append to benchmarks/${harness}/results/. Continue?"` +
    `>Run live</button>` +
    `</div>`
  );
}

function renderBenchTerminal(running: BenchRunnerState): string {
  const body = running.lines.length > 0
    ? running.lines.map((l) => escapeHtml(l)).join('\n')
    : '(waiting for output…)';
  return (
    `<div class="card bench-term" id="bench-term">` +
    `<div class="term-bar">` +
    `<span class="term-dot term-dot-red"></span>` +
    `<span class="term-dot term-dot-yellow"></span>` +
    `<span class="term-dot term-dot-green"></span>` +
    `<span class="term-title">${escapeHtml(running.harness ?? '')} — running…</span>` +
    `<button type="button" id="bench-cancel" class="switch-btn term-cancel" ` +
    `hx-post="/api/bench/cancel" hx-swap="none">Cancel</button>` +
    `</div>` +
    `<pre class="term-body">${body}</pre>` +
    `</div>`
  );
}

/** GET /fragments/bench — the two harness cards (real JSONL aggregates,
 *  never fabricated) plus, while a run is active, a live terminal. See
 *  src/dashboard/bench.ts for the parser this reads and the runner this
 *  starts/cancels. */
export function renderBenchFragment(data: BenchFragmentData, opts: BenchFragmentOpts): string {
  const { billingSweep, densityFrontier } = data;
  const note = !opts.harnessAvailable
    ? `<p class="bench-note bench-unavailable">Running these harnesses requires a full repository checkout — ` +
      `the <code>benchmarks/</code> scripts aren't part of the npm package. Clone the repo and run them from the CLI instead.</p>`
    : '';

  const billingCard =
    `<div class="card bench-card">` +
    `<h3 class="card-head">billing-sweep</h3>` +
    `<p class="bench-source">source: benchmarks/billing-sweep/results/</p>` +
    `<div class="bench-agg">` +
    `<div><span class="k">probes</span><span class="v">${billingSweep.totalProbes}</span></div>` +
    `<div><span class="k">measured</span><span class="v">${billingSweep.measuredProbes}</span></div>` +
    `<div><span class="k">residual max / total</span><span class="v">${billingSweep.residualMax} / ${billingSweep.residualTotal}</span></div>` +
    `</div>` +
    renderBillingModelTable(billingSweep.models) +
    benchRunButtons('billing-sweep', opts) +
    `</div>`;

  const densityCard =
    `<div class="card bench-card">` +
    `<h3 class="card-head">density-frontier</h3>` +
    `<p class="bench-source">source: benchmarks/density-frontier/results/</p>` +
    `<div class="bench-agg">` +
    `<div><span class="k">rows</span><span class="v">${densityFrontier.totalRows}</span></div>` +
    `<div><span class="k">models</span><span class="v">${densityFrontier.models.length}</span></div>` +
    `</div>` +
    renderDensityModelBars(densityFrontier.models) +
    benchRunButtons('density-frontier', opts) +
    `</div>`;

  const terminal = opts.running ? renderBenchTerminal(opts.running) : '';

  return `<div class="bench-grid">${billingCard}${densityCard}</div>${note}${terminal}`;
}

// ---- page shell -------------------------------------------------------------

// Favicon mirrors the .flame-dot glyph: a glossy flame sphere (radial highlight
// at 35%/30%, --flame -> --flame-strong) ringed by a faint --flame-tint halo.
// Inlined as a URL-encoded SVG data URI so the dashboard stays self-contained
// (no extra route/static asset). Keep colors in sync with :root in CSS below.
const FAVICON =
  "data:image/svg+xml," +
  "%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%2032%2032'%3E" +
  "%3Cdefs%3E%3CradialGradient%20id='f'%20cx='35%25'%20cy='30%25'%20r='80%25'%3E" +
  "%3Cstop%20offset='0%25'%20stop-color='%23ffd0a8'/%3E" +
  "%3Cstop%20offset='55%25'%20stop-color='%23ff5a1f'/%3E" +
  "%3Cstop%20offset='100%25'%20stop-color='%23e8420a'/%3E" +
  "%3C/radialGradient%3E%3C/defs%3E" +
  "%3Ccircle%20cx='16'%20cy='16'%20r='15.5'%20fill='%23fff1ea'/%3E" +
  "%3Ccircle%20cx='16'%20cy='16'%20r='10'%20fill='url(%23f)'/%3E%3C/svg%3E";

const CSS = `
  :root {
    --bg: #f9f9fb; --surface: #ffffff; --surface-2: #f5f5fa;
    --border: rgba(0,0,0,0.08); --border-strong: #e2e2ea;
    /* --muted was #71717a (Tailwind zinc-500): ~4.83:1 on --surface but only
       ~4.45:1 on --surface-2 (#f5f5fa) — sub-AA for the small (10.5-12px)
       kpi-sub/tile-sub/hint text that sits on card backgrounds. Darkened to
       #6c6c75 (barely perceptible) so both surfaces clear 4.5:1 with margin. */
    --ink: #1a1a2e; --ink-2: #3f3f50; --muted: #6c6c75;
    --color-primary: #e54d5e; --color-primary-hover: #c93d4e;
    --color-accent: #6366f1; --color-accent-hover: #8b5cf6; --color-accent-light: #a855f7;
    --color-sidebar: #10141e;
    --flame: var(--color-primary); --flame-strong: var(--color-primary-hover);
    --flame-ink: var(--color-primary-hover); --flame-tint: rgba(229,77,94,0.08);
    --good: #22c55e; --good-tint: rgba(34,197,94,0.1);
    --bad: #ef4444; --bad-tint: rgba(239,68,68,0.1);
    --warn: #f59e0b; --warn-tint: rgba(245,158,11,0.1);
    /* OmniGlyph identity: "this became an image" stays flame-orange, distinct
       from the ported OmniRoute brand palette above. */
    --img: #ff5a1f; --img-ink: #bd3a08; --img-tint: #fff1ea;
    --txt: var(--color-accent); --txt-ink: var(--color-accent-hover); --txt-tint: rgba(99,102,241,0.08);
    --radius: 14px; --radius-control: 9px;
    --shadow: 0 1px 3px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.015);
    --shadow-warm: 0 2px 12px -2px rgba(229,77,94,0.12);
    --shadow-elevated: 0 12px 28px -4px rgba(20,20,40,0.06);
    --mono: ui-monospace, 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
    --sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', system-ui, sans-serif;
    --grad-brand: linear-gradient(135deg, var(--color-primary), #a855f7);
    --grid-line: rgba(0,0,0,0.07); --grid-size: 32px;
    --traffic-red: #ff5f56; --traffic-yellow: #ffbd2e; --traffic-green: #27c93f;
    /* Keyboard focus ring — a "punched-out" halo (bg-colored inner ring so it
       reads on any element's own background, then the accent ring) rather
       than a plain outline. References --bg / --color-accent so it stays
       correct when :root[data-theme="dark"] overrides --bg below. */
    --focus-ring: 0 0 0 2px var(--bg), 0 0 0 4px var(--color-accent);
    color-scheme: light;
  }
  /* Dark theme: same coral/indigo identity, inverted neutrals. Set before first
     paint by the <head> script (localStorage 'pp-theme' else system pref);
     toggled by ppTheme(). Accents (flame/img/txt) are lifted for contrast. */
  :root[data-theme="dark"] {
    --bg: #0b0e14; --surface: #161b22; --surface-2: #1c2230;
    --border: rgba(255,255,255,0.08); --border-strong: #2d333b;
    --ink: #e6e6ef; --ink-2: #c4c4d2; --muted: #a1a1aa;
    --color-primary: #e54d5e; --color-primary-hover: #c93d4e;
    --color-accent: #6366f1; --color-accent-hover: #8b5cf6; --color-accent-light: #a855f7;
    --color-sidebar: #10141e;
    --flame: var(--color-primary); --flame-strong: var(--color-primary-hover);
    --flame-ink: #ff8a97; --flame-tint: rgba(229,77,94,0.15);
    --good: #3fbd76; --good-tint: rgba(63,189,118,0.15);
    --bad: #f0645a; --bad-tint: rgba(240,100,90,0.15);
    --warn: #d99a3a; --warn-tint: rgba(217,154,58,0.15);
    --img: #ff6a33; --img-ink: #ff9a63; --img-tint: #3a2318;
    --txt: var(--color-accent-light); --txt-ink: #b9a3fb; --txt-tint: rgba(168,85,247,0.12);
    --shadow: 0 1px 3px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.1);
    --shadow-warm: 0 2px 12px -2px rgba(229,77,94,0.15);
    --shadow-elevated: 0 12px 28px -4px rgba(0,0,0,0.3);
    --grid-line: rgba(255,255,255,0.06);
    color-scheme: dark;
  }
  /* Graph-paper grid: a fixed, full-viewport backdrop behind everything.
     pointer-events:none + negative z-index keep it out of the hit-test and
     paint order; cards/surfaces are opaque and cover it. */
  body::before {
    content: ''; position: fixed; inset: 0; z-index: -1; pointer-events: none;
    background-image:
      linear-gradient(var(--grid-line) 1px, transparent 1px),
      linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
    background-size: var(--grid-size) var(--grid-size);
  }
  /* Dark fix-ups for the few intentionally hard-coded (light) spots. */
  :root[data-theme="dark"] .banner { border-color: #6e342c; color: #f4b9b1; }
  :root[data-theme="dark"] .banner strong { color: #ffd6cf; }
  :root[data-theme="dark"] .toast { box-shadow: 0 8px 24px rgba(0,0,0,.5); }
  * { box-sizing: border-box; }
  body { margin: 0; padding: 22px 26px 64px; background: var(--bg); color: var(--ink-2);
    font: 14px/1.5 var(--sans);
    -webkit-font-smoothing: antialiased; }
  b, strong { color: var(--ink); }
  .good { color: var(--good); } .bad { color: var(--bad); }
  .muted { color: var(--muted); }

  /* topbar */
  .topbar { display: flex; align-items: flex-start; justify-content: space-between;
    gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
  .brand { display: flex; align-items: center; gap: 12px; }
  .flame-dot { width: 14px; height: 14px; border-radius: 50%;
    background: var(--grad-brand);
    box-shadow: 0 0 0 4px var(--flame-tint); flex: none; }
  .wordmark { font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
    background: var(--grad-brand); -webkit-background-clip: text; background-clip: text; color: transparent; }
  .tagline { font-size: 12.5px; color: var(--muted); margin-top: 1px; max-width: 460px; }
  .controls { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }

  /* kill switch */
  .banner { display: block; margin: 0 0 8px; padding: 9px 13px; background: var(--bad-tint);
    border: 1px solid #f3b6af; border-radius: 9px; color: #9c2b20; font-size: 12px; max-width: 520px; }
  .banner strong { color: #8a2117; }
  .switch { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; justify-content: flex-end; }
  .switch-state { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600;
    padding: 3px 10px; border-radius: 999px; }
  .switch-state.on { color: var(--good); background: var(--good-tint); }
  .switch-state.off { color: var(--bad); background: var(--bad-tint); }
  .switch-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .switch-btn { background: var(--surface); color: var(--ink); border: 1px solid var(--border-strong);
    padding: 6px 13px; cursor: pointer; border-radius: var(--radius-control); font: inherit; font-size: 12px; font-weight: 600;
    box-shadow: var(--shadow); }
  .switch-btn:hover { border-color: var(--flame); color: var(--flame-ink); }
  .hint { color: var(--muted); font-size: 11px; }
  .theme-btn { background: var(--surface); color: var(--ink-2); border: 1px solid var(--border-strong);
    padding: 5px 11px; cursor: pointer; border-radius: var(--radius-control); font: inherit; font-size: 12px; font-weight: 600;
    box-shadow: var(--shadow); display: inline-flex; align-items: center; gap: 6px; line-height: 1; }
  .theme-btn:hover { border-color: var(--flame); color: var(--flame-ink); }

  /* model chips */
  .models { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin: 0 0 18px; }
  .models-label { color: var(--ink-2); font-size: 12px; font-weight: 600; }
  .chip { background: var(--surface); color: var(--ink-2); border: 1px solid var(--border-strong);
    border-radius: 999px; padding: 4px 12px; cursor: pointer; font: inherit; font-size: 12px; }
  .chip:hover { border-color: var(--flame); color: var(--flame-ink); }
  .chip.on { background: var(--flame-tint); color: var(--flame-ink); border-color: var(--flame);
    font-weight: 600; }

  /* session hero */
  #frag-session { display: block; margin-bottom: 16px; }
  .hero { background: linear-gradient(135deg, var(--flame-tint), var(--surface) 60%); border: 1px solid var(--border);
    border-left: 4px solid var(--flame); border-radius: var(--radius); padding: 20px 24px; box-shadow: var(--shadow); }
  .hero-neg { border-left-color: var(--bad); }
  .hero-eyebrow { font-size: 11.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--muted); margin-bottom: 8px; }
  .hero-headline { font-size: 28px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; line-height: 1.1; }
  .hero-num { font-size: 56px; font-weight: 800; line-height: 1; margin-right: 8px;
    background: linear-gradient(135deg, #ff9a4d, var(--flame) 55%, var(--flame-strong));
    -webkit-background-clip: text; background-clip: text; color: transparent;
    font-variant-numeric: tabular-nums; }
  .hero-neg .hero-num { background: linear-gradient(135deg, #f0857a, var(--bad));
    -webkit-background-clip: text; background-clip: text; color: transparent; }
  .hero-sub { font-size: 14.5px; color: var(--ink-2); margin-top: 12px; max-width: 720px; }
  .hero-meta { font-size: 12px; color: var(--muted); margin-top: 10px; padding-top: 10px;
    border-top: 1px dashed var(--border-strong); }
  .hero-empty .hero-headline { color: var(--muted); font-size: 24px; }

  /* Mission Control (Phase 3): KPI row + sparkline + live feed */
  .mission-grid { display: grid; grid-template-columns: 3fr 1fr; gap: 16px; align-items: start;
    margin-bottom: 4px; }
  @media (max-width: 900px) { .mission-grid { grid-template-columns: 1fr; } }
  .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 14px 16px; box-shadow: var(--shadow); min-width: 0;
    transition: box-shadow .15s ease, transform .15s ease; }
  .kpi-card:hover { box-shadow: var(--shadow-elevated); transform: translateY(-1px); }
  .kpi-icon { font-size: 13px; color: var(--muted); margin-bottom: 6px; line-height: 1; }
  .kpi-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--muted); margin-bottom: 6px; }
  .kpi-value { font-family: var(--mono); font-size: 22px; font-weight: 700; color: var(--ink);
    font-variant-numeric: tabular-nums; line-height: 1.1; }
  .kpi-value.kpi-pos { color: var(--good); }
  .kpi-value.kpi-neg, .kpi-value.kpi-loss, .kpi-value.kpi-alert { color: var(--bad); }
  .kpi-sub { font-size: 10.5px; color: var(--muted); margin-top: 5px; }
  .sparkline { margin-top: 8px; }
  .sparkline-svg { display: block; width: 100%; height: 32px; }
  .spark-line { fill: none; stroke: var(--color-accent); stroke-width: 1.75;
    stroke-linejoin: round; stroke-linecap: round; }
  .spark-fill { fill: var(--color-accent); fill-opacity: 0.12; stroke: none; }

  .feed-card { display: flex; flex-direction: column; min-width: 0; max-height: 480px; }
  .feed-list { display: flex; flex-direction: column; gap: 6px; overflow-y: auto; max-height: 420px;
    scrollbar-width: thin; }
  .feed-item { display: flex; align-items: center; gap: 8px; padding: 6px 9px; border-radius: 8px;
    background: var(--surface-2); font-size: 11px; }
  .feed-item.feed-err { background: var(--bad-tint); }
  .feed-dot { width: 7px; height: 7px; border-radius: 50%; flex: none; background: var(--muted); }
  .feed-img .feed-dot { background: var(--img); }
  .feed-txt .feed-dot { background: var(--txt); }
  .feed-time { font-family: var(--mono); color: var(--muted); font-size: 10px; flex: none; }
  .feed-model { font-family: var(--mono); color: var(--ink-2); flex: 1; min-width: 0; overflow: hidden;
    text-overflow: ellipsis; white-space: nowrap; }
  .feed-delta { font-variant-numeric: tabular-nums; font-weight: 700; flex: none; }
  .feed-delta.pos { color: var(--good); }
  .feed-delta.neg { color: var(--bad); }
  .feed-delta.muted { color: var(--muted); font-weight: 400; }
  .feed-status { flex: none; min-width: 34px; }
  .feed-empty { color: var(--muted); font-size: 12px; text-align: center; padding: 20px 8px; }

  /* odometer (Telemetry headline counters, SSE-pushed) */
  .odometer { display: flex; flex-wrap: wrap; gap: 30px; padding: 18px 22px;
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    box-shadow: var(--shadow); }
  .od-cell { display: flex; flex-direction: column; gap: 4px; }
  .od-value { font-family: var(--mono); font-size: 32px; font-weight: 800; color: var(--ink);
    line-height: 1.05; font-variant-numeric: tabular-nums; }
  .od-grad { background: var(--grad-brand); -webkit-background-clip: text; background-clip: text;
    color: transparent; }
  .od-label { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--muted); }
  @keyframes ppOdTick { 0% { transform: scale(1.16); } 100% { transform: scale(1); } }
  .od-tick { animation: ppOdTick .35s ease-out; }

  /* timeline (Telemetry live request log, replaces the flat recent table) */
  .timeline-card { padding: 0; overflow: hidden; }
  .timeline { display: flex; flex-direction: column; max-height: 480px; overflow-y: auto;
    scrollbar-width: thin; }
  .tl-row { display: grid; grid-template-columns: 72px 1fr 118px 92px 56px 84px; gap: 10px;
    align-items: center; padding: 8px 16px; border-bottom: 1px solid var(--border); font-size: 12.5px; }
  .tl-row:last-child { border-bottom: 0; }
  .tl-row:hover { background: var(--surface-2); }
  .tl-time { font-family: var(--mono); color: var(--muted); font-size: 11px; }
  .tl-model code { font-size: 11.5px; color: var(--ink-2); }
  .tl-gate { display: inline-flex; align-items: center; gap: 5px; font-weight: 600; font-size: 11.5px; }
  .tl-gate-img { color: var(--img-ink); }
  .tl-gate-txt { color: var(--txt-ink); }
  .tl-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--img); flex: none;
    animation: ppTlPulse 1.3s ease-in-out infinite; }
  @keyframes ppTlPulse { 0%, 100% { opacity: 0.35; } 50% { opacity: 1; } }
  .tl-tokens { font-variant-numeric: tabular-nums; font-weight: 600; }
  .tl-tokens .pos { color: var(--good); } .tl-tokens .neg { color: var(--bad); }
  .tl-status { font-weight: 700; }
  .tl-status.tl-err { color: var(--bad); }
  .tl-status.tl-ok { color: var(--muted); }
  .timeline.empty-note { margin: 16px; }
  @media (max-width: 720px) {
    .tl-row { grid-template-columns: 1fr 1fr; grid-auto-rows: auto; row-gap: 4px; }
  }

  /* flow particle — SSE-pushed animation on the Live Flow page */
  .flow-particle { fill: var(--img); r: 4px; offset-rotate: 0deg;
    offset-path: path('M8 160 L232 160 L410 160 C 436 160, 430 57, 456 57 L634 57 C 660 57, 654 160, 680 160 L886 160');
    animation: ppFlowParticle 1.1s ease-out forwards; }
  .flow-particle.flow-particle-txt { fill: var(--txt);
    offset-path: path('M8 160 L232 160 L410 160 C 436 160, 430 263, 456 263 L634 263 C 660 263, 654 160, 680 160 L886 160'); }
  @keyframes ppFlowParticle { from { offset-distance: 0%; opacity: 1; } to { offset-distance: 100%; opacity: 0; } }

  /* stat strip */
  .strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 14px; }
  @media (max-width: 1000px) { .strip { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .strip { grid-template-columns: 1fr; } }
  .tile { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 14px 16px; box-shadow: var(--shadow); }
  .tile-label { font-size: 11.5px; font-weight: 600; color: var(--ink-2); margin-bottom: 8px;
    display: flex; align-items: center; gap: 5px; }
  .tile-value { font-size: 26px; font-weight: 800; color: var(--ink); font-variant-numeric: tabular-nums;
    letter-spacing: -0.01em; line-height: 1.1; }
  .tile-value.pos { color: var(--good); } .tile-value.neg { color: var(--bad); }
  .tile-value.muted-val { color: var(--muted); font-size: 18px; font-weight: 600; }
  .tile-sub { font-size: 11.5px; color: var(--muted); margin-top: 6px; }
  .q { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px;
    border-radius: 50%; background: var(--surface-2); border: 1px solid var(--border-strong);
    color: var(--muted); font-size: 9px; font-weight: 700; cursor: help; }

  /* drawer */
  .drawer { margin: 0 0 14px; background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
  .drawer > summary { cursor: pointer; user-select: none; list-style: none; padding: 12px 16px;
    font-size: 13px; font-weight: 600; color: var(--flame-ink); display: flex; align-items: center; gap: 8px; }
  .drawer > summary::-webkit-details-marker { display: none; }
  .drawer > summary::before { content: '▸'; color: var(--flame); font-size: 11px; }
  .drawer[open] > summary::before { content: '▾'; }
  .drawer > summary:hover { background: var(--surface-2); }
  .drawer-intro { padding: 0 16px 10px; font-size: 12px; color: var(--ink-2); }
  .drawer-intro em { color: var(--flame-ink); font-style: normal; font-weight: 600; }
  .math-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 16px 16px; }
  @media (max-width: 860px) { .math-grid { grid-template-columns: 1fr; } }
  .math-block h4 { margin: 0 0 6px; font-size: 12px; color: var(--ink); }
  .formula { background: var(--surface-2); border: 1px solid var(--border); border-radius: 8px;
    padding: 9px 11px; font: 11px/1.55 var(--mono); color: var(--ink-2); white-space: pre-wrap;
    word-break: break-word; }
  .formula .k { color: var(--muted); } .formula .v { color: var(--ink); } .formula .op { color: var(--flame); }
  .formula .sp { height: 6px; }
  .formula .src { color: var(--muted); font-size: 10px; display: block; margin-top: 7px;
    border-top: 1px solid var(--border); padding-top: 6px; }
  .updated { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
  .live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--good); animation: pulse 2s infinite; }
  @keyframes pulse { 50% { opacity: 0.35; } }

  /* sections */
  .section { margin-top: 26px; }
  .section-head { font-size: 14px; font-weight: 700; color: var(--ink); margin: 0 0 12px;
    display: flex; align-items: baseline; gap: 10px; }
  .section-sub { font-size: 12px; font-weight: 400; color: var(--muted); }
  .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 16px 18px; box-shadow: var(--shadow); min-width: 0; }
  .card-head { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--muted); margin: 0 0 12px; }
  .card-head.spaced { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--border); }

  /* x-ray */
  .xray { display: grid; grid-template-columns: 1.15fr 1fr; gap: 16px; align-items: start; }
  @media (max-width: 1000px) { .xray { grid-template-columns: 1fr; } }

  /* context map */
  .ctxmap { font-size: 13px; }
  .empty-note { color: var(--muted); font-size: 12.5px; padding: 14px; background: var(--surface-2);
    border: 1px dashed var(--border-strong); border-radius: 10px; }
  .ctx-headline { font-size: 13px; color: var(--ink-2); margin-bottom: 10px; }
  .ctx-title { display: inline-block; font-weight: 700; color: var(--ink); margin-right: 6px; }
  .ctx-big { font-size: 22px; font-weight: 800; color: var(--flame); font-variant-numeric: tabular-nums; }
  .legend { display: flex; gap: 8px; margin-bottom: 10px; }
  .tag { font-size: 11px; font-weight: 600; padding: 3px 9px 3px 22px; border-radius: 999px; position: relative; }
  .tag::before { content: ''; position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
    width: 8px; height: 8px; border-radius: 2px; }
  .tag-img { background: var(--img-tint); color: var(--img-ink); }
  .tag-img::before { background: var(--img); }
  .tag-txt { background: var(--txt-tint); color: var(--txt-ink); }
  .tag-txt::before { background: var(--txt); }
  .split { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  @media (max-width: 560px) { .split { grid-template-columns: 1fr; } }
  .split-col { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--surface); }
  .split-img { border-top: 3px solid var(--img); background: linear-gradient(180deg, var(--img-tint), var(--surface) 40%); }
  .split-txt { border-top: 3px solid var(--txt); background: linear-gradient(180deg, var(--txt-tint), var(--surface) 40%); }
  .split-head { font-size: 12px; font-weight: 700; color: var(--ink); margin-bottom: 8px; display: flex;
    flex-direction: column; gap: 2px; }
  .split-sum { font-size: 10.5px; font-weight: 600; color: var(--muted); }
  .ctx-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 4px 0;
    border-bottom: 1px solid var(--border); }
  .ctx-row:last-of-type { border-bottom: none; }
  .ctx-lbl { color: var(--ink-2); } .ctx-val { color: var(--ink); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .muted-row { color: var(--muted); font-style: italic; }
  .split-note { font-size: 10.5px; color: var(--muted); margin-top: 7px; }
  .pages-title { font-size: 11px; color: var(--ink-2); margin: 12px 0 6px; }
  .pages { display: flex; flex-wrap: wrap; gap: 6px; max-height: 320px; overflow: auto;
    background: var(--surface-2); padding: 6px; border: 1px solid var(--border); border-radius: 8px; }
  .page { height: 130px; width: auto; max-width: 230px; object-fit: contain; object-position: top left;
    image-rendering: pixelated; background: #fff; border: 1px solid var(--border-strong); border-radius: 4px;
    cursor: pointer; transition: border-color .12s, transform .12s; }
  .page:hover { border-color: var(--flame); transform: translateY(-1px); }
  .page.page-gone { width: 150px; height: 56px; background: var(--surface-2); border: 1px dashed var(--border-strong);
    color: var(--muted); font-size: 10px; cursor: default; }

  /* live pipeline flow view */
  .flow-view svg { width: 100%; height: auto; display: block; }
  .flow-view .fnode rect { fill: var(--surface); stroke: var(--border-strong); stroke-width: 1.25;
    filter: drop-shadow(0 2px 5px rgba(60,35,15,.08)); }
  :root[data-theme="dark"] .flow-view .fnode rect { filter: drop-shadow(0 2px 6px rgba(0,0,0,.45)); }
  .flow-view .fn-title { font-size: 12px; font-weight: 700; fill: var(--muted); letter-spacing: .02em; }
  .flow-view .fn-value { font-size: 16px; font-weight: 800; fill: var(--ink); }
  .flow-view .fn-sub { font-size: 10.5px; fill: var(--muted); }
  .flow-view .fn-port { fill: var(--surface); stroke: var(--border-strong); stroke-width: 1.25; }
  .flow-view .fn-render rect { stroke: var(--img); }
  .flow-view .fn-render .fn-value { fill: var(--img-ink); }
  .flow-view .fn-pass rect { stroke: var(--txt); }
  .flow-view .fn-pass .fn-value { fill: var(--txt-ink); }
  .flow-view .fn-gate rect { stroke: var(--good); }
  .flow-view .fn-gate .fn-value { fill: var(--good); }
  .flow-view .fn-gate.flow-off rect { stroke: var(--bad); stroke-dasharray: 4 3; }
  .flow-view .fn-gate.flow-off .fn-value { fill: var(--bad); }
  .flow-view .fe { fill: none; stroke: var(--border-strong); stroke-width: 2; }
  .flow-view .fe-img { stroke: var(--img); }
  .flow-view .fe-txt { stroke: var(--txt); }
  .flow-view .fe.live { stroke-dasharray: 7 7; animation: ppFlowDash .9s linear infinite; }
  @keyframes ppFlowDash { to { stroke-dashoffset: -14; } }
  .flow-view .fe-lbl { font-size: 11px; font-weight: 700; }
  .flow-view .fe-lbl-img { fill: var(--img-ink); }
  .flow-view .fe-lbl-txt { fill: var(--txt-ink); }
  .flow-ribbon { margin-top: 10px; padding: 9px 13px; border-radius: 9px; font-size: 12.5px; text-align: center; }
  .flow-ribbon.flow-pos { background: var(--good-tint); color: var(--good); }
  .flow-ribbon.flow-neg { background: var(--bad-tint); color: var(--bad); }
  .flow-ribbon.flow-wait { background: var(--surface-2); color: var(--muted); }

  /* recent requests */
  .row-view { color: var(--flame-ink); font-weight: 600; text-decoration: none; cursor: pointer; white-space: nowrap; }
  .row-view:hover { text-decoration: underline; }
  table.rtable, table.dtable { width: 100%; border-collapse: collapse; font-size: 12px; }
  .rtable th, .dtable th { text-align: left; color: var(--muted); font-weight: 600; padding: 7px 8px;
    border-bottom: 1px solid var(--border-strong); white-space: nowrap; }
  /* .dtable's key column is a row header (<th scope="row">), not a column
     one — same visual weight as a plain label cell, not the bold column-head
     styling above. */
  .dtable th[scope="row"] { font-weight: 400; color: var(--ink-2); white-space: normal;
    vertical-align: middle; border-bottom: 1px solid var(--border); }
  .rtable td, .dtable td { padding: 7px 8px; border-bottom: 1px solid var(--border);
    font-variant-numeric: tabular-nums; vertical-align: middle; color: var(--ink-2); }
  .rtable tr:last-child td, .dtable tr:last-child td { border-bottom: none; }
  /* Only the dtable's row-header column (see th[scope="row"] above) should
     lose its border on the last row — NOT a <thead> column-header row that
     happens to be its parent's only/last <tr> (renderBillingModelTable). */
  .dtable tr:last-child th[scope="row"] { border-bottom: none; }
  .rtable tbody tr:hover, .rtable tbody tr:hover { background: var(--surface-2); }
  /* Keep wide tables inside their card: scroll horizontally rather than
     pushing the card border out. Fires only when the nowrap columns exceed
     the card width (narrow x-ray column / small window); no scrollbar when
     they fit. The table keeps width:100% so it fills at wide widths. */
  #frag-recent, #frag-stats { overflow-x: auto; overflow-y: hidden; scrollbar-width: thin; }
  #frag-recent table, #frag-stats table { min-width: max-content; }
  #frag-latest { overflow: auto; scrollbar-width: thin; }
  th.num, td.num { text-align: right; }
  td.pos { color: var(--good); font-weight: 600; }
  td.neg { color: var(--bad); font-weight: 600; }
  .endp { color: var(--ink); font-family: var(--mono); font-size: 11px; }
  .empty-cell { color: var(--muted); text-align: center; padding: 18px; }
  .pill { display: inline-block; min-width: 38px; text-align: center; font-size: 11px; font-weight: 700;
    padding: 2px 8px; border-radius: 999px; font-variant-numeric: tabular-nums; }
  .pill-good { background: var(--good-tint); color: var(--good); }
  .pill-warn { background: var(--warn-tint); color: var(--warn); }
  .pill-bad { background: var(--bad-tint); color: var(--bad); }
  .badge { font-size: 10.5px; font-weight: 700; padding: 2px 8px; border-radius: 999px; }
  .mk-create { font-size: 9.5px; font-weight: 700; color: var(--muted); border: 1px solid var(--muted);
    border-radius: 999px; padding: 0 5px; margin-left: 4px; vertical-align: 1px; cursor: help; white-space: nowrap; }
  .badge-img { background: var(--img-tint); color: var(--img-ink); }
  .badge-txt { background: var(--txt-tint); color: var(--txt-ink); }

  /* inspector */
  .viewer-bar { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .mini-btn { font-size: 11px; background: var(--surface); color: var(--flame-ink); border: 1px solid var(--border-strong);
    border-radius: var(--radius-control); padding: 3px 9px; cursor: pointer; font-weight: 600; }
  .mini-btn:hover { border-color: var(--flame); }
  .mini-label { font-size: 11px; color: var(--muted); }
  .frame { background: #fff; border: 1px solid var(--border-strong); border-radius: 8px; padding: 5px;
    overflow: auto; max-height: 360px; scrollbar-width: thin; }
  .frame img { display: block; width: auto; height: auto; max-width: none; image-rendering: pixelated; }
  .frame-sm { max-height: 260px; }
  .viewer-caption { font-size: 11px; color: var(--muted); margin-top: 8px; display: flex; align-items: center;
    gap: 10px; flex-wrap: wrap; }
  .pairing { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 10px; }
  .pair-head { font-size: 11px; font-weight: 700; padding: 3px 9px; border-radius: 6px; display: inline-block;
    margin-bottom: 6px; }
  .pair-img { background: var(--img-tint); color: var(--img-ink); }
  .pair-txt { background: var(--txt-tint); color: var(--txt-ink); }
  .pair-mid { font-size: 11px; font-weight: 600; color: var(--muted); text-align: center; }
  .src-pane { margin: 0; max-height: 280px; overflow: auto; background: var(--surface-2);
    border: 1px solid var(--border); border-radius: 8px; padding: 9px; font: 11px/1.45 var(--mono);
    white-space: pre-wrap; word-break: break-word; color: var(--ink-2); }
  .evicted { font-size: 11.5px; color: var(--muted); padding: 12px; background: var(--surface-2);
    border: 1px dashed var(--border-strong); border-radius: 8px; }

  /* sessions bars */
  .status { margin-bottom: 12px; color: var(--muted); font-size: 12px; }
  .bars { display: flex; flex-direction: column; gap: 10px; }
  /* Stacked rows (head line + bar) — labels can never overflow the card. */
  .bar-row { display: flex; flex-direction: column; gap: 4px; font-size: 12px; min-width: 0; }
  .bar-head { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
  .bar-head code { color: var(--ink); font-weight: 700; }
  .bar-config { color: var(--muted); font-family: var(--mono); font-size: 11px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; flex: 1; }
  .bar-head .bar-val { flex: none; width: auto; }
  .bar-label { width: 150px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    color: var(--ink); font-family: var(--mono); font-size: 11px; }
  .bar-track { flex: 1; min-width: 0; height: 16px; background: var(--surface-2); border-radius: 5px;
    overflow: hidden; border: 1px solid var(--border); }
  .bar-fill { height: 100%; border-radius: 5px 0 0 5px;
    background: linear-gradient(90deg, #ffa766, var(--flame)); }
  .bar-val { width: 78px; flex: none; text-align: right; font-variant-numeric: tabular-nums;
    color: var(--flame-ink); font-weight: 600; }
  .bar-val.neg { color: var(--bad); }
  .axis { margin-top: 12px; color: var(--muted); font-size: 11px; }
  .empty { text-align: center; color: var(--muted); padding: 22px; font-size: 12px; }

  /* toast tray */
  .tray { position: fixed; bottom: 16px; right: 16px; display: flex; flex-direction: column; gap: 8px;
    z-index: 1000; pointer-events: none; }
  .toast { background: var(--surface); color: var(--bad); border: 1px solid #f0b3ab; border-radius: 9px;
    padding: 10px 14px; font-size: 12px; box-shadow: 0 8px 24px rgba(60,35,15,.14); display: flex;
    align-items: center; gap: 12px; pointer-events: auto; max-width: 360px; }
  .toast button { background: transparent; color: inherit; border: 0; cursor: pointer; font-size: 16px;
    line-height: 1; padding: 0; }

  /* sidebar shell (Phase 2). --color-sidebar is a fixed dark surface in BOTH
     themes (see :root above), so its own ink tokens don't follow --ink /
     --muted — those flip with the theme and would go dark-on-dark. */
  body.with-sidebar { padding: 0; }
  .sidebar { position: fixed; inset: 0 auto 0 0; width: 220px; background: var(--color-sidebar);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    padding: 20px 0 12px; overflow-y: auto; z-index: 20; }
  .sidebar-brand { display: flex; align-items: center; gap: 10px; padding: 0 20px 22px; }
  .sidebar-brand .wordmark { font-size: 18px; }
  .sidebar-nav { display: flex; flex-direction: column; gap: 2px; padding: 0 10px; }
  .nav-item { display: flex; align-items: center; gap: 11px; padding: 9px 12px; margin: 0 2px;
    border-radius: var(--radius-control); border-left: 3px solid transparent;
    color: rgba(255,255,255,.68); text-decoration: none; font-size: 13px; font-weight: 600;
    line-height: 1.2; }
  .nav-item:hover { background: rgba(255,255,255,.06); color: #fff; }
  .nav-item.nav-active { background: var(--flame-tint); border-left-color: var(--color-primary); color: #fff; }
  .nav-icon { width: 18px; flex: none; text-align: center; font-size: 14px; }
  .nav-label { white-space: nowrap; }
  .main { margin-left: 220px; padding: 22px 26px 64px; min-width: 0; }
  .page-heading { min-width: 0; }
  .page-title { margin: 0; font-size: 20px; font-weight: 800; color: var(--ink); letter-spacing: -0.01em; }
  .page-sub { font-size: 12.5px; color: var(--muted); margin-top: 2px; }
  @media (max-width: 900px) {
    .sidebar { position: static; width: auto; flex-direction: row; align-items: center;
      padding: 8px 10px; overflow-x: auto; overflow-y: visible; border-right: 0;
      border-bottom: 1px solid var(--border); }
    .sidebar-brand { display: none; }
    .sidebar-nav { flex-direction: row; gap: 4px; padding: 0; }
    .nav-item { flex-direction: column; gap: 3px; padding: 6px 10px; border-left: 0;
      border-bottom: 3px solid transparent; font-size: 10px; }
    .nav-item.nav-active { border-left-color: transparent; border-bottom-color: var(--color-primary); }
    .main { margin-left: 0; padding: 18px 16px 48px; }
  }

  /* benchmarks page (Phase 5) */
  .bench-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px; }
  .bench-card { display: flex; flex-direction: column; gap: 10px; }
  .bench-source { margin: -4px 0 0; color: var(--muted); font-size: 11px; font-family: var(--mono); }
  .bench-agg { display: flex; flex-wrap: wrap; gap: 14px; font-size: 12px; }
  .bench-agg > div { display: flex; flex-direction: column; gap: 2px; }
  .bench-agg .k { color: var(--muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.05em; }
  .bench-agg .v { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
  .bench-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
  .bench-actions .switch-btn[disabled] { opacity: 0.45; cursor: not-allowed; }
  .bench-actions .bench-run-live { border-color: var(--flame); color: var(--flame-ink); }
  .bench-note { margin: 4px 0 0; color: var(--muted); font-size: 12px; max-width: 640px; }
  .bench-note code { font-family: var(--mono); }
  .bench-unavailable { color: var(--warn); }
  /* streaming terminal — the --traffic-* dots make it read as "a shell ran
     this", distinct from every other (bordered-card) surface on the page. */
  .bench-term { background: #14161c; border-color: #2b2e38; margin-top: 16px; padding: 0; overflow: hidden; }
  .term-bar { display: flex; align-items: center; gap: 7px; padding: 9px 12px;
    background: #1c1f27; border-bottom: 1px solid #2b2e38; }
  .term-dot { width: 11px; height: 11px; border-radius: 50%; flex: none; }
  .term-dot-red { background: var(--traffic-red); }
  .term-dot-yellow { background: var(--traffic-yellow); }
  .term-dot-green { background: var(--traffic-green); }
  .term-title { margin-left: 6px; color: #9a9fae; font-size: 11.5px; font-weight: 600; flex: 1; }
  .term-cancel { padding: 4px 11px; font-size: 11px; }
  .term-body { margin: 0; padding: 12px 14px; max-height: 260px; overflow: auto; color: #d6d9e0;
    font: 11.5px/1.55 var(--mono); white-space: pre-wrap; word-break: break-word; }

  /* focus-visible ring (keyboard only — no mouse-click halo) for every real
     link/button on the page: sidebar nav, kill switch, model chips, theme
     toggle, bench run/cancel, Details links, toast dismiss, skip link. */
  a:focus-visible, button:focus-visible {
    outline: none;
    box-shadow: var(--focus-ring);
  }

  /* Skip-to-content link — off-screen until it receives keyboard focus, then
     pinned top-left above everything else so a keyboard/screen-reader user
     can jump past the sidebar nav straight into the page content. */
  .skip-link { position: absolute; left: -9999px; top: 0; z-index: 1100;
    background: var(--surface); color: var(--ink); padding: 10px 16px;
    border-radius: 0 0 var(--radius-control) 0; font-weight: 700; font-size: 13px;
    text-decoration: none; box-shadow: var(--shadow-elevated); }
  .skip-link:focus { left: 0; }

  /* Motion — every animation the redesign introduced (odometer tick,
     timeline pulse dot, live pipeline dash, flow particle) turns off from
     this single switch instead of scattered per-feature overrides. */
  @media (prefers-reduced-motion: reduce) {
    .od-tick { animation: none; }
    .tl-dot { animation: none; opacity: 1; }
    .flow-view .fe.live { animation: none; }
    .flow-particle { display: none; }
  }
`;

// Client glue: window.pp (pin+source state) → hx-vals; preserves <details> open state across swaps; routes htmx errors to toast tray.
const GLUE_JS = `
  window.pp = { pin: null, src: false };
  function ppPin(id) {
    window.pp.pin = id;
    htmx.trigger('#frag-latest', 'pp-refresh');
  }
  function ppSource(on) {
    window.pp.src = on;
    htmx.trigger('#frag-latest', 'pp-refresh');
  }
  document.body.addEventListener('htmx:beforeSwap', function (ev) {
    const open = [];
    ev.detail.target.querySelectorAll('details[open][id]').forEach(function (d) { open.push(d.id); });
    ev.detail.target.__ppOpen = open;
  });
  document.body.addEventListener('htmx:afterSwap', function (ev) {
    (ev.detail.target.__ppOpen || []).forEach(function (id) {
      const d = document.getElementById(id);
      if (d) d.setAttribute('open', '');
    });
  });
  document.body.addEventListener('htmx:responseError', function (ev) {
    window.dispatchEvent(new CustomEvent('pp-toast', {
      detail: { text: ev.detail.xhr.status + ' ' + ev.detail.requestConfig.path }
    }));
  });
  document.body.addEventListener('htmx:sendError', function (ev) {
    window.dispatchEvent(new CustomEvent('pp-toast', {
      detail: { text: 'proxy unreachable: ' + ev.detail.requestConfig.path }
    }));
  });

  // ---- SSE (progressive enhancement — every fragment above still polls,
  // so a host without /events/stream, or a client that drops the connection,
  // keeps working exactly as before). EventSource reconnects on its own; we
  // add no retry logic on top of it.
  (function () {
    if (typeof EventSource === 'undefined') return;
    var es;
    try { es = new EventSource('/events/stream'); } catch (e) { return; }
    es.onmessage = function (ev) {
      var data;
      try { data = JSON.parse(ev.data); } catch (e) { return; }
      ppOdometerTick(data.stats);
      if (window.htmx) htmx.trigger(document.body, 'pp-refresh');
      ppFlowParticle(data.compressed === true);
    };
  })();

  function ppKFmt(n) {
    var v = Number(n) || 0;
    var a = Math.abs(v);
    if (a >= 1000000) return (v / 1000000).toFixed(a >= 10000000 ? 0 : 1) + 'M';
    if (a >= 1000) return (v / 1000).toFixed(a >= 100000 ? 0 : 1) + 'k';
    return String(Math.round(v));
  }

  function ppOdTick(el) {
    if (!el) return;
    el.classList.remove('od-tick');
    void el.offsetWidth; // restart the CSS animation
    el.classList.add('od-tick');
  }

  // Odometer numbers tick in place on every SSE frame — no htmx round-trip
  // needed for the three headline counters (od-tokens/od-usd/od-reqs); the
  // fragment itself still polls, so a missing/stale element is a no-op.
  function ppOdometerTick(stats) {
    if (!stats) return;
    var t = document.getElementById('od-tokens');
    var u = document.getElementById('od-usd');
    var r = document.getElementById('od-reqs');
    if (t) { t.textContent = ppKFmt(stats.saved_input_tokens); ppOdTick(t); }
    if (u) { u.textContent = '$' + (Number(stats.saved_usd) || 0).toFixed(2); ppOdTick(u); }
    if (r) { r.textContent = String(Math.round(Number(stats.requests) || 0)); ppOdTick(r); }
  }

  // Small, defensive: only runs when the Live Flow page's SVG is on screen.
  // A circle SVG rides the imaged or passthrough branch via CSS offset-path
  // (see .flow-particle in <style>), then removes itself.
  function ppFlowParticle(imaged) {
    var flow = document.querySelector('.flow-view');
    if (!flow) return;
    var svg = flow.querySelector('svg');
    if (!svg) return;
    if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    particle.setAttribute('r', '4');
    particle.setAttribute('class', imaged ? 'flow-particle' : 'flow-particle flow-particle-txt');
    svg.appendChild(particle);
    setTimeout(function () {
      if (particle.parentNode) particle.parentNode.removeChild(particle);
    }, 1200);
  }
`;

// Theme: light/dark via data-theme on <html>; saved in localStorage, defaults to system pref.
const THEME_JS = `
  (function () {
    function apply(t) {
      document.documentElement.dataset.theme = t;
      var b = document.getElementById('theme-btn');
      if (b) {
        b.textContent = t === 'dark' ? '☀️ Light' : '🌙 Dark';
        b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
      }
    }
    window.ppTheme = function () {
      var next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem('pp-theme', next); } catch (e) {}
      apply(next);
    };
    apply(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
  })();
`;

/** Six server-rendered dashboard pages behind the sidebar shell. Structurally
 *  identical to (and must stay in sync with) DashboardPage in ../dashboard.ts —
 *  duplicated as a literal union rather than imported so fragments.ts (which
 *  dashboard.ts imports FROM) doesn't need an import back the other way. */
export type DashboardPageId =
  | 'overview'
  | 'flow'
  | 'telemetry'
  | 'benchmarks'
  | 'sessions'
  | 'history';

const NAV: ReadonlyArray<{ page: DashboardPageId; href: string; icon: string; label: string }> = [
  { page: 'overview', href: '/', icon: '🏠', label: 'Overview' },
  { page: 'flow', href: '/flow', icon: '🔀', label: 'Live Flow' },
  { page: 'telemetry', href: '/telemetry', icon: '📡', label: 'Telemetry' },
  { page: 'benchmarks', href: '/benchmarks', icon: '📊', label: 'Benchmarks' },
  { page: 'sessions', href: '/sessions', icon: '📁', label: 'Sessions' },
  { page: 'history', href: '/history', icon: '🗂️', label: 'History' },
];

const PAGE_META: Record<DashboardPageId, { title: string; sub: string }> = {
  overview: { title: 'Overview', sub: 'Live savings at a glance since this proxy started.' },
  flow: { title: 'Live Flow', sub: 'How each request flows through the gate, live.' },
  telemetry: { title: 'Telemetry', sub: 'Recent requests and what became an image vs stayed text.' },
  benchmarks: { title: 'Benchmarks', sub: 'Billing-sweep and density-frontier receipts.' },
  sessions: { title: 'Sessions', sub: 'Top sessions by tokens saved.' },
  history: { title: 'History', sub: 'Every event on disk, aggregated.' },
};

function renderSidebar(active: DashboardPageId): string {
  const items = NAV.map((n) => {
    const isActive = n.page === active;
    const cls = 'nav-item' + (isActive ? ' nav-active' : '');
    const current = isActive ? ' aria-current="page"' : '';
    return (
      `<a class="${cls}" href="${n.href}"${current}>` +
      `<span class="nav-icon">${n.icon}</span><span class="nav-label">${n.label}</span></a>`
    );
  }).join('');
  return (
    `<nav class="sidebar" aria-label="Primary">` +
    `<div class="sidebar-brand"><span class="flame-dot"></span><div class="wordmark">OmniGlyph</div></div>` +
    `<div class="sidebar-nav">${items}</div>` +
    `</nav>`
  );
}

// Kill switch (#frag-toggle) lives here so it's reachable from every page, not
// just Overview — it's the one control that has to stay one click away always.
function renderTopbar(page: DashboardPageId): string {
  const meta = PAGE_META[page];
  return (
    `<header class="topbar">` +
    `<div class="page-heading"><h1 class="page-title">${meta.title}</h1><div class="page-sub">${meta.sub}</div></div>` +
    `<div class="controls">` +
    `<button type="button" id="theme-btn" class="theme-btn" onclick="ppTheme()" aria-label="Toggle dark mode" title="Toggle dark / light mode">🌙 Dark</button>` +
    `<div id="frag-toggle" hx-get="/fragments/toggle" hx-trigger="load, every 2s" hx-swap="innerHTML"></div>` +
    `</div>` +
    `</header>`
  );
}

function renderPageBody(page: DashboardPageId): string {
  switch (page) {
    case 'overview':
      // Mission Control (Phase 3): KPI row + savings sparkline on the left,
      // a live-ish event feed on the right. The old stat-strip + math drawer
      // (#frag-header) still carries the "show the math" honesty receipts,
      // so it stays on the page — just demoted to the bottom, below the
      // fold, now that the KPI row is the at-a-glance summary.
      return (
        `<div id="frag-models" hx-get="/fragments/models" hx-trigger="load, every 2s" hx-swap="innerHTML"></div>\n\n` +
        `<div id="frag-session" hx-get="/fragments/session-summary" hx-trigger="load, every 2s" hx-swap="innerHTML">\n` +
        `  <div class="hero hero-empty"><div class="hero-headline">Connecting…</div></div>\n` +
        `</div>\n\n` +
        `<div class="mission-grid">\n` +
        `  <div id="frag-kpis" hx-get="/fragments/kpis" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML"></div>\n` +
        `  <div class="card feed-card">\n` +
        `    <h3 class="card-head">Live feed</h3>\n` +
        `    <div id="frag-feed" hx-get="/fragments/feed" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML"></div>\n` +
        `  </div>\n` +
        `</div>\n\n` +
        `<div class="section">\n` +
        `  <h2 class="section-head">Lifetime totals <span class="section-sub">the full math, and the honesty receipts behind it</span></h2>\n` +
        `  <div id="frag-header" hx-get="/fragments/header" hx-trigger="load, every 2s" hx-swap="innerHTML"></div>\n` +
        `</div>`
      );
    case 'flow':
      return (
        `<section class="section">\n` +
        `  <h2 class="section-head">Live pipeline <span class="section-sub">how each request flows through the gate</span></h2>\n` +
        `  <div class="card">\n` +
        `    <div id="frag-flow" hx-get="/fragments/flow" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML"></div>\n` +
        `  </div>\n` +
        `</section>`
      );
    case 'telemetry':
      // Odometer + timeline are the live view (SSE-pushed, poll as fallback —
      // see GLUE_JS); the x-ray pair below stays for the deep-dive click.
      // Details → opens the context-map card via a client-side scroll/highlight,
      // so the timeline and the x-ray pair have to share a page: splitting them
      // would break that cross-reference. #frag-recent (the flat table this
      // replaces on THIS page) is gone from telemetry — the fragment and its
      // /fragments/recent route are untouched for other callers.
      return (
        `<section class="section">\n` +
        `  <div id="frag-odometer" hx-get="/fragments/odometer" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML"></div>\n` +
        `</section>\n\n` +
        `<section class="section">\n` +
        `  <h2 class="section-head">Timeline <span class="section-sub">live requests, newest first</span></h2>\n` +
        `  <div class="card timeline-card">\n` +
        `    <div id="frag-timeline" hx-get="/fragments/timeline" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML"></div>\n` +
        `  </div>\n` +
        `</section>\n\n` +
        `<section class="section">\n` +
        `  <h2 class="section-head">What happened to your context <span class="section-sub">click a request to see image vs text</span></h2>\n` +
        `  <div class="card">\n` +
        `    <h3 class="card-head">Image vs text breakdown</h3>\n` +
        `    <div id="frag-context-map" hx-get="/fragments/context-map" hx-trigger="load" hx-swap="innerHTML"></div>\n` +
        `    <h3 class="card-head spaced">Image ↔ source inspector</h3>\n` +
        `    <div id="frag-latest" hx-get="/fragments/latest" hx-trigger="load, every 2s, pp-refresh" hx-swap="innerHTML"\n` +
        `         hx-vals='js:{pin: window.pp.pin == null ? "" : window.pp.pin, source: window.pp.src ? "1" : ""}'></div>\n` +
        `  </div>\n` +
        `</section>`
      );
    case 'benchmarks':
      return (
        `<section class="section">\n` +
        `  <h2 class="section-head">Benchmarks <span class="section-sub">billing-sweep + density-frontier — real receipts, live runs gated</span></h2>\n` +
        `  <div id="frag-bench" hx-get="/fragments/bench" hx-trigger="load, every 2s, pp-refresh from:body" hx-swap="innerHTML">\n` +
        `    <div class="status">loading…</div>\n` +
        `  </div>\n` +
        `  <p class="bench-note">Full methodology and measured receipts: ` +
        `<a href="https://github.com/diegosouzapw/OmniGlyph/blob/main/docs/benchmarks/BENCHMARKS.md" target="_blank" rel="noopener">docs/benchmarks/BENCHMARKS.md</a>.</p>\n` +
        `</section>`
      );
    case 'sessions':
      return (
        `<section class="section">\n` +
        `  <h2 class="section-head">Top sessions <span class="section-sub">by tokens saved</span></h2>\n` +
        `  <div class="card">\n` +
        `    <div id="frag-sessions" hx-get="/fragments/sessions" hx-trigger="load, every 5s" hx-swap="innerHTML"></div>\n` +
        `  </div>\n` +
        `</section>`
      );
    case 'history':
      return (
        `<section class="section">\n` +
        `  <h2 class="section-head">Full history <span class="section-sub">every event on disk</span></h2>\n` +
        `  <div class="card">\n` +
        `    <div id="frag-stats" hx-get="/fragments/stats" hx-trigger="load, every 5s" hx-swap="innerHTML"></div>\n` +
        `  </div>\n` +
        `</section>`
      );
  }
}

export function renderPage(_port: number, page: DashboardPageId = 'overview'): string {
  // hx-trigger="load, every Ns": paint on load then poll (2s live, 5s aggregates).
  const meta = PAGE_META[page];
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${meta.title} · OmniGlyph dashboard</title>
<link rel="icon" href="${FAVICON}" />
<style>${CSS}</style>
<script>
  // Set theme before first paint (no flash): saved choice wins, else system preference.
  (function () {
    try {
      var s = localStorage.getItem('pp-theme');
      var dark = s ? s === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    } catch (e) { document.documentElement.dataset.theme = 'light'; }
  })();
</script>
</head>
<body class="with-sidebar">

<a class="skip-link" href="#main-content">Skip to content</a>

${renderSidebar(page)}

<main class="main" id="main-content">

${renderTopbar(page)}

${renderPageBody(page)}

</main>

<div class="tray" x-data="{ toasts: [], next: 1 }"
     @pp-toast.window="const id = next++; toasts.push({ id, text: $event.detail.text }); setTimeout(() => toasts = toasts.filter(t => t.id !== id), 5000)">
  <template x-for="t in toasts" :key="t.id">
    <div class="toast"><span x-text="t.text"></span><button type="button" @click="toasts = toasts.filter(x => x.id !== t.id)" aria-label="dismiss">&times;</button></div>
  </template>
</div>

<script>${HTMX_JS}</script>
<script>${GLUE_JS}</script>
<script>${THEME_JS}</script>
<script>${ALPINE_JS}</script>
</body>
</html>`;
}
