# बेंचमार्क

OmniGlyph जो भी दावा करता है वह नीचे दिए गए दो हार्नेस में से किसी एक से
आता है — दोबारा चलाने योग्य, जहाँ संभव हो निर्धारक, `*/results/*.jsonl`
में कच्ची प्रति-उत्तर रसीदों के साथ। समेकित विश्लेषण:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)।

## 1. `billing-sweep/` — एक छवि की वास्तविक लागत क्या है?

लाइव Anthropic API के विरुद्ध मुफ़्त `count_tokens` जाँचें, जो सेवानिवृत्त
`w·h/750` फ़ॉर्मूले की तुलना 2 मॉडल × 2 रिज़ॉल्यूशन टियर पर 11 प्रोब
ज्यामितियों में वर्तमान 28 px-पैच मॉडल से करती हैं।

**परिणाम (2026-07-05): पैच मॉडल हर प्रोब पर शून्य अवशिष्ट के साथ फ़िट
बैठता है** — टियर रीसाइज़ के बाद बिल `⌈w/28⌉ × ⌈h/28⌉` लगाया जाता है,
साथ ही प्रति छवि ब्लॉक एक निश्चित +3/+4 टोकन। प्रोडक्शन पेज (1568×728)
की लागत ठीक 1,460 टोकन है और यह 28,080 अक्षर वहन करता है ≈ **19.2
अक्षर/टोकन**, जबकि सघन टेक्स्ट के लिए यह ~2 अक्षर/टोकन है।

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — क्या मॉडल इसे वास्तव में पढ़ सकता है?

रेंडर कॉन्फ़िग, पेज ज्यामिति, ग्लिफ़ एटलस और प्रोवाइडरों में लागत
(ऑफ़लाइन, सटीक) × पठन-सटीकता (लाइव)। कॉर्पस उन वर्गों से सटीक-स्ट्रिंग
सुइयाँ रोपता है जिनके बारे में confusability मैट्रिक्स कहता है कि वे
विफल होती हैं (12-अक्षर हेक्स, camelCase, अंक 6/8/5/3) साथ ही मापे गए
भ्रामक जोड़ों से बनाए गए **near-miss विकर्षक** — ताकि मौन मनगढ़ंत उत्तर
का पता चले, न कि केवल ग़लत गिना जाए। स्कोरिंग निर्धारक है (कोई LLM-न्यायाधीश
नहीं): `correct` / `abstained` (ईमानदार `ILEGIVEL`) / `silent_wrong` /
`no_answer`।

**मुख्य परिणाम** (n=30 प्रति भुजा):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

तीन ट्रांसपोर्ट: डायरेक्ट API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), और `--via-cli` (Claude Code सब्सक्रिप्शन —
$0)। कठिन तरीक़े से सीखी गई सावधानी: बिचौलिये (OpenRouter, CLI का Read
टूल) बड़ी छवियों को resample करते हैं; पठनीयता के लिए केवल डायरेक्ट-API
परिणाम प्रामाणिक हैं।

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

शुद्ध हिस्सों को पिन करने वाले यूनिट टेस्ट (कॉर्पस, स्कोरिंग, लागत
फ़ॉर्मूले):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`।
