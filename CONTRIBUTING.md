# Contributing to OmniGlyph

Thanks for your interest! This project has two non-negotiable culture rules —
they are the reason every number in the README can be trusted.

## Rule 1 — Strict TDD

All production code is born from a test that failed first:

1. Write the test and **watch it fail for the right reason**.
2. Write the minimum to make it pass.
3. Refactor while staying green.

The full bar is: `pnpm run typecheck && pnpm test && pnpm run build` — all
three, always (docs link-lint and the rebrand guard run inside `pnpm test`
via `tests/docs-integrity.test.ts`).

## Rule 2 — Measurement before claims

No change to geometry, atlas, billing formula, or model scope lands without a
measured number. The repository is built around this discipline:

- Billing cost → prove it with `benchmarks/billing-sweep/` (`count_tokens` is
  free; expected residual: zero).
- Legibility → prove it with `benchmarks/density-frontier/` (n≥30 per arm,
  deterministic scoring, JSONL receipts committed to `benchmarks/*/results/`).
- The acceptance bar for changing a production default: gist == text baseline
  **AND** zero silent exact-string errors **AND** positive savings.

Hypotheses without numbers go to `docs/ROADMAP.md` as hypotheses — never into
the README as facts. Two "obvious" ideas have already been refuted with data
(the high-res page, the anti-aliased atlas); the process works.

## Setup

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI tests 20/22/24), pnpm 10 (pinned by `packageManager` in
package.json).

## Structure

| folder | rule |
|---|---|
| `src/core/` | runtime-agnostic (Web APIs only — runs on Node and Workers) |
| `src/node.ts` / `src/worker.ts` | host plumbing only |
| `benchmarks/` | re-runnable harnesses; JSONL results are receipts, committed |
| `docs/` | benchmarks/ (numbers), architecture/ (map), ROADMAP (hypotheses), ops/ (OmniRoute) |

## Commits and PRs

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), body explaining the *why* with the relevant numbers.
- Small, focused PRs; behavior changes come with the test that pins them and,
  when applicable, the benchmark that justifies them.
- Don't rewrite client `cache_control` blocks, don't add runtime dependencies
  without discussion (the core is dependency-light on purpose), don't use
  `Math.random`/timestamps in render paths (determinism is a hard invariant,
  tested by byte-identity).
