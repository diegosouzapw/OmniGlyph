# Muutosloki

Muoto: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semanttinen versiointi.

## [1.0.0] — 2026-07-07

Ensimmäinen julkinen julkaisu.

### Tuote

- **Konteksti kuvana -pakkausproxy**: kirjoittaa jokaisen LLM-pyynnön laajat
  osat (system prompt, työkaludokumentaatio, vanha historia, suuret
  työkalutulosteet) uudelleen tiiviiksi 1-bittisiksi PNG-sivuiksi ennen kuin
  ne lähtevät koneeltasi. Paikallinen Node-palvelin ja Cloudflare
  Workers -host.
- **Tarkka palveluntarjoajakohtainen laskutusmatematiikka** (`src/core/`):
  Anthropic 28px-paloja + 3–4 tokenia/lohko-yleiskustannus (oma mittaus,
  nolla residuaali), OpenAI- ja Gemini-kaavat auditoitu virallista
  dokumentaatiota vasten. Viety pakettijuuresta
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, tasokatot).
- **Mitattu tuotantorenderöintikonfiguraatio**: tiheä 1-bittinen glyfiatlas
  (ei antialiasointia), standarditason sivut — jokainen valinta tuettu
  benchmark-kuitilla kansiossa `benchmarks/*/results/`.
- **Benchmark-työkalut** (`benchmarks/`): billing-sweep (tokenilaskenta) ja
  density-frontier (lukutarkkuuden rintama malleittain/tiheyksittäin),
  uudelleenajettavissa API:n, OpenRouterin, Claude Code CLI:n tai OmniRouten
  kautta (`--via-omniroute`).
- **Kieltäytymisen uudelleenyritys**: SSE/JSON-tunnistin toistaa
  alkuperäisen pyynnön, kun malli kieltäytyy renderöidystä sivusta
  (katkaisukytkin `retryRefusalWithOriginal`).
- **LRU-renderöintivälimuisti** deterministisille sivuille.
- **OmniRoute-moottori**: toimii `omniglyph`-pakkausmoottorina
  [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-järjestelmässä
  (yksittäistila ja pinottu putki), fail-closed-porteilla ja
  kuvatietoisella tokenilaskennalla.

### Luvut (kaikki toistettavissa)

- Esimerkki-UI-renderöinti: 1015 merkkiä → 438×120 PNG, 254 → 84 tokenia
  (**66,9 % säästetty**).
- Standardisivu 1568×728 = 1456 kuvatokenia riippumatta siitä, paljonko
  tekstiä se sisältää.
- Claude lukee tiheät 1-bittiset sivut 100 % tarkkuudella
  tuotantotiheydellä; Opus 4.8 lukee 77–87 % tiheydellä 10×16.

### Kielteiset päätökset (mitattu, ei mielipiteitä)

- **Korkearesoluutiotaso on laskutusansa**: 1928²-sivu laskutetaan
  WYSIWYG-periaatteella, mutta malli ei saa täyttä resoluutiota — molemmat
  tasot renderöivät standardisivut.
- **GPT-5.5 hylätty**: 0/60 lukua tiheästä liuskasta ja ~40× tulosteen
  paisuminen verrattuna tekstikontrolliin.
- **gpt-4o-mini ei koskaan kuvitettu** (2833/5667 tokenin lattia tekee siitä
  kannattamattoman).
- **Gemini 2.5-flash konfabuloi** sen sijaan että pidättäytyisi vastaamasta
  tiheillä sivuilla (0/26) — odottaa uudelleentestausta maksullisella
  kiintiöllä.
