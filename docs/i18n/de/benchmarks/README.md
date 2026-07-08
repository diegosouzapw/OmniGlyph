# Benchmarks

🌐 Übersetzt: [alle Sprachen](../../README.md)

Jede Zahl, die OmniGlyph behauptet, stammt aus einem der beiden unten
stehenden Harnesses — erneut ausführbar, wo möglich deterministisch, mit
rohen Beleg-Daten pro Antwort in `*/results/*.jsonl`. Konsolidierte Analyse:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Wie die Einsparung funktioniert (in einem Bild)

Anbieter berechnen Text **pro Token**, aber ein Bild **nach seinen
Abmessungen** — unabhängig davon, wie viel Text darin verpackt ist. Eine
Standardseite kostet pauschal, egal wie dicht der Text ist:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Derselbe Kontext, auf zwei Arten abgerechnet:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Warum das Bild gewinnt — Zeichen pro Token:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph nimmt diesen Tausch nur vor, wenn die exakte Rechnung dafürspricht,
und nur bei Modellen, die nachweislich die Seite lesen können. Die beiden
folgenden Harnesses belegen jede Hälfte.

## 1. `billing-sweep/` — was kostet ein Bild wirklich?

Kostenlose `count_tokens`-Sonden gegen die Live-Anthropic-API, die die
zurückgezogene `w·h/750`-Formel mit dem aktuellen 28-px-Patch-Modell über
11 Sondengeometrien bei 2 Modellen × 2 Auflösungsstufen vergleichen.

**Ergebnis (2026-07-05): das Patch-Modell passt mit Residuum NULL bei jeder
Sonde** — abgerechnet = `⌈w/28⌉ × ⌈h/28⌉` nach Größenanpassung pro Tarifstufe,
plus feste +3/+4 Tokens pro Bildblock. Die Produktionsseite (1568×728)
kostet exakt 1.460 Tokens und trägt 28.080 Zeichen ≈ **19,2 Zeichen/Token**
gegenüber ~2 Zeichen/Token als dichter Text.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — kann das Modell es tatsächlich LESEN?

Kosten (offline, exakt) × Lesegenauigkeit (live) über Render-Konfigurationen,
Seitengeometrien, Glyphenatlanten und Anbieter hinweg. Der Korpus platziert
exakte-String-Nadeln (Hex-IDs, camelCase, Ziffernfolgen) sowie
**Near-Miss-Distraktoren, gebaut aus den gemessenen
Glyphen-Verwechselbarkeitspaaren** — sodass stille Konfabulation erkannt
wird, nicht nur als falsch gezählt. Die Bewertung ist deterministisch (kein
LLM-Richter): `correct` / `abstained` (ehrliches `ILEGIVEL`) / `silent_wrong`
/ `no_answer`.

**Kernergebnisse** (n=30 pro Arm):

| Arm | exakte Lesevorgänge | Anmerkungen |
|---|---:|---|
| Fable 5 · Standardseite · 1-bit-Atlas (Produktion) | **30/30** | null Fehler, null Konfabulation |
| Fable 5 · Standardseite · AA-Atlas (alter Default) | 25/30 | 5 ehrliche Enthaltungen — warum die Produktion auf 1-bit umgestellt hat |
| Fable 5 · High-Res-1928²-Seite | 1–2/30 | 3,3× abgerechnet, aber vom Encoder resampled — die Billing-Falle, nicht aktiviert |
| Opus 4.8 · 10×16-Glyphen | 23–26/30 | der Opt-in-Sicherheitsmodus |
| GPT-5.5 · 768px-Streifen (beide Atlanten) | 0/60 | + ~40× Ausgabe-Token-Inflation gegenüber der eigenen Textkontrolle (30/30, 62 Tok) |
| Gemini 2.5-flash (teilweise, Kontingent) | 0/26 | konfabuliert statt sich zu enthalten |

Lesegenauigkeit auf einen Blick — das **ist** das Fail-closed-Modell-Gate,
bildlich dargestellt:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Nur der ✅-Arm geht in Produktion. Alles, was schlecht liest, wird *mit
Beleg* blockiert, und die Drei-Wege-Bewertung bedeutet, dass ein Modell, das
falsch rät (`silent_wrong`), als schlechter gilt als eines, das sich ehrlich
enthält (`ILEGIVEL`).

Drei Transporte: direkte API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`) und `--via-cli` (ein Claude-Code-Abo —
$0). Auf die harte Tour gelernter Vorbehalt: Zwischenstationen (OpenRouter,
das CLI-Read-Tool) verkleinern große Bilder; nur Direkt-API-Ergebnisse sind
maßgeblich für die Lesbarkeit.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit-Tests, die die reinen Teile fixieren (Korpus, Bewertung,
Kostenformeln): `tests/billing-sweep-formulas.test.ts`,
`tests/density-frontier.test.ts`, `tests/anthropic-vision.test.ts`,
`tests/gemini-profiles.test.ts`, `tests/gpt-billing-audit.test.ts`.
