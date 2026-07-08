## Summary

- Describe the user-facing or operational change.

## Related Issues

- Closes #
- Related to #

## Validation

- [ ] `pnpm run lint` is clean
- [ ] `pnpm run typecheck` is clean
- [ ] `pnpm test` passes (full suite)
- [ ] `pnpm run build` succeeds (bundle + `--version` smoke)

## Tests

- List every changed or added test file.
- New behavior follows TDD: a failing test was written first. If no production code changed, state that here.

## Measurement (if this touches billing math, the model gate, or the render path)

- [ ] A benchmark receipt backs any number in the PR (`benchmarks/*/results/*.jsonl`).
- [ ] No fail-closed gate or test was weakened to make something pass.
- Which harness proves the change: `benchmarks/billing-sweep` · `benchmarks/density-frontier` · N/A

## Docs / i18n

- [ ] If a tracked doc moved or a heading changed, `npx vitest run tests/docs-integrity.test.ts` still passes.
- [ ] English is the source of truth; translations under `docs/i18n/` were updated or flagged as follow-up.

## Reviewer Notes

- Call out risky areas, migrations, or manual validation reviewers should know about.
