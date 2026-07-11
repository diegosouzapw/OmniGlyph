# OpenAI-wire profile rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the GPT-shaped profile resolver to a provider-neutral module so
the next provider (Grok) slots in cleanly — with zero behavior change.

**Architecture:** Pure mechanical rename of `src/core/gpt-model-profiles.ts` and
its exported symbols to provider-neutral names, updating the three internal
importers. The resolver is internal (not re-exported from `src/core/index.ts`),
so no public API changes and no back-compat aliases. The existing test suite is
the regression net — behavior must stay byte-identical.

**Tech Stack:** TypeScript (strict, ESM, `.js` import suffixes), vitest, pnpm.

## Global Constraints

- Strict TDD / no weakening tests. This task adds no new test; the existing
  suite is the safety net and must stay green **unchanged**.
- ESM only; TS source imports use the `.js` suffix.
- Full validation on the task: `pnpm run lint && pnpm run typecheck && pnpm test
  && pnpm run build` — all clean.
- Rebrand guard: no upstream project or author names in tracked files (the
  forbidden set enforced by `tests/docs-integrity.test.ts`). Upstream refs live
  ONLY in the commit trailer, and this plan derives them from git at commit time
  rather than spelling them out (see Step 10).
- No AI attribution trailers. Attribution goes in the commit message as
  `Co-authored-by:` the upstream maintainer's git identity and `Inspired-by:`
  the upstream commit URL for `cd4c9ef` — both derived from git in Step 10.
- Work in an isolated git worktree branched from `main`; never `git stash`.

---

## Symbol rename map

| old (in `gpt-model-profiles.ts`) | new (in `openai-wire-profiles.ts`) |
|---|---|
| `resolveGptProfile` | `resolveModelProfile` |
| `GptModelProfile` | `ModelProfile` |
| `GptVisionCost` | `VisionCost` |
| `DEFAULT_GPT_PROFILE` | `DEFAULT_MODEL_PROFILE` |
| `DEFAULT_GPT_STRIP_COLS` | `DEFAULT_STRIP_COLS` |
| `GPT_MAX_HEIGHT_PX` | `WIRE_MAX_HEIGHT_PX` |

**Collision traps (must handle, else typecheck fails):**
- `openai.ts:46` already declares `type VisionCost = GptVisionCost;`. After the
  rename, import `VisionCost` directly and delete that local alias line.
- `WIRE_MAX_HEIGHT_PX` avoids the existing `MAX_HEIGHT_PX` in
  `transform.ts`/`render.ts` — do **not** rename it to bare `MAX_HEIGHT_PX`.

---

### Task 1: Rename the profile module to provider-neutral names

**Files:**
- Rename (git mv): `src/core/gpt-model-profiles.ts` → `src/core/openai-wire-profiles.ts`
- Modify: `src/core/openai.ts` (import block lines 17-21; local alias line 46; ~15 `resolveGptProfile(...)` call sites; `DEFAULT_GPT_STRIP_COLS` at line 201)
- Modify: `src/core/openai-history.ts:25,107` (`GPT_MAX_HEIGHT_PX`)
- Test: `tests/gpt-billing-audit.test.ts:7` (import path + `resolveGptProfile` uses)

**Interfaces:**
- Consumes: nothing from earlier tasks (first task).
- Produces: `resolveModelProfile(model: string | null | undefined):
  ModelProfile`; `ModelProfile` interface (`{ vision: VisionCost; stripCols:
  number; maxHeightPx: number; detail: ... }`); `VisionCost` type;
  `DEFAULT_MODEL_PROFILE`; `DEFAULT_STRIP_COLS: number`; `WIRE_MAX_HEIGHT_PX:
  number`. Same shapes/values as the old symbols — rename only.

- [ ] **Step 1: Create the worktree**

Run:
```bash
cd /home/diegosouzapw/dev/teste/omniglyph
git worktree add .claude/worktrees/openai-wire-rename -b refactor/openai-wire-profiles-rename main
cd .claude/worktrees/openai-wire-rename && pnpm install
```

- [ ] **Step 2: Rename the file (preserve history)**

Run:
```bash
git mv src/core/gpt-model-profiles.ts src/core/openai-wire-profiles.ts
```

- [ ] **Step 3: Rename the exported symbols inside the file**

In `src/core/openai-wire-profiles.ts` apply the rename map (declarations + all
internal references): `resolveGptProfile`→`resolveModelProfile`,
`GptModelProfile`→`ModelProfile`, `GptVisionCost`→`VisionCost`,
`DEFAULT_GPT_PROFILE`→`DEFAULT_MODEL_PROFILE`,
`DEFAULT_GPT_STRIP_COLS`→`DEFAULT_STRIP_COLS`,
`GPT_MAX_HEIGHT_PX`→`WIRE_MAX_HEIGHT_PX`. Also update any header comment that says
"GPT" to "OpenAI-wire" where it now describes the general resolver (keep
GPT-specific rule comments as-is). Update the doc-comment env example to mention
`OMNIGLYPH_MODEL_PROFILES` alongside `OMNIGLYPH_GPT_PROFILES` (env parsing itself
is unchanged in this task).

