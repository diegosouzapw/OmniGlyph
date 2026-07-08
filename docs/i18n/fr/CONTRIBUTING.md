# Contribuer à OmniGlyph

Merci de votre intérêt ! Ce projet a deux règles de culture non négociables —
c'est la raison pour laquelle chaque chiffre du README peut être considéré
comme fiable.

## Règle 1 — TDD strict

Tout code de production naît d'un test qui a d'abord échoué :

1. Écrivez le test et **regardez-le échouer pour la bonne raison**.
2. Écrivez le minimum pour le faire passer.
3. Refactorisez en restant au vert.

La barre complète est : `pnpm run typecheck && pnpm test && pnpm run build` —
les trois, toujours (le lint des liens de la documentation et le garde-fou de
rebranding s'exécutent à l'intérieur de `pnpm test` via
`tests/docs-integrity.test.ts`).

## Règle 2 — La mesure avant les affirmations

Aucun changement de géométrie, d'atlas, de formule de facturation ou de
périmètre de modèle n'est intégré sans un chiffre mesuré. Le dépôt est
construit autour de cette discipline :

- Coût de facturation → prouvez-le avec `benchmarks/billing-sweep/`
  (`count_tokens` est gratuit ; résidu attendu : zéro).
- Lisibilité → prouvez-la avec `benchmarks/density-frontier/` (n≥30 par bras,
  notation déterministe, preuves JSONL commises dans `benchmarks/*/results/`).
- La barre d'acceptation pour changer une valeur par défaut de production :
  résumé == référence texte **ET** zéro erreur silencieuse de chaîne exacte
  **ET** économies positives.

Les hypothèses sans chiffres vont dans `docs/ROADMAP.md` en tant
qu'hypothèses — jamais dans le README en tant que faits. Deux idées
« évidentes » ont déjà été réfutées par les données (la page haute
résolution, l'atlas anti-crénelé) ; le processus fonctionne.

## Configuration

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18 (CI teste 20/22/24), pnpm 10 (épinglé par `packageManager` dans
package.json).

## Structure

| dossier | règle |
|---|---|
| `src/core/` | agnostique du runtime (API Web uniquement — fonctionne sur Node et Workers) |
| `src/node.ts` / `src/worker.ts` | plomberie d'hôte uniquement |
| `benchmarks/` | harnais ré-exécutables ; les résultats JSONL sont des preuves, commis |
| `docs/` | benchmarks/ (chiffres), architecture/ (carte), ROADMAP (hypothèses), ops/ (OmniRoute) |

## Commits et PR

- Commits conventionnels (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), corps expliquant le *pourquoi* avec les chiffres
  pertinents.
- PR petites et ciblées ; les changements de comportement viennent avec le
  test qui les fixe et, le cas échéant, le benchmark qui les justifie.
- Ne réécrivez pas les blocs `cache_control` du client, n'ajoutez pas de
  dépendances runtime sans discussion (le cœur est volontairement léger en
  dépendances), n'utilisez pas `Math.random`/horodatages dans les chemins de
  rendu (le déterminisme est un invariant strict, testé par identité d'octets).
