# Anthropic visnings-faktureringssveip

🌐 Oversatt: [alle språk](../../../README.md)

**Hvorfor den finnes:** lønnsomhetsporten er kun trygg hvis
kostnadsestimatet er *eksakt*. En formel som bommer litt, ville transformert
blokker som faktisk koster mer. Så denne sveipen fester formelen til
API-ets reelle tall før den lanseres i produksjon — til **null avvik**.

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

Gratis `count_tokens`-sveip som avgjør to åpne geometrispørsmål:

1. **Formel** — fakturerer API-et `ceil(w/28) × ceil(h/28)`-patcher (nåværende
   dokumentasjon) eller den pensjonerte `w·h/750`? Probesettet skiller de to
   med 25–180 tokens per rad.
2. **Nivå** — får `claude-fable-5` høyoppløsningstakene (lang kant
   ≤ 2576 px, ≤ 4784 visuelle tokens)? `page-old-1928x1928`-raden er
   avgjørende: ≈ **4761** målt betyr høyoppløsning WYSIWYG (den gamle store
   siden bærer ~3.3× flere tegn per bilde enn dagens 1568×728, ved samme
   tegn/token); ≈ **1521** betyr standardnivå-resampling, og 1568×728
   forblir korrekt.

Kontekst: sveipen fra 2026-07-01 bak den nåværende 1568×728-siden
(lesbarhetsrevisjon, 2026-07-01) ble målt på
`claude-sonnet-4-5` — en standardnivå-modell — mens produksjon retter seg
mot Fable 5, som visningsdokumentasjonen plasserer i høyoppløsningsnivået.
Den revisjonen målte også den nåværende siden til 1460 tokens: nærmere
patch-formelens 1456 enn /750-ens 1522, noe som antyder at API-et allerede
hadde flyttet til patch-fakturering.

## Kjøring

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Må treffe API-et **direkte** — aldri gjennom OmniGlyph-proxyen, som ville
transformert kroppen. `count_tokens` er gratis; hele sveipen gjør ~25
forespørsler.

## Å lese resultatet

Per modell viser hver proberad målte bildetokens (med-bilde minus
kun-tekst-basislinje) mot alle fire forutsigelser (`patch`/`legacy750` ×
`standard`/`highres`); sammendraget rangerer hypoteser etter gjennomsnittlig
absolutt avvik. `--probe-multi` sjekker per-bilde-taket (2×1092² ≈
2×1521); `--probe-20plus` sjekker >20-bilder-regelen (en side over
2000 px må avvises, ikke resamples). Rader havner i `results/*.jsonl`;
forutsigelsesmatematikken bor i `formulas.mjs`, festet av
`tests/billing-sweep-formulas.test.ts`.

## Etter dommen

- Patch-formel bekreftet → port OmniGlyph PR #27 (eksakt
  størrelsesendrings-oversettelse) og juster
  `ANTHROPIC_PIXELS_PER_TOKEN`-portmatematikken i `src/core/transform.ts`.
- Høyoppløsningsnivå bekreftet på Fable → gjeninnfør en nivåvis
  sidegeometri (1928×1928-klasse sider for Fable/Opus 4.8/Sonnet 5,
  1568×728 for standard), i tråd med hvordan GPT-stien allerede beholder
  sin egen `GPT_MAX_HEIGHT_PX`.
