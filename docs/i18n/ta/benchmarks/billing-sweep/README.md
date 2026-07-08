# Anthropic vision-billing sweep

🌐 Translated: [all languages](../../../README.md)

**இது ஏன் உள்ளது:** cost estimate *exact*ஆக இருந்தால் மட்டுமே profitability
gate பாதுகாப்பானது. சிறிதளவு off ஆன ஒரு formula உண்மையில் அதிகமாக செலவாகும்
blocksஐ convert செய்யும். எனவே இந்த sweep, formulaவை ship செய்வதற்கு முன்
APIஇன் real numbersஉடன் pin செய்கிறது — **zero residual**க்கு.

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

இரண்டு திறந்த geometry கேள்விகளை தீர்மானிக்கும் இலவச `count_tokens` sweep:

1. **Formula** — API `ceil(w/28) × ceil(h/28)` patches (தற்போதைய docs) அல்லது
   retired `w·h/750` பில் செய்கிறதா? Probe set இரண்டையும் ஒரு rowக்கு
   25–180 tokens மூலம் பிரிக்கிறது.
2. **Tier** — `claude-fable-5` high-resolution capsஐப் பெறுகிறதா (long edge
   ≤ 2576 px, ≤ 4784 visual tokens)? `page-old-1928x1928` row decider ஆகும்:
   ≈ **4761** measured means high-res WYSIWYG (பழைய பெரிய page இன்றைய
   1568×728ஐ விட ~3.3× அதிக chars ஒரு imageக்கு கொண்டிருக்கிறது, அதே
   chars/tokenஇல்); ≈ **1521** means standard-tier resample, மற்றும் 1568×728
   சரியாகவே இருக்கிறது.

Context: இன்றைய 1568×728 pageக்குப் பின்னால் உள்ள 2026-07-01 sweep
(legibility audit, 2026-07-01) `claude-sonnet-4-5`இல் measure செய்யப்பட்டது
— ஒரு standard-tier model — production Fable 5ஐ target செய்யும்போது, vision
docs அதை high-resolution tierஇல் வைக்கின்றன. அந்த audit தற்போதைய pageவையும்
1460 tokensஇல் measure செய்தது: /750இன் 1522ஐ விட patch formulaஇன் 1456க்கு
நெருக்கமாக, API ஏற்கனவே patch billingக்கு நகர்ந்திருந்ததை hint செய்கிறது.

## இயக்கவும்

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

நேரடியாக API-ஐ hit செய்ய வேண்டும் — OmniGlyph proxy வழியாக ஒருபோதும் இல்லை,
அது bodyஐ transform செய்யும். `count_tokens` இலவசம்; full sweep ~25 requests
செய்கிறது.

## Outputஐப் படித்தல்

ஒவ்வொரு மாடலுக்கும், ஒவ்வொரு probe rowஉம் measured image tokensஐ
(image-உடன் minus text-only baseline) நான்கு predictions (`patch`/`legacy750` ×
`standard`/`highres`)க்கு எதிராகக் காட்டுகிறது; summary hypothesesஐ mean
absolute residual மூலம் rank செய்கிறது. `--probe-multi` per-image capஐச்
சரிபார்க்கிறது (2×1092² ≈ 2×1521); `--probe-20plus` >20-images rule-ஐச்
சரிபார்க்கிறது (>2000 px side ஒரு reject செய்யப்பட வேண்டும், resample அல்ல).
Rows `results/*.jsonl`இல் land ஆகின்றன; prediction math `formulas.mjs`இல்
உள்ளது, `tests/billing-sweep-formulas.test.ts` மூலம் pinned.

## Verdictக்குப் பின்

- Patch formula confirm ஆனது → OmniGlyph PR #27ஐ (exact resize translation)
  port செய்து `src/core/transform.ts`இல் `ANTHROPIC_PIXELS_PER_TOKEN` gate
  mathஐ align செய்யவும்.
- Fableஇல் High-res tier confirm ஆனது → ஒரு per-tier page geometryஐ மீண்டும்
  அறிமுகப்படுத்தவும் (Fable/Opus 4.8/Sonnet 5க்கு 1928×1928-class pages,
  standardக்கு 1568×728), GPT path ஏற்கனவே அதன் சொந்த `GPT_MAX_HEIGHT_PX`ஐ
  வைத்திருப்பதைப் போலவே.
