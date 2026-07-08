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

# ⚙️ So funktioniert es

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **Billing wird exakt berechnet, vor der Konvertierung**: Anthropic berechnet `⌈w/28⌉ × ⌈h/28⌉ + 4` Tokens pro Bild (28-px-Patches — auf Residuum null vermessen). Eine volle Seite trägt 28.080 Zeichen für 1.460 Tokens ≈ **19 Zeichen/Token**, gegenüber ~2 Zeichen/Token bei dichtem Text. Das Gate konvertiert nur, wenn sich die Rechnung lohnt.
- **Was konvertiert wird**: der statische System-Prompt + Tool-Doku, alter zusammengefasster Verlauf, große Tool-Ausgaben.
- **Was nie konvertiert wird**: Ihre Nachrichten, aktuelle Runden, die Ausgabe des Modells, spärlicher Fließtext, byte-exakte Werte (Hashes/IDs reisen als Text mit), und jedes Modell, das den Lese-Benchmark nicht bestanden hat.

# 🧭 The honest part

- **Es ist verlustbehaftet.** Byte-exakte Wiedergabe aus Bildern ist naturgemäß unzuverlässig. Umgesetzte Abmilderungen: exakte Bezeichner reisen als Text neben dem Bild mit, und die vermessene Produktionskonfiguration erzeugte **null stille Konfabulationen** — fehlgeschlagene Lesevorgänge enthalten sich.
- **Nur Fable 5 ist heute freigegeben**, mit Belegen. GPT-5.5 und Gemini 2.5-flash können dichte Renderings nachweislich nicht lesen; Opus 4.8 benötigt 4× größere Glyphen. Das Gate setzt das durch.
- **Wir haben eine Billing-Falle gefunden und vermieden**: die hochauflösende Bildstufe berechnet 3,3× mehr pro Seite, aber der Vision-Encoder erhält die zusätzliche Auflösung nicht — größere Seiten lesen sich *schlechter*. Vermessen, dokumentiert in [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), nicht aktiviert.
- Preise ändern sich; die belastbare Kennzahl ist die Token-Einsparung, die der Proxy pro Request gegen ein kostenloses `count_tokens`-Kontrafaktum protokolliert.

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

## 📄 Lizenz

MIT — siehe [LICENSE](../../../LICENSE).
