🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Context als afbeelding

### Verlaag uw Claude-rekening met **59–70%** door omvangrijke context als dichte PNG-pagina's te renderen — dezelfde inhoud, met een fractie van de tokens.

**Modellen rekenen tekst per token af, maar een afbeelding wordt afgerekend op basis van haar afmetingen — niet op basis van hoeveel tekst erin staat.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-de-cijfers--gemeten-niet-geschat)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-het-eerlijke-verhaal)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Onderdeel van de [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)-familie

</div>

---

# 📊 De cijfers — gemeten, niet geschat

| metriek | resultaat | bewijs |
|---|---|---|
| End-to-end rekeningreductie | **59–70%** | productietrace, 13.709 verzoeken |
| Tokens per geconverteerd blok | **10× minder** (28.080 tekens: 14.040 → 1.460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Nauwkeurigheid van de billing-formule | residueel **nul** over 22 `count_tokens`-probes, 2 modellen × 2 tiers | `benchmarks/billing-sweep/results/` |
| Exacte leesnauwkeurigheid, productieconfiguratie | **30/30 (100%)** op Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Stille confabulaties in ~300 leesprobes | **0** — elke misser onthoudt zich als `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Modelscorekaart** (kan het model dichte renders lezen? n=30 per arm, deterministische scoring):

| model | leesvaardigheid | oordeel |
|---|---|---|
| Claude **Fable 5** | **100%** exact | ✅ productiedoel |
| Claude Opus 4.8 | 77–87% bij 4× glyfgrootte | ⚠️ opt-in veilige modus (besparingen dalen naar ~2×) |
| GPT-5.5 | 0/60 — en overschat zijn antwoorden ~40× bij de poging | ❌ geblokkeerd door de poort, met bewijs |
| Gemini 2.5-flash | 0/26 — en confabuleert in plaats van zich te onthouden | ❌ geblokkeerd (gedeeltelijke test, quotum-gelimiteerd) |

Het voordeel is **vandaag Fable-specifiek** — andere vision-encoders kunnen dichte glyfen nog niet ontcijferen. De [benchmark-harness](benchmarks/README.md) test elk nieuw model opnieuw met één commando.

# 🤔 Waarom OmniGlyph?

Elke langlopende agentsessie sleept bij elk verzoek hetzelfde dode gewicht mee: de systeemprompt, tool-documentatie en oude geschiedenis — telkens opnieuw per token gefactureerd, elke beurt. OmniGlyph is een **lokale proxy** die deze omvangrijke onderdelen herschrijft naar dichte PNG-pagina's *voordat ze uw machine verlaten*:

- **Exacte billing-wiskunde, geen heuristieken** — het berekent de werkelijke image-token-formule van de provider (gemeten tot residueel nul) en converteert alleen wanneer de wiskunde in het voordeel uitvalt.
- **Fail-closed by design** — modellen die dichte renders niet kunnen lezen, worden geblokkeerd door een poort, met benchmarkbewijzen. Geen stille kwaliteitsverlies.
- **Privé en local-first** — het herschrijven gebeurt op `127.0.0.1`; er wordt verder niets ergens naartoe verzonden.
- **Reproduceerbaar** — elk bovenstaand cijfer heeft een bewijs in `benchmarks/*/results/`, in één commando opnieuw uit te voeren.

# ⚡ Snel starten

```bash
npx omniglyph                                     # proxy op 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # richt Claude Code erop
```

![Quickstart: start de proxy, controleer het dashboard, richt Claude Code erop](../../../docs/assets/demo-quickstart.gif)

Werkt op beide manieren:
- **API-sleutel** (betalen per token): uw rekening daalt end-to-end 59–70%.
- **Abonnementssessie**: u betaalt niet minder, maar gebruikslimieten worden in tokens geteld — dus uw limieten rekken **~2–3×** verder.

Dashboard op <http://127.0.0.1:47821/>: bespaarde tokens, elke tekst-naar-afbeelding-conversie naast elkaar, noodstop, live modelchips. Antwoorden worden normaal gestreamd — alleen het *verzoek* wordt gecomprimeerd, nooit de uitvoer van het model.

# ⚙️ Hoe het werkt

```
omvangrijk verzoekblok ──► winstgevendheidspoort ──► reflow + render (1-bit 5×8 atlas)
                       (exacte billing-wiskunde)     ──► 1568×728 PNG-pagina's ──► terugvoegen, cache-vriendelijk
```

- **Billing wordt exact berekend, vóór de conversie**: Anthropic factureert `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per afbeelding (28 px-patches — gemeten tot residueel nul). Een volledige pagina bevat 28.080 tekens voor 1.460 tokens ≈ **19 tekens/token**, tegenover ~2 tekens/token voor dichte tekst. De poort converteert alleen wanneer de wiskunde in het voordeel uitvalt.
- **Wat wordt geconverteerd**: de statische systeemprompt + tool-documentatie, oude ingeklapte geschiedenis, grote tool-uitvoer.
- **Wat nooit wordt geconverteerd**: uw berichten, recente beurten, de uitvoer van het model, schaarse proza, byte-exacte waarden (hashes/ID's reizen als tekst mee), en elk model dat de leesbenchmark niet haalde.

# 🧭 Het eerlijke verhaal

- **Het is lossy.** Byte-exacte herinnering vanuit afbeeldingen is van nature onbetrouwbaar. Verzachtende maatregelen: exacte identifiers reizen als tekst naast de afbeelding, en de gemeten productieconfiguratie leverde **nul stille confabulaties** op — mislukte lezingen onthouden zich.
- **Alleen Fable 5 is vandaag goedgekeurd**, met bewijzen. GPT-5.5 en Gemini 2.5-flash kunnen aantoonbaar geen dichte renders lezen; Opus 4.8 heeft 4× grotere glyfen nodig. De poort dwingt dit af.
- **We hebben een billing-valkuil ontdekt en vermeden**: de hoge-resolutie-afbeeldingstier factureert 3,3× meer per pagina, maar de vision-encoder ontvangt de extra resolutie niet — grotere pagina's lezen *slechter*. Gemeten, gedocumenteerd in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), niet ingeschakeld.
- Prijzen veranderen; de blijvende metriek is de tokenreductie, die de proxy per verzoek logt tegenover een gratis `count_tokens`-tegenfeitelijke.

# 🔬 Reproduceer elk cijfer

```bash
pnpm install && pnpm test                                     # volledige testsuite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing-voorspellingen, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # kostentabel, $0
# met sleutels: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (of --via-cli voor een Claude Code-abonnement)
```

![De twee benchmark-harnesses die in dry-run-modus draaien](../../../docs/assets/demo-benchmarks.gif)

Volledige methodologie en elke resultatentabel: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Ruwe bewijzen per antwoord: `benchmarks/*/results/*.jsonl`.

# 🚀 De OmniRoute-familie

OmniGlyph wordt ook geleverd als een **native compressie-engine binnen [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — de gratis AI-gateway. Daar draait het als de `omniglyph`-engine (standalone in single-modus of gestapeld met de andere engines), met fail-closed poorten en image-aware tokenboekhouding.

# 🛠️ Technische stack

| laag | technologie |
|---|---|
| Taal | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | eigen 1-bit glyf-atlas (afgeleid van Spleen/Unifont, licenties in `assets/`) → PNG |
| Tests | Vitest — TDD, plus docs-integrity- en rebrand-guards |
| Benchmarks | `benchmarks/`-harnesses (billing-sweep, density-frontier) met JSONL-bewijzen |

## Projectindeling

| pad | wat |
|---|---|
| `src/` | de proxy: transformatiepijplijn, exacte billing per provider, renderer, hosts (Node + Cloudflare Workers) |
| `benchmarks/` | de harnesses die elk bovenstaand cijfer hebben opgeleverd — opnieuw uit te voeren |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Ondersteuning & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs en featureverzoeken
- 🔒 [SECURITY.md](SECURITY.md) — meldingen van kwetsbaarheden
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strikte TDD + meting-vóór-beweringen
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licentie

MIT — zie [LICENSE](../../../LICENSE).
