🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — కాంటెక్స్ట్ ఇమేజ్‌గా

### భారీ కాంటెక్స్ట్‌ను సాంద్రమైన PNG పేజీలుగా రెండర్ చేసి మీ Claude బిల్లును **59–70%** తగ్గించండి — కంటెంట్ అదే, కానీ టోకెన్లు చాలా తక్కువ.

**మోడల్స్ టెక్స్ట్‌ను టోకెన్ ప్రకారం బిల్ చేస్తాయి, కానీ ఇమేజ్‌ను దానిలోని టెక్స్ట్ మొత్తాన్ని బట్టి కాదు, దాని డైమెన్షన్ల ప్రకారం బిల్ చేస్తాయి.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) కుటుంబంలో భాగం

</div>

---

# 📊 The numbers — measured, not estimated

| మెట్రిక్ | ఫలితం | రసీదు |
|---|---|---|
| ఎండ్-టు-ఎండ్ బిల్ తగ్గింపు | **59–70%** | ప్రొడక్షన్ ట్రేస్, 13,709 రిక్వెస్ట్‌లు |
| కన్వర్ట్ చేసిన బ్లాక్‌కు టోకెన్లు | **10× తక్కువ** (28,080 అక్షరాలు: 14,040 → 1,460 టోకెన్లు) | [billing sweep](benchmarks/billing-sweep/README.md) |
| బిల్లింగ్-ఫార్ములా ఖచ్చితత్వం | 2 మోడల్స్ × 2 టైర్ల మీద 22 `count_tokens` ప్రోబ్‌లలో అవశేషం **సున్నా** | `benchmarks/billing-sweep/results/` |
| ప్రొడక్షన్ కాన్ఫిగ్‌లో ఖచ్చితమైన-రీడ్ ఖచ్చితత్వం | Claude Fable 5 పై **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300 రీడ్ ప్రోబ్‌లలో నిశ్శబ్ద confabulations | **0** — ప్రతి మిస్ `ILEGIVEL`గా ఆబ్‌స్టెయిన్ అవుతుంది | `benchmarks/density-frontier/results/` |

**మోడల్ స్కోర్‌కార్డ్** (సాంద్రమైన రెండర్‌లను చదవగలదా? ఆర్మ్‌కు n=30, డిటర్మినిస్టిక్ స్కోరింగ్):

| మోడల్ | రీడింగ్ | తీర్పు |
|---|---|---|
| Claude **Fable 5** | **100%** ఖచ్చితం | ✅ ప్రొడక్షన్ లక్ష్యం |
| Claude Opus 4.8 | 4× గ్లిఫ్ సైజ్‌లో 77–87% | ⚠️ ఆప్ట్-ఇన్ సేఫ్ మోడ్ (సేవింగ్స్ ~2×కి పడిపోతాయి) |
| GPT-5.5 | 0/60 — మరియు తన సమాధానాలను ప్రయత్నిస్తూ ~40× ఉబ్బిస్తుంది | ❌ గేట్ ద్వారా బ్లాక్ చేయబడింది, రుజువుతో |
| Gemini 2.5-flash | 0/26 — ఆబ్‌స్టెయిన్ చేయకుండా confabulate అవుతుంది | ❌ బ్లాక్ చేయబడింది (పాక్షిక టెస్ట్, కోటా-పరిమితం) |

ఈ ప్రయోజనం **ఈరోజుకు Fable-నిర్దిష్టం** — ఇతర విజన్ ఎన్‌కోడర్‌లు ఇంకా సాంద్రమైన గ్లిఫ్‌లను రిజాల్వ్ చేయలేవు. [బెంచ్‌మార్క్ హార్నెస్](benchmarks/README.md) ఏ కొత్త మోడల్‌నైనా ఒకే కమాండ్‌తో మళ్లీ టెస్ట్ చేస్తుంది.

# 🤔 Why OmniGlyph?

ప్రతి దీర్ఘకాలంగా నడిచే ఏజెంట్ సెషన్ ప్రతి రిక్వెస్ట్‌లో ఒకే మృత బరువును ఈడ్చుకుని వెళుతుంది: సిస్టమ్ ప్రాంప్ట్, టూల్ డాక్స్, పాత హిస్టరీ — ప్రతి టర్న్‌కు టోకెన్ ప్రకారం మళ్లీ బిల్ చేయబడతాయి. OmniGlyph అనేది ఆ భారీ భాగాలను *మీ మెషీన్ నుండి బయటకు వెళ్లే ముందే* సాంద్రమైన PNG పేజీలుగా తిరిగి రాసే **లోకల్ ప్రాక్సీ**:

