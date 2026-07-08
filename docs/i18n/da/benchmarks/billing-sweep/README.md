# Anthropic vision-afregnings-sweep

🌐 Translated: [all languages](../../../README.md)

**Hvorfor det findes:** rentabilitetsspærringen er kun sikker, hvis
omkostningsestimatet er *præcist*. En formel, der er en lille smule ved
siden af, ville konvertere blokke, der faktisk koster mere. Så dette sweep
fastlåser formlen til API'ets reelle tal, før det sendes i produktion — til
**nul resterende afvigelse**.

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

Gratis `count_tokens`-sweep, der afgør to åbne geometrispørgsmål:

1. **Formel** — afregner API'et `ceil(w/28) × ceil(h/28)`-patches (nuværende
   dokumentation) eller den udgåede `w·h/750`? Probesættet adskiller de to med 25–180
   tokens per række.
2. **Tier** — får `claude-fable-5` de høj-opløsnings-lofter (lang kant
   ≤ 2576 px, ≤ 4784 visuelle tokens)? Rækken `page-old-1928x1928` er
   afgørende: ≈ **4761** målt betyder hi-res WYSIWYG (den gamle store side rummer
   ~3,3× flere tegn per billede end dagens 1568×728, ved samme tegn/token);
   ≈ **1521** betyder standard-tier-resampling, og 1568×728 forbliver korrekt.

Kontekst: sweepet fra 2026-07-01 bag den nuværende 1568×728-side
(læsbarhedsrevision, 2026-07-01) blev målt
på `claude-sonnet-4-5` — en standard-tier-model — mens produktionen sigter mod
Fable 5, som synsdokumentationen placerer i hi-res-tieret. Den revision
målte også den nuværende side til 1460 tokens: tættere på patch-formlens
1456 end på /750's 1522, hvilket antyder, at API'et allerede var flyttet til patch-afregning.

## Kør

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Skal ramme API'et **direkte** — aldrig gennem OmniGlyph-proxyen, som ville
transformere body'en. `count_tokens` er gratis; det fulde sweep laver ~25 forespørgsler.

## Sådan læses outputtet

Per model viser hver probe-række målte billedtokens (med-billede minus
kun-tekst-baseline) mod alle fire forudsigelser (`patch`/`legacy750` ×
`standard`/`highres`); resuméet rangerer hypoteser efter gennemsnitlig absolut afvigelse.
`--probe-multi` tjekker per-billede-loftet (2×1092² ≈ 2×1521); `--probe-20plus`
tjekker >20-billeder-reglen (en side >2000 px skal afvises, ikke resamples).
Rækker lander i `results/*.jsonl`; forudsigelsesmatematikken lever i `formulas.mjs`,
fastlåst af `tests/billing-sweep-formulas.test.ts`.

## Efter dommen

- Patch-formel bekræftet → port OmniGlyph PR #27 (præcis resize-oversættelse) og
  justér `ANTHROPIC_PIXELS_PER_TOKEN`-spærringsmatematikken i `src/core/transform.ts`.
- Hi-res-tier bekræftet på Fable → genindfør en per-tier-sidegeometri
  (1928×1928-klasse sider til Fable/Opus 4.8/Sonnet 5, 1568×728 til standard),
  spejlende hvordan GPT-stien allerede beholder sin egen `GPT_MAX_HEIGHT_PX`.
