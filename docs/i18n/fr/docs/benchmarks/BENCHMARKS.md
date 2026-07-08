# OmniGlyph — Mesures consolidées (2026-07-05)

Tout ce qui a été MESURÉ dans cette session, avec source et n ; les
hypothèses sont clairement séparées à la fin. Preuves :
`benchmarks/billing-sweep/results/` et `benchmarks/density-frontier/results/`
(JSONL par réponse).

## 1. Facturation Anthropic (count_tokens direct, $0, 11 géométries × 2 modèles)

Formule confirmée : `tokens = ceil(w/28) × ceil(h/28)` après redimensionnement
par palier, **+3/bloc (Fable 5) / +4/bloc (Sonnet 4.5)** — résidu ZÉRO sur
toutes les lignes.

| sondage | dimensions | Fable 5 (haute résolution) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| ancre de document | 1092×1092 | 1524 | 1525 |
| ancre de document | 1000×1000 | 1299 | 1300 |
| page standard | 1568×728 | 1459 | 1460 |
| **grande page** | **1928×1928** | **4764 (WYSIWYG !)** | 1525 (rééchantillonnage) |
| plafond haute résolution | 1960×1960 | 4764 (écrêté) | 1525 |
| grand côté haute résolution | 2576×1204 | 3959 | 1516 |
| bande verticale | 768×1932 | 1935 | 1292 (rééchantillonnage) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 images) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→sous-échantillonnage, NON rejeté dans count_tokens) | 3585 |

Décisions dérivées (implémentées) : portail exact par patch ; palier par
modèle (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = haute résolution) ; `cols`
313→312.

## 2. Précision de lecture (density-frontier, aiguilles hex/camelCase/chiffres + distracteurs)

### Matrice 2×2 Fable 5 — via CLI/abonnement, n=30/bras, même corpus (~16,6k caractères)

| page × atlas | exact | abstentions (ILEGIVEL) | erreurs silencieuses |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100 %)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83 %) | 5 | 0 |
| haute résolution 1928×1928 · **1-bit** | 20/30 (67 %) | 10 | 0 |
| haute résolution 1928×1928 · AA | 0/30 | 29 | 1 (prédite par la matrice) |

