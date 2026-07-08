# density-frontier — omkostning × nøjagtighed per opløsning

🌐 Translated: [all languages](../../../README.md)

Rammeværk, der måler **Pareto-fronten mellem omkostning og læsbarhed** af
tekst→billede-renderingerne, per udbyder (Anthropic / OpenAI / Gemini), sidegeometri,
glyf-celle og atlas-stil.

Billigere (tættere) sider bærer flere tegn per token, men holder på et
tidspunkt op med at være læsbare. En konfiguration må kun sendes i produktion,
hvor **begge** dele holder — omkostningen er lav *og* modellen læser den
stadig perfekt:

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

Hvert svar scores til nøjagtigt ét af tre udfald — det midterste er det, der
gør spærringen troværdig:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

En konfiguration, der producerer bare ét 🔴, er diskvalificeret, uanset hvor
billig den er.

Den centrale asymmetri: siden afregnings-sweepet (2026-07-05,
`benchmarks/billing-sweep/`), er **omkostning præcist forudsigelig offline** — 28 px-
patches + 4/blok på Anthropic (`src/core/anthropic-vision.ts`), patch/flise-
profiler på OpenAI (`src/core/openai.ts`), fliser/media_resolution på Gemini
(`gemini-cost.ts`). Kun **læsenøjagtighed** kræver API'et.

## Design

- **Korpus** (`corpus.ts`): tæt log/JSON-stil-fyld + plantede needles fra
  de klasser, forvekslelighedsmatricen siger fejler (12-tegns hex, camelCase,
  cifre 6/8/5/3) + **near-miss-distraktorer** bygget fra de målte
  forvekslelige par. Hvis modellen svarer med distraktoren, var forvekslingen
  *forudsagt* — det er den stille fejltilstand, der detekteres, ikke bare
  talt som forkert. Deterministisk (mulberry32).
- **Konfigurationer** (`configs.ts`): kurateret gitter — standard 1568×728-sider vs.
  hi-res 1928×1928 (A/B'en, der afgør per-tier-geometri), AA vs. 1-bit
  (løser den tætte-rendering-modsigelse), 7×10/10×16-celle (Opus sikker
  tilstand), GPT-strimmel, og de to Gemini-hypoteser (≤384² = 258 flad;
  `media_resolution: low` = 280 fast → ~116 tegn/token *hvis* læsbar).
- **Score** (`score.ts`): deterministisk eksakt match, ingen LLM-dommer. Tre
  udfald: `correct` / `abstained` (ILEGIVEL-sentinel — ærlig fejl) /
  `silent_wrong` (den farlige tilstand), med et distraktor-flag.

## Kørsel

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Specifikke konfigurationer: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Svar lander i `results/*.jsonl` (én linje per spørgsmål, med det rå svar
til revision).

## Accept-bar (arvet fra upstream PR'erne #35/#36)

En konfiguration bliver kun en produktionsstandard, hvis: **gist == tekstbaseline** OG
**nul stille forkerte eksakte strenge** OG **positive besparelser**. Den første
obligatoriske kørsel er `anthropic-std-5x8-aa` vs. `anthropic-hires-5x8-aa` på Fable —
læsbarhedsstikprøven af den store side, før hi-res-tieret aktiveres.

## `--via-omniroute` — e2e gennem OmniRoute (P3: bevis for ikke-degradering)

Transporterne ovenfor renderer tekst→PNG **i rammeværket** og sender billederne.
`--via-omniroute` gør det modsatte, hvilket er produktionsstien: den sender
den **tætte tekst** til en kørende OmniRoute-instans, lader `omniglyph`-
**motoren rendere** siderne og videresende dem til Anthropic, og måler læsningerne +
besparelserne. Hvis læsningerne forbliver de samme som på den direkte rute **og**
OmniRoute rapporterer komprimering, er det bevist, at OmniRoutes render+forward
**ikke degraderer** siderne.

Forudsætninger (operationelt):

1. **OmniRoute kørende** (`npm run dev`, standard `http://localhost:20128`).
2. En **Anthropic-udbyder** konfigureret i OmniRoute med en **reel nøgle** (direkte
   rute — `providerTransport==='direct'`-spærringen passerer kun for `anthropic`-udbyderen).
3. **`omniglyph`-motoren AKTIVERET** i OmniRoutes komprimeringskonfiguration
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`-headeren udløses kun
   med motoren tændt. (Motoren er `stable:false`/preview; aktivér den eksplicit.)
4. En **OmniRoute-API-nøgle** i `OMNIROUTE_API_KEY` (den, klienten bruger til at
   autentificere mod OmniRoute, ikke Anthropic-nøglen).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Hvert svar registrerer `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(fra `X-OmniRoute-Compression`-response-headeren) i JSONL'en; tabelrækken viser
hvor mange svar kom tilbage komprimeret + den mediane besparelse. **P3-bar**: samme
verbatim/gist-hits som den direkte rute (ikke-degradering) **med** ikke-null
`omnirouteSavings` (der beviser, at en rendering skete, ikke en rå-tekst-læsning). Hvis `did NOT compress`
dukker op, er motoren ikke aktiveret i OmniRoute (eller body'en bestod ikke
fail-closed-spærringerne).

Tests for de rene dele: `tests/density-frontier.test.ts` (inkluderer `buildOmnirouteRequest`
og `parseCompressionSavings` fra via-omniroute-transporten).
