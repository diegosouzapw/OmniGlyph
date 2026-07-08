# Anthropic vision-billing sweep

🌐 Traduit : [toutes les langues](../../../README.md)

**Pourquoi il existe :** le portail de rentabilité n'est sûr que si
l'estimation de coût est *exacte*. Une formule légèrement décalée
convertirait des blocs qui coûtent en réalité plus cher. Ce sondage épingle
donc la formule aux chiffres réels de l'API avant sa mise en production —
jusqu'à un **résidu zéro**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Sondage `count_tokens` gratuit qui tranche deux questions ouvertes de
géométrie :

1. **Formule** — l'API facture-t-elle des patchs `ceil(w/28) × ceil(h/28)`
   (documentation actuelle) ou l'ancien `w·h/750` retiré ? L'ensemble de
   sondages sépare les deux de 25 à 180 tokens par ligne.
2. **Palier** — `claude-fable-5` obtient-il les plafonds haute résolution
   (grand côté ≤ 2576 px, ≤ 4784 tokens visuels) ? La ligne
   `page-old-1928x1928` est décisive : ≈ **4761** mesuré signifie WYSIWYG
   haute résolution (l'ancienne grande page transporte ~3.3× plus de
   caractères par image qu'aujourd'hui avec 1568×728, au même ratio
   caractères/token) ; ≈ **1521** signifie rééchantillonnage de palier
   standard, et 1568×728 reste correct.

Contexte : le sondage du 2026-07-01 derrière la page actuelle 1568×728
(audit de lisibilité, 2026-07-01) a été mesuré sur `claude-sonnet-4-5` — un
modèle de palier standard — alors que la production cible Fable 5, que la
documentation vision place dans le palier haute résolution. Cet audit avait
aussi mesuré la page actuelle à 1460 tokens : plus proche des 1456 de la
formule de patchs que des 1522 de /750, laissant penser que l'API était déjà
passée à la facturation par patchs.

## Exécution

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Doit interroger l'API **directement** — jamais via le proxy OmniGlyph, qui
transformerait le corps. `count_tokens` est gratuit ; le sondage complet
effectue ~25 requêtes.

## Lire la sortie

Par modèle, chaque ligne de sondage montre les tokens d'image mesurés
(avec-image moins la référence texte seul) face aux quatre prédictions
(`patch`/`legacy750` × `standard`/`highres`) ; le résumé classe les
hypothèses par résidu absolu moyen. `--probe-multi` vérifie le plafond par
image (2×1092² ≈ 2×1521) ; `--probe-20plus` vérifie la règle des
>20 images (un côté >2000 px doit être rejeté, pas rééchantillonné). Les
lignes atterrissent dans `results/*.jsonl` ; les mathématiques de
prédiction vivent dans `formulas.mjs`, épinglées par
`tests/billing-sweep-formulas.test.ts`.

## Après le verdict

- Formule de patchs confirmée → porter la PR OmniGlyph #27 (traduction de
  redimensionnement exacte) et aligner les mathématiques de portail
  `ANTHROPIC_PIXELS_PER_TOKEN` dans `src/core/transform.ts`.
- Palier haute résolution confirmé sur Fable → réintroduire une géométrie
  de page par palier (pages de classe 1928×1928 pour Fable/Opus 4.8/Sonnet 5,
  1568×728 pour standard), à l'image de la façon dont le chemin GPT
  conserve déjà son propre `GPT_MAX_HEIGHT_PX`.
