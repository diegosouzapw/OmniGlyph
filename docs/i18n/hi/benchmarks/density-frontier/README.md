# density-frontier — प्रति रिज़ॉल्यूशन लागत × सटीकता

वह हार्नेस जो टेक्स्ट→छवि रेंडर की **लागत और पठनीयता के बीच पैरेटो सीमा**
को मापता है, प्रति प्रोवाइडर (Anthropic / OpenAI / Gemini), पेज ज्यामिति,
ग्लिफ़ सेल, और एटलस शैली के अनुसार।

केंद्रीय असममिति: बिलिंग स्वीप (2026-07-05, `benchmarks/billing-sweep/`)
के बाद से, **लागत ऑफ़लाइन बिल्कुल सटीक अनुमानित है** — Anthropic पर 28
px पैच + 4/ब्लॉक (`src/core/anthropic-vision.ts`), OpenAI पर
patch/tile प्रोफ़ाइल (`src/core/openai.ts`), Gemini पर tiles/media_resolution
(`gemini-cost.ts`)। केवल **पठन सटीकता** के लिए API चाहिए।

## डिज़ाइन

- **कॉर्पस** (`corpus.ts`): सघन log/JSON-शैली भराव + confusability
  मैट्रिक्स द्वारा विफल बताई गई श्रेणियों से रोपी गई सुइयाँ (12-अक्षर
  हेक्स, camelCase, अंक 6/8/5/3) + मापे गए भ्रामक जोड़ों से बने
  **near-miss विकर्षक**। यदि मॉडल विकर्षक के साथ उत्तर देता है, तो भ्रम
  *अनुमानित* था — यही मौन विफलता मोड है जिसका पता लगाया जा रहा है, न कि
  केवल ग़लत गिना जा रहा है। निर्धारक (mulberry32)।
- **कॉन्फ़िग** (`configs.ts`): क्यूरेटेड ग्रिड — स्टैंडर्ड 1568×728 पेज
  बनाम हाई-रेस 1928×1928 (वह A/B जो प्रति-टियर ज्यामिति तय करता है), AA
  बनाम 1-bit (सघन-रेंडर विरोधाभास हल करता है), 7×10/10×16 सेल (Opus
  सुरक्षित मोड), GPT strip, और दो Gemini दांव (≤384² = 258 flat;
  `media_resolution: low` = 280 फ़िक्स्ड → ~116 अक्षर/टोकन *यदि* पठनीय)।
- **स्कोर** (`score.ts`): निर्धारक सटीक मिलान, कोई LLM-न्यायाधीश नहीं।
  तीन परिणाम: `correct` / `abstained` (ILEGIVEL सेंटिनल — ईमानदार
  विफलता) / `silent_wrong` (ख़तरनाक मोड), एक विकर्षक फ़्लैग के साथ।

## चलाना

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

विशिष्ट कॉन्फ़िग: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`।
उत्तर `results/*.jsonl` में जाते हैं (प्रति प्रश्न एक पंक्ति, ऑडिटिंग के
लिए कच्चे उत्तर के साथ)।

## स्वीकृति सीमा (अपस्ट्रीम PR #35/#36 से विरासत में)

एक कॉन्फ़िग तभी प्रोडक्शन डिफ़ॉल्ट बनता है जब: **gist == टेक्स्ट बेसलाइन**
**और** **शून्य मौन ग़लत सटीक स्ट्रिंग** **और** सकारात्मक बचत। पहला
अनिवार्य रन Fable पर `anthropic-std-5x8-aa` बनाम `anthropic-hires-5x8-aa`
है — हाई-रेस टियर सक्षम करने से पहले बड़े पेज की पठनीयता स्पॉट-चेक।

## `--via-omniroute` — OmniRoute के ज़रिए e2e (P3: गैर-गिरावट प्रमाण)

ऊपर दिए ट्रांसपोर्ट टेक्स्ट→PNG को **हार्नेस में ही** रेंडर करते हैं और
छवियाँ भेजते हैं। `--via-omniroute` इसका उलटा करता है, जो प्रोडक्शन पथ
है: यह **सघन टेक्स्ट** को एक चल रहे OmniRoute इंस्टेंस को भेजता है,
**`omniglyph` इंजन को पेज रेंडर** करने और Anthropic को फ़ॉरवर्ड करने
देता है, और पठन + बचत मापता है। यदि पठन डायरेक्ट रूट जितने ही बने रहते
हैं **और** OmniRoute संपीड़न रिपोर्ट करता है, तो यह साबित हो जाता है कि
OmniRoute का रेंडर+फ़ॉरवर्ड पेजों को **घटिया नहीं बनाता**।

पूर्वापेक्षाएँ (परिचालन):

1. **OmniRoute चल रहा हो** (`npm run dev`, डिफ़ॉल्ट `http://localhost:20128`)।
2. OmniRoute में **वास्तविक कुंजी** के साथ कॉन्फ़िगर किया गया एक
   **Anthropic प्रोवाइडर** (डायरेक्ट रूट — `providerTransport==='direct'`
   गेट केवल `anthropic` प्रोवाइडर के लिए पास होता है)।
3. OmniRoute के संपीड़न कॉन्फ़िग में **`omniglyph` इंजन सक्षम** किया गया
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`
   हेडर केवल इंजन चालू होने पर फ़ायर होता है। (इंजन `stable:false`/प्रीव्यू
   है; इसे स्पष्ट रूप से सक्षम करें।)
4. `OMNIROUTE_API_KEY` में एक **OmniRoute API कुंजी** (वह जिसका उपयोग
   क्लाइंट OmniRoute के विरुद्ध प्रमाणीकरण के लिए करता है, Anthropic
   वाली नहीं)।

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

हर उत्तर JSONL में `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(प्रतिक्रिया के `X-OmniRoute-Compression` हेडर से) रिकॉर्ड करता है; तालिका
की पंक्ति दिखाती है कि कितने उत्तर संपीड़ित होकर वापस आए + माध्यिका बचत।
**P3 सीमा**: डायरेक्ट रूट जितने ही verbatim/gist हिट (गैर-गिरावट) **साथ में**
गैर-null `omnirouteSavings` (यह साबित करते हुए कि एक रेंडर हुआ, कच्चा-टेक्स्ट
पठन नहीं)। यदि `did NOT compress` दिखता है, तो इंजन OmniRoute में सक्षम
नहीं है (या बॉडी फेल-क्लोज़्ड गेट पास नहीं हुई)।

शुद्ध हिस्सों के लिए टेस्ट: `tests/density-frontier.test.ts` (via-omniroute
ट्रांसपोर्ट से `buildOmnirouteRequest` और `parseCompressionSavings` शामिल
हैं)।
