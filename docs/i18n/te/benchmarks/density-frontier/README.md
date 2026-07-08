# density-frontier — cost × accuracy per resolution

🌐 అనువదించబడింది: [అన్ని భాషలు](../../../README.md)

ప్రొవైడర్‌కు (Anthropic / OpenAI / Gemini), పేజీ జ్యామితికి, గ్లిఫ్
సెల్‌కు, మరియు అట్లాస్ స్టైల్‌కు టెక్స్ట్→ఇమేజ్ రెండర్‌ల **కాస్ట్ మరియు
చదవగలిగే స్థాయి మధ్య Pareto frontier**ను కొలిచే హార్నెస్.

చౌకైన (సాంద్రమైన) పేజీలు టోకెన్‌కు ఎక్కువ అక్షరాలను మోస్తాయి కానీ
చివరికి చదవగలిగేవిగా ఉండటం ఆగిపోతాయి. ఒక కాన్ఫిగ్ **రెండూ**
నిలబడేచోట మాత్రమే ప్రొడక్షన్‌కు వెళ్లగలదు — కాస్ట్ తక్కువగా ఉండాలి
*మరియు* మోడల్ ఇంకా దాన్ని పర్ఫెక్ట్‌గా చదవగలగాలి:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

ప్రతి సమాధానం మూడు ఫలితాలలో సరిగ్గా ఒకదానికి స్కోర్ చేయబడుతుంది —
మధ్యలో ఉన్నదే గేట్‌ను నమ్మదగినదిగా చేస్తుంది:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

ఒక్క 🔴 అయినా ఇచ్చే కాన్ఫిగ్ ఎంత చౌకైనదైనా అనర్హమే.

కేంద్ర అసమానత: బిల్లింగ్ స్వీప్ నుండి (2026-07-05,
`benchmarks/billing-sweep/`), **కాస్ట్ ఆఫ్‌లైన్‌లో ఖచ్చితంగా
ప్రిడిక్ట్ చేయదగినది** — Anthropicపై 28px ప్యాచ్‌లు + 4/బ్లాక్
(`src/core/anthropic-vision.ts`), OpenAIపై ప్యాచ్/టైల్ ప్రొఫైల్‌లు
(`src/core/openai.ts`), Geminiపై టైల్‌లు/media_resolution
(`gemini-cost.ts`). కేవలం **రీడ్ ఖచ్చితత్వానికి** మాత్రమే API
అవసరం.

## Design

- **Corpus** (`corpus.ts`): సాంద్రమైన log/JSON-తరహా ఫిల్లర్ + confusability
  matrix ఫెయిల్ అవుతుందని చెప్పే క్లాస్‌ల నుండి ప్లాంట్ చేసిన నీడిల్స్
  (12-అక్షరాల hex, camelCase, digits 6/8/5/3) + కొలవబడిన confusable
  జతల నుండి నిర్మించిన **near-miss డిస్ట్రాక్టర్‌లు**. మోడల్
  డిస్ట్రాక్టర్‌తో సమాధానం ఇస్తే, ఆ గందరగోళం *predicted* అయినది —
  అదే గుర్తించబడుతున్న నిశ్శబ్ద ఫెయిల్యూర్ మోడ్, కేవలం తప్పుగా
  లెక్కించబడటం మాత్రమే కాదు. డిటర్మినిస్టిక్ (mulberry32).
- **Configs** (`configs.ts`): క్యూరేటెడ్ గ్రిడ్ — స్టాండర్డ్ 1568×728
  పేజీలు vs హై-రెస్ 1928×1928 (టైర్‌కు జ్యామితిని నిర్ణయించే A/B),
  AA vs 1-bit (సాంద్రమైన-రెండర్ వైరుధ్యాన్ని పరిష్కరిస్తుంది), 7×10/
  10×16 సెల్ (Opus safe mode), GPT strip, మరియు రెండు Gemini బెట్‌లు
  (≤384² = 258 flat; `media_resolution: low` = 280 fixed →
  చదవగలిగితే ~116 అక్షరాలు/టోకెన్).
- **Score** (`score.ts`): డిటర్మినిస్టిక్ ఎగ్జాక్ట్ మ్యాచ్, LLM-judge
  లేదు. మూడు ఫలితాలు: `correct` / `abstained` (ILEGIVEL సెంటినెల్ —
  నిజాయితీగల ఫెయిల్యూర్) / `silent_wrong` (ప్రమాదకరమైన మోడ్), డిస్ట్రాక్టర్
  ఫ్లాగ్‌తో సహా.

## రన్ చేయడం

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