- [ ] **Step 4: Update `openai.ts`**

Import block (lines 17-21) becomes:
```ts
  resolveModelProfile,
  DEFAULT_STRIP_COLS,
  type VisionCost,
} from './openai-wire-profiles.js';
```
Delete the local alias at line 46 (`type VisionCost = GptVisionCost;`) — the
imported `VisionCost` replaces it. Replace every `resolveGptProfile(` with
`resolveModelProfile(` (≈15 sites) and `DEFAULT_GPT_STRIP_COLS` (line 201) with
`DEFAULT_STRIP_COLS`.

- [ ] **Step 5: Update `openai-history.ts`**

Line 25: `import { WIRE_MAX_HEIGHT_PX } from './openai-wire-profiles.js';`
Line 107: `maxHeightPx: WIRE_MAX_HEIGHT_PX,`

- [ ] **Step 6: Update the test**

`tests/gpt-billing-audit.test.ts` line 7:
`import { resolveModelProfile } from '../src/core/openai-wire-profiles.js';`
Replace every `resolveGptProfile(` with `resolveModelProfile(` in that file.

- [ ] **Step 7: Typecheck (catches any missed reference / collision)**

Run: `pnpm run typecheck`
Expected: clean (no errors). A missed rename or the `VisionCost`/`MAX_HEIGHT_PX`
collision surfaces here.

- [ ] **Step 8: Run the full suite — behavior must be byte-identical**

Run: `pnpm test` (>2 min; run in background)
Expected: same pass count as `main` (all green). No test file other than
`gpt-billing-audit.test.ts` should need edits — if another test breaks, a rename
was missed; fix it, do not edit the test's assertions.

- [ ] **Step 9: Lint + build**

Run: `pnpm run lint && pnpm run build`
Expected: clean; `--version` smoke check passes.

- [ ] **Step 10: Commit**

Derive the attribution trailer from git so the upstream name never lands in a
tracked file (the `upstream` remote is shared across worktrees):

```bash
CO=$(git show -s --format='Co-authored-by: %an <%ae>' cd4c9ef)
INSP="Inspired-by: $(git remote get-url upstream | sed 's/\.git$//')/commit/cd4c9ef"
git add -A
git commit -m "$(printf '%s\n\n%s\n\n%s\n%s\n' \
  'refactor(profiles): rename GPT profile resolver to provider-neutral openai-wire-profiles' \
  'The /v1/responses + /v1/chat/completions leg is a wire protocol, not a single vendor. Rename the profile module and its exports (resolveGptProfile -> resolveModelProfile, GptModelProfile -> ModelProfile, etc.) so the next OpenAI-compatible provider slots in without a GPT-shaped misnomer. Pure rename: no behavior change, suite unchanged. The resolver is internal (not re-exported from index.ts), so no public-API break and no aliases needed.' \
  "$CO" "$INSP")"
```

- [ ] **Step 11: Push + open PR (leave OPEN, do not merge)**

```bash
git push -u origin refactor/openai-wire-profiles-rename
gh pr create --repo diegosouzapw/OmniGlyph --base main \
  --head refactor/openai-wire-profiles-rename \
  --title "refactor(profiles): provider-neutral openai-wire-profiles rename" \
  --body "Pure rename of the internal GPT profile resolver to provider-neutral names, prepping the OpenAI-wire leg for a second provider (Grok). No behavior change; full suite unchanged. Attribution in the commit trailer."
```

---

## Self-Review

**Spec coverage:** This plan implements the "rename / generalize the resolver"
half of PR1 in the spec (provider-neutral identity). Field additions (render
style, provider/billing discriminator) and the `OMNIGLYPH_MODEL_PROFILES`
parser extension land with their consumer in the Grok plan (PR2) — YAGNI: no
new fields without a caller.

**Placeholder scan:** none — every step has exact paths, symbols, and commands.

**Type consistency:** rename map is applied uniformly; the two collision traps
(`VisionCost` local alias in `openai.ts`, `MAX_HEIGHT_PX` vs `WIRE_MAX_HEIGHT_PX`)
are called out with their fixes.

## Follow-on plans (not this plan)

- **PR2 — Grok**: extend `ModelProfile` with render-style + provider/billing
  discriminator, add the `grok-*` rule, thread style through `openai.ts`
  rendering, add xAI billing in `openai-savings.ts`, and the fail-closed
  `unverified` gate in `applicability.ts`. Written after this rename lands.
- **PR3 — measurement**: adapt the Grok reading harness to `eval/grok-density/`
  with `--via-cli`, run via CLI/OmniRoute, commit the receipt, flip Grok to
  Verified.
- **Chart** (`8d7ba3e`): separate lightweight track.
