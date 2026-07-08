# Fork roadmap — "our OmniGlyph" + OmniRoute integration

એકીકૃત work plan (2026-07-05) આમાંથી: માપેલું billing sweep,
OpenAI/Gemini audit સત્તાવાર docs સામે, સંબંધિત tools નું વિશ્લેષણ,
અને density-frontier harness. દરેક item ની સ્થિતિ: ☐ pending · ◐ partial · ☑ done here.

## Phase 0 — Measurement foundation (આ repo માં DONE)

- ☑ Exact Anthropic billing (28px patches, 2 tiers, +4/block) — `src/core/anthropic-vision.ts`, sweep `benchmarks/billing-sweep/` માં.
- ☑ Exact cost સાથે Profitability gate (w·h/750 × 1.10 ને replace કર્યું).
- ☑ Per-tier geometry: Fable/Opus 4.8/Sonnet 5 → 1928×1928 pages (3.3× ઓછી images); standard → 1568×728. 691 tests green.
- ☑ `benchmarks/density-frontier/` harness (offline cost × accuracy API દ્વારા, confusable distractors સાથે needles, ડિટરમિનિસ્ટિક સ્કોરિંગ).

## Phase 1 — Multi-provider billing fixes (audit માં confirm થયેલા bugs)

Priority audit દ્વારા set (સત્તાવાર docs 2026-07-05 ના captured):

1. ☐ **D2 (INVERTED gate)**: `gpt-4o-mini` default tile 85/170 માં પડે છે, પણ ખરેખર **2833 base / 5667 per tile** ખર્ચ કરે છે (~33× underestimated, ~0.8 char/token) — તેના પર imaging હંમેશા loss છે અને gate તેને approve કરે છે. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` unconditionally મોકલવામાં આવે છે (`src/core/openai.ts:392,402`), પણ ફક્ત gpt-5.4+ માં જ exist કરે છે; તેને profile માંથી derive કરો.
3. ☐ **D1**: `o4-mini` multiplier 1.62 → **1.72** (5.8% underestimate કરે છે).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` patch bucket **cap 1536 વગર `original`** માં છે (code 10000 ધારે છે); `gpt-5-codex-mini` ખોટા regime માં છે (tile → patch).
5. ☐ **GPT geometry**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (બંને regimes સાથે align: 64×32 patches અને 4×512 tiles; +6.25% free chars). Dedicated 5.4/5.5 `original` profile: 1568×5984 સુધી (9,163 patches ≤ 10k, એક block માં ~233k chars) — legibility A/B પહેલા.
6. ☐ **Gemini support** (નવું): `src/core/gemini.ts` + `gemini-model-profiles.ts` + proxy માં `:generateContent`/`:streamGenerateContent` routes. Documentable geometry: **1152×1536 (exact crop unit 768, 4 tiles, 42.2 chars/token — 3 providers માંનો શ્રેષ્ઠ documented ratio)**; calibrate કરવા માટેની bets: `media_resolution:MEDIUM` (56.4) સાથે 768² અને Gemini 3 HIGH. સાવધાની: Gemini નું OpenAI-compat endpoint ખોટા billing સાથે OpenAI transformer માંથી પસાર થશે.

## Phase 2 — Reading quality (judge તરીકે density-frontier harness)

