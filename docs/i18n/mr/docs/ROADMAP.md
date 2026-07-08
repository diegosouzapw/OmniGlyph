# फोर्क रोडमॅप — "आमचा OmniGlyph" + OmniRoute एकत्रीकरण

एकत्रित कार्य योजना (2026-07-05) यावरून: मोजलेला बिलिंग स्वीप,
अधिकृत दस्तऐवजांविरुद्ध OpenAI/Gemini ऑडिट, संबंधित टूल्सचे विश्लेषण,
आणि density-frontier हार्नेस. प्रत्येक आयटमची स्थिती: ☐ प्रलंबित · ◐ आंशिक · ☑ या रिपॉझिटरीत पूर्ण.

## टप्पा 0 — मोजमापाचा पाया (या रिपॉझिटरीत पूर्ण)

- ☑ अचूक Anthropic बिलिंग (28px पॅचेस, 2 टियर्स, +4/ब्लॉक) — `src/core/anthropic-vision.ts`, स्वीप `benchmarks/billing-sweep/` मध्ये.
- ☑ अचूक खर्चासह नफा गेट (बदलले w·h/750 × 1.10).
- ☑ प्रति-टियर भूमिती: Fable/Opus 4.8/Sonnet 5 → 1928×1928 पाने (3.3× कमी प्रतिमा); स्टँडर्ड → 1568×728. 691 चाचण्या हिरव्या.
- ☑ `benchmarks/density-frontier/` हार्नेस (API द्वारे ऑफलाइन खर्च × अचूकता, संभ्रमित distractors सह needles, निश्चयात्मक स्कोअरिंग).

## टप्पा 1 — बहु-प्रदाता बिलिंग फिक्सेस (ऑडिटमध्ये पुष्टी झालेले बग्ज)

ऑडिटने ठरवलेली प्राधान्य क्रमवारी (अधिकृत दस्तऐवज 2026-07-05 रोजी कॅप्चर केलेले):

1. ☐ **D2 (उलटा गेट)**: `gpt-4o-mini` डीफॉल्ट टाइल 85/170 मध्ये पडतो, पण खर्च **2833 बेस / 5667 प्रति टाइल** आहे (~33× कमी अंदाजित, ~0.8 अक्षर/टोकन) — त्यावर इमेजिंग नेहमीच तोटा असते आणि गेट ते मान्य करतो. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` बिनशर्त पाठवला जातो (`src/core/openai.ts:392,402`), पण तो फक्त gpt-5.4+ मध्ये अस्तित्वात आहे; तो प्रोफाइलवरून काढा.
3. ☐ **D1**: `o4-mini` गुणक 1.62 → **1.72** (5.8% ने कमी अंदाजित).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` हे पॅच बकेटमध्ये **कॅप 1536 `original` शिवाय** आहेत (कोड 10000 गृहीत धरतो); `gpt-5-codex-mini` चुकीच्या रेजिममध्ये आहे (टाइल → पॅच).
5. ☐ **GPT भूमिती**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (दोन्ही रेजिमशी जुळते: 64×32 पॅचेस आणि 4×512 टाइल्स; +6.25% मोफत अक्षरे). समर्पित 5.4/5.5 `original` प्रोफाइल: 1568×5984 पर्यंत (9,163 पॅचेस ≤ 10k, एका ब्लॉकमध्ये ~233k अक्षरे) — आधी वाचनीयता A/B.
6. ☐ **Gemini समर्थन** (नवीन): `src/core/gemini.ts` + `gemini-model-profiles.ts` + प्रॉक्सीमध्ये `:generateContent`/`:streamGenerateContent` रूट्स. दस्तऐवजीकरणयोग्य भूमिती: **1152×1536 (अचूक क्रॉप युनिट 768, 4 टाइल्स, 42.2 अक्षरे/टोकन — 3 प्रदात्यांपैकी सर्वोत्तम दस्तऐवजीकृत गुणोत्तर)**; कॅलिब्रेट करण्यासाठी अंदाज: `media_resolution:MEDIUM` सह 768² (56.4) आणि Gemini 3 HIGH. सावधानता: Gemini च्या OpenAI-सुसंगत एंडपॉइंटमधून चुकीच्या बिलिंगसह OpenAI ट्रान्सफॉर्मर वापरला जाईल.

## टप्पा 2 — वाचन गुणवत्ता (density-frontier हार्नेस निर्णायक म्हणून)

