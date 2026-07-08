# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [1.0.0] — 2026-07-07

First public release.

### The product

- **Context-as-image compression proxy**: rewrites the bulky parts of each LLM
  request (system prompt, tool docs, old history, large tool outputs) into dense
  1-bit PNG pages before they leave your machine. Local Node server and
  Cloudflare Workers host.
- **Exact per-provider billing math** (`src/core/`): Anthropic 28px patches +
  3–4 tokens/block overhead (own sweep, zero residual), OpenAI and Gemini
  formulas audited against official docs. Exported at the package root
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tier caps).
- **Measured production render config**: dense 1-bit glyph atlas (no
  anti-aliasing), standard-tier pages — every choice backed by a benchmark
  receipt in `benchmarks/*/results/`.
- **Benchmark harnesses** (`benchmarks/`): billing-sweep (token accounting) and
  density-frontier (read-accuracy frontier across models/densities), re-runnable
  via API, OpenRouter, Claude Code CLI, or through OmniRoute
  (`--via-omniroute`).
- **Refusal retry**: SSE/JSON sniffer replays the original request when a model
  refuses the rendered page (kill switch `retryRefusalWithOriginal`).
- **LRU render cache** for deterministic pages.
- **OmniRoute engine**: ships as the `omniglyph` compression engine in
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (single mode and
  stacked pipeline), with fail-closed gates and image-aware token accounting.

### The numbers (all reproducible)

- Sample UI render: 1015 chars → 438×120 PNG, 254 → 84 tokens (**66.9% saved**).
- Standard page 1568×728 = 1456 image tokens regardless of how much text it holds.
- Claude reads dense 1-bit pages at 100% on production density; Opus 4.8 reads
  77–87% at 10×16.

### Negative decisions (measured, not opinions)

- **High-res tier is a billing trap**: the 1928² page is billed WYSIWYG but the
  encoder does not receive full resolution — both tiers render standard pages.
- **GPT-5.5 rejected**: 0/60 reads of the dense strip and ~40× completion
  inflation vs text control.
- **gpt-4o-mini never imaged** (2833/5667 token floor makes it unprofitable).
- **Gemini 2.5-flash confabulates** instead of abstaining on dense pages
  (0/26) — pending paid-quota retest.
