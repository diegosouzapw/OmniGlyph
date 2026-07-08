# Prispievanie do OmniGlyph

Ďakujeme za váš záujem! Tento projekt má dve nepodmienené kultúrne pravidlá —
sú dôvodom, prečo je možné dôverovať každému číslu v README.

## Pravidlo 1 — Striktné TDD

Všetok produkčný kód sa rodí z testu, ktorý zlyhal ako prvý:

1. Napíšte test a **sledujte, ako zlyhá zo správneho dôvodu**.
2. Napíšte minimum na to, aby prešiel.
3. Refaktorujte a zostaňte pritom zelení.

Kompletná lišta je: `pnpm run typecheck && pnpm test && pnpm run build` —
všetky tri, vždy (link-lint dokumentácie a stráž rebrandingu bežia vnútri
`pnpm test` cez `tests/docs-integrity.test.ts`).

## Pravidlo 2 — Meranie pred tvrdeniami

Žiadna zmena geometrie, atlasu, účtovacieho vzorca alebo rozsahu modelov sa
nedostane do repozitára bez nameraného čísla. Repozitár je postavený na tejto
disciplíne:

- Náklady na účtovanie → dokážte to pomocou `benchmarks/billing-sweep/`
  (`count_tokens` je zadarmo; očakávané rezíduum: nula).
- Čitateľnosť → dokážte to pomocou `benchmarks/density-frontier/` (n≥30 na
  skupinu, deterministické hodnotenie, JSONL dôkazy uložené v
  `benchmarks/*/results/`).
- Prijímacia hranica pre zmenu produkčného predvoleného nastavenia: gist ==
  textová základná línia **A** nulové tiché chyby v presných reťazcoch **A**
  kladné úspory.

Hypotézy bez čísel idú do `docs/ROADMAP.md` ako hypotézy — nikdy do README
ako fakty. Dva „zrejmé" nápady už boli vyvrátené dátami (vysokorozlišovacia
stránka, anti-aliasovaný atlas); proces funguje.

## Nastavenie

```bash
pnpm install
pnpm test              # celá sada, ~40–90s
pnpm run dev:node      # lokálny proxy v watch móde
```

Node ≥18 (CI testuje 20/22/24), pnpm 10 (pripnuté v `packageManager` v
package.json).

## Štruktúra

| priečinok | pravidlo |
|---|---|
| `src/core/` | nezávislé od runtime (iba Web API — beží na Node aj Workers) |
| `src/node.ts` / `src/worker.ts` | iba hostiteľská prepojka |
| `benchmarks/` | opätovne spustiteľné harnessy; JSONL výsledky sú dôkazy, uložené |
| `docs/` | benchmarks/ (čísla), architecture/ (mapa), ROADMAP (hypotézy), ops/ (OmniRoute) |

## Commity a PR

- Konvenčné commity (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), telo vysvetľujúce *prečo* s relevantnými číslami.
- Malé, cielené PR; zmeny správania prichádzajú s testom, ktorý ich pripína,
  a kde je to relevantné, s benchmarkom, ktorý ich odôvodňuje.
- Neprepisujte klientske bloky `cache_control`, nepridávajte runtime závislosti
  bez diskusie (jadro je zámerne nenáročné na závislosti), nepoužívajte
  `Math.random`/časové pečiatky v render cestách (determinizmus je tvrdý
  invariant, testovaný identitou bajtov).
