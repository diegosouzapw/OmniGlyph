# density-frontier — стоимость × точность на разрешение

🌐 Переведено: [все языки](../../../README.md)

Набор, измеряющий **Парето-границу между стоимостью и читаемостью**
рендеров текст→изображение по провайдерам (Anthropic / OpenAI / Gemini),
геометрии страницы, ячейке глифа и стилю атласа.

Более дешёвые (более плотные) страницы несут больше символов на токен, но
рано или поздно перестают быть читаемыми. Конфигурации разрешено идти в
продакшн только там, где выполняются **оба** условия — стоимость низкая
*и* модель всё ещё читает страницу идеально:

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

Каждый ответ засчитывается ровно в один из трёх исходов — средний из них и
делает гейт заслуживающим доверия:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Конфигурация, дающая хотя бы один 🔴, дисквалифицируется — неважно, насколько
она дешёвая.

Центральная асимметрия: со времён billing sweep (2026-07-05,
`benchmarks/billing-sweep/`) **стоимость точно предсказуема офлайн** — патчи
28 px + 4/блок у Anthropic (`src/core/anthropic-vision.ts`), профили
patch/tile у OpenAI (`src/core/openai.ts`), tiles/media_resolution у Gemini
(`gemini-cost.ts`). Только **точность чтения** требует API.

## Дизайн

- **Корпус** (`corpus.ts`): плотный лог/JSON-подобный наполнитель +
  заложенные needles из классов, которые матрица confusability считает
  провальными (12-символьный hex, camelCase, цифры 6/8/5/3) + **отвлекающие
  факторы near-miss**, построенные из измеренных confusable-пар. Если модель
  отвечает отвлекающим фактором, путаница была *предсказана* — именно это и
  является обнаруживаемым режимом незаметного отказа, а не просто засчитанной
  ошибкой. Детерминированно (mulberry32).
- **Конфигурации** (`configs.ts`): курируемая сетка — страницы standard
  1568×728 против high-res 1928×1928 (A/B, решающий геометрию по тиру), AA
  против 1-bit (разрешает противоречие плотного рендера), ячейка 7×10/10×16
  (безопасный режим Opus), GPT strip и две ставки Gemini (≤384² = 258 flat;
  `media_resolution: low` = 280 fixed → ~116 символов/токен *если* читаемо).
- **Оценка** (`score.ts`): детерминированное точное совпадение, без
  LLM-судьи. Три исхода: `correct` / `abstained` (сентинел ILEGIVEL —
  честный отказ) / `silent_wrong` (опасный режим), с флагом отвлекающего
  фактора.

## Запуск

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # таблица стоимости, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × конфигурация × попытка
```

Конкретные конфигурации: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Ответы попадают в `results/*.jsonl` (одна строка на вопрос, с сырым ответом
для аудита).

## Планка приёмки (унаследована от upstream PR #35/#36)

Конфигурация становится продакшн-значением по умолчанию, только если: **суть
== текстовому базовому уровню** И **ноль незаметно ошибочных точных строк**
И **положительная экономия**. Первый обязательный прогон —
`anthropic-std-5x8-aa` против `anthropic-hires-5x8-aa` на Fable — точечная
проверка читаемости большой страницы перед включением тира high-res.

## `--via-omniroute` — сквозной прогон через OmniRoute (P3: доказательство отсутствия деградации)

Транспорты выше рендерят текст→PNG **внутри набора** и отправляют
изображения. `--via-omniroute` делает наоборот — это и есть продакшн-путь:
он отправляет **плотный текст** в запущенный экземпляр OmniRoute, позволяет
движку **`omniglyph` отрендерить** страницы и переслать их в Anthropic, и
измеряет чтения + экономию. Если чтения остаются теми же, что и на прямом
маршруте, **и** OmniRoute сообщает о сжатии — доказано, что рендер+пересылка
OmniRoute **не деградируют** страницы.

Предпосылки (операционные):

1. **OmniRoute запущен** (`npm run dev`, по умолчанию `http://localhost:20128`).
2. **Провайдер Anthropic** настроен в OmniRoute с **реальным ключом** (прямой
   маршрут — гейт `providerTransport==='direct'` проходит только для
   провайдера `anthropic`).
3. **Движок `omniglyph` ВКЛЮЧЁН** в конфигурации сжатия OmniRoute
   (`config.engines.omniglyph.enabled = true`) — заголовок `engine:omniglyph`
   срабатывает только при включённом движке. (Движок — `stable:false`/preview;
   включайте его явно.)
4. **API-ключ OmniRoute** в `OMNIROUTE_API_KEY` (тот, которым клиент
   аутентифицируется в OmniRoute, не ключ Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Каждый ответ записывает `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(из заголовка ответа `X-OmniRoute-Compression`) в JSONL; строка таблицы
показывает, сколько ответов вернулось сжатыми + медианную экономию. **Планка
P3**: те же попадания verbatim/gist, что и на прямом маршруте (отсутствие
деградации) **с** ненулевым `omnirouteSavings` (доказывающим, что рендер
произошёл, а не был прочитан сырой текст). Если появляется `did NOT
compress` — значит движок не включён в OmniRoute (или тело не прошло
fail-closed гейты).

Тесты для чистых частей: `tests/density-frontier.test.ts` (включает
`buildOmnirouteRequest` и `parseCompressionSavings` из транспорта
via-omniroute).
