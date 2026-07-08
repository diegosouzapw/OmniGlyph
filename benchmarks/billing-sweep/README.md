# Anthropic vision-billing sweep

🌐 Translated: [all languages](../../docs/i18n/README.md)

**Why it exists:** the profitability gate is only safe if the cost estimate is
*exact*. A formula that is off by a little would convert blocks that actually
cost more. So this sweep pins the formula to the API's real numbers before it
ships — to **zero residual**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Free `count_tokens` sweep that decides two open geometry questions:

1. **Formula** — does the API bill `ceil(w/28) × ceil(h/28)` patches (current
   docs) or the retired `w·h/750`? The probe set separates the two by 25–180
   tokens per row.
2. **Tier** — does `claude-fable-5` get the high-resolution caps (long edge
   ≤ 2576 px, ≤ 4784 visual tokens)? The `page-old-1928x1928` row is the
   decider: ≈ **4761** measured means high-res WYSIWYG (the old big page holds
   ~3.3× more chars per image than today's 1568×728, at the same chars/token);
   ≈ **1521** means standard-tier resample, and 1568×728 stays correct.

Context: the 2026-07-01 sweep behind the current 1568×728 page
(legibility audit, 2026-07-01) was measured
on `claude-sonnet-4-5` — a standard-tier model — while production targets
Fable 5, which the vision docs place in the high-resolution tier. That audit
also measured the current page at 1460 tokens: closer to the patch formula's
1456 than to /750's 1522, hinting the API had already moved to patch billing.

## Run

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Must hit the API **directly** — never through the OmniGlyph proxy, which would
transform the body. `count_tokens` is free; the full sweep makes ~25 requests.

## Reading the output

Per model, each probe row shows measured image tokens (with-image minus
text-only baseline) against all four predictions (`patch`/`legacy750` ×
`standard`/`highres`); the summary ranks hypotheses by mean absolute residual.
`--probe-multi` checks the per-image cap (2×1092² ≈ 2×1521); `--probe-20plus`
checks the >20-images rule (a >2000 px side must be rejected, not resampled).
Rows land in `results/*.jsonl`; prediction math lives in `formulas.mjs`,
pinned by `tests/billing-sweep-formulas.test.ts`.

## After the verdict

- Patch formula confirmed → port OmniGlyph PR #27 (exact resize translation) and
  align `ANTHROPIC_PIXELS_PER_TOKEN` gate math in `src/core/transform.ts`.
- High-res tier confirmed on Fable → reintroduce a per-tier page geometry
  (1928×1928-class pages for Fable/Opus 4.8/Sonnet 5, 1568×728 for standard),
  mirroring how the GPT path already keeps its own `GPT_MAX_HEIGHT_PX`.
