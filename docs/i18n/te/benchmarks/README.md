# Benchmarks

🌐 అనువదించబడింది: [అన్ని భాషలు](../../README.md)

OmniGlyph చెప్పే ప్రతి సంఖ్యా క్రింది రెండు హార్నెస్‌లలో ఒకటి నుండి
వస్తుంది — మళ్లీ రన్ చేయగలిగేవి, వీలైనంత వరకు డిటర్మినిస్టిక్,
`*/results/*.jsonl`లో రా సమాధానం-వారీ రసీదులతో సహా. కన్సాలిడేటెడ్
విశ్లేషణ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## పొదుపు ఎలా పని చేస్తుంది (ఒక చిత్రంలో)

ప్రొవైడర్‌లు **టెక్స్ట్‌ను టోకెన్ ప్రకారం** బిల్ చేస్తారు, కానీ
**ఇమేజ్‌ను దాని డైమెన్షన్ల ప్రకారం** బిల్ చేస్తారు — దానిలో ఎంత
టెక్స్ట్ ప్యాక్ చేయబడి ఉందో దాని ప్రకారం కాదు. టెక్స్ట్ ఎంత
సాంద్రంగా ఉన్నా ఒక స్టాండర్డ్ పేజీ ఫ్లాట్ కాస్ట్‌నే కలిగి ఉంటుంది:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

అదే కాంటెక్స్ట్, రెండు విధాలుగా బిల్ చేయబడింది:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

ఇమేజ్ ఎందుకు గెలుస్తుంది — టోకెన్‌కు మోసే అక్షరాలు:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph ఖచ్చితమైన గణితం గెలుస్తుందని చెప్పినప్పుడు మాత్రమే ఈ
మార్పిడిని చేస్తుంది, మరియు పేజీని చదవగలదని రుజువైన మోడల్స్‌కు
మాత్రమే. దిగువ ఉన్న రెండు హార్నెస్‌లు ప్రతి సగభాగాన్ని రుజువు
చేస్తాయి.

## 1. `billing-sweep/` — ఒక ఇమేజ్ నిజంగా ఎంత ఖర్చవుతుంది?

లైవ్ Anthropic APIకి వ్యతిరేకంగా ఉచిత `count_tokens` ప్రోబ్‌లు, 2
మోడల్స్ × 2 రిజల్యూషన్ టైర్‌ల మీద 11 ప్రోబ్ జ్యామితులలో పదవీ విరమణ
చేసిన `w·h/750` ఫార్ములాను ప్రస్తుత 28px-ప్యాచ్ మోడల్‌తో పోలుస్తుంది.

**ఫలితం (2026-07-05): ప్రతి ప్రోబ్‌లోనూ ప్యాచ్ మోడల్ అవశేషం ZERO తో
సరిపోతుంది** — బిల్ చేయబడింది = టైర్ రీసైజ్ తర్వాత `⌈w/28⌉ × ⌈h/28⌉`,
ప్లస్ ఇమేజ్ బ్లాక్‌కు స్థిరమైన +3/+4 టోకెన్‌లు. ప్రొడక్షన్ పేజీ
(1568×728) సరిగ్గా 1,460 టోకెన్‌లు ఖర్చవుతుంది మరియు 28,080 అక్షరాలను
మోస్తుంది ≈ **19.2 అక్షరాలు/టోకెన్** vs సాంద్రమైన టెక్స్ట్‌గా ~2
అక్షరాలు/టోకెన్.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — మోడల్ నిజంగా దీన్ని READ చేయగలదా?

రెండర్ కాన్ఫిగ్‌లు, పేజీ జ్యామితులు, గ్లిఫ్ అట్లాస్‌లు మరియు
ప్రొవైడర్‌ల మధ్య కాస్ట్ (ఆఫ్‌లైన్, ఖచ్చితం) × రీడ్-ఖచ్చితత్వం
(లైవ్). కార్పస్ ఖచ్చితమైన-స్ట్రింగ్ నీడిల్స్‌ను (hex ids, camelCase,
digit runs) ప్లాంట్ చేస్తుంది, ప్లస్ **కొలవబడిన గ్లిఫ్-గందరగోళ
జతల నుండి నిర్మించిన near-miss డిస్ట్రాక్టర్‌లను** — కాబట్టి నిశ్శబ్ద
confabulation కేవలం తప్పుగా లెక్కించబడకుండా గుర్తించబడుతుంది.
స్కోరింగ్ డిటర్మినిస్టిక్ (LLM-judge లేదు): `correct` / `abstained`
(నిజాయితీగల `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**హెడ్‌లైన్ ఫలితాలు** (ఆర్మ్‌కు n=30):

| ఆర్మ్ | ఖచ్చితమైన రీడ్‌లు | గమనికలు |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

ఒక్క చూపులో రీడ్ ఖచ్చితత్వం — ఇది **నిజంగానే** fail-closed మోడల్
గేట్, చిత్రించబడింది:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

కేవలం ✅ ఆర్మ్ మాత్రమే ప్రొడక్షన్‌కు వెళుతుంది. సరిగ్గా చదవలేనిది
ఏదైనా *రసీదుతో సహా* బ్లాక్ చేయబడుతుంది, మరియు మూడు-మార్గాల స్కోరింగ్
అంటే తప్పుగా ఊహించే మోడల్ (`silent_wrong`) నిజాయితీగా ఆబ్‌స్టెయిన్
అయ్యే దాని కంటే (`ILEGIVEL`) అధ్వాన్నంగా పరిగణించబడుతుంది.

మూడు ట్రాన్స్‌పోర్ట్‌లు: డైరెక్ట్ API (`ANTHROPIC_API_KEY`/
`OPENAI_API_KEY`/`GEMINI_API_KEY`), OpenRouter (`OPENROUTER_API_KEY`),
మరియు `--via-cli` (Claude Code సబ్‌స్క్రిప్షన్ — $0). కష్టపడి
నేర్చుకున్న జాగ్రత్త: మధ్యవర్తులు (OpenRouter, CLI Read టూల్) పెద్ద
ఇమేజ్‌లను resample చేస్తాయి; చదవగలిగే స్థాయికి కేవలం direct-API
ఫలితాలు మాత్రమే అధికారికమైనవి.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

ప్యూర్ భాగాలను పిన్ చేసే యూనిట్ టెస్ట్‌లు (కార్పస్, స్కోరింగ్, కాస్ట్
ఫార్ములాలు): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
