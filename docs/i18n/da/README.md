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

# 🔌 Brug med Claude-klienter

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ Dashboardet

Et fuldt lokalt dashboard følger med i pakken — offline, én fil, ingen eksterne forespørgsler. Seks sider, opdateret live over SSE, mens forespørgsler strømmer igennem:

![Overview: KPI-kort til mission control, sparklinje for besparelser og live event-feed](../../assets/dashboard-overview.png)

- **Overview** — mission control: besparelse i %, sparede $, latency p95, cache-hits, fejl, live feed.
- **Live Flow** — pipelinen som en nodegraf: client → gate → renderer / passthrough → API, med en partikel per reel forespørgsel.
- **Telemetry** — et token/$-odometer og en live forespørgselstidslinje; klik på en vilkårlig forespørgsel for at se præcis, hvilke dele der blev til billeder, og læs kildeteksten bag hver side.
- **Benchmarks** — rammeværk-dokumentationen renderet fra `benchmarks/*/results/`, én række per model·config-eksperiment, og **kør benchmarks fra UI'en**: `$0` dry-runs streamer deres output live; live-kørsler forbliver spærret bag din API-nøgle plus en eksplicit omkostningsbekræftelse.
- **Sessions / History** — de sessioner, der har sparet flest tokens, og hver eneste hændelse på disk.

