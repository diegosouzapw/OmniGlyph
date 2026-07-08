# Anthropic vision-faktureringsgenomgång

Gratis `count_tokens`-genomgång som avgör två öppna geometrifrågor:

1. **Formel** — fakturerar API:et `ceil(w/28) × ceil(h/28)`-patchar (aktuell
   dokumentation) eller den pensionerade `w·h/750`? Probsamlingen skiljer de
   två åt med 25–180 tokens per rad.
2. **Nivå** — får `claude-fable-5` de högupplösta taken (lång kant
   ≤ 2576 px, ≤ 4784 visuella tokens)? Raden `page-old-1928x1928` är
   avgörandet: ≈ **4761** uppmätt betyder high-res WYSIWYG (den gamla stora
   sidan rymmer ~3,3× fler tecken per bild än dagens 1568×728, till samma
   tecken/token); ≈ **1521** betyder resampling på standardnivå, och
   1568×728 förblir korrekt.

Kontext: genomgången från 2026-07-01 bakom den nuvarande 1568×728-sidan
(läsbarhetsgranskning, 2026-07-01) mättes på `claude-sonnet-4-5` — en
standardnivåmodell — medan produktionen riktar sig mot Fable 5, som
vision-dokumentationen placerar i den högupplösta nivån. Den granskningen
mätte också den aktuella sidan till 1460 tokens: närmare patch-formelns
1456 än /750:s 1522, vilket antyder att API:et redan hade övergått till
patch-fakturering.

## Kör

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Måste träffa API:et **direkt** — aldrig genom OmniGlyph-proxyn, som skulle
transformera kroppen. `count_tokens` är gratis; hela genomgången gör
~25 förfrågningar.

## Läsa utdatan

Per modell visar varje probrad uppmätta bild-tokens (med-bild minus
ren-text-baslinje) mot alla fyra förutsägelser (`patch`/`legacy750` ×
`standard`/`highres`); sammanfattningen rangordnar hypoteser efter
genomsnittlig absolut residual. `--probe-multi` kontrollerar taket per bild
(2×1092² ≈ 2×1521); `--probe-20plus` kontrollerar >20-bilder-regeln (en
sida över 2000 px måste avvisas, inte resamplas). Rader hamnar i
`results/*.jsonl`; förutsägelsematematiken finns i `formulas.mjs`, fäst av
`tests/billing-sweep-formulas.test.ts`.

## Efter avgörandet

- Patch-formeln bekräftad → porta OmniGlyph PR #27 (exakt
  förminskningsöversättning) och anpassa `ANTHROPIC_PIXELS_PER_TOKEN`
  -spärrmatematiken i `src/core/transform.ts`.
- Högupplöst nivå bekräftad på Fable → återinför en per-nivå-sidgeometri
  (1928×1928-klass-sidor för Fable/Opus 4.8/Sonnet 5, 1568×728 för
  standard), i linje med hur GPT-vägen redan behåller sin egen
  `GPT_MAX_HEIGHT_PX`.
