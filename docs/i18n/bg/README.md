🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Контекст като изображение

### Намалете сметката си за Claude с **59–70%**, като рендирате обемния контекст като плътни PNG страници — същото съдържание, в част от токените.

**Моделите таксуват текста на токен, но таксуват изображение по неговите размери — не по това колко текст съдържа то.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

Част от семейството [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 All languages](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| метрика | резултат | доказателство |
|---|---|---|
| Намаление на крайната сметка | **59–70%** | производствена извадка, 13 709 заявки |
| Токени на конвертиран блок | **10× по-малко** (28 080 символа: 14 040 → 1 460 токена) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Точност на формулата за таксуване | остатък **нула** при 22 измервания с `count_tokens` | `benchmarks/billing-sweep/results/` |
| Точност на точно четене, производствена конфигурация | **30/30 (100%)** при Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| Мълчаливи конфабулации в ~300 проби за четене | **0** — всеки пропуск се въздържа като `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**Класация на моделите** (може ли да чете плътни рендери? n=30 на рамо, детерминистично оценяване):

| модел | четене | присъда |
|---|---|---|
| Claude **Fable 5** | **100%** точно | ✅ производствена цел |
| Claude Opus 4.8 | 77–87% при 4× размер на глифа | ⚠️ безопасен режим по избор (спестяванията падат до ~2×) |
| GPT-5.5 | 0/60 — и надува отговорите си ~40× опитвайки | ❌ блокиран от вратата, с доказателство |
| Gemini 2.5-flash | 0/26 — и конфабулира вместо да се въздържа | ❌ блокиран (частичен тест, ограничен от квота) |

Предимството е **специфично за Fable днес** — другите визуални енкодери все още не разчитат плътни глифи. [Harness-ът за бенчмаркове](benchmarks/README.md) повторно тества всеки нов модел с една команда.

# 🤔 Защо OmniGlyph?

Всяка дълготрайна агентска сесия влачи същия мъртъв товар при всяка заявка: system prompt, документацията на инструментите и старата история — таксувани отново на токен, при всеки ход. OmniGlyph е **локален прокси**, който преобразува тези обемни части в плътни PNG страници *преди да напуснат машината ви*:

- **Точна математика на таксуването, не евристики** — изчислява реалната формула на доставчика за токени на изображение (измерена до нулев остатък) и конвертира само когато математиката печели.
- **Fail-closed по дизайн** — моделите, които не могат да четат плътни рендери, се блокират от врата, с доказателства от бенчмаркове. Никаква скрита загуба на качество.
- **Частно и локално по подразбиране** — преобразуването се случва на `127.0.0.1`; нищо допълнително не се изпраща никъде.
- **Възпроизводимо** — всяко число по-горе има доказателство в `benchmarks/*/results/`, повторно изпълнимо с една команда.

# ⚡ Бърз старт

```bash
npx omniglyph                                     # прокси на 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # насочете Claude Code към него
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Работи по два начина:
- **API ключ** (плащане на токен): сметката ви пада с 59–70% от край до край.
- **Сесия с абонамент**: не плащате по-малко, но лимитите за използване се броят в токени — така че лимитите ви се разтягат **~2–3×**.

Табло на <http://127.0.0.1:47821/>: спестени токени, всяко преобразуване текст→изображение едно до друго, аварийно копче, живи чипове на моделите. Отговорите се стриймват нормално — само *заявката* се компресира, никога изходът на модела.

# ⚙️ Как работи

```
обемен блок от заявка ──► врата за рентабилност ──► reflow + рендиране (1-бит атлас 5×8)
                       (точна математика на таксуване) ──► PNG страници 1568×728 ──► събиране обратно, приятелско към кеша
```

- **Таксуването се изчислява точно, преди конвертиране**: Anthropic таксува `⌈w/28⌉ × ⌈h/28⌉ + 4` токена на изображение (28 px пач-размери — измерено до нулев остатък). Пълна страница носи 28 080 символа за 1 460 токена ≈ **19 символа/токен**, срещу ~2 символа/токен за плътен текст. Вратата конвертира само когато математиката печели.
- **Какво се конвертира**: статичният system prompt + документацията на инструментите, старата свита история, големите резултати от инструменти.
- **Какво никога не се конвертира**: вашите съобщения, скорошните ходове, изходът на модела, разредената проза, точните до байт стойности (хешове/ID-та пътуват заедно като текст), и всеки модел, който е провалил бенчмарка за четене.

# 🧭 The honest part

- **Не е загубоустойчиво.** Точното до байт възстановяване от изображения е ненадеждно по природа. Приложени мерки: точните идентификатори пътуват като текст до изображението, а измерената производствена конфигурация даде **нула мълчаливи конфабулации** — неуспешните четения се въздържат.
- **Само Fable 5 е одобрен днес**, с доказателства. GPT-5.5 и Gemini 2.5-flash измеримо не могат да четат плътни рендери; Opus 4.8 се нуждае от 4× по-големи глифи. Вратата налага това.
- **Открихме и избегнахме капан при таксуването**: нивото за изображения с висока резолюция таксува 3,3× повече на страница, но визуалният енкодер не получава допълнителната резолюция — по-големите страници се четат *по-зле*. Измерено, документирано в [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), не е активирано.
- Цените се променят; трайната метрика е намалението на токените, което проксито записва за всяка заявка спрямо безплатен контрафактуал от `count_tokens`.

# 🔬 Възпроизведете всяко число

```bash
pnpm install && pnpm test                                     # пълен набор от тестове
node benchmarks/billing-sweep/run.mjs --dry-run               # прогнози за таксуване, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # таблица с разходи, $0
# с ключове: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (или --via-cli за абонамент за Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Пълна методология и всяка таблица с резултати: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Сурови доказателства по отговор: `benchmarks/*/results/*.jsonl`.

# 🚀 Семейството OmniRoute

OmniGlyph се доставя също и като **вграден компресионен механизъм в [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — безплатния AI шлюз. Там работи като механизъм `omniglyph` (самостоятелен режим или в стек с другите механизми), с fail-closed врати и отчитане на токени, съобразено с изображенията.

# 🛠️ Технологичен стек

| слой | технология |
|---|---|
| Език | TypeScript (strict), ESM |
| Среда на изпълнение | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Рендиране | собствен 1-битов атлас с глифи (произлязъл от Spleen/Unifont, лицензи в `assets/`) → PNG |
| Тестове | Vitest — TDD, плюс пазители за цялост на документацията и ребрандинга |
| Бенчмаркове | harness-ове в `benchmarks/` (billing-sweep, density-frontier) с JSONL доказателства |

## Структура на проекта

| път | какво |
|---|---|
| `src/` | проксито: тръбопровод за трансформация, точно таксуване на доставчик, рендерер, хостове (Node + Cloudflare Workers) |
| `benchmarks/` | harness-овете, произвели всяко число по-горе — повторно изпълними |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Поддръжка и общност

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — грешки и заявки за функции
- 🔒 [SECURITY.md](SECURITY.md) — доклади за уязвимости
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — строг TDD + измерване преди твърдения
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Лиценз

MIT — вижте [LICENSE](../../../LICENSE).
