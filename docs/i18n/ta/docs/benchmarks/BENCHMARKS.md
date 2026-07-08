# OmniGlyph — ஒருங்கிணைந்த அளவீடுகள் (2026-07-05)

🌐 Translated: [all languages](../../../README.md)

இந்த sessionஇல் MEASURED செய்யப்பட்ட அனைத்தும், source மற்றும் n உடன்; hypotheses
கடைசியில் தெளிவாக பிரிக்கப்பட்டுள்ளன. ஆதாரங்கள்: `benchmarks/billing-sweep/results/`
மற்றும் `benchmarks/density-frontier/results/` (ஒரு பதிலுக்கு JSONL).

## TL;DR — இரண்டு barsஇல் முழு முடிவு

**Cost** — ஒரு standard 1568×728 page 28,080 chars ஒரு flat 1,460 tokensக்காக
கொண்டுள்ளது; அதே உரையை raw ஆக அனுப்பினால் ~10× அதிகமாக செலவாகும்:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Accuracy** — ஆனால் மாடல் உண்மையில் pageஐப் படிக்கும் இடத்தில் மட்டுமே. Gate
fail-closed ஆகும்; ✅ row மட்டுமே ships ஆகிறது:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

இந்த documentஇன் மீதமுள்ளவை அந்த இரண்டு barsக்குப் பின்னால் உள்ள receipts ஆகும்.

## 1. Anthropic billing (direct count_tokens, $0, 11 geometries × 2 models)

உறுதிப்படுத்தப்பட்ட formula: per-tier resizeக்குப் பின் `tokens = ceil(w/28) × ceil(h/28)`,
**+3/block (Fable 5) / +4/block (Sonnet 4.5)** — அனைத்து rowsஇலும் பூஜ்ஜிய residual.

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
| 20×280²+2100² | — | 6824 (2100²→downscale, count_tokensஇல் NOT reject செய்யப்பட்டது) | 3585 |

