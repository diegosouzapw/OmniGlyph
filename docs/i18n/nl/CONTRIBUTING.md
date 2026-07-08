# Bijdragen aan OmniGlyph

Bedankt voor uw interesse! Dit project heeft twee niet-onderhandelbare
cultuurregels — zij zijn de reden dat elk cijfer in de README te vertrouwen is.

## Regel 1 — Strikte TDD

Alle productiecode ontstaat uit een test die eerst faalde:

1. Schrijf de test en **zie hem falen om de juiste reden**.
2. Schrijf het minimum om hem te laten slagen.
3. Refactor terwijl alles groen blijft.

De volledige lat is: `pnpm run typecheck && pnpm test && pnpm run build` —
alle drie, altijd (docs link-lint en de rebrand-guard draaien binnen
`pnpm test` via `tests/docs-integrity.test.ts`).

## Regel 2 — Meting vóór beweringen

Geen wijziging aan geometrie, atlas, billing-formule of modelbereik landt
zonder een gemeten cijfer. De repository is rond deze discipline gebouwd:

- Billing-kosten → bewijs het met `benchmarks/billing-sweep/` (`count_tokens`
  is gratis; verwacht residu: nul).
- Leesbaarheid → bewijs het met `benchmarks/density-frontier/` (n≥30 per arm,
  deterministische scoring, JSONL-bewijzen vastgelegd in
  `benchmarks/*/results/`).
- De acceptatielat voor het wijzigen van een productiestandaard:
  gist == tekstbaseline **EN** nul stille exacte-string-fouten **EN**
  positieve besparingen.

Hypothesen zonder cijfers gaan naar `docs/ROADMAP.md` als hypothesen — nooit
naar de README als feiten. Twee "voor de hand liggende" ideeën zijn al met
data weerlegd (de high-res-pagina, de anti-aliased atlas); het proces werkt.

## Opzet

```bash
pnpm install
pnpm test              # volledige testsuite, ~40–90s
pnpm run dev:node      # lokale proxy in watch-modus
```

Node ≥18 (CI test 20/22/24), pnpm 10 (vastgepind via `packageManager` in
package.json).

## Structuur

| map | regel |
|---|---|
| `src/core/` | runtime-agnostisch (alleen Web API's — draait op Node en Workers) |
| `src/node.ts` / `src/worker.ts` | alleen host-plumbing |
| `benchmarks/` | opnieuw uit te voeren harnesses; JSONL-resultaten zijn bewijzen, vastgelegd |
| `docs/` | benchmarks/ (cijfers), architecture/ (kaart), ROADMAP (hypothesen), ops/ (OmniRoute) |

## Commits en PR's

- Conventionele commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), body die het *waarom* uitlegt met de relevante cijfers.
- Kleine, gerichte PR's; gedragswijzigingen komen met de test die ze vastpint
  en, waar van toepassing, de benchmark die ze rechtvaardigt.
- Herschrijf geen client `cache_control`-blokken, voeg geen
  runtime-afhankelijkheden toe zonder overleg (de core is bewust
  dependency-light), gebruik geen `Math.random`/tijdstempels in renderpaden
  (determinisme is een harde invariant, getest via byte-identiteit).
