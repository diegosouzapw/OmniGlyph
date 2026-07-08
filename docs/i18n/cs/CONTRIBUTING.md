# Přispívání do OmniGlyph

Děkujeme za váš zájem! Tento projekt má dvě nesmlouvavá kulturní pravidla —
jsou důvodem, proč je možné věřit každému číslu v READMEs.

## Pravidlo 1 — Striktní TDD

Veškerý produkční kód se rodí z testu, který nejprve selhal:

1. Napište test a **sledujte, jak selže ze správného důvodu**.
2. Napište minimum potřebné k tomu, aby prošel.
3. Refaktorujte, dokud zůstáváte v zeleném.

Plná laťka je: `pnpm run typecheck && pnpm test && pnpm run build` — všechny
tři vždy (link-lint dokumentace a strážce rebrandingu běží uvnitř `pnpm test`
přes `tests/docs-integrity.test.ts`).

## Pravidlo 2 — Měření před tvrzeními

Žádná změna geometrie, atlasu, billingového vzorce ani rozsahu modelů se
nedostane do repozitáře bez změřeného čísla. Repozitář je postavený na této
disciplíně:

- Náklady na billing → doložte je pomocí `benchmarks/billing-sweep/`
  (`count_tokens` je zdarma; očekávaný reziduál: nula).
- Čitelnost → doložte ji pomocí `benchmarks/density-frontier/` (n≥30 na
  rameno, deterministické skórování, doklady JSONL commitnuté do
  `benchmarks/*/results/`).
- Laťka pro přijetí změny produkčního výchozího nastavení: gist == textová
  základní linie **A ZÁROVEŇ** nula tichých chyb v přesných řetězcích
  **A ZÁROVEŇ** kladné úspory.

Hypotézy bez čísel patří do `docs/ROADMAP.md` jako hypotézy — nikdy do
READMEs jako fakta. Dva „samozřejmé" nápady už byly datem vyvráceny
(vysokorozlišovací stránka, vyhlazený/anti-aliasovaný atlas); proces funguje.

## Nastavení

```bash
pnpm install
pnpm test              # celá sada, ~40–90s
pnpm run dev:node      # lokální proxy ve watch módu
```

Node ≥18 (CI testuje 20/22/24), pnpm 10 (přišpendleno v `packageManager` v
package.json).

## Struktura

| složka | pravidlo |
|---|---|
| `src/core/` | nezávislé na runtime (pouze Web API — běží na Node i Workers) |
| `src/node.ts` / `src/worker.ts` | pouze propojení s hostem |
| `benchmarks/` | opakovatelné harness; výsledky JSONL jsou doklady, commitnuté |
| `docs/` | benchmarks/ (čísla), architecture/ (mapa), ROADMAP (hypotézy), ops/ (OmniRoute) |

## Commity a PR

- Konvenční commity (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), tělo commitu vysvětlující *proč* s relevantními čísly.
- Malé, zaměřené PR; změny chování přicházejí s testem, který je ukotví, a
  případně s benchmarkem, který je zdůvodní.
- Nepřepisujte klientovy bloky `cache_control`, nepřidávejte runtime
  závislosti bez diskuze (jádro je záměrně nenáročné na závislosti), nepoužívejte
  `Math.random`/časová razítka v render cestách (determinismus je tvrdý
  invariant, testovaný bajtovou identitou).
