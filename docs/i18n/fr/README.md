🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Le contexte comme image

### Réduisez votre facture Claude de **59 à 70 %** en rendant le contexte volumineux sous forme de pages PNG denses — le même contenu, pour une fraction des tokens.

**Les modèles facturent le texte au token, mais une image est facturée selon ses dimensions — pas selon la quantité de texte qu'elle contient.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Fait partie de la famille [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)

</div>

---

# 📊 The numbers — measured, not estimated

| métrique | résultat | preuve |
|---|---|---|
| Réduction de facture de bout en bout | **59–70 %** | trace de production, 13 709 requêtes |
| Tokens par bloc converti | **10× moins** (28 080 caractères : 14 040 → 1 460 tokens) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Précision de la formule de facturation | résidu **nul** sur 22 sondages `count_tokens`, 2 modèles × 2 paliers | `benchmarks/billing-sweep/results/` |
| Précision de lecture exacte, config de production | **30/30 (100 %)** sur Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Confabulations silencieuses sur ~300 sondages de lecture | **0** — chaque échec s'abstient en `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Tableau de bord des modèles** (peut-il lire des rendus denses ? n=30 par bras, notation déterministe) :

| modèle | lecture | verdict |
|---|---|---|
| Claude **Fable 5** | **100 %** exact | ✅ cible de production |
| Claude Opus 4.8 | 77–87 % à 4× la taille de glyphe | ⚠️ mode sûr optionnel (les économies chutent à ~2×) |
| GPT-5.5 | 0/60 — et gonfle ses réponses ~40× en essayant | ❌ bloqué par le portail, avec preuve |
| Gemini 2.5-flash | 0/26 — et confabule au lieu de s'abstenir | ❌ bloqué (test partiel, limité par le quota) |

L'avantage est **spécifique à Fable aujourd'hui** — les autres encodeurs de vision ne résolvent pas encore les glyphes denses. Le [harnais de benchmark](benchmarks/README.md) retteste n'importe quel nouveau modèle en une seule commande.

# 🤔 Pourquoi OmniGlyph ?

Chaque session d'agent de longue durée traîne le même poids mort à chaque requête : le prompt système, la documentation des outils et l'ancien historique — refacturés au token, à chaque tour. OmniGlyph est un **proxy local** qui réécrit ces parties volumineuses en pages PNG denses *avant qu'elles ne quittent votre machine* :

- **Mathématiques de facturation exactes, pas d'heuristiques** — il calcule la formule réelle de tokens-image du fournisseur (mesurée à résidu nul) et ne convertit que lorsque le calcul est gagnant.
- **Fail-closed par conception** — les modèles incapables de lire des rendus denses sont bloqués par un portail, avec preuves de benchmark. Aucune perte de qualité silencieuse.
- **Privé et local d'abord** — la réécriture se fait sur `127.0.0.1` ; rien d'autre n'est envoyé où que ce soit.
- **Reproductible** — chaque chiffre ci-dessus a une preuve dans `benchmarks/*/results/`, ré-exécutable en une commande.

# ⚡ Démarrage rapide

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Fonctionne dans les deux cas :
- **Clé API** (paiement au token) : votre facture baisse de 59 à 70 % de bout en bout.
- **Session d'abonnement** : vous ne payez pas moins, mais les limites d'utilisation sont comptées en tokens — vos limites s'étirent donc **~2 à 3×**.

Tableau de bord sur <http://127.0.0.1:47821/> : tokens économisés, chaque conversion texte→image côte à côte, interrupteur d'urgence, puces de modèles en direct. Les réponses sont diffusées normalement — seule la *requête* est compressée, jamais la sortie du modèle.

# ⚙️ Fonctionnement

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **La facturation est calculée exactement, avant conversion** : Anthropic facture `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens par image (patchs de 28 px — mesuré à résidu nul). Une page complète transporte 28 080 caractères pour 1 460 tokens ≈ **19 caractères/token**, contre ~2 caractères/token pour du texte dense. Le portail ne convertit que lorsque le calcul est gagnant.
- **Ce qui est converti** : le prompt système statique + la documentation des outils, l'ancien historique réduit, les sorties d'outils volumineuses.
- **Ce qui n'est jamais converti** : vos messages, les tours récents, la sortie du modèle, le texte peu dense, les valeurs exactes en octets (hashes/identifiants voyagent en texte à côté), et tout modèle ayant échoué au benchmark de lecture.

# 🧭 The honest part

- **C'est avec perte.** Le rappel exact en octets à partir d'images est intrinsèquement peu fiable. Mesures d'atténuation mises en place : les identifiants exacts voyagent en texte à côté de l'image, et la configuration de production mesurée n'a produit **zéro confabulation silencieuse** — les lectures échouées s'abstiennent.
- **Seul Fable 5 est approuvé aujourd'hui**, avec preuves. GPT-5.5 et Gemini 2.5-flash ne peuvent mesurablement pas lire les rendus denses ; Opus 4.8 a besoin de glyphes 4× plus grands. Le portail applique cela.
- **Nous avons trouvé et évité un piège de facturation** : le palier d'image haute résolution facture 3,3× plus par page, mais l'encodeur de vision ne reçoit pas la résolution supplémentaire — les pages plus grandes se lisent *moins bien*. Mesuré, documenté dans [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), non activé.
- Les prix changent ; la métrique durable est la réduction de tokens, que le proxy consigne par requête face à un contrefactuel `count_tokens` gratuit.

# 🔬 Reproduire chaque chiffre

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Méthodologie complète et chaque tableau de résultats : [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Preuves brutes par réponse : `benchmarks/*/results/*.jsonl`.

# 🚀 La famille OmniRoute

OmniGlyph est aussi livré comme **moteur de compression natif au sein d'[OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — la passerelle IA gratuite. Il y fonctionne comme moteur `omniglyph` (mode autonome ou empilé avec les autres moteurs), avec des portails fail-closed et une comptabilité de tokens consciente des images.

# 🛠️ Pile technique

| couche | technologie |
|---|---|
| Langage | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Rendu | atlas de glyphes 1-bit maison (dérivé de Spleen/Unifont, licences dans `assets/`) → PNG |
| Tests | Vitest — TDD, plus des garde-fous d'intégrité de docs et de rebranding |
| Benchmarks | harnais `benchmarks/` (billing-sweep, density-frontier) avec preuves JSONL |

## Structure du projet

| chemin | contenu |
|---|---|
| `src/` | le proxy : pipeline de transformation, facturation exacte par fournisseur, moteur de rendu, hôtes (Node + Cloudflare Workers) |
| `benchmarks/` | les harnais qui ont produit chaque chiffre ci-dessus — ré-exécutables |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Communauté

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugs et demandes de fonctionnalités
- 🔒 [SECURITY.md](SECURITY.md) — signalements de vulnérabilités
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD strict + mesure avant affirmation
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Licence

MIT — voir [LICENSE](../../../LICENSE).
