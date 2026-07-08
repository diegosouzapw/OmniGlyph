# density-frontier — فی ریزولوشن لاگت × درستگی

🌐 ترجمہ شدہ: [تمام زبانیں](../../../README.md)

ایک ہارنس جو متن→تصویر رینڈرز کے **لاگت اور پڑھنے کی صلاحیت کے درمیان
Pareto فرنٹیئر** کی پیمائش کرتا ہے، فی فراہم کنندہ (Anthropic / OpenAI /
Gemini)، صفحہ جیومیٹری، گلف سیل، اور ایٹلس اسٹائل۔

سستے (زیادہ گھنے) صفحات فی ٹوکن زیادہ حروف اٹھاتے ہیں لیکن بالآخر پڑھنے
کے قابل نہیں رہتے۔ کوئی کنفیگ شپ کرنے کی اجازت صرف اسی وقت پاتی ہے جب
**دونوں** پورے ہوں — لاگت کم *ہو* *اور* ماڈل اسے اب بھی کامل طور پر پڑھے:

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

ہر جواب کو تین نتائج میں سے بالکل ایک میں اسکور کیا جاتا ہے — درمیانہ
والا وہ ہے جو گیٹ کو قابلِ اعتماد بناتا ہے:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

کوئی بھی کنفیگ جو ایک بھی 🔴 پیدا کرے نااہل ہے، چاہے وہ کتنی ہی سستی
کیوں نہ ہو۔

مرکزی عدم مساوات: billing sweep (2026-07-05، `benchmarks/billing-sweep/`)
کے بعد سے، **لاگت آف لائن بالکل قابلِ پیش گوئی ہے** — Anthropic پر
(`src/core/anthropic-vision.ts`) 28 px پیچز + 4/بلاک، OpenAI پر
(`src/core/openai.ts`) پیچ/ٹائل پروفائلز، Gemini پر (`gemini-cost.ts`)
ٹائلز/media_resolution۔ صرف **پڑھنے کی درستگی** کو API درکار ہے۔

## ڈیزائن

- **کارپس** (`corpus.ts`): گھنا log/JSON-اسٹائل فلر + الجھن میٹرکس کے
  مطابق ناکام ہونے والی کلاسوں سے لگائی گئی سوئیاں (12-حرف hex،
  camelCase، ہندسے 6/8/5/3) + پیمائش شدہ الجھن جوڑوں سے بنائے گئے
  **قریب-چوک مشتتات**۔ اگر ماڈل مشتت کے ساتھ جواب دیتا ہے، تو الجھن کی
  *پیش گوئی* کی گئی تھی — یہی وہ خاموش ناکامی کا طریقہ ہے جسے پتہ لگایا
  جا رہا ہے، نہ کہ صرف غلط شمار کیا جا رہا ہے۔ متعین (mulberry32)۔
- **کنفیگز** (`configs.ts`): منتخب گرڈ — standard 1568×728 صفحات
  بمقابلہ high-res 1928×1928 (وہ A/B جو فی درجہ جیومیٹری کا فیصلہ کرتا
  ہے)، AA بمقابلہ 1-bit (گھنے رینڈر کے تضاد کو حل کرتا ہے)، 7×10/10×16
  سیل (Opus محفوظ موڈ)، GPT strip، اور دو Gemini شرطیں (≤384² = 258
  فلیٹ؛ `media_resolution: low` = 280 مقررہ → ~116 حروف/ٹوکن *اگر* خواندہ ہو)۔
- **اسکور** (`score.ts`): متعین عین میچ، کوئی LLM-جج نہیں۔ تین نتائج:
  `correct` / `abstained` (ILEGIVEL سینٹینل — ایماندار ناکامی) /
  `silent_wrong` (خطرناک طریقہ)، مشتت فلیگ کے ساتھ۔

## چلانا

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

