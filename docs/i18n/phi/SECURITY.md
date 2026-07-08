# Patakaran sa Seguridad

## Pag-uulat ng mga vulnerability

Magbukas ng pribadong security advisory sa GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) o
direktang kontakin ang maintainer (diegosouza.pw@outlook.com). Huwag
magbukas ng pampublikong issue para sa isang vulnerability na maaaring
mapagsamantalahan.

## Threat model (ano ang OmniGlyph)

Ang OmniGlyph ay isang **lokal na proxy** sa pagitan ng iyong client (hal.
Claude Code) at ng mga LLM API. Sadyang nakikita nito ang lahat ng nilalaman
ng iyong session at ang iyong mga kredensyal habang dumadaan. Ang mga
kaugnay na desisyon sa seguridad:

- **Naka-bind sa loopback bilang default** (`127.0.0.1`): walang
  authentication ang dashboard at nagsisilbi ng na-capture na konteksto ng
  session (source text ng mga imahe, telemetry). Ang `HOST=0.0.0.0` ay
  tahasang opt-in at inilalantad ang lahat ng iyon sa network — gamitin
  lamang ito sa isang pinagkakatiwalaang network.
- **Mga kredensyal**: ipinapasa ng proxy ang mga auth header ng client
  papunta sa upstream at hindi ito iniimbak. Ang mga key na ibinigay sa
  pamamagitan ng env (`ANTHROPIC_API_KEY` atbp.) ay nananatili sa memory.
- **Lokal na telemetry**: hawak ng `~/.omniglyph/events.jsonl` ang metadata
  kada request (token counts, body hashes) at, sa 4xx na error, mga
  compressed body sample — ituring ang file na ito bilang sensitibo.
- **Lossy ang na-image na nilalaman**: ang byte-exact na mga value (secrets,
  hashes) ay hindi dapat kailanman umasa sa pagbasa ng imahe; pinapanatili
  ito ng pipeline bilang text, ngunit ang gintong tuntunin ay: huwag maglagay
  ng secrets sa LLM context.
- **Supply chain**: ipinapatupad ng `pnpm-workspace.yaml` ang isang
  `minimumReleaseAge` na 3 araw para sa anumang bagong package; ang core ay
  may iisang runtime dependency.

## Mga sinusuportahang bersyon

Ang pinakabagong release line lamang (`main` / pinakabagong `v1.x`) ang
tumatanggap ng mga ayos.
