# Benchmarks

🌐 Traduit : [toutes les langues](../../README.md)

Chaque chiffre revendiqué par OmniGlyph provient de l'un des deux harnais
ci-dessous — ré-exécutables, déterministes autant que possible, avec des
preuves brutes par réponse dans `*/results/*.jsonl`. Analyse consolidée :
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## Comment fonctionnent les économies (en une image)

Les fournisseurs facturent le **texte au token**, mais facturent une
**image selon ses dimensions** — pas selon la quantité de texte qu'elle
contient. Une page standard a un coût fixe, quelle que soit la densité du
texte :

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

Le même contexte, facturé de deux façons :

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

Pourquoi l'image l'emporte — caractères transportés par token :

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph ne fait cet échange que lorsque le calcul exact indique qu'il est
gagnant, et uniquement pour les modèles dont il est prouvé qu'ils lisent la
page. Les deux harnais ci-dessous prouvent chaque moitié.

## 1. `billing-sweep/` — combien coûte réellement une image ?

Sondages `count_tokens` gratuits contre l'API Anthropic en direct, comparant
la formule retirée `w·h/750` face au modèle actuel de patchs de 28 px sur
11 géométries de sondage, 2 modèles × 2 paliers de résolution.

**Résultat (2026-07-05) : le modèle de patchs correspond avec un résidu
ZÉRO sur chaque sondage** — facturé = `⌈w/28⌉ × ⌈h/28⌉` après
redimensionnement par palier, plus une surcharge fixe de +3/+4 tokens par
bloc d'image. La page de production (1568×728) coûte exactement 1,460
tokens et transporte 28,080 caractères ≈ **19.2 chars/token** contre
~2 chars/token en texte dense.

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

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
détectée, et non simplement comptée comme fausse. La notation est
déterministe (pas de juge LLM) : `correct` / `abstained` (`ILEGIVEL`
honnête) / `silent_wrong` / `no_answer`.

**Résultats principaux** (n=30 par bras) :

| bras | lectures exactes | notes |
|---|---:|---|
| Fable 5 · page standard · atlas 1-bit (production) | **30/30** | zéro erreur, zéro confabulation |
| Fable 5 · page standard · atlas AA (ancien défaut) | 25/30 | 5 abstentions honnêtes — pourquoi la production est passée au 1-bit |
| Fable 5 · page haute résolution 1928² | 1–2/30 | facturée 3.3× mais rééchantillonnée par l'encodeur — le piège de facturation, non activé |
| Opus 4.8 · glyphes 10×16 | 23–26/30 | le mode sûr optionnel |
| GPT-5.5 · bande 768px (les deux atlas) | 0/60 | + ~40× d'inflation de tokens de sortie face à son propre témoin texte (30/30, 62 tok) |
| Gemini 2.5-flash (partiel, quota) | 0/26 | confabule au lieu de s'abstenir |

La précision de lecture en un coup d'œil — c'est **exactement** le portail
de modèle fail-closed, tracé :

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

Seul le bras ✅ est déployé en production. Tout ce qui lit mal est bloqué
*avec une preuve*, et la notation à trois voies signifie qu'un modèle qui
devine faux (`silent_wrong`) est traité comme pire qu'un modèle qui
s'abstient honnêtement (`ILEGIVEL`).

Trois transports : API directe (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), et `--via-cli` (un abonnement Claude
Code — $0). Mise en garde apprise à la dure : les intermédiaires
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
