🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontext als Bild

### Senken Sie Ihre Claude-Rechnung um **59–70 %**, indem umfangreicher Kontext als dichte PNG-Seiten gerendert wird — derselbe Inhalt, nur mit einem Bruchteil der Tokens.

**Modelle berechnen Text pro Token, aber ein Bild wird nach seinen Abmessungen berechnet — nicht danach, wie viel Text darin steckt.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Teil der [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)-Familie

</div>

---

# 📊 The numbers — measured, not estimated

| Metrik | Ergebnis | Beleg |
|---|---|---|
| Reduktion der Gesamtrechnung (Ende-zu-Ende) | **59–70 %** | Produktions-Trace, 13.709 Requests |
| Tokens pro konvertiertem Block | **10× weniger** (28.080 Zeichen: 14.040 → 1.460 Tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Genauigkeit der Billing-Formel | Residuum **null** über 22 `count_tokens`-Sonden, 2 Modelle × 2 Tarifstufen | `benchmarks/billing-sweep/results/` |
| Exakte Lesegenauigkeit, Produktionskonfiguration | **30/30 (100 %)** bei Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Stille Konfabulationen in ~300 Lese-Proben | **0** — jeder Fehltreffer enthält sich als `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Modell-Scorecard** (kann es dichte Renderings lesen? n=30 pro Arm, deterministische Bewertung):

| Modell | Lesequote | Urteil |
|---|---|---|
| Claude **Fable 5** | **100 %** exakt | ✅ Produktionsziel |
| Claude Opus 4.8 | 77–87 % bei 4× Glyphgröße | ⚠️ Opt-in-Sicherheitsmodus (Einsparung sinkt auf ~2×) |
| GPT-5.5 | 0/60 — und bläht seine Antworten dabei ~40× auf | ❌ vom Gate blockiert, mit Nachweis |
| Gemini 2.5-flash | 0/26 — und konfabuliert statt sich zu enthalten | ❌ blockiert (Teiltest, quotenlimitiert) |

Der Vorteil ist **heute Fable-spezifisch** — andere Vision-Encoder können dichte Glyphen noch nicht auflösen. Der [Benchmark-Harness](benchmarks/README.md) testet jedes neue Modell mit einem einzigen Befehl erneut.

# 🤔 Warum OmniGlyph?

Jede lang laufende Agenten-Sitzung schleppt bei jedem Request denselben toten Ballast mit: den System-Prompt, die Tool-Doku und den alten Verlauf — bei jeder Runde erneut pro Token abgerechnet. OmniGlyph ist ein **lokaler Proxy**, der diese umfangreichen Teile in dichte PNG-Seiten umschreibt, *bevor sie Ihren Rechner verlassen*:

- **Exakte Billing-Mathematik, keine Heuristiken** — es berechnet die tatsächliche Bild-Token-Formel des Anbieters (auf Residuum null vermessen) und konvertiert nur, wenn die Rechnung sich lohnt.
- **Fail-closed by Design** — Modelle, die dichte Renderings nicht lesen können, werden von einem Gate blockiert, mit Benchmark-Belegen. Kein stiller Qualitätsverlust.
- **Privat und lokal-first** — das Umschreiben geschieht auf `127.0.0.1`; es wird sonst nichts zusätzlich irgendwohin gesendet.
- **Reproduzierbar** — jede Zahl oben hat einen Beleg in `benchmarks/*/results/`, mit einem Befehl erneut ausführbar.

# ⚡ Schnellstart

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Funktioniert auf beide Arten:
- **API-Schlüssel** (Bezahlung pro Token): Ihre Rechnung sinkt Ende-zu-Ende um 59–70 %.
- **Abo-Sitzung**: Sie zahlen nicht weniger, aber Nutzungslimits werden in Tokens gezählt — Ihre Limits reichen also **~2–3×** weiter.

Dashboard unter <http://127.0.0.1:47821/>: gesparte Tokens, jede Text-zu-Bild-Konvertierung im Vergleich nebeneinander, Kill-Switch, Live-Modell-Chips. Antworten werden normal gestreamt — nur der *Request* wird komprimiert, niemals die Ausgabe des Modells.

# 🔌 Verwendung mit Claude-Clients

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

# 🖥️ Das Dashboard

Ein vollständiges lokales Dashboard ist im Paket enthalten — offline, Single-File, ohne externe Requests. Sechs Seiten, live aktualisiert über SSE, während Requests durchlaufen:

![Overview: Mission-Control-KPI-Karten, Sparkline für Einsparungen und Live-Event-Feed](../../assets/dashboard-overview.png)

- **Overview** — Mission Control: Einsparungen in %, gesparte $, Latenz p95, Cache-Treffer, Fehler, Live-Feed.
- **Live Flow** — die Pipeline als Node-Graph: client → gate → renderer / passthrough → API, mit einem Partikel pro echtem Request.
- **Telemetry** — ein Token/$-Zähler und eine Live-Request-Zeitleiste; klicken Sie auf einen beliebigen Request, um genau zu sehen, welche Teile zu Bildern wurden, und den Quelltext hinter jeder Seite zu lesen.
- **Benchmarks** — die aus `benchmarks/*/results/` gerenderten Harness-Belege, eine Zeile pro Modell·Konfig-Experiment, und **Benchmarks direkt aus der UI ausführen**: `$0`-Dry-Runs streamen ihre Ausgabe live; Live-Runs bleiben hinter Ihrem API-Schlüssel plus einer expliziten Kostenbestätigung gesperrt.
- **Sessions / History** — die Top-Sessions nach gesparten Tokens und jedes Event auf der Festplatte.

| Live Flow | Benchmarks |
|---|---|
| ![Die Request-Pipeline als Live-Node-Graph](../../assets/dashboard-flow.png) | ![Benchmark-Belege und Dry-Runs direkt in der UI](../../assets/dashboard-benchmarks.png) |

![Telemetry: Zähler und Live-Request-Zeitleiste](../../assets/dashboard-telemetry.png)

# ⚙️ So funktioniert es

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **Billing wird exakt berechnet, vor der Konvertierung**: Anthropic berechnet `⌈w/28⌉ × ⌈h/28⌉ + 4` Tokens pro Bild (28-px-Patches — auf Residuum null vermessen). Eine volle Seite trägt 28.080 Zeichen für 1.460 Tokens ≈ **19 Zeichen/Token**, gegenüber ~2 Zeichen/Token bei dichtem Text. Das Gate konvertiert nur, wenn sich die Rechnung lohnt.
- **Was konvertiert wird**: der statische System-Prompt + Tool-Doku, alter zusammengefasster Verlauf, große Tool-Ausgaben.
- **Was nie konvertiert wird**: Ihre Nachrichten, aktuelle Runden, die Ausgabe des Modells, spärlicher Fließtext, byte-exakte Werte (Hashes/IDs reisen als Text mit), und jedes Modell, das den Lese-Benchmark nicht bestanden hat.

# 📚 Bibliotheksnutzung (ohne Proxy)

Alles, was der Proxy pro Request tut, ist auch als dokumentierte, importierbare API verfügbar:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` fixiert Blöcke als Text; `options.emitRecoverable` gibt die Originale der als Bild gerenderten Blöcke zurück. Die exakte Billing-Mathematik wird auch an der Paketwurzel exportiert (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — genau das nutzt [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Reine JS-Laufzeit (Node und Edge/Workers). Vollständige Oberfläche: `src/core/index.ts`.

# 📤 Offline-Export — kein Proxy, kein Claude Code

Nicht auf Claude Code? Rendern Sie den Kontext **lokal** zu PNG-Seiten und fügen Sie sie in Cursor, ChatGPT oder einen beliebigen Chat ein, der Bild-Uploads akzeptiert. Kein Proxy, kein API-Schlüssel, kein eingerichtetes Konto:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Sie erhalten einen Ordner mit allem, was Sie in den Chat ziehen können:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` rendert Ihr nicht committetes Diff, `--diff <ref>` einen Commit-Bereich, `--open` zeigt den Ordner an (macOS). Alles läuft auf Ihrem Rechner — der Export-Pfad startet nie den Proxy und ruft nie ein Modell auf. Führen Sie `omniglyph export --help` für jede Option aus.

# 🧭 The honest part

- **Es ist verlustbehaftet.** Byte-exakte Wiedergabe aus Bildern ist naturgemäß unzuverlässig. Umgesetzte Abmilderungen: exakte Bezeichner reisen als Text neben dem Bild mit, und die vermessene Produktionskonfiguration erzeugte **null stille Konfabulationen** — fehlgeschlagene Lesevorgänge enthalten sich.
- **Nur Fable 5 ist heute freigegeben**, mit Belegen. GPT-5.5 und Gemini 2.5-flash können dichte Renderings nachweislich nicht lesen; Opus 4.8 benötigt 4× größere Glyphen. Das Gate setzt das durch.
- **Wir haben eine Billing-Falle gefunden und vermieden**: die hochauflösende Bildstufe berechnet 3,3× mehr pro Seite, aber der Vision-Encoder erhält die zusätzliche Auflösung nicht — größere Seiten lesen sich *schlechter*. Vermessen, dokumentiert in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), nicht aktiviert.
- Preise ändern sich; die belastbare Kennzahl ist die Token-Einsparung, die der Proxy pro Request gegen ein kostenloses `count_tokens`-Kontrafaktum protokolliert.

# 🧠 FAQ

**Ich habe es mitten in einer Session aktiviert und mein Verbrauch schoss hoch — warum?**
Eine Session, die ohne OmniGlyph lief, hat ihren gesamten Präfix bei Anthropic als Text zum 0,1×-Leseraten-Tarif im Cache; die erste Bild-Anfrage würde all das als neuen Cache-Write zu 1,25× in einem einzigen Prompt erneut bezahlen. Der Proxy schützt davor: Eine Session, die er nie in Bilder umgewandelt hat, speist diese Einmalkosten in das Break-even-Gate ein und wechselt nur zu Bildern, wenn es sich weiterhin lohnt — andernfalls bleibt die Session Text, und die Ersparnis beginnt mit der nächsten neuen Session.

**Ist die Ersparnis von 59–70 % Ende-zu-Ende, oder nur bei den Requests, die tatsächlich konvertiert wurden?**
Ende-zu-Ende — die gesamte Rechnung. Die meisten Kompressionstools geben Einsparungen nur für den Teil an, den sie tatsächlich bearbeitet haben, was die Zahl schönt. Unser Nenner ist *jeder* Request: die kleinen, die das Gate zu Recht unangetastet ließ, alle Cache-Writes und -Reads, sowie alle Output-Tokens (die der Proxy nie komprimiert). Nur die konvertierten Requests liegen höher und werden separat angegeben, nie als Schlagzeile.

**Wie wird die Einsparung gemessen?**
Beide Seiten desselben Requests, zum selben Zeitpunkt. Für jeden `/v1/messages`-POST feuert der Proxy parallel zum echten Forward eine kostenlose `count_tokens`-Sonde auf den ursprünglichen, unkomprimierten Body (das Kontrafaktum) und liest den vom Anbieter tatsächlich abgerechneten Usage-Block aus der Antwort — beide landen in derselben Event-Zeile. Die Cache-Preisgestaltung wird auf beide Seiten identisch angewendet, sodass sich der Caching-Rabatt aufhebt und nicht doppelt als „Einsparung" gezählt werden kann. Die Formel steckt in `src/core/baseline.ts`; leiten Sie sie aus Ihrem eigenen Events-Log neu her.

**Warum wäre ein Fehltreffer eine Konfabulation und kein Lesefehler?**
Weil Modell-Vision keine OCR ist: Die Seite wird zu Patch-Embeddings, nie zu diskreten Zeichen, daher gibt es keine Pro-Glyphen-Konfidenz, die laut fehlschlagen könnte — wenn Pixel eine Glyphe unterdeterminieren, füllt der Sprach-Prior die Lücke mit etwas Plausiblem. Genau dieser Mechanismus ist der Grund, warum OmniGlyph dabei fail-closed ist: byte-exakte Werte reisen immer als Text neben dem Bild mit, Modelle, die falsch lesen, werden vom Gate blockiert, und die vermessene Produktionskonfiguration erzeugte **null** stille Konfabulationen in ~300 Lese-Proben — fehlgeschlagene Lesevorgänge enthalten sich.

**Was ist mit byte-exakter Arbeit (Hashes, IDs, Secrets)?**
Aktuelle Runden und exakte Bezeichner bleiben by Design Text. Für Workloads, die *vollständig* byte-exakt sind, leiten Sie diese an ein nicht in der Allowlist geführtes Modell weiter (z. B. einen Subagenten auf einem anderen Claude-Modell) — alles außerhalb der Allowlist läuft byte-identisch, unangetastet, durch.

**Hat DeepSeek-OCR nicht bereits geklärt, ob das funktioniert?**
Es hat bewiesen, dass der *Kanal* funktioniert — mit einem Encoder/Decoder-Paar, das genau für diese Aufgabe trainiert wurde. Die Skepsis stammt aus einer Zeit, als kein handelsübliches Produktionsmodell dichte Renderings lesen konnte; das hat sich geändert, und die [Modell-Scorecard](../../../README.md#-the-numbers--measured-not-estimated) oben zeigt genau, wer sie heute liest, mit Belegen. Der [Benchmark-Harness](../../../benchmarks/README.md) testet jedes neue Modell mit einem einzigen Befehl erneut — das Gate folgt den Daten, nicht dem Hype.

**Kann ich es ohne Claude Code nutzen — Cursor, ChatGPT, eine einfache Pipe?**
Ja, auf zwei Arten. Als **Proxy** funktioniert es mit jedem Client, bei dem Sie die API-Basis-URL setzen können (`ANTHROPIC_BASE_URL` oder die OpenAI-Basis-URL) — Claude Code, Ihre eigenen Skripte, alles über HTTP. Und für Tools, die keinen Proxy nutzen können, rendert der **Offline-Export** oben den Kontext zu PNG-Seiten, die Sie von Hand einfügen — `omniglyph export --stdin` liest sogar direkt aus einer Unix-Pipe.

**Wie verwandelt es Text eigentlich in ein Bild?**
Es bricht den Text neu um und zeichnet ihn mit einem 1-Bit-5×8-Pixel-Glyphenatlas auf dichte 1568×728-PNG-Seiten — ein Bit pro Pixel, kein Anti-Aliasing, sodass das Modell die Seite nach ihren Abmessungen berechnet, nicht danach, wie viele Zeichen darin stecken. **So funktioniert es** oben zeigt die Pipeline; die Benchmarks-Doku hat die Geometrie und den Grund, warum dichter nicht immer billiger ist.

# 🔬 Jede Zahl reproduzieren

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Vollständige Methodik und jede Ergebnistabelle: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Rohe Beleg-Daten pro Antwort: `benchmarks/*/results/*.jsonl`.

# 🚀 Die OmniRoute-Familie

OmniGlyph wird außerdem als **native Kompressions-Engine innerhalb von [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** ausgeliefert — dem kostenlosen KI-Gateway. Dort läuft es als `omniglyph`-Engine (eigenständiger Single-Modus oder gestapelt mit den anderen Engines), mit Fail-closed-Gates und bildbewusster Token-Abrechnung.

# 🛠️ Tech-Stack

| Ebene | Technologie |
|---|---|
| Sprache | TypeScript (strict), ESM |
| Laufzeit | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendering | eigener 1-Bit-Glyphenatlas (Spleen/Unifont-basiert, Lizenzen in `assets/`) → PNG |
| Tests | Vitest — TDD, plus Docs-Integritäts- und Rebrand-Guards |
| Benchmarks | `benchmarks/`-Harnesses (billing-sweep, density-frontier) mit JSONL-Belegen |

## Projektstruktur

| Pfad | Was |
|---|---|
| `src/` | der Proxy: Transform-Pipeline, exaktes Billing pro Anbieter, Renderer, Hosts (Node + Cloudflare Workers) |
| `benchmarks/` | die Harnesses, die jede Zahl oben erzeugt haben — erneut ausführbar |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — Bugs und Feature-Wünsche
- 🔒 [SECURITY.md](SECURITY.md) — Sicherheitsmeldungen
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — strikte TDD + Messung-vor-Behauptungen
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Danksagungen

OmniGlyph steht auf den Schultern eines Projekts im Besonderen — dieser Abschnitt ist unser bleibendes Dankeschön.

| Projekt | Wie es OmniGlyph geprägt hat |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Die Entdeckung, auf der dieses gesamte Projekt aufbaut.** pxpipe hat mit Belegen bewiesen, dass der Vision-Kanal eines Produktions-LLM dichten Textkontext zu einem Bruchteil der Token-Kosten tragen kann — und dass die Konvertierung pro Request durch exakte Billing-Mathematik entschieden werden muss, niemals nach Gefühl. Das dichte 1-Bit-Rendering, das Profitabilitäts-Gate, das `count_tokens`-Kontrafaktum, die Fail-closed-Modell-Allowlist und die Dokumentationskultur „erst messen, dann behaupten" wurden dort alle erstmals entwickelt. OmniGlyph stammt direkt von dieser Codebasis ab (MIT — die ursprüngliche Copyright-Zeile bleibt in unserer [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Die 5×8-Bitmap-Schriftfamilie, von der unser dichter 1-Bit-Glyphenatlas abstammt (Lizenz in `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Abdeckung für die Glyphen jenseits von Spleens Bereich im selben Atlas (Lizenz in `assets/`). |

Wenn Sie OmniGlyph nützlich finden, geben Sie auch dem Upstream-Projekt einen Stern — die Entdeckung war ihre. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Lizenz

MIT — siehe [LICENSE](../../../LICENSE).