- **హ్యూరిస్టిక్స్ కాదు, ఖచ్చితమైన బిల్లింగ్ గణితం** — ఇది ప్రొవైడర్ యొక్క వాస్తవ ఇమేజ్-టోకెన్ ఫార్ములాను లెక్కిస్తుంది (సున్నా అవశేషానికి కొలవబడింది) మరియు గణితం గెలిచినప్పుడు మాత్రమే కన్వర్ట్ చేస్తుంది.
- **డిజైన్ ద్వారా fail-closed** — సాంద్రమైన రెండర్‌లను చదవలేని మోడల్స్ గేట్ ద్వారా బ్లాక్ చేయబడతాయి, బెంచ్‌మార్క్ రసీదులతో సహా. నిశ్శబ్ద నాణ్యత నష్టం ఉండదు.
- **ప్రైవేట్ & లోకల్-ఫస్ట్** — రీరైట్ `127.0.0.1` పైనే జరుగుతుంది; అదనంగా ఏదీ ఎక్కడికీ పంపబడదు.
- **పునరుత్పాదకం** — పైన ఉన్న ప్రతి సంఖ్యకూ `benchmarks/*/results/`లో రసీదు ఉంది, ఒకే కమాండ్‌తో మళ్లీ రన్ చేయగలిగేది.

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

రెండు విధాలుగానూ పనిచేస్తుంది:
- **API కీ** (టోకెన్‌కు చెల్లింపు): మీ బిల్ ఎండ్-టు-ఎండ్‌గా 59–70% తగ్గుతుంది.
- **సబ్‌స్క్రిప్షన్ సెషన్**: మీరు తక్కువ చెల్లించరు, కానీ వినియోగ పరిమితులు టోకెన్లలో లెక్కించబడతాయి — కాబట్టి మీ పరిమితులు **~2–3×** వరకు సాగుతాయి.

<http://127.0.0.1:47821/> వద్ద డాష్‌బోర్డ్: ఆదా చేసిన టోకెన్లు, ప్రతి టెక్స్ట్→ఇమేజ్ కన్వర్షన్ పక్కపక్కనే, కిల్ స్విచ్, లైవ్ మోడల్ చిప్స్. రెస్పాన్స్‌లు సాధారణంగానే స్ట్రీమ్ అవుతాయి — కుదించబడేది కేవలం *రిక్వెస్ట్* మాత్రమే, మోడల్ అవుట్‌పుట్ ఎప్పుడూ కాదు.

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **బిల్లింగ్ కన్వర్ట్ చేయడానికి ముందే ఖచ్చితంగా లెక్కించబడుతుంది**: Anthropic ఇమేజ్‌కు `⌈w/28⌉ × ⌈h/28⌉ + 4` టోకెన్లు బిల్ చేస్తుంది (28px ప్యాచ్‌లు — సున్నా అవశేషానికి కొలవబడింది). ఒక పూర్తి పేజీ 28,080 అక్షరాలను 1,460 టోకెన్లలో మోస్తుంది ≈ **19 అక్షరాలు/టోకెన్**, సాంద్రమైన టెక్స్ట్‌కు ~2 అక్షరాలు/టోకెన్‌తో పోలిస్తే. గేట్ గణితం గెలిచినప్పుడు మాత్రమే కన్వర్ట్ చేస్తుంది.
- **ఏది కన్వర్ట్ అవుతుంది**: స్టాటిక్ సిస్టమ్ ప్రాంప్ట్ + టూల్ డాక్స్, పాత collapsed హిస్టరీ, పెద్ద టూల్ అవుట్‌పుట్‌లు.
- **ఏది ఎప్పుడూ కన్వర్ట్ కాదు**: మీ మెసేజ్‌లు, ఇటీవలి టర్న్‌లు, మోడల్ అవుట్‌పుట్, స్పార్స్ ప్రోజ్, బైట్-ఖచ్చితమైన విలువలు (హాష్‌లు/IDలు టెక్స్ట్‌గా పక్కనే వెళతాయి), మరియు రీడింగ్ బెంచ్‌మార్క్‌లో ఫెయిల్ అయిన ఏ మోడల్ అయినా.

# 🧭 The honest part

