# density-frontier — náklady × přesnost podle rozlišení

Harness, který měří **Paretovu hranici mezi náklady a čitelností** renderů
text→obrázek, podle poskytovatele (Anthropic / OpenAI / Gemini), geometrie
stránky, buňky glyfu a stylu atlasu.

Centrální asymetrie: od billing sweep (2026-07-05,
`benchmarks/billing-sweep/`) je **náklad přesně predikovatelný offline** —
patche 28 px + 4/blok na Anthropic (`src/core/anthropic-vision.ts`), profily
patch/dlaždice na OpenAI (`src/core/openai.ts`), dlaždice/media_resolution
na Gemini (`gemini-cost.ts`). Pouze **přesnost čtení** potřebuje API.

## Návrh

- **Korpus** (`corpus.ts`): hustá výplň ve stylu log/JSON + vysazené jehly z
  tříd, o kterých matice zaměnitelnosti říká, že selhávají (12znakový hex,
  camelCase, číslice 6/8/5/3) + **distraktory na hraně záměny** sestavené ze
  změřených zaměnitelných dvojic. Pokud model odpoví distraktorem, záměna
  byla *predikována* — to je detekovaný tichý režim selhání, ne jen chyba
  napočítaná. Deterministický (mulberry32).
- **Konfigurace** (`configs.ts`): kurátorská mřížka — standardní stránky
  1568×728 vs. high-res 1928×1928 (A/B, které rozhoduje geometrii podle
  úrovně), AA vs. 1bit (řeší rozpor hustého renderu), buňka 7×10/10×16
  (bezpečný režim Opus), proužek GPT a dvě sázky na Gemini (≤384² = 258
  ploché; `media_resolution: low` = 280 pevné → ~116 znaků/token *pokud*
  je čitelné).
- **Skóre** (`score.ts`): deterministická přesná shoda, žádný LLM soudce.
  Tři výsledky: `correct` / `abstained` (sentinel ILEGIVEL — poctivé
  selhání) / `silent_wrong` (nebezpečný režim), s příznakem distraktoru.

## Spuštění

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # tabulka nákladů, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 jehel+3 gist × konfigurace × pokus
```

Konkrétní konfigurace: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Odpovědi přistávají v `results/*.jsonl` (jeden řádek na otázku, se surovou
odpovědí pro audit).

## Laťka pro přijetí (zděděná z upstream PR #35/#36)

Konfigurace se stane produkčním výchozím pouze pokud: **gist == textová
základní linie** A ZÁROVEŇ **nula tichých chybných přesných řetězců** A
ZÁROVEŇ **kladné úspory**. Prvním povinným během je `anthropic-std-5x8-aa`
vs. `anthropic-hires-5x8-aa` na Fable — namátková kontrola čitelnosti velké
stránky před zapnutím high-res úrovně.

## `--via-omniroute` — e2e přes OmniRoute (P3: důkaz nedegradace)

Transporty výše vykreslují text→PNG **v harness** a posílají obrázky.
`--via-omniroute` dělá opak, což je produkční cesta: pošle **hustý text**
běžící instanci OmniRoute, nechá **engine `omniglyph` vykreslit** stránky a
předat je Anthropicu, a měří čtení + úspory. Pokud čtení zůstávají stejná
jako u přímé cesty **a** OmniRoute hlásí kompresi, je prokázáno, že
vykreslení+předání OmniRoute stránky **nedegraduje**.

Předpoklady (provozní):

1. **Běžící OmniRoute** (`npm run dev`, výchozí `http://localhost:20128`).
2. Nakonfigurovaný **poskytovatel Anthropic** v OmniRoute se **skutečným
   klíčem** (přímá cesta — gate `providerTransport==='direct'` propouští
   pouze poskytovatele `anthropic`).
3. **Engine `omniglyph` ZAPNUTÝ** v konfiguraci komprese OmniRoute
   (`config.engines.omniglyph.enabled = true`) — hlavička `engine:omniglyph`
   se spouští jen se zapnutým enginem. (Engine je `stable:false`/preview;
   zapněte ho výslovně.)
4. **API klíč OmniRoute** v `OMNIROUTE_API_KEY` (ten, který klient používá k
   autentizaci vůči OmniRoute, ne ten Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Každá odpověď zaznamenává `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(z hlavičky odpovědi `X-OmniRoute-Compression`) v JSONL; řádek tabulky
ukazuje, kolik odpovědí se vrátilo komprimovaných + medián úspor. **Laťka
P3**: stejné zásahy verbatim/gist jako přímá cesta (nedegradace) **se**
non-null `omnirouteSavings` (dokazuje, že proběhl render, ne čtení surového
textu). Pokud se objeví `did NOT compress`, engine není v OmniRoute zapnutý
(nebo tělo neprošlo fail-closed gaty).

Testy pro čisté části: `tests/density-frontier.test.ts` (zahrnuje
`buildOmnirouteRequest` a `parseCompressionSavings` z transportu
via-omniroute).
