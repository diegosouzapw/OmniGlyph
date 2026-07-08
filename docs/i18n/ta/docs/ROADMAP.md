# Fork roadmap — "நமது OmniGlyph" + OmniRoute integration

ஒருங்கிணைந்த வேலைத் திட்டம் (2026-07-05) இவற்றிலிருந்து: அளவிடப்பட்ட billing sweep,
OpenAI/Gemini audit official docsக்கு எதிராக, தொடர்புடைய toolsஇன் பகுப்பாய்வு,
மற்றும் density-frontier harness. ஒவ்வொரு itemஇன் நிலை: ☐ pending · ◐ partial · ☑ இங்கு done.

## Phase 0 — அளவீட்டு அடித்தளம் (இந்த repoஇல் DONE)

- ☑ Exact Anthropic billing (28px patches, 2 tiers, +4/block) — `src/core/anthropic-vision.ts`, sweep `benchmarks/billing-sweep/`இல்.
- ☑ Exact costஉடன் Profitability gate (w·h/750 × 1.10-ஐ replace செய்தது).
- ☑ Per-tier geometry: Fable/Opus 4.8/Sonnet 5 → 1928×1928 பக்கங்கள் (3.3× குறைவான images); standard → 1568×728. 691 tests green.
- ☑ `benchmarks/density-frontier/` harness (API மூலம் offline cost × accuracy, confusable distractorsஉடன் needles, deterministic scoring).

## Phase 1 — Multi-provider billing fixes (auditஇல் confirm செய்யப்பட்ட bugs)

Priority auditஆல் அமைக்கப்பட்டது (official docs 2026-07-05இல் captured):

1. ☐ **D2 (INVERTED gate)**: `gpt-4o-mini` default tile 85/170இல் விழுகிறது, ஆனால் **2833 base / 5667 per tile** செலவாகிறது (~33× underestimated, ~0.8 char/token) — அதில் imaging எப்போதும் ஒரு loss மற்றும் gate அதை approve செய்கிறது. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` unconditionally அனுப்பப்படுகிறது (`src/core/openai.ts:392,402`), ஆனால் gpt-5.4+இல் மட்டுமே உள்ளது; அதை profileலிருந்து derive செய்யவும்.
3. ☐ **D1**: `o4-mini` multiplier 1.62 → **1.72** (5.8% underestimates).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` patch bucketஇல் உள்ளன **cap 1536 `original` இல்லாமல்** (code 10000 என்று assume செய்கிறது); `gpt-5-codex-mini` தவறான regimeஇல் உள்ளது (tile → patch).
5. ☐ **GPT geometry**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (இரண்டு regimesஉடனும் align ஆகிறது: 64×32 patches மற்றும் 4×512 tiles; +6.25% free chars). அர்ப்பணிக்கப்பட்ட 5.4/5.5 `original` profile: 1568×5984 வரை (9,163 patches ≤ 10k, ~233k chars ஒரே blockஇல்) — முதலில் legibility A/B.
6. ☐ **Gemini support** (புதியது): `src/core/gemini.ts` + `gemini-model-profiles.ts` + proxyஇல் `:generateContent`/`:streamGenerateContent` routes. Documentable geometry: **1152×1536 (exact crop unit 768, 4 tiles, 42.2 chars/token — 3 providersஇல் சிறந்த documented ratio)**; calibrate செய்ய bets: 768² `media_resolution:MEDIUM`உடன் (56.4) மற்றும் Gemini 3 HIGH. எச்சரிக்கை: Geminiஇன் OpenAI-compat endpoint தவறான billingஉடன் OpenAI transformer வழியாக செல்லும்.

## Phase 2 — Reading quality (density-frontier harness judgeஆக)

