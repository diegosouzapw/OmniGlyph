# density-frontier — kostnad × noggrannhet per upplösning

🌐 Översatt: [alla språk](../../../README.md)

Ramverk som mäter **Pareto-gränsen mellan kostnad och läsbarhet** för
text-till-bild-renderingarna, per leverantör (Anthropic / OpenAI / Gemini),
sidgeometri, glyfcell och atlasstil.

Billigare (tätare) sidor bär fler tecken per token men slutar till slut vara
läsbara. En konfiguration får bara skickas i produktion där **båda** gäller
— kostnaden är låg *och* modellen läser den fortfarande perfekt:

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

Varje svar poängsätts till exakt ett av tre utfall — det mittersta är det
som gör spärren pålitlig:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

En konfiguration som producerar ens en 🔴 diskvalificeras, oavsett hur
billig den är.

Den centrala asymmetrin: sedan faktureringsgenomgången (2026-07-05,
`benchmarks/billing-sweep/`) är **kostnaden exakt förutsägbar offline** —
28 px-patchar + 4/block på Anthropic (`src/core/anthropic-vision.ts`),
patch/platt-profiler på OpenAI (`src/core/openai.ts`),
plattor/media_resolution på Gemini (`gemini-cost.ts`). Bara
**läsnoggrannheten** behöver API:et.

## Design

- **Korpus** (`corpus.ts`): tät logg-/JSON-liknande fyllning + planterade
  nålar från de klasser förväxlingsmatrisen säger misslyckas (12-tecken
  hex, camelCase, siffror 6/8/5/3) + **närmiss-distraktorer** byggda från
  de mätta förväxlingsbara paren. Om modellen svarar med distraktorn var
  förväxlingen *förutspådd* — det är den tysta felmoden som upptäcks, inte
  bara räknad som fel. Deterministisk (mulberry32).
- **Konfigurationer** (`configs.ts`): kuraterat rutnät — standard
  1568×728-sidor mot high-res 1928×1928 (A/B:n som avgör per-nivå-geometri),
  AA mot 1-bit (löser den täta renderingsmotsägelsen), 7×10/10×16-cell
  (Opus säkert läge), GPT-remsa, och de två Gemini-hypoteserna (≤384² =
  258 fast; `media_resolution: low` = 280 fast → ~116 tecken/token *om*
  läsbart).
- **Poängsättning** (`score.ts`): deterministisk exakt matchning, ingen
  LLM-domare. Tre utfall: `correct` / `abstained` (ILEGIVEL-markören —
  ärligt misslyckande) / `silent_wrong` (den farliga moden), med en
  distraktorflagga.

## Körning

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Specifika konfigurationer: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Svar hamnar i `results/*.jsonl` (en rad per fråga, med rått svar för
granskning).

## Godkännandegräns (ärvd från uppströms PR:ar #35/#36)

En konfiguration blir bara en produktionsstandard om: **gist == textbaslinje**
OCH **noll tysta felaktiga exakta strängar** OCH **positiva besparingar**.
Den första obligatoriska körningen är `anthropic-std-5x8-aa` mot
`anthropic-hires-5x8-aa` på Fable — läsbarhetsstickprovet för den stora
sidan innan high-res-nivån aktiveras.

## `--via-omniroute` — e2e genom OmniRoute (P3: icke-degraderingsbevis)

Transporterna ovan renderar text→PNG **i ramverket** och skickar bilderna.
`--via-omniroute` gör motsatsen, vilket är produktionsvägen: den skickar den
**täta texten** till en körande OmniRoute-instans, låter
**`omniglyph`-motorn rendera** sidorna och vidarebefordra dem till
Anthropic, och mäter läsningarna + besparingarna. Om läsningarna förblir
samma som direktvägen **och** OmniRoute rapporterar komprimering är det
bevisat att OmniRoutes rendera+vidarebefordra **inte degraderar** sidorna.

Förutsättningar (operativa):

1. **OmniRoute körande** (`npm run dev`, standard `http://localhost:20128`).
2. En **Anthropic-leverantör** konfigurerad i OmniRoute med en **riktig
   nyckel** (direktväg — `providerTransport==='direct'`-spärren passerar
   bara för `anthropic`-leverantören).
3. **`omniglyph`-motorn AKTIVERAD** i OmniRoutes kompressionskonfiguration
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`-headern
   utlöses bara med motorn på. (Motorn är `stable:false`/förhandsversion;
   aktivera den uttryckligen.)
4. En **OmniRoute-API-nyckel** i `OMNIROUTE_API_KEY` (den klienten använder
   för att autentisera mot OmniRoute, inte Anthropic-nyckeln).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Varje svar registrerar `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(från `X-OmniRoute-Compression`-svarshuvudet) i JSONL:en; tabellraden visar
hur många svar som kom tillbaka komprimerade + medianbesparingen.
**P3-gräns**: samma ordagrant/gist-träffar som direktvägen
(icke-degradering) **med** icke-null `omnirouteSavings` (som bevisar att en
rendering skedde, inte en rå textläsning). Om `did NOT compress` visas är
motorn inte aktiverad i OmniRoute (eller kroppen klarade inte
fail-closed-spärrarna).

Tester för de rena delarna: `tests/density-frontier.test.ts` (inkluderar
`buildOmnirouteRequest` och `parseCompressionSavings` från
via-omniroute-transporten).
