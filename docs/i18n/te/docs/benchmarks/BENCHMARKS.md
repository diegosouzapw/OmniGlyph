# OmniGlyph — Consolidated measurements (2026-07-05)

🌐 అనువదించబడింది: [అన్ని భాషలు](../../../README.md)

ఈ సెషన్‌లో MEASURED అయిన ప్రతిదీ, సోర్స్ మరియు nతో సహా; పరికల్పనలు
చివర్లో స్పష్టంగా వేరు చేయబడ్డాయి. రసీదులు: `benchmarks/billing-sweep/results/`
మరియు `benchmarks/density-frontier/results/` (సమాధానానికి JSONL).

## TL;DR — రెండు బార్‌లలో మొత్తం ఫలితం

**కాస్ట్** — ఒక స్టాండర్డ్ 1568×728 పేజీ 28,080 అక్షరాలను ఫ్లాట్
1,460 టోకెన్‌లకు మోస్తుంది; అదే టెక్స్ట్ రా రూపంలో పంపితే ~10×
ఎక్కువ ఖర్చవుతుంది:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**ఖచ్చితత్వం** — కానీ మోడల్ నిజంగా పేజీని చదివేచోట మాత్రమే. గేట్
fail-closed; కేవలం ✅ రో మాత్రమే ప్రొడక్షన్‌కు వెళుతుంది:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

ఈ డాక్యుమెంట్‌లో మిగిలినది ఈ రెండు బార్‌ల వెనుక ఉన్న రసీదులు.

## 1. Anthropic బిల్లింగ్ (direct count_tokens, $0, 11 geometries × 2 models)

నిర్ధారించిన ఫార్ములా: `tokens = ceil(w/28) × ceil(h/28)` టైర్‌కు రీసైజ్
తర్వాత, **+3/బ్లాక్ (Fable 5) / +4/బ్లాక్ (Sonnet 4.5)** — అన్ని రోలలోనూ
అవశేషం ZERO.

| ప్రోబ్ | dims | Fable 5 (high-res) | Sonnet 4.5 (standard) |
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
| 20×280²+2100² | — | 6824 (2100²→downscale, NOT rejected in count_tokens) | 3585 |

