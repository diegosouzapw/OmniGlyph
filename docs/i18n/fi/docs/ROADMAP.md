# Forkin tiekartta — "meidän OmniGlyphimme" + OmniRoute-integraatio

Koottu työsuunnitelma (2026-07-05) lähteistä: mitattu laskutuspyyhkäisy,
OpenAI/Gemini-audit virallista dokumentaatiota vasten, sukulaistyökalujen
analyysi ja density-frontier-työkalu. Kunkin kohdan tila: ☐ odottaa · ◐ osittain · ☑ valmis tässä repossa.

## Vaihe 0 — Mittausperusta (VALMIS tässä repossa)

- ☑ Tarkka Anthropic-laskutus (28px-paloja, 2 tasoa, +4/lohko) — `src/core/anthropic-vision.ts`, pyyhkäisy kansiossa `benchmarks/billing-sweep/`.
- ☑ Kannattavuusportti tarkalla kustannuksella (korvasi w·h/750 × 1.10:n).
- ☑ Tasokohtainen geometria: Fable/Opus 4.8/Sonnet 5 → 1928×1928-sivut (3,3× vähemmän kuvia); standard → 1568×728. 691 testiä vihreänä.
- ☑ `benchmarks/density-frontier/`-työkalu (offline-kustannus × tarkkuus API:n kautta, neulat hämäävillä häiriötekijöillä, deterministinen pisteytys).

## Vaihe 1 — Monipalveluntarjoajaiset laskutuskorjaukset (auditissa vahvistetut bugit)

Prioriteetti auditin asettama (viralliset dokumentit talteenotettu 2026-07-05):

