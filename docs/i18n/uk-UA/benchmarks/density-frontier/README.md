# density-frontier — вартість × точність за роздільністю

🌐 Перекладено: [усі мови](../../../README.md)

Тестовий стенд, що вимірює **межу Парето між вартістю і читабельністю**
рендерів текст→зображення, за провайдером (Anthropic / OpenAI / Gemini),
геометрією сторінки, коміркою гліфа і стилем атласу.

Дешевші (щільніші) сторінки несуть більше символів на токен, але зрештою
перестають бути читабельними. Конфігурація може йти у продакшн лише там,
де виконуються **обидві** умови — вартість низька *і* модель все ще читає
її ідеально:

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

Кожна відповідь оцінюється рівно в один з трьох результатів — середній є
тим, що робить гейт надійним:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

Конфігурація, що видає хоча б один 🔴, дискваліфікується — незалежно від
того, наскільки вона дешева.

Центральна асиметрія: після billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **вартість точно передбачувана офлайн** —
патчі 28 px + 4/блок на Anthropic (`src/core/anthropic-vision.ts`),
профілі patch/tile на OpenAI (`src/core/openai.ts`), tiles/media_resolution
на Gemini (`gemini-cost.ts`). Лише **точність читання** потребує API.

## Дизайн

- **Корпус** (`corpus.ts`): щільний лог/JSON-подібний наповнювач +
  закладені needle-питання з класів, які, за матрицею плутанини, дають
  збій (12-char hex, camelCase, digits 6/8/5/3) + **дистрактори "майже
  промах"**, побудовані з виміряних плутаних пар. Якщо модель відповідає
  дистрактором, плутанина була *передбачена* — це і є режим мовчазного
  збою, що виявляється, а не просто рахується як помилка. Детерміновано
  (mulberry32).
- **Конфігурації** (`configs.ts`): курована сітка — стандартні сторінки
  1568×728 проти high-res 1928×1928 (A/B, що вирішує геометрію за
  тарифом), AA проти 1-bit (розв'язує суперечність щільного рендерингу),
  комірка 7×10/10×16 (безпечний режим Opus), смуга GPT і дві ставки
  Gemini (≤384² = 258 flat; `media_resolution: low` = 280 фіксовано →
  ~116 chars/token *якщо* читабельно).
- **Оцінка** (`score.ts`): детермінований точний збіг, без LLM-судді.
  Три результати: `correct` / `abstained` (сентинел ILEGIVEL — чесний
  збій) / `silent_wrong` (небезпечний режим), з прапорцем дистрактора.

## Запуск

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

Конкретні конфігурації: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Відповіді потрапляють у `results/*.jsonl` (один рядок на питання, з сирою
відповіддю для аудиту).

## Планка прийняття (успадкована з апстрім PR #35/#36)

Конфігурація стає дефолтом продакшну лише якщо: **gist == текстовий
базовий рівень** І **нуль мовчазних помилок точного рядка** І **позитивна
економія**. Перший обов'язковий прогін — `anthropic-std-5x8-aa` проти
`anthropic-hires-5x8-aa` на Fable — вибіркова перевірка читабельності
великої сторінки перед увімкненням тарифу high-res.

## `--via-omniroute` — наскрізно через OmniRoute (P3: доказ відсутності деградації)

Транспорти вище рендерять текст→PNG **у тестовому стенді** і надсилають
зображення. `--via-omniroute` робить протилежне, що і є продакшн-шляхом:
він надсилає **щільний текст** до запущеного екземпляра OmniRoute, дає
движку **`omniglyph` відрендерити** сторінки й переслати їх до Anthropic,
і вимірює читання + економію. Якщо читання залишаються такими самими, як
на прямому маршруті, **і** OmniRoute звітує про стиснення, доведено, що
рендер+пересилання OmniRoute **не деградує** сторінки.

Передумови (операційні):

1. **OmniRoute запущений** (`npm run dev`, дефолт `http://localhost:20128`).
2. **Провайдер Anthropic**, налаштований в OmniRoute з **реальним ключем**
   (прямий маршрут — гейт `providerTransport==='direct'` проходить лише
   для провайдера `anthropic`).
3. **Движок `omniglyph` УВІМКНЕНО** у конфігурації стиснення OmniRoute
   (`config.engines.omniglyph.enabled = true`) — заголовок
   `engine:omniglyph` спрацьовує лише коли движок увімкнено. (Движок —
   `stable:false`/попередній перегляд; вмикайте його явно.)
4. **API-ключ OmniRoute** у `OMNIROUTE_API_KEY` (той, яким клієнт
   автентифікується проти OmniRoute, не ключ Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Кожна відповідь фіксує `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(із заголовка відповіді `X-OmniRoute-Compression`) у JSONL; рядок таблиці
показує, скільки відповідей повернулося стиснутими + медіанну економію.
**Планка P3**: ті самі влучення verbatim/gist, що й на прямому маршруті
(відсутність деградації) **з** ненульовим `omnirouteSavings` (доводить, що
рендер відбувся, а не читання сирого тексту). Якщо з'являється `did NOT
compress`, движок не увімкнено в OmniRoute (або тіло не пройшло
fail-closed гейти).

Тести для чистих частин: `tests/density-frontier.test.ts` (включає
`buildOmnirouteRequest` та `parseCompressionSavings` з транспорту
via-omniroute).
