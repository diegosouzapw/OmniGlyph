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

# 🔌 Gebruik met Claude-clients

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

# 🖥️ Het dashboard

Een volledig lokaal dashboard zit ingebouwd in het pakket — offline, single-file, zonder externe requests. Zes pagina's, live bijgewerkt via SSE terwijl requests binnenkomen:

![Overview: mission-control KPI-kaarten, besparingssparkline en live event-feed](../../assets/dashboard-overview.png)

- **Overview** — mission control: besparing %, bespaarde $, latentie p95, cache hits, fouten, live feed.
- **Live Flow** — de pipeline als een node graph: client → gate → renderer / passthrough → API, met een deeltje per echt request.
- **Telemetry** — een token/$-teller en een live requesttijdlijn; klik op een willekeurig request om precies te zien welke onderdelen afbeeldingen zijn geworden en lees de brontekst achter elke pagina.
- **Benchmarks** — de harness-bewijzen gerenderd vanuit `benchmarks/*/results/`, één rij per model·configuratie-experiment, en **draai de benchmarks vanuit de UI**: `$0`-dry-runs streamen hun uitvoer live; live runs blijven vergrendeld achter uw API-sleutel plus een expliciete kostenbevestiging.
- **Sessions / History** — de sessies met de meeste bespaarde tokens en elke gebeurtenis op schijf.

| Live Flow | Benchmarks |
|---|---|
| ![De requestpipeline als live node graph](../../assets/dashboard-flow.png) | ![Benchmark-bewijzen en dry-runs in de UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: teller en live requesttijdlijn](../../assets/dashboard-telemetry.png)

# ⚙️ Hoe het werkt

```
omvangrijk verzoekblok ──► winstgevendheidspoort ──► reflow + render (1-bit 5×8 atlas)
                       (exacte billing-wiskunde)     ──► 1568×728 PNG-pagina's ──► terugvoegen, cache-vriendelijk
```

