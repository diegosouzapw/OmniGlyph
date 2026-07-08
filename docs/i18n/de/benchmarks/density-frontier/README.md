# density-frontier — Kosten × Genauigkeit pro Auflösung

🌐 Übersetzt: [alle Sprachen](../../../README.md)

Harness, der die **Pareto-Front zwischen Kosten und Lesbarkeit** der
Text-zu-Bild-Renderings misst, pro Anbieter (Anthropic / OpenAI / Gemini),
Seitengeometrie, Glyphenzelle und Atlas-Stil.

Günstigere (dichtere) Seiten tragen mehr Zeichen pro Token, hören aber
irgendwann auf, lesbar zu sein. Eine Konfiguration darf nur dann
ausgeliefert werden, wenn **beides** zutrifft — die Kosten sind niedrig
*und* das Modell liest sie weiterhin perfekt:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Jede Antwort wird in genau eines von drei Ergebnissen eingestuft — das
mittlere ist das, was das Gate vertrauenswürdig macht:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Eine Konfiguration, die auch nur ein einziges 🔴 produziert, ist
disqualifiziert, egal wie günstig sie ist.

Die zentrale Asymmetrie: seit dem Billing-Sweep (2026-07-05,
`benchmarks/billing-sweep/`) ist **Kosten offline exakt vorhersagbar** —
28-px-Patches + 4/Block bei Anthropic (`src/core/anthropic-vision.ts`),
Patch-/Kachel-Profile bei OpenAI (`src/core/openai.ts`),
Kacheln/media_resolution bei Gemini (`gemini-cost.ts`). Nur die
**Lesegenauigkeit** braucht die API.

## Design

- **Korpus** (`corpus.ts`): dichter Log/JSON-artiger Füllstoff + platzierte
  Nadeln aus den Klassen, bei denen die Verwechselbarkeitsmatrix Fehler
  vorhersagt (12-stelliger Hex, camelCase, Ziffern 6/8/5/3) +
  **Near-Miss-Distraktoren**, gebaut aus den gemessenen verwechselbaren
  Paaren. Wenn das Modell mit dem Distraktor antwortet, war die Verwechslung
  *vorhergesagt* — das ist der stille Fehlermodus, der erkannt werden soll,
  nicht nur gezählt. Deterministisch (mulberry32).
- **Konfigurationen** (`configs.ts`): kuratiertes Raster — Standard-1568×728-
  Seiten vs. High-Res-1928×1928 (der A/B-Test, der die Geometrie pro
  Tarifstufe entscheidet), AA vs. 1-bit (löst den Widerspruch im dichten
  Rendering auf), 7×10/10×16-Zelle (Opus-Sicherheitsmodus), GPT-Streifen und
  die beiden Gemini-Wetten (≤384² = 258 pauschal;
  `media_resolution: low` = 280 fest → ~116 Zeichen/Token *wenn* lesbar).
- **Bewertung** (`score.ts`): deterministischer exakter Abgleich, kein
  LLM-Richter. Drei Ergebnisse: `correct` / `abstained` (ILEGIVEL-Sentinel —
  ehrliches Versagen) / `silent_wrong` (der gefährliche Modus), mit einem
  Distraktor-Flag.

## Ausführen

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Bestimmte Konfigurationen: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Antworten landen in `results/*.jsonl` (eine Zeile pro Frage, mit der rohen
Antwort zur Prüfung).

## Abnahmeschwelle (übernommen von den Upstream-PRs #35/#36)

Eine Konfiguration wird nur dann ein Produktions-Default, wenn: **Gist ==
Text-Baseline** UND **null stille falsche exakte Strings** UND **positive
Einsparungen**. Der erste verpflichtende Lauf ist `anthropic-std-5x8-aa` vs.
`anthropic-hires-5x8-aa` auf Fable — die Lesbarkeits-Stichprobe der großen
Seite, bevor die High-Res-Stufe aktiviert wird.

## `--via-omniroute` — End-zu-End durch OmniRoute (P3: Nachweis der Nicht-Degradation)

Die obigen Transporte rendern Text→PNG **im Harness** und senden die Bilder.
`--via-omniroute` macht das Gegenteil, was der Produktionspfad ist: es
sendet den **dichten Text** an eine laufende OmniRoute-Instanz, lässt die
**`omniglyph`-Engine rendern** und die Seiten an Anthropic weiterleiten, und
misst die Lesevorgänge + die Einsparungen. Wenn die Lesevorgänge gleich
bleiben wie auf der direkten Route **und** OmniRoute Kompression meldet, ist
bewiesen, dass das Rendern+Weiterleiten von OmniRoute die Seiten **nicht
degradiert**.

Voraussetzungen (operativ):

1. **OmniRoute läuft** (`npm run dev`, Standard `http://localhost:20128`).
2. Ein **Anthropic-Provider**, konfiguriert in OmniRoute mit einem **echten
   Schlüssel** (direkte Route — das `providerTransport==='direct'`-Gate
   greift nur beim `anthropic`-Provider).
3. Die **`omniglyph`-Engine AKTIVIERT** in OmniRoutes Kompressionskonfiguration
   (`config.engines.omniglyph.enabled = true`) — der
   `engine:omniglyph`-Header feuert nur, wenn die Engine aktiv ist. (Die
   Engine ist `stable:false`/Vorschau; explizit aktivieren.)
4. Ein **OmniRoute-API-Schlüssel** in `OMNIROUTE_API_KEY` (der, den der
   Client zur Authentifizierung gegenüber OmniRoute verwendet, nicht der
   Anthropic-Schlüssel).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Jede Antwort verzeichnet
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(aus dem `X-OmniRoute-Compression`-Antwort-Header) im JSONL; die
Tabellenzeile zeigt, wie viele Antworten komprimiert zurückkamen + die
mediane Einsparung. **P3-Schwelle**: gleiche wörtliche/Gist-Treffer wie die
direkte Route (Nicht-Degradation) **mit** nicht-null
`omnirouteSavings` (Nachweis, dass ein Rendering stattfand, kein
Roh-Text-Lesen). Wenn `did NOT compress` erscheint, ist die Engine in
OmniRoute nicht aktiviert (oder der Body hat die Fail-closed-Gates nicht
bestanden).

Tests für die reinen Teile: `tests/density-frontier.test.ts` (enthält
`buildOmnirouteRequest` und `parseCompressionSavings` aus dem
Via-OmniRoute-Transport).
