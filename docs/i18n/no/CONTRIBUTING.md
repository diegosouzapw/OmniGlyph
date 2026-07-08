# Bidra til OmniGlyph

Takk for interessen din! Dette prosjektet har to ufravikelige kulturregler —
de er grunnen til at hvert tall i README-en kan stoles på.

## Regel 1 — Streng TDD

All produksjonskode fødes fra en test som feilet først:

1. Skriv testen og **se den feile av riktig grunn**.
2. Skriv det minimale som får den til å bestå.
3. Refaktorer mens den forblir grønn.

Den fulle terskelen er: `pnpm run typecheck && pnpm test && pnpm run build`
— alle tre, alltid (dokumentasjonslenke-lint og rebrand-vakten kjører inne i
`pnpm test` via `tests/docs-integrity.test.ts`).

## Regel 2 — Måling før påstander

Ingen endring i geometri, atlas, faktureringsformel eller modellomfang
lander uten et målt tall. Repoet er bygget rundt denne disiplinen:

- Faktureringskostnad → bevis det med `benchmarks/billing-sweep/`
  (`count_tokens` er gratis; forventet avvik: null).
- Lesbarhet → bevis det med `benchmarks/density-frontier/` (n≥30 per arm,
  deterministisk scoring, JSONL-kvitteringer forpliktet til
  `benchmarks/*/results/`).
- Aksepterterskelen for å endre en produksjonsstandard: resultat == tekst-
  baseline **OG** null stille eksakt-streng-feil **OG** positive besparelser.

Hypoteser uten tall går til `docs/ROADMAP.md` som hypoteser — aldri inn i
README-en som fakta. To "opplagte" idéer er allerede tilbakevist med data
(høyoppløsningssiden, det kantutjevnede atlaset); prosessen fungerer.

## Oppsett

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI tester 20/22/24), pnpm 10 (låst av `packageManager` i
package.json).

## Struktur

| mappe | regel |
|---|---|
| `src/core/` | kjøretidsagnostisk (kun Web APIs — kjører på Node og Workers) |
| `src/node.ts` / `src/worker.ts` | kun vert-rørlegging |
| `benchmarks/` | kjørbare rigger på nytt; JSONL-resultater er kvitteringer, forpliktet |
| `docs/` | benchmarks/ (tall), architecture/ (kart), ROADMAP (hypoteser), ops/ (OmniRoute) |

## Commits og PR-er

- Konvensjonelle commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), brødtekst som forklarer *hvorfor* med de relevante
  tallene.
- Små, fokuserte PR-er; atferdsendringer kommer med testen som fester dem
  og, når det er relevant, benchmarken som rettferdiggjør dem.
- Ikke skriv om klientens `cache_control`-blokker, ikke legg til
  kjøretidsavhengigheter uten diskusjon (kjernen er bevisst avhengighets-
  lett), ikke bruk `Math.random`/tidsstempler i rendringsstier
  (determinisme er en hard invariant, testet med byte-identitet).
