# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantic versioning.

## [Unreleased]

### Changed

- **test:** raise the Vitest per-test timeout to 30s so genuinely slow render
  e2e cases (full reflow + PNG encode) are not false-negative timeouts on
  slower/CI machines. Assertions are unchanged. (thanks @ousamabenyounes)

## [1.0.2] — 2026-07-08

Release-automation only. No change to the package's code or behavior.

### Changed

- Releases now publish from GitHub Actions via **npm trusted publishing (OIDC)**,
  so every release carries **provenance** and no long-lived npm token is used.
- Each release is also mirrored to **GitHub Packages** as
  `@diegosouzapw/omniglyph` (the npmjs.com package stays unscoped `omniglyph`).

## [1.0.1] — 2026-07-08

Security and documentation release. No behavior change to the compression path.

### Security

- **Resolve all CodeQL code-scanning alerts.** Rewrote regex-heavy hot paths to
  run in linear time (the tag sniffer and `<env>` extraction in `transform.ts`
  now locate delimiters with `indexOf` instead of backtracking regexes; trailing
  slash/space strips and variant-tag stripping became linear scans). Closed two
  time-of-check/time-of-use file reads (`export-collect.ts` and the reflow corpus
  reader now `fstat` the same fd they read). Fixed an automatic-semicolon-insertion
  hazard in `render.ts`.

### Docs

- Documentation translated into **41 languages** under `docs/i18n/`, with a
  localized CLI `--help` (`OMNIGLYPH_LANG`). English remains the source of truth.
- Visual benchmark explainers (text-vs-image token bars, the patch grid the API
  bills, the cost×accuracy frontier, the three-outcome scoring legend).
- Standard community health files (issue/PR templates, CODEOWNERS, FUNDING) and
  the AI-assistant contributor guides (`AGENTS.md`, `CLAUDE.md`, `GEMINI.md`).

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
