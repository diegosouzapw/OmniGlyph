# OmniGlyph — Guidelines for Gemini-based agents

> **Scope:** rules for Gemini-based assistants. For Claude Code, see
> [`CLAUDE.md`](CLAUDE.md). The canonical, tool-agnostic guide is
> [`AGENTS.md`](AGENTS.md) — read it first; this file only adds Gemini-specific
> emphasis. If anything here conflicts with `AGENTS.md`, `AGENTS.md` wins.

## Non-negotiables (mirror of `AGENTS.md`)

- **Strict TDD.** Write the failing test first, watch it fail for the right
  reason, then the minimal implementation. No production code without a test.
- **Measurement before claims.** Any number in code comments or docs must have a
  receipt in `benchmarks/*/results/*.jsonl`. Never hand-edit those files.
- **Never weaken a gate or a test to go green.** The fail-closed model gate and
  the profitability gate exist because of measured failures. Loosening them
  requires new benchmark receipts, not code edits.
- **Never commit secrets.** API keys live in env vars only — never in files,
  fixtures, or JSONL results.
- **English is the source of truth.** Docs prose is English; translations live
  under `docs/i18n/<locale>/`. Moving or renaming a doc means updating every
  relative link — `npx vitest run tests/docs-integrity.test.ts` must pass.
- **No AI attribution trailers** in commits, PRs, or the CHANGELOG.

## File placement

- Tests go under `tests/` only — never in the project root.
- One-off or experimental scripts go under `scripts/` — never loose in the root.

## Validation before you claim done

```bash
pnpm run lint && pnpm run typecheck && pnpm test && pnpm run build
```
