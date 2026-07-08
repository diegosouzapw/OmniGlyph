🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontekst som billede

### Skær din Claude-regning med **59–70 %** ved at rendere fyldig kontekst som tætpakkede PNG-sider — samme indhold, med en brøkdel af tokens.

**Modeller afregner tekst per token, men afregner et billede efter dets dimensioner — ikke efter hvor meget tekst der er inden i det.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Del af familien [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 Alle sprog](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| måltal | resultat | dokumentation |
|---|---|---|
| Samlet reduktion af regningen (end-to-end) | **59–70 %** | produktionsspor, 13.709 forespørgsler |
| Tokens per konverteret blok | **10× færre** (28.080 tegn: 14.040 → 1.460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Nøjagtighed af afregningsformlen | resterende afvigelse **nul** på tværs af 22 `count_tokens`-prober, 2 modeller × 2 niveauer | `benchmarks/billing-sweep/results/` |
| Nøjagtig læsning, produktionskonfiguration | **30/30 (100 %)** på Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Stille konfabulationer i ~300 læseprober | **0** — enhver fejllæsning erklærer sig selv som `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Modelscorekort** (kan den læse tætpakkede renderinger? n=30 per arm, deterministisk scoring):

| model | læsning | vurdering |
|---|---|---|
| Claude **Fable 5** | **100 %** nøjagtig | ✅ produktionsmål |
| Claude Opus 4.8 | 77–87 % ved 4× glyfstørrelse | ⚠️ valgfri sikker tilstand (besparelser falder til ~2×) |
| GPT-5.5 | 0/60 — og opblæser sine svar ~40× i forsøget | ❌ blokeret af spærringen, med dokumentation |
| Gemini 2.5-flash | 0/26 — og konfabulerer i stedet for at afstå | ❌ blokeret (delvis test, kvotebegrænset) |

Fordelen er **Fable-specifik i dag** — andre synsencodere kan endnu ikke opløse tætpakkede glyffer. [Benchmark-rammeværket](benchmarks/README.md) gentester enhver ny model med én kommando.

# 🤔 Hvorfor OmniGlyph?

Enhver langvarig agentsession slæber den samme dødvægt med på hver forespørgsel: systemprompten, værktøjsdokumentationen og gammel historik — genafregnet per token, hver tur. OmniGlyph er en **lokal proxy**, der omskriver disse fyldige dele til tætpakkede PNG-sider *før de forlader din maskine*:

- **Præcis afregningsmatematik, ikke heuristik** — den beregner udbyderens reelle formel for billedtokens (målt til nul afvigelse) og konverterer kun, når matematikken vinder.
- **Fail-closed by design** — modeller, der ikke kan læse tætpakkede renderinger, blokeres af en spærring, med benchmark-dokumentation. Intet stille kvalitetstab.
- **Privat og local-first** — omskrivningen sker på `127.0.0.1`; intet ekstra sendes nogen steder.
- **Reproducerbart** — hvert tal ovenfor har dokumentation i `benchmarks/*/results/`, som kan genkøres med én kommando.

# ⚡ Hurtig start

```bash
npx omniglyph                                     # proxy på 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # peg Claude Code mod den
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Fungerer begge veje:
- **API-nøgle** (betaling per token): din regning falder 59–70 % end-to-end.
- **Abonnementssession**: du betaler ikke mindre, men forbrugsgrænser tælles i tokens — så dine grænser strækker sig **~2–3×**.

Dashboard på <http://127.0.0.1:47821/>: sparede tokens, hver tekst→billede-konvertering side om side, nødstop, live modelchips. Svar streames normalt — kun *forespørgslen* komprimeres, aldrig modellens output.

# ⚙️ Sådan virker det

```
fyldig forespørgselsblok ──► profitabilitetsspærring ──► reflow + rendering (1-bit 5×8-atlas)
                       (præcis afregningsmatematik)     ──► 1568×728 PNG-sider ──► splejses tilbage, cache-venligt
```

- **Afregning beregnes præcist, før konvertering**: Anthropic afregner `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per billede (28 px-patches — målt til nul afvigelse). En hel side rummer 28.080 tegn for 1.460 tokens ≈ **19 tegn/token**, mod ~2 tegn/token for tæt tekst. Spærringen konverterer kun, når matematikken vinder.
- **Hvad konverteres**: den statiske systemprompt + værktøjsdokumentation, gammel sammenklappet historik, store værktøjsoutputs.
- **Hvad konverteres aldrig**: dine beskeder, seneste ture, modellens output, spredt prosa, byte-nøjagtige værdier (hashes/id'er følger med som tekst), samt enhver model, der har fejlet læsebenchmarken.

# 🧭 The honest part

- **Det er lossy.** Byte-nøjagtig genkaldelse fra billeder er af natur upålidelig. Afhjælpninger implementeret: præcise identifikatorer rejser som tekst ved siden af billedet, og den målte produktionskonfiguration gav **nul stille konfabulationer** — mislykkede læsninger afstår.
- **Kun Fable 5 er godkendt i dag**, med dokumentation. GPT-5.5 og Gemini 2.5-flash kan målbart ikke læse tætpakkede renderinger; Opus 4.8 kræver 4× større glyffer. Spærringen håndhæver dette.
- **Vi fandt og undgik en afregningsfælde**: billedtieret med høj opløsning afregner 3,3× mere per side, men synsencoderen modtager ikke den ekstra opløsning — større sider læses *dårligere*. Målt, dokumenteret i [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), ikke aktiveret.
- Priser ændrer sig; det holdbare måltal er token-besparelsen, som proxyen logger per forespørgsel mod en gratis `count_tokens`-kontrafaktisk værdi.

# 🔬 Genskab ethvert tal

```bash
pnpm install && pnpm test                                     # fuld suite
node benchmarks/billing-sweep/run.mjs --dry-run               # afregningsforudsigelser, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # omkostningstabel, $0
# med nøgler: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (eller --via-cli for et Claude Code-abonnement)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Fuld metodologi og alle resultattabeller: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Rå per-svar-dokumentation: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute-familien

OmniGlyph leveres også som en **indbygget komprimeringsmotor inde i [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — den gratis AI-gateway. Der kører den som `omniglyph`-motoren (standalone enkelttilstand eller stablet med de andre motorer), med fail-closed-spærringer og billedbevidst token-regnskab.

# 🛠️ Teknologistack

| lag | teknologi |
|---|---|
| Sprog | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | eget 1-bit glyf-atlas (Spleen/Unifont-afledt, licenser i `assets/`) → PNG |
| Tests | Vitest — TDD, plus docs-integrity og rebrand-spærringer |
| Benchmarks | `benchmarks/`-rammeværker (billing-sweep, density-frontier) med JSONL-dokumentation |

## Projektlayout

| sti | hvad |
|---|---|
| `src/` | proxyen: transformationspipeline, præcis afregning per udbyder, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | rammeværkerne, der producerede hvert tal ovenfor — kan genkøres |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & fællesskab

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — fejl og feature-ønsker
- 🔒 [SECURITY.md](SECURITY.md) — sårbarhedsrapporter
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — striks TDD + måling-før-påstande
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licens

MIT — se [LICENSE](../../../LICENSE).
