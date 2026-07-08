# Roadmap — OmniGlyph + OmniRoute integration

Consolidated work plan, first drafted 2026-07-05 from the measured billing
sweep, the OpenAI/Gemini audit against official docs and the density-frontier
harness. **Status refreshed 2026-07-08** (post-1.0.2, post-dashboard-v2).
Marks: ☐ pending · ◐ partial · ☑ done here.

## Shipped since the first draft (recap)

- **1.0.0** (2026-07-07): public release — exact per-provider billing math
  (residual zero), fail-closed model gate, LRU render cache, refusal retry,
  benchmark harnesses with JSONL receipts, Node + Workers hosts, and the
  `omniglyph` engine shipped inside OmniRoute.
- **1.0.1/1.0.2** (2026-07-08): CodeQL zeroed (linear-time hot paths, TOCTOU
  closed), docs in 41 languages + localized CLI, trusted publishing (OIDC)
  with SLSA provenance + GitHub Packages mirror.
- **Dashboard v2** (2026-07-08): OmniRoute-themed sidebar app with six pages —
  Overview mission control, Live Flow pipeline graph, Telemetry
  odometer/timeline, **Benchmarks with in-UI $0 dry-runs** (live runs gated),
  Sessions, History — live over SSE (`/events/stream`), offline single-file,
  AA-accessible. 135 new tests.

## Phase 0 — Measurement foundation (DONE)

- ☑ Exact Anthropic billing (28px patches, 2 tiers, +4/block) — `src/core/anthropic-vision.ts`, sweep in `benchmarks/billing-sweep/`.
- ☑ Profitability gate with exact cost (replaced w·h/750 × 1.10).
- ☑ Per-tier geometry: Fable/Opus 4.8/Sonnet 5 → 1928×1928 pages; standard → 1568×728.
- ☑ `benchmarks/density-frontier/` harness (offline cost × accuracy via API, needles with confusable distractors, deterministic scoring) — now also runnable from the dashboard.

## Phase 1 — Multi-provider billing fixes (from the 2026-07-05 audit)

1. ☑ **D2 (inverted gate)**: `gpt-4o-mini` now bills at its documented tile 2833/5667 — imaging on it is always a loss and the gate blocks it (`src/core/gpt-model-profiles.ts`, README negative decisions).
2. ☑ **D5**: `detail` now comes from the model profile (`original` only where it exists) — `src/core/openai.ts`.
3. ☑ **D1**: `o4-mini` has its own **1.72** multiplier rule.
4. ☑ **D3/D4**: codex-mini variants moved to the patch bucket cap-1536; 5.x point releases handled by the documented bucket rules.
5. ☑ **GPT geometry**: `GPT_MAX_HEIGHT_PX = 2048` (aligns with both billing grids; +15 free rows vs the old 1932). The dedicated 5.4/5.5 `original` tall-page profile (up to 1568×5984) still wants a legibility A/B → ☐.
6. ◐ **Gemini**: billing profiles + density-frontier support landed (`src/core/gemini-model-profiles.ts`; 2.5-flash measured and blocked by the gate). Still pending: native `:generateContent`/`:streamGenerateContent` proxy routes ☐ — and the OpenAI-compat caution stands (wrong billing through the OpenAI transformer).

## Phase 2 — Reading quality (density-frontier as judge)

