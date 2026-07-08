# Bezpečnostní politika

## Hlášení zranitelností

Otevřete soukromé bezpečnostní hlášení (security advisory) na GitHubu
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) nebo
kontaktujte správce přímo (diegosouza.pw@outlook.com). Neotvírejte
veřejný issue pro zneužitelnou zranitelnost.

## Model hrozeb (čím OmniGlyph je)

OmniGlyph je **lokální proxy** mezi vaším klientem (např. Claude Code) a
LLM API. Ze své podstaty vidí veškerý obsah vaší relace i vaše přihlašovací
údaje v přenosu. Odpovídající bezpečnostní rozhodnutí:

- **Ve výchozím stavu se váže na loopback** (`127.0.0.1`): dashboard nemá
  žádnou autentizaci a obsluhuje zachycený kontext relace (zdrojový text
  obrázků, telemetrii). `HOST=0.0.0.0` je výslovné opt-in a vystavuje toto
  vše síti — používejte to pouze na důvěryhodné síti.
- **Přihlašovací údaje**: proxy předává klientovy autentizační hlavičky
  upstreamu a nepersistuje je. Klíče dodané přes env
  (`ANTHROPIC_API_KEY` atd.) zůstávají v paměti.
- **Lokální telemetrie**: `~/.omniglyph/events.jsonl` obsahuje metadata
  jednotlivých requestů (počty tokenů, hashe těl) a při chybách 4xx
  komprimované vzorky těl — zacházejte s tímto souborem jako s citlivým.
- **Vykreslený obsah je ztrátový**: hodnoty přesné na bajt (tajemství,
  hashe) nesmí nikdy záviset na čtení z obrázku; pipeline je udržuje jako
  text, ale zlaté pravidlo zní: nedávejte tajemství do kontextu LLM.
- **Dodavatelský řetězec**: `pnpm-workspace.yaml` vynucuje `minimumReleaseAge`
  3 dny pro jakýkoli nový balíček; jádro má jedinou runtime závislost.

## Podporované verze

Opravy dostává pouze nejnovější řada vydání (`main` / nejnovější `v1.x`).
