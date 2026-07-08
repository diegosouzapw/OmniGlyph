# OmniGlyph — समेकित माप (2026-07-05)

🌐 अनुवादित: [सभी भाषाएँ](../../../README.md)

इस सत्र में सब कुछ मापा गया, स्रोत और n के साथ; परिकल्पनाएँ स्पष्ट रूप से
अंत में अलग की गई हैं। रसीदें: `benchmarks/billing-sweep/results/` और
`benchmarks/density-frontier/results/` (प्रति उत्तर JSONL)।

## संक्षेप में — दो बार में पूरा परिणाम

**लागत** — एक मानक 1568×728 पेज एक फ़्लैट 1,460 टोकन के लिए 28,080
अक्षर रखता है; वही टेक्स्ट कच्चा भेजने पर ~10× ज़्यादा लागत आती है:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**सटीकता** — लेकिन केवल वहाँ जहाँ मॉडल वास्तव में पेज पढ़ता है। गेट
फ़ेल-क्लोज़्ड है; केवल ✅ पंक्ति शिप होती है:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

इस दस्तावेज़ का बाक़ी हिस्सा इन दो बार के पीछे की रसीदें हैं।

## 1. Anthropic बिलिंग (डायरेक्ट count_tokens, $0, 11 ज्यामिति × 2 मॉडल)

पुष्ट फ़ॉर्मूला: `tokens = ceil(w/28) × ceil(h/28)` प्रति-टियर रीसाइज़ के
बाद, **+3/ब्लॉक (Fable 5) / +4/ब्लॉक (Sonnet 4.5)** — हर पंक्ति में शून्य
अवशिष्ट।

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
| 20×280²+2100² | — | 6824 (2100²→downscale, NOT rejected in count_tokens) | 3585 |

व्युत्पन्न निर्णय (लागू): सटीक प्रति-पैच गेट; प्रति-मॉडल टियर
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312।

## 2. पठन सटीकता (density-frontier, hex/camelCase/digit सुइयाँ + विकर्षक)

### Fable 5 2×2 मैट्रिक्स — CLI/सब्सक्रिप्शन के ज़रिए, n=30/भुजा, एक ही कॉर्पस (~16.6k अक्षर)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (predicted by the matrix) |

→ **दोनों पेजों पर 1-bit > AA; 120 प्रश्नों में शून्य मनगढ़ंत उत्तर।**
लागू किया गया: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585)।
⚠️ हाई-रेस ट्रांसपोर्ट resample द्वारा घटिया आता है (देखें H1/H3) — 67%
एक फ़्लोर है, सीलिंग नहीं।

### Opus 4.8 — CLI/सब्सक्रिप्शन के ज़रिए, n=30/भुजा

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ अपने ही n के साथ Opus knee की पुष्टि हुई (अपस्ट्रीम ने 10×16 पर n=20
के साथ 95% मापा)। "Opus सुरक्षित मोड" व्यवहार्य है: हार्नेस कॉर्पस पर
बड़े पेज पर 10×16 ≈ प्रति छवि टोकन 1.7 अक्षर।

### OpenRouter के ज़रिए (वही कॉर्पस/प्रश्न) — पठनीयता के लिए अनिर्णायक

| measured fact | number |
|---|---|
| content_filter on transcription questions (standard pages) | 60/60 (100%) |
| content_filter on high-res pages | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (before credits ran out) | 7/9 exact (78%) |
| misreads predicted by the confusability matrix | 4→a, 0→8, S/s case |

### ट्रांसपोर्ट तुलना (एक ही प्रश्न, एक ही सामग्री)

