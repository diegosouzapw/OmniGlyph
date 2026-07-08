# density-frontier — kustannus × tarkkuus resoluutiota kohti

🌐 Käännetty: [kaikki kielet](../../../README.md)

Työkalu, joka mittaa teksti→kuva-renderöintien **kustannuksen ja
luettavuuden Pareto-rintaman** palveluntarjoajittain (Anthropic / OpenAI /
Gemini), sivugeometrioittain, glyfisoluittain ja atlastyyleittäin.

Halvemmat (tiheämmät) sivut kantavat enemmän merkkejä per tokeni, mutta
lakkaavat lopulta olemasta luettavissa. Konfiguraatio saa mennä tuotantoon
vain, kun **molemmat** pitävät paikkansa — kustannus on matala *ja* malli
lukee sen silti täydellisesti:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

Jokainen vastaus pisteytetään täsmälleen yhteen kolmesta lopputulemasta —
keskimmäinen on se, joka tekee portista luotettavan:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Konfiguraatio, joka tuottaa yhdenkin 🔴:n, on diskvalifioitu, riippumatta
siitä, kuinka halpa se on.

Keskeinen epäsymmetria: laskutuspyyhkäisyn jälkeen (2026-07-05,
`benchmarks/billing-sweep/`), **kustannus on tarkasti ennustettavissa
offline** — 28 px paloja + 4/lohko Anthropicilla (`src/core/anthropic-vision.ts`),
pala-/laattaprofiilit OpenAI:lla (`src/core/openai.ts`), laatat/
media_resolution Geminillä (`gemini-cost.ts`). Vain **lukutarkkuus**
tarvitsee API:n.

## Suunnittelu

- **Korpus** (`corpus.ts`): tiheä loki-/JSON-tyylinen täyte + istutetut
  neulat luokista, joiden konfusaatiomatriisi sanoo epäonnistuvan (12-
  merkkinen hex, camelCase, numerot 6/8/5/3) + **mitatuista hämäävistä
  pareista rakennetut lähes-samanlaiset häiriötekijät**. Jos malli vastaa
  häiriötekijällä, sekaannus oli *ennustettu* — se on juuri se hiljainen
  epäonnistumismalli, jota havainnoidaan, ei vain lasketaan väärin.
  Deterministinen (mulberry32).
- **Konfiguraatiot** (`configs.ts`): kuratoitu ruudukko — standard
  1568×728-sivut vs. high-res 1928×1928 (A/B, joka ratkaisee tasokohtaisen
  geometrian), AA vs. 1-bit (ratkaisee tiheän renderöinnin ristiriidan),
  7×10/10×16-solu (Opuksen turvatila), GPT-liuska ja kaksi Gemini-vetoa
  (≤384² = 258 kiinteä; `media_resolution: low` = 280 kiinteä →
  ~116 merkkiä/tokeni *jos* luettavissa).
- **Pisteytys** (`score.ts`): deterministinen tarkka täsmäys, ei LLM-
  tuomaria. Kolme tulosta: `correct` / `abstained` (ILEGIVEL-merkintä —
  rehellinen epäonnistuminen) / `silent_wrong` (vaarallinen tila), sekä
  häiriötekijälippu.

## Ajaminen

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Tietyt konfiguraatiot: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Vastaukset menevät tiedostoon `results/*.jsonl` (yksi rivi per kysymys, raa'alla
vastauksella auditointia varten).

## Hyväksymisraja (peritty upstream PR:istä #35/#36)

Konfiguraatiosta tulee tuotanto-oletusarvo vain, jos: **gist == tekstiperusarvo**
JA **nolla hiljaista väärää tarkkaa merkkijonoa** JA **positiivinen säästö**.
Ensimmäinen pakollinen ajo on `anthropic-std-5x8-aa` vs.
`anthropic-hires-5x8-aa` Fablella — suuren sivun luettavuuden pistotarkastus
ennen high-res-tason käyttöönottoa.

## `--via-omniroute` — e2e OmniRouten kautta (P3: ei-heikkenemisen todistus)

Yllä olevat siirtotavat renderöivät teksti→PNG **työkalussa** ja lähettävät
kuvat. `--via-omniroute` tekee päinvastoin, mikä on tuotantopolku: se
lähettää **tiheän tekstin** käynnissä olevalle OmniRoute-instanssille, antaa
**`omniglyph`-moottorin renderöidä** sivut ja välittää ne Anthropicille, ja
mittaa lukukokeet + säästöt. Jos lukukokeet pysyvät samana kuin suoralla
reitillä **ja** OmniRoute raportoi pakkauksen, on todistettu, että
OmniRouten renderöinti+välitys **ei heikennä** sivuja.

Edellytykset (operatiiviset):

1. **OmniRoute käynnissä** (`npm run dev`, oletus `http://localhost:20128`).
2. **Anthropic-palveluntarjoaja** konfiguroitu OmniRoutessa **oikealla
   avaimella** (suora reitti — `providerTransport==='direct'`-portti
   läpäisee vain `anthropic`-palveluntarjoajalle).
3. **`omniglyph`-moottori KÄYTÖSSÄ** OmniRouten pakkauskonfiguraatiossa
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`-otsikko
   laukeaa vain moottorin ollessa päällä. (Moottori on
   `stable:false`/esikatselu; ota se käyttöön nimenomaisesti.)
4. **OmniRoute-API-avain** ympäristömuuttujassa `OMNIROUTE_API_KEY` (se,
   jota asiakas käyttää autentikoituakseen OmniRoutea vasten, ei
   Anthropic-avain).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Jokainen vastaus tallentaa `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(vastausotsikosta `X-OmniRoute-Compression`) JSONL:ään; taulukkorivi näyttää,
kuinka moni vastaus palautui pakattuna + mediaanisäästön. **P3-raja**: samat
sanatarkat/gist-osumat kuin suoralla reitillä (ei-heikkeneminen) **ja**
ei-null `omnirouteSavings` (todistaa, että renderöinti tapahtui, ei raaka
tekstinluku). Jos `did NOT compress` ilmestyy, moottori ei ole käytössä
OmniRoutessa (tai runko ei läpäissyt fail-closed-portteja).

Testit puhtaille osille: `tests/density-frontier.test.ts` (sisältää
`buildOmnirouteRequest`- ja `parseCompressionSavings`-funktiot
via-omniroute-siirtotavasta).
