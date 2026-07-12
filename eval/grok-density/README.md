# Grok image-recall receipt

**Question:** OmniGlyph ships an opt-in Grok profile (stock Spleen 5×8 cell on
white AA, no grid, 152-col strip, 512px pages, with the in-image IDS block and
the verbatim fact-sheet beside the image). Grok is kept **fail-closed** — it
stays in `UNVERIFIED_MODEL_BASES` (`src/core/applicability.ts`) and is never
imaged unless an operator acknowledges the risk — until **our own** measurement
shows it reads exact tokens back. Upstream's evidence is synthetic (white 5×8 +
IDS block: 7/7 with 4/4 exact on grok-4.5); this harness produces ours.

This does **not** change any default. It only produces the receipt that can flip
Grok to verified.

## What it does

Renders one synthetic session transcript — with embedded precision-critical
tokens (12-char hex, a camelCase identifier, a file path, a CLI flag, a port) —
**exactly as a production `grok-*` request would**: the geometry from
`resolveModelProfile('grok-4.5')` (the shipped profile), the in-image IDS block
(`appendIdsBlock`, applied to every imaged render text in production), a single
portrait strip, the profile's page height. Dry-run receipt for the fixture:
1 page at 768×416 → 320 image tokens vs ≈1168 text tokens (chars÷4), ≈73%
saved. Then it asks the model a fixed battery and scores it:

- **4 exact-recall** questions (hex, camelCase, path, port).
- **1 gist** question (the decided retry budget).
- **1 confabulation guard** ("what DB password?" — the safe answer is
  `NOT STATED`; inventing one is a confabulation).

## Acceptance bar (to flip Grok to verified)

**exact 4/4 · 0 confabulations · gist ok · guard ok · positive savings.**

Same bar as the model gate everywhere else. `grok-4.5` cleared this upstream on
synthetic fixtures (white 5×8 + IDS block); re-clearing it here is what removes
`grok` from `UNVERIFIED_MODEL_BASES`.

## Run

```bash
pnpm run build                       # the harness imports from dist/
node eval/grok-density/run.mjs       # DRY-RUN ($0): render + token/savings math

# LIVE (scores reading): point at any OpenAI-compatible Responses endpoint that
# serves Grok — a direct xAI endpoint OR an OmniRoute gateway (also
# OpenAI-compatible). Do NOT route through OmniGlyph itself.
GROK_DENSITY_LIVE=1 \
  OPENAI_BASE_URL=<grok responses base, e.g. https://api.x.ai/v1> \
  OPENAI_API_KEY=<key> \
  node eval/grok-density/run.mjs
```

Overrides: `GROK_DENSITY_MODEL` (default `grok-4.5`), `GROK_DENSITY_TIMEOUT_MS`
(default 180000 — reasoning models are slow).

## The receipt

The live run writes `results.json` (git-ignored so a dry-run never masquerades
as a receipt). When a live run **PASSES**, commit it as the receipt and make the
one-line flip in the same PR:

```bash
git add -f eval/grok-density/results.json
# then remove 'grok' from UNVERIFIED_MODEL_BASES in src/core/applicability.ts
```

Measurement before claims: no flip without a passing `results.json`.