مخصوص کنفیگز: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`۔
جوابات `results/*.jsonl` میں جاتے ہیں (آڈٹنگ کے لیے خام جواب کے ساتھ فی
سوال ایک لائن)۔

## قبولیت کا معیار (اپ اسٹریم PRs #35/#36 سے وراثت میں ملا)

کوئی کنفیگ صرف اسی وقت پروڈکشن ڈیفالٹ بنتی ہے جب: **gist == متن بیس
لائن** اور **صفر خاموش غلط عین اسٹرنگز** اور **مثبت بچت**۔ پہلا لازمی
رن Fable پر `anthropic-std-5x8-aa` بمقابلہ `anthropic-hires-5x8-aa` ہے —
ہائی-ریز درجے کو فعال کرنے سے پہلے بڑے صفحے کی پڑھنے کی صلاحیت کا اسپاٹ چیک۔

## `--via-omniroute` — OmniRoute کے ذریعے e2e (P3: عدم-تنزلی کا ثبوت)

اوپر دیے گئے ٹرانسپورٹس متن→PNG کو **ہارنس میں** رینڈر کرتے ہیں اور
تصاویر بھیجتے ہیں۔ `--via-omniroute` اس کے برعکس کرتا ہے، جو پروڈکشن
پاتھ ہے: یہ **گھنا متن** ایک چلتے ہوئے OmniRoute انسٹینس کو بھیجتا ہے،
**`omniglyph` انجن کو صفحات رینڈر** کرنے اور Anthropic کو آگے بھیجنے
دیتا ہے، اور ریڈز + بچت کی پیمائش کرتا ہے۔ اگر ریڈز براہ راست روٹ کے
جتنی ہی رہیں **اور** OmniRoute کمپریشن رپورٹ کرے، تو یہ ثابت ہو جاتا ہے
کہ OmniRoute کا render+forward صفحات کو **تنزلی کا شکار نہیں کرتا**۔

پیشگی شرائط (آپریشنل):

1. **OmniRoute چل رہا ہو** (`npm run dev`، ڈیفالٹ `http://localhost:20128`)۔
2. OmniRoute میں ایک **اصل کلید** کے ساتھ ایک **Anthropic فراہم کنندہ**
   کنفیگر شدہ ہو (براہ راست روٹ — `providerTransport==='direct'` گیٹ
   صرف `anthropic` فراہم کنندہ کے لیے پاس ہوتا ہے)۔
3. OmniRoute کے کمپریشن کنفیگ میں **`omniglyph` انجن فعال** ہو
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`
   ہیڈر صرف انجن کے آن ہونے پر فائر ہوتا ہے۔ (انجن `stable:false`/preview
   ہے؛ اسے واضح طور پر فعال کریں۔)
4. `OMNIROUTE_API_KEY` میں ایک **OmniRoute API کلید** ہو (وہ جو کلائنٹ
   OmniRoute کے خلاف تصدیق کے لیے استعمال کرتا ہے، Anthropic والی نہیں)۔

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

ہر جواب JSONL میں `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(ریسپانس ہیڈر `X-OmniRoute-Compression` سے) ریکارڈ کرتا ہے؛ جدول کی
قطار دکھاتی ہے کہ کتنے جوابات کمپریسڈ واپس آئے + میڈین بچت۔ **P3
معیار**: براہ راست روٹ جتنے verbatim/gist ہٹس (عدم-تنزلی) **کے ساتھ**
non-null `omnirouteSavings` (ثابت کرتا ہے کہ ایک رینڈر ہوا، raw-text
ریڈ نہیں)۔ اگر `did NOT compress` نظر آئے، تو انجن OmniRoute میں فعال
نہیں ہے (یا باڈی fail-closed گیٹس سے نہیں گزری)۔

خالص حصوں کے لیے ٹیسٹس: `tests/density-frontier.test.ts` (via-omniroute
ٹرانسپورٹ سے `buildOmnirouteRequest` اور `parseCompressionSavings` شامل)۔
