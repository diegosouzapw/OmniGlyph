# فن تعمیر

کوڈ بیس کا ایک صفحے کا نقشہ۔

## درخواست کی پائپ لائن

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## بلنگ (عین، پیمائش شدہ)

| ماڈیول | فراہم کنندہ | ماڈل |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px پیچز + 4/بلاک، فی درجہ ری سائز کیپس؛ صفحہ جیومیٹری (دونوں درجے اسٹینڈرڈ 1568×728 صفحہ رینڈر کرتے ہیں — ہائی-ریز درجہ ایک بلنگ کا جال ہے، دیکھیں [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | فی ماڈل پیچ/ٹائل ریگیمز، `detail` فی پروفائل، اسٹرپ جیومیٹری |
| `src/core/gemini-model-profiles.ts` | Google | ٹائل فارمولا (`floor(min/1.5)` کراپ یونٹ) + `media_resolution` فلیٹ لاگتیں |

## رینڈرنگ

- `src/core/render.ts` — متن → PNG ایک تیار شدہ گلف ایٹلس (Spleen 5×8 +
  Unifont فال بیک) کے ذریعے، `↵` نئی لائن سینٹینلز کے ساتھ reflow،
  پروڈکشن میں 1-بٹ ایٹلس (Fable پر AA سے بہتر پیمائش شدہ)۔
- `src/core/render-cache.ts` — متعین رینڈرز کا LRU میموائزیشن (ورنہ
  اسٹیٹک سلیب + منجمد تاریخ کے ٹکڑے ہر درخواست پر دوبارہ رینڈر ہوں گے)۔
- `src/core/history.ts` — پرانی باریوں کو append-only منجمد امیج ٹکڑوں
  میں سمیٹتا ہے جو بائٹ-شناخت رہتے ہیں تاکہ پرامپٹ کیشنگ ہٹ کرتی رہے۔
- `src/core/png.ts` — کم از کم متعین PNG انکوڈر (کوئی نیٹو ڈیپینڈنسیز نہیں)۔

## حفاظتی حدود

- ماڈل allowlist (`src/core/applicability.ts`): صرف وہ ماڈلز جنہوں نے
  پڑھنے کا بینچ مارک پاس کیا وہی امیج کیے جاتے ہیں؛ باقی سب بائٹ-شناخت
  کے ساتھ گزرتے ہیں۔
- بائٹ-عین اقدار (SHAs، ids) تصویر کے ساتھ ایک فیکٹ شیٹ میں متن کے طور
  پر چلتی ہیں (`src/core/factsheet.ts`)؛ `emitRecoverable` کے ذریعے
  بازیافت کے قابل اصل۔
- نیٹو ٹائپڈ ٹولز (`type !== 'custom'`) کبھی دوبارہ نہیں لکھے جاتے (400 گارڈ)۔

## بینچ مارکس اور رسیدیں

`benchmarks/` وہ دو ہارنسز رکھتا ہے جنہوں نے README کے ہر عدد کو پیدا کیا
— دیکھیں [benchmarks/README.md](../../benchmarks/README.md)۔
