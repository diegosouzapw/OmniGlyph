# OmniGlyph — એકીકૃત measurements (2026-07-05)

🌐 અનુવાદિત: [બધી ભાષાઓ](../../../README.md)

આ session માં બધું MEASURED, source અને n સાથે; hypotheses અંતે સ્પષ્ટ
રીતે અલગ. રસીદ: `benchmarks/billing-sweep/results/` અને
`benchmarks/density-frontier/results/` (પ્રતિ-જવાબ JSONL).

## TL;DR — બે bars માં આખું પરિણામ

**Cost** — એક standard 1568×728 page 28,080 chars ને flat 1,460 tokens
માટે ધરાવે છે; એ જ text raw મોકલવામાં ~10× વધુ ખર્ચ થાય છે:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Accuracy** — પણ ફક્ત ત્યાં જ જ્યાં model ખરેખર page વાંચે છે. Gate
fail-closed છે; ફક્ત ✅ row ship થાય છે:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

આ document નો બાકીનો ભાગ એ બે bars પાછળની રસીદો છે.

## 1. Anthropic billing (direct count_tokens, $0, 11 geometries × 2 models)

Confirmed formula: per-tier resize પછી `tokens = ceil(w/28) × ceil(h/28)`,
**+3/block (Fable 5) / +4/block (Sonnet 4.5)** — બધી rows પર ZERO
residual.

| probe | dims | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc anchor | 1092×1092 | 1524 | 1525 |
| doc anchor | 1000×1000 | 1299 | 1300 |
| standard page | 1568×728 | 1459 | 1460 |
| **large page** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res ceiling | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res long edge | 2576×1204 | 3959 | 1516 |
| tall strip | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, count_tokens માં REJECT નથી થયું) | 3585 |

Derived decisions (implemented): exact per-patch gate; per-model tier
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Reading accuracy (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 matrix — CLI/subscription દ્વારા, n=30/arm, same corpus (~16.6k chars)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (matrix દ્વારા predicted) |

→ **બંને pages પર 1-bit > AA; 120 questions માં zero confabulation.**
APPLIED: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res transport resample દ્વારા degraded આવે છે (જુઓ H1/H3); 67% એક
floor છે, ceiling નહીં.

### Opus 4.8 — CLI/subscription દ્વારા, n=30/arm

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee અમારા own n સાથે confirmed (upstream એ n=20 સાથે 10×16 પર
95% માપ્યું). "Opus safe mode" viable છે: large page પર harness corpus
પર image token દીઠ ≈ 1.7 chars.

### OpenRouter દ્વારા (same corpus/questions) — legibility માટે inconclusive

| measured fact | number |
|---|---|
| transcription questions પર content_filter (standard pages) | 60/60 (100%) |
| high-res pages પર content_filter | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (credits ખતમ થયા પહેલા) | 7/9 exact (78%) |
| confusability matrix દ્વારા predicted misreads | 4→a, 0→8, S/s case |

### Transport comparison (same question, same content)

| transport | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, credits ખતમ થયા પહેલા) | 0 | tested નથી |
| OpenRouter | ~100% std / ~20% hi-res | ના (શંકા: resample) |
| Claude Code CLI (subscription) | 0 content_filter; large batches નો ~50% stall (chunks of 10 + retry સાથે resolved) | ના (શંકા: Read resizes) |

## 3. Cost per provider (offline, exact — FULL pages, theoretical)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (all models) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× ઓછી images) | billing measured; legibility pending (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) up to 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibility untested |
| gpt-4o-mini | 48,169/strip | — | **0.8 — ક્યારેય imageify ન કરવું** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← શ્રેષ્ઠ documented** | docs; legibility untested |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (જો legible)** | hypothesis H6 |

## 4. Bugs મળ્યા અને fix થયા (સત્તાવાર docs સામે audit)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini default tile 85/170 માં પડ્યું (actual: 2833/5667) | cost ~33× underestimated — **inverted gate** | e6bc75f |
| D1 | o4-mini multiplier 1.62 (actual 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) cap 10000 સાથે (actual 1536, original વગર) | મોટા pages સાથે તૂટે | e6bc75f |
| D4 | gpt-5-codex-mini tile regime માં (actual: patch 1536) | ≥+23% underestimated | e6bc75f |
| D5 | detail:'original' દરેક મોડેલ માટે hardcoded (ફક્ત 5.4+ માં exist કરે) | contract બહાર | e6bc75f |
| #44 | typed tools માં description stub inject થયું → 400 + silent fallback | savings કોઈ signal વગર zeroed | 0f66e32 |
| AA | "eval-only" comment સામે production માં AA atlas | Fable પર −17pp reading | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + extra patch column | 312 પર fixed | baseline |

## 5. ખુલ્લા hypotheses (દરેક ને close કરવાનો ખર્ચ)

