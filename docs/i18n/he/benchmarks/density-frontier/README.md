# density-frontier — עלות × דיוק לכל רזולוציה

רתמה שמודדת את **חזית הפארטו בין עלות לקריאוּת** של
הרינדורים טקסט→תמונה, לכל ספק (Anthropic / OpenAI / Gemini), גאומטריית עמוד,
תא גליף, וסגנון אטלס.

האסימטריה המרכזית: מאז billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **העלות ניתנת לחיזוי מדויק אופליין** — טלאים
של 28 פיקסלים + 4/בלוק ב-Anthropic (`src/core/anthropic-vision.ts`), פרופילי
patch/tile ב-OpenAI (`src/core/openai.ts`), tiles/media_resolution ב-Gemini
(`gemini-cost.ts`). רק **דיוק קריאה** צריך את ה-API.

## עיצוב

- **קורפוס** (`corpus.ts`): מילוי צפוף בסגנון log/JSON + מחטים שתולות
  מהמחלקות שמטריצת הבלבול אומרת שנכשלות (hex בן 12 תווים, camelCase,
  ספרות 6/8/5/3) בתוספת **distractors מבלבלים בקירוב** שנבנו מזוגות
  הבלבול הנמדדים. אם המודל עונה עם ה-distractor, הבלבול היה
  *צפוי* — זה מצב הכשל השקט שמזוהה, לא רק
  נספר כשגוי. דטרמיניסטי (mulberry32).
- **תצורות** (`configs.ts`): רשת אצורה — עמודים סטנדרטיים 1568×728 מול
  high-res 1928×1928 (ה-A/B שמכריע גאומטריה לכל רמה), AA מול 1-bit
  (פותר את הסתירה ברינדור הצפוף), תא 7×10/10×16 (מצב בטוח של
  Opus), רצועת GPT, ושני ההימורים של Gemini (≤384² = 258 fixed;
  `media_resolution: low` = 280 fixed → ~116 תווים/טוקן *אם* קריא).
- **ניקוד** (`score.ts`): התאמה מדויקת דטרמיניסטית, ללא שופט-LLM. שלוש
  תוצאות: `correct` / `abstained` (sentinel ILEGIVEL — כשל כן) /
  `silent_wrong` (המצב המסוכן), עם דגל distractor.

## הרצה

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

תצורות ספציפיות: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
תשובות נוחתות ב-`results/*.jsonl` (שורה אחת לכל שאלה, עם התשובה הגולמית
לביקורת).

## רף קבלה (מירושה מ-upstream PRs #35/#36)

תצורה הופכת לברירת מחדל בייצור רק אם: **gist == בקרת טקסט** וגם
**אפס מחרוזות מדויקות שגויות בשקט** וגם **חיסכון חיובי**. ההרצה הראשונה
החובה היא `anthropic-std-5x8-aa` מול `anthropic-hires-5x8-aa` על Fable —
בדיקת נקודתית לקריאוּת של העמוד הגדול לפני הפעלת רמת ה-high-res.

## `--via-omniroute` — קצה-לקצה דרך OmniRoute (P3: הוכחת אי-הידרדרות)

התעבורות למעלה מרנדרות טקסט→PNG **בתוך הרתמה** ושולחות את התמונות.
`--via-omniroute` עושה את ההפך, שהוא נתיב הייצור: הוא שולח את
**הטקסט הצפוף** למופע OmniRoute שרץ, נותן ל**מנוע `omniglyph`
לרנדר** את העמודים ולהעביר אותם ל-Anthropic, ומודד את הקריאות +
החיסכון. אם הקריאות נשארות זהות לנתיב הישיר **וגם** OmniRoute
מדווח על דחיסה, מוכח שהרינדור+העברה של OmniRoute **לא מדרדר**
את העמודים.

דרישות מוקדמות (תפעוליות):

1. **OmniRoute רץ** (`npm run dev`, ברירת מחדל `http://localhost:20128`).
2. ספק **Anthropic** מוגדר ב-OmniRoute עם מפתח **אמיתי** (נתיב
   ישיר — השער `providerTransport==='direct'` עובר רק עבור ספק ה-`anthropic`).
3. מנוע **`omniglyph` מופעל** בתצורת הדחיסה של OmniRoute
   (`config.engines.omniglyph.enabled = true`) — כותרת `engine:omniglyph` יורה רק
   כשהמנוע פועל. (המנוע הוא `stable:false`/תצוגה מקדימה; יש להפעיל במפורש.)
4. מפתח **API של OmniRoute** ב-`OMNIROUTE_API_KEY` (זה שהלקוח משתמש בו
   כדי להתאמת מול OmniRoute, לא זה של Anthropic).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

כל תשובה רושמת `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(מכותרת התגובה `X-OmniRoute-Compression`) ב-JSONL; שורת הטבלה מציגה
כמה תשובות חזרו דחוסות + החיסכון החציוני. **רף P3**: אותם פגיעות
verbatim/gist כמו הנתיב הישיר (אי-הידרדרות) **עם** `omnirouteSavings`
לא-ריק (מוכיח שרינדור התרחש, לא קריאת טקסט גולמי). אם `did NOT compress`
מופיע, המנוע לא מופעל ב-OmniRoute (או שהגוף לא עבר את
שערי ה-fail-closed).

בדיקות לחלקים הטהורים: `tests/density-frontier.test.ts` (כולל `buildOmnirouteRequest`
ו-`parseCompressionSavings` מתעבורת ה-via-omniroute).
