🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — הקשר (context) כתמונה

### הפחיתו את חשבון ה-Claude שלכם ב-**59–70%** על ידי רינדור של הקשר גדוש כעמודי PNG צפופים — אותו תוכן, בחלק קטן מהטוקנים.

**מודלים מחייבים טקסט לפי כל טוקן, אך מחייבים תמונה לפי מידותיה — לא לפי כמות הטקסט שבתוכה.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

חלק ממשפחת [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) · [🌐 כל השפות](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| מדד | תוצאה | קבלה |
|---|---|---|
| הפחתת חשבון מקצה לקצה | **59–70%** | עקבה מהייצור, 13,709 בקשות |
| טוקנים לכל בלוק שהומר | **פי 10 פחות** (28,080 תווים: 14,040 → 1,460 טוקנים) | [billing sweep](benchmarks/billing-sweep/README.md) |
| דיוק נוסחת החיוב | שארית **אפס** על פני 22 בדיקות `count_tokens`, 2 מודלים × 2 רמות | `benchmarks/billing-sweep/results/` |
| דיוק קריאה מדויקת, תצורת ייצור | **30/30 (100%)** על Claude Fable 5 | [density frontier](benchmarks/density-frontier/README.md) |
| בדיות שקטות (confabulations) בכ-300 בדיקות קריאה | **0** — כל כשל נמנע ומסומן כ-`ILEGIVEL` | `benchmarks/density-frontier/results/` |

**כרטיס ציונים למודלים** (האם הם יכולים לקרוא רינדורים צפופים? n=30 לכל זרוע, ניקוד דטרמיניסטי):

| מודל | קריאה | פסיקה |
|---|---|---|
| Claude **Fable 5** | **100%** מדויק | ✅ יעד ייצור |
| Claude Opus 4.8 | 77–87% בגודל גליף פי 4 | ⚠️ מצב בטוח אופציונלי (החיסכון יורד ל-~פי 2) |
| GPT-5.5 | 0/60 — ומנפח את תשובותיו פי ~40 בניסיון | ❌ נחסם על ידי השער, עם הוכחה |
| Gemini 2.5-flash | 0/26 — ובודה במקום להימנע | ❌ חסום (בדיקה חלקית, מוגבל מכסה) |

היתרון הוא **ייחודי ל-Fable כיום** — מקודדי ראייה אחרים עדיין לא פותרים גליפים צפופים. [רתמת הבנצ'מרק](benchmarks/README.md) בודקת מחדש כל מודל חדש בפקודה אחת.

# 🤔 למה OmniGlyph?

כל הפעלת סוכן ארוכת-טווח גוררת אותו משא מת בכל בקשה: הנחיית המערכת, תיעוד הכלים וההיסטוריה הישנה — מחויבים מחדש לפי טוקן, בכל תור. OmniGlyph הוא **פרוקסי מקומי** שכותב מחדש את החלקים הגדושים האלה לעמודי PNG צפופים *לפני שהם עוזבים את המחשב שלכם*:

- **מתמטיקת חיוב מדויקת, לא היוריסטיקה** — הוא מחשב את נוסחת טוקני התמונה האמיתית של הספק (נמדדה עד שארית אפס) וממיר רק כשהמתמטיקה משתלמת.
- **עיצוב fail-closed** — מודלים שלא מצליחים לקרוא רינדורים צפופים נחסמים על ידי שער, עם קבלות בנצ'מרק. אין אובדן איכות שקט.
- **פרטי ומקומי-תחילה** — הכתיבה מחדש מתרחשת על `127.0.0.1`; שום דבר נוסף לא נשלח לשום מקום.
- **ניתן לשחזור** — לכל מספר שלמעלה יש קבלה ב-`benchmarks/*/results/`, ניתנת להרצה מחדש בפקודה אחת.

# ⚡ התחלה מהירה

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

עובד בשתי הדרכים:
- **מפתח API** (תשלום לפי טוקן): החשבון שלכם יורד ב-59–70% מקצה לקצה.
- **הפעלת מנוי (subscription)**: אתם לא משלמים פחות, אך מגבלות השימוש נספרות בטוקנים — כך שהמגבלות שלכם מתארכות פי **~2–3**.

לוח הבקרה בכתובת <http://127.0.0.1:47821/>: טוקנים שנחסכו, כל המרת טקסט→תמונה זו לצד זו, מתג כיבוי, שבבי מודל חיים. התגובות זורמות כרגיל — רק ה*בקשה* דחוסה, לעולם לא פלט המודל.

# 🔌 שימוש עם לקוחות Claude

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

# 🖥️ לוח הבקרה

לוח בקרה מקומי מלא מגיע בתוך החבילה — אופליין, קובץ יחיד, אפס בקשות חיצוניות. שישה עמודים, מתעדכנים בזמן אמת דרך SSE ככל שהבקשות זורמות:

![סקירה כללית: כרטיסי KPI של חדר בקרה, גרף חיסכון (sparkline) ופיד אירועים חי](../../assets/dashboard-overview.png)

- **סקירה כללית (Overview)** — חדר בקרה: אחוז חיסכון, $ שנחסך, latency p95, פגיעות מטמון (cache hits), שגיאות, פיד חי.
- **זרימה חיה (Live Flow)** — הצינור כגרף צמתים: client → gate → renderer / passthrough → API, עם חלקיק לכל בקשה אמיתית.
- **טלמטריה (Telemetry)** — מד טוקנים/$ (odometer) וציר זמן חי של בקשות; לחצו על כל בקשה כדי לראות בדיוק אילו חלקים הפכו לתמונות ולקרוא את טקסט המקור שמאחורי כל עמוד.
- **בנצ'מרקים (Benchmarks)** — קבלות הרתמה המוצגות מתוך `benchmarks/*/results/`, שורה אחת לכל ניסוי מודל·תצורה, וגם **הרצת הבנצ'מרקים ישירות מתוך ה-UI**: ריצות dry-run בעלות `$0` משדרות את הפלט שלהן בזמן אמת; ריצות live נשארות חסומות מאחורי מפתח ה-API שלכם, בתוספת אישור עלות מפורש.
- **סשנים / היסטוריה (Sessions / History)** — הסשנים המובילים לפי טוקנים שנחסכו, וכל אירוע שנשמר בדיסק.

| זרימה חיה (Live Flow) | בנצ'מרקים (Benchmarks) |
|---|---|
| ![צינור הבקשה כגרף צמתים חי](../../assets/dashboard-flow.png) | ![קבלות בנצ'מרק וריצות dry-run בתוך ה-UI](../../assets/dashboard-benchmarks.png) |

![טלמטריה: מד טוקנים/$ (odometer) וציר זמן חי של בקשות](../../assets/dashboard-telemetry.png)

# ⚙️ איך זה עובד

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **החיוב מחושב במדויק, לפני ההמרה**: Anthropic מחייבת `⌈w/28⌉ × ⌈h/28⌉ + 4` טוקנים לתמונה (טלאים של 28 פיקסלים — נמדד עד שארית אפס). עמוד מלא נושא 28,080 תווים ב-1,460 טוקנים ≈ **19 תווים לטוקן**, לעומת ~2 תווים לטוקן בטקסט צפוף. השער ממיר רק כשהמתמטיקה משתלמת.
- **מה מומר**: הנחיית המערכת הסטטית + תיעוד הכלים, היסטוריה ישנה שקופלה, פלטי כלים גדולים.
- **מה לעולם לא מומר**: ההודעות שלכם, התורות האחרונים, פלט המודל, פרוזה דלילה, ערכים בייט-מדויקים (גיבובים/מזהים נוסעים לצד כטקסט), וכל מודל שנכשל בבנצ'מרק הקריאה.

# 📚 שימוש כספרייה (ללא פרוקסי)

כל מה שהפרוקסי עושה לכל בקשה זמין גם כ-API מתועד וניתן לייבוא:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` מצמיד בלוקים כטקסט; `options.emitRecoverable` מחזיר את המקוריים של הבלוקים שהומרו לתמונה. מתמטיקת החיוב המדויקת נשלחת גם היא בשורש החבילה (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — וזה מה ש-[OmniRoute](https://github.com/diegosouzapw/OmniRoute) צורך. זמן ריצה Pure-JS (Node ו-edge/Workers). המשטח המלא: `src/core/index.ts`.

# 📤 ייצוא אופליין — ללא פרוקסי, ללא Claude Code

לא על Claude Code? רנדרו את ההקשר לעמודי PNG **מקומית** והדביקו אותם ב-Cursor, ב-ChatGPT או בכל צ'אט שמקבל העלאות תמונה. ללא פרוקסי, ללא מפתח API, ללא חשבון מחווט:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

אתם מקבלים תיקייה אחת עם כל מה שצריך כדי לגרור לתוך הצ'אט:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` מרנדר את ה-diff שלכם שטרם עבר קומיט, `--diff <ref>` טווח קומיטים, `--open` חושף את התיקייה (macOS). הכול רץ על המחשב שלכם — נתיב הייצוא לעולם אינו מפעיל את הפרוקסי ולעולם אינו קורא למודל. הריצו `omniglyph export --help` לכל הדגלים.

# 🧭 The honest part

- **זה עם אובדן (lossy).** שחזור בייט-מדויק מתמונות אינו אמין מטבעו. הפחתות שיושמו: מזהים מדויקים נוסעים כטקסט לצד התמונה, ותצורת הייצור הנמדדת הפיקה **אפס בדיות שקטות** — קריאות כושלות נמנעות.
- **רק Fable 5 מאושר כיום**, עם קבלות. GPT-5.5 ו-Gemini 2.5-flash אינם מסוגלים, באופן נמדד, לקרוא רינדורים צפופים; Opus 4.8 זקוק לגליפים גדולים פי 4. השער אוכף זאת.
- **מצאנו ונמנענו ממלכודת חיוב**: רמת התמונה ברזולוציה גבוהה מחייבת פי 3.3 יותר לעמוד, אך מקודד הראייה אינו מקבל את הרזולוציה הנוספת — עמודים גדולים יותר נקראים *גרוע יותר*. נמדד, מתועד ב-[docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), לא מופעל.
- מחירים משתנים; המדד היציב הוא חיסכון הטוקנים, שהפרוקסי רושם לכל בקשה מול היפותזת-נגד `count_tokens` חינמית.

# 🧠 שאלות נפוצות

**הפעלתי באמצע סשן והצריכה זינקה — למה?**
לסשן שרץ בלי OmniGlyph כל הקידומת שמורה במטמון של Anthropic כטקסט בתעריף קריאה של ‎0.1×‎; הבקשה הראשונה עם תמונות הייתה משלמת על הכול מחדש ככתיבת מטמון טרייה בתעריף ‎1.25×‎ בפרומפט אחד. הפרוקסי מגן מפני זה: סשן שהוא מעולם לא המיר לתמונות מזין את העלות החד-פעמית הזו לשער הכדאיות ועובר לתמונות רק אם זה עדיין משתלם — אחרת הסשן נשאר טקסט, והחיסכון מתחיל בסשן החדש הבא שלך.

**האם ה-59–70% הם מקצה לקצה, או רק על הבקשות שהוא נגע בהן?**
מקצה לקצה — כל החשבון. רוב כלי הדחיסה מדווחים על חיסכון רק על הפלח שבו נגעו, מה שמייפה את המספר. המכנה שלנו הוא *כל* בקשה: הבקשות הקטנות שהשער נכון להשאיר ללא נגיעה, כל כתיבות וקריאות המטמון (cache), וכל טוקני הפלט (שהפרוקסי לעולם אינו דוחס). הריצה שכוללת רק את הבקשות שהומרו (compressed-only) גבוהה יותר ומצוטטת בנפרד, לעולם לא ככותרת.

**כיצד נמדד החיסכון?**
שני הצדדים של אותה בקשה, באותו הרגע. לכל `POST /v1/messages` הפרוקסי יורה בדיקת `count_tokens` חינמית על הגוף המקורי הלא-דחוס (ההיפותזה-נגד) במקביל להעברה האמיתית, וקורא את בלוק השימוש שבו הספק בפועל חייב מתוך התגובה — שניהם נוחתים באותה שורת אירוע. תמחור המטמון (cache) מוחל זהה על שני הצדדים, כך שההנחה על המטמון מתבטלת ולא ניתן לספור אותה פעמיים כ"חיסכון". הנוסחה נמצאת ב-`src/core/baseline.ts`; ניתן לגזור אותה מחדש מיומן האירועים שלכם.

**מדוע החטאה תהיה בדיה (confabulation) ולא שגיאת קריאה?**
כי ראיית המודל אינה OCR: העמוד הופך לשיבוצי טלאים (patch embeddings), לעולם לא לתווים בדידים, כך שאין רמת ביטחון לכל גליף שיכולה להיכשל בקול רם — כאשר הפיקסלים אינם קובעים גליף באופן חד-משמעי, הפריור הלשוני ממלא את הפער במשהו סביר. מנגנון זה הוא בדיוק הסיבה ש-OmniGlyph היא fail-closed לגביו: ערכים בייט-מדויקים תמיד נוסעים כטקסט לצד התמונה, מודלים שקוראים לא נכון נחסמים על ידי השער, ותצורת הייצור הנמדדת הפיקה **אפס** בדיות שקטות בכ-300 בדיקות קריאה — קריאות כושלות נמנעות.

**מה לגבי עבודה בייט-מדויקת (גיבובים, מזהים, סודות)?**
תורות אחרונים ומזהים מדויקים נשארים כטקסט מעצם התכנון. לעומסי עבודה שהם *כולם* בייט-מדויקים, נתבו אותם למודל שאינו ברשימת ההיתר (למשל, תת-סוכן על מודל Claude אחר) — כל דבר מחוץ לרשימת ההיתר עובר זהה בייט-לבייט, ללא נגיעה.

**האם DeepSeek-OCR לא כבר הכריע אם זה עובד?**
זה הוכיח שה*ערוץ* עובד — עם זוג מקודד/מפענח שאומן במיוחד למשימה. הספקנות מקורה בתקופה שבה שום מודל ייצור מדף לא היה מסוגל לקרוא רינדורים צפופים; זה השתנה, וה[כרטיס ציונים למודלים](../../../README.md#-the-numbers--measured-not-estimated) שלמעלה מראה בדיוק מי קורא אותם היום, עם קבלות. [רתמת הבנצ'מרק](../../../benchmarks/README.md) בודקת מחדש כל מודל חדש בפקודה אחת — השער הולך אחרי הנתונים, לא אחרי ההייפ.

**האם אפשר להשתמש בזה ללא Claude Code — Cursor, ChatGPT, או pipe פשוט?**
כן, בשתי דרכים. כ**פרוקסי** זה עובד עם כל לקוח שמאפשר לכם להגדיר את כתובת בסיס ה-API (`ANTHROPIC_BASE_URL`, או כתובת בסיס ה-API של OpenAI) — Claude Code, הסקריפטים שלכם, כל דבר HTTP. ולכלים שאינם יכולים לעבוד דרך פרוקסי, ה**ייצוא אופליין** שלמעלה מרנדר את ההקשר לעמודי PNG שאתם מדביקים ידנית — `omniglyph export --stdin` אפילו קורא ישירות מ-pipe של Unix.

**איך זה למעשה הופך טקסט לתמונה?**
זה מזרים מחדש (reflow) את הטקסט וצובע אותו עם אטלס גליפים של 1-ביט בגודל 5×8 פיקסלים על עמודי PNG צפופים בגודל 1568×728 — ביט אחד לכל פיקסל, ללא החלקה (anti-aliasing), כך שהמודל מחייב את העמוד לפי מידותיו, לא לפי כמות התווים שבתוכו. **איך זה עובד** שלמעלה מכיל את הצינור; מסמך הבנצ'מרקים מכיל את הגאומטריה ואת הסיבה לכך שצפוף יותר אינו תמיד זול יותר.

# 🔬 שחזרו כל מספר

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

מתודולוגיה מלאה וכל טבלת תוצאות: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). קבלות גולמיות לכל תשובה: `benchmarks/*/results/*.jsonl`.

# 🚀 משפחת OmniRoute

OmniGlyph משמש גם כ**מנוע דחיסה מובנה בתוך [OmniRoute](https://github.com/diegosouzapw/OmniRoute)** — שער ה-AI החינמי. שם הוא פועל כמנוע `omniglyph` (מצב עצמאי בודד או בערימה עם מנועים אחרים), עם שערי fail-closed וחשבונאות טוקנים מודעת-תמונה.

# 🛠️ מחסנית טכנולוגית

| שכבה | טכנולוגיה |
|---|---|
| שפה | TypeScript (strict), ESM |
| זמן ריצה | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| רינדור | אטלס גליפים משלו, 1-ביט (נגזר מ-Spleen/Unifont, רישיונות ב-`assets/`) → PNG |
| בדיקות | Vitest — TDD, בתוספת שומרי docs-integrity ו-rebrand |
| בנצ'מרקים | רתמות `benchmarks/` (billing-sweep, density-frontier) עם קבלות JSONL |

## מבנה הפרויקט

| נתיב | מה |
|---|---|
| `src/` | הפרוקסי: צינור הטרנספורמציה, חיוב מדויק לכל ספק, הרנדרר, המארחים (Node + Cloudflare Workers) |
| `benchmarks/` | הרתמות שהפיקו כל מספר שלמעלה — ניתנות להרצה מחדש |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 תמיכה וקהילה

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — באגים ובקשות תכונה
- 🔒 [SECURITY.md](SECURITY.md) — דיווחי פגיעויות
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — TDD קפדני + מדידה לפני טענות
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 תודות

OmniGlyph עומד על כתפי פרויקט אחד בפרט — הסעיף הזה הוא תודתנו הקבועה.

| פרויקט | איך הוא עיצב את OmniGlyph |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **התגלית שעליה בנוי כל הפרויקט הזה.** pxpipe הוכיח, עם קבלות, שערוץ הראייה של LLM בייצור יכול לשאת הקשר טקסטואלי צפוף בשבריר מעלות הטוקנים — ושההמרה חייבת להיקבע לכל בקשה לפי מתמטיקת חיוב מדויקת, לעולם לא לפי תחושת בטן. הרינדור הצפוף בביט אחד, שער הרווחיות, היפותזת-הנגד `count_tokens`, רשימת ההיתר של מודלים ה-fail-closed, ותרבות התיעוד של "למדוד לפני שטוענים" — כולם נחלצו שם לראשונה. OmniGlyph יורד ישירות מבסיס הקוד הזה (MIT — שורת זכויות היוצרים המקורית נשארת ב-[LICENSE](../../../LICENSE) שלנו). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | משפחת גופני ה-bitmap 5×8 שממנה נגזר אטלס הגליפים הצפוף בביט אחד שלנו (רישיון ב-`assets/`). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | כיסוי לגליפים שמעבר לטווח של Spleen, באותו אטלס (רישיון ב-`assets/`). |

אם אתם מוצאים ש-OmniGlyph שימושי, תנו כוכב גם לפרויקט המקורי — הגילוי היה שלהם. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 רישיון

MIT — ראו [LICENSE](../../../LICENSE).
