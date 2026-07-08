# Bidrag til OmniGlyph

Tak for din interesse! Dette projekt har to ikke-til-forhandling kulturregler —
de er grunden til, at hvert tal i README'en kan stoles på.

## Regel 1 — Striks TDD

Al produktionskode fødes af en test, der først fejlede:

1. Skriv testen og **se den fejle af den rette årsag**.
2. Skriv det mindste, der får den til at bestå.
3. Refaktorér, mens den forbliver grøn.

Den fulde bar er: `pnpm run typecheck && pnpm test && pnpm run build` — alle
tre, altid (docs-link-lint og rebrand-spærringen kører inde i `pnpm test`
via `tests/docs-integrity.test.ts`).

## Regel 2 — Måling før påstande

Ingen ændring til geometri, atlas, afregningsformel eller modelomfang lander uden et
målt tal. Repositoriet er bygget op omkring denne disciplin:

- Afregningsomkostning → bevis det med `benchmarks/billing-sweep/` (`count_tokens` er
  gratis; forventet afvigelse: nul).
- Læsbarhed → bevis det med `benchmarks/density-frontier/` (n≥30 per arm,
  deterministisk scoring, JSONL-dokumentation committed til `benchmarks/*/results/`).
- Accept-baren for at ændre en produktionsstandard: resultat == tekstbaseline
  **OG** nul stille eksakt-streng-fejl **OG** positive besparelser.

Hypoteser uden tal går til `docs/ROADMAP.md` som hypoteser — aldrig ind i
README'en som fakta. To "indlysende" idéer er allerede blevet afkræftet med data
(siden med høj opløsning, det anti-aliaserede atlas); processen virker.

## Opsætning

```bash
pnpm install
pnpm test              # fuld suite, ~40–90s
pnpm run dev:node      # lokal proxy i watch-tilstand
```

Node ≥18 (CI tester 20/22/24), pnpm 10 (fastlåst af `packageManager` i
package.json).

## Struktur

| mappe | regel |
|---|---|
| `src/core/` | runtime-agnostisk (kun Web-API'er — kører på Node og Workers) |
| `src/node.ts` / `src/worker.ts` | kun host-VVS |
| `benchmarks/` | genkørbare rammeværker; JSONL-resultater er dokumentation, committed |
| `docs/` | benchmarks/ (tal), architecture/ (kort), ROADMAP (hypoteser), ops/ (OmniRoute) |

## Commits og PR'er

- Konventionelle commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), body der forklarer *hvorfor* med de relevante tal.
- Små, fokuserede PR'er; adfærdsændringer kommer med testen, der fastlåser dem, og,
  hvor relevant, benchmarken, der begrunder dem.
- Omskriv ikke klientens `cache_control`-blokke, tilføj ikke runtime-afhængigheder
  uden diskussion (kernen er bevidst holdt afhængighedslet), brug ikke
  `Math.random`/tidsstempler i renderingsstier (determinisme er en hård invariant,
  testet ved byte-identitet).