1. ☐ **D2 (KÄÄNTEINEN portti)**: `gpt-4o-mini` osuu oletuslaattaan 85/170, mutta maksaa **2833 perus / 5667 per laatta** (~33× aliarvioitu, ~0,8 merkkiä/tokeni) — sen kuvittaminen on aina tappiollista ja portti hyväksyy sen silti. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` lähetetään ehdoitta (`src/core/openai.ts:392,402`), mutta sitä on olemassa vain gpt-5.4+:ssa; johdetaan se profiilista.
3. ☐ **D1**: `o4-mini`-kerroin 1.62 → **1.72** (aliarvioi 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` ovat palakorissa, jonka **katto on 1536 ilman `original`-tilaa** (koodi olettaa 10000:n); `gpt-5-codex-mini` on väärässä regiimissä (laatta → pala).
5. ☐ **GPT-geometria**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (linjassa MOLEMPIEN regiimien kanssa: 64×32 palaa ja 4×512 laattaa; +6,25 % ilmaisia merkkejä). Oma 5.4/5.5 `original`-profiili: jopa 1568×5984 (9 163 palaa ≤ 10k, ~233k merkkiä yhdessä lohkossa) — luettavuus-A/B ensin.
6. ☐ **Gemini-tuki** (uusi): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`-reitit proxyssä. Dokumentoitavissa oleva geometria: **1152×1536 (tarkka rajausyksikkö 768, 4 laattaa, 42,2 merkkiä/tokeni — kolmen palveluntarjoajan paras dokumentoitu suhde)**; kalibroitavat vedot: 768² `media_resolution:MEDIUM`-tilalla (56,4) ja Gemini 3 HIGH. Varoitus: Geminin OpenAI-yhteensopiva päätepiste kulkisi OpenAI-muuntajan kautta väärällä laskutuksella.

## Vaihe 2 — Lukulaatu (density-frontier-työkalu tuomarina)

- ◐ Ratkaiseva std vs. high-res A/B Fablella (käynnissä; raja: gist == teksti JA nolla hiljaista väärää vastausta JA säästö > 0).
- ☐ Ratkaise AA vs. 1-bit -ristiriita tiheässä renderöintipolussa (koodi sanoo "eval-only", tuotanto käyttää AA:ta).
- ☐ (SIIRRETTY perusteluineen 2026-07-06) Glyfikirurgia: tuotantokonfiguraatio lukee 30/30 — kirurgialla ei ole tänään mitattavaa virhettä korjattavana. Otetaan uudelleen käsittelyyn, jos alle 100 %:n tavoite tulee mukaan (esim. Opus) tai jos uudet mittaukset osoittavat taantumaa.
- ☑ ~~Vaalean teeman A/B~~ RATKAISTU tarkastelulla (2026-07-06): renderöinti ON JO musta valkoisella (render.ts:635/822, blitin jälkeinen inversio) — linjassa kirjallisuuden kanssa; hypoteesi syntyi väärästä lähtökohdasta (upstream-esimerkkikuva).
- ☐ Sanalista tarkistussummalla tavan tarkoille id:ille (upstream #38, tuettu) + pidättäytymisbanneri (#31/#32) + camelCase faktalehdessä (#33/#34).
- ☑ Portti #45: $schema/$id säilytetty, tuplet poistettu elementeittäin (commit mainissa).
- ☑ Uudelleenyritys kieltäytymisellä (#37/H11): häviötön toistotunnistin + yksi uudelleenyritys alkuperäisellä rungolla; refusalRetried-telemetria (commit mainissa).
- ☐ Rehydraatiotyökalu (`RecoverableBlock` → kutsuttava työkalu; LensVLM validoi valikoivan uudelleenlaajennuksen).

## Vaihe 3 — Suorituskyky/vakaus

- ☐ LRU-renderöintivälimuisti (deterministinen invariantin perusteella; slab + jäädytetyt lohkot renderöityvät uudelleen joka pyynnöllä tänään).
- ☐ PNG-koodaus worker-säikeessä; säädettävä deflate-taso.
- ☐ Avoimien upstream-korjausten porttaus: #44 (typatut natiivit työkalut → 400), #45 (schema-strip draft-07 → 400-silmukka), #42 (CONNECT-proxy Claude Desktopille), #19 (GPT-kuvausten kaksinkertainen laskutus).
- ☐ Toteuta ADAPTIVE_CPT_PLAN (cpt lohkon roolin mukaan; todellinen slab = 1,50).

## Vaihe 4 — Itse fork

- ☐ Oma nimi/repo (Diegon päätös) + upstream `git remote` cherry-pickejä varten.
- ☐ **TS kaikkialla**: ydin on jo TS:ää, muunnetaan `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (kaava: tsx + vitest; `benchmarks/density-frontier/` syntyi jo näin).
- ☐ OmniRoute-laatustandardi: eslint 9 + prettier, CI typecheckillä/testeillä/buildilla/linkkitarkistuksella, CONTRIBUTING, SECURITY, README i18n (pt-BR ensin), semanttinen CHANGELOG.
- ☐ **GIF:t videoiden sijaan** README:ssä (tallennetaan vhs:llä/asciinema+agg:lla; rinnakkain paljas vs. proxy).
- ☐ Kojelauta v2 (uudelleentoteutus HTTP-API:n kautta — ei periytetä kolmannen osapuolen koodia): "avaa terminaali ANTHROPIC_BASE_URL:lla" -käynnistin, "kulkeeko liikenne minun kauttani?" -tarkistus, kuva-vs-teksti-tarkastelija, sessiot, kustannuspaneeli valuutassa, kevyt i18n, SSE pollauksen sijaan, SQLite-pysyvyys säilytysajalla (sen 24-sarakkeinen skeema on hyvä lähtökohta).
- ☐ Mikroideoita dense-image-genistä: `lines`-tila (asettelu säilytetty koodille/taulukoille), `--keep-ws`, sivukohtainen alkuperäotsikko ("system prompt" / "tool docs" / "history turn N"), itsenäinen CLI `render arquivo.md -o out.png`.

## Vaihe 5 — Portti OmniRouteen

