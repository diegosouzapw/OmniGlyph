# ארכיטקטורה

מפת עמוד-אחד של בסיס הקוד.

## צינור הבקשה

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

## חיוב (מדויק, נמדד)

| מודול | ספק | מודל |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | טלאים של 28 פיקסלים + 4/בלוק, תקרות שינוי גודל לכל רמה; גאומטריית עמוד (שתי הרמות מרנדרות את עמוד הסטנדרטי 1568×728 — רמת הרזולוציה הגבוהה היא מלכודת חיוב, ראו [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | משטרי טלאי/אריח לכל מודל, `detail` לכל פרופיל, גאומטריית רצועה |
| `src/core/gemini-model-profiles.ts` | Google | נוסחת אריח (יחידת חיתוך `floor(min/1.5)`) + עלויות שטוחות של `media_resolution` |

## רינדור

- `src/core/render.ts` — טקסט → PNG דרך אטלס גליפים אפוי (Spleen 5×8 +
  Unifont כגיבוי), reflow עם sentinels של שורה חדשה `↵`, אטלס 1-ביט ב-
  ייצור (נמדד טוב יותר מ-AA על Fable).
- `src/core/render-cache.ts` — memoization מסוג LRU של רינדורים
  דטרמיניסטיים (slab סטטי + נתחי היסטוריה קפואים מתרנדרים מחדש בכל בקשה אחרת).
- `src/core/history.ts` — מקפל תורות ישנים לנתחי תמונה שרק
  מוסיפים ונשארים זהי-בייטים כדי שמטמון ה-prompt ימשיך להיפגע (hit).
- `src/core/png.ts` — קידוד PNG דטרמיניסטי מינימלי (ללא תלויות native).

## מעקות בטיחות

- רשימת היתר מודלים (`src/core/applicability.ts`): רק מודלים שעברו את
  בנצ'מרק הקריאה מודמים; כל השאר עוברים זהי-בייטים.
- ערכים בייט-מדויקים (SHA-ים, מזהים) נוסעים כטקסט בגיליון עובדות לצד
  התמונה (`src/core/factsheet.ts`); מקוריים ניתנים לשחזור דרך `emitRecoverable`.
- כלים בומיים מוקלדים (`type !== 'custom'`) לעולם אינם נכתבים מחדש (מגן 400).

## בנצ'מרקים וקבלות

`benchmarks/` מחזיק את שתי הרתמות שהפיקו כל מספר ב-README
— ראו [benchmarks/README.md](../../benchmarks/README.md).
