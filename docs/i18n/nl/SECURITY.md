# Beveiligingsbeleid

## Kwetsbaarheden melden

Open een privé security advisory op GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) of
neem rechtstreeks contact op met de maintainer
(diegosouza.pw@outlook.com). Open geen publiek issue voor een
exploiteerbare kwetsbaarheid.

## Dreigingsmodel (wat OmniGlyph is)

OmniGlyph is een **lokale proxy** tussen uw client (bijv. Claude Code) en de
LLM-API's. Naar ontwerp ziet het alle inhoud van uw sessie en uw
inloggegevens tijdens de overdracht. De bijbehorende beveiligingsbeslissingen:

- **Bindt standaard aan loopback** (`127.0.0.1`): het dashboard heeft geen
  authenticatie en levert vastgelegde sessiecontext (brontekst van de
  afbeeldingen, telemetrie). `HOST=0.0.0.0` is een expliciete opt-in en
  stelt dit alles bloot aan het netwerk — gebruik dit alleen op een
  vertrouwd netwerk.
- **Inloggegevens**: de proxy stuurt de auth-headers van de client door naar
  de upstream en bewaart ze niet. Sleutels die via env worden aangeleverd
  (`ANTHROPIC_API_KEY` enz.) blijven in het geheugen.
- **Lokale telemetrie**: `~/.omniglyph/events.jsonl` bevat metadata per
  verzoek (tokentellingen, body-hashes) en, bij 4xx-fouten, gecomprimeerde
  body-samples — behandel dit bestand als gevoelig.
- **Ingebeelde inhoud is lossy**: byte-exacte waarden (geheimen, hashes)
  mogen nooit afhankelijk zijn van het lezen van afbeeldingen; de pijplijn
  houdt ze als tekst aan, maar de gouden regel is: plaats geen geheimen in
  LLM-context.
- **Supply chain**: `pnpm-workspace.yaml` dwingt een `minimumReleaseAge` af
  van 3 dagen voor elk nieuw pakket; de core heeft een enkele
  runtime-afhankelijkheid.

## Ondersteunde versies

Alleen de nieuwste releaselijn (`main` / meest recente `v1.x`) ontvangt fixes.
