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

# 🖥️ Le tableau de bord

Un tableau de bord local complet est fourni dans le package — hors ligne, fichier unique, aucune requête externe. Six pages, mises à jour en direct via SSE au fil des requêtes :

![Vue d'ensemble : cartes KPI de poste de contrôle, sparkline des économies et flux d'événements en direct](../../assets/dashboard-overview.png)

- **Vue d'ensemble** — poste de contrôle : % d'économies, $ économisés, latence p95, cache hits, erreurs, flux en direct.
- **Live Flow** — le pipeline sous forme de graphe de nœuds : client → gate → renderer / passthrough → API, avec une particule par requête réelle.
- **Télémétrie** — un odomètre tokens/$ et une chronologie des requêtes en direct ; cliquez sur n'importe quelle requête pour voir exactement quelles parties sont devenues des images et lire le texte source derrière chaque page.
- **Benchmarks** — les reçus du harnais rendus à partir de `benchmarks/*/results/`, une ligne par expérience modèle·configuration, et **lancez les benchmarks depuis l'interface** : les dry-runs à `$0` diffusent leur sortie en direct ; les runs réels restent verrouillés derrière votre clé API plus une confirmation explicite du coût.
- **Sessions / Historique** — les sessions ayant économisé le plus de tokens et chaque événement sur disque.