| Live Flow | Benchmarks |
|---|---|
| ![Forespørgselspipelinen som en live nodegraf](../../assets/dashboard-flow.png) | ![Benchmark-dokumentation og dry-runs i UI'en](../../assets/dashboard-benchmarks.png) |

![Telemetry: odometer og live forespørgselstidslinje](../../assets/dashboard-telemetry.png)

# ⚙️ Sådan virker det

```
fyldig forespørgselsblok ──► profitabilitetsspærring ──► reflow + rendering (1-bit 5×8-atlas)
                       (præcis afregningsmatematik)     ──► 1568×728 PNG-sider ──► splejses tilbage, cache-venligt
```

- **Afregning beregnes præcist, før konvertering**: Anthropic afregner `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per billede (28 px-patches — målt til nul afvigelse). En hel side rummer 28.080 tegn for 1.460 tokens ≈ **19 tegn/token**, mod ~2 tegn/token for tæt tekst. Spærringen konverterer kun, når matematikken vinder.
- **Hvad konverteres**: den statiske systemprompt + værktøjsdokumentation, gammel sammenklappet historik, store værktøjsoutputs.
- **Hvad konverteres aldrig**: dine beskeder, seneste ture, modellens output, spredt prosa, byte-nøjagtige værdier (hashes/id'er følger med som tekst), samt enhver model, der har fejlet læsebenchmarken.

# 📚 Brug som bibliotek (uden proxy)

Alt, hvad proxyen gør per forespørgsel, findes også som en dokumenteret, importerbar API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render en vilkårlig tekst til tætpakkede 1-bit PNG-sider
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Eller kør selv den fulde forespørgselstransformation — spærring, afregningsmatematik og det hele
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // den rå /v1/messages JSON-body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fastholder blokke som tekst; `options.emitRecoverable` returnerer originalerne af de billedgjorte blokke. Den præcise afregningsmatematik leveres også ved pakkens rod (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — det er det, [OmniRoute](https://github.com/diegosouzapw/OmniRoute) forbruger. Ren JS-runtime (Node og edge/Workers). Fuld overflade: `src/core/index.ts`.

# 📤 Offline-eksport — ingen proxy, ingen Claude Code

Ikke på Claude Code? Rendér konteksten til PNG-sider **lokalt**, og indsæt dem i Cursor, ChatGPT eller enhver chat, der accepterer billeduploads. Ingen proxy, ingen API-nøgle, ingen tilkoblet konto:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Du får én mappe med alt, hvad du skal lægge ind i chatten:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` renderer din ikke-committede diff, `--diff <ref>` et commit-interval, `--open` viser mappen (macOS). Det hele kører på din maskine — eksportstien starter aldrig proxyen og kalder aldrig en model. Kør `omniglyph export --help` for alle flag.

# 🧭 The honest part

- **Det er lossy.** Byte-nøjagtig genkaldelse fra billeder er af natur upålidelig. Afhjælpninger implementeret: præcise identifikatorer rejser som tekst ved siden af billedet, og den målte produktionskonfiguration gav **nul stille konfabulationer** — mislykkede læsninger afstår.
- **Kun Fable 5 er godkendt i dag**, med dokumentation. GPT-5.5 og Gemini 2.5-flash kan målbart ikke læse tætpakkede renderinger; Opus 4.8 kræver 4× større glyffer. Spærringen håndhæver dette.
- **Vi fandt og undgik en afregningsfælde**: billedtieret med høj opløsning afregner 3,3× mere per side, men synsencoderen modtager ikke den ekstra opløsning — større sider læses *dårligere*. Målt, dokumenteret i [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), ikke aktiveret.
- Priser ændrer sig; det holdbare måltal er token-besparelsen, som proxyen logger per forespørgsel mod en gratis `count_tokens`-kontrafaktisk værdi.

# 🧠 FAQ

**Jeg slog det til midt i en session, og forbruget røg i vejret — hvorfor?**
En session, der kørte uden OmniGlyph, har hele sit præfiks cachet hos Anthropic som tekst til 0,1× læsetakst; den første forespørgsel med billeder ville genbetale det hele som en frisk cache-skrivning til 1,25× i én enkelt prompt. Proxyen beskytter mod dette: en session, den aldrig har billedliggjort, får denne engangsomkostning regnet ind i break-even-porten og skifter kun til billeder, hvis det stadig kan betale sig — ellers forbliver sessionen tekst, og besparelsen begynder med din næste nye session.

**Er de 59–70 % end-to-end, eller kun på de forespørgsler, den rørte ved?**
End-to-end — hele regningen. De fleste komprimeringsværktøjer rapporterer kun besparelser på den del, de rørte ved, hvilket smigrer tallet. Vores nævner er *hver eneste* forespørgsel: de små, som spærringen med rette lod være urørt, alle cache-skrivninger og -læsninger, og alle output-tokens (som proxyen aldrig komprimerer). Kun-komprimeret-tallet er højere og angives separat, aldrig som hovedtal.

**Hvordan måles besparelsen?**
Begge sider af samme forespørgsel, på samme tidspunkt. For hver `/v1/messages`-POST affyrer proxyen en gratis `count_tokens`-probe på den oprindelige, ukomprimerede krop (den kontrafaktiske) parallelt med den reelle videresendelse, og aflæser udbyderens faktisk afregnede forbrugsblok fra svaret — begge lander i samme hændelsesrække. Cache-priser anvendes identisk på begge sider, så cache-rabatten går ud med sig selv og kan ikke tælles dobbelt som "besparelse". Formlen ligger i `src/core/baseline.ts`; udled den selv fra din egen hændelseslog.

**Hvorfor skulle en fejllæsning være en konfabulation frem for en læsefejl?**
Fordi modelsyn ikke er OCR: siden bliver til patch-embeddings, aldrig diskrete tegn, så der findes ingen tegn-for-tegn-konfidens at fejle højlydt på — når pixlerne underbestemmer et glyf, udfylder sprogmodellens forudindtagethed hullet med noget plausibelt. Den mekanisme er præcis grunden til, at OmniGlyph er fail-closed omkring det: byte-nøjagtige værdier rejser altid som tekst ved siden af billedet, modeller, der fejllæser, blokeres af spærringen, og den målte produktionskonfiguration gav **nul** stille konfabulationer i ~300 læseprober — mislykkede læsninger afstår.

**Hvad med byte-nøjagtigt arbejde (hashes, id'er, hemmeligheder)?**
Seneste ture og præcise identifikatorer forbliver tekst by design. Til arbejdsbyrder, der er *udelukkende* byte-nøjagtige, skal de routes til en model uden for allowlisten (f.eks. en subagent på en anden Claude-model) — alt uden for allowlisten passerer byte-identisk igennem, urørt.

**Afgjorde DeepSeek-OCR ikke, om det her virker?**
Det beviste, at *kanalen* virker — med et encoder/decoder-par trænet til opgaven. Skepsissen stammer fra dengang, hvor ingen standard-produktionsmodel kunne læse tætpakkede renderinger; det har ændret sig, og [modelscorekortet](../../../README.md#-the-numbers--measured-not-estimated) ovenfor viser præcis, hvem der læser dem i dag, med dokumentation. [Benchmark-rammeværket](../../../benchmarks/README.md) gentester enhver ny model med én kommando — spærringen følger dataene, ikke hypen.

**Kan jeg bruge det uden Claude Code — Cursor, ChatGPT, en almindelig pipe?**
Ja, på to måder. Som en **proxy** virker det med enhver klient, der lader dig sætte API-base-URL'en (`ANTHROPIC_BASE_URL` eller OpenAI-base-URL'en) — Claude Code, dine egne scripts, hvad som helst over HTTP. Og til værktøjer, der ikke kan bruge proxy, renderer **Offline-eksport** ovenfor konteksten til PNG-sider, som du indsætter manuelt — `omniglyph export --stdin` læser endda direkte fra en Unix-pipe.

**Hvordan bliver tekst egentlig til et billede?**
Den ombryder teksten og maler den med et 1-bit 5×8-pixel-glyfatlas på tætpakkede 1568×728 PNG-sider — én bit per pixel, ingen anti-aliasing, så modellen afregner siden efter dens dimensioner, ikke efter hvor mange tegn der er inden i. **Sådan virker det** ovenfor har pipelinen; benchmark-dokumentet har geometrien og hvorfor tættere ikke altid er billigere.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Anerkendelser

OmniGlyph står på skuldrene af ét projekt i særdeleshed — dette afsnit er vores permanente tak.

| Projekt | Hvordan det formede OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Opdagelsen, hele dette projekt er bygget på.** pxpipe beviste, med dokumentation, at en produktions-LLM's synskanal kan bære tætpakket tekstuel kontekst til en brøkdel af token-omkostningen — og at konverteringen skal afgøres per forespørgsel af præcis afregningsmatematik, aldrig af fornemmelser. Den tætpakkede 1-bit-rendering, profitabilitetsspærringen, `count_tokens`-kontrafaktiske værdi, den fail-closed model-allowlist og "mål, før du påstår"-dokumentationskulturen blev alle pioneret der. OmniGlyph nedstammer direkte fra den kodebase (MIT — den oprindelige copyright-linje forbliver i vores [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 5×8-bitmapskrifttypefamilien, som vores tætpakkede 1-bit-glyfatlas er afledt af (licens i `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Dækning for glyfferne uden for Spleens område i det samme atlas (licens i `assets/`). |

Hvis du finder OmniGlyph nyttig, så giv også ophavsprojektet en stjerne — opdagelsen var deres. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licens

MIT — se [LICENSE](../../../LICENSE).
