# density-frontier — költség × pontosság felbontásonként

🌐 Fordítva: [minden nyelv](../../../README.md)

Harness, amely a szöveg→kép renderelések **költség és olvashatóság közötti
Pareto-frontját** méri, szolgáltatónként (Anthropic / OpenAI / Gemini),
oldalgeometriánként, glifcellánként és atlaszstílusonként.

Az olcsóbb (sűrűbb) oldalak több karaktert hordoznak tokenenként, de egy
ponton túl már nem olvashatók. Egy konfig csak ott mehet élesbe, ahol
**mindkettő** teljesül — a költség alacsony, *és* a modell még mindig
tökéletesen olvassa:

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

Minden válasz pontosan a három kimenet egyikébe kerül besorolásra — a
középső teszi megbízhatóvá a kaput:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Egy olyan konfig, amely akár egyetlen 🔴-t is termel, kizárásra kerül,
bármilyen olcsó is legyen.

A központi aszimmetria: a billing sweep óta (2026-07-05,
`benchmarks/billing-sweep/`) **a költség offline pontosan előrejelezhető**
— 28 px-es patch-ek + 4/blokk az Anthropicon (`src/core/anthropic-vision.ts`),
patch/csempe profilok az OpenAI-n (`src/core/openai.ts`),
csempék/media_resolution a Geminin (`gemini-cost.ts`). Csak az **olvasási
pontossághoz** kell az API.

## Tervezés

- **Korpusz** (`corpus.ts`): sűrű log/JSON-stílusú töltelék + elültetett
  tűk azokból az osztályokból, amelyeknél az összetéveszthetőségi mátrix
  szerint hiba várható (12 karakteres hex, camelCase, 6/8/5/3 számjegy) +
  **near-miss elterelők** a mért összetéveszthető párokból építve. Ha a
  modell az elterelővel válaszol, az összetévesztés *predikált* volt — ez a
  detektálandó néma hibamód, nem csak egy hibás számolás. Determinisztikus
  (mulberry32).
- **Konfigok** (`configs.ts`): kurátoros rács — standard 1568×728-as
  oldalak vs high-res 1928×1928 (az A/B, amely eldönti a szintenkénti
  geometriát), AA vs 1-bit (feloldja a sűrű-renderelés ellentmondást),
  7×10/10×16-os cella (Opus biztonságos mód), GPT csík, és a két Gemini
  fogadás (≤384² = 258 fix; `media_resolution: low` = 280 fix →
  ~116 karakter/token *ha* olvasható).
- **Pontozás** (`score.ts`): determinisztikus pontos egyezés, nincs
  LLM-bíró. Három kimenet: `correct` / `abstained` (ILEGIVEL jelölő —
  őszinte hiba) / `silent_wrong` (a veszélyes mód), elterelő-jelzővel.

## Futtatás

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Konkrét konfigok: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
A válaszok a `results/*.jsonl`-be kerülnek (egy sor kérdésenként, a nyers
válasszal auditáláshoz).

## Elfogadási mérce (az upstream #35/#36 PR-ektől örökölve)

Egy konfig csak akkor válik éles alapértékké, ha: **a lényeg == szöveges
alapvonal** ÉS **nulla néma-hibás pontos string** ÉS **pozitív
megtakarítás**. Az első kötelező futtatás az `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa` a Fable-en — a nagy oldal olvashatósági
gyorsellenőrzése a high-res szint bekapcsolása előtt.

## `--via-omniroute` — e2e az OmniRoute-on keresztül (P3: nem-degradáció bizonyítéka)

A fenti transzportok a harness-ben renderelik a szöveget→PNG-t, és küldik a
képeket. A `--via-omniroute` az ellenkezőjét csinálja, ami az éles útvonal:
a **sűrű szöveget** küldi el egy futó OmniRoute-példánynak, hagyja, hogy az
**`omniglyph` motor rendereljen**, majd továbbítsa az oldalakat az
Anthropicnak, és méri az olvasásokat + a megtakarítást. Ha az olvasások
ugyanazok maradnak, mint a közvetlen útvonalon, **és** az OmniRoute
tömörítést jelent, akkor bizonyított, hogy az OmniRoute render+forward
lépése **nem degradálja** az oldalakat.

Előfeltételek (operatívak):

1. Az **OmniRoute fut** (`npm run dev`, alapértelmezetten
   `http://localhost:20128`).
2. Egy **Anthropic szolgáltató** van beállítva az OmniRoute-ban egy **valós
   kulccsal** (közvetlen útvonal — a `providerTransport==='direct'` kapu
   csak az `anthropic` szolgáltatónál engedélyez át).
3. Az **`omniglyph` motor ENGEDÉLYEZVE** van az OmniRoute tömörítési
   konfigurációjában (`config.engines.omniglyph.enabled = true`) — az
   `engine:omniglyph` fejléc csak akkor tüzel, ha a motor be van kapcsolva.
   (A motor `stable:false`/preview; explicit módon engedélyezze.)
4. Egy **OmniRoute API-kulcs** az `OMNIROUTE_API_KEY`-ben (amelyet a
   kliens az OmniRoute-tal szemben hitelesítéshez használ, nem az
   Anthropic-ét).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Minden válasz rögzíti az
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
mezőt (az `X-OmniRoute-Compression` válaszfejlécből) a JSONL-ben; a
táblázat sora megmutatja, hány válasz jött vissza tömörítve + a medián
megtakarítást. **P3 mérce**: ugyanazok a szó szerinti/lényeg találatok, mint
a közvetlen útvonalon (nem-degradáció) **és** nem-null `omnirouteSavings`
(bizonyítva, hogy renderelés történt, nem nyers-szöveg olvasás). Ha
`did NOT compress` jelenik meg, a motor nincs engedélyezve az OmniRoute-ban
(vagy a body nem ment át a fail-closed kapukon).

Tesztek a tiszta részekhez: `tests/density-frontier.test.ts` (tartalmazza a
`buildOmnirouteRequest` és `parseCompressionSavings` függvényeket a
via-omniroute transzportból).
