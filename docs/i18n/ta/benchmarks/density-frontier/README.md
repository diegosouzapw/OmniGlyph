# density-frontier — resolutionக்கு cost × accuracy

🌐 Translated: [all languages](../../../README.md)

Providerஒன்றுக்கு (Anthropic / OpenAI / Gemini), page geometry, glyph cell,
மற்றும் atlas style வாரியாக text→image rendersஇன் **cost மற்றும் legibilityக்கு
இடையேயான Pareto frontierஐ** measure செய்யும் harness.

மலிவான (அடர்த்தியான) pages tokenஒன்றுக்கு அதிக chars எடுத்துச் செல்கின்றன,
ஆனால் இறுதியில் readable ஆக இருப்பதை நிறுத்திவிடுகின்றன. **இரண்டும்** உண்மையாக
இருக்கும் இடத்தில் மட்டுமே ஒரு config shipஆக அனுமதிக்கப்படுகிறது — cost குறைவு
*மற்றும்* மாடல் இன்னும் அதை perfectஆகப் படிக்கிறது:

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

ஒவ்வொரு answerஉம் மூன்று outcomesஇல் சரியாக ஒன்றாக score செய்யப்படுகிறது —
gateஐ நம்பகமானதாக ஆக்குவது middle ஒன்று:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

எவ்வளவு மலிவாக இருந்தாலும், ஒரு 🔴வையாவது உருவாக்கும் config disqualify
செய்யப்படுகிறது.

மையமான asymmetry: billing sweepலிருந்து (2026-07-05,
`benchmarks/billing-sweep/`), **cost offline ஆக exactஆக predictable ஆகும்** —
Anthropicஇல் 28 px patches + 4/block (`src/core/anthropic-vision.ts`), OpenAIஇல்
patch/tile profiles (`src/core/openai.ts`), Geminiஇல் tiles/media_resolution
(`gemini-cost.ts`). **Read accuracy** மட்டுமே APIஐத் தேவைப்படுத்துகிறது.

## வடிவமைப்பு

- **Corpus** (`corpus.ts`): dense log/JSON-style filler + confusability matrix
  தோல்வியடையும் என்று கூறும் classesலிருந்து planted needles (12-char hex,
  camelCase, digits 6/8/5/3) + measured confusable pairsலிருந்து உருவாக்கப்பட்ட
  **near-miss distractors**. மாடல் distractorஉடன் பதிலளித்தால், confusion
  *predicted* ஆனது — அதுதான் detect செய்யப்படும் silent failure mode, வெறுமனே
  தவறு என்று கணக்கிடப்படவில்லை. Deterministic (mulberry32).
- **Configs** (`configs.ts`): curated grid — standard 1568×728 pages vs
  high-res 1928×1928 (per-tier geometryஐ தீர்மானிக்கும் A/B), AA vs 1-bit
  (dense-render முரண்பாட்டைத் தீர்க்கிறது), 7×10/10×16 cell (Opus safe
  mode), GPT strip, மற்றும் இரண்டு Gemini bets (≤384² = 258 flat;
  `media_resolution: low` = 280 fixed → *legible ஆனால்* ~116 chars/token).
- **Score** (`score.ts`): deterministic exact match, LLM-judge இல்லை. மூன்று
  outcomes: `correct` / `abstained` (ILEGIVEL sentinel — honest failure) /
  `silent_wrong` (dangerous mode), ஒரு distractor flagஉடன்.

## இயக்குதல்

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

குறிப்பிட்ட configs: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
பதில்கள் `results/*.jsonl`இல் land ஆகின்றன (ஒரு lineஒரு question, auditingக்கான
raw answerஉடன்).

## Acceptance bar (upstream PRs #35/#36லிருந்து inherit செய்யப்பட்டது)

ஒரு config production defaultஆக மாறுவது: **gist == text baseline** மற்றும்
**பூஜ்ஜிய silent wrong exact strings** மற்றும் **நேர்மறை savings** என்றால்
மட்டுமே. முதல் கட்டாய run Fableஇல் `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` ஆகும் — high-res tierஐ enable செய்வதற்கு முன் பெரிய
pageஇன் legibility spot-check.

## `--via-omniroute` — OmniRoute வழியாக e2e (P3: non-degradation proof)

மேலே உள்ள transports text→PNGஐ **harnessஇல்** render செய்து imagesஐ
அனுப்புகின்றன. `--via-omniroute` எதிர் செய்கிறது, இது production path ஆகும்:
இது **அடர்த்தியான உரையை** ஒரு இயங்கும் OmniRoute instanceக்கு அனுப்புகிறது,
**`omniglyph` engineஐ** பக்கங்களை render செய்து Anthropicக்கு forward செய்ய
விடுகிறது, மேலும் reads + savingsஐ measure செய்கிறது. Reads direct routeஐப்
போலவே இருந்தால் **மற்றும்** OmniRoute compressionஐ report செய்தால், OmniRouteஇன்
render+forward pagesஐ **degrade செய்யவில்லை** என்று நிரூபிக்கப்படுகிறது.

Prerequisites (operational):

1. **OmniRoute இயங்குகிறது** (`npm run dev`, default `http://localhost:20128`).
2. OmniRouteஇல் ஒரு **real key**உடன் configure செய்யப்பட்ட ஒரு **Anthropic
   provider** (direct route — `providerTransport==='direct'` gate `anthropic`
   providerக்கு மட்டுமே pass ஆகிறது).
3. OmniRouteஇன் compression configஇல் **`omniglyph` engine ENABLED**
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph` header
   engine onஆக இருந்தால் மட்டுமே fire ஆகும். (Engine `stable:false`/preview;
   வெளிப்படையாக enable செய்யவும்.)
4. `OMNIROUTE_API_KEY`இல் ஒரு **OmniRoute API key** (Anthropicக்கு அல்ல,
   OmniRouteக்கு authenticate செய்ய clientப் பயன்படுத்துவது).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

ஒவ்வொரு answerஉம் JSONLஇல் `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
ஐ record செய்கிறது (`X-OmniRoute-Compression` response headerலிருந்து); table
row எத்தனை answers compressed ஆகத் திரும்பின + median savingsஐக் காட்டுகிறது.
**P3 bar**: direct routeஐப் போலவே verbatim/gist hits (non-degradation)
**மற்றும்** non-null `omnirouteSavings`உடன் (ஒரு render நடந்தது என்று
நிரூபிக்கிறது, raw-text read அல்ல). `did NOT compress` தோன்றினால், OmniRouteஇல்
engine enable செய்யப்படவில்லை (அல்லது body fail-closed gatesஐ pass
செய்யவில்லை).

Pure partsக்கான Tests: `tests/density-frontier.test.ts` (via-omniroute
transportலிருந்து `buildOmnirouteRequest` மற்றும் `parseCompressionSavings`ஐ
உள்ளடக்கியது).
