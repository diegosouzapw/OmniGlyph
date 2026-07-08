# Politique de sécurité

## Signaler des vulnérabilités

Ouvrez un avis de sécurité privé sur GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) ou
contactez directement le mainteneur (diegosouza.pw@outlook.com). N'ouvrez
pas d'issue publique pour une vulnérabilité exploitable.

## Modèle de menace (ce qu'est OmniGlyph)

OmniGlyph est un **proxy local** entre votre client (par ex. Claude Code) et
les API LLM. Par conception, il voit tout le contenu de votre session et vos
identifiants en transit. Les décisions de sécurité correspondantes :

- **Se lie à loopback par défaut** (`127.0.0.1`) : le tableau de bord n'a
  aucune authentification et sert le contexte de session capturé (texte
  source des images, télémétrie). `HOST=0.0.0.0` est un opt-in explicite et
  expose tout cela au réseau — ne l'utilisez que sur un réseau de confiance.
- **Identifiants** : le proxy transmet les en-têtes d'authentification du
  client vers l'amont et ne les persiste pas. Les clés fournies via
  l'environnement (`ANTHROPIC_API_KEY` etc.) restent en mémoire.
- **Télémétrie locale** : `~/.omniglyph/events.jsonl` contient des
  métadonnées par requête (nombres de tokens, hachages du corps) et, sur les
  erreurs 4xx, des échantillons de corps compressés — traitez ce fichier
  comme sensible.
- **Le contenu imagé est avec perte** : les valeurs exactes en octets
  (secrets, hachages) ne doivent jamais dépendre de lectures d'images ; le
  pipeline les conserve en texte, mais la règle d'or est : ne mettez pas de
  secrets dans le contexte LLM.
- **Chaîne d'approvisionnement** : `pnpm-workspace.yaml` impose un
  `minimumReleaseAge` de 3 jours pour tout nouveau paquet ; le cœur a une
  seule dépendance runtime.

## Versions supportées

Seule la dernière ligne de version (`main` / le `v1.x` le plus récent) reçoit
des correctifs.
