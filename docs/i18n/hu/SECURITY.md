# Biztonsági szabályzat

## Sebezhetőségek bejelentése

Nyisson egy privát biztonsági közleményt a GitHubon
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) vagy
lépjen kapcsolatba közvetlenül a karbantartóval
(diegosouza.pw@outlook.com). Ne nyisson nyilvános issue-t egy kihasználható
sebezhetőségre.

## Fenyegetési modell (mi az OmniGlyph)

Az OmniGlyph egy **helyi proxy** az Ön kliense (pl. Claude Code) és az
LLM-API-k között. Tervezésénél fogva látja a teljes munkamenet-tartalmat és a
hitelesítő adatait átvitel közben. A kapcsolódó biztonsági döntések:

- **Alapértelmezésben a loopback-hoz kötődik** (`127.0.0.1`): az
  irányítópultnak nincs hitelesítése, és rögzített munkamenet-kontextust
  szolgál ki (a képek forrásszövege, telemetria). A `HOST=0.0.0.0` explicit
  opt-in, és ezt mindezt kiteszi a hálózatnak — csak megbízható hálózaton
  használja.
- **Hitelesítő adatok**: a proxy továbbítja a kliens hitelesítési fejléceit
  a upstream felé, és nem tartja meg őket. A környezeti változókon keresztül
  megadott kulcsok (`ANTHROPIC_API_KEY` stb.) memóriában maradnak.
- **Helyi telemetria**: a `~/.omniglyph/events.jsonl` kérésenkénti
  metaadatokat tárol (token-számok, body-hash-ek), és 4xx hibák esetén
  tömörített body-mintákat — kezelje a fájlt érzékenyként.
- **A képesített tartalom veszteséges**: a byte-pontos értékek (titkok,
  hash-ek) soha nem függhetnek képolvasástól; a pipeline szövegként tartja
  meg őket, de az aranyszabály: ne tegyen titkokat az LLM kontextusba.
- **Ellátási lánc**: a `pnpm-workspace.yaml` 3 napos `minimumReleaseAge`-t
  kényszerít ki minden új csomagra; a mag egyetlen futásidejű függőséggel
  rendelkezik.

## Támogatott verziók

Csak a legutóbbi kiadási sor (`main` / legfrissebb `v1.x`) kap javításokat.
