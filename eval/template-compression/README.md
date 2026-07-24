# Template Compression Spike

Measurement harness for the template-compression spike: orchestrates the corpus, measures token reduction with templating, and optionally runs A/B reads to verify no regression in accuracy.

## Running

### Dry-run (billing math only, no model calls)

```bash
pnpm exec tsx eval/template-compression/run.ts --dry-run
```

Outputs token-reduction percentages for repetitive tiers ('best', 'typical') and worst-tier ('prose', 'code') samples. Writes `results.json` with token measurements for all corpus samples. Cost: $0.

### Live run (A/B reads, verdict)

```bash
pnpm exec tsx eval/template-compression/run.ts [--model <id>] [--reps <n>]
```

Reads all corpus samples in both raw and templated arms via the `claude` CLI, scores answers, and computes a go/no-go verdict. Requires the `claude` CLI on `PATH` (Claude Code subscription; $0) — no API key needed. Default model: `claude-fable-5`; default reps: 3.

Output: 'GO' or 'NO-GO' plus reason(s), and `results.json` with full measurements and read outcomes.

## Verdict Logic

A go/no-go verdict is computed by `verdict()` as follows:

- **GO** if all criteria hold:
  - repetitive tier reduction ≥ 20%
  - templated arm recall ≥ raw arm recall (no regression)
  - 0 confabulations (silent_wrong outcomes)
  - worst tier not harmed (worstRecallDelta ≥ 0)

- **NO-GO** if any criterion fails (reasons printed for debugging).

## Results

`results.json` is git-ignored and regenerated on each run. It contains:
- `model`: the model used
- `tokenRows`: per-sample billing data (id, tier, raw/templated costs, reduction %)
- `repetitiveReductionPct`, `worstReductionPct`: tier-level reduction metrics
- `reads` (live runs only): all A/B read outcomes
- `verdict` (live runs only): go/no-go verdict and reason list