| transport | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, before credits ran out) | 0 | not tested |
| OpenRouter | ~100% std / ~20% hi-res | no (suspected: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50% of large batches stalled (resolved with chunks of 10 + retry) | no (suspected: Read resizes) |

## 3. प्रति प्रोवाइडर लागत (ऑफ़लाइन, सटीक — पूरे पेज, सैद्धांतिक)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (all models) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× fewer images) | billing measured; legibility pending (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) up to 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibility untested |
| gpt-4o-mini | 48,169/strip | — | **0.8 — NEVER imageify** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← best documented** | docs; legibility untested |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (if legible)** | hypothesis H6 |

## 4. मिले और ठीक किए गए बग (आधिकारिक दस्तावेज़ों के विरुद्ध ऑडिट)

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

## 5. खुली परिकल्पनाएँ (हर एक को बंद करने की लागत)

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

## 6. परिचालन लंबित आइटम

1. `gh auth login` → निजी `diegosouzapw/omniglyph` बनाएँ + पुश करें (10 स्थानीय कमिट)।
2. Anthropic क्रेडिट (H1/H2, ज्यामिति निर्णय) और OpenRouter (समाप्त)।
3. चैट में उजागर हुई Anthropic और OpenRouter **कुंजियाँ घुमाएँ**।
4. कोड कतार: #45 (schema-strip draft-07), retry-on-refusal (H11), ग्लिफ़
   सर्जरी (H8), चरण 4 (स्क्रिप्ट में TS, GIF, दस्तावेज़, डैशबोर्ड v2), चरण 5
   (OmniRoute इंजन)।

## परिशिष्ट 2026-07-06 — डायरेक्ट API के ज़रिए A/B (165 कॉल): H1/H2 खंडित

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA and 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

निष्कर्ष: हाई-रेस टियर के 1928² पेज का बिल WYSIWYG लगता है (4764 tok,
sweep) लेकिन एन्कोडर को पूरा रिज़ॉल्यूशन नहीं मिलता — 1-2/30 पढ़ा गया,
सिंगल-ग्लिफ़ स्वैप त्रुटियों के साथ (6→8, a→4), एक आंतरिक resample का
हस्ताक्षर। **बिलिंग ≠ एन्कोडर इनपुट → जाल: 3.3× लागत, बदतर पठनीयता।**
लागू किया गया: pageGeometryForTier() वापस बदला गया — दोनों टियर 1568×728
रेंडर करते हैं; टियर इन्फ़्रा बना रहता है (सटीक बिलिंग वैध रहती है और
भविष्य की रीट्यून 1 लाइन है)। H3 अपडेट किया गया: "ट्रांसपोर्ट resample"
(भी) API का अपना एन्कोडर था। रॉ API के ज़रिए ट्रांसक्रिप्शन पर अस्वीकृति:
स्टैंडर्ड पेज पर 100% (H4 पुष्ट — केवल एजेंट फ़्रेमिंग बचती है)। Opus
10×16 दोनों ट्रांसपोर्ट पर पुष्ट (77-87%)।

## परिशिष्ट 2026-07-06 (2) — डायरेक्ट API के ज़रिए GPT-5.5 बैटरी: H7 बंद (विफल)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 ग्लिफ़ नहीं पढ़ सकता (0/60; gist भी नहीं बचता) और डिकोड करने
की कोशिश में कम्प्लीशन को ~40× फुला देता है (प्रति प्रश्न 2.4-2.7k
रीज़निंग टोकन) — प्रॉम्प्ट की बचत आउटपुट द्वारा निगल ली जाती है। परफ़ेक्ट
टेक्स्ट नियंत्रण साबित करता है कि कॉर्पस/प्रश्न सही हैं। 5.5 ऑप्ट-इन की
पुष्टि और मात्रा निर्धारण करता है; gpt-5.6 (डिफ़ॉल्ट) अनपरीक्षित रहता है
(खाते में पहुँच नहीं है)। भविष्य (H12): GPT गेट को केवल प्रॉम्प्ट टोकन
नहीं, आउटपुट फुलाव भी मॉडल करना चाहिए।

## परिशिष्ट 2026-07-06 (3) — Gemini 2.5-flash (आंशिक: मुफ़्त-टियर कोटा बीच में समाप्त)

रन के बीच में कोटा समाप्त होने से पहले प्राप्त हुए ~26 छवि उत्तरों में से:
**0 सही, 1 परहेज़, ~25 मनगढ़ंत उत्तर** — और ये ग्लिफ़ भ्रम नहीं हैं: ये
यादृच्छिक अंक हैं (`indexLedgerInd → 0040375615`), यानी एन्कोडर परीक्षित
घनत्वों पर लगभग कुछ नहीं देखता (नेटिव टाइल 42 अक्षर/टोकन और MEDIUM फ़्लैट)
और 2.5-flash परहेज़ करने के बजाय (ILEGIVEL निर्देश की अनदेखी करते हुए)
मनगढ़ंत उत्तर देता है। टेक्स्ट नियंत्रण: जो गुज़रे उनमें से 3/3। कोई आउटपुट
फुलाव नहीं (6-28 tok/answer)।

प्रारंभिक संकेत: H5/H6 2.5-flash पर NO की ओर झुकते हैं, GPT से भी बदतर
विफलता मोड के साथ (परहेज़ के बजाय मौन मनगढ़ंत उत्तर) — यदि Gemini शामिल
होता है तो प्रॉक्सी में अतिरिक्त सुरक्षा उपाय चाहिए होंगे। बंद करने के
लिए लंबित: भुगतान कोटा के साथ या किसी अन्य दिन दोबारा चलाएँ, और
gemini-2.5-pro का परीक्षण करें (flash परिवार में सबसे कमज़ोर पाठक है)।
नेटिव-टाइल पेज में अभी भी सबसे अच्छा दस्तावेज़ीकृत अनुपात है (42.3
अक्षर/टोकन); जो संदेह में है वह पठनीयता है।

लागत नोट: आंशिक पेज (कॉर्पस का अंतिम पेज) टाइल व्यवस्था में बुरी तरह
बिल होते हैं (कम ऊँचाई → छोटी क्रॉप यूनिट → अधिक टाइल) — यदि Gemini
शामिल होता है तो अंतिम पेज को 1152px ऊँचाई तक पैड करना एक अनिवार्य
अनुकूलन है।
