# density-frontier — gastos × katumpakan kada resolution

🌐 Isinalin: [lahat ng wika](../../../README.md)

Harness na sumusukat sa **Pareto frontier sa pagitan ng gastos at legibility**
ng text→image renders, kada provider (Anthropic / OpenAI / Gemini), page
geometry, glyph cell, at atlas style.

Ang mga mas murang (mas siksik) na pahina ay may dalang mas maraming chars
kada token ngunit sa huli ay hindi na nababasa. Isang config lamang ang
pinapayagang ipadala kung **pareho** itong totoo — mababa ang gastos *at*
mahusay pa ring nababasa ito ng modelo:

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

Bawat sagot ay isinisiskor sa isa lamang sa tatlong resulta — ang gitna ang
siyang nagpapagana ng tiwala sa gate:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Ang isang config na may kahit isang 🔴 ay diskuwalipikado, gaano man ito
kamura.

Ang sentral na asymmetry: mula sa billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **eksaktong mahuhulaan ang gastos offline** —
28 px na patches + 4/block sa Anthropic (`src/core/anthropic-vision.ts`),
mga profile ng patch/tile sa OpenAI (`src/core/openai.ts`),
tiles/media_resolution sa Gemini (`gemini-cost.ts`). Ang **katumpakan ng
pagbasa** lamang ang nangangailangan ng API.

## Disenyo

- **Corpus** (`corpus.ts`): siksik na log/JSON-style na filler + itinanim na
  needles mula sa mga klaseng sinasabi ng confusability matrix na
  bumabagsak (12-char hex, camelCase, digits 6/8/5/3) + **near-miss
  distractors** na binuo mula sa mga sinukat na confusable pair. Kung
  sasagutin ng modelo ang distractor, *hinulaan* ang pagkalito — iyon ang
  silent failure mode na hinahanap, hindi lamang binibilang na mali.
  Deterministic (mulberry32).
- **Configs** (`configs.ts`): curated na grid — standard 1568×728 pages vs
  high-res 1928×1928 (ang A/B na nagpapasya ng page geometry kada tier), AA
  vs 1-bit (nireresolba ang kontradiksyon ng dense-render), 7×10/10×16 na
  cell (Opus safe mode), GPT strip, at ang dalawang pusta ng Gemini
  (≤384² = 258 flat; `media_resolution: low` = 280 fixed → ~116 chars/token
  *kung* nababasa).
- **Score** (`score.ts`): deterministic na exact match, walang LLM-judge.
  Tatlong resulta: `correct` / `abstained` (ILEGIVEL sentinel — tapat na
  kabiguan) / `silent_wrong` (ang mapanganib na mode), na may distractor
  flag.

## Pagpapatakbo

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Mga tiyak na config: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Napupunta ang mga sagot sa `results/*.jsonl` (isang linya kada tanong, na
may hilaw na sagot para sa audit).

## Acceptance bar (minana mula sa upstream PRs #35/#36)

Isang config lamang ang nagiging production default kung: **gist == text
baseline** AT **zero silent wrong exact strings** AT **positibong savings**.
Ang unang mandatoryong run ay `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` sa Fable — ang legibility spot-check ng malaking
pahina bago paganahin ang high-res tier.

## `--via-omniroute` — e2e sa pamamagitan ng OmniRoute (P3: patunay ng hindi-pagkadegrada)

Ang mga transport sa itaas ay nagre-render ng text→PNG **sa harness** at
nagpapadala ng mga imahe. Ang `--via-omniroute` ang kabaliktaran, na siyang
production path: nagpapadala ito ng **siksik na text** sa isang tumatakbong
instance ng OmniRoute, hinahayaang **mag-render ang `omniglyph` engine** ng
mga pahina at ipasa ang mga ito sa Anthropic, at sinusukat ang mga pagbasa +
ang savings. Kung nananatiling pareho ang mga pagbasa sa direktang route
**at** nag-uulat ang OmniRoute ng compression, napatunayan na **hindi
nagpapababa ng kalidad** ang render+forward ng OmniRoute sa mga pahina.

Mga paunang kailangan (operational):

1. **Tumatakbong OmniRoute** (`npm run dev`, default `http://localhost:20128`).
2. Isang **Anthropic provider** na naka-configure sa OmniRoute na may
   **tunay na key** (direct route — ang gate na `providerTransport==='direct'`
   ay pumapasa lamang para sa `anthropic` na provider).
3. Ang **`omniglyph` engine na PINAGANA** sa compression config ng OmniRoute
   (`config.engines.omniglyph.enabled = true`) — ang `engine:omniglyph`
   header ay nagti-trigger lamang kapag naka-on ang engine. (Ang engine ay
   `stable:false`/preview; tahasang paganahin ito.)
4. Isang **OmniRoute API key** sa `OMNIROUTE_API_KEY` (ang ginagamit ng
   client para mag-authenticate laban sa OmniRoute, hindi ang sa Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Itinatala ng bawat sagot ang `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(mula sa `X-OmniRoute-Compression` na response header) sa JSONL; ipinapakita
ng row ng talahanayan kung ilang sagot ang bumalik na naka-compress + ang
median savings. **P3 bar**: parehong verbatim/gist hits gaya ng direct route
(hindi-pagkadegrada) **na may** hindi null na `omnirouteSavings` (pinapatunayan
na nangyari ang isang render, hindi isang raw-text na pagbasa). Kung
lumitaw ang `did NOT compress`, hindi pinagana ang engine sa OmniRoute (o
hindi pumasa ang body sa mga fail-closed gate).

Mga test para sa mga purong bahagi: `tests/density-frontier.test.ts`
(kasama ang `buildOmnirouteRequest` at `parseCompressionSavings` mula sa
via-omniroute na transport).
</content>
