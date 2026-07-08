🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Konteksti kuvana

### Leikkaa Claude-laskusi **59–70 %** renderöimällä laaja konteksti tiiviiksi PNG-sivuiksi — sama sisältö murto-osalla tokeneista.

**Mallit laskuttavat tekstiä tokeneittain, mutta kuvan ne laskuttavat sen mittojen perusteella — ei sen mukaan, paljonko tekstiä kuvan sisällä on.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-luvut--mitattu-ei-arvioitu)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-rehellinen-osuus)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Osa [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute)-perhettä · [🌐 Kaikki kielet](../../../docs/i18n/README.md)

</div>

---

# 📊 Luvut — mitattu, ei arvioitu

| mittari | tulos | kuitti |
|---|---|---|
| Kokonaislaskun pieneneminen | **59–70 %** | tuotantojälki, 13 709 pyyntöä |
| Tokenit muunnettua lohkoa kohti | **10× vähemmän** (28 080 merkkiä: 14 040 → 1 460 tokenia) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Laskutuskaavan tarkkuus | residuaali **nolla** 22:ssa `count_tokens`-mittauksessa, 2 mallia × 2 tasoa | `benchmarks/billing-sweep/results/` |
| Tarkka lukutarkkuus, tuotantokonfiguraatio | **30/30 (100 %)** Claude Fable 5:llä | [density frontier](benchmarks/density-frontier/README.md) |
| Hiljaiset konfabulaatiot ~300 lukukokeessa | **0** — jokainen epäonnistuminen pidättäytyy vastaamasta `ILEGIVEL`-merkinnällä | `benchmarks/density-frontier/results/` |

**Mallien tulostaulu** (osaako se lukea tiheitä renderöintejä? n=30 per haara, deterministinen pisteytys):

| malli | lukutarkkuus | tuomio |
|---|---|---|
| Claude **Fable 5** | **100 %** tarkka | ✅ tuotantokohde |
| Claude Opus 4.8 | 77–87 % 4× glyfikoolla | ⚠️ opt-in turvatila (säästöt putoavat ~2×:aan) |
| GPT-5.5 | 0/60 — ja paisuttaa vastauksiaan ~40× yrittäessään | ❌ portin estämä, todistettu |
| Gemini 2.5-flash | 0/26 — ja konfabuloi sen sijaan että pidättäytyisi | ❌ estetty (osittainen testi, kiintiörajoitteinen) |

Etu on **tänään Fable-kohtainen** — muut näkömallit eivät vielä pysty tulkitsemaan tiheitä glyfejä. [Benchmark-työkalu](benchmarks/README.md) testaa minkä tahansa uuden mallin uudelleen yhdellä komennolla.

# 🤔 Miksi OmniGlyph?

Jokainen pitkään käynnissä oleva agenttisessio raahaa mukanaan samaa kuollutta painoa joka pyynnöllä: system prompt, työkaludokumentaatio ja vanha historia — laskutetaan tokeneittain uudelleen joka vuorolla. OmniGlyph on **paikallinen proxy**, joka kirjoittaa nämä laajat osat uudelleen tiiviiksi PNG-sivuiksi *ennen kuin ne lähtevät koneeltasi*:

- **Tarkka laskutusmatematiikka, ei heuristiikkaa** — se laskee palveluntarjoajan todellisen kuvatokenien kaavan (mitattu residuaaliin nolla) ja muuntaa vain silloin, kun matematiikka voittaa.
- **Fail-closed suunnittelultaan** — mallit, jotka eivät osaa lukea tiheitä renderöintejä, estetään portilla, benchmark-kuiteilla varustettuna. Ei hiljaista laadun heikkenemistä.
- **Yksityinen ja paikallinen ensin** — uudelleenkirjoitus tapahtuu osoitteessa `127.0.0.1`; mitään ylimääräistä ei lähetetä minnekään.
- **Toistettavissa** — jokaisella yllä olevalla luvulla on kuitti kansiossa `benchmarks/*/results/`, uudelleenajettavissa yhdellä komennolla.

# ⚡ Pika-aloitus

