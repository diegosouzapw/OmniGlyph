# Anthropic vision-billing sweep

ફ્રી `count_tokens` sweep જે બે ખુલ્લા geometry પ્રશ્નો નક્કી કરે છે:

1. **Formula** — શું API `ceil(w/28) × ceil(h/28)` patches (current docs)
   બિલ કરે છે કે retired `w·h/750`? Probe set બંનેને પ્રતિ row 25–180
   tokens દ્વારા અલગ કરે છે.
2. **Tier** — શું `claude-fable-5` ને high-resolution caps મળે છે (long
   edge ≤ 2576 px, ≤ 4784 visual tokens)? `page-old-1928x1928` row એ
   decider છે: ≈ **4761** measured નો અર્થ high-res WYSIWYG (જૂનું મોટું
   page આજના 1568×728 કરતાં ~3.3× વધુ chars પ્રતિ image ધરાવે છે, same
   chars/token પર); ≈ **1521** નો અર્થ standard-tier resample, અને
   1568×728 correct રહે છે.

Context: current 1568×728 page પાછળનું 2026-07-01 sweep (legibility
audit, 2026-07-01) `claude-sonnet-4-5` — એક standard-tier મોડેલ — પર
માપવામાં આવ્યું હતું, જ્યારે production Fable 5 ને target કરે છે, જેને
vision docs high-resolution tier માં મૂકે છે. તે audit એ current page ને
1460 tokens પર પણ માપ્યું: /750 ના 1522 કરતાં patch formula ના 1456 ની
વધુ નજીક, જે hint આપે છે કે API પહેલેથી જ patch billing તરફ move કરી
ચૂક્યું હતું.

## Run

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

**સીધા જ** API ને hit કરવું જોઈએ — ક્યારેય OmniGlyph proxy દ્વારા નહીં,
જે body ને transform કરી દેશે. `count_tokens` ફ્રી છે; પૂરું sweep
~25 requests કરે છે.

## Output વાંચવું

પ્રતિ model, દરેક probe row measured image tokens (with-image ઓછું
text-only baseline) બધા ચાર predictions સામે (`patch`/`legacy750` ×
`standard`/`highres`) બતાવે છે; summary hypotheses ને mean absolute
residual દ્વારા rank કરે છે. `--probe-multi` per-image cap ચેક કરે છે
(2×1092² ≈ 2×1521); `--probe-20plus` >20-images rule ચેક કરે છે (>2000
px side ને reject થવું જોઈએ, resample નહીં). Rows `results/*.jsonl` માં
જાય છે; prediction math `formulas.mjs` માં છે, `tests/billing-sweep-formulas.test.ts`
દ્વારા pinned.

## Verdict પછી

- Patch formula confirmed → OmniGlyph PR #27 (exact resize translation)
  port કરો અને `src/core/transform.ts` માં `ANTHROPIC_PIXELS_PER_TOKEN`
  gate math align કરો.
- Fable પર High-res tier confirmed → per-tier page geometry ફરીથી
  introduce કરો (Fable/Opus 4.8/Sonnet 5 માટે 1928×1928-class pages,
  standard માટે 1568×728), GPT path પહેલેથી જ પોતાનું `GPT_MAX_HEIGHT_PX`
  કેવી રીતે રાખે છે તેને mirror કરીને.
