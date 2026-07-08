# Sikkerhetspolicy

## Rapportering av sårbarheter

Åpne en privat sikkerhetsvarsling på GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) eller
kontakt vedlikeholderen direkte (diegosouza.pw@outlook.com). Ikke åpne en
offentlig sak for en utnyttbar sårbarhet.

## Trusselmodell (hva OmniGlyph er)

OmniGlyph er en **lokal proxy** mellom klienten din (f.eks. Claude Code) og
LLM-API-ene. Etter design ser den alt innholdet i økten din og
legitimasjonen din under overføring. De tilhørende sikkerhetsbeslutningene:

- **Binder til loopback som standard** (`127.0.0.1`): dashbordet har ingen
  autentisering og serverer fanget øktkontekst (kildetekst til bildene,
  telemetri). `HOST=0.0.0.0` er en eksplisitt opt-in og eksponerer alt dette
  til nettverket — bruk det kun på et betrodd nettverk.
- **Legitimasjon**: proxyen videresender klientens auth-headere til
  oppstrømstjenesten og lagrer dem ikke. Nøkler tilført via miljøvariabler
  (`ANTHROPIC_API_KEY` osv.) holdes i minnet.
- **Lokal telemetri**: `~/.omniglyph/events.jsonl` inneholder per-forespørsel-
  metadata (tokenantall, kroppshasher) og, ved 4xx-feil, komprimerte
  kroppsprøver — behandle filen som sensitiv.
- **Avbildet innhold er tapsbringende (lossy)**: byte-eksakte verdier
  (hemmeligheter, hasher) må aldri avhenge av bildelesninger; pipelinen
  beholder dem som tekst, men gyldenregelen er: ikke legg hemmeligheter i
  LLM-kontekst.
- **Forsyningskjede**: `pnpm-workspace.yaml` håndhever en
  `minimumReleaseAge` på 3 dager for enhver ny pakke; kjernen har én enkelt
  kjøretidsavhengighet.

## Støttede versjoner

Kun den nyeste utgivelseslinjen (`main` / nyeste `v1.x`) mottar rettelser.