- ◐ Fableஇல் Decisive std vs high-res A/B (இயங்குகிறது; bar: gist == text AND zero silent-wrong AND savings > 0).
- ☐ dense pathஇல் AA vs 1-bit முரண்பாட்டைத் தீர்க்கவும் (code "eval-only" என்கிறது, production AA பயன்படுத்துகிறது).
- ☐ (rationale 2026-07-06உடன் DEFERRED) Glyph surgery: production config 30/30 padிக்கிறது — surgery fix செய்ய இன்று அளவிடக்கூடிய miss இல்லை. Sub-100% target scopeஇல் நுழைந்தால் (எ.கா. Opus) அல்லது புதிய measurements regression காட்டினால் revisit செய்யவும்.
- ☑ ~~Light-theme A/B~~ inspection மூலம் RESOLVED (2026-07-06): render ஏற்கனவே black-on-white (render.ts:635/822, post-blit invert) — literatureஉடன் aligned; hypothesis ஒரு தவறான premiseலிருந்து பிறந்தது (upstream example image).
- ☐ Byte-exact IDsக்கான checksumஉடன் Wordlist (upstream #38, endorsed) + abstention banner (#31/#32) + factsheetஇல் camelCase (#33/#34).
- ☑ Port #45: $schema/$id preserved, ஒவ்வொரு elementக்கும் tuples strip செய்யப்பட்டன (mainஇல் commit).
- ☑ Retry-on-refusal (#37/H11): lossless replay sniffer + அசல் bodyஉடன் single retry; refusalRetried telemetry (mainஇல் commit).
- ☐ Rehydrate tool (`RecoverableBlock` → callable tool; LensVLM selective re-expansionஐ validate செய்கிறது).

## Phase 3 — Performance/robustness

- ☐ LRU render cache (invariant மூலம் deterministic; slab + frozen chunks இன்று ஒவ்வொரு requestக்கும் re-render ஆகின்றன).
- ☐ Worker threadஇல் PNG encode; configurable deflate level.
- ☐ Open upstream fixes port செய்யவும்: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400 loop), #42 (Claude Desktopக்கான CONNECT proxy), #19 (GPT descriptions double-billing).
- ☐ ADAPTIVE_CPT_PLAN implement செய்யவும் (block roleக்கு cpt; real slab = 1.50).

## Phase 4 — Fork itself

- ☐ சொந்த பெயர்/repo (Diegoஇன் call) + cherry-picksக்கான upstream `git remote`.
- ☐ **எங்கும் TS**: core ஏற்கனவே TS, `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/`ஐ convert செய்யவும் (pattern: tsx + vitest; `benchmarks/density-frontier/` அந்த வழியில் பிறந்தது).
- ☐ OmniRoute quality standard: eslint 9 + prettier, typecheck/test/build/link-checkஉடன் CI, CONTRIBUTING, SECURITY, README i18n (pt-BR முதலில்), semantic CHANGELOG.
- ☐ README-இல் videosக்கு பதிலாக **GIFs** (vhs/asciinema+aggஉடன் record செய்யவும்; plain vs proxy side-by-side).
- ☐ Dashboard v2 (HTTP API வழியாக மீண்டும் implement செய்யவும் — மூன்றாம் தரப்பு codeஐ inherit செய்ய வேண்டாம்): "ANTHROPIC_BASE_URLஉடன் terminal திற" launcher, "traffic என் வழியாகச் செல்கிறதா?" check, image-vs-text inspector, sessions, currencyஇல் cost panel, light i18n, pollingக்கு பதிலாக SSE, retentionஉடன் SQLite persistence (அதன் 24-column schema ஒரு நல்ல தொடக்க புள்ளி).
- ☐ dense-image-genலிருந்து Micro-ideas: `lines` mode (code/tablesக்கு layout preserved), `--keep-ws`, per-page origin title ("system prompt" / "tool docs" / "history turn N"), standalone CLI `render arquivo.md -o out.png`.

## Phase 5 — OmniRouteக்கு Port

- ☐ `CompressionEngine` engine (`cavemanAdapter.ts` template), `engines/index.ts` + `engineCatalog.ts`இல் registered; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: `chatCore.ts:1297`இல் `supportsVision`ஐ pass செய்யவும் (1 line) அல்லது `isVisionModelId` மூலம் resolve செய்யவும்.
- ☐ Stack order: கடைசி (RTK/Caveman/semantic renderers முதலில்; OmniGlyph residualஐ imageify செய்கிறது).
- ☐ Invariants: clientஇன் `cache_control` உடன் blocksஐ ஒருபோதும் மறுஎழுத வேண்டாம் (lesson #4560); fidelity gate (#5127)க்கு ஒரு declared exemption அல்லது invariantsஐ satisfy செய்யும் text factsheet தேவை; `skip_reason`உடன் attempt telemetry (lesson #4268).
- ☐ Routing: post-engine fallback/retry vision capability மற்றும் allowlistஐ மதிக்க வேண்டும் (re-compress அல்லது bypass).
- ☐ CCR synergy: `emitRecoverable` → per-slice retrievalஉடன் CCR store (`head/tail/grep`, #5187) = full selective re-expansion.
- ☐ Marketing featureஆக Free-tier stretching: ஒவ்வொரு free-tier tokenஉம் vision modelsஇல் ~2-3× அதிக chars கொடுக்கிறது; Gemini free tier + 1152×1536 geometry வலிமையான case.

## திறந்த risks

- Redeploy-க்குப் பின் imaged contextஇல் Fable refusals (upstream #37) — OmniRouteஇல் default-onக்கு முன் mitigate செய்யவும்.
- Price arbitrage: Anthropic visionஐ reprice செய்தால், savings மாறும் — per-request counterfactual (`count_tokens`) defense ஆகும்.
- OpenAI: community measurement (PageWatch) completion tokens அதிகரிப்பதையும் 2× latencyஐயும் பார்த்தது — enable செய்வதற்கு முன் providerக்கு measure செய்யவும்.

## A/B results 2026-07-05 (OpenRouter வழியாக — geometryக்கு INCONCLUSIVE, failure modesக்கு valid)

| config | verbatim | abst. | filtered | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA மற்றும் 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predicted) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predicted) |
| opus hires 10×16 | **7/9 read** | 0 | 21 out of credits | 2 (digit) |

Valid findings: (1) classifier (issue #37) standard pageஇல் transcription கேள்விகளுக்கு DOMINANT failure mode ஆகும் — 100% filtered — மற்றும் பெரிய pageஇல் fire ஆகாது; wording matters. (2) Abstention வேலை செய்கிறது: பெரிய pageஇல் 20× ILEGIVEL vs 5 confabulations. (3) 10×16இல் Opus 78% exact படிக்கிறது (n=9) vs 5×8இல் 0% historical — knee-க்கான முதல் first-hand ஆதாரம். (4) OpenRouter வழியாக பெரிய pageஇன் illegibility ஒரு transport RESAMPLE (Bedrock/Vertex standard tier?) ஐ suggest செய்கிறது — Anthropicஇன் direct APIஇல் test செய்ய decisive hypothesis; geometry A/B அதுவரை OPEN ஆக இருக்கும். OpenRouter credits Opus arm பாதியில் தீர்ந்துவிட்டன.

## Final 2×2 matrix (2026-07-05, CLI/subscription வழியாக, Fable 5, n=30/arm)

| page × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

4 armsஇல் பூஜ்ஜிய confabulation (120 questions — ஒவ்வொரு miss-உம் ILEGIVEL). APPLIED: DENSE_RENDER_STYLE 1-bit (aa:false)க்கு flip செய்யப்பட்டது tests/dense-style.test.tsஇல் ஒரு pinஉடன். Opus 4.8: பெரிய pageஇல் 10×16இல் 26/30, 5×8இல் 30/30 ILEGIVEL — Opus safe mode viable. High-res page transportsஆல் (CLI Read/OpenRouter resample) degraded ஆக இருக்கிறது; WYSIWYG geometry verdict இன்னும் direct APIஐ சார்ந்துள்ளது.
