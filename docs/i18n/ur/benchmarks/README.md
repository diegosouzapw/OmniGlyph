# بینچ مارکس

OmniGlyph جو بھی عدد دعویٰ کرتا ہے وہ ذیل کے دو ہارنسز میں سے کسی ایک سے
آتا ہے — دوبارہ چلانے کے قابل، جہاں ممکن ہو متعین، اور `*/results/*.jsonl`
میں خام فی جواب رسیدوں کے ساتھ۔ مجتمع تجزیہ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)۔

## 1. `billing-sweep/` — ایک تصویر کی اصل لاگت کیا ہے؟

لائیو Anthropic API کے خلاف مفت `count_tokens` پروبز، ریٹائر شدہ `w·h/750`
فارمولے کا موجودہ 28 px-پیچ ماڈل سے موازنہ کرتے ہوئے، 11 پروب جیومیٹریز
پر 2 ماڈلز × 2 ریزولوشن درجات میں۔

**نتیجہ (2026-07-05): پیچ ماڈل ہر پروب پر بقیہ ZERO کے ساتھ فٹ ہوتا ہے**
— بل = درجہ ری سائز کے بعد `⌈w/28⌉ × ⌈h/28⌉`، نیز ہر امیج بلاک پر
+3/+4 ٹوکنز کا ایک مقررہ اضافہ۔ پروڈکشن صفحہ (1568×728) کی لاگت بالکل
1,460 ٹوکنز ہے اور یہ 28,080 حروف رکھتا ہے ≈ **19.2 حروف/ٹوکن** بمقابلہ
گھنے متن کے طور پر ~2 حروف/ٹوکن۔

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # صرف پیش گوئیاں، $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # لائیو سویپ، اب بھی $0 (count_tokens مفت ہے)
```

## 2. `density-frontier/` — کیا ماڈل اسے واقعی پڑھ سکتا ہے؟

رینڈر کنفیگز، صفحہ جیومیٹریز، گلف ایٹلسز، اور فراہم کنندگان میں لاگت
(آف لائن، عین) × پڑھنے کی درستگی (لائیو)۔ کارپس عین-اسٹرنگ سوئیاں لگاتا
ہے (hex ids، camelCase، digit runs) نیز **پیمائش شدہ گلف-الجھن جوڑوں سے
بنائے گئے قریب-چوک مشتتات** — تاکہ خاموش من گھڑت جواب کا پتہ چلے، نہ کہ
صرف غلط شمار کیا جائے۔ اسکورنگ متعین ہے (کوئی LLM-جج نہیں):
`correct` / `abstained` (ایماندار `ILEGIVEL`) / `silent_wrong` / `no_answer`۔

**سرِفہرست نتائج** (فی بازو n=30):

| بازو | عین ریڈز | نوٹس |
|---|---:|---|
| Fable 5 · standard صفحہ · 1-bit ایٹلس (پروڈکشن) | **30/30** | صفر غلطیاں، صفر من گھڑت جوابات |
| Fable 5 · standard صفحہ · AA ایٹلس (پرانا ڈیفالٹ) | 25/30 | 5 ایماندار گریز — کیوں پروڈکشن 1-bit پر پلٹی |
| Fable 5 · high-res 1928² صفحہ | 1–2/30 | 3.3× بل ہوا لیکن انکوڈر-ری سیمپلڈ — بلنگ کا جال، فعال نہیں |
| Opus 4.8 · 10×16 گلفس | 23–26/30 | آپٹ-اِن محفوظ موڈ |
| GPT-5.5 · 768px strip (دونوں ایٹلسز) | 0/60 | + اپنے ٹیکسٹ کنٹرول (30/30، 62 ٹوکن) کے مقابلے میں ~40× آؤٹ پٹ-ٹوکن افراط زر |
| Gemini 2.5-flash (جزوی، کوٹا) | 0/26 | گریز کرنے کے بجائے من گھڑت جواب دیتا ہے |

تین ٹرانسپورٹس: براہ راست API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`)،
OpenRouter (`OPENROUTER_API_KEY`)، اور `--via-cli` (ایک Claude Code
سبسکرپشن — $0)۔ مشکل سے سیکھا گیا احتیاط: بیچوان (OpenRouter، CLI کا
Read ٹول) بڑی تصاویر کو ری سیمپل کرتے ہیں؛ صرف براہ راست-API نتائج
پڑھنے کی صلاحیت کے لیے مستند ہیں۔

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # لاگت کا جدول، $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # سبسکرپشن کے ذریعے، $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
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