பெறப்பட்ட முடிவுகள் (implement செய்யப்பட்டவை): exact per-patch gate; per-model tier
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Reading accuracy (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 matrix — CLI/subscription வழியாக, n=30/arm, same corpus (~16.6k chars)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (matrix மூலம் predicted) |

→ **இரண்டு pagesஇலும் 1-bit > AA; 120 questionsஇல் பூஜ்ஜிய confabulation.**
APPLIED: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res transport resample மூலம் degraded ஆக arrive செய்கிறது (H1/H3
பார்க்கவும்); 67% ஒரு floor, ceiling அல்ல.

### Opus 4.8 — CLI/subscription வழியாக, n=30/arm

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee நமது சொந்த n உடன் confirm செய்யப்பட்டது (upstream n=20உடன் 10×16இல்
95% measure செய்தது). "Opus safe mode" viable ஆகும்: harness corpusஇல் பெரிய
pageஇல் 10×16 ≈ image tokenக்கு 1.7 chars.

### OpenRouter வழியாக (அதே corpus/questions) — legibilityக்கு inconclusive

| measured fact | number |
|---|---|
| transcription questionsஇல் content_filter (standard pages) | 60/60 (100%) |
| high-res pagesஇல் content_filter | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (credits தீருவதற்கு முன்) | 7/9 exact (78%) |
| confusability matrix மூலம் predicted misreads | 4→a, 0→8, S/s case |

### Transport ஒப்பீடு (அதே question, அதே content)

| transport | filter/refusal | பெரிய page legible? |
|---|---|---|
| Direct API (n=9, credits தீருவதற்கு முன்) | 0 | test செய்யப்படவில்லை |
| OpenRouter | ~100% std / ~20% hi-res | இல்லை (சந்தேகிக்கப்படுவது: resample) |
| Claude Code CLI (subscription) | 0 content_filter; பெரிய batchesஇல் ~50% stall ஆனது (10இன் chunks + retry மூலம் தீர்க்கப்பட்டது) | இல்லை (சந்தேகிக்கப்படுவது: Read resizes) |

## 3. Provider ஒன்றுக்கு செலவு (offline, exact — FULL pages, theoretical)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (அனைத்து மாடல்களும்) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× குறைவான images) | billing measured; legibility நிலுவையில் (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) 1568×5984 வரை | ~9,163 | ~233k | **25.4** | docs; legibility test செய்யப்படவில்லை |
| gpt-4o-mini | 48,169/strip | — | **0.8 — ஒருபோதும் imageify செய்ய வேண்டாம்** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← சிறந்த documented** | docs; legibility test செய்யப்படவில்லை |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (legible ஆனால்)** | hypothesis H6 |

## 4. கண்டுபிடிக்கப்பட்டு fix செய்யப்பட்ட bugs (official docsக்கு எதிரான audit)

| id | bug | தாக்கம் | commit |
|---|---|---|---|
| D2 | gpt-4o-mini default tile 85/170இல் விழுந்தது (உண்மை: 2833/5667) | செலவு ~33× underestimated — **inverted gate** | e6bc75f |
| D1 | o4-mini multiplier 1.62 (உண்மை 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) cap 10000உடன் (உண்மை 1536, original இல்லாமல்) | பெரிய pagesஉடன் break ஆகும் | e6bc75f |
| D4 | gpt-5-codex-mini tile regimeஇல் (உண்மை: patch 1536) | ≥+23% underestimated | e6bc75f |
| D5 | detail:'original' ஒவ்வொரு மாடலுக்கும் hardcoded (5.4+இல் மட்டுமே உள்ளது) | contractக்கு வெளியே | e6bc75f |
| #44 | typed toolsஇல் description stub inject செய்யப்பட்டது → 400 + silent fallback | signal இல்லாமல் savings zero ஆனது | 0f66e32 |
| AA | "eval-only" commentக்கு எதிராக productionஇல் AA atlas | Fableஇல் −17pp reading | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + கூடுதல் patch column | 312க்கு fixed | baseline |

## 5. திறந்த hypotheses (ஒவ்வொன்றையும் close செய்ய எவ்வளவு செலவாகும்)

| id | hypothesis | தற்போதைய ஆதாரம் | decisive test | செலவு |
|---|---|---|---|---|
| H1 | 1928² page direct APIஇல் ≥ standard படிக்கிறது (billingஇல் WYSIWYG proven) | resample இல்லாமல் billing 4764; degraded ஆக இருந்தும் 1-bit ஏற்கனவே 67% படிக்கிறது | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | direct APIஇல் hi-res + 1-bit ≈ 100% 3.3× குறைவான imagesஉடன் | H1 + 2×2 matrix | H1 போலவே | அதே |
| H3 | CLIஇன் Read மற்றும் OpenRouter images >1568/2000pxஐ resize செய்கின்றன | 5×8 சாகிறது மற்றும் 10×16 SAME pageஇல் survive ஆகிறது | ஒரு 1928² page 20×32 glyphs ஒரு transportக்கு | ~US$0 (CLI) |
| H4 | Refusal framingஐ சார்ந்துள்ளது (agent-reading-a-file ≈ 0% vs raw API ≈ 100%) | மேலே transport ஒப்பீடு | real proxy pathஇல் wording A/B | low |
| H5 | Gemini tile 1533×1152 5×8இல் legible (42 chars/tok) | இல்லை | GEMINI_API_KEYஉடன் density-frontier | ~free (free tier) |
| H6 | media_resolution:low legible (116 chars/tok) | சாத்தியமில்லை (low-res encoder), ஆனால் யாரும் measure செய்யவில்லை | 1 call | ~free |
| H7 | GPT: strip legibility + completion-token inflation (PageWatch risk) | community −40% prompt ஆனால் +completion/2× latency பார்த்தது | OPENAI_API_KEYஉடன் density-frontier | ~US$2-5 |
| H8 | Glyph surgery (H~K, 0/8, 5/3…) abstentionsஐ readsஆக மாற்றுகிறது | 1-bitக்குப் பின், அனைத்து Fable missesஉம் abstentions ஆனது | ~10 bitmapsஐ edit செய்து matrixஐ மீண்டும் இயக்கவும் | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | literature (Glyph paper, Tesseract); ஒரு commercial VLMஇல் ஒருபோதும் measure செய்யப்படவில்லை | style flag + 2 arms | $0 (CLI) |
| H10 | Opus 7×10இல் 0% (5×8) மற்றும் 87% (10×16)க்கு இடையே இருக்கும் → fine trade-off | upstream curve 7×10இல் 35% (n=20) | 1 கூடுதல் arm | $0 (CLI) |
| H11 | Proxyஇல் Retry-on-refusal filtered batchesஇன் ~50%ஐ recover செய்கிறது | ஒவ்வொரு callக்கும் refusal stochastic ஆகும் | productionஇல் implement + measure செய்யவும் | code |

## 6. Operational pending items

1. `gh auth login` → private `diegosouzapw/omniglyph`ஐ உருவாக்கி → push செய்யவும் (10 local commits).
2. Anthropic credits (H1/H2, geometry verdict) மற்றும் OpenRouter (தீர்ந்துவிட்டது).
3. Chatஇல் வெளிப்பட்ட Anthropic மற்றும் OpenRouter **keysஐ rotate செய்யவும்**.
4. Code queue: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   surgery (H8), Phase 4 (scriptsஇல் TS, GIFs, docs, dashboard v2), Phase 5
   (OmniRoute engine).

## ADDENDUM 2026-07-06 — direct API வழியாக A/B (165 calls): H1/H2 REFUTED

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA மற்றும் 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VERDICT: high-res tierஇன் 1928² page WYSIWYG பில் செய்யப்படுகிறது (4764 tok,
sweep) ஆனால் ENCODER முழு resolutionஐப் பெறவில்லை — 1-2/30 படிக்கிறது,
single-glyph swap errorsஉடன் (6→8, a→4), ஒரு internal resampleஇன் signature.
**Billing ≠ encoder input → trap: 3.3× செலவு, மோசமான legibility.**
APPLIED: pageGeometryForTier() revert செய்யப்பட்டது — இரண்டு tiers-உம் 1568×728ஐ
render செய்கின்றன; tier infra வைக்கப்பட்டது (exact billing valid ஆகவே இருக்கிறது
மற்றும் எதிர்கால retune 1 line ஆகும்). H3 update செய்யப்பட்டது: "transport
resample" APIஇன் சொந்த encoderஆகவும் இருந்தது. Transcription raw APIஇல்
refusal: standard pageஇல் 100% (H4 reinforced — agent framing மட்டுமே தப்பிக்கிறது).
Opus 10×16 இரண்டு transportsஇலும் confirm செய்யப்பட்டது (77-87%).

## ADDENDUM 2026-07-06 (2) — direct API வழியாக GPT-5.5 battery: H7 closed (FAILED)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5-ஆல் 5×8 glyphsஐ படிக்க முடியாது (0/60; gist கூட survive ஆகவில்லை)
மற்றும் அவற்றை decipher செய்ய முயற்சிக்கும்போது completionஐ ~40× பெருக்குகிறது
(ஒரு questionக்கு 2.4-2.7k reasoning tokens) — prompt savings output மூலம்
விழுங்கப்படுகின்றன. Perfect text control corpus/questions sane என்பதை நிரூபிக்கிறது.
5.5 opt-inஐ confirm செய்து அளவிடுகிறது; gpt-5.6 (default) untestable ஆகவே
இருக்கிறது (accountக்கு access இல்லை). எதிர்காலம் (H12): GPT gate output
inflationஐ model செய்ய வேண்டும், prompt tokens மட்டும் அல்ல.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARTIAL: free-tier quota run நடுவில் தீர்ந்தது)

