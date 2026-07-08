# Contribuire a OmniGlyph

Grazie per il tuo interesse! Questo progetto ha due regole di cultura non
negoziabili — sono il motivo per cui ogni numero nel README può essere
considerato affidabile.

## Regola 1 — TDD rigoroso

Tutto il codice di produzione nasce da un test che è fallito per primo:

1. Scrivi il test e **guardalo fallire per il motivo giusto**.
2. Scrivi il minimo necessario per farlo passare.
3. Rifattorizza mantenendo il verde.

La barra completa è: `pnpm run typecheck && pnpm test && pnpm run build` —
tutti e tre, sempre (il link-lint della documentazione e il rebrand guard
girano dentro `pnpm test` tramite `tests/docs-integrity.test.ts`).

## Regola 2 — Misurazione prima delle affermazioni

Nessuna modifica alla geometria, all'atlas, alla formula di fatturazione o
all'ambito dei modelli viene accettata senza un numero misurato. Il
repository è costruito attorno a questa disciplina:

- Costo di fatturazione → dimostralo con `benchmarks/billing-sweep/`
  (`count_tokens` è gratuito; residuo atteso: zero).
- Leggibilità → dimostrala con `benchmarks/density-frontier/` (n≥30 per
  braccio, valutazione deterministica, riscontri JSONL versionati in
  `benchmarks/*/results/`).
- La soglia di accettazione per cambiare un default di produzione: gist ==
  baseline testuale **E** zero errori silenziosi su stringhe esatte **E**
  risparmio positivo.

Le ipotesi senza numeri vanno in `docs/ROADMAP.md` come ipotesi — mai nel
README come fatti. Due idee "ovvie" sono già state confutate con dati (la
pagina ad alta risoluzione, l'atlas con anti-aliasing); il processo
funziona.

## Setup

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI testa 20/22/24), pnpm 10 (fissato da `packageManager` in
package.json).

## Struttura

| cartella | regola |
|---|---|
| `src/core/` | agnostico rispetto al runtime (solo Web API — gira su Node e Workers) |
| `src/node.ts` / `src/worker.ts` | solo integrazione dell'host |
| `benchmarks/` | banchi di prova rieseguibili; i risultati JSONL sono riscontri, versionati |
| `docs/` | benchmarks/ (numeri), architecture/ (mappa), ROADMAP (ipotesi), ops/ (OmniRoute) |

## Commit e PR

- Commit convenzionali (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), corpo che spiega il *perché* con i numeri rilevanti.
- PR piccole e mirate; i cambiamenti di comportamento arrivano con il test
  che li fissa e, se applicabile, il benchmark che li giustifica.
- Non riscrivere i blocchi `cache_control` del client, non aggiungere
  dipendenze runtime senza discussione (il core è intenzionalmente povero
  di dipendenze), non usare `Math.random`/timestamp nei percorsi di render
  (il determinismo è un invariante rigido, testato per identità byte).
