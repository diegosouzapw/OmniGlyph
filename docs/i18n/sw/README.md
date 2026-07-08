🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Muktadha kama Picha

### Punguza bili yako ya Claude kwa **59–70%** kwa kutoa muktadha mzito kama kurasa mnene za PNG — maudhui yaleyale, kwa sehemu ndogo ya token.

**Miundo hutoza maandishi kwa kila token, lakini hutoza picha kwa vipimo vyake — si kwa kiasi cha maandishi kilichomo ndani yake.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-idadi-zilizopimwa--si-makadirio)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-sehemu-ya-uwazi)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Sehemu ya familia ya [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Lugha zote](../../../docs/i18n/README.md)

</div>

---

# 📊 Idadi zilizopimwa — si makadirio

| kipimo | matokeo | risiti |
|---|---|---|
| Upunguzaji wa bili ya mwanzo hadi mwisho | **59–70%** | ufuatiliaji wa uzalishaji, maombi 13,709 |
| Token kwa kila kizuizi kilichobadilishwa | **mara 10 chache** (herufi 28,080: token 14,040 → 1,460) | [uchunguzi wa bili](benchmarks/billing-sweep/README.md) |
| Usahihi wa fomula ya bili | mabaki **sifuri** katika uchunguzi 22 wa `count_tokens`, miundo 2 × ngazi 2 | `benchmarks/billing-sweep/results/` |
| Usahihi wa usomaji sahihi, mpangilio wa uzalishaji | **30/30 (100%)** kwenye Claude Fable 5 | [mpaka wa msongamano](benchmarks/density-frontier/README.md) |
| Uvumbuzi wa kimya katika majaribio ~300 ya usomaji | **0** — kila kukosa hujiepusha kama `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Kadi ya alama za miundo** (je, inaweza kusoma taswira mnene? n=30 kwa kila kikundi, upimaji thabiti):

| muundo | usomaji | uamuzi |
|---|---|---|
| Claude **Fable 5** | **100%** sahihi | ✅ lengo la uzalishaji |
| Claude Opus 4.8 | 77–87% kwa ukubwa wa herufi mara 4 | ⚠️ hali salama ya hiari (akiba hupungua hadi ~mara 2) |
| GPT-5.5 | 0/60 — na hupandisha majibu yake mara ~40 kujaribu | ❌ imezuiwa na lango, kwa uthibitisho |
| Gemini 2.5-flash | 0/26 — na hubuni badala ya kujiepusha | ❌ imezuiwa (jaribio la sehemu, mgao ulizuia) |

Faida hii ni **maalum kwa Fable leo** — vichakataji vingine vya maono bado havijaweza kusoma taswira mnene. [Mfumo wa vipimo](benchmarks/README.md) hujaribu upya muundo wowote mpya kwa amri moja.

# 🤔 Kwa nini OmniGlyph?

Kila kipindi cha wakala kinachoendelea muda mrefu hubeba mzigo uleule kwenye kila ombi: maelekezo ya mfumo, hati za zana, na historia ya zamani — hutozwa upya kwa kila token, kila zamu. OmniGlyph ni **wakala wa ndani (proxy)** unaobadilisha sehemu hizo nzito kuwa kurasa mnene za PNG *kabla hazijatoka kwenye kompyuta yako*:

- **Hesabu sahihi ya bili, si makadirio** — huhesabu fomula halisi ya token za picha ya mtoa huduma (iliyopimwa hadi mabaki sifuri) na hubadilisha tu pale hesabu inapofaidisha.
- **Imefungwa-kushindwa kwa muundo (fail-closed)** — miundo isiyoweza kusoma taswira mnene huzuiwa na lango, ikiwa na risiti za vipimo. Hakuna upotevu wa ubora wa kimya.
- **Faragha na wa ndani kwanza** — ubadilishaji hufanyika kwenye `127.0.0.1`; hakuna kitu cha ziada kinachotumwa popote.
- **Inayoweza kurudiwa** — kila nambari hapo juu ina risiti katika `benchmarks/*/results/`, inayoweza kuendeshwa upya kwa amri moja.

# ⚡ Anza Haraka

```bash
npx omniglyph                                     # proxy kwenye 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # elekeza Claude Code kwake
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Inafanya kazi kwa njia zote mbili:
- **Ufunguo wa API** (unalipa kwa kila token): bili yako hupungua 59–70% mwanzo hadi mwisho.
- **Kipindi cha usajili**: hulipi kidogo, lakini mipaka ya matumizi huhesabiwa kwa token — hivyo mipaka yako huongezeka **~mara 2–3**.

Dashibodi kwenye <http://127.0.0.1:47821/>: token zilizookolewa, kila ubadilishaji wa maandishi-kwenda-picha bega kwa bega, kizima cha dharura, chip za muundo za moja kwa moja. Majibu hutiririka kama kawaida — ni *ombi* pekee linalobanwa, kamwe si matokeo ya muundo.

# ⚙️ Jinsi inavyofanya kazi

```
kizuizi kizito cha ombi ──► lango la faida ──► upangaji upya + uchoraji (atlasi ya bit-1 5×8)
                       (hesabu sahihi ya bili)     ──► kurasa za PNG 1568×728 ──► unganisha nyuma, rafiki wa kache
```

- **Bili huhesabiwa kwa usahihi, kabla ya kubadilisha**: Anthropic hutoza token `⌈w/28⌉ × ⌈h/28⌉ + 4` kwa kila picha (vipande vya pikseli 28 — vilivyopimwa hadi mabaki sifuri). Ukurasa mzima hubeba herufi 28,080 kwa token 1,460 ≈ **herufi 19 kwa kila token**, ikilinganishwa na herufi ~2 kwa kila token kwa maandishi mnene. Lango hubadilisha tu pale hesabu inapofaidisha.
- **Kinachobadilishwa**: maelekezo tuli ya mfumo + hati za zana, historia ya zamani iliyokunjwa, matokeo makubwa ya zana.
- **Kisichobadilishwa kamwe**: ujumbe wako, zamu za hivi karibuni, matokeo ya muundo, maandishi machache, thamani sahihi kabisa (hashi/vitambulisho husafiri pamoja kama maandishi), na muundo wowote uliofeli kigezo cha usomaji.

# 🧭 Sehemu ya uwazi

- **Ni hasara kwa kiasi fulani (lossy).** Ukumbukaji sahihi kabisa kutoka kwa picha si wa kutegemewa kwa asili. Hatua zilizochukuliwa: vitambulisho sahihi husafiri kama maandishi karibu na picha, na mpangilio wa uzalishaji uliopimwa haukutoa **uvumbuzi wowote wa kimya** — usomaji uliofeli hujiepusha.
- **Fable 5 pekee ndiyo imeidhinishwa leo**, ikiwa na risiti. GPT-5.5 na Gemini 2.5-flash hazina uwezo uliopimwa wa kusoma taswira mnene; Opus 4.8 inahitaji herufi kubwa mara 4. Lango hutekeleza hili.
- **Tuligundua na kuepuka mtego wa bili**: ngazi ya picha ya ubora wa juu hutoza mara 3.3 zaidi kwa kila ukurasa, lakini kichakataji cha maono hakipati ubora wa ziada — kurasa kubwa husomeka *vibaya zaidi*. Imepimwa, imeandikwa katika [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), haijawashwa.
- Bei hubadilika; kipimo cha kudumu ni upunguzaji wa token, ambao proxy hurekodi kwa kila ombi dhidi ya hesabu-linganishi bure ya `count_tokens`.

# 🔬 Rudia kila nambari

```bash
pnpm install && pnpm test                                     # mfumo mzima
node benchmarks/billing-sweep/run.mjs --dry-run               # makadirio ya bili, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # jedwali la gharama, $0
# na funguo: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (au --via-cli kwa usajili wa Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Mbinu kamili na kila jedwali la matokeo: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Risiti ghafi za kila jibu: `benchmarks/*/results/*.jsonl`.

# 🚀 Familia ya OmniRoute

OmniGlyph pia hutolewa kama **injini asilia ya ubanaji ndani ya [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — lango huru la AI. Huko hufanya kazi kama injini ya `omniglyph` (hali huru moja au kupangwa pamoja na injini nyingine), ikiwa na malango ya kufunga-kushindwa na uhasibu wa token unaotambua picha.

# 🛠️ Msururu wa Teknolojia

| tabaka | teknolojia |
|---|---|
| Lugha | TypeScript (strict), ESM |
| Muda wa uendeshaji | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Uchoraji | atlasi yake ya glyph ya bit-1 (imetokana na Spleen/Unifont, leseni katika `assets/`) → PNG |
| Majaribio | Vitest — TDD, pamoja na ulinzi wa uadilifu wa hati na urejeshaji wa chapa |
| Vipimo | mifumo ya `benchmarks/` (billing-sweep, density-frontier) yenye risiti za JSONL |

## Mpangilio wa mradi

| njia | ni nini |
|---|---|
| `src/` | proxy: mfumo wa ubadilishaji, bili sahihi kwa kila mtoa huduma, kichoraji, wapangishaji (Node + Cloudflare Workers) |
| `benchmarks/` | mifumo iliyozalisha kila nambari hapo juu — inayoweza kuendeshwa upya |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Msaada na Jamii

- 🐛 [Masuala](https://github.com/diegosouzapw/OmniGlyph/issues) — hitilafu na maombi ya vipengele
- 🔒 [SECURITY.md](SECURITY.md) — ripoti za udhaifu
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD kali + upimaji-kabla-ya-madai
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Leseni

MIT — angalia [LICENSE](../../../LICENSE).
