# Guard ablation — do IDS rows earn their pixels on the Fable read path?

**Question.** OmniGlyph appends two guards to imaged content: a text **fact
sheet** (rides beside the image, `factSheetText`) and an in-image **IDS block**
(`appendIdsBlock`, ~17 rows / ~290 image tokens per page). The fact sheet's
recall value is measured. The IDS block's is not — this harness isolates it.

**Design.** Three arms over the same synthetic session-log corpus (12-hex ids +
unique `dur_ms`), rendered through the real production dense path
(`renderTextToPngsWithCharLimit` at `DENSE_CONTENT_COLS` /
`DENSE_CONTENT_CHARS_PER_IMAGE`, `DENSE_RENDER_STYLE`):

| arm | image | prompt |
|---|---|---|
| A | `appendIdsBlock(text)` rendered in | + fact sheet (production) |
| B | plain text rendered in | + fact sheet |
| C | plain text rendered in | no fact sheet |

The query ("which id has `dur_ms=X`") forces the association to come from the
image; a guard can only help as exact-spelling correction. **A vs B** (paired,
same golds) isolates the IDS block; **B vs C** isolates the fact sheet.

## Run

```bash
npx tsx eval/ab/guards-3arm/gen.mts          # deterministic corpus + PNGs ($0)
eval/ab/guards-3arm/run.sh A 1               # score arm A via the Claude Code CLI ($0)
eval/ab/guards-3arm/run.sh B 1
eval/ab/guards-3arm/run.sh C 1
```

`run.sh` scores through the local `claude` CLI (subscription, $0). It takes a
parallelism argument — **use `1`**. See the throttling note below.

`work/` (corpus, PNGs, factsheets, per-arm logs) is git-ignored: generated
scratch and, until a clean run exists, must never masquerade as a receipt.

## Status — no OmniGlyph receipt yet; production unchanged

Upstream's synthetic run (n=24) reported **A 14/24 · B 14/24 · C 8/24**: the
fact sheet delivers the recall lift, the IDS block shows no measurable effect.
That is upstream evidence, not ours.

Our own run in this environment was **inconclusive**: the Claude Code CLI
throttles under sustained sequential load, so arms B and C returned empty for
every trial while arm A (run first) scored 10/24 with 8 of its own trials also
empty — an environment artifact, not a reading signal (a manual single-shot arm-B
call read the image and returned a candidate id; repeated probes then stalled).

**Because measurement precedes claims here, no production change was made.**
`appendIdsBlock` still runs on every imaged leg. Dropping or gating the IDS
block requires a clean pass of this harness (arms B and C non-empty) on
OmniGlyph's own numbers — run it where the CLI is not rate-limited, or via an
API key / OmniRoute leg, and record the three scores before touching
`src/core/factsheet.ts` or the render lanes.