తీసుకున్న నిర్ణయాలు (అమలు చేయబడ్డాయి): ఖచ్చితమైన ప్యాచ్-ప్రకారం గేట్;
మోడల్‌కు టైర్ (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols`
313→312.

## 2. రీడింగ్ ఖచ్చితత్వం (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 మ్యాట్రిక్స్ — via CLI/subscription, n=30/arm, same corpus (~16.6k chars)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (predicted by the matrix) |

→ **రెండు పేజీలలోనూ 1-bit > AA; 120 ప్రశ్నలలో సున్నా confabulation.**
అమలు చేయబడింది: `DENSE_RENDER_STYLE` → `aa:false` (కమిట్ 9a25585).
⚠️ హై-రెస్ ట్రాన్స్‌పోర్ట్ resample ద్వారా దిగజారి వస్తుంది (H1/H3
చూడండి) — 67% అనేది ఒక ఫ్లోర్, సీలింగ్ కాదు.

### Opus 4.8 — via CLI/subscription, n=30/arm

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee మా సొంత nతో నిర్ధారించబడింది (అప్‌స్ట్రీమ్ n=20తో 10×16
వద్ద 95% కొలిచింది). "Opus safe mode" సాధ్యమే: హార్నెస్ కార్పస్‌పై
పెద్ద పేజీలో 10×16 ఇమేజ్ టోకెన్‌కు ≈ 1.7 అక్షరాలు.

### Via OpenRouter (same corpus/questions) — legibility కోసం అనిర్ధారితం

| measured fact | number |
|---|---|
| content_filter on transcription questions (standard pages) | 60/60 (100%) |
| content_filter on high-res pages | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (before credits ran out) | 7/9 exact (78%) |
| misreads predicted by the confusability matrix | 4→a, 0→8, S/s case |

### ట్రాన్స్‌పోర్ట్ పోలిక (same question, same content)

| transport | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, before credits ran out) | 0 | not tested |
| OpenRouter | ~100% std / ~20% hi-res | no (suspected: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50% of large batches stalled (resolved with chunks of 10 + retry) | no (suspected: Read resizes) |

## 3. ప్రొవైడర్‌కు కాస్ట్ (offline, exact — FULL pages, theoretical)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (all models) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× fewer images) | billing measured; legibility pending (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) up to 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibility untested |
| gpt-4o-mini | 48,169/strip | — | **0.8 — NEVER imageify** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← best documented** | docs; legibility untested |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (if legible)** | hypothesis H6 |

## 4. కనుగొన్న మరియు సరిచేసిన బగ్‌లు (అధికారిక డాక్స్‌కు వ్యతిరేకంగా ఆడిట్)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini fell into the default tile 85/170 (actual: 2833/5667) | cost underestimated ~33× — **inverted gate** | e6bc75f |
| D1 | o4-mini multiplier 1.62 (actual 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) with cap 10000 (actual 1536, no original) | would break with larger pages | e6bc75f |
| D4 | gpt-5-codex-mini in the tile regime (actual: patch 1536) | ≥+23% underestimated | e6bc75f |
| D5 | detail:'original' hardcoded for every model (only exists in 5.4+) | out of contract | e6bc75f |
| #44 | description stub injected into typed tools → 400 + silent fallback | savings zeroed with no signal | 0f66e32 |
| AA | AA atlas in production against the "eval-only" comment | −17pp reading on Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + extra patch column | fixed to 312 | baseline |

## 5. ఓపెన్ పరికల్పనలు (ప్రతిదాన్ని మూసివేయడానికి అయ్యే ఖర్చు)

| id | hypothesis | current evidence | decisive test | cost |
|---|---|---|---|---|
| H1 | The 1928² page reads ≥ standard on the direct API (WYSIWYG proven in billing) | billing 4764 with no resample; 1-bit already reads 67% even degraded | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit on the direct API ≈ 100% with 3.3× fewer images | H1 + 2×2 matrix | same as H1 | same |
| H3 | The CLI's Read and OpenRouter resize images >1568/2000px | 5×8 dies and 10×16 survives ON THE SAME page | one 1928² page with 20×32 glyphs per transport | ~US$0 (CLI) |
| H4 | Refusal depends on framing (agent-reading-a-file ≈ 0% vs raw API ≈ 100%) | transport comparison above | wording A/B on the real proxy path | low |
| H5 | Gemini tile 1533×1152 legible at 5×8 (42 chars/tok) | none | density-frontier with GEMINI_API_KEY | ~free (free tier) |
| H6 | media_resolution:low legible (116 chars/tok) | unlikely (low-res encoder), but nobody measured it | 1 call | ~free |
| H7 | GPT: strip legibility + completion-token inflation (PageWatch risk) | community saw −40% prompt but +completion/2× latency | density-frontier with OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyph surgery (H~K, 0/8, 5/3…) converts abstentions into reads | after 1-bit, ALL Fable misses became abstentions | edit ~10 bitmaps + re-run the matrix | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | literature (Glyph paper, Tesseract); never measured on a commercial VLM | style flag + 2 arms | $0 (CLI) |
| H10 | Opus at 7×10 lands between 0% (5×8) and 87% (10×16) → fine trade-off | upstream curve 35% at 7×10 (n=20) | 1 extra arm | $0 (CLI) |
| H11 | Retry-on-refusal in the proxy recovers the ~50% of filtered batches | refusal is stochastic per call | implement + measure in production | code |

## 6. ఆపరేషనల్ పెండింగ్ ఐటమ్‌లు

1. `gh auth login` → ప్రైవేట్ `diegosouzapw/omniglyph` సృష్టించండి + పుష్
   చేయండి (10 లోకల్ కమిట్‌లు).
2. Anthropic క్రెడిట్‌లు (H1/H2, జ్యామితి తీర్పు) మరియు OpenRouter
   (అయిపోయాయి).
3. **చాట్‌లో బహిర్గతమైన** Anthropic మరియు OpenRouter **కీలను రొటేట్
   చేయండి**.
4. కోడ్ క్యూ: #45 (schema-strip draft-07), retry-on-refusal (H11),
   గ్లిఫ్ సర్జరీ (H8), Phase 4 (స్క్రిప్ట్‌లలో TS, GIFలు, డాక్స్,
   డాష్‌బోర్డ్ v2), Phase 5 (OmniRoute ఇంజిన్).

## ADDENDUM 2026-07-06 — A/B via direct API (165 calls): H1/H2 REFUTED

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA and 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

తీర్పు: హై-రెస్ టైర్ యొక్క 1928² పేజీ WYSIWYG బిల్ చేయబడుతుంది (4764
టోకెన్, స్వీప్) కానీ ENCODER పూర్తి రిజల్యూషన్‌ను అందుకోదు — 1-2/30
చదవగలిగింది, సింగిల్-గ్లిఫ్ స్వాప్ ఎర్రర్‌లతో (6→8, a→4), ఇది ఒక
అంతర్గత resample యొక్క సంతకం. **బిల్లింగ్ ≠ ఎన్‌కోడర్ ఇన్‌పుట్ → ఉచ్చు:
3.3× ఖర్చు, అధ్వాన్నమైన చదవగలిగే స్థాయి.** అమలు చేయబడింది:
pageGeometryForTier() రివర్ట్ చేయబడింది — రెండు టైర్లూ 1568×728
రెండర్ చేస్తాయి; టైర్ ఇన్‌ఫ్రా ఉంచబడింది (ఖచ్చితమైన బిల్లింగ్ ఇంకా
చెల్లుతుంది మరియు భవిష్యత్ రీట్యూన్ 1 లైన్). H3 అప్‌డేట్ చేయబడింది:
"ట్రాన్స్‌పోర్ట్ resample" (కూడా) APIయొక్క సొంత ఎన్‌కోడర్. raw APIలో
ట్రాన్స్‌క్రిప్షన్‌పై రిఫ్యూజల్: స్టాండర్డ్ పేజీలో 100% (H4
బలపరచబడింది — ఏజెంట్ ఫ్రేమింగ్ మాత్రమే తప్పించుకుంటుంది). రెండు
ట్రాన్స్‌పోర్ట్‌లలోనూ Opus 10×16 నిర్ధారించబడింది (77-87%).

## ADDENDUM 2026-07-06 (2) — GPT-5.5 battery via direct API: H7 closed (FAILED)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 గ్లిఫ్‌లను చదవలేదు (0/60; gist కూడా బతకలేదు) మరియు వాటిని
అర్థం చేసుకోవడానికి ప్రయత్నిస్తూ కంప్లీషన్‌ను ~40× ఉబ్బిస్తుంది
(ప్రశ్నకు 2.4-2.7k రీజనింగ్ టోకెన్‌లు) — ప్రాంప్ట్ సేవింగ్స్ అవుట్‌పుట్
ద్వారా మింగివేయబడతాయి. పర్‌ఫెక్ట్ టెక్స్ట్ కంట్రోల్ కార్పస్/ప్రశ్నలు
సరైనవని రుజువు చేస్తుంది. 5.5 ఆప్ట్-ఇన్‌ను నిర్ధారిస్తుంది మరియు
లెక్కిస్తుంది; gpt-5.6 (డిఫాల్ట్) ఇంకా టెస్ట్ చేయలేనిదిగానే ఉంది
(ఖాతాకు యాక్సెస్ లేదు). భవిష్యత్తు (H12): GPT గేట్ కేవలం ప్రాంప్ట్
టోకెన్‌లనే కాకుండా అవుట్‌పుట్ ఇన్‌ఫ్లేషన్‌ను కూడా మోడల్ చేయాలి.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARTIAL: free-tier quota blew mid-run)

క్వోటా చనిపోయే ముందు వచ్చిన ~26 ఇమేజ్ సమాధానాలలో: **0 సరైనవి, 1
ఆబ్‌స్టెన్షన్, ~25 CONFABULATIONS** — మరియు ఇవి గ్లిఫ్ గందరగోళాలు
కావు: ఇవి యాదృచ్ఛిక అంకెలు (`indexLedgerInd → 0040375615`), అంటే
టెస్ట్ చేసిన సాంద్రతలలో (నేటివ్ టైల్ 42 అక్షరాలు/టోకెన్ మరియు MEDIUM
ఫ్లాట్) ఎన్‌కోడర్‌కు దాదాపు ఏమీ కనిపించడం లేదు, మరియు 2.5-flash
ఆబ్‌స్టెయిన్ చేయడానికి బదులు INVENTS చేస్తుంది (ILEGIVEL సూచనను
విస్మరిస్తుంది). టెక్స్ట్ కంట్రోల్: వచ్చినవాటిలో 3/3. అవుట్‌పుట్
ఇన్‌ఫ్లేషన్ లేదు (సమాధానానికి 6-28 టోకెన్‌లు).

ప్రాథమిక సంకేతం: H5/H6 2.5-flashపై NO వైపు మొగ్గు చూపుతున్నాయి, GPT
కంటే WORSE ఫెయిల్యూర్ మోడ్‌తో (ఆబ్‌స్టెన్షన్‌కు బదులు నిశ్శబ్ద
confabulation) — Gemini ప్రాక్సీలో అదనపు సేఫ్‌గార్డ్‌లు అవసరం
కావచ్చు. మూసివేయాల్సినవి పెండింగ్‌లో ఉన్నాయి: చెల్లింపు కోటాతో లేదా
మరో రోజు మళ్లీ రన్ చేయడం, మరియు gemini-2.5-proను టెస్ట్ చేయడం (flash
కుటుంబంలో బలహీనమైన రీడర్). నేటివ్-టైల్ పేజీకి ఇప్పటికీ ఉత్తమ
DOCUMENTED నిష్పత్తి ఉంది (42.3 అక్షరాలు/టోకెన్); సందేహంలో ఉన్నది
చదవగలిగే స్థాయియే.

Cost note: పాక్షిక పేజీలు (కార్పస్‌లో చివరిది) టైల్ రెజీమ్‌లో చెడుగా
బిల్ చేయబడతాయి (తక్కువ ఎత్తు → చిన్న క్రాప్ యూనిట్ → ఎక్కువ టైల్‌లు)
— Gemini వస్తే చివరి పేజీని 1152px ఎత్తుకు పాడింగ్ చేయడం తప్పనిసరి
ఆప్టిమైజేషన్.
