# الهندسة المعمارية (Architecture)

خريطة قاعدة الكود على صفحة واحدة.

## خط أنابيب الطلب (Request pipeline)

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

## الفوترة (دقيقة، مقيسة)

| الوحدة (module) | المزوّد | النموذج |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | رقاقات 28 بكسل + 4/كتلة، حدود إعادة الحجم لكل مستوى؛ هندسة الصفحة (كلا المستويين يرندران الصفحة القياسية 1568×728 — مستوى الدقة العالية فخّ فوترة، انظر [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | أنظمة رقاقة/بلاطة لكل نموذج، `detail` لكل ملف تعريف، هندسة الشريط |
| `src/core/gemini-model-profiles.ts` | Google | معادلة البلاطة (`floor(min/1.5)` وحدة قص) + تكاليف ثابتة حسب `media_resolution` |

## الرندر

- `src/core/render.ts` — نص ← PNG عبر أطلس رموز مُخبَّز مسبقًا (Spleen 5×8 +
  احتياطي Unifont)، إعادة تدفق (reflow) بحواجز سطر جديد `↵`، أطلس أحادي البت في
  الإنتاج (مقيس أفضل من AA على Fable).
- `src/core/render-cache.ts` — تخزين مؤقت LRU للرندرات الحتمية
  (الشريحة الثابتة وأجزاء التاريخ المجمّدة تُعاد رندرتها في كل طلب لولا ذلك).
- `src/core/history.ts` — يطوي الأدوار القديمة إلى أجزاء صور مُجمّدة قابلة
  للإلحاق فقط تبقى متطابقة بايتيًا حتى يستمر التخزين المؤقت للـ prompt بالنجاح.
- `src/core/png.ts` — مُرمِّز PNG حتمي بسيط (بلا تبعيات أصلية/native).

## حواجز الحماية (Guard rails)

- قائمة النماذج المسموحة (`src/core/applicability.ts`): فقط النماذج التي اجتازت
  اختبار القراءة تُصوَّر؛ كل شيء آخر يمر متطابقًا بايتيًا.
- القيم الدقيقة حرفيًا (SHAs، المعرّفات) تسافر كنص في ورقة حقائق بجانب الصورة
  (`src/core/factsheet.ts`)؛ النسخ الأصلية القابلة للاسترجاع عبر `emitRecoverable`.
- الأدوات الأصلية المُصنَّفة (`type !== 'custom'`) لا تُعاد كتابتها أبدًا (حاجز 400).

## المقاييس والإيصالات

`benchmarks/` يحمل الحزمتين اللتين أنتجتا كل رقم في الـ README
— انظر [benchmarks/README.md](../../benchmarks/README.md).