→ **1-bit > AA sur les deux pages ; zéro confabulation sur 120 questions.**
APPLIQUÉ : `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ la haute résolution arrive dégradée par rééchantillonnage de transport
(voir H1/H3) — les 67 % sont un plancher, pas un plafond.

### Opus 4.8 — via CLI/abonnement, n=30/bras

| config | exact | abstentions | erreurs |
|---|---:|---:|---:|
| haute résolution · cellule 10×16 | **26/30 (87 %)** | 0 | 4 (chiffres) |
| standard · cellule 5×8 | 0/30 | 30 | 0 |

→ Coude d'Opus confirmé avec notre propre n (mesure amont : 95 % à 10×16
avec n=20). Le « mode sûr Opus » est viable : 10×16 sur la grande page ≈
1,7 caractère par token image sur le corpus du harnais.

### Via OpenRouter (mêmes corpus/questions) — non concluant pour la lisibilité

| fait mesuré | nombre |
|---|---|
| content_filter sur les questions de transcription (pages standard) | 60/60 (100 %) |
| content_filter sur les pages haute résolution | 5-6/30 (~20 %) |
| Fable haute résolution : abstentions + erreurs | 20 ILEGIVEL + 5 erreurs (2 prédites) |
| Opus 10×16 (avant épuisement des crédits) | 7/9 exact (78 %) |
| erreurs de lecture prédites par la matrice de confondabilité | 4→a, 0→8, casse S/s |

### Comparaison des transports (même question, même contenu)

| transport | filtre/refus | grande page lisible ? |
|---|---|---|
| API directe (n=9, avant épuisement des crédits) | 0 | non testé |
| OpenRouter | ~100 % std / ~20 % haute résolution | non (suspecté : rééchantillonnage) |
| CLI Claude Code (abonnement) | 0 content_filter ; ~50 % des grands lots bloqués (résolu avec des lots de 10 + réessai) | non (suspecté : redimensionnement par Read) |

## 3. Coût par fournisseur (hors ligne, exact — pages COMPLÈTES, théorique)

| fournisseur · page | tokens/page | caractères/page | **caractères/token** | statut |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (tous modèles) | 1460 | 28 080 | **19,2** | mesuré |
| Anthropic haute résolution 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92 160 | **19,3** (3,3× moins d'images) | facturation mesurée ; lisibilité en attente (H1) |
| GPT-5 (tuile) bande 768×2048 | 1190 | ~38 760 | **32,6** | documentation auditée |
| GPT-5.4/5.5 (patch, original) jusqu'à 1568×5984 | ~9 163 | ~233k | **25,4** | docs ; lisibilité non testée |
| gpt-4o-mini | 48 169/bande | — | **0,8 — NE JAMAIS imagifier** | docs (bug D2 corrigé) |
| Gemini tuile 1533×1152 (unité de rognage native 768) | 1032 | 43 615 | **42,3 ← meilleur documenté** | docs ; lisibilité non testée |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32 604 | **116 (si lisible)** | hypothèse H6 |

## 4. Bugs trouvés et corrigés (audit face à la documentation officielle)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini tombait dans la tuile par défaut 85/170 (réel : 2833/5667) | coût sous-estimé ~33× — **portail inversé** | e6bc75f |
| D1 | multiplicateur o4-mini 1,62 (réel 1,72) | −5,8 % | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) avec plafond 10000 (réel 1536, sans original) | casserait avec des pages plus grandes | e6bc75f |
| D4 | gpt-5-codex-mini dans le régime de tuiles (réel : patch 1536) | ≥+23 % sous-estimé | e6bc75f |
| D5 | detail:'original' codé en dur pour chaque modèle (n'existe que depuis 5.4+) | hors contrat | e6bc75f |
| #44 | stub de description injecté dans les outils typés → 400 + repli silencieux | économies annulées sans signal | 0f66e32 |
| AA | atlas AA en production malgré le commentaire « eval-only » | −17pp de lecture sur Fable | 9a25585 |
| — | cols slab 313 (1573px) → rééchantillonnage 0,997× + colonne de patch supplémentaire | corrigé à 312 | référence |

## 5. Hypothèses ouvertes (ce que coûte de clore chacune)

| id | hypothèse | preuve actuelle | test décisif | coût |
|---|---|---|---|---|
| H1 | La page 1928² se lit ≥ standard sur l'API directe (WYSIWYG prouvé en facturation) | facturation 4764 sans rééchantillonnage ; le 1-bit lit déjà 67 % même dégradé | A/B direct std vs haute résolution (1-bit) | ~4 $ API |
| H2 | haute résolution + 1-bit sur l'API directe ≈ 100 % avec 3,3× moins d'images | H1 + matrice 2×2 | idem H1 | idem |
| H3 | Le Read du CLI et OpenRouter redimensionnent les images >1568/2000px | le 5×8 meurt et le 10×16 survit SUR LA MÊME page | une page 1928² avec des glyphes 20×32 par transport | ~0 $ (CLI) |
| H4 | Le refus dépend de la formulation (agent lisant un fichier ≈ 0 % vs API brute ≈ 100 %) | comparaison de transports ci-dessus | A/B de formulation sur le vrai chemin proxy | faible |
| H5 | Tuile Gemini 1533×1152 lisible à 5×8 (42 caractères/tok) | aucune | density-frontier avec GEMINI_API_KEY | ~gratuit (palier gratuit) |
| H6 | media_resolution:low lisible (116 caractères/tok) | improbable (encodeur basse résolution), mais jamais mesuré | 1 appel | ~gratuit |
| H7 | GPT : lisibilité de bande + inflation de tokens de complétion (risque PageWatch) | la communauté a vu −40 % de prompt mais +complétion/2× latence | density-frontier avec OPENAI_API_KEY | ~2-5 $ |
| H8 | La chirurgie de glyphes (H~K, 0/8, 5/3…) convertit les abstentions en lectures | après le 1-bit, TOUS les échecs Fable sont devenus des abstentions | modifier ~10 bitmaps + réexécuter la matrice | 0 $ (CLI) |
| H9 | Thème clair (noir sur blanc) > inversé | littérature (article Glyph, Tesseract) ; jamais mesuré sur un VLM commercial | drapeau de style + 2 bras | 0 $ (CLI) |
| H10 | Opus à 7×10 se situe entre 0 % (5×8) et 87 % (10×16) → compromis correct | courbe amont 35 % à 7×10 (n=20) | 1 bras supplémentaire | 0 $ (CLI) |
| H11 | Le réessai en cas de refus dans le proxy récupère les ~50 % de lots filtrés | le refus est stochastique par appel | implémenter + mesurer en production | code |

## 6. Points en attente opérationnels

1. `gh auth login` → créer `diegosouzapw/omniglyph` en privé + push (10 commits locaux).
2. Crédits Anthropic (H1/H2, le verdict de géométrie) et OpenRouter (épuisés).
3. **Faire tourner les** clés Anthropic et OpenRouter **exposées** dans le chat.
4. File d'attente de code : #45 (suppression de schéma draft-07), réessai en
   cas de refus (H11), chirurgie de glyphes (H8), Phase 4 (TS dans les
   scripts, GIFs, docs, tableau de bord v2), Phase 5 (moteur OmniRoute).

## ADDENDUM 2026-07-06 — A/B via l'API directe (165 appels) : H1/H2 RÉFUTÉES

| config | exact | abst. | refus | erreurs |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA et 1-bit) | 0/60 | 0 | **60/60 refus** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 prédites) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 prédites) |
| opus hires 10×16 | **23/30 (77 %)** | 1 | 0 | 6 |

VERDICT : la page 1928² du palier haute résolution EST FACTURÉE WYSIWYG
(4764 tok, sondage) mais l'ENCODEUR ne reçoit pas la pleine résolution —
1-2/30 lus, avec des erreurs d'échange de glyphe unique (6→8, a→4), la
signature d'un rééchantillonnage interne. **Facturation ≠ entrée encodeur →
piège : 3,3× le coût, lisibilité pire.** APPLIQUÉ : pageGeometryForTier()
annulé — les deux paliers rendent 1568×728 ; l'infrastructure de palier est
conservée (la facturation exacte reste valide et le futur ajustement est
1 ligne). H3 mis à jour : le « rééchantillonnage de transport » était
(aussi) l'encodeur propre de l'API. Refus sur transcription via API brute :
100 % sur la page standard (H4 renforcée — seule la formulation par agent y
échappe). Opus 10×16 confirmé sur les deux transports (77-87 %).

## ADDENDUM 2026-07-06 (2) — batterie GPT-5.5 via l'API directe : H7 clos (ÉCHEC)

| bras | verbatim | résumé | sortie/réponse |
|---|---:|---:|---:|
| bande 768×2048 5×8 AA | 0/30 (18 abst, 5 filtrées, 7 erreurs) | 0/3 | 2 639 tok |
| bande 5×8 1-bit | 0/30 (15 abst, 5 filtrées, 10 erreurs) | 1/3 | 2 383 tok |
| TEXTE (témoin) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 ne peut pas lire les glyphes 5×8 (0/60 ; même le résumé ne survit
pas) et gonfle la complétion ~40× en essayant de les déchiffrer (2,4-2,7k
tokens de raisonnement par question) — les économies de prompt sont
englouties par la sortie. Le témoin texte parfait prouve que le
corpus/questions sont sains. Confirme et quantifie l'opt-in 5.5 ; gpt-5.6
(par défaut) reste non testable (le compte n'a pas accès).
Futur (H12) : le portail GPT doit modéliser l'inflation de sortie, pas
seulement les tokens de prompt.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARTIEL : quota du palier gratuit épuisé en cours d'exécution)

Sur les ~26 réponses image obtenues avant l'épuisement du quota : **0
correctes, 1 abstention, ~25 CONFABULATIONS** — et ce ne sont pas des
confusions de glyphes : ce sont des chiffres aléatoires
(`indexLedgerInd → 0040375615`), c'est-à-dire que l'encodeur ne voit
presque rien aux densités testées (tuile native 42 caractères/tok et
MEDIUM plat) et 2.5-flash INVENTE au lieu de s'abstenir (ignore
l'instruction ILEGIVEL). Témoin texte : 3/3 sur celles qui sont passées.
Aucune inflation de sortie (6-28 tok/réponse).

Signal préliminaire : H5/H6 penchent vers NON sur 2.5-flash, avec un mode
d'échec PIRE que celui de GPT (confabulation silencieuse plutôt
qu'abstention) — Gemini nécessiterait des garde-fous supplémentaires dans
le proxy. En attente de clôture : réexécuter avec un quota payant ou un
autre jour, et tester gemini-2.5-pro (flash est le lecteur le plus faible
de la famille). La page en tuile native conserve toujours le meilleur ratio
DOCUMENTÉ (42,3 caractères/token) ; c'est la lisibilité qui est en doute.

Note de coût : les pages partielles (la dernière du corpus) sont mal
facturées sous le régime de tuiles (petite hauteur → petite unité de
rognage → plus de tuiles) — remplir la dernière page à 1152px de hauteur
est une optimisation obligatoire si Gemini est intégré.
