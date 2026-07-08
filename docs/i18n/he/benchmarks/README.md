# בנצ'מרקים

כל מספר ש-OmniGlyph טוען מגיע מאחת משתי הרתמות למטה —
ניתנות להרצה מחדש, דטרמיניסטיות ככל האפשר, עם קבלות גולמיות לכל תשובה ב-
`*/results/*.jsonl`. ניתוח מאוחד: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — כמה עולה תמונה בפועל?

בדיקות `count_tokens` חינמיות מול ה-API החי של Anthropic, המשוות את
הנוסחה שהוצאה משימוש `w·h/750` מול מודל הטלאי הנוכחי של 28 פיקסלים על פני 11
גאומטריות בדיקה על 2 מודלים × 2 רמות רזולוציה.

**תוצאה (2026-07-05): מודל הטלאי מתאים עם שארית אפס בכל בדיקה**
— חיוב = `⌈w/28⌉ × ⌈h/28⌉` לאחר שינוי גודל לפי רמה, בתוספת +3/+4 טוקנים קבועים
לכל בלוק תמונה. עמוד הייצור (1568×728) עולה בדיוק 1,460 טוקנים
ונושא 28,080 תווים ≈ **19.2 תווים/טוקן** לעומת ~2 תווים/טוקן כטקסט צפוף.

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
