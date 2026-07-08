# Journal des modifications

Format : [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · versionnement sémantique.

## [1.0.0] — 2026-07-07

Première publication publique.

### Le produit

- **Proxy de compression contexte-en-image** : réécrit les parties volumineuses
  de chaque requête LLM (prompt système, documentation des outils, ancien
  historique, sorties d'outils volumineuses) en pages PNG 1-bit denses avant
  qu'elles ne quittent votre machine. Serveur Node local et hôte Cloudflare
  Workers.
- **Mathématiques de facturation exactes par fournisseur** (`src/core/`) :
  patchs Anthropic de 28 px + surcharge de 3–4 tokens/bloc (sondage maison,
  résidu nul), formules OpenAI et Gemini auditées face à la documentation
  officielle. Exportées à la racine du paquet (`anthropicImageTokens`,
  `resolveAnthropicVisionTier`, plafonds de palier).
- **Configuration de rendu de production mesurée** : atlas de glyphes 1-bit
  dense (pas d'anti-crénelage), pages de palier standard — chaque choix étayé
  par une preuve de benchmark dans `benchmarks/*/results/`.
- **Harnais de benchmark** (`benchmarks/`) : billing-sweep (comptabilité de
  tokens) et density-frontier (frontière de précision de lecture selon les
  modèles/densités), ré-exécutables via API, OpenRouter, le CLI Claude Code,
  ou via OmniRoute (`--via-omniroute`).
- **Réessai en cas de refus** : un renifleur SSE/JSON rejoue la requête
  d'origine lorsqu'un modèle refuse la page rendue (interrupteur d'urgence
  `retryRefusalWithOriginal`).
- **Cache de rendu LRU** pour des pages déterministes.
- **Moteur OmniRoute** : livré comme moteur de compression `omniglyph` dans
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute) (mode autonome et
  pipeline empilé), avec des portails fail-closed et une comptabilité de
  tokens consciente des images.

### Les chiffres (tous reproductibles)

- Rendu UI d'exemple : 1015 caractères → PNG 438×120, 254 → 84 tokens
  (**66,9 % économisés**).
- Page standard 1568×728 = 1456 tokens-image quelle que soit la quantité de
  texte qu'elle contient.
- Claude lit les pages 1-bit denses à 100 % à la densité de production ;
  Opus 4.8 lit 77–87 % à 10×16.

### Décisions négatives (mesurées, pas des opinions)

- **Le palier haute résolution est un piège de facturation** : la page
  1928² est facturée WYSIWYG mais l'encodeur ne reçoit pas la pleine
  résolution — les deux paliers rendent des pages standard.
- **GPT-5.5 rejeté** : 0/60 lectures de la bande dense et ~40× d'inflation
  de la complétion face au témoin texte.
- **gpt-4o-mini jamais imagé** (le plancher de 2833/5667 tokens le rend non
  rentable).
- **Gemini 2.5-flash confabule** au lieu de s'abstenir sur les pages denses
  (0/26) — nouveau test en attente avec quota payant.
