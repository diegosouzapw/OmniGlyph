# बेंचमार्क

🌐 अनुवादित: [सभी भाषाएँ](../../README.md)

OmniGlyph जो भी दावा करता है वह नीचे दिए गए दो हार्नेस में से किसी एक से
आता है — दोबारा चलाने योग्य, जहाँ संभव हो निर्धारक, `*/results/*.jsonl`
में कच्ची प्रति-उत्तर रसीदों के साथ। समेकित विश्लेषण:
[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)।

## बचत कैसे काम करती है (एक तस्वीर में)

प्रोवाइडर **टेक्स्ट को टोकन के हिसाब से** बिल करते हैं, लेकिन **छवि को उसके
आयामों के हिसाब से** बिल करते हैं — न कि इस आधार पर कि उसके अंदर कितना
टेक्स्ट भरा है। एक मानक पेज की लागत तय है, चाहे टेक्स्ट कितना भी सघन क्यों
न हो:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

वही संदर्भ, दो तरीक़ों से बिल किया गया:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

छवि क्यों जीतती है — प्रति टोकन ढोए गए अक्षर:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph यह अदला-बदली तभी करता है जब सटीक गणित कहे कि यह जीतेगी, और केवल
उन मॉडलों के लिए जिन्होंने पेज पढ़ना सिद्ध किया है। नीचे दिए दोनों हार्नेस
इसका हर आधा हिस्सा साबित करते हैं।

## 1. `billing-sweep/` — एक छवि की वास्तविक लागत क्या है?

लाइव Anthropic API के विरुद्ध मुफ़्त `count_tokens` जाँचें, जो सेवानिवृत्त
`w·h/750` फ़ॉर्मूले की तुलना 2 मॉडल × 2 रिज़ॉल्यूशन टियर पर 11 प्रोब
ज्यामितियों में वर्तमान 28 px-पैच मॉडल से करती हैं।

**परिणाम (2026-07-05): पैच मॉडल हर प्रोब पर शून्य अवशिष्ट के साथ फ़िट
बैठता है** — टियर रीसाइज़ के बाद बिल `⌈w/28⌉ × ⌈h/28⌉` लगाया जाता है,
साथ ही प्रति छवि ब्लॉक एक निश्चित +3/+4 टोकन। प्रोडक्शन पेज (1568×728)
की लागत ठीक 1,460 टोकन है और यह 28,080 अक्षर वहन करता है ≈ **19.2
अक्षर/टोकन**, जबकि सघन टेक्स्ट के लिए यह ~2 अक्षर/टोकन है।

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

## 2. `density-frontier/` — क्या मॉडल इसे वास्तव में पढ़ सकता है?

रेंडर कॉन्फ़िग, पेज ज्यामिति, ग्लिफ़ एटलस और प्रोवाइडरों में लागत
(ऑफ़लाइन, सटीक) × पठन-सटीकता (लाइव)। कॉर्पस सटीक-स्ट्रिंग सुइयाँ
(हेक्स आईडी, camelCase, अंकों की लड़ियाँ) रोपता है, साथ ही मापे गए
**glyph-confusability जोड़ों से बनाए गए near-miss विकर्षक** — ताकि मौन
मनगढ़ंत उत्तर का पता चले, न कि केवल ग़लत गिना जाए। स्कोरिंग निर्धारक है
(कोई LLM-न्यायाधीश नहीं): `correct` / `abstained` (ईमानदार `ILEGIVEL`) /
`silent_wrong` / `no_answer`।

**मुख्य परिणाम** (n=30 प्रति भुजा):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | zero errors, zero confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 honest abstentions — why production flipped to 1-bit |
| Fable 5 · high-res 1928² page | 1–2/30 | billed 3.3× but encoder-resampled — the billing trap, not enabled |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | the opt-in safe mode |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + ~40× output-token inflation vs its own text control (30/30, 62 tok) |
| Gemini 2.5-flash (partial, quota) | 0/26 | confabulates instead of abstaining |

पठन-सटीकता एक नज़र में — यही **है** फ़ेल-क्लोज़्ड मॉडल गेट, चित्रित:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

केवल ✅ भुजा शिप होती है। जो कुछ भी ख़राब पढ़ता है उसे *रसीद के साथ* रोका
जाता है, और थ्री-वे स्कोर का मतलब है कि जो मॉडल ग़लत अनुमान लगाता है
(`silent_wrong`) उसे उस मॉडल से भी बदतर माना जाता है जो ईमानदारी से
परहेज़ करता है (`ILEGIVEL`)।

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
