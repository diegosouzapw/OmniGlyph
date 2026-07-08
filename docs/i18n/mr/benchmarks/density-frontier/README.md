# density-frontier — प्रति रिझोल्यूशन खर्च × अचूकता

एक हार्नेस जो text→image रेंडर्सच्या **खर्च आणि वाचनीयता यांच्यातील Pareto
frontier** मोजतो, प्रति प्रदाता (Anthropic / OpenAI / Gemini), पान भूमिती,
glyph cell, आणि atlas शैलीनुसार.

मध्यवर्ती असममितता: billing sweep (2026-07-05, `benchmarks/billing-sweep/`)
पासून, **खर्च ऑफलाइन अगदी अचूक अंदाजयोग्य आहे** — Anthropic वर 28 px patches
+ 4/block (`src/core/anthropic-vision.ts`), OpenAI वर patch/tile profiles
(`src/core/openai.ts`), Gemini वर tiles/media_resolution (`gemini-cost.ts`).
फक्त **वाचन अचूकतेसाठी** API लागते.

## डिझाइन

- **कॉर्पस** (`corpus.ts`): confusability matrix नुसार अपयशी ठरणाऱ्या
  वर्गांमधून पेरलेले घन log/JSON-style filler + needles (12-char hex,
  camelCase, digits 6/8/5/3) + मोजलेल्या confusable जोड्यांवरून तयार
  केलेले **near-miss distractors**. जर मॉडेलने distractor सह उत्तर दिले,
  तर confusion *predicted* होते — तोच शोधला जाणारा silent failure mode
  आहे, फक्त चुकीचे मोजले जात नाही. निश्चयात्मक (mulberry32).
- **कॉन्फिग्ज** (`configs.ts`): क्युरेटेड ग्रिड — standard 1568×728 pages
  vs high-res 1928×1928 (जो A/B प्रति-टियर भूमिती ठरवतो), AA vs 1-bit
  (dense-render विरोधाभास सोडवतो), 7×10/10×16 cell (Opus safe mode),
  GPT strip, आणि दोन Gemini bets (≤384² = 258 flat; `media_resolution:
  low` = 280 fixed → वाचनीय *असल्यास* ~116 chars/token).
- **स्कोअर** (`score.ts`): निश्चयात्मक exact match, LLM-judge नाही. तीन
  निकाल: `correct` / `abstained` (ILEGIVEL sentinel — प्रामाणिक अपयश) /
  `silent_wrong` (धोकादायक mode), distractor flag सह.

## चालवणे

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

विशिष्ट कॉन्फिग्ज: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
उत्तरे `results/*.jsonl` मध्ये उतरतात (प्रति प्रश्न एक ओळ, ऑडिटिंगसाठी
कच्च्या उत्तरासह).

## स्वीकृती बार (upstream PRs #35/#36 वरून वारसा मिळालेला)

एखादा कॉन्फिग तेव्हाच उत्पादन डीफॉल्ट बनतो जेव्हा: **gist == मजकूर
baseline** आणि **शून्य silent wrong exact strings** आणि **सकारात्मक बचत**.
पहिली अनिवार्य run आहे Fable वर `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` — high-res tier सक्षम करण्यापूर्वी मोठ्या पानाची
वाचनीयता spot-check.

## `--via-omniroute` — OmniRoute द्वारे e2e (P3: non-degradation पुरावा)

वरील transports हार्नेसमध्येच text→PNG रेंडर करतात आणि प्रतिमा पाठवतात.
`--via-omniroute` याच्या उलट करते, जो उत्पादन पथ आहे: ते **घन मजकूर**
चालू असलेल्या OmniRoute इन्स्टन्सला पाठवते, **`omniglyph` इंजिनला** पाने
रेंडर करून Anthropic ला फॉरवर्ड करू देते, आणि वाचन + बचत मोजते. जर वाचन
direct route सारखेच राहिले **आणि** OmniRoute compression नोंदवत असेल, तर
हे सिद्ध होते की OmniRoute चे render+forward पाने **खराब करत नाही**.

पूर्वअटी (ऑपरेशनल):

1. **OmniRoute चालू** (`npm run dev`, डीफॉल्ट `http://localhost:20128`).
2. OmniRoute मध्ये कॉन्फिगर केलेला **Anthropic provider** एका **खऱ्या key**
   सह (direct route — `providerTransport==='direct'` गेट फक्त `anthropic`
   provider साठी पास होतो).
3. **`omniglyph` इंजिन ENABLED** OmniRoute च्या compression config मध्ये
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph` header
   फक्त इंजिन चालू असतानाच येतो. (इंजिन `stable:false`/preview आहे; ते
   स्पष्टपणे सक्षम करा.)
4. `OMNIROUTE_API_KEY` मध्ये एक **OmniRoute API key** (क्लायंट OmniRoute
   विरुद्ध प्रमाणीकरणासाठी वापरतो ती की, Anthropic ची नाही).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

प्रत्येक उत्तर JSONL मध्ये `omnirouteSavings: { originalTokens,
compressedTokens, savingsPercent }` (`X-OmniRoute-Compression` response
header वरून) नोंदवतो; table row किती उत्तरे compressed परत आली + median
savings दाखवतो. **P3 bar**: direct route सारखेच verbatim/gist hits
(non-degradation) **सह** non-null `omnirouteSavings` (render झाले हे सिद्ध
करते, raw-text वाचन नाही). जर `did NOT compress` दिसले, तर OmniRoute मध्ये
इंजिन सक्षम नाही (किंवा बॉडी fail-closed गेट्स पास झाली नाही).

शुद्ध भागांसाठी चाचण्या: `tests/density-frontier.test.ts` (via-omniroute
transport मधील `buildOmnirouteRequest` आणि `parseCompressionSavings`
समाविष्ट).
