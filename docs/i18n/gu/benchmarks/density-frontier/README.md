# density-frontier — resolution દીઠ cost × accuracy

Harness જે text→image renders ના **cost અને legibility વચ્ચેના Pareto
frontier** ને માપે છે, provider (Anthropic / OpenAI / Gemini), page
geometry, glyph cell, અને atlas style દીઠ.

કેન્દ્રીય asymmetry: billing sweep (2026-07-05, `benchmarks/billing-sweep/`)
થી, **cost offline exactly predictable છે** — Anthropic પર 28 px patches
+ 4/block (`src/core/anthropic-vision.ts`), OpenAI પર patch/tile
profiles (`src/core/openai.ts`), Gemini પર tiles/media_resolution
(`gemini-cost.ts`). ફક્ત **read accuracy** ને API ની જરૂર છે.

## Design

- **Corpus** (`corpus.ts`): ઘટ્ટ log/JSON-style filler + confusability
  matrix નિષ્ફળ જાય છે એમ કહેલી classes માંથી planted needles (12-char
  hex, camelCase, digits 6/8/5/3) + measured confusable pairs માંથી
  બનેલા **near-miss distractors**. જો મોડેલ distractor સાથે જવાબ આપે, તો
  confusion *predicted* હતું — એ જ silent failure mode છે જે detect
  કરવામાં આવે છે, ફક્ત ખોટું ગણવામાં આવતું નથી. ડિટરમિનિસ્ટિક (mulberry32).
- **Configs** (`configs.ts`): curated grid — standard 1568×728 pages vs
  high-res 1928×1928 (A/B જે per-tier geometry નક્કી કરે છે), AA vs
  1-bit (dense-render contradiction resolve કરે છે), 7×10/10×16 cell
  (Opus safe mode), GPT strip, અને બે Gemini bets (≤384² = 258 flat;
  `media_resolution: low` = 280 fixed → *જો* legible તો ~116 chars/token).
- **Score** (`score.ts`): ડિટરમિનિસ્ટિક exact match, કોઈ LLM-judge નહીં.
  ત્રણ outcomes: `correct` / `abstained` (ILEGIVEL sentinel — honest
  failure) / `silent_wrong` (dangerous mode), distractor flag સાથે.

## Running

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Specific configs: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
જવાબ `results/*.jsonl` માં જાય છે (auditing માટે raw answer સાથે પ્રતિ
question એક line).

## Acceptance bar (upstream PRs #35/#36 માંથી inherited)

એક config ફક્ત ત્યારે જ production default બને છે જ્યારે: **gist ==
text baseline** AND **zero silent wrong exact strings** AND **positive
savings**. પ્રથમ ફરજિયાત run Fable પર `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` છે — high-res tier enable કરતા પહેલા મોટા page
નો legibility spot-check.

## `--via-omniroute` — OmniRoute દ્વારા e2e (P3: non-degradation proof)

ઉપરના transports harness માં text→PNG રેન્ડર કરે છે અને images મોકલે છે.
`--via-omniroute` વિરુદ્ધ કરે છે, જે production path છે: તે **ઘટ્ટ text**
ને ચાલી રહેલા OmniRoute instance ને મોકલે છે, **`omniglyph` engine ને
રેન્ડર** કરવા દે છે અને pages ને Anthropic તરફ forward કરે છે, અને reads
+ savings ને measure કરે છે. જો reads direct route જેટલા જ રહે **અને**
OmniRoute compression report કરે, તો સાબિત થાય છે કે OmniRoute નું
render+forward pages ને degrade **નથી** કરતું.

Prerequisites (operational):

1. **OmniRoute ચાલી રહ્યું** (`npm run dev`, default `http://localhost:20128`).
2. OmniRoute માં configured એક **Anthropic provider** સાચી **key** સાથે
   (direct route — `providerTransport==='direct'` gate ફક્ત `anthropic`
   provider માટે જ pass થાય છે).
3. OmniRoute ના compression config માં **`omniglyph` engine ENABLED**
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`
   header ફક્ત engine on હોય ત્યારે જ fire થાય છે. (Engine
   `stable:false`/preview છે; સ્પષ્ટ રીતે enable કરો.)
4. `OMNIROUTE_API_KEY` માં એક **OmniRoute API key** (એ જે client OmniRoute
   સામે authenticate કરવા વાપરે છે, Anthropic વાળી નહીં).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

દરેક answer JSONL માં `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
રેકોર્ડ કરે છે (`X-OmniRoute-Compression` response header માંથી); table
row બતાવે છે કેટલા answers compressed પાછા આવ્યા + median savings.
**P3 bar**: direct route જેટલી જ verbatim/gist hits (non-degradation)
**non-null** `omnirouteSavings` **સાથે** (સાબિત કરે છે કે render થયું,
raw-text read નહીં). જો `did NOT compress` દેખાય, તો engine OmniRoute
માં enabled નથી (અથવા body fail-closed gates પસાર ન થયું).

Pure parts માટે Tests: `tests/density-frontier.test.ts` (`buildOmnirouteRequest`
અને `parseCompressionSavings` via-omniroute transport માંથી સામેલ).