- ☐ `CompressionEngine`-moottori (`cavemanAdapter.ts`-malli), rekisteröity kansioissa `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Putkitus: välitä `supportsVision` tiedostossa `chatCore.ts:1297` (1 rivi) tai ratkaise `isVisionModelId`:n kautta.
- ☐ Pinon järjestys: viimeisenä (RTK/Caveman/semanttiset renderöijät ensin; OmniGlyph kuvittaa jäännöksen).
- ☐ Invariantit: älä koskaan kirjoita uudelleen lohkoja asiakkaan `cache_control`-merkinnällä (oppitunti #4560); uskollisuusportti (#5127) tarvitsee ilmoitetun poikkeuksen tai tekstifaktalehden, joka täyttää invariantit; yritystelemetria `skip_reason`-kentällä (oppitunti #4268).
- ☐ Reititys: moottorin jälkeisen fallbackin/uudelleenyrityksen täytyy kunnioittaa näkökykyä ja sallittujen listaa (uudelleenpakkaa tai ohita).
- ☐ CCR-synergia: `emitRecoverable` → CCR-varasto lohkokohtaisella haulla (`head/tail/grep`, #5187) = täysi valikoiva uudelleenlaajennus.
- ☐ Ilmaistason venyttäminen markkinointiominaisuutena: jokainen ilmaistason tokeni tuottaa ~2-3× enemmän merkkejä näkömalleilla; Geminin ilmaistaso + 1152×1536-geometria on vahvin tapaus.

## Avoimet riskit

- Fable-kieltäytymiset uudelleendeployn jälkeen kuvitetussa kontekstissa (upstream #37) — lievennä ennen oletusarvoisesti päällä olevaa tilaa OmniRoutessa.
- Hinta-arbitraasi: jos Anthropic hinnoittelee näkökyvyn uudelleen, säästöt muuttuvat — pyyntökohtainen vastaluku (`count_tokens`) on puolustus.
- OpenAI: yhteisön mittaus (PageWatch) näki completion-tokenien nousevan ja 2× viiveen — mittaa palveluntarjoajakohtaisesti ennen käyttöönottoa.

## A/B-tulokset 2026-07-05 (OpenRouterin kautta — RATKAISEMATON geometrialle, pätevä epäonnistumismalleille)

| konfiguraatio | sanatarkka | pidätt. | suodatettu | hiljainen väärä |
|---|---|---|---|---|
| fable std 5×8 (AA ja 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 ennustettu) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 ennustettu) |
| opus hires 10×16 | **7/9 luettu** | 0 | 21 ilman krediittejä | 2 (numero) |

Päteviä havaintoja: (1) luokittelija (issue #37) on DOMINOIVA epäonnistumismalli
transkriptiokysymyksille standardisivulla — 100 % suodatettu — eikä laukea
suurella sivulla; sanamuoto vaikuttaa. (2) Pidättäytyminen toimii: 20×
ILEGIVEL vs. 5 konfabulaatiota suurella sivulla. (3) Opus 10×16:lla lukee 78 %
tarkasti (n=9) vs. 0 % historiallisesti 5×8:lla — ensimmäinen suorakäden
todiste polvipisteestä. (4) Suuren sivun luettamattomuus OpenRouterin kautta
viittaa siirtotason UUDELLEENNÄYTTEISTYKSEEN (Bedrock/Vertex-standarditaso?)
— ratkaiseva hypoteesi testattavaksi Anthropicin suoralla API:lla; geometria-A/B
pysyy AVOIMENA siihen asti. OpenRouter-krediitit loppuivat kesken Opus-haaran.

## Lopullinen 2×2-matriisi (2026-07-05, CLI:n/tilauksen kautta, Fable 5, n=30/haara)

| sivu × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 pidätt. |
| high-res 1928×1928 | **20/30 (67 %)** + 10 pidätt. | 0/30 + 29 pidätt. |

Nolla konfabulaatiota kaikissa 4 haarassa (120 kysymystä — jokainen
epäonnistuminen oli ILEGIVEL). SOVELLETTU: DENSE_RENDER_STYLE käännetty
1-bittiin (aa:false) pinnattuna tiedostossa tests/dense-style.test.ts.
Opus 4.8: 26/30 10×16:lla suurella sivulla, 30/30 ILEGIVEL 5×8:lla — Opuksen
turvatila elinkelpoinen. High-res-sivu pysyy heikentyneenä siirtojen takia
(CLI Read/OpenRouter-uudelleennäytteistys); WYSIWYG-geometrian tuomio riippuu
edelleen suorasta API:sta.
