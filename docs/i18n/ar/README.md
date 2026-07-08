🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="رندر حقيقي: system prompt + مستندات الأدوات مضغوطة في صفحة واحدة كثيفة بأبعاد 1568×728" width="820"/>

<br/>

# 🖼️ OmniGlyph — السياق كصورة

### قلّل فاتورة Claude بنسبة **59–70%** عبر تحويل السياق الضخم إلى صفحات PNG كثيفة — نفس المحتوى، بجزء بسيط من عدد الرموز (tokens).

**النماذج تحاسب النص بالرمز (token)، لكنها تحاسب الصورة حسب أبعادها — لا حسب كمية النص بداخلها.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

جزء من عائلة [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 كل اللغات](../../../docs/i18n/README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| المقياس | النتيجة | الإيصال |
|---|---|---|
| خفض الفاتورة من طرف إلى طرف | **59–70%** | تتبّع إنتاجي (production trace)، 13,709 طلبًا |
| الرموز لكل كتلة مُحوَّلة | **أقل بـ 10×** (28,080 حرفًا: 14,040 → 1,460 رمزًا) | [billing sweep](benchmarks/billing-sweep/README.md) |
| دقة معادلة الفوترة | انحراف **صفر** عبر 22 قياس `count_tokens`، نموذجان × مستويان | `benchmarks/billing-sweep/results/` |
| دقة القراءة الحرفية، إعداد الإنتاج | **30/30 (100%)** على Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| اختلاقات صامتة في ~300 اختبار قراءة | **0** — كل إخفاق يمتنع عن الإجابة بـ `ILEGIVEL` | `benchmarks/density-frontier/results/` |

**بطاقة أداء النماذج** (هل يستطيع قراءة الرندرات الكثيفة؟ n=30 لكل ذراع، تقييم حتمي):

| النموذج | القراءة | الحكم |
|---|---|---|
| Claude **Fable 5** | **100%** دقيقة | ✅ هدف الإنتاج |
| Claude Opus 4.8 | 77–87% عند حجم رمز 4× | ⚠️ وضع آمن اختياري (تنخفض الوفورات إلى ~2×) |
| GPT-5.5 | 0/60 — ويُضخّم إجاباته ~40× أثناء المحاولة | ❌ محظور بواسطة البوّابة، مع دليل |
| Gemini 2.5-flash | 0/26 — ويختلق بدل أن يمتنع | ❌ محظور (اختبار جزئي، محدود بالحصة) |

الميزة **خاصة بـ Fable اليوم** — بقية مُرمِّزات الرؤية لم تحلّ بعد مشكلة الرموز الكثيفة. [حزمة المقاييس](benchmarks/README.md) تعيد اختبار أي نموذج جديد بأمر واحد.

# 🤔 لماذا OmniGlyph؟

كل جلسة وكيل (agent) طويلة الأمد تجرّ نفس الحمل الميت في كل طلب: system prompt، ومستندات الأدوات، والتاريخ القديم — تُحاسب من جديد بالرمز في كل دور (turn). OmniGlyph هو **بروكسي محلي** يعيد كتابة تلك الأجزاء الضخمة إلى صفحات PNG كثيفة *قبل أن تغادر جهازك*:

- **رياضيات فوترة دقيقة، لا حدسيات (heuristics)** — يحسب معادلة رموز الصورة الحقيقية للمزوّد (مقيسة بانحراف صفر) ويحوّل فقط عندما تكسب المعادلة.
- **فشل مغلق (fail-closed) بالتصميم** — النماذج التي لا تستطيع قراءة الرندرات الكثيفة تُحظر عبر بوّابة، مع إيصالات قياس. لا فقدان جودة صامت.
- **خصوصية ومحلية أولًا** — إعادة الكتابة تحدث على `127.0.0.1`؛ لا شيء إضافي يُرسل إلى أي مكان.
- **قابل لإعادة الإنتاج** — كل رقم أعلاه له إيصال في `benchmarks/*/results/`، قابل لإعادة التشغيل بأمر واحد.

# ⚡ البداية السريعة

```bash
npx omniglyph                                     # بروكسي على 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # وجّه Claude Code إليه
```

![البداية السريعة: شغّل البروكسي، تحقّق من لوحة التحكم، وجّه Claude Code إليه](../../../docs/assets/demo-quickstart.gif)

يعمل بالطريقتين:
- **مفتاح API** (الدفع بالرمز): فاتورتك تنخفض 59–70% من طرف إلى طرف.
- **جلسة اشتراك**: لا تدفع أقل، لكن حدود الاستخدام تُحسب بالرموز — فتمتد حدودك **~2–3×**.

لوحة التحكم على <http://127.0.0.1:47821/>: الرموز الموفَّرة، كل تحويل نص→صورة جنبًا إلى جنب، مفتاح إيقاف الطوارئ (kill switch)، شرائح نماذج حيّة. الردود تُبثّ (stream) بشكل طبيعي — فقط *الطلب* يُضغط، أبدًا مخرجات النموذج.

# ⚙️ كيف يعمل

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **تُحسب الفوترة بدقة قبل التحويل**: Anthropic تحاسب `⌈w/28⌉ × ⌈h/28⌉ + 4` رموزًا لكل صورة (رقاقات 28 بكسل — مقيسة بانحراف صفر). صفحة كاملة تحمل 28,080 حرفًا مقابل 1,460 رمزًا ≈ **19 حرفًا/رمز**، مقابل ~2 حرف/رمز للنص الكثيف. البوّابة تحوّل فقط عندما تكسب المعادلة.
- **ما يُحوَّل**: system prompt الثابت + مستندات الأدوات، التاريخ القديم المطوي، مخرجات الأدوات الكبيرة.
- **ما لا يُحوَّل أبدًا**: رسائلك، الأدوار الأخيرة، مخرجات النموذج، النثر المتناثر، القيم الدقيقة حرفيًا (الهاشات/المعرّفات تسافر كنص بجانبها)، وأي نموذج فشل في اختبار القراءة.

# 🧭 The honest part

- **إنه فقداني (lossy).** الاسترجاع الدقيق حرفيًا من الصور غير موثوق بطبيعته. التخفيفات المطبَّقة: المعرّفات الدقيقة تسافر كنص بجانب الصورة، وإعداد الإنتاج المقيس أنتج **صفر اختلاقات صامتة** — القراءات الفاشلة تمتنع عن الإجابة.
- **فقط Fable 5 معتمد اليوم**، مع إيصالات. GPT-5.5 وGemini 2.5-flash عاجزان قياسيًا عن قراءة الرندرات الكثيفة؛ Opus 4.8 يحتاج رموزًا أكبر بـ4×. البوّابة تفرض ذلك.
- **وجدنا وتجنّبنا فخّ فوترة**: مستوى الصورة عالي الدقة يحاسب 3.3× أكثر لكل صفحة، لكن مُرمِّز الرؤية لا يستقبل الدقة الإضافية — الصفحات الأكبر تُقرأ *أسوأ*. مقيس وموثّق في [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)، غير مُفعَّل.
- الأسعار تتغيّر؛ المقياس الدائم هو خفض الرموز، الذي يسجّله البروكسي لكل طلب مقابل نظير افتراضي مجاني من `count_tokens`.

# 🔬 أعد إنتاج كل رقم

```bash
pnpm install && pnpm test                                     # الحزمة الكاملة
node benchmarks/billing-sweep/run.mjs --dry-run               # تنبؤات الفوترة، $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # جدول التكلفة، $0
# مع المفاتيح: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (أو --via-cli لاشتراك Claude Code)
```

![حزمتا المقاييس تعملان في وضع dry-run](../../../docs/assets/demo-benchmarks.gif)

المنهجية الكاملة وكل جدول نتائج: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). إيصالات خام لكل إجابة: `benchmarks/*/results/*.jsonl`.

