🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontext som bild

### Sänk din Claude-räkning med **59–70 %** genom att rendera skrymmande kontext som täta PNG-sidor — samma innehåll, till en bråkdel av tokens.

**Modeller fakturerar text per token, men fakturerar en bild efter dess dimensioner — inte efter hur mycket text den innehåller.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Del av [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)-familjen · [🌐 All languages](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| mätvärde | resultat | belägg |
|---|---|---|
| Total räkningsminskning (från ände till ände) | **59–70 %** | produktionsspår, 13 709 anrop |
| Tokens per konverterat block | **10× färre** (28 080 tecken: 14 040 → 1 460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Noggrannhet i faktureringsformeln | residual **noll** över 22 `count_tokens`-prober, 2 modeller × 2 nivåer | `benchmarks/billing-sweep/results/` |
| Exakt läsnoggrannhet, produktionskonfiguration | **30/30 (100 %)** på Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Tysta konfabulationer i ~300 läsprober | **0** — varje missad läsning avstår som `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Modellöversikt** (kan den läsa täta renderingar? n=30 per arm, deterministisk poängsättning):

| modell | läsning | utfall |
|---|---|---|
| Claude **Fable 5** | **100 %** exakt | ✅ produktionsmål |
| Claude Opus 4.8 | 77–87 % vid 4× glyfstorlek | ⚠️ valbart säkert läge (besparingar sjunker till ~2×) |
| GPT-5.5 | 0/60 — och blåser upp sina svar ~40× i försöket | ❌ blockerad av spärren, med belägg |
| Gemini 2.5-flash | 0/26 — och konfabulerar i stället för att avstå | ❌ blockerad (delvist test, kvotbegränsad) |

Fördelen är **Fable-specifik idag** — andra vision-kodare kan ännu inte tolka täta glyfer. [Benchmark-ramverket](benchmarks/README.md) testar om varje ny modell med ett enda kommando.

# 🤔 Varför OmniGlyph?

Varje långvarig agentsession släpar med sig samma döda vikt i varje anrop: systemprompten, verktygsdokumentationen och gammal historik — omfakturerad per token, varje tur. OmniGlyph är en **lokal proxy** som skriver om dessa skrymmande delar till täta PNG-sidor *innan de lämnar din dator*:

- **Exakt faktureringsmatematik, inga heuristiker** — den beräknar leverantörens verkliga bild-token-formel (mätt till residual noll) och konverterar bara när matematiken lönar sig.
- **Fail-closed by design** — modeller som inte kan läsa täta renderingar blockeras av en spärr, med benchmark-belägg. Ingen tyst kvalitetsförlust.
- **Privat och lokal-först** — omskrivningen sker på `127.0.0.1`; inget extra skickas någonstans.
- **Reproducerbart** — varje siffra ovan har ett belägg i `benchmarks/*/results/`, körbart igen med ett kommando.

# ⚡ Snabbstart

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Fungerar på båda sätten:
- **API-nyckel** (betalning per token): din räkning sjunker 59–70 % från ände till ände.
- **Prenumerationssession**: du betalar inte mindre, men användningsgränser räknas i tokens — så dina gränser räcker **~2–3×** längre.

Instrumentpanel på <http://127.0.0.1:47821/>: sparade tokens, varje text-till-bild-konvertering sida vid sida, dödomkopplare, live-modellchips. Svar strömmas normalt — endast *förfrågan* komprimeras, aldrig modellens utdata.

# ⚙️ Hur det fungerar

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **Fakturering beräknas exakt, före konvertering**: Anthropic fakturerar `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per bild (28 px-patchar — mätt till residual noll). En full sida bär 28 080 tecken för 1 460 tokens ≈ **19 tecken/token**, jämfört med ~2 tecken/token för tät text. Spärren konverterar bara när matematiken lönar sig.
- **Vad som konverteras**: den statiska systemprompten + verktygsdokumentation, gammal hopfälld historik, stora verktygsutdata.
- **Vad som aldrig konverteras**: dina meddelanden, senaste turerna, modellens utdata, gles prosa, byte-exakta värden (hashar/id:n följer med som text), samt varje modell som misslyckats med läsbenchmarken.

# 🧭 The honest part

- **Det är förlustbehäftat.** Byte-exakt återgivning från bilder är till sin natur opålitlig. Genomförda motåtgärder: exakta identifierare reser som text bredvid bilden, och den mätta produktionskonfigurationen gav **noll tysta konfabulationer** — misslyckade läsningar avstår.
- **Endast Fable 5 är godkänd idag**, med belägg. GPT-5.5 och Gemini 2.5-flash kan mätbart inte läsa täta renderingar; Opus 4.8 behöver 4× större glyfer. Spärren upprätthåller detta.
- **Vi hittade och undvek en faktureringsfälla**: den högupplösta bildnivån fakturerar 3,3× mer per sida, men vision-kodaren tar inte emot den extra upplösningen — större sidor läses *sämre*. Mätt, dokumenterat i [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), inte aktiverat.
- Priser förändras; det bestående måttet är tokenminskningen, som proxyn loggar per förfrågan mot ett kostnadsfritt `count_tokens`-motfaktum.

# 🔬 Reproducera varje siffra

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Fullständig metodik och varje resultattabell: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Rådata per svar: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute-familjen

OmniGlyph levereras också som en **inbyggd kompressionsmotor inuti [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — den kostnadsfria AI-gatewayen. Där körs den som `omniglyph`-motorn (fristående enkelläge eller staplad med de andra motorerna), med fail-closed-spärrar och bildmedveten tokenredovisning.

# 🛠️ Teknikstack

| lager | teknik |
|---|---|
| Språk | TypeScript (strict), ESM |
| Körmiljö | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | egen 1-bitars glyfatlas (Spleen/Unifont-baserad, licenser i `assets/`) → PNG |
| Tester | Vitest — TDD, samt integritetstester för dokumentation och varumärkesskydd |
| Benchmarks | `benchmarks/`-ramverk (billing-sweep, density-frontier) med JSONL-belägg |

## Projektstruktur

| sökväg | vad |
|---|---|
| `src/` | proxyn: transformationskedja, exakt fakturering per leverantör, renderare, värdar (Node + Cloudflare Workers) |
| `benchmarks/` | ramverken som tagit fram varje siffra ovan — körbara igen |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & gemenskap

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — buggar och funktionsönskemål
- 🔒 [SECURITY.md](SECURITY.md) — säkerhetsrapporter
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strikt TDD + mätning-före-påståenden
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licens

MIT — se [LICENSE](../../../LICENSE).
