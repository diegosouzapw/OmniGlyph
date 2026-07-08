# Feuille de route du fork — « notre OmniGlyph » + intégration OmniRoute

Plan de travail consolidé (2026-07-05) issu de : sondage de facturation
mesuré, audit OpenAI/Gemini face à la documentation officielle, analyse
d'outils apparentés, et le harnais density-frontier. Statut de chaque
élément : ☐ en attente · ◐ partiel · ☑ fait ici.

## Phase 0 — Fondation de mesure (TERMINÉE dans ce dépôt)

- ☑ Facturation Anthropic exacte (patchs de 28 px, 2 paliers, +4/bloc) — `src/core/anthropic-vision.ts`, sondage dans `benchmarks/billing-sweep/`.
- ☑ Portail de rentabilité avec coût exact (a remplacé w·h/750 × 1,10).
- ☑ Géométrie par palier : Fable/Opus 4.8/Sonnet 5 → pages 1928×1928 (3,3× moins d'images) ; standard → 1568×728. 691 tests au vert.
- ☑ Harnais `benchmarks/density-frontier/` (coût × précision hors ligne via API, aiguilles avec distracteurs confondables, notation déterministe).

## Phase 1 — Corrections de facturation multi-fournisseurs (bugs confirmés dans l'audit)

Priorité fixée par l'audit (documentation officielle capturée le 2026-07-05) :

1. ☐ **D2 (portail INVERSÉ)** : `gpt-4o-mini` tombe dans la tuile par défaut 85/170, mais coûte **2833 base / 5667 par tuile** (~33× sous-estimé, ~0,8 char/token) — l'imagerie sur ce modèle est toujours une perte et le portail l'approuve. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5** : `detail:'original'` est envoyé inconditionnellement (`src/core/openai.ts:392,402`), mais n'existe que depuis gpt-5.4+ ; le dériver du profil.
3. ☐ **D1** : multiplicateur `o4-mini` de 1,62 → **1,72** (sous-estime de 5,8 %).
4. ☐ **D3/D4** : `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` sont dans le compartiment de patchs **plafond 1536 sans `original`** (le code suppose 10000) ; `gpt-5-codex-mini` est dans le mauvais régime (tuile → patch).
5. ☐ **Géométrie GPT** : `GPT_MAX_HEIGHT_PX 1932 → 2048` (s'aligne sur LES DEUX régimes : patchs 64×32 et tuiles 4×512 ; +6,25 % de caractères gratuits). Profil `original` dédié 5.4/5.5 : jusqu'à 1568×5984 (9 163 patchs ≤ 10k, ~233k caractères en un seul bloc) — d'abord un A/B de lisibilité.
6. ☐ **Support Gemini** (nouveau) : `src/core/gemini.ts` + `gemini-model-profiles.ts` + routes `:generateContent`/`:streamGenerateContent` dans le proxy. Géométrie documentable : **1152×1536 (unité de rognage exacte 768, 4 tuiles, 42,2 caractères/token — meilleur ratio documenté des 3 fournisseurs)** ; paris à calibrer : 768² avec `media_resolution:MEDIUM` (56,4) et Gemini 3 HIGH. Attention : le point de terminaison compatible OpenAI de Gemini passerait par le transformateur OpenAI avec une mauvaise facturation.

## Phase 2 — Qualité de lecture (harnais density-frontier comme juge)

- ◐ A/B décisif std vs haute résolution sur Fable (en cours ; barre : résumé == texte ET zéro erreur silencieuse ET économies > 0).
- ☐ Résoudre la contradiction AA vs 1-bit dans le chemin dense (le code dit « eval-only », la production utilise AA).
- ☐ (DIFFÉRÉ avec justification 2026-07-06) Chirurgie de glyphes : la configuration de production lit 30/30 — il n'y a aucun échec mesurable pour que la chirurgie le corrige aujourd'hui. Revoir si une cible sous 100 % entre dans le périmètre (par ex. Opus) ou si de nouvelles mesures montrent une régression.
- ☑ ~~A/B thème clair~~ RÉSOLU par inspection (2026-07-06) : le rendu EST DÉJÀ noir sur blanc (render.ts:635/822, inversion post-blit) — aligné avec la littérature ; l'hypothèse était née d'une prémisse erronée (image d'exemple amont).
- ☐ Liste de mots avec somme de contrôle pour les identifiants exacts en octets (amont #38, approuvé) + bannière d'abstention (#31/#32) + camelCase dans le factsheet (#33/#34).
- ☑ Portage #45 : `$schema`/`$id` préservés, tuples supprimés par élément (commit sur main).
- ☑ Réessai en cas de refus (#37/H11) : renifleur de rejeu sans perte + réessai unique avec le corps d'origine ; télémétrie refusalRetried (commit sur main).
- ☐ Outil de réhydratation (`RecoverableBlock` → outil appelable ; LensVLM valide la ré-expansion sélective).

## Phase 3 — Performance/robustesse

- ☐ Cache de rendu LRU (déterministe par invariant ; le slab statique + les chunks figés se rerendent aujourd'hui à chaque requête).
- ☐ Encodage PNG dans un thread de travail ; niveau de déflation configurable.
- ☐ Portage des correctifs amont ouverts : #44 (outils natifs typés → 400), #45 (boucle de suppression de schéma draft-07 → 400), #42 (proxy CONNECT pour Claude Desktop), #19 (double facturation des descriptions GPT).
- ☐ Implémenter ADAPTIVE_CPT_PLAN (cpt par rôle de bloc ; slab réel = 1,50).

## Phase 4 — Le fork lui-même

- ☐ Nom/dépôt propre (décision de Diego) + `git remote` amont pour les cherry-picks.
- ☐ **TS partout** : le cœur est déjà en TS, convertir `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (motif : tsx + vitest ; `benchmarks/density-frontier/` est né ainsi).
- ☐ Standard de qualité OmniRoute : eslint 9 + prettier, CI avec typecheck/test/build/link-check, CONTRIBUTING, SECURITY, i18n README (pt-BR d'abord), CHANGELOG sémantique.
- ☐ **Des GIFs plutôt que des vidéos** dans le README (enregistrer avec vhs/asciinema+agg ; comparaison côte à côte simple vs proxy).
- ☐ Tableau de bord v2 (réimplémenter via l'API HTTP — ne pas hériter de code tiers) : lanceur « ouvrir un terminal avec ANTHROPIC_BASE_URL », vérification « le trafic passe-t-il par moi ? », inspecteur image-vs-texte, sessions, panneau de coût en devise, i18n léger, SSE au lieu de sondage, persistance SQLite avec rétention (son schéma à 24 colonnes est un bon point de départ).
- ☐ Micro-idées venues de dense-image-gen : mode `lines` (mise en page préservée pour code/tableaux), `--keep-ws`, titre d'origine par page (« prompt système » / « documentation des outils » / « tour d'historique N »), CLI autonome `render arquivo.md -o out.png`.

## Phase 5 — Portage vers OmniRoute

- ☐ Moteur `CompressionEngine` (modèle `cavemanAdapter.ts`), enregistré dans `engines/index.ts` + `engineCatalog.ts` ; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plomberie : passer `supportsVision` dans `chatCore.ts:1297` (1 ligne) ou résoudre via `isVisionModelId`.
- ☐ Ordre d'empilement : dernier (renderers RTK/Caveman/sémantiques d'abord ; OmniGlyph imagifie le résidu).
- ☐ Invariants : ne jamais réécrire les blocs avec le `cache_control` du client (leçon #4560) ; le portail de fidélité (#5127) a besoin d'une exemption déclarée ou d'un factsheet texte qui satisfait les invariants ; télémétrie de tentative avec `skip_reason` (leçon #4268).
- ☐ Routage : le fallback/réessai post-moteur doit respecter la capacité de vision et la liste blanche (recompresser ou contourner).
- ☐ Synergie CCR : `emitRecoverable` → magasin CCR avec récupération par tranche (`head/tail/grep`, #5187) = ré-expansion sélective complète.
- ☐ Étirement du palier gratuit comme fonctionnalité marketing : chaque token de palier gratuit produit ~2 à 3× plus de caractères sur les modèles de vision ; le palier gratuit Gemini + géométrie 1152×1536 est le cas le plus solide.

## Risques ouverts

- Refus de Fable après redéploiement en contexte imagé (amont #37) — atténuer avant l'activation par défaut dans OmniRoute.
- Arbitrage de prix : si Anthropic retarife la vision, les économies changent — le contrefactuel par requête (`count_tokens`) est la défense.
- OpenAI : une mesure communautaire (PageWatch) a observé une hausse des tokens de complétion et une latence 2× — mesurer par fournisseur avant activation.

## Résultats A/B 2026-07-05 (via OpenRouter — NON CONCLUANT pour la géométrie, valide pour les modes d'échec)

| config | verbatim | abst. | filtré | erreur silencieuse |
|---|---|---|---|---|
| fable std 5×8 (AA et 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 prédites) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 prédites) |
| opus hires 10×16 | **7/9 lus** | 0 | 21 à court de crédits | 2 (chiffre) |

Constats valides : (1) le classifieur (issue #37) est le mode d'échec
DOMINANT pour les questions de transcription sur la page standard — 100 %
filtré — et ne se déclenche pas sur la grande page ; la formulation compte.
(2) L'abstention fonctionne : 20× ILEGIVEL contre 5 confabulations sur la
grande page. (3) Opus à 10×16 lit 78 % exact (n=9) contre 0 % historique à
5×8 — première preuve directe du coude. (4) L'illisibilité de la grande
page via OpenRouter suggère un RÉ-ÉCHANTILLONNAGE de transport (palier
standard Bedrock/Vertex ?) — hypothèse décisive à tester sur l'API directe
d'Anthropic ; l'A/B de géométrie reste OUVERT jusque-là. Les crédits
OpenRouter se sont épuisés en plein bras Opus.

## Matrice finale 2×2 (2026-07-05, via CLI/abonnement, Fable 5, n=30/bras)

| page × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 abst. |
| haute résolution 1928×1928 | **20/30 (67 %)** + 10 abst. | 0/30 + 29 abst. |

Zéro confabulation sur les 4 bras (120 questions — chaque échec était
ILEGIVEL). APPLIQUÉ : DENSE_RENDER_STYLE basculé en 1-bit (aa:false) avec
une épingle dans tests/dense-style.test.ts. Opus 4.8 : 26/30 à 10×16 sur la
grande page, 30/30 ILEGIVEL à 5×8 — mode sûr Opus viable. La grande page
reste dégradée par les transports (Read du CLI/rééchantillonnage
OpenRouter) ; le verdict de géométrie WYSIWYG dépend encore de l'API
directe.
