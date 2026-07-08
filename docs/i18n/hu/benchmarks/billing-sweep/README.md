# Anthropic vizuális-számlázási sweep

Ingyenes `count_tokens` sweep, amely két nyitott geometriai kérdést dönt el:

1. **Képlet** — az API a `ceil(w/28) × ceil(h/28)` patch-eket számlázza-e
   (jelenlegi dokumentáció), vagy a kivezetett `w·h/750`-et? A próbakészlet
   25–180 token/sor különbséggel választja szét a kettőt.
2. **Szint** — a `claude-fable-5` megkapja-e a nagyfelbontású plafonokat
   (hosszú él ≤ 2576 px, ≤ 4784 vizuális token)? A `page-old-1928x1928`
   sor a döntő: ≈ **4761** mért érték high-res WYSIWYG-et jelent (a régi
   nagy oldal ~3,3×-szal több karaktert hordoz képenként, mint a mai
   1568×728, ugyanakkora karakter/token mellett); ≈ **1521** standard-szintű
   resample-t jelentene, és az 1568×728 marad helyes.

Kontextus: a 2026-07-01-i sweep, amely a jelenlegi 1568×728-as oldal mögött
áll (olvashatósági audit, 2026-07-01), a `claude-sonnet-4-5`-ön lett mérve
— egy standard-szintű modellen —, míg az éles cél a Fable 5, amelyet a
vizuális dokumentáció a high-res szintbe sorol. Az az audit az akkori
oldalt is 1460 tokenre mérte: közelebb a patch-képlet 1456-jához, mint a
/750 1522-höz, ami arra utal, hogy az API már akkor is patch-számlázásra
váltott.

## Futtatás

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Közvetlenül kell az API-t elérnie — soha ne az OmniGlyph proxyn keresztül,
amely átalakítaná a body-t. A `count_tokens` ingyenes; a teljes sweep ~25
kérést tesz.

## A kimenet olvasása

Modellenként minden próba-sor megmutatja a mért kép-tokeneket (a
képpel-mínusz-csak-szöveges alapvonal) mind a négy predikcióval szemben
(`patch`/`legacy750` × `standard`/`highres`); az összefoglaló a hipotéziseket
átlagos abszolút maradék szerint rangsorolja. A `--probe-multi` a
képenkénti plafont ellenőrzi (2×1092² ≈ 2×1521); a `--probe-20plus` a
>20-képes szabályt ellenőrzi (egy >2000 px-es oldalnak elutasítva kell
lennie, nem átméretezve). A sorok a `results/*.jsonl`-be kerülnek; a
predikciós matematika a `formulas.mjs`-ben él, a
`tests/billing-sweep-formulas.test.ts` rögzíti.

## Az ítélet után

- Ha a patch-képlet megerősítést nyer → portolja az OmniGlyph #27-es PR-t
  (pontos átméretezési fordítás), és igazítsa az
  `ANTHROPIC_PIXELS_PER_TOKEN` kapu-matematikát a `src/core/transform.ts`-ben.
- Ha a high-res szint megerősítést nyer a Fable-en → vezessen be
  szintenkénti oldalgeometriát (1928×1928-osztályú oldalak a
  Fable/Opus 4.8/Sonnet 5-hez, 1568×728 a standardhoz), tükrözve, ahogy a
  GPT útvonal már megtartja a saját `GPT_MAX_HEIGHT_PX`-ét.
