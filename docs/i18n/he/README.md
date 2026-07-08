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

# ⚙️ איך זה עובד

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **החיוב מחושב במדויק, לפני ההמרה**: Anthropic מחייבת `⌈w/28⌉ × ⌈h/28⌉ + 4` טוקנים לתמונה (טלאים של 28 פיקסלים — נמדד עד שארית אפס). עמוד מלא נושא 28,080 תווים ב-1,460 טוקנים ≈ **19 תווים לטוקן**, לעומת ~2 תווים לטוקן בטקסט צפוף. השער ממיר רק כשהמתמטיקה משתלמת.
- **מה מומר**: הנחיית המערכת הסטטית + תיעוד הכלים, היסטוריה ישנה שקופלה, פלטי כלים גדולים.
- **מה לעולם לא מומר**: ההודעות שלכם, התורות האחרונים, פלט המודל, פרוזה דלילה, ערכים בייט-מדויקים (גיבובים/מזהים נוסעים לצד כטקסט), וכל מודל שנכשל בבנצ'מרק הקריאה.

# 🧭 The honest part

- **זה עם אובדן (lossy).** שחזור בייט-מדויק מתמונות אינו אמין מטבעו. הפחתות שיושמו: מזהים מדויקים נוסעים כטקסט לצד התמונה, ותצורת הייצור הנמדדת הפיקה **אפס בדיות שקטות** — קריאות כושלות נמנעות.
- **רק Fable 5 מאושר כיום**, עם קבלות. GPT-5.5 ו-Gemini 2.5-flash אינם מסוגלים, באופן נמדד, לקרוא רינדורים צפופים; Opus 4.8 זקוק לגליפים גדולים פי 4. השער אוכף זאת.
- **מצאנו ונמנענו ממלכודת חיוב**: רמת התמונה ברזולוציה גבוהה מחייבת פי 3.3 יותר לעמוד, אך מקודד הראייה אינו מקבל את הרזולוציה הנוספת — עמודים גדולים יותר נקראים *גרוע יותר*. נמדד, מתועד ב-[docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md), לא מופעל.
- מחירים משתנים; המדד היציב הוא חיסכון הטוקנים, שהפרוקסי רושם לכל בקשה מול היפותזת-נגד `count_tokens` חינמית.

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

## 📄 רישיון

MIT — ראו [LICENSE](../../../LICENSE).
