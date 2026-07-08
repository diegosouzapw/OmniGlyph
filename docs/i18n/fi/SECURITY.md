# Tietoturvakäytäntö

## Haavoittuvuuksien ilmoittaminen

Avaa yksityinen tietoturvailmoitus GitHubissa
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) tai
ota suoraan yhteyttä ylläpitäjään (diegosouza.pw@outlook.com). Älä avaa
julkista issueta hyödynnettävästä haavoittuvuudesta.

## Uhkamalli (mikä OmniGlyph on)

OmniGlyph on **paikallinen proxy** asiakkaasi (esim. Claude Code) ja
LLM-rajapintojen välissä. Suunnittelun perusteella se näkee kaiken
sessiosi sisällön ja tunnistetietosi siirron aikana. Vastaavat
tietoturvapäätökset:

- **Sitoutuu oletuksena loopback-osoitteeseen** (`127.0.0.1`): kojelaudalla
  ei ole autentikointia ja se tarjoilee talteenotettua sessiokontekstia
  (kuvien lähdeteksti, telemetria). `HOST=0.0.0.0` on nimenomainen
  opt-in, joka altistaa kaiken tämän verkolle — käytä sitä vain
  luotetussa verkossa.
- **Tunnistetiedot**: proxy välittää asiakkaan autentikointiotsikot
  ylävirtaan eikä säilytä niitä. Ympäristömuuttujien kautta annetut
  avaimet (`ANTHROPIC_API_KEY` jne.) pysyvät muistissa.
- **Paikallinen telemetria**: `~/.omniglyph/events.jsonl` sisältää
  pyyntökohtaista metadataa (tokenimäärät, runkohashit) ja 4xx-virheissä
  pakattuja runkonäytteitä — käsittele tiedostoa arkaluontoisena.
- **Kuvitettu sisältö on häviöllistä**: tavan tarkat arvot (salaisuudet,
  hashit) eivät koskaan saa olla riippuvaisia kuvien lukemisesta; putki
  säilyttää ne tekstinä, mutta kultainen sääntö on: älä laita salaisuuksia
  LLM-kontekstiin.
- **Toimitusketju**: `pnpm-workspace.yaml` pakottaa `minimumReleaseAge`-
  arvon 3 päivää kaikille uusille paketeille; ytimellä on vain yksi
  ajonaikainen riippuvuus.

## Tuetut versiot

Vain uusin julkaisulinja (`main` / uusin `v1.x`) saa korjauksia.
