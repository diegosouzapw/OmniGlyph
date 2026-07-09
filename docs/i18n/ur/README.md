🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — سیاق و سباق بطور تصویر

### اپنا Claude بل **59–70%** کم کریں، بھاری سیاق و سباق کو گھنے PNG صفحات کی صورت میں رینڈر کر کے — وہی مواد، ٹوکنز کے ایک حصے میں۔

**ماڈلز متن کا بل ہر ٹوکن کے حساب سے کرتے ہیں، لیکن تصویر کا بل اس کے طول و عرض کے حساب سے کرتے ہیں — نہ کہ اس میں موجود متن کی مقدار کے حساب سے۔**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) خاندان کا حصہ · [🌐 تمام زبانیں](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| پیمانہ | نتیجہ | رسید |
|---|---|---|
| اینڈ ٹو اینڈ بل میں کمی | **59–70%** | پروڈکشن ٹریس، 13,709 درخواستیں |
| ہر تبدیل شدہ بلاک کے فی ٹوکن | **10× کم** (28,080 حروف: 14,040 → 1,460 ٹوکنز) | [billing sweep](benchmarks/billing-sweep/README.md) |
| بلنگ فارمولے کی درستگی | 22 `count_tokens` پروبز، 2 ماڈلز × 2 درجات میں **صفر** بقیہ | `benchmarks/billing-sweep/results/` |
| عین مطابق پڑھنے کی درستگی، پروڈکشن کنفیگ | Claude Fable 5 پر **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| تقریباً 300 ریڈ پروبز میں خاموش من گھڑت جوابات | **0** — ہر ناکامی `ILEGIVEL` کے طور پر گریز کرتی ہے | `benchmarks/density-frontier/results/` |

**ماڈل اسکور کارڈ** (کیا یہ گھنے رینڈرز پڑھ سکتا ہے؟ فی بازو n=30، متعین اسکورنگ):

| ماڈل | پڑھائی | فیصلہ |
|---|---|---|
| Claude **Fable 5** | **100%** عین مطابق | ✅ پروڈکشن ہدف |
| Claude Opus 4.8 | 4× گلف سائز پر 77–87% | ⚠️ اختیاری محفوظ موڈ (بچت گھٹ کر ~2× ہو جاتی ہے) |
| GPT-5.5 | 0/60 — اور کوشش میں اپنے جواب ~40× پھلا دیتا ہے | ❌ گیٹ کے ذریعے مسدود، ثبوت کے ساتھ |
| Gemini 2.5-flash | 0/26 — اور گریز کرنے کے بجائے من گھڑت جواب دیتا ہے | ❌ مسدود (جزوی ٹیسٹ، کوٹے کی حد کے باعث) |

یہ برتری آج **صرف Fable تک محدود** ہے — دیگر ویژن انکوڈرز ابھی تک گھنے گلفس کو حل نہیں کر پاتے۔ [بینچ مارک ہارنس](benchmarks/README.md) کسی بھی نئے ماڈل کو ایک کمانڈ میں دوبارہ جانچ لیتا ہے۔

# 🤔 OmniGlyph کیوں؟

ہر طویل چلنے والا ایجنٹ سیشن ہر درخواست پر وہی مردہ وزن کھینچتا ہے: سسٹم پرامپٹ، ٹول دستاویزات، اور پرانی تاریخ — جس کا ہر باری پر فی ٹوکن دوبارہ بل بنتا ہے۔ OmniGlyph ایک **لوکل پراکسی** ہے جو ان بھاری حصوں کو *آپ کی مشین سے نکلنے سے پہلے* گھنے PNG صفحات میں تبدیل کر دیتا ہے:

- **عین بلنگ ریاضی، اندازہ نہیں** — یہ فراہم کنندہ کا حقیقی امیج-ٹوکن فارمولا (صفر بقیہ تک پیمائش شدہ) شمار کرتا ہے اور صرف اسی وقت تبدیل کرتا ہے جب ریاضی فائدہ مند ہو۔
- **بہ نیت ناکام-بند (fail-closed)** — جو ماڈلز گھنے رینڈرز پڑھ نہیں سکتے انہیں بینچ مارک رسیدوں کے ساتھ ایک گیٹ روک دیتا ہے۔ کوئی خاموش معیار کا نقصان نہیں۔
- **نجی اور مقامی-اولین** — تبدیلی `127.0.0.1` پر ہوتی ہے؛ کہیں اور کچھ بھی اضافی نہیں بھیجا جاتا۔
- **قابل تکرار** — اوپر دیے گئے ہر عدد کی `benchmarks/*/results/` میں ایک رسید موجود ہے، جو ایک کمانڈ میں دوبارہ چلائی جا سکتی ہے۔

# ⚡ فوری آغاز

```bash
npx omniglyph                                     # پراکسی 127.0.0.1:47821 پر
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # Claude Code کو اس کی طرف اشارہ کریں
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

دونوں طریقوں سے کام کرتا ہے:
- **API کلید** (فی ٹوکن ادائیگی): آپ کا بل اینڈ ٹو اینڈ 59–70% کم ہو جاتا ہے۔
- **سبسکرپشن سیشن**: آپ کم ادائیگی نہیں کرتے، لیکن استعمال کی حدیں ٹوکنز کے حساب سے شمار ہوتی ہیں — اس لیے آپ کی حدیں **~2–3×** تک پھیل جاتی ہیں۔

<http://127.0.0.1:47821/> پر ڈیش بورڈ: بچائے گئے ٹوکنز، ہر متن→تصویر تبدیلی شانہ بشانہ، کِل سوئچ، لائیو ماڈل چپس۔ جوابات معمول کے مطابق سٹریم ہوتے ہیں — صرف *درخواست* کمپریس ہوتی ہے، ماڈل کا آؤٹ پٹ کبھی نہیں۔

# 🔌 Claude کلائنٹس کے ساتھ استعمال

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ ڈیش بورڈ

پیکج کے اندر ایک مکمل لوکل ڈیش بورڈ شامل ہے — آف لائن، سنگل فائل، صفر بیرونی درخواستیں۔ چھ صفحات، جو درخواستوں کے بہاؤ کے دوران SSE کے ذریعے لائیو اپ ڈیٹ ہوتے ہیں:

![جائزہ: مشن کنٹرول KPI کارڈز، بچت اسپارک لائن اور لائیو ایونٹ فیڈ](../../assets/dashboard-overview.png)

- **جائزہ** — مشن کنٹرول: بچت %، $ بچائے گئے، لیٹنسی p95، کیش ہٹس، ایررز، لائیو فیڈ۔
- **لائیو فلو** — پائپ لائن بطور نوڈ گراف: کلائنٹ → گیٹ → رینڈرر / پاس تھرو → API، ہر حقیقی درخواست کے ساتھ ایک ذرہ۔
- **ٹیلی میٹری** — ایک token/$ اوڈومیٹر اور ایک لائیو درخواست ٹائم لائن؛ کسی بھی درخواست پر کلک کریں تاکہ بالکل دیکھیں کہ کون سے حصے تصاویر بنے اور ہر صفحے کے پیچھے موجود اصل متن پڑھیں۔
- **بینچ مارکس** — `benchmarks/*/results/` سے رینڈر کی گئی ہارنس رسیدیں، فی model·config تجربہ ایک قطار، اور **UI سے بینچ مارکس چلائیں**: `$0` dry-runs اپنا آؤٹ پٹ لائیو سٹریم کرتے ہیں؛ لائیو رنز آپ کی API کلید کے ساتھ ساتھ ایک واضح لاگت کی تصدیق کے پیچھے گیٹڈ رہتے ہیں۔
- **سیشنز / ہسٹری** — بچائے گئے ٹوکنز کے لحاظ سے سرفہرست سیشنز اور ڈسک پر موجود ہر ایونٹ۔

| لائیو فلو | بینچ مارکس |
|---|---|
| ![درخواست پائپ لائن بطور لائیو نوڈ گراف](../../assets/dashboard-flow.png) | ![بینچ مارک رسیدیں اور UI کے اندر dry-runs](../../assets/dashboard-benchmarks.png) |

![ٹیلی میٹری: اوڈومیٹر اور لائیو درخواست ٹائم لائن](../../assets/dashboard-telemetry.png)

# ⚙️ یہ کیسے کام کرتا ہے

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **بلنگ کو تبدیلی سے پہلے عین طور پر شمار کیا جاتا ہے**: Anthropic فی امیج `⌈w/28⌉ × ⌈h/28⌉ + 4` ٹوکنز کا بل کرتا ہے (28 px پیچز — صفر بقیہ تک پیمائش شدہ)۔ ایک مکمل صفحہ 28,080 حروف کو 1,460 ٹوکنز میں لے جاتا ہے ≈ **19 حروف/ٹوکن**، جبکہ گھنے متن کے لیے یہ ~2 حروف/ٹوکن ہے۔ گیٹ صرف اسی وقت تبدیل کرتا ہے جب ریاضی فائدہ مند ہو۔
- **کیا تبدیل ہوتا ہے**: مستقل سسٹم پرامپٹ + ٹول دستاویزات، پرانی سمیٹی ہوئی تاریخ، بڑے ٹول آؤٹ پٹس۔
- **کیا کبھی تبدیل نہیں ہوتا**: آپ کے پیغامات، حالیہ باریاں، ماڈل کا آؤٹ پٹ، بکھرا ہوا نثر، بائٹ-عین اقدار (ہیشز/IDs متن کے طور پر ساتھ چلتی ہیں)، اور کوئی بھی ماڈل جو پڑھنے کے بینچ مارک میں ناکام رہا ہو۔

# 📚 لائبریری کا استعمال (بغیر پراکسی کے)

ہر وہ کام جو پراکسی فی درخواست کرتا ہے، ایک دستاویزی، درآمد کے قابل API کے طور پر بھی دستیاب ہے:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// کسی بھی متن کو گھنے 1-بٹ PNG صفحات میں رینڈر کریں
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// یا مکمل درخواست کی تبدیلی خود چلائیں — گیٹ، بلنگ ریاضی، سب کچھ
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // خام /v1/messages JSON باڈی
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` بلاکس کو متن کے طور پر پن کرتا ہے؛ `options.emitRecoverable` تصویر بنائے گئے بلاکس کے اصل مواد واپس کرتا ہے۔ عین بلنگ ریاضی پیکج کی جڑ (root) پر بھی شپ ہوتی ہے (`anthropicImageTokens`، `resolveAnthropicVisionTier`، `openAIVisionTokens`) — یہی وہ چیز ہے جسے [OmniRoute](https://github.com/diegosouzapw/OmniRoute) استعمال کرتا ہے۔ خالص-JS رن ٹائم (Node اور edge/Workers)۔ مکمل سطح: `src/core/index.ts`۔

# 📤 آف لائن ایکسپورٹ — نہ پراکسی، نہ Claude Code

Claude Code پر نہیں ہیں؟ سیاق و سباق کو **مقامی طور پر** PNG صفحات میں رینڈر کریں اور انہیں Cursor، ChatGPT، یا کسی بھی ایسی چیٹ میں پیسٹ کریں جو تصویری اپ لوڈز قبول کرتی ہو۔ نہ پراکسی، نہ API کلید، نہ کوئی اکاؤنٹ جوڑنے کی ضرورت:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

آپ کو ایک ہی فولڈر ملتا ہے جس میں چیٹ میں ڈراپ کرنے کے لیے سب کچھ موجود ہوتا ہے:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` آپ کے اَن کمیٹڈ diff کو رینڈر کرتا ہے، `--diff <ref>` ایک کمٹ رینج کو، اور `--open` فولڈر کو ظاہر کرتا ہے (macOS)۔ یہ سب کچھ آپ کی اپنی مشین پر چلتا ہے — ایکسپورٹ کا راستہ کبھی پراکسی شروع نہیں کرتا اور کبھی کسی ماڈل کو کال نہیں کرتا۔ ہر فلیگ کے لیے `omniglyph export --help` چلائیں۔

# 🧭 The honest part

- **یہ نقصان دہ (lossy) ہے۔** تصاویر سے بائٹ-عین بازیافت فطری طور پر ناقابلِ اعتماد ہے۔ نافذ شدہ تدارک: عین شناخت کنندگان تصویر کے ساتھ متن کے طور پر سفر کرتے ہیں، اور پیمائش شدہ پروڈکشن کنفیگ نے **صفر خاموش من گھڑت جوابات** پیدا کیے — ناکام ریڈز گریز کرتی ہیں۔
- **آج صرف Fable 5 منظور شدہ ہے**، رسیدوں کے ساتھ۔ GPT-5.5 اور Gemini 2.5-flash قابلِ پیمائش طور پر گھنے رینڈرز پڑھ نہیں سکتے؛ Opus 4.8 کو 4× بڑے گلفس درکار ہیں۔ گیٹ اسے نافذ کرتا ہے۔
- **ہم نے ایک بلنگ کا جال ڈھونڈ کر اس سے بچا**: ہائی ریزولوشن امیج درجہ فی صفحہ 3.3× زیادہ بل کرتا ہے، لیکن ویژن انکوڈر کو اضافی ریزولوشن نہیں ملتا — بڑے صفحات *بدتر* پڑھے جاتے ہیں۔ پیمائش شدہ، [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) میں دستاویزی، فعال نہیں کیا گیا۔
- قیمتیں بدلتی رہتی ہیں؛ دیرپا پیمانہ ٹوکن کٹوتی ہے، جسے پراکسی ہر درخواست پر ایک مفت `count_tokens` متضاد حقیقت کے مقابلے میں لاگ کرتا ہے۔

# 🧠 اکثر پوچھے گئے سوالات (FAQ)

**کیا 59–70% اینڈ ٹو اینڈ ہے، یا صرف ان درخواستوں پر جنہیں اس نے چھوا؟**
اینڈ ٹو اینڈ — پورا بل۔ زیادہ تر کمپریشن ٹولز صرف اس حصے پر بچت ظاہر کرتے ہیں جسے انہوں نے چھوا، جو عدد کو بڑھا چڑھا کر پیش کرتا ہے۔ ہمارے حساب کی بنیاد *ہر* درخواست ہے: وہ چھوٹی درخواستیں جنہیں گیٹ نے درست طور پر نہیں چھیڑا، تمام کیش رائٹس اور ریڈز، اور تمام آؤٹ پٹ ٹوکنز (جنہیں پراکسی کبھی کمپریس نہیں کرتا)۔ صرف-کمپریسڈ حصے کا عدد زیادہ ہوتا ہے اور اسے الگ سے بتایا جاتا ہے، کبھی بھی سرخی کے طور پر نہیں۔

**بچت کیسے ناپی جاتی ہے؟**
اسی درخواست کے دونوں پہلو، ایک ہی لمحے پر۔ ہر `/v1/messages` POST کے لیے پراکسی اصل غیر کمپریسڈ باڈی (متضاد حقیقت) پر ایک مفت `count_tokens` پروب چلاتا ہے، اصل فارورڈ کے ساتھ متوازی طور پر، اور جواب سے فراہم کنندہ کے حقیقی طور پر بل کیے گئے استعمال (usage) بلاک کو پڑھتا ہے — دونوں ایک ہی ایونٹ قطار میں درج ہوتے ہیں۔ کیش کی قیمت دونوں طرف یکساں طور پر لاگو ہوتی ہے، اس لیے کیشنگ کی رعایت ختم ہو جاتی ہے اور اسے "بچت" کے طور پر دوبارہ شمار نہیں کیا جا سکتا۔ فارمولا `src/core/baseline.ts` میں موجود ہے؛ اسے اپنے ایونٹس لاگ سے خود اخذ کریں۔

**کوئی ناکامی پڑھنے کی غلطی کے بجائے من گھڑت جواب کیوں ہو؟**
کیونکہ ماڈل کا ویژن OCR نہیں ہے: صفحہ پیچ ایمبیڈنگز بن جاتا ہے، کبھی الگ حروف نہیں، اس لیے فی گلف کوئی اعتماد (confidence) نہیں ہوتا جس پر واضح طور پر ناکام ہوا جا سکے — جب پکسلز کسی گلف کا تعین نہیں کر پاتے، تو زبان کا پیشگی رجحان (language prior) خلا کو کسی قابلِ فہم چیز سے بھر دیتا ہے۔ یہی طریقہ کار بالکل وہی وجہ ہے کہ OmniGlyph اس بارے میں fail-closed ہے: بائٹ-عین اقدار ہمیشہ تصویر کے ساتھ متن کے طور پر سفر کرتی ہیں، غلط پڑھنے والے ماڈلز کو گیٹ روک دیتا ہے، اور پیمائش شدہ پروڈکشن کنفیگ نے تقریباً 300 ریڈ پروبز میں **صفر** خاموش من گھڑت جوابات پیدا کیے — ناکام ریڈز گریز کرتی ہیں۔

**بائٹ-عین کام (ہیشز، IDs، سیکرٹس) کا کیا ہوگا؟**
حالیہ باریاں اور عین شناخت کنندگان بذاتِ ڈیزائن متن ہی رہتے ہیں۔ ایسے ورک لوڈز کے لیے جو *مکمل طور پر* بائٹ-عین ہوں، انہیں ایک غیر allowlisted ماڈل کی طرف روٹ کریں (مثلاً کسی دوسرے Claude ماڈل پر ایک سب ایجنٹ) — allowlist سے باہر کچھ بھی بائٹ-عین، بغیر چھیڑے، گزر جاتا ہے۔

**کیا DeepSeek-OCR نے یہ طے نہیں کر دیا کہ یہ کام کرتا ہے؟**
اس نے ثابت کیا کہ *چینل* کام کرتا ہے — ایک انکوڈر/ڈیکوڈر جوڑے کے ساتھ جو اسی کام کے لیے تربیت یافتہ تھا۔ شکوک و شبہات اس وقت کے ہیں جب کوئی بھی اسٹاک پروڈکشن ماڈل گھنے رینڈرز پڑھ نہیں سکتا تھا؛ وہ بدل چکا ہے، اور اوپر دیا گیا [ماڈل اسکور کارڈ](../../../README.md#-the-numbers--measured-not-estimated) بالکل دکھاتا ہے کہ آج کون انہیں رسیدوں کے ساتھ پڑھتا ہے۔ [بینچ مارک ہارنس](../../../benchmarks/README.md) کسی بھی نئے ماڈل کو ایک کمانڈ میں دوبارہ جانچ لیتا ہے — گیٹ ڈیٹا کی پیروی کرتا ہے، ہائپ کی نہیں۔

**کیا میں اسے Claude Code کے بغیر استعمال کر سکتا ہوں — Cursor، ChatGPT، یا ایک سادہ pipe؟**
جی ہاں، دو طریقوں سے۔ ایک **پراکسی** کے طور پر یہ ہر اُس کلائنٹ کے ساتھ کام کرتا ہے جو آپ کو API بیس URL طے کرنے دیتا ہے (`ANTHROPIC_BASE_URL`، یا OpenAI بیس URL) — Claude Code، آپ کے اپنے اسکرپٹس، کوئی بھی HTTP چیز۔ اور اُن ٹولز کے لیے جو پراکسی نہیں کر سکتے، اوپر دیا گیا **آف لائن ایکسپورٹ** سیاق و سباق کو PNG صفحات میں رینڈر کرتا ہے جنہیں آپ ہاتھ سے پیسٹ کرتے ہیں — `omniglyph export --stdin` تو براہِ راست ایک Unix pipe سے بھی پڑھ لیتا ہے۔

**یہ دراصل متن کو تصویر میں کیسے بدلتا ہے؟**
یہ متن کو دوبارہ سمیٹتا (reflow) ہے اور اسے ایک 1-بٹ 5×8 پکسل گلف ایٹلس سے گھنے 1568×728 PNG صفحات پر پینٹ کرتا ہے — فی پکسل ایک بٹ، کوئی اینٹی-ایلیاسنگ نہیں، اس لیے ماڈل صفحے کا بل اس کے طول و عرض کے حساب سے کرتا ہے، نہ کہ اس کے اندر موجود حروف کی تعداد کے حساب سے۔ اوپر دیا گیا **یہ کیسے کام کرتا ہے** پائپ لائن دکھاتا ہے؛ بینچ مارکس دستاویز میں جیومیٹری موجود ہے اور یہ کہ گھنا ہونا ہمیشہ سستا کیوں نہیں ہوتا۔

# 🔬 ہر عدد کو دوبارہ پیدا کریں

```bash
pnpm install && pnpm test                                     # مکمل سویٹ
node benchmarks/billing-sweep/run.mjs --dry-run               # بلنگ کی پیش گوئیاں، $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # لاگت کا جدول، $0
# کلیدوں کے ساتھ: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (یا Claude Code سبسکرپشن کے لیے --via-cli)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

مکمل طریقہ کار اور ہر نتیجے کا جدول: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)۔ خام فی جواب رسیدیں: `benchmarks/*/results/*.jsonl`۔

# 🚀 OmniRoute خاندان

OmniGlyph ایک **مقامی کمپریشن انجن** کے طور پر بھی [OmniRoute](https://github.com/diegosouzapw/OmniRoute) — مفت AI گیٹ وے — کے اندر شپ ہوتا ہے۔ وہاں یہ `omniglyph` انجن کے طور پر چلتا ہے (اسٹینڈ ایلون سنگل موڈ یا دیگر انجنوں کے ساتھ اسٹیکڈ)، fail-closed گیٹس اور امیج-آگاہ ٹوکن اکاؤنٹنگ کے ساتھ۔

# 🛠️ ٹیک اسٹیک

| تہہ | ٹیکنالوجی |
|---|---|
| زبان | TypeScript (strict), ESM |
| رن ٹائم | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| رینڈرنگ | اپنا 1-بٹ گلف ایٹلس (Spleen/Unifont سے ماخوذ، لائسنس `assets/` میں) → PNG |
| ٹیسٹس | Vitest — TDD، نیز docs-integrity اور ری برانڈ گارڈز |
| بینچ مارکس | `benchmarks/` ہارنسز (billing-sweep، density-frontier) JSONL رسیدوں کے ساتھ |

## پروجیکٹ کی ترتیب

| راستہ | کیا ہے |
|---|---|
| `src/` | پراکسی: تبدیلی پائپ لائن، فراہم کنندہ کے مطابق عین بلنگ، رینڈرر، ہوسٹس (Node + Cloudflare Workers) |
| `benchmarks/` | وہ ہارنسز جنہوں نے اوپر دیے گئے ہر عدد کو پیدا کیا — دوبارہ چلانے کے قابل |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 معاونت اور کمیونٹی

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — بگز اور فیچر کی درخواستیں
- 🔒 [SECURITY.md](SECURITY.md) — خطرات کی اطلاع
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — سخت TDD + دعوے سے پہلے پیمائش
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 اعترافات

OmniGlyph خاص طور پر ایک پروجیکٹ کے کندھوں پر کھڑا ہے — یہ حصہ ہمارا مستقل شکریہ ہے۔

| پروجیکٹ | اس نے OmniGlyph کو کیسے تشکیل دیا |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **وہ دریافت جس پر یہ پورا پروجیکٹ بنایا گیا ہے۔** pxpipe نے رسیدوں کے ساتھ ثابت کیا کہ ایک پروڈکشن LLM کا ویژن چینل گھنے متنی سیاق و سباق کو ٹوکن لاگت کے ایک حصے میں لے جا سکتا ہے — اور یہ کہ تبدیلی کا فیصلہ ہر درخواست پر عین بلنگ ریاضی سے ہونا چاہیے، کبھی اندازوں سے نہیں۔ گھنی 1-بٹ رینڈرنگ، منافع بخشی کا گیٹ، `count_tokens` متضاد حقیقت، fail-closed ماڈل allowlist، اور "دعویٰ کرنے سے پہلے ناپیں" کی دستاویزی ثقافت — یہ سب وہیں سے شروع ہوئے۔ OmniGlyph براہِ راست اسی کوڈبیس سے نکلا ہے (MIT — اصل کاپی رائٹ لائن ہماری [LICENSE](../../../LICENSE) میں برقرار ہے)۔ |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 5×8 بٹ میپ فونٹ خاندان جس سے ہمارا گھنا 1-بٹ گلف ایٹلس ماخوذ ہے (لائسنس `assets/` میں)۔ |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | اسی ایٹلس میں Spleen کی حد سے باہر گلفس کے لیے احاطہ (کوریج) (لائسنس `assets/` میں)۔ |

اگر آپ کو OmniGlyph مفید لگے، تو اپ اسٹریم کو بھی اسٹار دیں — یہ دریافت ان کی تھی۔ 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 لائسنس

MIT — دیکھیں [LICENSE](../../../LICENSE)۔
