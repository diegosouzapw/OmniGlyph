# OmniGlyph — एकत्रित मोजमापे (2026-07-05)

या सत्रात MEASURED केलेले सर्व काही, स्रोत आणि n सह; गृहीतके शेवटी स्पष्टपणे
वेगळी केलेली. पावत्या: `benchmarks/billing-sweep/results/` आणि
`benchmarks/density-frontier/results/` (प्रति उत्तर JSONL).

## 1. Anthropic बिलिंग (direct count_tokens, $0, 11 भूमिती × 2 मॉडेल्स)

पुष्टी झालेले सूत्र: `tokens = ceil(w/28) × ceil(h/28)` प्रति-टियर रिसाइझनंतर,
**+3/ब्लॉक (Fable 5) / +4/ब्लॉक (Sonnet 4.5)** — सर्व ओळींमध्ये ZERO अवशेष.

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

व्युत्पन्न निर्णय (राबवलेले): अचूक per-patch गेट; प्रति-मॉडेल टियर
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. वाचन अचूकता (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 मॅट्रिक्स — CLI/subscription द्वारे, n=30/arm, समान कॉर्पस (~16.6k अक्षरे)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (मॅट्रिक्सने अंदाजित) |

→ **दोन्ही पानांवर 1-bit > AA; 120 प्रश्नांमध्ये शून्य confabulation.**
लागू केले: `DENSE_RENDER_STYLE` → `aa:false` (कमिट 9a25585).
⚠️ high-res transport resample द्वारे खराब पोहोचते (H1/H3 पहा); 67% ही एक
मजला आहे, कमाल मर्यादा नाही.

### Opus 4.8 — CLI/subscription द्वारे, n=30/arm

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee आमच्या स्वतःच्या n सह पुष्टी झाली (upstream ने n=20 सह 10×16
वर 95% मोजले होते). "Opus safe mode" व्यवहार्य आहे: मोठ्या पानावर 10×16
हार्नेस कॉर्पसवर ≈ प्रति image टोकन 1.7 अक्षरे.

### OpenRouter द्वारे (समान कॉर्पस/प्रश्न) — वाचनीयतेसाठी अनिर्णायक

| मोजलेले तथ्य | संख्या |
|---|---|
| transcription प्रश्नांवर content_filter (standard pages) | 60/60 (100%) |
| high-res pages वर content_filter | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (क्रेडिट्स संपण्यापूर्वी) | 7/9 exact (78%) |
| confusability मॅट्रिक्सने अंदाजित misreads | 4→a, 0→8, S/s case |

### Transport तुलना (समान प्रश्न, समान कंटेंट)

| transport | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, क्रेडिट्स संपण्यापूर्वी) | 0 | चाचणी केली नाही |
| OpenRouter | ~100% std / ~20% hi-res | नाही (संशयित: resample) |
| Claude Code CLI (subscription) | 0 content_filter; मोठ्या batches पैकी ~50% अडकले (10 च्या chunks + retry सह सोडवले) | नाही (संशयित: Read resizes) |

## 3. प्रति प्रदाता खर्च (ऑफलाइन, अचूक — पूर्ण पाने, सैद्धांतिक)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (सर्व मॉडेल्स) | 1460 | 28,080 | **19.2** | मोजलेले |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× कमी प्रतिमा) | बिलिंग मोजलेले; वाचनीयता प्रलंबित (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | ऑडिट केलेले docs |
| GPT-5.4/5.5 (patch, original) 1568×5984 पर्यंत | ~9,163 | ~233k | **25.4** | docs; वाचनीयता चाचणी न केलेली |
| gpt-4o-mini | 48,169/strip | — | **0.8 — कधीच इमेजिफाय करू नका** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← सर्वोत्तम दस्तऐवजीकृत** | docs; वाचनीयता चाचणी न केलेली |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (जर वाचनीय असेल तर)** | गृहीतक H6 |

