🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — بستر (context) به‌شکل تصویر

### هزینهٔ Claude خود را با **59 تا 70 درصد** کاهش دهید، با رندر کردن بستر حجیم به‌صورت صفحات PNG فشرده — همان محتوا، با بخش کوچکی از توکن‌ها.

**مدل‌ها متن را بر اساس هر توکن صورت‌حساب می‌کنند، اما یک تصویر را بر اساس ابعادش صورت‌حساب می‌کنند — نه بر اساس میزان متنی که داخل آن است.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated-------)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part--)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

بخشی از خانوادهٔ [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 همهٔ زبان‌ها](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated (اعداد و ارقام — اندازه‌گیری‌شده، نه تخمینی)

| معیار | نتیجه | رسید |
|---|---|---|
| کاهش صورت‌حساب سرتاسری | **59 تا 70 درصد** | ترافیک واقعی تولید، 13,709 درخواست |
| توکن به‌ازای هر بلاک تبدیل‌شده | **۱۰ برابر کمتر** (28,080 کاراکتر: 14,040 → 1,460 توکن) | [billing sweep](benchmarks/billing-sweep/README.md) |
| دقت فرمول صورت‌حساب | باقی‌ماندهٔ **صفر** در 22 پروب `count_tokens`، 2 مدل × 2 لایه | `benchmarks/billing-sweep/results/` |
| دقت خواندن دقیق، پیکربندی تولید | **30/30 (100%)** روی Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| ساخته‌شدن خیالی و بی‌صدا (confabulation) در حدود 300 پروب خواندن | **0** — هر خطا به‌صورت صادقانه به‌عنوان `ILEGIVEL` امتناع می‌کند | `benchmarks/density-frontier/results/` |

**کارنامهٔ مدل‌ها** (آیا می‌توانند رندرهای فشرده را بخوانند؟ n=30 برای هر بازو، امتیازدهی قطعی):

| مدل | خواندن | نتیجه |
|---|---|---|
| Claude **Fable 5** | **100%** دقیق | ✅ هدف تولید |
| Claude Opus 4.8 | 77 تا 87 درصد با اندازهٔ گلیف ۴ برابر | ⚠️ حالت ایمن اختیاری (صرفه‌جویی به ~۲ برابر کاهش می‌یابد) |
| GPT-5.5 | 0/60 — و پاسخ‌هایش را حدود ۴۰ برابر متورم می‌کند | ❌ توسط گیت مسدود شده، با اثبات |
| Gemini 2.5-flash | 0/26 — و به‌جای امتناع، ساخته‌ی خیالی تولید می‌کند | ❌ مسدود (تست جزئی، محدود به سهمیه) |

این برتری امروز **مختص Fable** است — سایر رمزگذارهای بینایی هنوز قادر به تفکیک گلیف‌های فشرده نیستند. [مجموعهٔ بنچمارک](benchmarks/README.md) هر مدل جدید را با یک دستور مجدداً آزمایش می‌کند.

# 🤔 چرا OmniGlyph؟

هر نشست طولانی‌مدت عامل (agent) در هر درخواست همان بار مرده را با خود می‌کشد: system prompt، مستندات ابزارها، و تاریخچهٔ قدیمی — که در هر نوبت دوباره بر اساس توکن صورت‌حساب می‌شود. OmniGlyph یک **پراکسی محلی** است که این بخش‌های حجیم را *پیش از خروج از دستگاه شما* به صفحات PNG فشرده تبدیل می‌کند:

- **ریاضیات دقیق صورت‌حساب، نه ابتکاری (heuristic)** — فرمول واقعی توکن تصویر هر ارائه‌دهنده را محاسبه می‌کند (اندازه‌گیری‌شده تا باقی‌ماندهٔ صفر) و فقط زمانی تبدیل می‌کند که ریاضیات به نفع باشد.
- **طراحی fail-closed** — مدل‌هایی که نمی‌توانند رندرهای فشرده را بخوانند توسط یک گیت مسدود می‌شوند، با رسید بنچمارک. هیچ افت کیفیت پنهانی وجود ندارد.
- **خصوصی و محلی-محور** — بازنویسی روی `127.0.0.1` انجام می‌شود؛ چیز اضافه‌ای به هیچ‌جا ارسال نمی‌شود.
- **قابل بازتولید** — هر عددی که در بالا آمده رسیدی در `benchmarks/*/results/` دارد که با یک دستور قابل اجرای مجدد است.

# ⚡ شروع سریع

```bash
npx omniglyph                                     # پراکسی روی 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # Claude Code را به آن اشاره دهید
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

به هر دو شکل کار می‌کند:
- **کلید API** (پرداخت به‌ازای هر توکن): صورت‌حساب شما ۵۹ تا ۷۰ درصد سرتاسری کاهش می‌یابد.
- **نشست اشتراکی (subscription)**: هزینهٔ کمتری نمی‌پردازید، اما محدودیت‌های مصرف بر اساس توکن شمارش می‌شوند — پس محدودیت‌های شما **حدود ۲ تا ۳ برابر** کش می‌آید.

داشبورد در آدرس <http://127.0.0.1:47821/>: توکن‌های صرفه‌جویی‌شده، هر تبدیل متن به تصویر کنار هم، کلید خاموش/روشن (kill switch)، تراشه‌های زندهٔ مدل. پاسخ‌ها به‌طور معمول استریم می‌شوند — فقط *درخواست* فشرده می‌شود، هرگز خروجی مدل.

# ⚙️ چگونه کار می‌کند

```
بلاک حجیم درخواست ──► گیت سودآوری ──► reflow + رندر (اطلس ۱-بیتی ۵×۸)
                       (ریاضیات دقیق صورت‌حساب)     ──► صفحات PNG با اندازهٔ 1568×728 ──► چسباندن مجدد، سازگار با کش
```

- **صورت‌حساب پیش از تبدیل، دقیقاً محاسبه می‌شود**: Anthropic به‌ازای هر تصویر `⌈w/28⌉ × ⌈h/28⌉ + 4` توکن صورت‌حساب می‌کند (پچ‌های ۲۸ پیکسلی — اندازه‌گیری‌شده تا باقی‌ماندهٔ صفر). یک صفحهٔ کامل 28,080 کاراکتر را در 1,460 توکن جای می‌دهد ≈ **۱۹ کاراکتر بر توکن**، در برابر حدود ۲ کاراکتر بر توکن برای متن فشرده. گیت فقط زمانی تبدیل می‌کند که ریاضیات به نفع باشد.
- **چه چیزی تبدیل می‌شود**: system prompt ثابت + مستندات ابزارها، تاریخچهٔ جمع‌شدهٔ قدیمی، خروجی‌های بزرگ ابزارها.
- **چه چیزی هرگز تبدیل نمی‌شود**: پیام‌های شما، نوبت‌های اخیر، خروجی مدل، نثر پراکنده، مقادیر بایت-دقیق (هش‌ها/شناسه‌ها به‌صورت متن در کنار آن سوار می‌شوند)، و هر مدلی که در بنچمارک خواندن رد شده باشد.

# 🧭 The honest part (بخش صادقانه)

- **این روش با اُفت کیفیت (lossy) است.** بازیابی بایت-دقیق از تصاویر ذاتاً غیرقابل‌اتکاست. راهکارهای کاهشی اعمال‌شده: شناسه‌های دقیق به‌صورت متن کنار تصویر حرکت می‌کنند، و پیکربندی تولیدی اندازه‌گیری‌شده **صفر ساخته‌ی خیالی بی‌صدا** تولید کرده — خواندن‌های ناموفق امتناع می‌کنند.
- **امروز فقط Fable 5 تأیید شده است**، با رسید. GPT-5.5 و Gemini 2.5-flash به‌طور قابل‌اندازه‌گیری قادر به خواندن رندرهای فشرده نیستند؛ Opus 4.8 به گلیف‌های ۴ برابر بزرگ‌تر نیاز دارد. گیت این را اعمال می‌کند.
- **یک تلهٔ صورت‌حساب پیدا کردیم و از آن اجتناب کردیم**: لایهٔ تصویر با وضوح بالا به‌ازای هر صفحه ۳.۳ برابر بیشتر صورت‌حساب می‌شود، اما رمزگذار بینایی وضوح اضافی را دریافت نمی‌کند — صفحات بزرگ‌تر *بدتر* خوانده می‌شوند. اندازه‌گیری‌شده، مستندسازی‌شده در [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)، فعال نشده.
- قیمت‌ها تغییر می‌کنند؛ معیار پایدار همان کاهش توکن است، که پراکسی آن را به‌ازای هر درخواست در برابر یک ضدواقعیت (counterfactual) رایگان `count_tokens` ثبت می‌کند.

# 🔬 هر عدد را بازتولید کنید

```bash
pnpm install && pnpm test                                     # مجموعهٔ کامل تست‌ها
node benchmarks/billing-sweep/run.mjs --dry-run               # پیش‌بینی‌های صورت‌حساب، $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # جدول هزینه، $0
# با کلیدها: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (یا --via-cli برای اشتراک Claude Code)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

روش‌شناسی کامل و هر جدول نتیجه: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). رسیدهای خام هر پاسخ: `benchmarks/*/results/*.jsonl`.

