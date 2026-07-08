# Anthropic vision-laskutuspyyhkäisy

🌐 Käännetty: [kaikki kielet](../../../README.md)

**Miksi tämä on olemassa:** kannattavuusportti on turvallinen vain, jos
kustannusarvio on *tarkka*. Kaava, joka on hieman pielessä, muuntaisi
lohkoja, jotka todellisuudessa maksavat enemmän. Siksi tämä pyyhkäisy
kiinnittää kaavan API:n todellisiin lukuihin ennen julkaisua — **nollaan
residuaaliin** asti.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

Ilmainen `count_tokens`-pyyhkäisy, joka ratkaisee kaksi avointa
geometriakysymystä:

1. **Kaava** — laskuttaako API:n `ceil(w/28) × ceil(h/28)`-paloja (nykyinen
   dokumentaatio) vai poistetun `w·h/750`-kaavan? Koejoukko erottaa nämä
   kaksi 25–180 tokenilla per rivi.
2. **Taso** — saako `claude-fable-5` korkearesoluutiotason katot (pitkä sivu
   ≤ 2576 px, ≤ 4784 visuaalista tokenia)? `page-old-1928x1928`-rivi on
   ratkaisija: ≈ **4761** mitattua tarkoittaa high-res WYSIWYG:iä (vanha suuri
   sivu sisältää ~3.3× enemmän merkkejä per kuva kuin nykyinen 1568×728,
   samalla merkkiä/tokeni-suhteella); ≈ **1521** tarkoittaa standarditason
   uudelleennäytteistystä, ja 1568×728 pysyy oikeana.

Konteksti: 2026-07-01-pyyhkäisy nykyisen 1568×728-sivun takana
(luettavuusaudit, 2026-07-01) mitattiin
mallilla `claude-sonnet-4-5` — standarditason malli — kun taas tuotanto
kohdistuu Fable 5:een, jonka näkökykydokumentaatio sijoittaa
korkearesoluutiotasolle. Kyseinen audit myös mittasi nykyisen sivun
1460 tokeniin: lähempänä palakaavan 1456:ta kuin /750:n 1522:ta, mikä
viittaa siihen, että API oli jo siirtynyt palalaskutukseen.

## Ajaminen

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

Täytyy osua API:in **suoraan** — ei koskaan OmniGlyph-proxyn kautta, joka
muuntaisi rungon. `count_tokens` on ilmainen; täysi pyyhkäisy tekee ~25
pyyntöä.

## Tulosteen tulkinta

Mallia kohti jokainen koerivi näyttää mitatut kuvatokenit (kuva mukana
miinus vain-teksti-perusarvo) kaikkia neljää ennustetta vasten
(`patch`/`legacy750` × `standard`/`highres`); yhteenveto järjestää
hypoteesit keskimääräisen absoluuttisen residuaalin mukaan.
`--probe-multi` tarkistaa kuvakohtaisen katon (2×1092² ≈ 2×1521);
`--probe-20plus` tarkistaa >20-kuvan säännön (>2000 px sivu täytyy hylätä,
ei muuttaa kokoa). Rivit menevät tiedostoon `results/*.jsonl`; ennuste-
matematiikka asuu tiedostossa `formulas.mjs`, pinnattu tiedostolla
`tests/billing-sweep-formulas.test.ts`.

## Tuomion jälkeen

- Palakaava vahvistettu → porttaa OmniGlyph PR #27 (tarkka uudelleenkoon
  käännös) ja linjaa `ANTHROPIC_PIXELS_PER_TOKEN`-portin matematiikka
  tiedostossa `src/core/transform.ts`.
- Korkearesoluutiotaso vahvistettu Fablella → tuo takaisin tasokohtainen
  sivugeometria (1928×1928-luokan sivut Fablelle/Opus 4.8:lle/Sonnet
  5:lle, 1568×728 standardille), heijastaen sitä, miten GPT-polku jo
  ylläpitää omaa `GPT_MAX_HEIGHT_PX`-arvoaan.
