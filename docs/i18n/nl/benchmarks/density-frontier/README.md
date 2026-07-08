# density-frontier — kosten × nauwkeurigheid per resolutie

Harness die de **Pareto-grens tussen kosten en leesbaarheid** meet van de
tekst→afbeelding-renders, per provider (Anthropic / OpenAI / Gemini),
paginageometrie, glyfcel en atlasstijl.

De centrale asymmetrie: sinds de billing-sweep (2026-07-05,
`benchmarks/billing-sweep/`), zijn **kosten exact offline voorspelbaar** —
28 px-patches + 4/blok op Anthropic (`src/core/anthropic-vision.ts`),
patch/tile-profielen op OpenAI (`src/core/openai.ts`),
tiles/media_resolution op Gemini (`gemini-cost.ts`). Alleen
**leesnauwkeurigheid** vereist de API.

## Ontwerp

- **Corpus** (`corpus.ts`): dense log/JSON-stijl vulling + geplante needles
  uit de klassen waarvan de verwarringsmatrix zegt dat ze falen (12-teken
  hex, camelCase, cijfers 6/8/5/3) + **bijna-mis-afleiders** opgebouwd uit
  de gemeten verwarrende paren. Als het model antwoordt met de afleider,
  was de verwarring *voorspeld* — dat is de stille faalmodus die wordt
  gedetecteerd, niet alleen als fout geteld. Deterministisch (mulberry32).
- **Configs** (`configs.ts`): samengesteld raster — standaard 1568×728-
  pagina's vs high-res 1928×1928 (de A/B die de geometrie per tier bepaalt),
  AA vs 1-bit (lost de dense-render-tegenstrijdigheid op), 7×10/10×16-cel
  (Opus safe mode), GPT-strip, en de twee Gemini-gokjes (≤384² = 258 flat;
  `media_resolution: low` = 280 vast → ~116 tekens/token *indien* leesbaar).
- **Score** (`score.ts`): deterministische exacte match, geen LLM-rechter.
  Drie uitkomsten: `correct` / `abstained` (ILEGIVEL-sentinel — eerlijke
  mislukking) / `silent_wrong` (de gevaarlijke modus), met een
  afleider-vlag.

## Uitvoeren

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # kostentabel, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Specifieke configs: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Antwoorden komen terecht in `results/*.jsonl` (één regel per vraag, met het
ruwe antwoord voor auditing).

## Acceptatielat (overgeërfd van upstream PR's #35/#36)

Een config wordt alleen een productiestandaard als: **gist == tekstbaseline**
EN **nul stil-verkeerde exacte strings** EN **positieve besparingen**. De
eerste verplichte run is `anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa`
op Fable — de leesbaarheidssteekproef van de grote pagina voordat de
high-res-tier wordt ingeschakeld.

## `--via-omniroute` — e2e via OmniRoute (P3: bewijs van geen degradatie)

De transporten hierboven renderen tekst→PNG **in de harness** en versturen
de afbeeldingen. `--via-omniroute` doet het omgekeerde, wat het productiepad
is: het stuurt de **dense tekst** naar een draaiende OmniRoute-instantie,
laat de **`omniglyph`-engine de pagina's renderen** en doorsturen naar
Anthropic, en meet de lezingen + de besparingen. Als de lezingen gelijk
blijven aan de directe route **en** OmniRoute compressie rapporteert, is
bewezen dat het render+forward van OmniRoute de pagina's **niet
degradeert**.

Vereisten (operationeel):

1. **OmniRoute draaiend** (`npm run dev`, standaard `http://localhost:20128`).
2. Een **Anthropic-provider** geconfigureerd in OmniRoute met een **echte
   sleutel** (directe route — de `providerTransport==='direct'`-poort
   slaagt alleen voor de `anthropic`-provider).
3. De **`omniglyph`-engine INGESCHAKELD** in de compressieconfiguratie van
   OmniRoute (`config.engines.omniglyph.enabled = true`) — de
   `engine:omniglyph`-header vuurt alleen af met de engine aan. (De engine
   is `stable:false`/preview; schakel hem expliciet in.)
4. Een **OmniRoute-API-sleutel** in `OMNIROUTE_API_KEY` (degene die de
   client gebruikt om te authenticeren bij OmniRoute, niet die van
   Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Elk antwoord registreert `omnirouteSavings: { originalTokens,
compressedTokens, savingsPercent }` (uit de
`X-OmniRoute-Compression`-responseheader) in de JSONL; de tabelrij toont
hoeveel antwoorden gecomprimeerd terugkwamen + de mediane besparing.
**P3-lat**: dezelfde verbatim/gist-hits als de directe route (geen
degradatie) **met** niet-null `omnirouteSavings` (bewijst dat er een render
plaatsvond, geen ruwe tekstlezing). Als `did NOT compress` verschijnt, is de
engine niet ingeschakeld in OmniRoute (of de body is niet door de
fail-closed poorten gekomen).

Tests voor de zuivere onderdelen: `tests/density-frontier.test.ts` (bevat
`buildOmnirouteRequest` en `parseCompressionSavings` van het
via-omniroute-transport).
