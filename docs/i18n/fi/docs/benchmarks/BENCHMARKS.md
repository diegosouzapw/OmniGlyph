# OmniGlyph — Kootut mittaukset (2026-07-05)

🌐 Käännetty: [kaikki kielet](../../../README.md)

Kaikki tässä sessiossa MITATTU, lähteineen ja n-arvoineen; hypoteesit
erikseen selkeästi merkittynä lopussa. Kuitit: `benchmarks/billing-sweep/results/`
ja `benchmarks/density-frontier/results/` (JSONL per vastaus).

## TL;DR — koko tulos kahdessa palkissa

**Kustannus** — yksi standardi 1568×728-sivu sisältää 28,080 merkkiä
kiinteällä 1,460 tokenilla; sama teksti raakana lähetettynä maksaa ~10×
enemmän:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Tarkkuus** — mutta vain silloin, kun malli todella lukee sivun. Portti on
fail-closed; vain ✅-rivi menee tuotantoon:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Tämän dokumentin loppuosa on kuitit näiden kahden palkin takana.

## 1. Anthropic-laskutus (suora count_tokens, $0, 11 geometriaa × 2 mallia)

Vahvistettu kaava: `tokens = ceil(w/28) × ceil(h/28)` tasokohtaisen
uudelleenkoon jälkeen, **+3/lohko (Fable 5) / +4/lohko (Sonnet 4.5)** — NOLLA
residuaali jokaisella rivillä.

| probe | dims | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc anchor | 1092×1092 | 1524 | 1525 |
| doc anchor | 1000×1000 | 1299 | 1300 |
| standard page | 1568×728 | 1459 | 1460 |
| **large page** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res ceiling | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res long edge | 2576×1204 | 3959 | 1516 |
| tall strip | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NOT rejected in count_tokens) | 3585 |