## 4. सापडलेले आणि दुरुस्त केलेले बग्ज (अधिकृत docs विरुद्ध ऑडिट)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini डीफॉल्ट tile 85/170 मध्ये पडला (actual: 2833/5667) | खर्च ~33× कमी अंदाजित — **उलटा गेट** | e6bc75f |
| D1 | o4-mini गुणक 1.62 (actual 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) कॅप 10000 सह (actual 1536, no original) | मोठ्या पानांसह तुटले असते | e6bc75f |
| D4 | gpt-5-codex-mini tile रेजिममध्ये (actual: patch 1536) | ≥+23% कमी अंदाजित | e6bc75f |
| D5 | detail:'original' प्रत्येक मॉडेलसाठी hardcoded (फक्त 5.4+ मध्ये अस्तित्वात) | कराराबाहेर | e6bc75f |
| #44 | typed tools मध्ये description stub इंजेक्ट केलेला → 400 + मूक fallback | सिग्नलशिवाय बचत शून्य झाली | 0f66e32 |
| AA | "eval-only" टिप्पणीविरुद्ध उत्पादनात AA अॅटलास | Fable वर वाचनात −17pp | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + अतिरिक्त patch column | 312 वर दुरुस्त केले | baseline |

## 5. खुली गृहीतके (प्रत्येक बंद करण्यासाठी काय खर्च येतो)

| id | गृहीतक | सध्याचा पुरावा | निर्णायक चाचणी | खर्च |
|---|---|---|---|---|
| H1 | direct API वर 1928² पान standard ≥ वाचतो (WYSIWYG बिलिंगमध्ये सिद्ध) | resample शिवाय बिलिंग 4764; degraded असतानाही 1-bit आधीच 67% वाचतो | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | direct API वर hi-res + 1-bit ≈ 3.3× कमी प्रतिमांसह 100% | H1 + 2×2 मॅट्रिक्स | H1 प्रमाणेच | तेच |
| H3 | CLI चा Read आणि OpenRouter >1568/2000px प्रतिमा resize करतात | 5×8 मरतो आणि 10×16 त्याच पानावर टिकतो | प्रति transport 20×32 glyphs सह एक 1928² पान | ~US$0 (CLI) |
| H4 | Refusal framing वर अवलंबून असते (agent-reading-a-file ≈ 0% vs raw API ≈ 100%) | वरील transport तुलना | proxy पथावर wording A/B | कमी |
| H5 | Gemini tile 1533×1152 5×8 वर वाचनीय (42 chars/tok) | काहीही नाही | GEMINI_API_KEY सह density-frontier | ~मोफत (free tier) |
| H6 | media_resolution:low वाचनीय (116 chars/tok) | असंभाव्य (low-res encoder), पण कोणीही मोजले नाही | 1 call | ~मोफत |
| H7 | GPT: strip वाचनीयता + completion-token inflation (PageWatch धोका) | समुदायाने −40% prompt पण +completion/2× latency पाहिले | OPENAI_API_KEY सह density-frontier | ~US$2-5 |
| H8 | Glyph शस्त्रक्रिया (H~K, 0/8, 5/3…) abstentions ला reads मध्ये बदलते | 1-bit नंतर, सर्व Fable misses abstentions झाले | ~10 bitmaps संपादित करा + मॅट्रिक्स पुन्हा चालवा | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | साहित्य (Glyph paper, Tesseract); commercial VLM वर कधीही मोजलेले नाही | style flag + 2 arms | $0 (CLI) |
| H10 | 7×10 वर Opus 0% (5×8) आणि 87% (10×16) च्या मध्ये येतो → योग्य trade-off | upstream curve 35% at 7×10 (n=20) | 1 अतिरिक्त arm | $0 (CLI) |
| H11 | proxy मधील Retry-on-refusal filtered batches पैकी ~50% परत मिळवतो | refusal प्रति call stochastic आहे | उत्पादनात राबवा + मोजा | code |

## 6. कार्यरत प्रलंबित आयटम्स

1. `gh auth login` → खासगी `diegosouzapw/omniglyph` तयार करा + push करा (10 local commits).
2. Anthropic credits (H1/H2, भूमिती निर्णय) आणि OpenRouter (संपलेले).
3. **चॅटमध्ये उघड झालेल्या** Anthropic आणि OpenRouter **की फिरवा (rotate)**.
4. कोड queue: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   शस्त्रक्रिया (H8), टप्पा 4 (scripts मध्ये TS, GIFs, docs, dashboard v2), टप्पा 5
   (OmniRoute इंजिन).

