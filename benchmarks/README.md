# Benchmarks

Every number OmniGlyph claims comes from one of the two harnesses below —
re-runnable, deterministic where possible, with raw per-answer receipts in
`*/results/*.jsonl`. Consolidated analysis: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — what does an image actually cost?

Free `count_tokens` probes against the live Anthropic API, comparing the
retired `w·h/750` formula vs the current 28 px-patch model across 11 probe
geometries on 2 models × 2 resolution tiers.

**Result (2026-07-05): the patch model fits with residual ZERO on every probe**
— billed = `⌈w/28⌉ × ⌈h/28⌉` after tier resize, plus a fixed +3/+4 tokens per
image block. The production page (1568×728) costs exactly 1,460 tokens and
carries 28,080 chars ≈ **19.2 chars/token** vs ~2 chars/token as dense text.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — can the model actually READ it?

Cost (offline, exact) × read-accuracy (live) across render configs, page
geometries, glyph atlases and providers. The corpus plants exact-string
needles (hex ids, camelCase, digit runs) plus **near-miss distractors built
from the measured glyph-confusability pairs** — so silent confabulation is
detected, not just counted wrong. Scoring is deterministic (no LLM judge):
`correct` / `abstained` (honest `ILEGIVEL`) / `silent_wrong` / `no_answer`.

**Headline results** (n=30 per arm):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

Three transports: direct API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), and `--via-cli` (a Claude Code subscription —
$0). Caveat learned the hard way: intermediaries (OpenRouter, the CLI Read
tool) resample large images; only direct-API results are authoritative for
legibility.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Unit tests pinning the pure parts (corpus, scoring, cost formulas):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