Quota இறப்பதற்கு முன் கிடைத்த ~26 image answersில்: **0 சரியானது,
1 abstention, ~25 CONFABULATIONS** — இவை glyph confusions அல்ல: இவை
random digits (`indexLedgerInd → 0040375615`), அதாவது encoder சோதிக்கப்பட்ட
densitiesஇல் (native tile 42 chars/tok மற்றும் MEDIUM flat) கிட்டத்தட்ட எதையும்
பார்க்கவில்லை மற்றும் 2.5-flash தவிர்ப்பதற்குப் பதிலாக INVENTS செய்கிறது
(ILEGIVEL instructionஐ ignore செய்கிறது). Text control: கிடைத்தவற்றில் 3/3.
Output inflation இல்லை (6-28 tok/answer).

Preliminary signal: H5/H6 2.5-flashஇல் NOக்கு சாய்கின்றன, GPTஐ விட
WORSE ஆன failure modeஉடன் (abstentionக்குப் பதிலாக silent confabulation) —
Geminiக்கு proxyஇல் கூடுதல் safeguards தேவைப்படும். Close செய்ய நிலுவையில்:
paid quotaஉடன் அல்லது வேறு நாளில் மீண்டும் இயக்கவும், மற்றும்
gemini-2.5-proஐ test செய்யவும் (flash family-இல் மிக பலவீனமான reader).
Native-tile pageக்கு இன்னும் சிறந்த DOCUMENTED ratio உள்ளது (42.3 chars/token);
சந்தேகத்தில் இருப்பது legibility ஆகும்.

Cost note: partial pages (corpusஇன் கடைசியது) tile regimeஇன் கீழ் மோசமாக
பில் செய்யப்படுகின்றன (குறுகிய height → சிறிய crop unit → அதிக tiles) —
கடைசி pageஐ 1152px heightக்கு padding செய்வது Gemini வந்தால் ஒரு கட்டாய
optimization ஆகும்.