- **Billing wordt exact berekend, vóór de conversie**: Anthropic factureert `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens per afbeelding (28 px-patches — gemeten tot residueel nul). Een volledige pagina bevat 28.080 tekens voor 1.460 tokens ≈ **19 tekens/token**, tegenover ~2 tekens/token voor dichte tekst. De poort converteert alleen wanneer de wiskunde in het voordeel uitvalt.
- **Wat wordt geconverteerd**: de statische systeemprompt + tool-documentatie, oude ingeklapte geschiedenis, grote tool-uitvoer.
- **Wat nooit wordt geconverteerd**: uw berichten, recente beurten, de uitvoer van het model, schaarse proza, byte-exacte waarden (hashes/ID's reizen als tekst mee), en elk model dat de leesbenchmark niet haalde.

# 📚 Bibliotheekgebruik (zonder proxy)

Alles wat de proxy per verzoek doet, is ook beschikbaar als gedocumenteerde, importeerbare API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render tekst naar dichte 1-bit PNG-pagina's
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Of voer de volledige verzoektransformatie zelf uit — poort, billing-wiskunde en alles
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // de ruwe /v1/messages JSON-body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` zet blokken vast als tekst; `options.emitRecoverable` geeft de originelen van als afbeelding weergegeven blokken terug. De exacte billing-wiskunde wordt ook op het package-root niveau geleverd (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — dat is wat [OmniRoute](https://github.com/diegosouzapw/OmniRoute) gebruikt. Pure-JS runtime (Node en edge/Workers). Volledige oppervlakte: `src/core/index.ts`.

# 📤 Offline export — zonder proxy, zonder Claude Code

Werkt u niet met Claude Code? Render de context **lokaal** naar PNG-pagina's en plak ze in Cursor, ChatGPT of een willekeurige chat die afbeeldingsuploads accepteert. Geen proxy, geen API-sleutel, geen gekoppeld account:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

U krijgt één map met alles om in de chat te plaatsen:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` rendert uw niet-gecommitte diff, `--diff <ref>` een commit-bereik, `--open` toont de map (macOS). Alles draait op uw eigen machine — het exportpad start nooit de proxy en roept nooit een model aan. Voer `omniglyph export --help` uit voor alle opties.

# 🧭 Het eerlijke verhaal

- **Het is lossy.** Byte-exacte herinnering vanuit afbeeldingen is van nature onbetrouwbaar. Verzachtende maatregelen: exacte identifiers reizen als tekst naast de afbeelding, en de gemeten productieconfiguratie leverde **nul stille confabulaties** op — mislukte lezingen onthouden zich.
- **Alleen Fable 5 is vandaag goedgekeurd**, met bewijzen. GPT-5.5 en Gemini 2.5-flash kunnen aantoonbaar geen dichte renders lezen; Opus 4.8 heeft 4× grotere glyfen nodig. De poort dwingt dit af.
- **We hebben een billing-valkuil ontdekt en vermeden**: de hoge-resolutie-afbeeldingstier factureert 3,3× meer per pagina, maar de vision-encoder ontvangt de extra resolutie niet — grotere pagina's lezen *slechter*. Gemeten, gedocumenteerd in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), niet ingeschakeld.
- Prijzen veranderen; de blijvende metriek is de tokenreductie, die de proxy per verzoek logt tegenover een gratis `count_tokens`-tegenfeitelijke.

# 🧠 FAQ

**Is de 59–70% end-to-end, of alleen op de verzoeken die zijn aangepast?**
End-to-end — de volledige rekening. De meeste compressietools rapporteren besparingen alleen over het deel dat ze hebben aangepast, wat het cijfer vleit. Onze noemer is *elk* verzoek: de kleine verzoeken die de poort terecht ongemoeid liet, alle cache-writes en -reads, en alle outputtokens (die de proxy nooit comprimeert). Alleen-gecomprimeerd scoort hoger en wordt apart vermeld, nooit als hoofdcijfer.

**Hoe wordt de besparing gemeten?**
Beide kanten van hetzelfde verzoek, op hetzelfde moment. Voor elke `/v1/messages`-POST vuurt de proxy parallel aan de echte doorstuur een gratis `count_tokens`-probe af op de originele ongecomprimeerde body (de tegenfeitelijke), en leest het daadwerkelijk gefactureerde usage-blok van de provider uit het antwoord — beide belanden in dezelfde eventregel. Cacheprijzen worden op beide kanten identiek toegepast, zodat de cachekorting wegvalt en niet dubbel als "besparing" kan worden meegeteld. De formule staat in `src/core/baseline.ts`; leid hem zelf opnieuw af uit uw eigen eventenlog.

**Waarom zou een misser een confabulatie zijn in plaats van een leesfout?**
Omdat modelvisie geen OCR is: de pagina wordt patch-embeddings, nooit discrete tekens, dus er is geen betrouwbaarheid per glyph om luid op te falen — wanneer pixels een glyph onvoldoende bepalen, vult de taalprior het gat met iets aannemelijks. Precies dat mechanisme is waarom OmniGlyph hier fail-closed op is: byte-exacte waarden reizen altijd als tekst naast de afbeelding, modellen die verkeerd lezen worden geblokkeerd door de poort, en de gemeten productieconfiguratie leverde **nul** stille confabulaties op in ~300 leesprobes — mislukte lezingen onthouden zich.

**Hoe zit het met byte-exact werk (hashes, ID's, geheimen)?**
Recente beurten en exacte identifiers blijven by design tekst. Voor workloads die *volledig* byte-exact zijn, routeer ze naar een model dat niet op de allowlist staat (bijv. een subagent op een ander Claude-model) — alles buiten de allowlist gaat byte-identiek en ongemoeid door.

**Heeft DeepSeek-OCR niet al bewezen dat dit werkt?**
Dat bewees dat het *kanaal* werkt — met een encoder/decoder-paar dat voor die taak is getraind. Het scepticisme dateert van toen geen enkel standaard productiemodel dichte renders kon lezen; dat is veranderd, en de [modelscorekaart](../../../README.md#-the-numbers--measured-not-estimated) hierboven laat precies zien wie ze vandaag kan lezen, met bewijzen. De [benchmark-harness](../../../benchmarks/README.md) test elk nieuw model opnieuw met één commando — de poort volgt de data, niet de hype.

**Kan ik het zonder Claude Code gebruiken — Cursor, ChatGPT, een gewone pipe?**
Ja, op twee manieren. Als **proxy** werkt het met elke client waarmee u de API-base-URL kunt instellen (`ANTHROPIC_BASE_URL`, of de OpenAI-base-URL) — Claude Code, uw eigen scripts, alles wat HTTP spreekt. En voor tools die niet kunnen proxyen, rendert de **Offline export** hierboven de context naar PNG-pagina's die u handmatig inplakt — `omniglyph export --stdin` leest zelfs rechtstreeks uit een Unix-pipe.

**Hoe zet het tekst eigenlijk om in een afbeelding?**
Het reflowt de tekst en schildert die met een 1-bit 5×8-pixelglyfatlas op dichte 1568×728 PNG-pagina's — één bit per pixel, geen anti-aliasing, zodat het model de pagina afrekent op basis van haar afmetingen, niet op basis van hoeveel tekens erin staan. **Hoe het werkt** hierboven toont de pipeline; de benchmarks-doc bevat de geometrie en waarom dichter niet altijd goedkoper is.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Dankbetuigingen

OmniGlyph staat op de schouders van één project in het bijzonder — deze sectie is ons blijvende dankwoord.

| Project | Hoe het OmniGlyph heeft gevormd |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **De ontdekking waarop dit hele project is gebouwd.** pxpipe bewees, met bewijzen, dat het vision-kanaal van een productie-LLM dichte tekstuele context kan dragen tegen een fractie van de tokenkosten — en dat de conversie per verzoek moet worden beslist door exacte billing-wiskunde, nooit op gevoel. De dichte 1-bit-rendering, de winstgevendheidspoort, de `count_tokens`-tegenfeitelijke, de fail-closed model-allowlist en de cultuur van "meet voordat u beweert" werden daar allemaal als eerste ontwikkeld. OmniGlyph stamt rechtstreeks af van die codebase (MIT — de originele copyrightregel blijft staan in onze [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | De 5×8-bitmapfontfamilie waarvan onze dichte 1-bit-glyfatlas is afgeleid (licentie in `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Dekking voor de glyfen buiten het bereik van Spleen, in dezelfde atlas (licentie in `assets/`). |

Als u OmniGlyph nuttig vindt, geef dan ook een ster aan het bovenstroomse project — de ontdekking was van hen. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licentie

MIT — zie [LICENSE](../../../LICENSE).
