# density-frontier — cost × accuracy per resolution

Harness that measures the **Pareto frontier between cost and legibility** of the
text→image renders, per provider (Anthropic / OpenAI / Gemini), page geometry,
glyph cell, and atlas style.

The central asymmetry: since the billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **cost is exactly predictable offline** — 28 px
patches + 4/block on Anthropic (`src/core/anthropic-vision.ts`), patch/tile
profiles on OpenAI (`src/core/openai.ts`), tiles/media_resolution on Gemini
(`gemini-cost.ts`). Only **read accuracy** needs the API.

## Design

- **Corpus** (`corpus.ts`): dense log/JSON-style filler + planted needles from
  the classes the confusability matrix says fail (12-char hex, camelCase,
  digits 6/8/5/3) + **near-miss distractors** built from the measured
  confusable pairs. If the model answers with the distractor, the confusion was
  *predicted* — that's the silent failure mode being detected, not just
  counted. Deterministic (mulberry32).
- **Configs** (`configs.ts`): curated grid — standard 1568×728 pages vs
  high-res 1928×1928 (the A/B that decides per-tier geometry), AA vs 1-bit
  (resolves the dense-render contradiction), 7×10/10×16 cell (Opus safe
  mode), GPT strip, and the two Gemini bets (≤384² = 258 flat;
  `media_resolution: low` = 280 fixed → ~116 chars/token *if* legible).
- **Score** (`score.ts`): deterministic exact match, no LLM-judge. Three
  outcomes: `correct` / `abstained` (ILEGIVEL sentinel — honest failure) /
  `silent_wrong` (the dangerous mode), with a distractor flag.

## Running

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Specific configs: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Answers land in `results/*.jsonl` (one line per question, with the raw answer
for auditing).

## Acceptance bar (inherited from upstream PRs #35/#36)

A config only becomes a production default if: **gist == text baseline** AND
**zero silent wrong exact strings** AND **positive savings**. The first
mandatory run is `anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa` on Fable —
the legibility spot-check of the large page before enabling the high-res tier.

## `--via-omniroute` — e2e through OmniRoute (P3: non-degradation proof)

The transports above render text→PNG **in the harness** and send the images.
`--via-omniroute` does the opposite, which is the production path: it sends the
**dense text** to a running OmniRoute instance, lets the **`omniglyph` engine
render** the pages and forward them to Anthropic, and measures the reads + the
savings. If reads stay the same as the direct route **and** OmniRoute reports
compression, it is proven that OmniRoute's render+forward **does not degrade**
the pages.

Prerequisites (operational):

1. **OmniRoute running** (`npm run dev`, default `http://localhost:20128`).
2. An **Anthropic provider** configured in OmniRoute with a **real key** (direct
   route — the `providerTransport==='direct'` gate only passes for the `anthropic` provider).
3. The **`omniglyph` engine ENABLED** in OmniRoute's compression config
   (`config.engines.omniglyph.enabled = true`) — the `engine:omniglyph` header only fires
   with the engine on. (The engine is `stable:false`/preview; enable it explicitly.)
4. An **OmniRoute API key** in `OMNIROUTE_API_KEY` (the one the client uses to
   authenticate against OmniRoute, not the Anthropic one).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Each answer records `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(from the `X-OmniRoute-Compression` response header) in the JSONL; the table row shows
how many answers came back compressed + the median savings. **P3 bar**: same
verbatim/gist hits as the direct route (non-degradation) **with** non-null
`omnirouteSavings` (proving a render happened, not a raw-text read). If `did NOT compress`
shows up, the engine is not enabled in OmniRoute (or the body did not pass the
fail-closed gates).

Tests for the pure parts: `tests/density-frontier.test.ts` (includes `buildOmnirouteRequest`
and `parseCompressionSavings` from the via-omniroute transport).