Johdetut päätökset (toteutettu): tarkka pala-kohtainen portti; malli-
kohtainen taso (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols`
313→312.

## 2. Lukutarkkuus (density-frontier, hex/camelCase/numero-neulat ja häiriötekijät)

### Fable 5 2×2-matriisi — via CLI/subscription, n=30/arm, sama korpus (~16.6k merkkiä)

| sivu × atlas | tarkka | pidättäytymiset (ILEGIVEL) | hiljaiset virheet |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (matriisin ennustama) |

→ **1-bit > AA molemmilla sivuilla; nolla konfabulaatiota 120 kysymyksessä.**
SOVELLETTU: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res saapuu siirtotason uudelleennäytteistyksen heikentämänä (katso H1/H3) —
67% on lattia, ei katto.

### Opus 4.8 — via CLI/subscription, n=30/arm

| konfiguraatio | tarkka | pidättäytymiset | virheet |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (numerot) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opuksen polvipiste vahvistettu omalla n:llä (upstream mittasi 95% 10×16:lla
n=20:llä). "Opuksen turvatila" on elinkelpoinen: 10×16 suurella sivulla ≈ 1.7
merkkiä kuvatokenia kohti työkalun korpuksessa.

### OpenRouterin kautta (sama korpus/kysymykset) — ratkaisematon luettavuudelle

| mitattu fakta | luku |
|---|---|
| content_filter transkriptiokysymyksissä (standardisivut) | 60/60 (100%) |
| content_filter high-res-sivuilla | 5-6/30 (~20%) |
| Fable high-res: pidättäytymiset + virheet | 20 ILEGIVEL + 5 virhettä (2 ennustettu) |
| Opus 10×16 (ennen krediittien loppumista) | 7/9 tarkka (78%) |
| konfusaatiomatriisin ennustamat virheluvut | 4→a, 0→8, S/s-tapaus |

### Siirtotapojen vertailu (sama kysymys, sama sisältö)

| siirtotapa | suodatus/kieltäytyminen | suuri sivu luettavissa? |
|---|---|---|
| Suora API (n=9, ennen krediittien loppumista) | 0 | ei testattu |
| OpenRouter | ~100% std / ~20% hi-res | ei (epäilty: uudelleennäytteistys) |
| Claude Code CLI (tilaus) | 0 content_filter; ~50% suurista eristä jumittui (ratkaistu 10:n erillä + uudelleenyrityksellä) | ei (epäilty: Read-koon muutos) |

## 3. Kustannus palveluntarjoajittain (offline, tarkka — TÄYDET sivut, teoreettinen)

| palveluntarjoaja · sivu | tokenia/sivu | merkkiä/sivu | **merkkiä/tokeni** | tila |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (kaikki mallit) | 1460 | 28,080 | **19.2** | mitattu |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× vähemmän kuvia) | laskutus mitattu; luettavuus odottaa (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | auditoitu dokumentaatio |
| GPT-5.4/5.5 (patch, original) jopa 1568×5984 | ~9,163 | ~233k | **25.4** | dokumentaatio; luettavuus testaamatta |
| gpt-4o-mini | 48,169/strip | — | **0.8 — EI KOSKAAN KUVITETA** | dokumentaatio (bugi D2 korjattu) |
| Gemini tile 1533×1152 (natiivi rajausyksikkö 768) | 1032 | 43,615 | **42.3 ← paras dokumentoitu** | dokumentaatio; luettavuus testaamatta |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (jos luettavissa)** | hypoteesi H6 |

## 4. Löydetyt ja korjatut bugit (audit virallista dokumentaatiota vasten)

| id | bugi | vaikutus | commit |
|---|---|---|---|
| D2 | gpt-4o-mini osui oletuslaattaan 85/170 (todellinen: 2833/5667) | kustannus aliarvioitu ~33× — **käänteinen portti** | e6bc75f |
| D1 | o4-mini-kerroin 1.62 (todellinen 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) katolla 10000 (todellinen 1536, ei originalia) | rikkoutuisi suuremmilla sivuilla | e6bc75f |
| D4 | gpt-5-codex-mini laattaregiimissä (todellinen: pala 1536) | ≥+23% aliarvioitu | e6bc75f |
| D5 | detail:'original' kovakoodattu jokaiselle mallille (olemassa vain 5.4+:ssa) | sopimuksen vastainen | e6bc75f |
| #44 | kuvausrunko injektoitu typattuihin työkaluihin → 400 + hiljainen varajärjestely | säästöt nollattiin ilman signaalia | 0f66e32 |
| AA | AA-atlas tuotannossa "eval-only"-kommentin vastaisesti | −17pp lukutarkkuus Fablella | 9a25585 |
| — | slab-sarakkeet 313 (1573px) → 0.997× uudelleennäytteistys + ylimääräinen palasarake | korjattu 312:een | baseline |

## 5. Avoimet hypoteesit (mitä kunkin sulkeminen maksaa)

| id | hypoteesi | nykyinen näyttö | ratkaiseva testi | kustannus |
|---|---|---|---|---|
| H1 | 1928²-sivu lukee ≥ standard suoralla API:lla (WYSIWYG todistettu laskutuksessa) | laskutus 4764 ilman uudelleennäytteistystä; 1-bit lukee jo 67% vaikka heikentyneenä | suora A/B std vs. hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit suoralla API:lla ≈ 100% 3.3× vähemmällä kuvamäärällä | H1 + 2×2-matriisi | sama kuin H1 | sama |
| H3 | CLI:n Read ja OpenRouter muuttavat kuvien kokoa >1568/2000px | 5×8 kuolee ja 10×16 selviää SAMALLA sivulla | yksi 1928²-sivu 20×32-glyfeillä per siirtotapa | ~US$0 (CLI) |
| H4 | Kieltäytyminen riippuu kehystyksestä (agentti-lukee-tiedostoa ≈ 0% vs. raaka API ≈ 100%) | siirtotapavertailu yllä | sanamuoto-A/B todellisella proxy-polulla | matala |
| H5 | Gemini tile 1533×1152 luettavissa 5×8:lla (42 merkkiä/tok) | ei | density-frontier GEMINI_API_KEY:llä | ~ilmainen (ilmaistaso) |
| H6 | media_resolution:low luettavissa (116 merkkiä/tok) | epätodennäköistä (matalaresoluutioinen enkooderi), mutta kukaan ei ole mitannut | 1 kutsu | ~ilmainen |
| H7 | GPT: liuskan luettavuus + completion-tokenien paisuminen (PageWatch-riski) | yhteisö näki −40% prompt mutta +completion/2× viive | density-frontier OPENAI_API_KEY:llä | ~US$2-5 |
| H8 | Glyfikirurgia (H~K, 0/8, 5/3…) muuttaa pidättäytymiset lukukokeiksi | 1-bitin jälkeen KAIKKI Fablen virheet muuttuivat pidättäytymisiksi | muokkaa ~10 bittikarttaa + aja matriisi uudelleen | $0 (CLI) |
| H9 | Vaalea teema (musta valkoisella) > käänteinen | kirjallisuus (Glyph-paperi, Tesseract); ei koskaan mitattu kaupallisella VLM:llä | tyylilippu + 2 haaraa | $0 (CLI) |
| H10 | Opus 7×10:llä asettuu 0%:n (5×8) ja 87%:n (10×16) väliin → hyvä kompromissi | upstream-käyrä 35% 7×10:llä (n=20) | 1 lisähaara | $0 (CLI) |
| H11 | Kieltäytymisen uudelleenyritys proxyssä palauttaa ~50% suodatetuista eristä | kieltäytyminen on stokastista per kutsu | toteuta + mittaa tuotannossa | koodi |

## 6. Operatiiviset avoimet kohdat

1. `gh auth login` → luo yksityinen `diegosouzapw/omniglyph` + push (10 paikallista committia).
2. Anthropic-krediitit (H1/H2, geometrian tuomio) ja OpenRouter (loppunut).
3. **Kierrätä** chatissa paljastuneet Anthropic- ja OpenRouter-**avaimet**.
4. Koodijono: #45 (schema-strip draft-07), retry-on-refusal (H11), glyfikirurgia
   (H8), Vaihe 4 (TS skripteihin, GIF:t, dokumentaatio, kojelauta v2), Vaihe 5
   (OmniRoute-moottori).

## LISÄYS 2026-07-06 — A/B suoran API:n kautta (165 kutsua): H1/H2 KUMOTTU

| konfiguraatio | tarkka | pidätt. | kieltäytyminen | virheet |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA ja 1-bit) | 0/60 | 0 | **60/60 kieltäytyminen** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 ennustettu) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 ennustettu) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

TUOMIO: high-res-tason 1928²-sivu LASKUTETAAN WYSIWYG-periaatteella (4764
tok, pyyhkäisy), mutta ENKOODERI ei saa täyttä resoluutiota — 1-2/30
luettu, yhden glyfin vaihtovirheillä (6→8, a→4), sisäisen uudelleen-
näytteistyksen tunnusmerkki. **Laskutus ≠ enkooderin syöte → ansa: 3.3×
kustannus, huonompi luettavuus.** SOVELLETTU: pageGeometryForTier()
peruutettu — molemmat tasot renderöivät 1568×728:n; tasoinfrastruktuuri
säilytetty (tarkka laskutus pysyy voimassa ja tuleva viritys on 1 rivi).
H3 päivitetty: "siirtotason uudelleennäytteistys" oli (myös) itse API:n
enkooderi. Kieltäytyminen transkriptiossa raaan API:n kautta: 100%
standardisivulla (H4 vahvistettu — vain agenttikehystys välttää sen).
Opus 10×16 vahvistettu molemmilla siirtotavoilla (77-87%).

## LISÄYS 2026-07-06 (2) — GPT-5.5-koesarja suoran API:n kautta: H7 suljettu (EPÄONNISTUI)

| haara | sanatarkka | gist | tuloste/vastaus |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 pidätt., 5 suodatettu, 7 virhettä) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 pidätt., 5 suodatettu, 10 virhettä) | 1/3 | 2,383 tok |
| TEKSTI (kontrolli) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 ei osaa lukea 5×8-glyfejä (0/60; edes gist ei säily) ja paisuttaa
tulostetta ~40× yrittäessään tulkita niitä (2.4-2.7k reasoning-tokenia per
kysymys) — prompt-säästöt kuluvat tulosteeseen. Täydellinen tekstikontrolli
todistaa, että korpus/kysymykset ovat järkeviä. Vahvistaa ja kvantifioi
5.5:n opt-in-tilan; gpt-5.6 (oletus) pysyy testaamattomana (tilillä ei ole
pääsyä). Tulevaisuus (H12): GPT-portin täytyy mallintaa tulosteen
paisuminen, ei vain prompt-tokenit.

## LISÄYS 2026-07-06 (3) — Gemini 2.5-flash (OSITTAINEN: ilmaistason kiintiö loppui kesken ajon)

Noin 26:sta kuvavastauksesta, jotka ehtivät läpi ennen kiintiön loppumista:
**0 oikein, 1 pidättäytyminen, ~25 KONFABULAATIOTA** — eivätkä ne ole
glyfisekaannuksia: ne ovat satunnaisia numeroita
(`indexLedgerInd → 0040375615`), eli enkooderi ei näe juuri mitään
testatuilla tiheyksillä (natiivi laatta 42 merkkiä/tok ja MEDIUM-kiinteä) ja
2.5-flash KEKSII sen sijaan että pidättäytyisi (ohittaa ILEGIVEL-ohjeen).
Tekstikontrolli: 3/3 niistä, jotka ehtivät läpi. Ei tulosteen paisumista
(6-28 tok/vastaus).

Alustava signaali: H5/H6 kallistuvat EI:hin 2.5-flashilla, epäonnistumis-
mallilla, joka on PAHEMPI kuin GPT:n (hiljainen konfabulaatio pidättäytymisen
sijaan) — Gemini vaatisi ylimääräisiä suojatoimia proxyssä. Suljettavana:
aja uudelleen maksullisella kiintiöllä tai toisena päivänä, ja testaa
gemini-2.5-pro (flash on perheen heikoin lukija). Natiivilaattasivulla on
edelleen paras DOKUMENTOITU suhde (42.3 merkkiä/tokeni); epäilyksen alla on
luettavuus.

Kustannushuomio: osittaiset sivut (korpuksen viimeinen) laskutetaan huonosti
laattaregiimissä (matala korkeus → pieni rajausyksikkö → enemmän laattoja) —
viimeisen sivun täyttäminen 1152px:n korkeuteen on pakollinen optimointi,
jos Gemini otetaan mukaan.
