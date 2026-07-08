# Sikkerhedspolitik

## Rapportering af sårbarheder

Åbn en privat sikkerhedsrapport (security advisory) på GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) eller
kontakt vedligeholderen direkte (diegosouza.pw@outlook.com). Opret ikke en
offentlig issue for en udnyttelig sårbarhed.

## Trusselsmodel (hvad OmniGlyph er)

OmniGlyph er en **lokal proxy** mellem din klient (f.eks. Claude Code) og
LLM-API'erne. Ved design ser den alt dit sessionsindhold og dine legitimationsoplysninger
under overførsel. De tilsvarende sikkerhedsbeslutninger:

- **Binder til loopback som standard** (`127.0.0.1`): dashboardet har ingen
  autentificering og serverer indfanget sessionskontekst (kildetekst til
  billederne, telemetri). `HOST=0.0.0.0` er et eksplicit tilvalg og eksponerer alt
  dette til netværket — brug det kun på et betroet netværk.
- **Legitimationsoplysninger**: proxyen videresender klientens auth-headers til
  upstream og gemmer dem ikke. Nøgler leveret via env
  (`ANTHROPIC_API_KEY` osv.) forbliver i hukommelsen.
- **Lokal telemetri**: `~/.omniglyph/events.jsonl` indeholder metadata per forespørgsel
  (tokenoptællinger, body-hashes) og, ved 4xx-fejl, komprimerede body-prøver —
  behandl filen som følsom.
- **Billeddannet indhold er lossy**: byte-nøjagtige værdier (hemmeligheder, hashes) må aldrig
  afhænge af billedlæsninger; pipelinen bevarer dem som tekst, men den gyldne regel
  er: put ikke hemmeligheder i LLM-konteksten.
- **Forsyningskæde**: `pnpm-workspace.yaml` håndhæver en `minimumReleaseAge` på
  3 dage for enhver ny pakke; kernen har én enkelt runtime-afhængighed.

## Understøttede versioner

Kun den nyeste udgivelseslinje (`main` / seneste `v1.x`) modtager rettelser.
