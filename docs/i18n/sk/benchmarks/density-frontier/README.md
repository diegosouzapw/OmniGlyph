# density-frontier — náklady × presnosť podľa rozlíšenia

🌐 Preložené: [všetky jazyky](../../../README.md)

Harness, ktorý meria **Paretovu hranicu medzi nákladmi a čitateľnosťou**
renderov text→obrázok, na poskytovateľa (Anthropic / OpenAI / Gemini),
geometriu stránky, bunku glyfu a štýl atlasu.

Lacnejšie (hustejšie) stránky nesú viac znakov na token, ale v určitom bode
prestávajú byť čitateľné. Konfigurácia smie ísť do produkcie iba tam, kde
platí **oboje** — náklady sú nízke *a* model ju stále číta dokonale:

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

Každá odpoveď sa ohodnotí presne na jeden z troch výsledkov — prostredný z
nich je ten, ktorý robí bránu dôveryhodnou:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Konfigurácia, ktorá vyprodukuje čo i len jeden 🔴, je diskvalifikovaná, bez
ohľadu na to, aká je lacná.

Centrálna asymetria: od billing sweepu (2026-07-05,
`benchmarks/billing-sweep/`) sú **náklady presne predikovateľné offline**
— 28 px záplaty + 4/blok na Anthropic (`src/core/anthropic-vision.ts`),
patch/dlaždicové profily na OpenAI (`src/core/openai.ts`),
dlaždice/media_resolution na Gemini (`gemini-cost.ts`). Iba **presnosť
čítania** potrebuje API.

## Dizajn

- **Korpus** (`corpus.ts`): hustá výplň v štýle log/JSON + zasadené ihly z
  tried, o ktorých matica zameniteľnosti hovorí, že zlyhávajú (12-znakový
  hex, camelCase, číslice 6/8/5/3) + **blízke distraktory** postavené na
  meraných zameniteľných pároch. Ak model odpovie distraktorom, zámena
  bola *predikovaná* — to je práve ten tichý režim zlyhania, ktorý sa
  deteguje. Deterministický (mulberry32).
- **Konfigurácie** (`configs.ts`): kurátorovaná mriežka — štandardné
  stránky 1568×728 vs high-res 1928×1928 (A/B test, ktorý rozhoduje
  geometriu podľa úrovne), AA vs 1-bit (rieši rozpor hustého renderu),
  bunka 7×10/10×16 (bezpečný režim Opus), pás GPT a dve stávky Gemini
  (≤384² = 258 plochá; `media_resolution: low` = 280 fixná →
  ~116 znakov/token *ak* čitateľné).
- **Skóre** (`score.ts`): deterministická presná zhoda, žiadny LLM-rozhodca.
  Tri výsledky: `correct` / `abstained` (sentinel ILEGIVEL — čestné
  zlyhanie) / `silent_wrong` (nebezpečný režim), s príznakom distraktora.

## Spustenie

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Konkrétne konfigurácie: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Odpovede pristávajú v `results/*.jsonl` (jeden riadok na otázku, so surovou
odpoveďou pre audit).

## Prijímacia hranica (zdedená z upstream PR #35/#36)

Konfigurácia sa stane produkčným predvoleným nastavením iba ak: **gist ==
textová základná línia** A **nulové tiché nesprávne presné reťazce** A
**kladné úspory**. Prvý povinný beh je `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` na Fable — kontrola čitateľnosti veľkej stránky
pred zapnutím high-res úrovne.

## `--via-omniroute` — e2e cez OmniRoute (P3: dôkaz nedegradácie)

Transporty vyššie renderujú text→PNG **v harnesse** a posielajú obrázky.
`--via-omniroute` robí opak, čo je produkčná cesta: posiela **hustý text**
do bežiacej inštancie OmniRoute, necháva engine **`omniglyph` renderovať**
stránky a posielať ich Anthropicu, a meria čítania + úspory. Ak čítania
zostanú rovnaké ako pri priamej ceste **a** OmniRoute hlási kompresiu, je
dokázané, že render+forward v OmniRoute **nedegraduje** stránky.

Predpoklady (prevádzkové):

1. **OmniRoute bežiaci** (`npm run dev`, predvolene
   `http://localhost:20128`).
2. **Poskytovateľ Anthropic** nakonfigurovaný v OmniRoute so **skutočným
   kľúčom** (priama cesta — brána `providerTransport==='direct'` prejde
   iba pre poskytovateľa `anthropic`).
3. **Engine `omniglyph` ZAPNUTÝ** v konfigurácii kompresie OmniRoute
   (`config.engines.omniglyph.enabled = true`) — hlavička
   `engine:omniglyph` sa spustí iba so zapnutým enginom. (Engine je
   `stable:false`/preview; zapnite ho explicitne.)
4. **API kľúč OmniRoute** v `OMNIROUTE_API_KEY` (ten, ktorým sa klient
   autentifikuje voči OmniRoute, nie ten pre Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Každá odpoveď zaznamenáva `omnirouteSavings: { originalTokens,
compressedTokens, savingsPercent }` (z hlavičky odpovede
`X-OmniRoute-Compression`) v JSONL; riadok tabuľky ukazuje, koľko
odpovedí sa vrátilo skomprimovaných + medián úspor. **Hranica P3**:
rovnaké zásahy verbatim/gist ako pri priamej ceste (nedegradácia) **s**
nenulovým `omnirouteSavings` (dokazujúcim, že render sa naozaj stal, nie
čítanie surového textu). Ak sa objaví „did NOT compress", engine nie je
zapnutý v OmniRoute (alebo telo neprešlo fail-closed bránami).

Testy pre čisté časti: `tests/density-frontier.test.ts` (zahŕňa
`buildOmnirouteRequest` a `parseCompressionSavings` z via-omniroute
transportu).
