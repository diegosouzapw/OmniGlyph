# density-frontier — التكلفة × الدقة لكل مستوى دقة

حزمة تقيس **حدود باريتو بين التكلفة والوضوح** لرندرات نص←صورة، لكل
مزوّد (Anthropic / OpenAI / Gemini)، هندسة الصفحة، خلية الرمز، ونمط
الأطلس.

عدم التماثل المركزي: منذ مسح الفوترة (2026-07-05،
`benchmarks/billing-sweep/`)، **التكلفة قابلة للتنبؤ بدقة دون اتصال** — رقاقات
28 بكسل + 4/كتلة على Anthropic (`src/core/anthropic-vision.ts`)، ملفات تعريف
رقاقة/بلاطة على OpenAI (`src/core/openai.ts`)، بلاطات/media_resolution على
Gemini (`gemini-cost.ts`). فقط **دقة القراءة** تحتاج الـ API.

## التصميم

- **المجموعة** (`corpus.ts`): حشو كثيف على طراز log/JSON + ألغاز مزروعة من
  الفئات التي تقول مصفوفة الخلط إنها تفشل (hex بـ12 حرفًا، camelCase،
  أرقام 6/8/5/3) + **مشتِّتات قريبة الشبه** مبنية من أزواج
  الخلط المقيسة. إذا أجاب النموذج بالمشتِّت، كان الخلط
  *متوقَّعًا* — هذا هو نمط الفشل الصامت المُكتشَف، لا مجرد
  عدّه خطأً. حتمي (mulberry32).
- **الإعدادات** (`configs.ts`): شبكة منسَّقة — صفحات قياسية 1568×728 مقابل
  دقة عالية 1928×1928 (اختبار A/B الذي يحسم هندسة كل مستوى)، AA مقابل
  أحادي البت (يحلّ تناقض الرندر الكثيف)، خلية 7×10/10×16 (وضع Opus
  الآمن)، شريط GPT، ورهانا Gemini الاثنان (≤384² = 258 ثابتة؛
  `media_resolution: low` = 280 ثابتة ← ~116 حرف/رمز *إن كانت واضحة*).
- **التقييم** (`score.ts`): تطابق حرفي حتمي، بلا حكم LLM. ثلاث
  نتائج: `correct` / `abstained` (سِمة `ILEGIVEL` — فشل صادق) /
  `silent_wrong` (النمط الخطر)، مع علامة مشتِّت.

## التشغيل

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # جدول التكلفة، $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 ألغاز+3 جوهر × إعداد × محاولة
```

إعدادات محدَّدة: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
تُسجَّل الإجابات في `results/*.jsonl` (سطر واحد لكل سؤال، مع الإجابة الخام
للتدقيق).

## شرط القبول (موروث من upstream PRs #35/#36)

يصبح الإعداد افتراضيًا إنتاجيًا فقط إذا: **الجوهر == ضابط النص** و
**صفر سلاسل خاطئة صامتة** و**وفورات إيجابية**. أول تشغيل إلزامي هو
`anthropic-std-5x8-aa` مقابل `anthropic-hires-5x8-aa` على Fable —
فحص وضوح سريع للصفحة الكبيرة قبل تفعيل مستوى الدقة العالية.

## `--via-omniroute` — من طرف إلى طرف عبر OmniRoute (P3: إثبات عدم التدهور)

طبقات النقل أعلاه ترندر نص←PNG **داخل الحزمة** وترسل الصور.
`--via-omniroute` يفعل العكس، وهو المسار الإنتاجي: يرسل
**النص الكثيف** إلى نسخة OmniRoute قيد التشغيل، ويترك محرك **`omniglyph`
يرندر** الصفحات ويوجّهها إلى Anthropic، ويقيس القراءات + الوفورات. إذا
بقيت القراءات كما هي في المسار المباشر **و** أبلغ OmniRoute عن ضغط، يثبُت
أن رندر+توجيه OmniRoute **لا يُدهور** الصفحات.

المتطلبات المسبقة (تشغيلية):

1. **OmniRoute قيد التشغيل** (`npm run dev`، الافتراضي `http://localhost:20128`).
2. **مزوّد Anthropic** مُهيَّأ في OmniRoute بمفتاح حقيقي (المسار
   المباشر — بوّابة `providerTransport==='direct'` تمر فقط لمزوّد `anthropic`).
3. **محرك `omniglyph` مُفعَّل** في إعداد ضغط OmniRoute
   (`config.engines.omniglyph.enabled = true`) — ترويسة `engine:omniglyph` تُفعَّل فقط
   عندما يكون المحرك مُشغّلًا. (المحرك `stable:false`/معاينة؛ فعّله صراحةً.)
4. **مفتاح API لـ OmniRoute** في `OMNIROUTE_API_KEY` (الذي يستخدمه العميل
   للمصادقة أمام OmniRoute، وليس مفتاح Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

يسجّل كل جواب `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(من ترويسة الاستجابة `X-OmniRoute-Compression`) في JSONL؛ يعرض صف الجدول
عدد الإجابات التي عادت مضغوطة + متوسط الوفورات. **شرط P3**: نفس نتائج
الحرفي/الجوهر كالمسار المباشر (عدم تدهور) **مع** `omnirouteSavings` غير فارغة
(إثبات أن رندرًا حدث، لا قراءة نص خام). إذا ظهر `did NOT compress`،
فالمحرك غير مُفعَّل في OmniRoute (أو المتن لم يجتز بوابات الفشل المغلق).

اختبارات للأجزاء الخالصة: `tests/density-frontier.test.ts` (يشمل `buildOmnirouteRequest`
و`parseCompressionSavings` من طبقة نقل via-omniroute).