- ◐ Fable પર Decisive std vs high-res A/B (ચાલી રહ્યું છે; bar: gist == text AND zero silent-wrong AND savings > 0).
- ☐ dense path માં AA vs 1-bit contradiction resolve કરો (code "eval-only" કહે છે, production AA વાપરે છે).
- ☐ (2026-07-06 rationale સાથે DEFERRED) Glyph surgery: production config 30/30 વાંચે છે — surgery એ fix કરવા માટે આજે કોઈ measurable miss નથી. જો sub-100% target scope માં આવે (દા.ત. Opus) અથવા નવા measurements regression બતાવે તો revisit કરો.
- ☑ ~~Light-theme A/B~~ inspection (2026-07-06) દ્વારા RESOLVED: render ALREADY IS black-on-white (render.ts:635/822, post-blit invert) — literature સાથે aligned; hypothesis ખોટા premise (upstream example image) માંથી જન્મી હતી.
- ☐ Byte-exact IDs માટે checksum સાથે Wordlist (upstream #38, endorsed) + abstention banner (#31/#32) + factsheet માં camelCase (#33/#34).
- ☑ Port #45: $schema/$id preserved, tuples per element stripped (main પર commit).
- ☑ Retry-on-refusal (#37/H11): lossless replay sniffer + મૂળ body સાથે single retry; refusalRetried telemetry (main પર commit).
- ☐ Rehydrate tool (`RecoverableBlock` → callable tool; LensVLM selective re-expansion validate કરે છે).

## Phase 3 — Performance/robustness

- ☐ LRU render cache (invariant દ્વારા deterministic; slab + frozen chunks આજે દરેક request પર re-render થાય છે).
- ☐ Worker thread માં PNG encode; configurable deflate level.
- ☐ Open upstream fixes port કરો: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400 loop), #42 (Claude Desktop માટે CONNECT proxy), #19 (GPT descriptions double-billing).
- ☐ ADAPTIVE_CPT_PLAN implement કરો (block role દીઠ cpt; real slab = 1.50).

## Phase 4 — Fork પોતે

- ☐ પોતાનું name/repo (Diego નો call) + cherry-picks માટે upstream `git remote`.
- ☐ **દરેક જગ્યાએ TS**: core પહેલેથી જ TS છે, `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` convert કરો (pattern: tsx + vitest; `benchmarks/density-frontier/` એ રીતે જન્મી હતી).
- ☐ OmniRoute quality standard: eslint 9 + prettier, typecheck/test/build/link-check સાથે CI, CONTRIBUTING, SECURITY, README i18n (pt-BR પહેલા), semantic CHANGELOG.
- ☐ README માં videos ને બદલે **GIFs** (vhs/asciinema+agg સાથે record કરો; side-by-side plain vs proxy).
- ☐ Dashboard v2 (HTTP API દ્વારા reimplement — third-party code inherit ન કરો): "open terminal with ANTHROPIC_BASE_URL" launcher, "is the traffic going through me?" check, image-vs-text inspector, sessions, currency માં cost panel, light i18n, polling ને બદલે SSE, retention સાથે SQLite persistence (તેની 24-column schema એક સારો starting point છે).
- ☐ dense-image-gen માંથી Micro-ideas: `lines` mode (code/tables માટે layout preserved), `--keep-ws`, per-page origin title ("system prompt" / "tool docs" / "history turn N"), standalone CLI `render arquivo.md -o out.png`.

## Phase 5 — OmniRoute માં Port કરો

- ☐ `CompressionEngine` engine (`cavemanAdapter.ts` template), `engines/index.ts` + `engineCatalog.ts` માં registered; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: `chatCore.ts:1297` (1 line) માં `supportsVision` pass કરો અથવા `isVisionModelId` દ્વારા resolve કરો.
- ☐ Stack order: last (RTK/Caveman/semantic renderers પહેલા; OmniGlyph residual ને imageify કરે છે).
- ☐ Invariants: client ના `cache_control` સાથે blocks ને ક્યારેય rewrite ન કરો (lesson #4560); fidelity gate (#5127) ને declared exemption અથવા invariants satisfy કરતી text factsheet જોઈએ; `skip_reason` સાથે attempt telemetry (lesson #4268).
- ☐ Routing: post-engine fallback/retry એ vision capability અને allowlist નું સન્માન કરવું જ જોઈએ (re-compress અથવા bypass).
- ☐ CCR synergy: `emitRecoverable` → per-slice retrieval સાથે CCR store (`head/tail/grep`, #5187) = પૂરું selective re-expansion.
- ☐ Marketing feature તરીકે Free-tier stretching: દરેક free-tier token vision models પર ~2-3× વધુ chars આપે છે; Gemini free tier + 1152×1536 geometry સૌથી મજબૂત case છે.

## ખુલ્લા risks

- Imaged context માં post-redeploy Fable refusals (upstream #37) — OmniRoute માં default-on પહેલા mitigate કરો.
- Price arbitrage: જો Anthropic vision ને reprice કરે, તો savings બદલાય છે — per-request counterfactual (`count_tokens`) એ defense છે.
- OpenAI: community measurement (PageWatch) એ completion tokens વધતા અને 2× latency જોયું — enable કરતા પહેલા provider દીઠ measure કરો.

## A/B results 2026-07-05 (OpenRouter દ્વારા — geometry માટે INCONCLUSIVE, failure modes માટે valid)

| config | verbatim | abst. | filtered | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA and 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predicted) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predicted) |
| opus hires 10×16 | **7/9 read** | 0 | 21 out of credits | 2 (digit) |

Valid findings: (1) classifier (issue #37) એ standard page પર transcription
questions માટે DOMINANT failure mode છે — 100% filtered — અને large page
પર fire નથી થતું; wording matters. (2) Abstention કામ કરે છે: large page
પર 20× ILEGIVEL vs 5 confabulations. (3) Opus 10×16 પર 78% exact વાંચે છે
(n=9) vs 5×8 પર 0% historical — knee નો પ્રથમ first-hand પુરાવો. (4) Large
page ની illegibility OpenRouter દ્વારા transport RESAMPLE (Bedrock/Vertex
standard tier?) સૂચવે છે — Anthropic ના direct API પર ટેસ્ટ કરવા યોગ્ય
decisive hypothesis; geometry A/B ત્યાં સુધી OPEN રહે છે. OpenRouter
credits Opus arm ની વચ્ચે ખતમ થયા.

## Final 2×2 matrix (2026-07-05, CLI/subscription દ્વારા, Fable 5, n=30/arm)

| page × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

4 arms (120 questions — દરેક miss ILEGIVEL હતું) માં zero confabulation.
APPLIED: DENSE_RENDER_STYLE ને 1-bit (aa:false) માં flip કરેલું,
tests/dense-style.test.ts માં pin સાથે. Opus 4.8: large page પર 10×16
પર 26/30, 5×8 પર 30/30 ILEGIVEL — Opus safe mode viable. High-res page
transports (CLI Read/OpenRouter resample) દ્વારા હજુ degraded છે; WYSIWYG
geometry verdict હજુ direct API પર આધાર રાખે છે.
