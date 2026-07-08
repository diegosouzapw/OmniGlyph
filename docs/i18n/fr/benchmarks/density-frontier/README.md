# density-frontier — coût × précision par résolution

Harnais qui mesure la **frontière de Pareto entre coût et lisibilité** des
rendus texte→image, par fournisseur (Anthropic / OpenAI / Gemini),
géométrie de page, cellule de glyphe et style d'atlas.

L'asymétrie centrale : depuis le sondage de facturation (2026-07-05,
`benchmarks/billing-sweep/`), **le coût est exactement prévisible hors
ligne** — patchs de 28 px + 4/bloc sur Anthropic
(`src/core/anthropic-vision.ts`), profils patch/tuile sur OpenAI
(`src/core/openai.ts`), tuiles/media_resolution sur Gemini
(`gemini-cost.ts`). Seule la **précision de lecture** nécessite l'API.

## Conception

- **Corpus** (`corpus.ts`) : remplissage dense de type log/JSON + aiguilles
  plantées issues des classes que la matrice de confondabilité identifie
  comme échouant (hex 12 caractères, camelCase, chiffres 6/8/5/3) +
  **distracteurs de quasi-confusion** construits à partir des paires
  confondables mesurées. Si le modèle répond avec le distracteur, la
  confusion était *prédite* — c'est le mode d'échec silencieux détecté, pas
  simplement compté comme faux. Déterministe (mulberry32).
- **Configs** (`configs.ts`) : grille organisée — pages standard 1568×728
  vs haute résolution 1928×1928 (l'A/B qui tranche la géométrie par
  palier), AA vs 1-bit (résout la contradiction du rendu dense), cellule
  7×10/10×16 (mode sûr Opus), bande GPT, et les deux paris Gemini
  (≤384² = 258 fixe ; `media_resolution: low` = 280 fixe →
  ~116 caractères/token *si* lisible).
- **Score** (`score.ts`) : correspondance exacte déterministe, pas de
  juge-LLM. Trois résultats : `correct` / `abstained` (sentinelle
  ILEGIVEL — échec honnête) / `silent_wrong` (le mode dangereux), avec un
  indicateur de distracteur.

## Exécution

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Configs spécifiques : `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Les réponses atterrissent dans `results/*.jsonl` (une ligne par question,
avec la réponse brute pour audit).

## Barre d'acceptation (héritée des PR amont #35/#36)

Une configuration ne devient un défaut de production que si : **résumé ==
référence texte** ET **zéro chaîne exacte silencieusement fausse** ET
**économies positives**. La première exécution obligatoire est
`anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa` sur Fable — le contrôle
ponctuel de lisibilité de la grande page avant d'activer le palier haute
résolution.

## `--via-omniroute` — de bout en bout via OmniRoute (P3 : preuve de non-dégradation)

Les transports ci-dessus rendent texte→PNG **dans le harnais** et envoient
les images. `--via-omniroute` fait l'inverse, ce qui est le chemin de
production : il envoie le **texte dense** à une instance OmniRoute en
cours d'exécution, laisse le **moteur `omniglyph` rendre** les pages et les
transmettre à Anthropic, et mesure les lectures + les économies. Si les
lectures restent identiques à la route directe **et** qu'OmniRoute signale
une compression, il est prouvé que le rendu+transfert d'OmniRoute **ne
dégrade pas** les pages.

Prérequis (opérationnels) :

1. **OmniRoute en cours d'exécution** (`npm run dev`, par défaut
   `http://localhost:20128`).
2. Un **fournisseur Anthropic** configuré dans OmniRoute avec une **clé
   réelle** (route directe — le portail
   `providerTransport==='direct'` ne passe que pour le fournisseur
   `anthropic`).
3. Le **moteur `omniglyph` ACTIVÉ** dans la configuration de compression
   d'OmniRoute (`config.engines.omniglyph.enabled = true`) — l'en-tête
   `engine:omniglyph` ne se déclenche qu'avec le moteur activé. (Le moteur
   est `stable:false`/preview ; l'activer explicitement.)
4. Une **clé API OmniRoute** dans `OMNIROUTE_API_KEY` (celle que le client
   utilise pour s'authentifier auprès d'OmniRoute, pas celle d'Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Chaque réponse enregistre
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(depuis l'en-tête de réponse `X-OmniRoute-Compression`) dans le JSONL ; la
ligne du tableau indique combien de réponses sont revenues compressées + la
médiane des économies. **Barre P3** : mêmes lectures verbatim/résumé que la
route directe (non-dégradation) **avec** un `omnirouteSavings` non nul
(prouvant qu'un rendu a eu lieu, pas une lecture de texte brut). Si
`did NOT compress` apparaît, le moteur n'est pas activé dans OmniRoute (ou
le corps n'a pas passé les portails fail-closed).

Tests pour les parties pures : `tests/density-frontier.test.ts` (inclut
`buildOmnirouteRequest` et `parseCompressionSavings` du transport
via-omniroute).
