# Közreműködés az OmniGlyph-hoz

Köszönjük az érdeklődését! Ennek a projektnek két nem alkuképes kultúraszabálya
van — ezek miatt bízható meg a README-ben szereplő minden szám.

## 1. szabály — Szigorú TDD

Minden éles kód egy előbb elbukott tesztből születik:

1. Írja meg a tesztet, és **nézze meg, hogy a helyes okból bukik el**.
2. Írja meg a minimumot, ami átmegy rajta.
3. Refaktoráljon, miközben zöld marad.

A teljes mérce: `pnpm run typecheck && pnpm test && pnpm run build` —
mindhárom, mindig (a docs link-lint és a rebrand-guard a `pnpm test`-en belül
fut, a `tests/docs-integrity.test.ts`-en keresztül).

## 2. szabály — Mérés az állítás előtt

A geometrián, az atlaszon, a számlázási képleten vagy a modell hatókörén
semmilyen változtatás nem kerül be mért szám nélkül. A repository e fegyelem
köré épül:

- Számlázási költség → bizonyítsa a `benchmarks/billing-sweep/`-vel (a
  `count_tokens` ingyenes; várt maradék: nulla).
- Olvashatóság → bizonyítsa a `benchmarks/density-frontier/`-rel (n≥30
  karonként, determinisztikus pontozás, JSONL-bizonyítékok a
  `benchmarks/*/results/`-ba commitolva).
- Az elfogadási mérce egy éles alapérték megváltoztatásához: a lényeg
  megegyezik a szöveges alapvonallal **ÉS** nulla néma pontos-string hiba
  **ÉS** pozitív megtakarítás.

A számok nélküli hipotézisek a `docs/ROADMAP.md`-be kerülnek hipotézisként —
soha nem a README-be tényként. Két "nyilvánvaló" ötletet már megcáfoltak az
adatok (a nagyfelbontású oldal, az élsimított atlasz); a folyamat működik.

## Beállítás

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (a CI 20/22/24-et tesztel), pnpm 10 (rögzítve a `packageManager`
mezőben a package.json-ban).

## Struktúra

| mappa | szabály |
|---|---|
| `src/core/` | futtatókörnyezet-agnosztikus (csak Web API-k — Node-on és Workers-en is fut) |
| `src/node.ts` / `src/worker.ts` | csak host-bekötés |
| `benchmarks/` | újrafuttatható harness-ek; a JSONL eredmények bizonyítékok, commitolva |
| `docs/` | benchmarks/ (számok), architecture/ (térkép), ROADMAP (hipotézisek), ops/ (OmniRoute) |

## Commit-ok és PR-ek

- Konvencionális commit-ok (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), a törzsben a *miértet* magyarázva a releváns számokkal.
- Kicsi, fókuszált PR-ek; a viselkedésváltozásokat a rögzítő teszt kíséri, és
  ha releváns, a benchmark, amely indokolja őket.
- Ne írja át a kliens `cache_control` blokkjait, ne adjon hozzá futásidejű
  függőséget egyeztetés nélkül (a mag szándékosan függőség-szegény), ne
  használjon `Math.random`-ot/időbélyeget renderelési útvonalakon (a
  determinizmus kemény invariáns, byte-azonossággal tesztelve).
