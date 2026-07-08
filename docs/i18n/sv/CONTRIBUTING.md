# Bidra till OmniGlyph

Tack för ditt intresse! Det här projektet har två icke-förhandlingsbara
kulturregler — de är anledningen till att varje siffra i README:n går att
lita på.

## Regel 1 — Strikt TDD

All produktionskod föds från ett test som misslyckades först:

1. Skriv testet och **se det misslyckas av rätt anledning**.
2. Skriv minimum för att få det att passera.
3. Refaktorera medan det förblir grönt.

Den fullständiga ribban är: `pnpm run typecheck && pnpm test && pnpm run build`
— alla tre, alltid (dokumentationens länklint och varumärkesskyddet körs
inuti `pnpm test` via `tests/docs-integrity.test.ts`).

## Regel 2 — Mätning före påståenden

Ingen ändring av geometri, atlas, faktureringsformel eller modellomfång
landar utan en mätt siffra. Repot är byggt kring denna disciplin:

- Faktureringskostnad → bevisa det med `benchmarks/billing-sweep/`
  (`count_tokens` är gratis; förväntad residual: noll).
- Läsbarhet → bevisa det med `benchmarks/density-frontier/` (n≥30 per arm,
  deterministisk poängsättning, JSONL-belägg incheckade i
  `benchmarks/*/results/`).
- Godkännandegränsen för att ändra ett produktionsstandardvärde: gist ==
  textbaslinje **OCH** noll tysta exakt-sträng-fel **OCH** positiva
  besparingar.

Hypoteser utan siffror går till `docs/ROADMAP.md` som hypoteser — aldrig in
i README:n som fakta. Två "uppenbara" idéer har redan vederlagts med data
(den högupplösta sidan, den kantutjämnade atlasen); processen fungerar.

## Uppsättning

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI testar 20/22/24), pnpm 10 (fastpinnad av `packageManager` i
package.json).

## Struktur

| mapp | regel |
|---|---|
| `src/core/` | körmiljöoberoende (endast webb-API:er — körs på Node och Workers) |
| `src/node.ts` / `src/worker.ts` | endast värdinstallation |
| `benchmarks/` | körbara ramverk igen; JSONL-resultat är belägg, incheckade |
| `docs/` | benchmarks/ (siffror), architecture/ (karta), ROADMAP (hypoteser), ops/ (OmniRoute) |

## Commits och PR:ar

- Konventionella commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), meddelandekropp som förklarar *varför* med relevanta
  siffror.
- Små, fokuserade PR:ar; beteendeändringar kommer med testet som fäster dem
  och, när tillämpligt, benchmarken som motiverar dem.
- Skriv inte om klientens `cache_control`-block, lägg inte till
  körtidsberoenden utan diskussion (kärnan är beroendelätt med avsikt),
  använd inte `Math.random`/tidsstämplar i renderingsvägar (determinism är
  en hård invariant, testad genom byte-identitet).
