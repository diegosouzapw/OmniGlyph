# Architecture

Carte en une page de la base de code.

## Pipeline de requête

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Facturation (exacte, mesurée)

| module | fournisseur | modèle |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | patchs de 28 px + 4/bloc, plafonds de redimensionnement par palier ; géométrie de page (les deux paliers rendent la page standard 1568×728 — le palier haute résolution est un piège de facturation, voir [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | régimes de patchs/tuiles par modèle, `detail` par profil, géométrie de bande |
| `src/core/gemini-model-profiles.ts` | Google | formule de tuile (unité de rognage `floor(min/1.5)`) + coûts fixes `media_resolution` |

## Rendu

- `src/core/render.ts` — texte → PNG via un atlas de glyphes précompilé
  (Spleen 5×8 + repli Unifont), reflow avec des sentinelles de saut de ligne
  `↵`, atlas 1-bit en production (mesuré meilleur qu'AA sur Fable).
- `src/core/render-cache.ts` — mémoïsation LRU des rendus déterministes (le
  slab statique + les chunks d'historique figés se rerendraient sinon à
  chaque requête).
- `src/core/history.ts` — condense les anciens tours en chunks image figés
  ajoutés uniquement, qui restent identiques octet pour octet afin que la
  mise en cache des prompts continue de fonctionner.
- `src/core/png.ts` — encodeur PNG déterministe minimal (aucune dépendance
  native).

## Garde-fous

- Liste blanche de modèles (`src/core/applicability.ts`) : seuls les
  modèles ayant réussi le benchmark de lecture sont imagés ; tout le reste
  passe identique octet pour octet.
- Les valeurs exactes en octets (SHA, identifiants) voyagent en texte dans
  une fiche technique à côté de l'image (`src/core/factsheet.ts`) ;
  originaux récupérables via `emitRecoverable`.
- Les outils natifs typés (`type !== 'custom'`) ne sont jamais réécrits
  (garde-fou 400).

## Benchmarks et preuves

`benchmarks/` contient les deux harnais qui ont produit chaque chiffre du
README — voir [benchmarks/README.md](../../benchmarks/README.md).