- **ఇది lossy.** ఇమేజ్‌ల నుండి బైట్-ఖచ్చితమైన రీకాల్ స్వభావరీత్యా నమ్మదగినది కాదు. అమలు చేసిన మిటిగేషన్లు: ఖచ్చితమైన ఐడెంటిఫయర్‌లు ఇమేజ్ పక్కనే టెక్స్ట్‌గా వెళతాయి, మరియు కొలవబడిన ప్రొడక్షన్ కాన్ఫిగ్ **సున్నా నిశ్శబ్ద confabulations** ఇచ్చింది — ఫెయిల్ అయిన రీడ్‌లు ఆబ్‌స్టెయిన్ అవుతాయి.
- **ఈరోజుకు Fable 5 మాత్రమే ఆమోదించబడింది**, రసీదులతో సహా. GPT-5.5 మరియు Gemini 2.5-flash కొలవదగిన స్థాయిలో సాంద్రమైన రెండర్‌లను చదవలేవు; Opus 4.8కి 4× పెద్ద గ్లిఫ్‌లు అవసరం. గేట్ దీన్ని అమలు చేస్తుంది.
- **మేము ఒక బిల్లింగ్ ఉచ్చును కనుగొని దాన్ని నివారించాము**: హై-రిజల్యూషన్ ఇమేజ్ టైర్ పేజీకి 3.3× ఎక్కువ బిల్ చేస్తుంది, కానీ విజన్ ఎన్‌కోడర్‌కు అదనపు రిజల్యూషన్ అందదు — పెద్ద పేజీలు *మరింత చెడ్డగా* చదవబడతాయి. కొలత [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)లో డాక్యుమెంట్ చేయబడింది, ఎనేబుల్ చేయబడలేదు.
- ధరలు మారతాయి; నిలకడైన మెట్రిక్ టోకెన్ కోత, దీన్ని ప్రాక్సీ ప్రతి రిక్వెస్ట్‌కు ఉచిత `count_tokens` కౌంటర్‌ఫ్యాక్చువల్ ఆధారంగా లాగ్ చేస్తుంది.

# 🔬 Reproduce every number

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

పూర్తి మెథడాలజీ మరియు అన్ని ఫలిత పట్టికలు: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). ప్రతి సమాధానానికి రా రసీదులు: `benchmarks/*/results/*.jsonl`.

# 🚀 The OmniRoute family

OmniGlyph **[OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — ఉచిత AI గేట్‌వే — లోపల ఒక **నేటివ్ కంప్రెషన్ ఇంజిన్**గా కూడా షిప్ అవుతుంది. అక్కడ ఇది `omniglyph` ఇంజిన్‌గా నడుస్తుంది (స్టాండలోన్ సింగిల్ మోడ్ లేదా ఇతర ఇంజిన్‌లతో స్టాక్ చేయబడి), fail-closed గేట్‌లు మరియు ఇమేజ్-అవేర్ టోకెన్ అకౌంటింగ్‌తో సహా.

# 🛠️ Tech Stack

| లేయర్ | టెక్ |
|---|---|
| భాష | TypeScript (strict), ESM |
| రన్‌టైమ్ | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| రెండరింగ్ | సొంత 1-బిట్ గ్లిఫ్ అట్లాస్ (Spleen/Unifont-ఆధారితం, లైసెన్స్‌లు `assets/`లో ఉన్నాయి) → PNG |
| టెస్ట్‌లు | Vitest — TDD, ప్లస్ docs-integrity మరియు rebrand గార్డ్‌లు |
| బెంచ్‌మార్క్‌లు | JSONL రసీదులతో `benchmarks/` హార్నెస్‌లు (billing-sweep, density-frontier) |

## Project layout

| పాత్ | ఏమిటి |
|---|---|
| `src/` | ప్రాక్సీ: ట్రాన్స్‌ఫార్మ్ పైప్‌లైన్, ప్రొవైడర్‌కు ఖచ్చితమైన బిల్లింగ్, రెండరర్, హోస్ట్‌లు (Node + Cloudflare Workers) |
| `benchmarks/` | పైన ఉన్న ప్రతి సంఖ్యనూ ఉత్పత్తి చేసిన హార్నెస్‌లు — మళ్లీ రన్ చేయగలిగేవి |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — బగ్‌లు మరియు ఫీచర్ రిక్వెస్ట్‌లు
- 🔒 [SECURITY.md](SECURITY.md) — వల్నరబిలిటీ రిపోర్ట్‌లు
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — కఠినమైన TDD + measurement-before-claims
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 License

MIT — చూడండి [LICENSE](../../../LICENSE).