- ☑ std vs high-res A/B on Fable resolved (2×2 matrix below): production = standard page + **1-bit** atlas (`DENSE_RENDER_STYLE` flipped, pinned in `tests/dense-style.test.ts`); the high-res tier is a documented billing trap.
- ☑ AA vs 1-bit contradiction resolved by the same matrix.
- ☑ Light-theme A/B — resolved by inspection (render already black-on-white).
- ☑ Retry-on-refusal (upstream #37/H11): lossless replay sniffer + single retry; `refusalRetried` telemetry.
- ☑ Port of upstream #45: $schema/$id preserved, tuples stripped per element.
- ☐ Wordlist with checksum for byte-exact IDs (upstream #38, endorsed) + abstention banner (#31/#32) + camelCase in the factsheet (#33/#34).
- ☐ (DEFERRED 2026-07-06) Glyph surgery — production reads 30/30; nothing measurable to fix. Revisit only if a sub-100% target enters scope.
- ☐ Rehydrate tool (`RecoverableBlock` → callable tool; selective re-expansion).

## Phase 3 — Performance/robustness

- ☑ LRU render cache (deterministic pages; `tests/render-cache.test.ts`).
- ☑ Upstream port #44: typed native tools never get a `description` injected.
- ☐ Upstream ports still open: #42 (CONNECT proxy for Claude Desktop), #19 (GPT tool-description double-billing).
- ☐ PNG encode in a worker thread; configurable deflate level.
- ☐ ADAPTIVE_CPT_PLAN (cpt per block role; real slab = 1.50).

## Phase 4 — The fork itself

- ☑ Own name/repo (**OmniGlyph**), npm `omniglyph`, GitHub Packages mirror, trusted publishing with provenance.
- ☑ TS everywhere (only the build tooling remains `.mjs` by design).
- ☑ OmniRoute quality standard: lint + CI (typecheck/test/build), CONTRIBUTING, SECURITY, semantic CHANGELOG, README + docs in 41 languages, docs-integrity guard.
- ☑ GIFs in the README (quickstart + benchmarks) + dashboard screenshots.
- ☑ **Dashboard v2** — shipped beyond the original spec: sidebar app (6 pages), SSE instead of polling, image↔source inspector, sessions, mission-control cost panel, **benchmarks runnable from the UI**. Still open from the original idea: SQLite persistence with retention ☐, dashboard i18n ☐, "open terminal with ANTHROPIC_BASE_URL" launcher ☐.
- ◐ Micro-ideas: `omniglyph export` ships (offline render of a session); still open — `lines` mode (layout-preserving for code/tables), `--keep-ws`, per-page origin title, standalone `render file.md -o out.png` CLI.

## Phase 5 — Port to OmniRoute (SHIPPED as the `omniglyph` engine)

- ☑ `CompressionEngine` registered (single mode + stacked pipeline), fail-closed gates, image-aware token accounting; OmniRoute consumes the billing math from this package's root.
- ☑ Dependency bumped to `omniglyph@^1.0.2` (OmniRoute PR #6661).
- ☐ CCR synergy: `emitRecoverable` → CCR store with per-slice retrieval = full selective re-expansion.
- ☐ Free-tier stretching as a marketing feature (vision models yield ~2-3× more chars per free-tier token; Gemini free tier + 1152×1536 geometry is the strongest case — blocked on the Gemini proxy route above).

## Open risks (unchanged)

- Fable refusals post-redeploy in imaged context (upstream #37) — mitigated by the refusal retry; keep watching before default-on in OmniRoute.
- Price arbitrage: if Anthropic reprices vision, savings change — the per-request `count_tokens` counterfactual is the defense.
- OpenAI: community measurement saw completion tokens rise and 2× latency — measure per provider before enabling.

## A/B results 2026-07-05 (via OpenRouter — INCONCLUSIVE for geometry, valid for failure modes)

| config | verbatim | abst. | filtered | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA and 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predicted) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predicted) |
| opus hires 10×16 | **7/9 read** | 0 | 21 out of credits | 2 (digit) |

Valid findings: (1) the classifier (issue #37) is the DOMINANT failure mode
for transcription questions on the standard page — 100% filtered — and does
not fire on the large page; wording matters. (2) Abstention works: 20×
ILEGIVEL vs 5 confabulations on the large page. (3) Opus at 10×16 reads 78%
exact (n=9) vs 0% historical at 5×8 — first first-hand evidence of the knee.
(4) The large page's illegibility via OpenRouter suggests a transport
RESAMPLE (Bedrock/Vertex standard tier?) — decisive hypothesis to test on
Anthropic's direct API; the geometry A/B remains OPEN until then. OpenRouter
credits ran out mid Opus arm.

## Final 2×2 matrix (2026-07-05, via CLI/subscription, Fable 5, n=30/arm)

| page × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Zero confabulation across the 4 arms (120 questions — every miss was
ILEGIVEL). APPLIED: DENSE_RENDER_STYLE flipped to 1-bit (aa:false) with a
pin in tests/dense-style.test.ts. Opus 4.8: 26/30 at 10×16 on the large
page, 30/30 ILEGIVEL at 5×8 — Opus safe mode viable. The high-res page
remains degraded by the transports (CLI Read/OpenRouter resample); the
WYSIWYG geometry verdict still depends on the direct API.
