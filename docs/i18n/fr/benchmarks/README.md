# Benchmarks

Chaque chiffre revendiqué par OmniGlyph provient de l'un des deux harnais
ci-dessous — ré-exécutables, déterministes autant que possible, avec des
preuves brutes par réponse dans `*/results/*.jsonl`. Analyse consolidée :
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — combien coûte réellement une image ?

Sondages `count_tokens` gratuits contre l'API Anthropic en direct, comparant
la formule retirée `w·h/750` face au modèle actuel de patchs de 28 px sur
11 géométries de sondage, 2 modèles × 2 paliers de résolution.

**Résultat (2026-07-05) : le modèle de patchs correspond avec un résidu
ZÉRO sur chaque sondage** — facturé = `⌈w/28⌉ × ⌈h/28⌉` après
redimensionnement par palier, plus une surcharge fixe de +3/+4 tokens par
bloc d'image. La page de production (1568×728) coûte exactement 1 460
tokens et transporte 28 080 caractères ≈ **19,2 caractères/token** contre
~2 caractères/token en texte dense.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — le modèle peut-il vraiment la LIRE ?

Coût (hors ligne, exact) × précision de lecture (en direct) selon les
configurations de rendu, géométries de page, atlas de glyphes et
fournisseurs. Le corpus plante des aiguilles de chaînes exactes
(identifiants hex, camelCase, suites de chiffres) plus des **distracteurs
de quasi-confusion construits à partir des paires de confondabilité de
glyphes mesurées** — de sorte que la confabulation silencieuse soit
détectée, pas seulement comptée comme fausse. La notation est déterministe
(pas de juge LLM) : `correct` / `abstained` (`ILEGIVEL` honnête) /
`silent_wrong` / `no_answer`.

**Résultats principaux** (n=30 par bras) :

| bras | lectures exactes | notes |
|---|---:|---|
| Fable 5 · page standard · atlas 1-bit (production) | **30/30** | zéro erreur, zéro confabulation |
| Fable 5 · page standard · atlas AA (ancien défaut) | 25/30 | 5 abstentions honnêtes — pourquoi la production est passée au 1-bit |
| Fable 5 · page haute résolution 1928² | 1–2/30 | facturée 3,3× mais rééchantillonnée par l'encodeur — le piège de facturation, non activé |
| Opus 4.8 · glyphes 10×16 | 23–26/30 | le mode sûr optionnel |
| GPT-5.5 · bande 768px (les deux atlas) | 0/60 | + ~40× d'inflation de tokens de sortie face à son propre témoin texte (30/30, 62 tok) |
| Gemini 2.5-flash (partiel, quota) | 0/26 | confabule au lieu de s'abstenir |

Trois transports : API directe (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), et `--via-cli` (un abonnement Claude
Code — 0 $). Mise en garde apprise à la dure : les intermédiaires
(OpenRouter, l'outil Read du CLI) rééchantillonnent les grandes images ;
seuls les résultats en API directe font autorité pour la lisibilité.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

Tests unitaires épinglant les parties pures (corpus, notation, formules de
coût) : `tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
