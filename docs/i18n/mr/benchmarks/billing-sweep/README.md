# Anthropic vision-billing sweep

🌐 भाषांतरित: [सर्व भाषा](../../../README.md)

**हे का अस्तित्वात आहे:** profitability gate तेव्हाच सुरक्षित असते जेव्हा खर्च
अंदाज *अचूक* असतो. थोडासा चुकीचा सूत्र अशा ब्लॉक्सचे रूपांतर करेल जे प्रत्यक्षात
जास्त खर्च करतात. म्हणून हा sweep सूत्राला API च्या खऱ्या आकड्यांशी शिपिंगपूर्वी
पिन करतो — **शून्य अवशेषा**पर्यंत.

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

मोफत `count_tokens` sweep जो दोन खुल्या भूमिती प्रश्नांचा निर्णय घेतो:

1. **सूत्र** — API `ceil(w/28) × ceil(h/28)` patches (सध्याचे docs) बिल
   करते की निवृत्त `w·h/750`? probe संच दोघांना प्रति ओळी 25–180 टोकन्सने
   वेगळे करतो.
2. **टियर** — `claude-fable-5` ला high-resolution caps मिळतात का (long
   edge ≤ 2576 px, ≤ 4784 visual tokens)? `page-old-1928x1928` ओळ निर्णायक
   आहे: ≈ **4761** मोजलेले म्हणजे high-res WYSIWYG (जुने मोठे पान आजच्या
   1568×728 पेक्षा प्रति image ~3.3× जास्त अक्षरे वाहून नेते, त्याच
   chars/token वर); ≈ **1521** म्हणजे standard-tier resample, आणि
   1568×728 बरोबर राहते.

संदर्भ: सध्याच्या 1568×728 पानामागील 2026-07-01 sweep
(legibility audit, 2026-07-01) `claude-sonnet-4-5` वर मोजले गेले — एक
standard-tier मॉडेल — तर उत्पादन Fable 5 ला लक्ष्य करते, ज्याला vision
docs high-resolution tier मध्ये ठेवतात. त्या audit ने सध्याचे पान 1460
टोकन्सवर मोजले: /750 च्या 1522 पेक्षा patch formula च्या 1456 च्या जवळ,
जे सुचवते की API आधीच patch billing कडे वळले होते.

## चालवा

```bash
pnpm run build                              # dist/ prerequisite (like all evals)
node benchmarks/billing-sweep/run.mjs --dry-run   # predictions only, no key, $0

ANTHROPIC_API_KEY=sk-... node benchmarks/billing-sweep/run.mjs \
  --models claude-fable-5,claude-sonnet-4-5 --probe-multi --probe-20plus
```

**थेट** API ला हिट करणे आवश्यक — कधीच OmniGlyph proxy द्वारे नाही, जो
बॉडी ट्रान्सफॉर्म करेल. `count_tokens` मोफत आहे; पूर्ण sweep ~25 विनंत्या
करते.

## आउटपुट वाचणे

प्रति मॉडेल, प्रत्येक probe ओळ मोजलेले image tokens दाखवते (with-image
वजा text-only baseline) सर्व चार predictions विरुद्ध (`patch`/`legacy750`
× `standard`/`highres`); सारांश गृहीतकांना mean absolute residual नुसार
क्रमवारी लावतो. `--probe-multi` प्रति-image cap तपासतो (2×1092² ≈
2×1521); `--probe-20plus` >20-images नियम तपासतो (>2000 px बाजू नाकारली
गेली पाहिजे, resampled नाही). ओळी `results/*.jsonl` मध्ये उतरतात; prediction
गणित `formulas.mjs` मध्ये राहते, `tests/billing-sweep-formulas.test.ts`
द्वारे पिन केलेले.

## निर्णयानंतर

- Patch सूत्राची पुष्टी झाल्यास → OmniGlyph PR #27 (exact resize
  translation) पोर्ट करा आणि `src/core/transform.ts` मधील
  `ANTHROPIC_PIXELS_PER_TOKEN` गेट गणित संरेखित करा.
- Fable वर high-res tier ची पुष्टी झाल्यास → प्रति-टियर पान भूमिती पुन्हा
  आणा (Fable/Opus 4.8/Sonnet 5 साठी 1928×1928-class पाने, standard साठी
  1568×728), GPT path आधीच स्वतःचा `GPT_MAX_HEIGHT_PX` कसा ठेवतो त्याप्रमाणे.
