# बेंचमार्क्स

OmniGlyph जो प्रत्येक आकडा दावा करतो तो खालील दोन हार्नेसपैकी एकातून येतो —
पुन्हा-चालवण्यायोग्य, शक्य तिथे निश्चयात्मक, `*/results/*.jsonl` मध्ये कच्च्या
प्रति-उत्तर पावत्यांसह. एकत्रित विश्लेषण: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md).

## 1. `billing-sweep/` — एका प्रतिमेचा खरा खर्च किती आहे?

live Anthropic API विरुद्ध मोफत `count_tokens` प्रोब्ज, निवृत्त `w·h/750`
सूत्राची सध्याच्या 28 px-patch मॉडेलशी तुलना, 2 मॉडेल्स × 2 रिझॉल्यूशन
टियर्सवर 11 प्रोब भूमितींमध्ये.

**निकाल (2026-07-05): patch मॉडेल प्रत्येक probe वर शून्य अवशेषासह बसतो**
— बिल केलेले = `⌈w/28⌉ × ⌈h/28⌉` टियर रिसाइझनंतर, अधिक प्रति image block
+3/+4 टोकन्सचे स्थिर शुल्क. उत्पादन पान (1568×728) बरोबर 1,460 टोकन्स खर्च
करते आणि 28,080 अक्षरे वाहून नेते ≈ **19.2 अक्षरे/टोकन** तर घन मजकुरासाठी
हे प्रमाण ~2 अक्षरे/टोकन आहे.

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — मॉडेल खरोखर वाचू शकतो का?

खर्च (ऑफलाइन, अचूक) × वाचन-अचूकता (live) — रेंडर कॉन्फिग्ज, पान भूमिती,
ग्लिफ अॅटलास आणि प्रदात्यांमध्ये. कॉर्पस exact-string needles (hex ids,
camelCase, digit runs) plus **मोजलेल्या glyph-confusability जोड्यांवरून
तयार केलेले near-miss distractors** पेरतो — जेणेकरून मूक confabulation
शोधले जाते, फक्त चुकीचे मोजले जात नाही. स्कोअरिंग निश्चयात्मक आहे (LLM
judge नाही): `correct` / `abstained` (प्रामाणिक `ILEGIVEL`) / `silent_wrong`
/ `no_answer`.

**मुख्य निकाल** (प्रति arm n=30):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | शून्य errors, शून्य confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5 प्रामाणिक abstentions — production 1-bit कडे का वळले |
| Fable 5 · high-res 1928² page | 1–2/30 | 3.3× बिल केले पण encoder-resampled — बिलिंग सापळा, सक्रिय नाही |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | opt-in safe mode |
| GPT-5.5 · 768px strip (दोन्ही atlases) | 0/60 | + स्वतःच्या text control (30/30, 62 tok) च्या तुलनेत ~40× output-token inflation |
| Gemini 2.5-flash (आंशिक, quota) | 0/26 | abstain करण्याऐवजी confabulate करतो |

तीन transports: direct API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), आणि `--via-cli` (Claude Code subscription —
$0). कठीण मार्गाने शिकलेली सावधानता: intermediaries (OpenRouter, CLI Read
टूल) मोठ्या प्रतिमा resample करतात; फक्त direct-API निकाल वाचनीयतेसाठी
अधिकृत आहेत.

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

शुद्ध भागांना पिन करणाऱ्या युनिट चाचण्या (corpus, scoring, cost formulas):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`.
