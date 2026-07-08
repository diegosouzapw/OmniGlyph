# density-frontier — هزینه × دقت به‌ازای هر وضوح

🌐 ترجمه‌شده: [همهٔ زبان‌ها](../../../README.md)

مجموعه‌ای که **مرز پارتو بین هزینه و خوانایی** رندرهای متن-به-تصویر را،
به‌ازای هر ارائه‌دهنده (Anthropic / OpenAI / Gemini)، هندسهٔ صفحه، سلول
گلیف، و سبک اطلس اندازه‌گیری می‌کند.

صفحات ارزان‌تر (متراکم‌تر) کاراکتر بیشتری به‌ازای هر توکن حمل می‌کنند اما
سرانجام خوانا بودن را از دست می‌دهند. یک پیکربندی فقط زمانی مجاز به عرضه
است که **هر دو** برقرار باشند — هزینه پایین است *و* مدل هنوز آن را کامل
می‌خواند:

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

هر پاسخ دقیقاً به یکی از سه پیامد امتیازدهی می‌شود — پیامد میانی همان
چیزی است که گیت را قابل‌اعتماد می‌کند:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

پیکربندی‌ای که حتی یک 🔴 تولید کند، هرچقدر هم ارزان، رد صلاحیت می‌شود.

نامتقارنی مرکزی: از زمان بررسی صورت‌حساب (2026-07-05،
`benchmarks/billing-sweep/`)، **هزینه دقیقاً به‌صورت آفلاین قابل‌پیش‌بینی
است** — پچ‌های ۲۸ پیکسلی + ۴/بلاک روی Anthropic
(`src/core/anthropic-vision.ts`)، پروفایل‌های پچ/تایل روی OpenAI
(`src/core/openai.ts`)، تایل‌ها/media_resolution روی Gemini
(`gemini-cost.ts`). فقط **دقت خواندن** به API نیاز دارد.

## طراحی

- **پیکره** (`corpus.ts`): پرکنندهٔ متراکم به‌سبک log/JSON + needleهای
  کاشته‌شده از کلاس‌هایی که ماتریس گیج‌کنندگی می‌گوید شکست می‌خورند (hex
  ۱۲ کاراکتری، camelCase، ارقام 6/8/5/3) + **distractorهای نزدیک-به-هم**
  ساخته‌شده از جفت‌های گیج‌کننده اندازه‌گیری‌شده. اگر مدل با distractor
  پاسخ دهد، سردرگمی *پیش‌بینی‌شده* بود — این همان حالت خطای بی‌صدایی است
  که تشخیص داده می‌شود، نه فقط اشتباه شمرده شود. قطعی (mulberry32).
- **پیکربندی‌ها** (`configs.ts`): شبکهٔ منتخب — صفحات استاندارد 1568×728
  در برابر وضوح‌بالا 1928×1928 (A/B که هندسهٔ به‌ازای هر لایه را تعیین
  می‌کند)، AA در برابر ۱-بیت (تناقض رندر فشرده را حل می‌کند)، سلول
  7×10/10×16 (حالت ایمن Opus)، نوار GPT، و دو شرط‌بندی Gemini (≤384² =
  258 ثابت؛ `media_resolution: low` = 280 ثابت → حدود ۱۱۶ کاراکتر/توکن
  *اگر* خوانا باشد).
- **امتیازدهی** (`score.ts`): تطابق دقیق قطعی، بدون داور LLM. سه پیامد:
  `correct` / `abstained` (نشانگر ILEGIVEL — خطای صادقانه) /
  `silent_wrong` (حالت خطرناک)، با یک پرچم distractor.

## اجرا

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # جدول هزینه، $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

پیکربندی‌های مشخص: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
پاسخ‌ها در `results/*.jsonl` قرار می‌گیرند (یک خط به‌ازای هر پرسش، همراه
با پاسخ خام برای حسابرسی).

## معیار پذیرش (به ارث برده از PRهای upstream #35/#36)

یک پیکربندی فقط زمانی به پیش‌فرض تولید تبدیل می‌شود که: **gist == خط پایهٔ
متنی** **و** **صفر رشتهٔ دقیق اشتباه بی‌صدا** **و** **صرفه‌جویی مثبت**.
اولین اجرای اجباری `anthropic-std-5x8-aa` در برابر `anthropic-hires-5x8-aa`
روی Fable است — بررسی نقطه‌ای خوانایی صفحهٔ بزرگ پیش از فعال‌سازی لایهٔ
وضوح‌بالا.

## `--via-omniroute` — سرتاسری از طریق OmniRoute (P3: اثبات عدم افت کیفیت)

لایه‌های انتقال بالا متن→PNG را **درون harness** رندر می‌کنند و تصاویر را
ارسال می‌کنند. `--via-omniroute` برعکس این کار را انجام می‌دهد، که مسیر
تولید است: **متن متراکم** را به یک نمونهٔ در حال اجرای OmniRoute ارسال
می‌کند، اجازه می‌دهد موتور **`omniglyph` صفحات را رندر** کند و به Anthropic
ارسال کند، و خواندن‌ها + صرفه‌جویی‌ها را اندازه‌گیری می‌کند. اگر خواندن‌ها
مانند مسیر مستقیم بمانند **و** OmniRoute فشرده‌سازی گزارش دهد، اثبات
می‌شود که render+forward در OmniRoute صفحات را **تخریب نمی‌کند**.

پیش‌نیازها (عملیاتی):

1. **OmniRoute در حال اجرا** (`npm run dev`، پیش‌فرض `http://localhost:20128`).
2. یک **ارائه‌دهندهٔ Anthropic** پیکربندی‌شده در OmniRoute با یک **کلید
   واقعی** (مسیر مستقیم — گیت `providerTransport==='direct'` فقط برای
   ارائه‌دهندهٔ `anthropic` عبور می‌کند).
3. موتور **`omniglyph` فعال‌شده** در پیکربندی فشرده‌سازی OmniRoute
   (`config.engines.omniglyph.enabled = true`) — هدر `engine:omniglyph`
   فقط با روشن بودن موتور فعال می‌شود. (این موتور `stable:false`/پیش‌نمایش
   است؛ آن را صریحاً فعال کنید.)
4. یک **کلید API OmniRoute** در `OMNIROUTE_API_KEY` (همان کلیدی که
   کلاینت برای احراز هویت در برابر OmniRoute استفاده می‌کند، نه کلید
   Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

هر پاسخ `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(از هدر پاسخ `X-OmniRoute-Compression`) را در JSONL ثبت می‌کند؛ ردیف
جدول نشان می‌دهد چند پاسخ فشرده برگشتند + میانهٔ صرفه‌جویی. **معیار P3**:
همان تعداد برخورد verbatim/gist مسیر مستقیم (عدم افت کیفیت) **همراه با**
`omnirouteSavings` غیر-null (اثبات این‌که یک رندر واقعاً رخ داده، نه
خواندن متن خام). اگر `did NOT compress` ظاهر شود، موتور در OmniRoute
فعال نیست (یا بدنه از گیت‌های fail-closed عبور نکرده).

تست‌ها برای بخش‌های خالص: `tests/density-frontier.test.ts` (شامل
`buildOmnirouteRequest` و `parseCompressionSavings` از لایهٔ انتقال
via-omniroute).
