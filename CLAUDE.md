# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
pnpm install               # install deps
pnpm run build             # esbuild bundle → dist/ (Node + Workers entrypoints)
pnpm run typecheck         # tsc --noEmit (must be clean)
pnpm test                  # vitest run — full suite (can take >2 min; run in background)
pnpm run dev:node          # local proxy at http://127.0.0.1:47821 (tsx watch)
pnpm run dev:worker        # Cloudflare Workers host (wrangler dev)
```

Focused test runs (preferred while iterating): `npx vitest run tests/<file>.test.ts`.

## Project at a Glance

Context-as-image compression proxy: rewrites bulky LLM request blocks (system
prompt, tool docs, old history, large tool outputs) into dense 1-bit PNG pages
with **exact per-provider billing math**. Only converts when the math wins, and
only for models that passed the reading benchmark (fail-closed gate).

| layer | where | what |
|---|---|---|
| Core | `src/core/` | transform pipeline, exact billing (`anthropic-vision.ts`, `gemini-model-profiles.ts`), render cache, proxy logic |
| Render | `src/core/render*` + `assets/` | 1-bit 5×8 glyph atlas (Spleen/Unifont-derived), reflow, PNG pages |
| Hosts | `src/node.ts` · `src/worker.ts` | local Node server (dashboard + events) · Cloudflare Workers |
| Public API | `src/core/index.ts` | billing math re-exported at package root (consumed by OmniRoute) |
| Benchmarks | `benchmarks/` | billing-sweep + density-frontier harnesses; JSONL receipts in `*/results/` |
| Tests | `tests/` | vitest; includes docs-integrity (link rot + rebrand guard) |

## Key Conventions

- **Strict TDD**: write the failing test first, watch it fail for the right
  reason, then the minimal implementation. No production code without a test.
- **Measurement before claims**: any number in docs/README must have a receipt
  in `benchmarks/*/results/`. Measured decisions (see `docs/benchmarks/BENCHMARKS.md`)
  are not re-litigated without new data.
- TypeScript strict, ESM only (`.js` import suffixes in TS source).
- Comments state constraints the code can't show — not narration.
- User-facing brand strings are `OmniGlyph`; binary/env prefix is
  `omniglyph` / `OMNIGLYPH_*`; data in `~/.omniglyph/`, config in
  `~/.config/omniglyph/`.

## Running Benchmarks

```bash
node benchmarks/billing-sweep/run.mjs --dry-run             # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run  # cost table, $0
# live runs need ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (env only),
# or --via-cli (Claude Code subscription, $0), or --via-omniroute
```

Results append to `benchmarks/*/results/*.jsonl` — never edit those by hand.

## Hard Rules

1. **Never commit secrets.** API keys live in env vars only — never in files,
   fixtures, or JSONL results. The repo history must stay key-free.
2. **Never weaken a gate or a test to make something pass.** The fail-closed
   model gate and the profitability gate exist because of measured failures
   (GPT-5.5: 0/60; Gemini: confabulates). Loosening them requires new benchmark
   receipts, not code edits.
3. **Never touch `benchmarks/*/results/`** except by running the harnesses.
4. **The LICENSE keeps the upstream copyright line** — MIT obligation.
   Everywhere else the brand is OmniGlyph only;
   `tests/docs-integrity.test.ts` enforces this (rebrand guard).
5. **No AI attribution trailers** (`Co-Authored-By`, "Generated with") in
   commits, PRs, or the CHANGELOG.
6. **Docs integrity is a test.** Moving/renaming a doc requires updating every
   relative link — `npx vitest run tests/docs-integrity.test.ts` must pass.
