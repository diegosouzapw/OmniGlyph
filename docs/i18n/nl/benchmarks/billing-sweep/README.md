# Anthropic vision-billing sweep

Gratis `count_tokens`-sweep die twee open geometrievragen beslecht:

1. **Formule** — factureert de API `ceil(w/28) × ceil(h/28)` patches
   (huidige documentatie) of het uitgefaseerde `w·h/750`? De probe-set
   scheidt de twee met 25–180 tokens per rij.
2. **Tier** — krijgt `claude-fable-5` de high-resolution-caps (lange rand
   ≤ 2576 px, ≤ 4784 visuele tokens)? De `page-old-1928x1928`-rij is de
   beslisser: ≈ **4761** gemeten betekent high-res WYSIWYG (de oude grote
   pagina bevat ~3,3× meer tekens per afbeelding dan de huidige 1568×728,
   bij dezelfde tekens/token); ≈ **1521** betekent resample naar
   standaardtier, en 1568×728 blijft correct.

Context: de sweep van 2026-07-01 achter de huidige 1568×728-pagina
(leesbaarheidsaudit, 2026-07-01) werd gemeten op `claude-sonnet-4-5` — een
standaard-tier-model — terwijl productie Fable 5 doelt, dat de vision-
documentatie in de high-resolution-tier plaatst. Die audit mat ook de
huidige pagina op 1460 tokens: dichter bij de 1456 van de patchformule dan
bij de 1522 van /750, wat suggereert dat de API al was overgestapt op
patch-billing.

## Uitvoeren

```bash
pnpm run build                              # dist/-vereiste (zoals alle evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # alleen voorspellingen, geen sleutel, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Moet **rechtstreeks** de API raken — nooit via de OmniGlyph-proxy, die de
body zou transformeren. `count_tokens` is gratis; de volledige sweep doet
~25 verzoeken.

## De uitvoer lezen

Per model toont elke probe-rij gemeten image-tokens (met-afbeelding minus
alleen-tekst-baseline) tegenover alle vier de voorspellingen
(`patch`/`legacy750` × `standard`/`highres`); de samenvatting rangschikt
hypothesen op gemiddeld absoluut residu. `--probe-multi` controleert de cap
per afbeelding (2×1092² ≈ 2×1521); `--probe-20plus` controleert de
>20-afbeeldingen-regel (een zijde >2000 px moet worden afgewezen, niet
geresampled). Rijen komen terecht in `results/*.jsonl`; de
voorspellingswiskunde staat in `formulas.mjs`, vastgepind door
`tests/billing-sweep-formulas.test.ts`.

## Na het oordeel

- Patchformule bevestigd → port OmniGlyph PR #27 (exacte resize-vertaling)
  en lijn de `ANTHROPIC_PIXELS_PER_TOKEN`-poortwiskunde in
  `src/core/transform.ts` uit.
- High-res-tier bevestigd op Fable → herintroduceer een paginageometrie per
  tier (1928×1928-klasse pagina's voor Fable/Opus 4.8/Sonnet 5, 1568×728
  voor standaard), naar analogie van hoe het GPT-pad al zijn eigen
  `GPT_MAX_HEIGHT_PX` aanhoudt.
