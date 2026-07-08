# density-frontier — цена × точност на резолюция

🌐 Translated: [all languages](../../../README.md)

Harness, който измерва **границата на Парето между цена и четимост** на
рендерите текст→изображение, по доставчик (Anthropic / OpenAI / Gemini), геометрия на
страницата, клетка на глифа и стил на атласа.

По-евтините (по-плътни) страници носят повече символи на токен, но в определен момент
престават да бъдат четими. Дадена конфигурация може да влезе в производство само където важат
**и двете** — цената е ниска *и* моделът все още я чете перфектно:

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

Всеки отговор се оценява в точно един от три изхода — средният е
този, който прави вратата надеждна:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Конфигурация, която произвежда дори едно 🔴, се дисквалифицира, колкото и евтина да е.

Централната асиметрия: от billing sweep-а (2026-07-05,
`benchmarks/billing-sweep/`) насам, **цената е точно предвидима офлайн** — 28 px
пача + 4/блок при Anthropic (`src/core/anthropic-vision.ts`), профили пач/тайл
при OpenAI (`src/core/openai.ts`), тайлове/media_resolution при Gemini (`gemini-cost.ts`).
Само **точността на четене** се нуждае от API-то.

## Дизайн

- **Корпус** (`corpus.ts`): плътен пълнеж в стил log/JSON + засадени needles от
  класовете, за които матрицата на объркваемост казва, че се провалят (12-символен
  hex, camelCase, поредици от цифри 6/8/5/3) + **разсейващи елементи, близки до истината**,
  изградени от измерените объркващи двойки. Ако моделът отговори с разсейващия елемент,
  объркването е било *предвидено* — това е режимът на тиха грешка, който се засича,
  не просто брои като грешен. Детерминистично (mulberry32).
- **Конфигурации** (`configs.ts`): подбрана мрежа — стандартни страници 1568×728 срещу
  висока резолюция 1928×1928 (A/B, който решава геометрията по ниво), AA срещу 1-бит
  (разрешава противоречието в плътния рендер), клетка 7×10/10×16 (безопасен режим на
  Opus), лента за GPT, и двата залога за Gemini (≤384² = 258 фиксирано;
  `media_resolution: low` = 280 фиксирано → ~116 символа/токен *ако* е четливо).
- **Оценяване** (`score.ts`): детерминистично точно съвпадение, без LLM-съдия. Три
  изхода: `correct` / `abstained` (sentinel ILEGIVEL — честен провал) /
  `silent_wrong` (опасният режим), с флаг за разсейващ елемент.

## Изпълнение

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Специфични конфигурации: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Отговорите попадат в `results/*.jsonl` (един ред на въпрос, със суровия отговор
за одит).

## Летва за приемане (наследена от upstream PR #35/#36)

Дадена конфигурация става производствена по подразбиране само ако: **gist == текстова база** И
**нула тихи грешни точни низове** И **положителни спестявания**. Първото
задължително пускане е `anthropic-std-5x8-aa` срещу `anthropic-hires-5x8-aa` при Fable —
проверка на четимостта на голямата страница преди активиране на нивото с висока резолюция.

## `--via-omniroute` — e2e чрез OmniRoute (P3: доказателство за недеградация)

Транспортите по-горе рендират текст→PNG **в harness-а** и изпращат изображенията.
`--via-omniroute` прави обратното, което е производственият път: изпраща
**плътния текст** до работещ екземпляр на OmniRoute, оставя механизма
**`omniglyph` да рендира** страниците и да ги препрати към Anthropic, и измерва четенията +
спестяванията. Ако четенията останат същите като при директния маршрут **и** OmniRoute докладва
компресия, доказано е, че рендерирането+препращането на OmniRoute **не деградира**
страниците.

Предпоставки (оперативни):

1. **OmniRoute работещ** (`npm run dev`, по подразбиране `http://localhost:20128`).
2. **Anthropic доставчик**, конфигуриран в OmniRoute с **истински ключ** (директен
   маршрут — вратата `providerTransport==='direct'` минава само за доставчика `anthropic`).
3. **Механизмът `omniglyph` АКТИВИРАН** в конфигурацията за компресия на OmniRoute
   (`config.engines.omniglyph.enabled = true`) — заглавката `engine:omniglyph` се задейства само
   с включен механизъм. (Механизмът е `stable:false`/преглед; активирайте го изрично.)
4. **API ключ за OmniRoute** в `OMNIROUTE_API_KEY` (този, който клиентът използва за
   автентикация срещу OmniRoute, не този на Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Всеки отговор записва `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(от заглавката на отговора `X-OmniRoute-Compression`) в JSONL-а; редът на таблицата показва
колко отговора се върнаха компресирани + медианните спестявания. **Летва P3**: същите
дословни/gist попадения като при директния маршрут (недеградация) **с** ненулев
`omnirouteSavings` (доказвайки, че е станал рендер, не прочит на суров текст). Ако се появи
`did NOT compress`, механизмът не е активиран в OmniRoute (или тялото не е минало
fail-closed вратите).

Тестове за чистите части: `tests/density-frontier.test.ts` (включва `buildOmnirouteRequest`
и `parseCompressionSavings` от транспорта via-omniroute).
