# Fork roadmap — "our OmniGlyph" + OmniRoute integration

Consolidated work plan (2026-07-05) from: measured billing sweep,
OpenAI/Gemini audit against official docs, analysis of related tools,
and the density-frontier harness. Status of each item: ☐ pending · ◐ partial · ☑ done here.

## Phase 0 — Measurement foundation (DONE in this repo)

- ☑ Exact Anthropic billing (28px patches, 2 tiers, +4/block) — `src/core/anthropic-vision.ts`, sweep in `benchmarks/billing-sweep/`.
- ☑ Profitability gate with exact cost (replaced w·h/750 × 1.10).
- ☑ Per-tier geometry: Fable/Opus 4.8/Sonnet 5 → 1928×1928 pages (3.3× fewer images); standard → 1568×728. 691 tests green.
- ☑ `benchmarks/density-frontier/` harness (offline cost × accuracy via API, needles with confusable distractors, deterministic scoring).

## Phase 1 — Multi-provider billing fixes (bugs confirmed in the audit)

Priority set by the audit (official docs captured 2026-07-05):

1. ☐ **D2 (INVERTED gate)**: `gpt-4o-mini` falls into the default tile 85/170, but costs **2833 base / 5667 per tile** (~33× underestimated, ~0.8 char/token) — imaging on it is always a loss and the gate approves it. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` is sent unconditionally (`src/core/openai.ts:392,402`), but only exists in gpt-5.4+; derive it from the profile.
3. ☐ **D1**: `o4-mini` multiplier 1.62 → **1.72** (underestimates by 5.8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` are in the patch bucket **cap 1536 without `original`** (code assumes 10000); `gpt-5-codex-mini` is in the wrong regime (tile → patch).
5. ☐ **GPT geometry**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (aligns with BOTH regimes: 64×32 patches and 4×512 tiles; +6.25% free chars). Dedicated 5.4/5.5 `original` profile: up to 1568×5984 (9,163 patches ≤ 10k, ~233k chars in one block) — legibility A/B first.
6. ☐ **Gemini support** (new): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent` routes in the proxy. Documentable geometry: **1152×1536 (exact crop unit 768, 4 tiles, 42.2 chars/token — best documented ratio of the 3 providers)**; bets to calibrate: 768² with `media_resolution:MEDIUM` (56.4) and Gemini 3 HIGH. Caution: Gemini's OpenAI-compat endpoint would go through the OpenAI transformer with wrong billing.

## Phase 2 — Reading quality (density-frontier harness as judge)

- ◐ Decisive std vs high-res A/B on Fable (running; bar: gist == text AND zero silent-wrong AND savings > 0).
- ☐ Resolve the AA vs 1-bit contradiction in the dense path (code says "eval-only", production uses AA).
- ☐ (DEFERRED with rationale 2026-07-06) Glyph surgery: the production config reads 30/30 — there is no measurable miss for the surgery to fix today. Revisit if a sub-100% target enters scope (e.g. Opus) or if new measurements show a regression.
- ☑ ~~Light-theme A/B~~ RESOLVED by inspection (2026-07-06): the render ALREADY IS black-on-white (render.ts:635/822, post-blit invert) — aligned with the literature; the hypothesis was born from a wrong premise (upstream example image).
- ☐ Wordlist with checksum for byte-exact IDs (upstream #38, endorsed) + abstention banner (#31/#32) + camelCase in the factsheet (#33/#34).
- ☑ Port #45: $schema/$id preserved, tuples stripped per element (commit on main).
- ☑ Retry-on-refusal (#37/H11): lossless replay sniffer + single retry with the original body; refusalRetried telemetry (commit on main).
- ☐ Rehydrate tool (`RecoverableBlock` → callable tool; LensVLM validates selective re-expansion).

## Phase 3 — Performance/robustness

- ☐ LRU render cache (deterministic by invariant; slab + frozen chunks re-render on every request today).
- ☐ PNG encode in a worker thread; configurable deflate level.
- ☐ Port open upstream fixes: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400 loop), #42 (CONNECT proxy for Claude Desktop), #19 (GPT descriptions double-billing).
- ☐ Implement ADAPTIVE_CPT_PLAN (cpt per block role; real slab = 1.50).

## Phase 4 — The fork itself

- ☐ Own name/repo (Diego's call) + upstream `git remote` for cherry-picks.
- ☐ **TS everywhere**: the core is already TS; convert `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (pattern: tsx + vitest; `benchmarks/density-frontier/` was born that way).
- ☐ OmniRoute quality standard: eslint 9 + prettier, CI with typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR first), semantic CHANGELOG.
- ☐ **GIFs instead of videos** in the README (record with vhs/asciinema+agg; side-by-side plain vs proxy).
- ☐ Dashboard v2 (reimplement via HTTP API — do not inherit third-party code): "open terminal with ANTHROPIC_BASE_URL" launcher, "is the traffic going through me?" check, image-vs-text inspector, sessions, cost panel in currency, light i18n, SSE instead of polling, SQLite persistence with retention (its 24-column schema is a good starting point).
- ☐ Micro-ideas from dense-image-gen: `lines` mode (layout preserved for code/tables), `--keep-ws`, per-page origin title ("system prompt" / "tool docs" / "history turn N"), standalone CLI `render arquivo.md -o out.png`.

## Phase 5 — Port to OmniRoute

- ☐ `CompressionEngine` engine (`cavemanAdapter.ts` template), registered in `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: pass `supportsVision` in `chatCore.ts:1297` (1 line) or resolve via `isVisionModelId`.
- ☐ Stack order: last (RTK/Caveman/semantic renderers first; OmniGlyph imageifies the residual).
- ☐ Invariants: never rewrite blocks with the client's `cache_control` (lesson #4560); the fidelity gate (#5127) needs a declared exemption or a text factsheet that satisfies the invariants; attempt telemetry with `skip_reason` (lesson #4268).
- ☐ Routing: post-engine fallback/retry must respect vision capability and the allowlist (re-compress or bypass).
- ☐ CCR synergy: `emitRecoverable` → CCR store with per-slice retrieval (`head/tail/grep`, #5187) = full selective re-expansion.
- ☐ Free-tier stretching as a marketing feature: each free-tier token yields ~2-3× more chars on vision models; Gemini free tier + 1152×1536 geometry is the strongest case.

## Open risks

- Fable refusals post-redeploy in imaged context (upstream #37) — mitigate before default-on in OmniRoute.
- Price arbitrage: if Anthropic reprices vision, the savings change — the per-request counterfactual (`count_tokens`) is the defense.
- OpenAI: community measurement (PageWatch) saw completion tokens rise and 2× latency — measure per provider before enabling.

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
