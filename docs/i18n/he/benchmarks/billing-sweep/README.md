# Anthropic vision-billing sweep

🌐 Translated: [all languages](../../../README.md)

**למה זה קיים:** שער הרווחיות בטוח רק אם הערכת העלות
*מדויקת*. נוסחה שסוטה מעט הייתה ממירה בלוקים שבפועל
עולים יותר. אז ה-sweep הזה מצמיד את הנוסחה למספרים האמיתיים של ה-API לפני
השחרור — ל**שארית אפס**.

```
what the sweep decides, visually:

  patch model     ⌈w/28⌉ × ⌈h/28⌉ + overhead        ← current docs
  retired /750    (w · h) / 750                       ← old formula
                       │
                       ▼  probe geometries chosen to separate the two by 25–180 tokens/row
  measured 1568×728 page = 1,460 tokens
     patch predicts 1,456  ✅   (residual ~0)
     /750  predicts 1,522  ✗   (off by 62)
```

בדיקת `count_tokens` חינמית שמכריעה שתי שאלות גאומטריה פתוחות:

1. **נוסחה** — האם ה-API מחייב `ceil(w/28) × ceil(h/28)` טלאים (תיעוד
   נוכחי) או `w·h/750` שהוצא משימוש? קבוצת הבדיקות מפרידה בין השתיים ב-25–180
   טוקנים לשורה.
2. **רמה** — האם `claude-fable-5` מקבל את תקרות הרזולוציה הגבוהה (קצה ארוך
   ≤ 2576 px, ≤ 4784 טוקנים חזותיים)? השורה `page-old-1928x1928` היא
   המכרעת: ≈ **4761** נמדד פירושו high-res WYSIWYG (העמוד הגדול הישן מכיל
   ~פי 3.3 יותר תווים לתמונה מהעמוד הנוכחי 1568×728, באותו תווים/טוקן);
   ≈ **1521** פירושו resample ברמה סטנדרטית, ו-1568×728 נשאר נכון.

הקשר: ה-sweep מ-2026-07-01 שמאחורי עמוד ה-1568×728 הנוכחי
(ביקורת קריאוּת, 2026-07-01) נמדד
על `claude-sonnet-4-5` — מודל ברמה סטנדרטית — בעוד הייצור מכוון
ל-Fable 5, שהתיעוד ממקם ברמת הרזולוציה הגבוהה. הביקורת ההיא גם
מדדה את העמוד הנוכחי ב-1460 טוקנים: קרוב יותר לנוסחת הטלאי 1456
מאשר ל-1522 של /750, מרמז שה-API כבר עבר לחיוב טלאי.

## הרצה

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

חייב לפגוע ב-API **ישירות** — לעולם לא דרך פרוקסי OmniGlyph, שהיה
משנה את הגוף. `count_tokens` חינמי; ה-sweep המלא מבצע ~25 בקשות.

## קריאת הפלט

לכל מודל, כל שורת בדיקה מציגה טוקני תמונה שנמדדו (עם-תמונה פחות
בסיס טקסט-בלבד) מול כל ארבע התחזיות (`patch`/`legacy750` ×
`standard`/`highres`); הסיכום מדרג השערות לפי שארית מוחלטת ממוצעת.
`--probe-multi` בודק את התקרה לכל תמונה (2×1092² ≈ 2×1521); `--probe-20plus`
בודק את חוק ה->20-תמונות (צלע >2000 px חייבת להידחות, לא להתכווץ).
שורות נוחתות ב-`results/*.jsonl`; מתמטיקת התחזית נמצאת ב-`formulas.mjs`,
מוצמדת על ידי `tests/billing-sweep-formulas.test.ts`.

## אחרי הפסיקה

- נוסחת טלאי אושרה → פורט OmniGlyph PR #27 (תרגום שינוי גודל מדויק) ו-
  יישור מתמטיקת שער `ANTHROPIC_PIXELS_PER_TOKEN` ב-`src/core/transform.ts`.
- רמת high-res אושרה על Fable → החזרת גאומטריית עמוד לכל רמה
  (עמודים מסוג 1928×1928 עבור Fable/Opus 4.8/Sonnet 5, 1568×728 לסטנדרטי),
  משקף איך נתיב ה-GPT כבר שומר את `GPT_MAX_HEIGHT_PX` שלו.
