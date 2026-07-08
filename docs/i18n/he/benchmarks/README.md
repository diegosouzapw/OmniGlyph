# בנצ'מרקים

🌐 Translated: [all languages](../../README.md)

כל מספר ש-OmniGlyph טוען מגיע מאחת משתי הרתמות למטה —
ניתנות להרצה מחדש, דטרמיניסטיות ככל האפשר, עם קבלות גולמיות לכל תשובה ב-
`*/results/*.jsonl`. ניתוח מאוחד: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## איך החיסכון עובד (בתמונה אחת)

ספקים מחייבים **טקסט לפי הטוקן**, אבל מחייבים **תמונה לפי המידות** שלה —
לא לפי כמות הטקסט הדחוסה בתוכה. עמוד סטנדרטי אחד הוא עלות שטוחה לא
משנה כמה הטקסט צפוף:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

אותו הקשר, מחויב בשתי דרכים:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

למה התמונה מנצחת — תווים שנישאים לכל טוקן:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph מבצע את ההחלפה הזו רק כשהמתמטיקה המדויקת אומרת שהיא מנצחת, ורק עבור
מודלים שהוכח שקוראים את העמוד. שתי הרתמות למטה מוכיחות כל חצי.

## 1. `billing-sweep/` — כמה עולה תמונה בפועל?

בדיקות `count_tokens` חינמיות מול ה-API החי של Anthropic, המשוות את
הנוסחה שהוצאה משימוש `w·h/750` מול מודל הטלאי הנוכחי של 28 פיקסלים על פני 11
גאומטריות בדיקה על 2 מודלים × 2 רמות רזולוציה.

**תוצאה (2026-07-05): מודל הטלאי מתאים עם שארית אפס בכל בדיקה**
— חיוב = `⌈w/28⌉ × ⌈h/28⌉` לאחר שינוי גודל לפי רמה, בתוספת +3/+4 טוקנים קבועים
לכל בלוק תמונה. עמוד הייצור (1568×728) עולה בדיוק 1,460 טוקנים
ונושא 28,080 תווים ≈ **19.2 תווים/טוקן** לעומת ~2 תווים/טוקן כטקסט צפוף.

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

## 2. `density-frontier/` — האם המודל באמת יכול לקרוא את זה?

עלות (אופליין, מדויקת) × דיוק קריאה (חי) על פני תצורות רינדור, גאומטריות
עמוד, אטלסי גליפים וספקים. הקורפוס שותל מחטי מחרוזת-מדויקת (מזהי hex,
camelCase, רצפי ספרות) בתוספת **distractors מבלבלים בקירוב שנבנו
מזוגות הבלבול הנמדדים של הגליפים** — כך שבדיה שקטה מזוהה, לא רק
נספרת כשגויה. הניקוד דטרמיניסטי (ללא שופט LLM):
`correct` / `abstained` (`ILEGIVEL` כן) / `silent_wrong` / `no_answer`.

**תוצאות מובילות** (n=30 לכל זרוע):

| זרוע | קריאות מדויקות | הערות |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

דיוק קריאה במבט חטוף — זה **הוא** שער המודל ה-fail-closed, מצויר:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

רק הזרוע ה-✅ משתחררת. כל דבר שנקרא בצורה גרועה חסום *עם קבלה*, ו-
הניקוד התלת-כיווני אומר שמודל שמנחש שגוי (`silent_wrong`) נחשב
גרוע יותר ממודל שנמנע ביושר (`ILEGIVEL`).

שלוש תעבורות: API ישיר (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), ו-`--via-cli` (מנוי Claude Code —
$0). אזהרה שנלמדה בקושי: מתווכים (OpenRouter, כלי ה-Read של CLI)
משנים גודל תמונות גדולות; רק תוצאות API ישיר מהימנות לקריאוּת.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

בדיקות יחידה שמצמידות את החלקים הטהורים (קורפוס, ניקוד, נוסחאות עלות):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
