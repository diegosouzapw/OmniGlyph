# Template-compression spike — design (Phase 1, measurement only)

- **Date:** 2026-07-24
- **Status:** approved (brainstorming) → pending implementation plan
- **Scope:** a `$0`-capable measurement harness, isolated from the product. No
  change to the transform pipeline, the gate, or any shipped behavior.

## Problem

Tool outputs are often highly repetitive — worker logs, test-runner lines,
`git log`, `ls -la`, `grep` dumps — where every line shares a structure and only
a few fields vary. When such a block is imaged, every repeated literal is re-paid
in pixels. A community-suggested enhancement is to extract a **template** from
the repeated lines and emit only the varying fields as a compact table before
render, keeping the original recoverable:

```
worker-7 request 4832 failed after 30 sec        Template: worker-{w} request {r} failed after {s} sec
worker-7 request 4833 failed after 60 sec   →     Rows:
worker-8 request 4834 failed after 60 sec         7,4832,30 / 7,4833,60 / 8,4834,60
```

The suggestion reports ~35–40% additional token reduction with reads still
decoded correctly on one model. That is one setup, one model. OmniGlyph must not
touch the compression/reading tradeoff on a third-party number: gate-adjacent
changes require a **receipt of our own** (measurement before claims). This spike
produces that receipt.

## Goal & non-goals

**Goal:** answer one go/no-go question — does templatizing repetitive tool
outputs before render yield material additional token reduction **without**
regressing exact-value reading accuracy (no new confabulation)?

**Non-goals (YAGNI — explicitly cut from the spike):**
- Entropy/surprise heuristics, dictionaries, or embedding models to decide
  text-vs-image or to resize high-entropy spans. (Idea noted; out of scope.)
- Any product wiring (env flag, transform integration, dashboard).
- Non-line-structured compression (JSON folding, prose dedup).

## Success criteria (go → justifies a Phase 2 feature)

On the aggregate, **all** must hold:

1. The templated arm gives **≥ 20%** additional token reduction on the
   repetitive tiers (the author's 35–40% is a best-case; 20% is the conservative
   bar to clear).
2. Templated-arm exact-recall accuracy **≥** raw-arm accuracy (no regression).
3. **Zero** silent confabulations on exact-value queries in the templated arm
   (the project's fail-closed bar — a wrong-but-confident answer is a hard fail).
4. Low-repetition (worst-case) samples show negligible token change **and** no
   accuracy harm — the templatizer must never damage non-repetitive text.

Any miss → **no-go**, recorded with the numbers; the feature is not built.

## Components (`eval/template-compression/`)

Follows the existing spike convention (`eval/grok-density`, `eval/glyph-matrix`,
`eval/ab`): standalone, not imported by the product.

| unit | responsibility | depends on |
|---|---|---|
| `fixtures/` | corpus: synthetic + curated real command outputs, three tiers (best / typical / worst-case repetition). Each sample = `{ id, tier, text, queries: [{ q, exact }] }`. No secrets. | — |
| `templatize.ts` | pure `templatize(text) → { text, mapping }`: cluster lines sharing a literal skeleton, emit `Template:` + `Rows:`; non-matching lines pass through verbatim. Also `reconstruct(mapping) → text`. | — |
| `measure-tokens.ts` | render raw and templated arms, count tokens via the exact billing math. `$0`, no model. | `src/core` render + billing |
| `read-ab.ts` | paired A/B: render both arms to PNG, model answers each ground-truth query against each arm, exact-match score, 3 reps, confabulation tally. | model via `--via-cli` |
| `run.ts` | orchestrate; `--dry-run` = token side only (`$0`, no model); full run = both. Writes `results.json`. | above |

## Data flow

```
sample → templatize → { raw, templated }
  ├─(a) measure-tokens both arms                → % reduction per sample + aggregate
  └─(b) render both arms → model reads N queries × 3 reps → exact-match + confab tally
→ aggregate vs success criteria → verdict (go / no-go) in results.json
```

## Reversibility & safety

- **Losslessness is a hard invariant**: `reconstruct(templatize(x)) === x` for
  every corpus sample — a self-check the harness asserts before measuring. If the
  templatizer can't reproduce the original byte-for-byte, the sample fails loud.
- Model/CLI failure → retry then skip with a logged reason; a failed read is
  **never** scored as correct (fail-closed).
- Run the existing secret-guard over the fixtures (corpus is curated, but
  confirm no credential-shaped strings ride in).

## Testing

`templatize` is the only unit that could later move into the product, so it gets
real TDD tests now (the harness itself is eval code):

- known input → expected `Template:` + `Rows:` shape;
- round-trip identity `reconstruct(templatize(x)) === x`;
- non-repetitive input → passthrough unchanged;
- edge cases: single line, all-identical lines, mixed repetitive/unique,
  fields at line start/end, numeric vs token variables.

`--dry-run` token math is deterministic and asserted in a harness smoke test.

## Deliverable

`eval/template-compression/results.json` (git-ignored, like `eval/grok-density`)
+ a printed go/no-go verdict. If **go**, Phase 2 (separate spec) promotes
`templatize` into the transform pipeline behind an opt-in flag and the harness
into `benchmarks/` as the regression gate. If **no-go**, the numbers are the
record and the idea is closed.

## Attribution

Source idea is tracked in the local port-upstream ledger; author credit lands in
the commit trailer / CHANGELOG only if and when Phase 2 ships (trailer-only, per
the rebrand guard — never in tracked files).