| id | hypothesis | current evidence | decisive test | cost |
|---|---|---|---|---|
| H1 | 1928² page direct API પર standard જેટલું અથવા વધુ વાંચે છે (billing માં WYSIWYG સાબિત) | resample વગર billing 4764; 1-bit degraded હોવા છતાં પણ 67% વાંચે છે | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | direct API પર hi-res + 1-bit ≈ 100%, 3.3× ઓછી images સાથે | H1 + 2×2 matrix | H1 જેવું જ | same |
| H3 | CLI નું Read અને OpenRouter images >1568/2000px resize કરે છે | 5×8 મરે છે અને 10×16 SAME page પર survive કરે છે | 20×32 glyphs સાથે એક 1928² page, દરેક transport પર | ~US$0 (CLI) |
| H4 | Refusal framing પર આધાર રાખે છે (agent-reading-a-file ≈ 0% vs raw API ≈ 100%) | ઉપરની transport comparison | real proxy path પર wording A/B | low |
| H5 | Gemini tile 1533×1152 5×8 પર legible (42 chars/tok) | none | GEMINI_API_KEY સાથે density-frontier | ~free (free tier) |
| H6 | media_resolution:low legible (116 chars/tok) | unlikely (low-res encoder), પણ કોઈએ માપ્યું નથી | 1 call | ~free |
| H7 | GPT: strip legibility + completion-token inflation (PageWatch risk) | community એ −40% prompt પણ +completion/2× latency જોયું | OPENAI_API_KEY સાથે density-frontier | ~US$2-5 |
| H8 | Glyph surgery (H~K, 0/8, 5/3…) abstentions ને reads માં convert કરે છે | 1-bit પછી, બધા Fable misses abstentions બન્યા | ~10 bitmaps edit કરો + matrix ફરીથી run કરો | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | literature (Glyph paper, Tesseract); commercial VLM પર ક્યારેય measured નથી | style flag + 2 arms | $0 (CLI) |
| H10 | Opus 7×10 પર 0% (5×8) અને 87% (10×16) વચ્ચે lands → fine trade-off | upstream curve 7×10 પર 35% (n=20) | 1 extra arm | $0 (CLI) |
| H11 | Proxy માં Retry-on-refusal filtered batches ના ~50% recover કરે છે | refusal call દીઠ stochastic છે | implement + production માં measure | code |

## 6. Operational pending items

1. `gh auth login` → ખાનગી `diegosouzapw/omniglyph` બનાવો + push (10 local commits).
2. Anthropic credits (H1/H2, geometry verdict) અને OpenRouter (ખતમ).
3. Chat માં expose થયેલી Anthropic અને OpenRouter **keys rotate કરો**.
4. Code queue: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   surgery (H8), Phase 4 (scripts માં TS, GIFs, docs, dashboard v2), Phase 5
   (OmniRoute engine).

## ADDENDUM 2026-07-06 — direct API દ્વારા A/B (165 calls): H1/H2 REFUTED

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA and 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VERDICT: high-res tier નું 1928² page WYSIWYG બિલ થાય છે (4764 tok,
sweep) પણ ENCODER ને પૂરું resolution મળતું નથી — 1-2/30 વાંચે છે,
single-glyph swap errors સાથે (6→8, a→4), internal resample ની signature.
**Billing ≠ encoder input → trap: 3.3× cost, ખરાબ legibility.**
APPLIED: pageGeometryForTier() revert થયું — બંને tiers 1568×728 રેન્ડર
કરે છે; tier infra રાખેલું (exact billing હજુ valid છે અને future
retune 1 line છે). H3 update: "transport resample" (પણ) API નું own
encoder હતું. Raw API દ્વારા transcription પર Refusal: standard page
પર 100% (H4 reinforced — ફક્ત agent framing escape કરે છે). બંને
transports પર Opus 10×16 confirmed (77-87%).

## ADDENDUM 2026-07-06 (2) — direct API દ્વારા GPT-5.5 battery: H7 closed (FAILED)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 glyphs વાંચી શકતું નથી (0/60; gist પણ survive થતું નથી) અને
decipher કરવાના પ્રયત્નમાં completion ~40× ફુલાવે છે (પ્રશ્ન દીઠ
2.4-2.7k reasoning tokens) — prompt savings output દ્વારા ખાઈ જવાય છે.
Perfect text control સાબિત કરે છે કે corpus/questions sane છે. 5.5
opt-in ને confirm અને quantify કરે છે; gpt-5.6 (default) untestable રહે
છે (account ને access નથી). Future (H12): GPT gate એ ફક્ત prompt tokens
નહીં, output inflation ને model કરવું જોઈએ.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARTIAL: free-tier quota મધ્યમાં ખતમ થયું)

Quota મરી જતા પહેલા પસાર થયેલા ~26 image answers માંથી: **0 correct,
1 abstention, ~25 CONFABULATIONS** — અને એ glyph confusions નથી: તે
random digits છે (`indexLedgerInd → 0040375615`), એટલે કે tested
densities પર encoder લગભગ કંઈ જોતું નથી (native tile 42 chars/tok અને
MEDIUM flat) અને 2.5-flash abstain કરવાને બદલે INVENTS કરે છે (ILEGIVEL
instruction ignore કરે છે). Text control: પસાર થયેલા પર 3/3. કોઈ output
inflation નહીં (6-28 tok/answer).

Preliminary signal: H5/H6 2.5-flash પર NO તરફ ઝુકે છે, GPT કરતાં WORSE
failure mode સાથે (abstention ને બદલે silent confabulation) — Gemini ને
proxy માં extra safeguards ની જરૂર પડશે. Close કરવા બાકી: paid quota
સાથે અથવા બીજા દિવસે ફરીથી run કરો, અને gemini-2.5-pro ટેસ્ટ કરો (flash
family માં સૌથી weak reader છે). Native-tile page હજુ સૌથી શ્રેષ્ઠ
DOCUMENTED ratio ધરાવે છે (42.3 chars/token); legibility જ doubt માં છે.

Cost note: partial pages (corpus નું છેલ્લું) tile regime હેઠળ ખરાબ
રીતે bill થાય છે (ટૂંકી height → નાનું crop unit → વધુ tiles) — છેલ્લા
page ને 1152px height સુધી pad કરવું ફરજિયાત optimization છે જો Gemini
આવે તો.
