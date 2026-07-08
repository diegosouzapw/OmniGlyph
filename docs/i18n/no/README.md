🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontekst som bilde

### Kutt Claude-regningen din med **59–70 %** ved å rendre tung kontekst som tette PNG-sider — samme innhold, i en brøkdel av tokenene.

**Modeller fakturerer tekst per token, men fakturerer et bilde etter dimensjonene — ikke etter hvor mye tekst som er i det.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Del av [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)-familien · [🌐 Alle språk](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| mål | resultat | kvittering |
|---|---|---|
| Reduksjon i totalregning, ende til ende | **59–70 %** | produksjonsspor, 13 709 forespørsler |
| Tokens per konvertert blokk | **10× færre** (28 080 tegn: 14 040 → 1 460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Nøyaktighet i faktureringsformelen | **null** avvik på tvers av 22 `count_tokens`-prober, 2 modeller × 2 nivåer | `benchmarks/billing-sweep/results/` |
| Eksakt lesenøyaktighet, produksjonskonfigurasjon | **30/30 (100 %)** på Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Stille konfabulasjoner i ~300 leseprober | **0** — hver bom avstår som `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Modell-scorekort** (kan den lese tette renderinger? n=30 per arm, deterministisk scoring):

| modell | lesing | dom |
|---|---|---|
| Claude **Fable 5** | **100 %** eksakt | ✅ produksjonsmål |
| Claude Opus 4.8 | 77–87 % ved 4× glyffstørrelse | ⚠️ opt-in sikker modus (besparelser faller til ~2×) |
| GPT-5.5 | 0/60 — og blåser opp svarene sine ~40× i forsøket | ❌ blokkert av porten, med bevis |
| Gemini 2.5-flash | 0/26 — og konfabulerer i stedet for å avstå | ❌ blokkert (delvis test, kvotebegrenset) |

Fordelen er **Fable-spesifikk i dag** — andre synsmodeller klarer ennå ikke å tolke tette glyffer. [Benchmark-riggen](benchmarks/README.md) tester enhver ny modell på nytt med én kommando.

# 🤔 Hvorfor OmniGlyph?

Hver langkjørende agent-økt drar med seg den samme dødvekten i hver eneste forespørsel: systemprompten, verktøydokumentasjonen og gammel historikk — fakturert på nytt per token, hver runde. OmniGlyph er en **lokal proxy** som skriver om disse tunge delene til tette PNG-sider *før de forlater maskinen din*:

- **Eksakt faktureringsmatematikk, ikke heuristikk** — den beregner leverandørens faktiske bildetoken-formel (målt til null avvik) og konverterer kun når matematikken lønner seg.
- **Fail-closed by design** — modeller som ikke klarer å lese tette renderinger blokkeres av en port, med benchmark-kvitteringer. Ingen stille kvalitetstap.
- **Privat og lokal-først** — omskrivingen skjer på `127.0.0.1`; ingenting ekstra sendes noe sted.
- **Reproduserbart** — hvert tall over har en kvittering i `benchmarks/*/results/`, som kan kjøres på nytt med én kommando.

# ⚡ Hurtigstart

```bash
npx omniglyph                                     # proxy på 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # pek Claude Code mot den
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Fungerer begge veier:
- **API-nøkkel** (betal per token): regningen din faller 59–70 % ende til ende.
- **Abonnementsøkt**: du betaler ikke mindre, men bruksgrensene telles i tokens — så grensene dine strekker seg **~2–3×**.

Dashboard på <http://127.0.0.1:47821/>: tokens spart, hver tekst→bilde-konvertering side om side, kill switch, live modell-chips. Svar strømmer normalt — kun *forespørselen* komprimeres, aldri modellens utdata.

# 🖥️ Dashboardet

Et fullstendig lokalt dashboard følger med i pakken — offline, én fil, ingen eksterne forespørsler. Seks sider, oppdatert live over SSE mens forespørsler strømmer gjennom:

![Overview: KPI-kort for mission control, sparklinje for besparelser og live event-feed](../../assets/dashboard-overview.png)

- **Overview** — mission control: besparelse i %, spart $, latency p95, cache-treffer, feil, live feed.
- **Live Flow** — pipelinen som en nodegraf: client → gate → renderer / passthrough → API, med en partikkel per reell forespørsel.
- **Telemetry** — et token/$-odometer og en live forespørselstidslinje; klikk på en hvilken som helst forespørsel for å se nøyaktig hvilke deler som ble til bilder, og les kildeteksten bak hver side.
- **Benchmarks** — kvitteringene fra rammeverket, rendret fra `benchmarks/*/results/`, én rad per modell·konfig-eksperiment, og **kjør benchmarks fra UI-en**: `$0`-dry-runs strømmer utdataene sine live; live-kjøringer forblir sperret bak API-nøkkelen din pluss en eksplisitt kostnadsbekreftelse.
- **Sessions / History** — øktene som har spart flest tokens, og hver eneste hendelse på disk.

| Live Flow | Benchmarks |
|---|---|
| ![Forespørselspipelinen som en live nodegraf](../../assets/dashboard-flow.png) | ![Benchmark-kvitteringer og dry-runs i UI-en](../../assets/dashboard-benchmarks.png) |

![Telemetry: odometer og live forespørselstidslinje](../../assets/dashboard-telemetry.png)

# ⚙️ Slik fungerer det

```
tung forespørselsblokk ──► lønnsomhetsport ──► omflyt + rendring (1-bit 5×8-atlas)
                       (eksakt faktureringsmatematikk)     ──► 1568×728 PNG-sider ──► spleis tilbake, cache-vennlig
```

- **Fakturering beregnes eksakt, før konvertering**: Anthropic fakturerer `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per bilde (28 px-patcher — målt til null avvik). En full side bærer 28 080 tegn for 1 460 tokens ≈ **19 tegn/token**, mot ~2 tegn/token for tett tekst. Porten konverterer kun når matematikken lønner seg.
- **Hva som konverteres**: den statiske systempromten + verktøydokumentasjon, gammel sammenslått historikk, store verktøyresultater.
- **Hva som aldri konverteres**: dine meldinger, nylige runder, modellens utdata, spredt prosa, byte-eksakte verdier (hasher/ID-er blir med som tekst), og enhver modell som mislyktes i lesebenchmarken.

# 📚 Biblioteksbruk (uten proxy)

Alt proxyen gjør per forespørsel finnes også som et dokumentert, importerbart API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Rendre en vilkårlig tekst til tette 1-bit PNG-sider
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Eller kjør hele forespørselstransformasjonen selv — port, faktureringsmatematikk og alt
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // den rå /v1/messages JSON-kroppen
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fastholder blokker som tekst; `options.emitRecoverable` returnerer originalene til de bilderenderte blokkene. Den eksakte faktureringsmatematikken leveres også ved pakkeroten (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — det er dette [OmniRoute](https://github.com/diegosouzapw/OmniRoute) bruker. Ren JS-kjøretid (Node og edge/Workers). Fullt overflateomfang: `src/core/index.ts`.

# 🧭 The honest part

- **Det er tapsbringende (lossy).** Byte-eksakt gjenkalling fra bilder er iboende upålitelig. Iverksatte tiltak: eksakte identifikatorer reiser som tekst ved siden av bildet, og den målte produksjonskonfigurasjonen ga **null stille konfabulasjoner** — mislykkede lesninger avstår.
- **Kun Fable 5 er godkjent i dag**, med kvitteringer. GPT-5.5 og Gemini 2.5-flash kan målbart ikke lese tette renderinger; Opus 4.8 trenger 4× større glyffer. Porten håndhever dette.
- **Vi fant og unngikk en faktureringsfelle**: det høyoppløste bildenivået fakturerer 3,3× mer per side, men synsmodellen mottar ikke den ekstra oppløsningen — større sider leser *dårligere*. Målt, dokumentert i [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), ikke aktivert.
- Priser endrer seg; det varige målet er tokenkuttet, som proxyen logger per forespørsel mot en gratis `count_tokens`-motfaktisk verdi.

# 🧠 FAQ

**Er 59–70 % ende-til-ende, eller bare på forespørslene den rørte ved?**
Ende til ende — hele regningen. De fleste komprimeringsverktøy rapporterer besparelser bare på biten de rørte ved, noe som smigrer tallet. Vår nevner er *hver eneste* forespørsel: de små som porten med rette lot være urørt, alle cache-skrivinger og -lesinger, og alle utdata-tokens (som proxyen aldri komprimerer). Tallet for kun-komprimert er høyere og oppgis separat, aldri som hovedtallet.

**Hvordan måles besparelsen?**
Begge sider av samme forespørsel, på samme tidspunkt. For hver `/v1/messages`-POST avfyrer proxyen en gratis `count_tokens`-probe på den opprinnelige, ukomprimerte kroppen (det kontrafaktiske) parallelt med den faktiske videresendingen, og leser leverandørens faktisk fakturerte bruksblokk fra svaret — begge havner i samme hendelsesrad. Cache-prising anvendes identisk på begge sider, slik at cache-rabatten går ut med seg selv og ikke kan dobbelttelles som "besparelse". Formelen ligger i `src/core/baseline.ts`; utled den selv fra din egen hendelseslogg.

**Hvorfor skulle en feillesing være en konfabulasjon i stedet for en lesefeil?**
Fordi modellsyn ikke er OCR: siden blir til patch-embeddinger, aldri diskrete tegn, så det finnes ingen glyff-for-glyff-sikkerhet å feile høylytt på — når piksler underbestemmer en glyff, fyller språkmodellens prior gapet med noe plausibelt. Denne mekanismen er nøyaktig hvorfor OmniGlyph er fail-closed om det: byte-eksakte verdier reiser alltid som tekst ved siden av bildet, modeller som mistolker blokkeres av porten, og den målte produksjonskonfigurasjonen ga **null** stille konfabulasjoner i ~300 leseprober — mislykkede lesninger avstår.

**Hva med byte-eksakt arbeid (hasher, ID-er, hemmeligheter)?**
Nylige runder og eksakte identifikatorer forblir tekst by design. For arbeidsmengder som er *utelukkende* byte-eksakte, rut dem til en modell utenfor tillatelseslisten (f.eks. en underagent på en annen Claude-modell) — alt utenfor tillatelseslisten passerer byte-identisk gjennom, urørt.

**Avgjorde ikke DeepSeek-OCR om dette fungerer?**
Det beviste at *kanalen* fungerer — med et enkoder/dekoder-par trent for oppgaven. Skepsisen stammer fra en tid da ingen ferdig produksjonsmodell kunne lese tette renderinger; det har endret seg, og [modell-scorekortet](../../../README.md#-the-numbers--measured-not-estimated) over viser nøyaktig hvem som leser dem i dag, med kvitteringer. [Benchmark-riggen](../../../benchmarks/README.md) tester enhver ny modell på nytt med én kommando — porten følger dataene, ikke hypen.

# 🔬 Reproduser hvert tall

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# med nøkler: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (eller --via-cli for et Claude Code-abonnement)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Full metodikk og hver resultattabell: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Rå per-svar-kvitteringer: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute-familien

OmniGlyph leveres også som en **innebygd komprimeringsmotor inni [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — den gratis AI-gatewayen. Der kjører den som `omniglyph`-motoren (frittstående enkeltmodus eller stablet med de andre motorene), med fail-closed-porter og bildebevisst tokenregnskap.

# 🛠️ Teknologistabel

| lag | teknologi |
|---|---|
| Språk | TypeScript (strict), ESM |
| Kjøretid | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendring | eget 1-bit glyffatlas (Spleen/Unifont-avledet, lisenser i `assets/`) → PNG |
| Tester | Vitest — TDD, pluss dokumentasjonsintegritet og rebrand-vakter |
| Benchmarks | `benchmarks/`-rigger (billing-sweep, density-frontier) med JSONL-kvitteringer |

## Prosjektstruktur

| sti | hva |
|---|---|
| `src/` | proxyen: transformasjonspipeline, eksakt fakturering per leverandør, renderer, verter (Node + Cloudflare Workers) |
| `benchmarks/` | riggene som produserte hvert tall over — kan kjøres på nytt |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Støtte og fellesskap

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — feil og funksjonsforespørsler
- 🔒 [SECURITY.md](SECURITY.md) — rapportering av sårbarheter
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — streng TDD + måling-før-påstander
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Anerkjennelser

OmniGlyph står på skuldrene til ett prosjekt spesielt — denne seksjonen er vår permanente takk.

| Prosjekt | Hvordan det formet OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Oppdagelsen hele dette prosjektet er bygget på.** pxpipe beviste, med kvitteringer, at en produksjons-LLMs synskanal kan bære tett tekstuell kontekst til en brøkdel av tokenkostnaden — og at konverteringen må avgjøres per forespørsel av eksakt faktureringsmatematikk, aldri av magefølelse. Den tette 1-bit-renderingen, lønnsomhetsporten, `count_tokens`-motfaktiske verdien, den fail-closed modell-tillatelseslisten og "mål før du påstår"-dokumentasjonskulturen ble alle pionert der. OmniGlyph nedstammer direkte fra den kodebasen (MIT — den originale opphavsrettslinjen forblir i vår [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 5×8-bitmapfontfamilien vårt tette 1-bit-glyffatlas er avledet fra (lisens i `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Dekning for glyffene utenfor Spleens rekkevidde i det samme atlaset (lisens i `assets/`). |

Hvis du finner OmniGlyph nyttig, gi også opphavsprosjektet en stjerne — oppdagelsen var deres. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Lisens

MIT — se [LICENSE](../../../LICENSE).