| Live Flow | Benchmarks |
|---|---|
| ![Le pipeline de requêtes sous forme de graphe de nœuds en direct](../../assets/dashboard-flow.png) | ![Reçus de benchmarks et dry-runs dans l'interface](../../assets/dashboard-benchmarks.png) |

![Télémétrie : odomètre et chronologie des requêtes en direct](../../assets/dashboard-telemetry.png)

# ⚙️ Fonctionnement

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **La facturation est calculée exactement, avant conversion** : Anthropic facture `⌈w/28⌉ × ⌈h/28⌉ + 4` tokens par image (patchs de 28 px — mesuré à résidu nul). Une page complète transporte 28 080 caractères pour 1 460 tokens ≈ **19 caractères/token**, contre ~2 caractères/token pour du texte dense. Le portail ne convertit que lorsque le calcul est gagnant.
- **Ce qui est converti** : le prompt système statique + la documentation des outils, l'ancien historique réduit, les sorties d'outils volumineuses.
- **Ce qui n'est jamais converti** : vos messages, les tours récents, la sortie du modèle, le texte peu dense, les valeurs exactes en octets (hashes/identifiants voyagent en texte à côté), et tout modèle ayant échoué au benchmark de lecture.

# 📚 Utilisation en tant que bibliothèque (sans proxy)

Tout ce que le proxy fait par requête est aussi disponible sous forme d'API documentée et importable :

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` épingle des blocs en tant que texte ; `options.emitRecoverable` renvoie les originaux des blocs transformés en image. Les mathématiques de facturation exactes sont aussi exportées à la racine du paquet (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — c'est ce que consomme [OmniRoute](https://github.com/diegosouzapw/OmniRoute). Runtime pur JS (Node et edge/Workers). Surface complète : `src/core/index.ts`.

# 🧭 The honest part

- **C'est avec perte.** Le rappel exact en octets à partir d'images est intrinsèquement peu fiable. Mesures d'atténuation mises en place : les identifiants exacts voyagent en texte à côté de l'image, et la configuration de production mesurée n'a produit **zéro confabulation silencieuse** — les lectures échouées s'abstiennent.
- **Seul Fable 5 est approuvé aujourd'hui**, avec preuves. GPT-5.5 et Gemini 2.5-flash ne peuvent mesurablement pas lire les rendus denses ; Opus 4.8 a besoin de glyphes 4× plus grands. Le portail applique cela.
- **Nous avons trouvé et évité un piège de facturation** : le palier d'image haute résolution facture 3,3× plus par page, mais l'encodeur de vision ne reçoit pas la résolution supplémentaire — les pages plus grandes se lisent *moins bien*. Mesuré, documenté dans [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), non activé.
- Les prix changent ; la métrique durable est la réduction de tokens, que le proxy consigne par requête face à un contrefactuel `count_tokens` gratuit.

# 🧠 FAQ

**Le 59–70 % est-il de bout en bout, ou seulement sur les requêtes touchées ?**
De bout en bout — la facture entière. La plupart des outils de compression ne rapportent des économies que sur la tranche qu'ils ont touchée, ce qui enjolive le chiffre. Notre dénominateur est *chaque* requête : les petites que le portail a correctement laissées intactes, toutes les écritures et lectures de cache, et tous les tokens de sortie (que le proxy ne compresse jamais). Le chiffre « compressé uniquement » est plus élevé et cité séparément, jamais comme titre.

**Comment l'économie est-elle mesurée ?**
Les deux côtés de la même requête, au même moment. Pour chaque POST `/v1/messages`, le proxy déclenche un sondage `count_tokens` gratuit sur le corps original non compressé (le contrefactuel) en parallèle de l'envoi réel, et lit le bloc d'utilisation réellement facturé par le fournisseur dans la réponse — les deux atterrissent dans la même ligne d'événement. La tarification du cache est appliquée identiquement des deux côtés, si bien que la remise de cache s'annule et ne peut pas être comptée deux fois comme « économie ». La formule se trouve dans `src/core/baseline.ts` ; redérivez-la depuis votre propre journal d'événements.

**Pourquoi une erreur de lecture serait-elle une confabulation plutôt qu'une simple erreur ?**
Parce que la vision des modèles n'est pas de l'OCR : la page devient des plongements de patchs, jamais des caractères discrets, donc il n'existe pas de confiance par glyphe pouvant échouer bruyamment — quand les pixels sous-déterminent un glyphe, l'a priori linguistique comble le vide avec quelque chose de plausible. C'est exactement ce mécanisme qui rend OmniGlyph fail-closed à ce sujet : les valeurs exactes en octets voyagent toujours en texte à côté de l'image, les modèles qui lisent mal sont bloqués par le portail, et la configuration de production mesurée n'a produit **zéro** confabulation silencieuse sur ~300 sondages de lecture — les lectures échouées s'abstiennent.

**Qu'en est-il du travail exact en octets (hashes, identifiants, secrets) ?**
Les tours récents et les identifiants exacts restent en texte par conception. Pour les charges de travail *entièrement* exactes en octets, dirigez-les vers un modèle hors liste blanche (par exemple un sous-agent sur un autre modèle Claude) — tout ce qui est hors liste blanche passe intact, octet pour octet.

**DeepSeek-OCR n'a-t-il pas réglé la question de savoir si cela fonctionne ?**
Il a prouvé que le *canal* fonctionne — avec une paire encodeur/décodeur entraînée pour cette tâche. Le scepticisme date d'une époque où aucun modèle de production standard ne pouvait lire des rendus denses ; ce n'est plus le cas, et le [tableau de bord des modèles](../../../README.md#-the-numbers--measured-not-estimated) ci-dessus montre précisément qui les lit aujourd'hui, preuves à l'appui. Le [harnais de benchmark](../../../benchmarks/README.md) reteste n'importe quel nouveau modèle en une seule commande — le portail suit les données, pas le battage médiatique.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Remerciements

OmniGlyph repose sur les épaules d'un projet en particulier — cette section est notre remerciement permanent.

| Projet | Comment il a façonné OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **La découverte sur laquelle repose tout ce projet.** pxpipe a prouvé, preuves à l'appui, que le canal de vision d'un LLM de production peut transporter un contexte textuel dense pour une fraction du coût en tokens — et que la conversion doit être décidée requête par requête par un calcul de facturation exact, jamais au feeling. Le rendu 1-bit dense, le portail de rentabilité, le contrefactuel `count_tokens`, la liste blanche de modèles fail-closed, et la culture documentaire « mesurer avant d'affirmer » ont tous été inaugurés là-bas. OmniGlyph descend directement de cette base de code (MIT — la ligne de copyright d'origine reste dans notre [LICENSE](../../../LICENSE)). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | La famille de police bitmap 5×8 dont dérive notre atlas de glyphes 1-bit dense (licence dans `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Couverture des glyphes au-delà de la portée de Spleen dans le même atlas (licence dans `assets/`). |

Si vous trouvez OmniGlyph utile, allez aussi mettre une étoile au projet d'origine — la découverte était la leur. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Licence

MIT — voir [LICENSE](../../../LICENSE).