# 🚀 عائلة OmniRoute

OmniGlyph يعمل أيضًا كـ**محرك ضغط أصلي داخل [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — بوابة الذكاء الاصطناعي المجانية. هناك يعمل كمحرك `omniglyph` (وضع مستقل منفرد أو مكدّس مع بقية المحركات)، مع بوابات فشل مغلق ومحاسبة رموز واعية بالصور.

# 🛠️ حزمة التقنيات

| الطبقة | التقنية |
|---|---|
| اللغة | TypeScript (صارمة)، ESM |
| بيئة التشغيل | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| الرندر | أطلس رموز 1-bit خاص (مشتق من Spleen/Unifont، التراخيص في `assets/`) ← PNG |
| الاختبارات | Vitest — TDD، بالإضافة إلى حراس سلامة المستندات وإعادة التسمية |
| المقاييس | حزم `benchmarks/` (billing-sweep، density-frontier) مع إيصالات JSONL |

## هيكل المشروع

| المسار | ما هو |
|---|---|
| `src/` | البروكسي: خط أنابيب التحويل، الفوترة الدقيقة لكل مزوّد، الراندر، المضيفون (Node + Cloudflare Workers) |
| `benchmarks/` | الحزم التي أنتجت كل رقم أعلاه — قابلة لإعادة التشغيل |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 الدعم والمجتمع

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — الأخطاء وطلبات الميزات
- 🔒 [SECURITY.md](SECURITY.md) — تقارير الثغرات
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD صارم + القياس قبل الادّعاء
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 الترخيص

MIT — انظر [LICENSE](../../../LICENSE).
