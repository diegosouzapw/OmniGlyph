# Säkerhetspolicy

## Rapportering av sårbarheter

Öppna en privat säkerhetsrådgivning på GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) eller
kontakta underhållaren direkt (diegosouza.pw@outlook.com). Öppna inte ett
offentligt ärende för en utnyttjbar sårbarhet.

## Hotmodell (vad OmniGlyph är)

OmniGlyph är en **lokal proxy** mellan din klient (t.ex. Claude Code) och
LLM-API:erna. Enligt design ser den allt ditt sessionsinnehåll och dina
autentiseringsuppgifter under överföring. Motsvarande säkerhetsbeslut:

- **Binder till loopback som standard** (`127.0.0.1`): instrumentpanelen har
  ingen autentisering och levererar fångad sessionskontext (källtext för
  bilderna, telemetri). `HOST=0.0.0.0` är ett uttryckligt aktivt val och
  exponerar allt detta för nätverket — använd det endast på ett betrott
  nätverk.
- **Autentiseringsuppgifter**: proxyn vidarebefordrar klientens
  autentiseringshuvuden till uppströmssystemet och lagrar dem inte varaktigt.
  Nycklar som tillhandahålls via miljövariabler (`ANTHROPIC_API_KEY` osv.)
  stannar i minnet.
- **Lokal telemetri**: `~/.omniglyph/events.jsonl` innehåller metadata per
  förfrågan (tokenantal, kropp-hashar) och, vid 4xx-fel, komprimerade
  kroppsprover — behandla filen som känslig.
- **Avbildat innehåll är förlustbehäftat**: byte-exakta värden (hemligheter,
  hashar) får aldrig bero på bildläsningar; pipelinen behåller dem som text,
  men den gyllene regeln är: lägg inte hemligheter i LLM-kontexten.
- **Leveranskedja**: `pnpm-workspace.yaml` upprätthåller en
  `minimumReleaseAge` på 3 dagar för varje nytt paket; kärnan har ett enda
  körtidsberoende.

## Versioner som stöds

Endast den senaste utgåvelinjen (`main` / senaste `v1.x`) får fixar.