- ◐ Fable वर निर्णायक std vs high-res A/B (चालू आहे; बार: gist == मजकूर आणि शून्य मूक-चुकीचे आणि बचत > 0).
- ☐ दाट रेंडर पथातील AA vs 1-bit विरोधाभास सोडवा (कोड "eval-only" म्हणतो, उत्पादन AA वापरते).
- ☐ (2026-07-06 रोजी कारणासह पुढे ढकलले) Glyph शस्त्रक्रिया: उत्पादन कॉन्फिग 30/30 वाचतो — आज शस्त्रक्रियेने दुरुस्त करण्यासारखी कोणतीही मोजण्यायोग्य चूक नाही. व्याप्तीत sub-100% लक्ष्य आले (उदा. Opus) किंवा नवीन मोजमापांत घसरण दिसली तर पुन्हा विचार करा.
- ☑ ~~Light-theme A/B~~ तपासणीद्वारे सोडवले (2026-07-06): रेंडर आधीच black-on-white आहे (render.ts:635/822, post-blit invert) — साहित्याशी सुसंगत; गृहीतक चुकीच्या आधारावरून जन्माला आले होते (अपस्ट्रीम उदाहरण प्रतिमा).
- ☐ बाइट-अचूक ID साठी चेकसमसह वर्डलिस्ट (upstream #38, endorsed) + abstention बॅनर (#31/#32) + factsheet मध्ये camelCase (#33/#34).
- ☑ पोर्ट #45: $schema/$id जतन केले, प्रत्येक एलिमेंटसाठी tuples काढले (main वर कमिट).
- ☑ नकारावर पुनर्प्रयत्न (#37/H11): lossless replay sniffer + मूळ बॉडीसह एकच पुनर्प्रयत्न; refusalRetried टेलिमेट्री (main वर कमिट).
- ☐ Rehydrate टूल (`RecoverableBlock` → callable टूल; LensVLM निवडक पुनर्विस्ताराची पडताळणी करतो).

## टप्पा 3 — कामगिरी/मजबुती

- ☐ LRU रेंडर कॅशे (invariant नुसार निश्चयात्मक; slab + frozen chunks आज प्रत्येक विनंतीवर पुन्हा-रेंडर होतात).
- ☐ PNG एन्कोड worker thread मध्ये; कॉन्फिगर करण्यायोग्य deflate पातळी.
- ☐ खुले अपस्ट्रीम फिक्सेस पोर्ट करा: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400 loop), #42 (Claude Desktop साठी CONNECT प्रॉक्सी), #19 (GPT descriptions double-billing).
- ☐ ADAPTIVE_CPT_PLAN राबवा (प्रति ब्लॉक भूमिका cpt; वास्तविक slab = 1.50).

## टप्पा 4 — फोर्क स्वतः

- ☐ स्वतःचे नाव/रिपॉझिटरी (Diego चा निर्णय) + cherry-picks साठी upstream `git remote`.
- ☐ **सर्वत्र TS**: कोर आधीच TS आहे, `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` रूपांतरित करा (नमुना: tsx + vitest; `benchmarks/density-frontier/` याच पद्धतीने जन्माला आले).
- ☐ OmniRoute गुणवत्ता मानक: eslint 9 + prettier, typecheck/test/build/link-check सह CI, CONTRIBUTING, SECURITY, README i18n (आधी pt-BR), सिमँटिक CHANGELOG.
- ☐ README मध्ये व्हिडिओऐवजी **GIFs** (vhs/asciinema+agg ने रेकॉर्ड करा; plain vs proxy बाजूबाजूला).
- ☐ Dashboard v2 (HTTP API द्वारे पुन्हा राबवा — तृतीय-पक्ष कोड वारसा घेऊ नका): "ANTHROPIC_BASE_URL सह टर्मिनल उघडा" लाँचर, "ट्रॅफिक माझ्यामार्गे जात आहे का?" तपासणी, image-vs-text इन्स्पेक्टर, सत्रे, चलनातील खर्च पॅनेल, हलके i18n, पोलिंगऐवजी SSE, रिटेन्शनसह SQLite persistence (त्याचा 24-column स्कीमा एक चांगली सुरुवात आहे).
- ☐ dense-image-gen मधील मायक्रो-कल्पना: `lines` मोड (कोड/तक्त्यांसाठी लेआउट जतन केलेला), `--keep-ws`, प्रति-पान मूळ शीर्षक ("system prompt" / "tool docs" / "history turn N"), स्वतंत्र CLI `render arquivo.md -o out.png`.

## टप्पा 5 — OmniRoute मध्ये पोर्ट करा

- ☐ `CompressionEngine` इंजिन (`cavemanAdapter.ts` टेम्पलेट), `engines/index.ts` + `engineCatalog.ts` मध्ये नोंदणीकृत; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ प्लंबिंग: `chatCore.ts:1297` मध्ये `supportsVision` पास करा (1 ओळ) किंवा `isVisionModelId` द्वारे रिझॉल्व्ह करा.
- ☐ स्टॅक क्रम: शेवटी (RTK/Caveman/semantic renderers आधी; OmniGlyph उर्वरित इमेजिफाय करतो).
- ☐ Invariants: क्लायंटचे `cache_control` ब्लॉक्स कधीच पुन्हा लिहू नका (धडा #4560); fidelity gate (#5127) ला घोषित सूट किंवा invariants समाधानी करणारी text factsheet हवी; `skip_reason` सह प्रयत्न टेलिमेट्री (धडा #4268).
- ☐ राउटिंग: इंजिननंतरचा fallback/retry vision क्षमता आणि allowlist चा आदर करणे आवश्यक आहे (re-compress किंवा bypass).
- ☐ CCR synergy: `emitRecoverable` → प्रति-slice पुनर्प्राप्तीसह CCR store (`head/tail/grep`, #5187) = पूर्ण निवडक पुनर्विस्तार.
- ☐ मार्केटिंग फीचर म्हणून मोफत-टियर स्ट्रेचिंग: प्रत्येक मोफत-टियर टोकन vision मॉडेल्सवर ~2-3× जास्त अक्षरे देतो; Gemini मोफत टियर + 1152×1536 भूमिती हा सर्वात मजबूत केस आहे.

## खुले धोके

- Imaged संदर्भात redeploy नंतर Fable नकार (upstream #37) — OmniRoute मध्ये डीफॉल्ट-ऑन करण्यापूर्वी कमी करा.
- किंमत आर्बिट्राज: जर Anthropic ने vision पुनर्किंमत केली, तर बचत बदलते — प्रति-विनंती काउंटरफॅक्च्युअल (`count_tokens`) हा बचाव आहे.
- OpenAI: समुदाय मोजमापाने (PageWatch) कम्प्लीशन टोकन्स वाढताना आणि 2× विलंब दिसला — सक्षम करण्यापूर्वी प्रति प्रदाता मोजा.

## A/B निकाल 2026-07-05 (OpenRouter द्वारे — भूमितीसाठी अनिर्णायक, अपयश मोडसाठी वैध)

| कॉन्फिग | verbatim | abst. | filtered | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA and 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 predicted) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 predicted) |
| opus hires 10×16 | **7/9 read** | 0 | 21 out of credits | 2 (digit) |

वैध निष्कर्ष: (1) classifier (issue #37) हा transcription प्रश्नांसाठी स्टँडर्ड
पानावरील प्रमुख अपयश मोड आहे — 100% filtered — आणि मोठ्या पानावर तो सक्रिय होत
नाही; शब्दरचना महत्त्वाची आहे. (2) Abstention काम करते: मोठ्या पानावर 20×
ILEGIVEL वि 5 confabulations. (3) Opus 10×16 वर 78% अचूक वाचतो (n=9) वि 5×8
वर ऐतिहासिक 0% — knee चा पहिला प्रत्यक्ष पुरावा. (4) OpenRouter द्वारे मोठ्या
पानाची अवाचनीयता एक transport RESAMPLE (Bedrock/Vertex standard tier?) सुचवते
— Anthropic च्या direct API वर चाचणी करण्यासाठीचे निर्णायक गृहीतक; भूमिती A/B
तोपर्यंत OPEN राहते. Opus arm च्या मध्येच OpenRouter क्रेडिट्स संपले.

## अंतिम 2×2 मॅट्रिक्स (2026-07-05, CLI/subscription द्वारे, Fable 5, n=30/arm)

| पान × अॅटलास | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

4 आर्म्समध्ये (120 प्रश्न — प्रत्येक चूक ILEGIVEL होती) शून्य confabulation.
लागू केले: DENSE_RENDER_STYLE 1-bit (aa:false) मध्ये फ्लिप केले,
tests/dense-style.test.ts मध्ये पिन केलेले. Opus 4.8: मोठ्या पानावर 10×16 वर
26/30, 5×8 वर 30/30 ILEGIVEL — Opus safe mode व्यवहार्य. मोठे पान अजूनही
transports (CLI Read/OpenRouter resample) द्वारे खराब होते — WYSIWYG
भूमितीचा निर्णय अजूनही direct API वर अवलंबून आहे.