## परिशिष्ट 2026-07-06 — direct API द्वारे A/B (165 calls): H1/H2 खंडित (REFUTED)

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA and 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

निर्णय: high-res टियरचे 1928² पान WYSIWYG प्रमाणे BILLED आहे (4764 tok,
sweep) पण ENCODER ला पूर्ण रिझोल्यूशन मिळत नाही — 1-2/30 वाचन, single-glyph
swap errors सह (6→8, a→4), अंतर्गत resample चा signature. **Billing ≠
encoder input → सापळा: 3.3× खर्च, वाईट वाचनीयता.** लागू केले:
pageGeometryForTier() मागे घेतले — दोन्ही टियर 1568×728 रेंडर करतात; tier
इन्फ्रा ठेवली (अचूक बिलिंग वैध राहते आणि भविष्यातील retune 1 ओळ आहे). H3
अद्ययावत केले: "transport resample" हे (देखील) API चे स्वतःचे encoder होते.
raw API द्वारे transcription वर Refusal: standard पानावर 100% (H4 अधिक
पुष्टी — फक्त agent framing सुटते). Opus 10×16 दोन्ही transports वर पुष्टी
झाले (77-87%).

## परिशिष्ट 2026-07-06 (2) — direct API द्वारे GPT-5.5 battery: H7 बंद (FAILED)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 glyphs वाचू शकत नाही (0/60; gist देखील टिकत नाही) आणि उलगडण्याच्या
प्रयत्नात completion ~40× फुगवतो (प्रति प्रश्न 2.4-2.7k reasoning tokens) —
prompt बचत output द्वारे गिळली जाते. परिपूर्ण text control सिद्ध करतो की
कॉर्पस/प्रश्न योग्य आहेत. 5.5 opt-in ची पुष्टी करतो आणि प्रमाणित करतो;
gpt-5.6 (default) अजूनही चाचणी न करण्यायोग्य आहे (account ला access नाही).
भविष्य (H12): GPT gate ने फक्त prompt tokens नव्हे तर output inflation
मॉडेल करणे आवश्यक आहे.

## परिशिष्ट 2026-07-06 (3) — Gemini 2.5-flash (आंशिक: free-tier quota मध्येच संपला)

quota मरण्यापूर्वी पोहोचलेल्या ~26 image answers पैकी: **0 बरोबर,
1 abstention, ~25 CONFABULATIONS** — आणि हे glyph confusions नाहीत: ते
random digits आहेत (`indexLedgerInd → 0040375615`), म्हणजे चाचणी केलेल्या
densities वर (native tile 42 chars/tok आणि MEDIUM flat) encoder जवळजवळ
काहीही पाहत नाही आणि 2.5-flash abstain करण्याऐवजी INVENTS करतो (ILEGIVEL
instruction दुर्लक्षित करतो). Text control: पोहोचलेल्यांपैकी 3/3. Output
inflation नाही (6-28 tok/answer).

प्राथमिक संकेत: H5/H6 2.5-flash वर NO कडे झुकतात, GPT पेक्षा WORSE failure
mode सह (abstention ऐवजी silent confabulation) — Gemini ला proxy मध्ये
अतिरिक्त safeguards हवे. बंद करणे प्रलंबित: paid quota सह किंवा दुसऱ्या
दिवशी पुन्हा चालवा, आणि gemini-2.5-pro चाचणी करा (flash हा कुटुंबातील
सर्वात कमकुवत reader आहे). Native-tile पानाचे अजूनही सर्वोत्तम DOCUMENTED
गुणोत्तर आहे (42.3 chars/token); वाचनीयतेबद्दलच शंका आहे.

खर्च टीप: tile रेजिम अंतर्गत आंशिक पाने (कॉर्पसचे शेवटचे) खराब बिल होतात
(कमी उंची → लहान crop unit → जास्त tiles) — जर Gemini आले तर शेवटच्या पानाला
1152px उंचीपर्यंत padding करणे अनिवार्य ऑप्टिमायझेशन आहे.
