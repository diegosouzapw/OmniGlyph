# Architecture

కోడ్‌బేస్ యొక్క వన్-పేజీ మ్యాప్.

## Request pipeline

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Billing (exact, measured)

| మాడ్యూల్ | ప్రొవైడర్ | మోడల్ |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28px ప్యాచ్‌లు + 4/బ్లాక్, టైర్‌కు రీసైజ్ క్యాప్‌లు; పేజీ జ్యామితి (రెండు టైర్లూ స్టాండర్డ్ 1568×728 పేజీనే రెండర్ చేస్తాయి — హై-రెస్ టైర్ ఒక బిల్లింగ్ ఉచ్చు, చూడండి [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | మోడల్‌కు ప్యాచ్/టైల్ రెజీమ్‌లు, ప్రొఫైల్‌కు `detail`, స్ట్రిప్ జ్యామితి |
| `src/core/gemini-model-profiles.ts` | Google | టైల్ ఫార్ములా (`floor(min/1.5)` క్రాప్ యూనిట్) + `media_resolution` ఫ్లాట్ ఖర్చులు |

## Rendering

- `src/core/render.ts` — బేక్ చేసిన గ్లిఫ్ అట్లాస్ ద్వారా టెక్స్ట్ →
  PNG (Spleen 5×8 + Unifont ఫాల్‌బ్యాక్), `↵` న్యూలైన్ సెంటినెల్‌లతో
  రీఫ్లో, ప్రొడక్షన్‌లో 1-బిట్ అట్లాస్ (Fableపై AA కంటే మెరుగ్గా
  కొలవబడింది).
- `src/core/render-cache.ts` — డిటర్మినిస్టిక్ రెండర్‌ల LRU
  మెమోయిజేషన్ (లేకపోతే స్టాటిక్ స్లాబ్ + ఫ్రోజెన్ హిస్టరీ చంక్‌లు ప్రతి
  రిక్వెస్ట్‌కూ మళ్లీ రెండర్ అవుతాయి).
- `src/core/history.ts` — పాత టర్న్‌లను అపెండ్-ఓన్లీ ఫ్రోజెన్ ఇమేజ్
  చంక్‌లుగా కుదిస్తుంది, ఇవి బైట్-ఐడెంటికల్‌గా ఉండి prompt caching
  హిట్ అవుతూనే ఉంటుంది.
- `src/core/png.ts` — కనిష్ట డిటర్మినిస్టిక్ PNG ఎన్‌కోడర్ (నేటివ్
  డిపెండెన్సీలు లేకుండా).

## Guard rails

- మోడల్ అలోలిస్ట్ (`src/core/applicability.ts`): రీడింగ్ బెంచ్‌మార్క్‌ను
  పాస్ చేసిన మోడల్స్ మాత్రమే ఇమేజ్ చేయబడతాయి; మిగిలినవి బైట్-ఐడెంటికల్‌గా
  పాస్ అవుతాయి.
- బైట్-ఖచ్చితమైన విలువలు (SHAలు, IDలు) ఇమేజ్ పక్కనే ఫ్యాక్ట్ షీట్‌లో
  టెక్స్ట్‌గా వెళతాయి (`src/core/factsheet.ts`); `emitRecoverable`
  ద్వారా రికవర్ చేయదగిన ఒరిజినల్స్.
- నేటివ్ typed టూల్స్ (`type !== 'custom'`) ఎప్పుడూ తిరిగి రాయబడవు
  (400 గార్డ్).

## Benchmarks & receipts

`benchmarks/` README లోని ప్రతి సంఖ్యనూ ఉత్పత్తి చేసిన రెండు
హార్నెస్‌లను కలిగి ఉంది — చూడండి
[benchmarks/README.md](../../benchmarks/README.md).
