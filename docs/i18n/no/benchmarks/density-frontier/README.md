# density-frontier — kostnad × nøyaktighet per oppløsning

Rigg som måler **Pareto-fronten mellom kostnad og lesbarhet** for
tekst→bilde-rendringene, per leverandør (Anthropic / OpenAI / Gemini),
sidegeometri, glyffcelle og atlasstil.

Den sentrale asymmetrien: siden faktureringssveipen (2026-07-05,
`benchmarks/billing-sweep/`) er **kostnaden eksakt forutsigbar offline** —
28 px-patcher + 4/blokk på Anthropic (`src/core/anthropic-vision.ts`),
patch/flis-profiler på OpenAI (`src/core/openai.ts`),
fliser/media_resolution på Gemini (`gemini-cost.ts`). Kun
**lesenøyaktighet** trenger API-et.

## Design

- **Korpus** (`corpus.ts`): tett logg/JSON-stil fyllmasse + plantede
  needles fra klassene forvekslingsmatrisen sier feiler (12-tegns heks,
  camelCase, siffer 6/8/5/3) + **nesten-treff-distraktorer** bygget fra de
  målte forvekslingsbare parene. Hvis modellen svarer med distraktoren, var
  forvekslingen *forutsagt* — det er den stille feilmodusen som oppdages,
  ikke bare telles feil. Deterministisk (mulberry32).
- **Konfigurasjoner** (`configs.ts`): kuratert rutenett — standard
  1568×728-sider vs høyoppløsning 1928×1928 (A/B-en som avgjør nivåvis
  geometri), AA vs 1-bit (løser den tette rendrings-motsigelsen), 7×10/10×16-
  celle (Opus sikker modus), GPT-stripe, og de to Gemini-veddemålene
  (≤384² = 258 flat; `media_resolution: low` = 280 fast → ~116 tegn/token
  *hvis* lesbar).
- **Scoring** (`score.ts`): deterministisk eksakt treff, ingen LLM-dommer.
  Tre utfall: `correct` / `abstained` (ILEGIVEL-sentinel — ærlig
  feiling) / `silent_wrong` (den farlige modusen), med et
  distraktorflagg.

## Kjøring

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Spesifikke konfigurasjoner: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Svar havner i `results/*.jsonl` (én linje per spørsmål, med det rå svaret
for revisjon).

## Aksepterterskel (arvet fra oppstrøms PR-er #35/#36)

En konfigurasjon blir kun en produksjonsstandard hvis: **gist == tekst-
baseline** OG **null stille feil eksakt-strenger** OG **positive
besparelser**. Den første obligatoriske kjøringen er `anthropic-std-5x8-aa`
mot `anthropic-hires-5x8-aa` på Fable — lesbarhets-stikkprøven av den store
siden før høyoppløsningsnivået aktiveres.

## `--via-omniroute` — ende-til-ende gjennom OmniRoute (P3: ikke-degraderingsbevis)

Transportene over rendrer tekst→PNG **i riggen** og sender bildene.
`--via-omniroute` gjør det motsatte, som er produksjonsstien: den sender
den **tette teksten** til en kjørende OmniRoute-instans, lar
**`omniglyph`-motoren rendre** sidene og videresende dem til Anthropic, og
måler lesningene + besparelsene. Hvis lesningene forblir de samme som den
direkte ruten **og** OmniRoute rapporterer komprimering, er det bevist at
OmniRoutes rendring+videresending **ikke degraderer** sidene.

Forutsetninger (driftsmessige):

1. **OmniRoute kjørende** (`npm run dev`, standard `http://localhost:20128`).
2. En **Anthropic-leverandør** konfigurert i OmniRoute med en **ekte nøkkel**
   (direkte rute — `providerTransport==='direct'`-porten passerer kun for
   `anthropic`-leverandøren).
3. **`omniglyph`-motoren AKTIVERT** i OmniRoutes komprimeringskonfigurasjon
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`-headeren
   utløses kun med motoren på. (Motoren er `stable:false`/forhåndsvisning;
   aktiver den eksplisitt.)
4. En **OmniRoute-API-nøkkel** i `OMNIROUTE_API_KEY` (den klienten bruker
   for å autentisere mot OmniRoute, ikke Anthropic-nøkkelen).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Hvert svar registrerer `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(fra `X-OmniRoute-Compression`-svarheaderen) i JSONL-en; tabellraden viser
hvor mange svar som kom tilbake komprimert + medianbesparelsen. **P3-
terskel**: samme ordrett/gist-treff som den direkte ruten (ikke-
degradering) **med** ikke-null `omnirouteSavings` (som beviser at en
rendring skjedde, ikke en rå tekstlesning). Hvis `did NOT compress` dukker
opp, er motoren ikke aktivert i OmniRoute (eller kroppen passerte ikke
fail-closed-portene).

Tester for de rene delene: `tests/density-frontier.test.ts` (inkluderer
`buildOmnirouteRequest` og `parseCompressionSavings` fra
via-omniroute-transporten).