```bash
npx omniglyph                                     # proxy osoitteessa 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # ohjaa Claude Code sinne
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Toimii molemmin tavoin:
- **API-avain** (maksat per token): laskusi pienenee 59–70 % kokonaisuudessaan.
- **Tilaussessio**: et maksa vähemmän, mutta käyttörajat lasketaan tokeneina — joten rajasi venyvät **~2–3×**.

Kojelauta osoitteessa <http://127.0.0.1:47821/>: säästetyt tokenit, jokainen teksti→kuva-muunnos rinnakkain, katkaisukytkin, mallit livenä. Vastaukset striimataan normaalisti — vain *pyyntö* pakataan, ei koskaan mallin tulostetta.

# 🖥️ Kojelauta

Paketin mukana tulee täysi paikallinen kojelauta — offline, yksitiedostoinen, ei ulkoisia pyyntöjä. Kuusi sivua, jotka päivittyvät livenä SSE:n kautta pyyntöjen virratessa:

![Overview: ohjauskeskuksen KPI-kortit, säästöjen sparkline ja livetapahtumasyöte](../../assets/dashboard-overview.png)

- **Overview** — ohjauskeskus: säästöt %, säästetyt $, latenssi p95, cache hits, virheet, livesyöte.
- **Live Flow** — putki solmukaaviona: client → gate → renderer / passthrough → API, hiukkanen jokaista todellista pyyntöä kohti.
- **Telemetry** — token/$-mittari ja livepyyntöjen aikajana; klikkaa mitä tahansa pyyntöä nähdäksesi tarkalleen, mitkä osat muutettiin kuviksi, ja lue jokaisen sivun taustalla oleva lähdeteksti.
- **Benchmarks** — harness-kuitit renderöitynä kansiosta `benchmarks/*/results/`, yksi rivi per malli·konfiguraatio-koe, ja **aja benchmarkit käyttöliittymästä**: `$0` dry-run-ajot striimaavat tulosteensa livenä; live-ajot pysyvät lukittuina API-avaimesi ja nimenomaisen kustannusvahvistuksen taakse.
- **Sessions / History** — top-sessiot säästettyjen tokenien mukaan ja jokainen levyllä oleva tapahtuma.

| Live Flow | Benchmarks |
|---|---|
| ![Pyyntöputki livenä solmukaaviona](../../assets/dashboard-flow.png) | ![Benchmark-kuitit ja käyttöliittymän dry-runit](../../assets/dashboard-benchmarks.png) |

![Telemetry: mittari ja livepyyntöjen aikajana](../../assets/dashboard-telemetry.png)

# ⚙️ Miten se toimii

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **Laskutus lasketaan tarkasti ennen muuntamista**: Anthropic laskuttaa `⌈w/28⌉ × ⌈h/28⌉ + 4` tokenia kuvaa kohti (28 px paloja — mitattu residuaaliin nolla). Täysi sivu sisältää 28 080 merkkiä 1 460 tokenilla ≈ **19 merkkiä/tokeni**, verrattuna ~2 merkkiä/tokeni tiheälle tekstille. Portti muuntaa vain, kun matematiikka voittaa.
- **Mikä muunnetaan**: staattinen system prompt + työkaludokumentaatio, vanha koottu historia, suuret työkalutulosteet.
- **Mikä ei koskaan muunnu**: viestisi, viimeisimmät vuorot, mallin tuloste, harva proosa, tavan tarkat arvot (hashit/id:t kulkevat mukana tekstinä), sekä mikä tahansa malli, joka epäonnistui lukubenchmarkissa.

# 📚 Kirjastokäyttö (ilman proxya)

Kaikki, mitä proxy tekee jokaiselle pyynnölle, on myös dokumentoitu, tuotava API:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` kiinnittää lohkot tekstiksi; `options.emitRecoverable` palauttaa kuvitettujen lohkojen alkuperäiset versiot. Tarkka laskutusmatematiikka toimitetaan myös paketin juuressa (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — juuri sitä [OmniRoute](https://github.com/diegosouzapw/OmniRoute) käyttää. Puhdas JS-ajoympäristö (Node ja edge/Workers). Koko rajapinta: `src/core/index.ts`.

# 🧭 Rehellinen osuus

- **Se on häviöllistä.** Tavan tarkka muistaminen kuvista on luonteeltaan epäluotettavaa. Toteutetut lieventimet: tarkat tunnisteet kulkevat tekstinä kuvan vieressä, ja mitattu tuotantokonfiguraatio tuotti **nolla hiljaista konfabulaatiota** — epäonnistuneet lukukokeet pidättäytyvät vastaamasta.
- **Vain Fable 5 on hyväksytty tänään**, kuitteineen. GPT-5.5 ja Gemini 2.5-flash eivät mitattavasti pysty lukemaan tiheitä renderöintejä; Opus 4.8 tarvitsee 4× suuremmat glyfit. Portti valvoo tätä.
- **Löysimme ja vältimme laskutusansan**: korkearesoluutioinen kuvataso laskuttaa 3,3× enemmän per sivu, mutta näkömalli ei saa ylimääräistä resoluutiota — suuremmat sivut lukevat *huonommin*. Mitattu, dokumentoitu tiedostossa [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), ei käytössä.
- Hinnat muuttuvat; pysyvä mittari on tokenileikkaus, jonka proxy kirjaa jokaista pyyntöä kohti ilmaista `count_tokens`-vastalukua vasten.

# 🧠 UKK

**Onko 59–70 % koko putken läpi, vai vain niissä pyynnöissä, joihin se kosketti?**
Koko putken läpi — koko lasku. Useimmat pakkaustyökalut raportoivat säästöt vain siitä siivusta, johon ne koskivat, mikä kaunistelee lukua. Meidän nimittäjämme on *jokainen* pyyntö: pienet, jotka portti oikein jätti koskematta, kaikki välimuistikirjoitukset ja -luvut, sekä kaikki tulostetokenit (joita proxy ei koskaan pakkaa). Pelkästään pakattujen pyyntöjen luku on korkeampi ja se ilmoitetaan erikseen, ei koskaan otsikossa.

**Miten säästö mitataan?**
Saman pyynnön molemmat puolet, samalla hetkellä. Jokaiselle `/v1/messages`-POST-pyynnölle proxy ampuu ilmaisen `count_tokens`-koettimen alkuperäiseen pakkaamattomaan runkoon (vastafaktuaali) rinnakkain todellisen välityksen kanssa, ja lukee palveluntarjoajan todella laskuttaman käyttölohkon vastauksesta — molemmat päätyvät samaan tapahtumariviin. Välimuistihinnoittelua sovelletaan identtisesti molempiin puoliin, joten välimuistialennus kumoutuu eikä sitä voida laskea kahteen kertaan "säästöksi". Kaava löytyy tiedostosta `src/core/baseline.ts`; johda se uudelleen omasta tapahtumalokistasi.

**Miksi virhelyönti olisi konfabulaatio eikä lukuvirhe?**
Koska mallin näkökyky ei ole OCR: sivusta tulee palasupotuksia (patch embeddings), ei koskaan erillisiä merkkejä, joten yksittäisen glyfin luotettavuutta ei ole, jolle voisi epäonnistua äänekkäästi — kun pikselit eivät riitä määrittämään glyfiä, kielimalli täyttää aukon jollain uskottavalla. Juuri tämän mekanismin takia OmniGlyph on fail-closed sen suhteen: tavan tarkat arvot kulkevat aina tekstinä kuvan vieressä, mallit jotka lukevat väärin estetään portilla, ja mitattu tuotantokonfiguraatio tuotti **nolla** hiljaista konfabulaatiota noin 300 lukukokeessa — epäonnistuneet lukukokeet pidättäytyvät vastaamasta.

**Entä tavan tarkka työ (hashit, id:t, salaisuudet)?**
Viimeisimmät vuorot ja tarkat tunnisteet pysyvät tekstinä suunnittelun mukaan. Työkuormille, jotka ovat *kokonaan* tavan tarkkoja, ohjaa ne mallille, joka ei ole sallittujen listalla (esim. toinen Claude-malli alaagentissa) — kaikki sallitun listan ulkopuolella kulkee läpi tavan tarkasti, koskemattomana.

**Eikö DeepSeek-OCR jo ratkaissut, toimiiko tämä?**
Se todisti, että *kanava* toimii — koodaaja/dekoodaaja-parilla, joka on koulutettu juuri siihen tehtävään. Epäily on peräisin ajalta, jolloin mikään valmis tuotantomalli ei osannut lukea tiheitä renderöintejä; se on muuttunut, ja yllä oleva [mallien tulostaulu](../../../README.md#-the-numbers--measured-not-estimated) näyttää tarkalleen, ketkä osaavat lukea niitä tänään, kuitteineen. [Benchmark-työkalu](../../../benchmarks/README.md) testaa minkä tahansa uuden mallin uudelleen yhdellä komennolla — portti seuraa dataa, ei hypeä.

# 🔬 Toista jokainen luku

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Täysi metodologia ja jokainen tulostaulukko: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Raa'at vastauskohtaiset kuitit: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute-perhe

OmniGlyph toimii myös **natiivina pakkausmoottorina [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-järjestelmän sisällä** — ilmaisessa AI-yhdyskäytävässä. Siellä se ajaa `omniglyph`-moottorina (itsenäinen yksittäistila tai pinottuna muiden moottoreiden kanssa), fail-closed-porteilla ja kuvatietoisella tokenilaskennalla.

# 🛠️ Teknologiapino

| kerros | teknologia |
|---|---|
| Kieli | TypeScript (strict), ESM |
| Ajoympäristö | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Renderöinti | oma 1-bittinen glyfiatlas (Spleen/Unifont-johdannainen, lisenssit kansiossa `assets/`) → PNG |
| Testit | Vitest — TDD, sekä docs-integrity- ja rebrand-vartijat |
| Benchmarkit | `benchmarks/`-työkalut (billing-sweep, density-frontier) JSONL-kuiteilla |

## Projektin rakenne

| polku | mitä |
|---|---|
| `src/` | proxy: muunnosputki, tarkka laskutus per palveluntarjoaja, renderöijä, hostit (Node + Cloudflare Workers) |
| `benchmarks/` | työkalut, jotka tuottivat jokaisen yllä olevan luvun — uudelleenajettavissa |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Tuki ja yhteisö

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — bugit ja ominaisuuspyynnöt
- 🔒 [SECURITY.md](SECURITY.md) — haavoittuvuusraportit
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — tiukka TDD + mittaus ennen väitteitä
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 Kiitokset

OmniGlyph seisoo erityisesti yhden projektin harteilla — tämä osio on pysyvä kiitoksemme.

| Projekti | Miten se muovasi OmniGlyphia |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Löytö, jolle koko tämä projekti on rakennettu.** pxpipe todisti, kuitteineen, että tuotantokäytössä olevan LLM:n näkökanava voi kuljettaa tiheää tekstuaalista kontekstia murto-osalla tokenikustannuksesta — ja että muunnos on päätettävä pyyntökohtaisesti tarkalla laskutusmatematiikalla, ei fiiliksellä. Tiheä 1-bittinen renderöinti, kannattavuusportti, `count_tokens`-vastafaktuaali, fail-closed-mallien sallittu lista ja "mittaa ennen kuin väität" -dokumentaatiokulttuuri kaikki syntyivät siellä. OmniGlyph polveutuu suoraan siitä koodikannasta (MIT — alkuperäinen tekijänoikeusrivi säilyy [LICENSE](../../../LICENSE)-tiedostossamme). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 5×8-bittikarttafonttiperhe, josta tiheä 1-bittinen glyfiatlaamme on johdettu (lisenssi kansiossa `assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Kattavuus glyfeille Spleenin alueen ulkopuolella samassa atlaassa (lisenssi kansiossa `assets/`). |

Jos OmniGlyph on sinulle hyödyllinen, käy tähdittämässä myös alkuperäinen projekti — löytö oli heidän. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Lisenssi

MIT — katso [LICENSE](../../../LICENSE).