# 🚀 خانوادهٔ OmniRoute

OmniGlyph همچنین به‌عنوان یک **موتور فشرده‌سازی بومی درون [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — دروازهٔ رایگان هوش مصنوعی — عرضه می‌شود. در آنجا به‌عنوان موتور `omniglyph` اجرا می‌شود (حالت مستقل تکی یا هم‌پشته با سایر موتورها)، همراه با گیت‌های fail-closed و حسابداری توکن آگاه از تصویر.

# 🛠️ پشتهٔ فناوری

| لایه | فناوری |
|---|---|
| زبان | TypeScript (strict), ESM |
| زمان اجرا | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| رندر | اطلس گلیف ۱-بیتی اختصاصی (برگرفته از Spleen/Unifont، مجوزها در `assets/`) → PNG |
| تست‌ها | Vitest — TDD، به‌همراه گاردهای docs-integrity و rebrand |
| بنچمارک‌ها | مجموعه‌های `benchmarks/` (billing-sweep، density-frontier) با رسیدهای JSONL |

## چیدمان پروژه

| مسیر | چیست |
|---|---|
| `src/` | پراکسی: pipeline تبدیل، صورت‌حساب دقیق به‌ازای هر ارائه‌دهنده، رندرر، هاست‌ها (Node + Cloudflare Workers) |
| `benchmarks/` | مجموعه‌هایی که هر عدد بالا را تولید کرده‌اند — قابل اجرای مجدد |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 پشتیبانی و انجمن

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — گزارش باگ و درخواست ویژگی
- 🔒 [SECURITY.md](SECURITY.md) — گزارش آسیب‌پذیری
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD سخت‌گیرانه + اندازه‌گیری پیش از ادعا
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 مجوز

MIT — به [LICENSE](../../../LICENSE) مراجعه کنید.
