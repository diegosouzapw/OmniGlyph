# Contribuție la OmniGlyph

Mulțumim pentru interesul dumneavoastră! Acest proiect are două reguli de
cultură nenegociabile — ele sunt motivul pentru care fiecare cifră din README
poate fi de încredere.

## Regula 1 — TDD strict

Tot codul de producție se naște dintr-un test care a eșuat mai întâi:

1. Scrieți testul și **priviți-l eșuând din motivul corect**.
2. Scrieți minimul necesar pentru a-l face să treacă.
3. Refactorizați rămânând verde.

Bara completă este: `pnpm run typecheck && pnpm test && pnpm run build` —
toate trei, întotdeauna (link-lint-ul docs și guard-ul de rebrand rulează
în interiorul `pnpm test` prin `tests/docs-integrity.test.ts`).

## Regula 2 — Măsurare înainte de afirmații

Nicio schimbare de geometrie, atlas, formulă de facturare sau scop de model
nu ajunge fără o cifră măsurată. Repository-ul este construit în jurul
acestei discipline:

- Costul de facturare → demonstrați-l cu `benchmarks/billing-sweep/`
  (`count_tokens` este gratuit; reziduu așteptat: zero).
- Lizibilitatea → demonstrați-o cu `benchmarks/density-frontier/` (n≥30 per
  braț, punctaj determinist, dovezi JSONL comise în `benchmarks/*/results/`).
- Bara de acceptare pentru schimbarea unui default de producție: gist ==
  baseline de text **ȘI** zero erori exacte de string silențioase **ȘI**
  economii pozitive.

Ipotezele fără cifre merg în `docs/ROADMAP.md` ca ipoteze — niciodată în
README ca fapte. Două idei "evidente" au fost deja infirmate cu date
(pagina de rezoluție înaltă, atlasul cu anti-aliasing); procesul funcționează.

## Configurare

```bash
pnpm install
pnpm test              # suita completă, ~40–90s
pnpm run dev:node      # proxy local în modul watch
```

Node ≥18 (CI testează 20/22/24), pnpm 10 (fixat prin `packageManager` în
package.json).

## Structură

| folder | regulă |
|---|---|
| `src/core/` | agnostic de runtime (doar Web APIs — rulează pe Node și Workers) |
| `src/node.ts` / `src/worker.ts` | doar plumbing de host |
| `benchmarks/` | harness-uri re-executabile; rezultatele JSONL sunt dovezi, comise |
| `docs/` | benchmarks/ (cifre), architecture/ (hartă), ROADMAP (ipoteze), ops/ (OmniRoute) |

## Commit-uri și PR-uri

- Commit-uri convenționale (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), corp explicând *de ce* cu cifrele relevante.
- PR-uri mici și focalizate; schimbările de comportament vin cu testul care
  le fixează și, dacă e cazul, benchmark-ul care le justifică.
- Nu rescrieți blocurile `cache_control` ale clientului, nu adăugați
  dependențe runtime fără discuție (core-ul este intenționat light pe
  dependențe), nu folosiți `Math.random`/timestamp-uri în căile de randare
  (determinismul este un invariant dur, testat prin identitate de byte-uri).