నిర్దిష్ట కాన్ఫిగ్‌లు: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
సమాధానాలు `results/*.jsonl`లో ల్యాండ్ అవుతాయి (ప్రశ్నకు ఒక లైన్,
ఆడిటింగ్ కోసం రా సమాధానంతో సహా).

## అంగీకార బార్ (upstream PRs #35/#36 నుండి వారసత్వంగా వచ్చింది)

ఒక కాన్ఫిగ్ ప్రొడక్షన్ డిఫాల్ట్ అవుతుంది కేవలం: **gist == text
baseline** మరియు **సున్నా నిశ్శబ్ద తప్పు ఎగ్జాక్ట్ స్ట్రింగ్‌లు**
మరియు **పాజిటివ్ savings**ఉంటేనే. మొదటి తప్పనిసరి రన్ Fableపై
`anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa` — హై-రెస్ టైర్‌ను
ఎనేబుల్ చేయడానికి ముందు పెద్ద పేజీ యొక్క చదవగలిగే స్థాయి spot-check.

## `--via-omniroute` — e2e through OmniRoute (P3: non-degradation proof)

పైన ఉన్న ట్రాన్స్‌పోర్ట్‌లు **హార్నెస్‌లోనే** టెక్స్ట్→PNGను రెండర్
చేసి ఇమేజ్‌లను పంపుతాయి. `--via-omniroute` దీనికి వ్యతిరేకంగా చేస్తుంది,
ఇది ప్రొడక్షన్ పాత్: ఇది నడుస్తున్న OmniRoute ఇన్‌స్టాన్స్‌కు
**సాంద్రమైన టెక్స్ట్**‌ను పంపుతుంది, **`omniglyph` ఇంజిన్‌ను పేజీలను
రెండర్ చేసి** Anthropicకు ఫార్వర్డ్ చేయనిస్తుంది, మరియు రీడ్‌లు +
సేవింగ్స్‌ను కొలుస్తుంది. రీడ్‌లు డైరెక్ట్ రూట్‌తో అదే విధంగా ఉండి,
**మరియు** OmniRoute కంప్రెషన్‌ను రిపోర్ట్ చేస్తే, OmniRoute యొక్క
render+forward పేజీలను **దిగజార్చదని** రుజువు అవుతుంది.

Prerequisites (operational):

1. **OmniRoute రన్ అవుతూ ఉండాలి** (`npm run dev`, డిఫాల్ట్
   `http://localhost:20128`).
2. **Anthropic ప్రొవైడర్** OmniRouteలో **నిజమైన కీ**తో కాన్ఫిగర్
   చేయబడి ఉండాలి (డైరెక్ట్ రూట్ — `providerTransport==='direct'` గేట్
   `anthropic` ప్రొవైడర్‌కు మాత్రమే పాస్ అవుతుంది).
3. **`omniglyph` ఇంజిన్ ENABLED** OmniRoute యొక్క కంప్రెషన్
   కాన్ఫిగ్‌లో ఉండాలి (`config.engines.omniglyph.enabled = true`) —
   `engine:omniglyph` హెడర్ ఇంజిన్ ఆన్‌లో ఉన్నప్పుడే ఫైర్ అవుతుంది.
   (ఇంజిన్ `stable:false`/ప్రివ్యూ; దీన్ని స్పష్టంగా ఎనేబుల్ చేయండి.)
4. `OMNIROUTE_API_KEY`లో **OmniRoute API కీ** ఉండాలి (క్లయింట్
   OmniRouteతో ప్రామాణీకరించడానికి వాడేది, Anthropic కీ కాదు).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

ప్రతి సమాధానం `omnirouteSavings: { originalTokens, compressedTokens,
savingsPercent }`ను (`X-OmniRoute-Compression` రెస్పాన్స్ హెడర్
నుండి) JSONLలో రికార్డ్ చేస్తుంది; టేబుల్ రో ఎన్ని సమాధానాలు
కంప్రెస్ చేయబడి తిరిగి వచ్చాయో + మీడియన్ సేవింగ్స్‌ను చూపిస్తుంది.
**P3 బార్**: డైరెక్ట్ రూట్ (non-degradation) వలె అదే verbatim/gist
హిట్‌లు **మరియు** non-null `omnirouteSavings` (రెండర్ జరిగిందని
రుజువు చేయడం, రా-టెక్స్ట్ రీడ్ కాదు). `did NOT compress` కనిపిస్తే,
ఇంజిన్ OmniRouteలో ఎనేబుల్ చేయబడలేదు (లేదా బాడీ fail-closed గేట్‌లను
పాస్ కాలేదు).

Tests for the pure parts: `tests/density-frontier.test.ts` (includes
`buildOmnirouteRequest` and `parseCompressionSavings` from the
via-omniroute transport).
