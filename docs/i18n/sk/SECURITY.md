# Bezpečnostná politika

## Hlásenie zraniteľností

Otvorte súkromné bezpečnostné odporúčanie (security advisory) na GitHube
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) alebo
kontaktujte udržiavateľa priamo (diegosouza.pw@outlook.com). Neotvárajte
verejný issue pre zneužiteľnú zraniteľnosť.

## Model hrozieb (čo je OmniGlyph)

OmniGlyph je **lokálny proxy** medzi vaším klientom (napr. Claude Code) a
LLM API. Podľa dizajnu vidí celý obsah vašej session a vaše prihlasovacie
údaje počas prenosu. Zodpovedajúce bezpečnostné rozhodnutia:

- **V predvolenom nastavení sa viaže na loopback** (`127.0.0.1`): dashboard
  nemá autentifikáciu a poskytuje zachytený kontext session (zdrojový text
  obrázkov, telemetria). `HOST=0.0.0.0` je explicitný opt-in a vystavuje toto
  všetko sieti — používajte iba na dôveryhodnej sieti.
- **Prihlasovacie údaje**: proxy preposiela klientske autentifikačné hlavičky
  upstreamu a neukladá ich trvalo. Kľúče poskytnuté cez premenné prostredia
  (`ANTHROPIC_API_KEY` atď.) zostávajú v pamäti.
- **Lokálna telemetria**: `~/.omniglyph/events.jsonl` uchováva metadáta na
  požiadavku (počty tokenov, hashe tela) a pri 4xx chybách komprimované
  vzorky tela — považujte tento súbor za citlivý.
- **Obrázkovaný obsah je stratový**: hodnoty na úrovni bajtov (tajomstvá,
  hashe) sa nikdy nesmú spoliehať na čítanie z obrázkov; pipeline ich
  zachováva ako text, ale zlaté pravidlo znie: nedávajte tajomstvá do LLM
  kontextu.
- **Dodávateľský reťazec**: `pnpm-workspace.yaml` vynucuje `minimumReleaseAge`
  3 dni pre akýkoľvek nový balík; jadro má jedinú runtime závislosť.

## Podporované verzie

Iba najnovšia vydaná línia (`main` / najnovšia `v1.x`) dostáva opravy.
