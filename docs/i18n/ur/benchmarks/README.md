# بینچ مارکس

🌐 ترجمہ شدہ: [تمام زبانیں](../../README.md)

OmniGlyph جو بھی عدد دعویٰ کرتا ہے وہ ذیل کے دو ہارنسز میں سے کسی ایک سے
آتا ہے — دوبارہ چلانے کے قابل، جہاں ممکن ہو متعین، اور `*/results/*.jsonl`
میں خام فی جواب رسیدوں کے ساتھ۔ مجتمع تجزیہ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)۔

## بچت کیسے کام کرتی ہے (ایک تصویر میں)

فراہم کنندگان **متن کا بل ٹوکن کے حساب سے** لگاتے ہیں، لیکن **تصویر کا بل
اس کی جہتوں کے حساب سے** لگاتے ہیں — نہ کہ اس بات کے حساب سے کہ اس میں
کتنا متن بھرا ہوا ہے۔ ایک اسٹینڈرڈ صفحہ ایک فلیٹ لاگت ہے چاہے متن کتنا ہی
گھنا کیوں نہ ہو:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

وہی سیاق و سباق، دو طریقوں سے بل کیا گیا:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

تصویر کیوں جیتتی ہے — فی ٹوکن اٹھائے گئے حروف:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph یہ تبادلہ صرف اسی وقت کرتا ہے جب عین ریاضی کہے کہ یہ جیتتا ہے، اور
صرف ان ماڈلز کے لیے جو صفحہ پڑھنے میں ثابت شدہ ہیں۔ ذیل کے دو ہارنسز اس کے
ہر نصف کو ثابت کرتے ہیں۔

## 1. `billing-sweep/` — ایک تصویر کی اصل لاگت کیا ہے؟

لائیو Anthropic API کے خلاف مفت `count_tokens` پروبز، ریٹائر شدہ `w·h/750`
فارمولے کا موجودہ 28 px-پیچ ماڈل سے موازنہ کرتے ہوئے، 11 پروب جیومیٹریز
پر 2 ماڈلز × 2 ریزولوشن درجات میں۔

**نتیجہ (2026-07-05): پیچ ماڈل ہر پروب پر بقیہ ZERO کے ساتھ فٹ ہوتا ہے**
— بل = درجہ ری سائز کے بعد `⌈w/28⌉ × ⌈h/28⌉`، نیز ہر امیج بلاک پر
+3/+4 ٹوکنز کا ایک مقررہ اضافہ۔ پروڈکشن صفحہ (1568×728) کی لاگت بالکل
1,460 ٹوکنز ہے اور یہ 28,080 حروف رکھتا ہے ≈ **19.2 حروف/ٹوکن** بمقابلہ
گھنے متن کے طور پر ~2 حروف/ٹوکن۔

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
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

پڑھنے کی درستگی ایک نظر میں — یہی وہ fail-closed ماڈل گیٹ **ہے**، منقش:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

صرف ✅ بازو شپ ہوتا ہے۔ جو کچھ بھی خراب پڑھتا ہے اسے *ایک رسید کے ساتھ*
بلاک کیا جاتا ہے، اور تین طرفہ اسکور کا مطلب یہ ہے کہ غلط اندازہ لگانے
والے ماڈل (`silent_wrong`) کو ایماندارانہ طور پر گریز کرنے والے
(`ILEGIVEL`) سے بدتر سمجھا جاتا ہے۔

تین ٹرانسپورٹس: براہ راست API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`)،
OpenRouter (`OPENROUTER_API_KEY`)، اور `--via-cli` (ایک Claude Code
سبسکرپشن — $0)۔ مشکل سے سیکھا گیا احتیاط: بیچوان (OpenRouter، CLI کا
Read ٹول) بڑی تصاویر کو ری سیمپل کرتے ہیں؛ صرف براہ راست-API نتائج
پڑھنے کی صلاحیت کے لیے مستند ہیں۔

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

خالص حصوں کو پن کرنے والے یونٹ ٹیسٹس (کارپس، اسکورنگ، لاگت فارمولے):
`tests/billing-sweep-formulas.test.ts`، `tests/density-frontier.test.ts`،
`tests/anthropic-vision.test.ts`، `tests/gemini-profiles.test.ts`،
`tests/gpt-billing-audit.test.ts`۔
