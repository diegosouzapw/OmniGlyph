🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — संदर्भ प्रतिमारूपात

### दाट कॉन्टेक्स्टला घन PNG पानांच्या स्वरूपात रेंडर करून तुमचे Claude बिल **59–70%** ने कमी करा — तेच कंटेंट, टोकन्सचा फक्त एक अंश वापरून.

**मॉडेल्स मजकुरासाठी टोकनप्रमाणे शुल्क आकारतात, पण प्रतिमेसाठी तिच्या परिमाणांनुसार शुल्क आकारतात — त्यात किती मजकूर आहे यानुसार नाही.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) कुटुंबाचा भाग · [🌐 सर्व भाषा](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| मेट्रिक | निकाल | पावती |
|---|---|---|
| एंड-टू-एंड बिल घट | **59–70%** | उत्पादन ट्रेस, 13,709 विनंत्या |
| प्रति-रूपांतरित-ब्लॉक टोकन्स | **10× कमी** (28,080 अक्षरे: 14,040 → 1,460 टोकन्स) | [billing sweep](benchmarks/billing-sweep/README.md) |
| बिलिंग-सूत्र अचूकता | 22 `count_tokens` प्रोब्जमध्ये, 2 मॉडेल्स × 2 टियर्समध्ये **शून्य** अवशेष | `benchmarks/billing-sweep/results/` |
| उत्पादन कॉन्फिगमध्ये अचूक-वाचन अचूकता | Claude Fable 5 वर **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300 वाचन प्रोब्जमध्ये गुप्त गोंधळ (confabulations) | **0** — प्रत्येक चूक `ILEGIVEL` म्हणून थांबते | `benchmarks/density-frontier/results/` |

**मॉडेल स्कोअरकार्ड** (तो घन रेंडर वाचू शकतो का? प्रति आर्म n=30, निश्चयात्मक स्कोअरिंग):

| मॉडेल | वाचन | निर्णय |
|---|---|---|
| Claude **Fable 5** | **100%** अचूक | ✅ उत्पादन लक्ष्य |
| Claude Opus 4.8 | 4× ग्लिफ आकारावर 77–87% | ⚠️ ऑप्ट-इन सुरक्षित मोड (बचत ~2× पर्यंत घटते) |
| GPT-5.5 | 0/60 — आणि प्रयत्नात उत्तरे ~40× फुगवतो | ❌ गेटने ब्लॉक केले, पुराव्यासह |
| Gemini 2.5-flash | 0/26 — आणि थांबण्याऐवजी गोंधळ निर्माण करतो | ❌ ब्लॉक (आंशिक चाचणी, कोटा-मर्यादित) |

हा फायदा आज **Fable-विशिष्ट** आहे — इतर व्हिजन एन्कोडर्स अजून घन ग्लिफ्स रिझॉल्व्ह करत नाहीत. [बेंचमार्क हार्नेस](benchmarks/README.md) एका कमांडमध्ये कोणत्याही नव्या मॉडेलची पुन्हा चाचणी करतो.

# 🤔 OmniGlyph का?

प्रत्येक दीर्घकाळ चालणारे एजंट सत्र प्रत्येक विनंतीवर तोच मृत भार ओढते: सिस्टम प्रॉम्प्ट, टूल डॉक्स, आणि जुना इतिहास — दर वळणी प्रति टोकन पुन्हा बिल केले जाते. OmniGlyph हा एक **लोकल प्रॉक्सी** आहे जो या दाट भागांना *तुमच्या मशीनवरून बाहेर जाण्यापूर्वीच* घन PNG पानांमध्ये पुनर्लेखन करतो:

- **अचूक बिलिंग गणित, अंदाज नाही** — तो प्रदात्याचे खरे इमेज-टोकन सूत्र मोजतो (शून्य अवशेषापर्यंत मोजलेले) आणि गणित जिंकतेच तेव्हाच रूपांतरण करतो.
- **डिझाइननुसार फेल-क्लोज्ड** — जे मॉडेल्स घन रेंडर वाचू शकत नाहीत ते बेंचमार्क पावतीसह गेटद्वारे अडवले जातात. कोणतीही मूक गुणवत्ता हानी नाही.
- **खासगी व लोकल-फर्स्ट** — पुनर्लेखन `127.0.0.1` वर होते; अतिरिक्त काहीही कुठेही पाठवले जात नाही.
- **पुनरुत्पादनीय** — वरील प्रत्येक आकड्याला `benchmarks/*/results/` मध्ये पावती आहे, एका कमांडमध्ये पुन्हा-चालवण्यायोग्य.

# ⚡ त्वरित सुरुवात

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

दोन्ही प्रकारे काम करते:
- **API key** (प्रति-टोकन पैसे भरणे): तुमचे बिल एंड-टू-एंड 59–70% ने कमी होते.
- **सबस्क्रिप्शन सत्र**: तुम्ही कमी पैसे भरत नाही, पण वापर मर्यादा टोकन्समध्ये मोजल्या जातात — त्यामुळे तुमच्या मर्यादा **~2–3×** पर्यंत ताणल्या जातात.

<http://127.0.0.1:47821/> येथील डॅशबोर्ड: वाचवलेले टोकन्स, प्रत्येक मजकूर→प्रतिमा रूपांतरण बाजूबाजूला, किल स्विच, लाइव्ह मॉडेल चिप्स. प्रतिसाद नेहमीप्रमाणे स्ट्रीम होतात — फक्त *विनंती* संकुचित केली जाते, मॉडेलचे आउटपुट कधीच नाही.

# ⚙️ हे कसे काम करते

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **रूपांतरणापूर्वी बिलिंगची अचूक गणना केली जाते**: Anthropic प्रति प्रतिमा `⌈w/28⌉ × ⌈h/28⌉ + 4` टोकन्स आकारते (28 px पॅचेस — शून्य अवशेषापर्यंत मोजलेले). एक पूर्ण पान 1,460 टोकन्ससाठी 28,080 अक्षरे वाहून नेते ≈ **19 अक्षरे/टोकन**, तर घन मजकुरासाठी हे प्रमाण ~2 अक्षरे/टोकन आहे. गणित जिंकतेच तेव्हाच गेट रूपांतरण करतो.
- **काय रूपांतरित होते**: स्थिर सिस्टम प्रॉम्प्ट + टूल डॉक्स, जुना संकुचित इतिहास, मोठी टूल आउटपुट्स.
- **काय कधीच रूपांतरित होत नाही**: तुमचे संदेश, अलीकडील वळणे, मॉडेलचे आउटपुट, विरळ गद्य, बाइट-अचूक मूल्ये (हॅशेस/आयडी मजकुराच्या स्वरूपात सोबत राहतात), आणि वाचन बेंचमार्कमध्ये अपयशी ठरलेले कोणतेही मॉडेल.

# 🧭 The honest part

- **हे नुकसानकारी (lossy) आहे.** प्रतिमांमधून बाइट-अचूक स्मरण स्वभावतः अविश्वसनीय आहे. जहाज केलेले उपाय: अचूक ओळखकर्ते प्रतिमेजवळ मजकूर म्हणून प्रवास करतात, आणि मोजलेल्या उत्पादन कॉन्फिगने **शून्य मूक गोंधळ** निर्माण केले — अयशस्वी वाचने थांबतात.
- **आज फक्त Fable 5 मान्यताप्राप्त आहे**, पावत्यांसह. GPT-5.5 आणि Gemini 2.5-flash मोजमापाने घन रेंडर वाचू शकत नाहीत; Opus 4.8 ला 4× मोठे ग्लिफ हवे आहेत. गेट हे सक्तीने लागू करते.
- **आम्हाला एक बिलिंग सापळा सापडला व टाळला**: उच्च-रिझोल्यूशन इमेज टियर प्रति पान 3.3× जास्त शुल्क आकारतो, पण व्हिजन एन्कोडरला अतिरिक्त रिझोल्यूशन मिळत नाही — मोठी पाने *वाईट* वाचली जातात. मोजलेले, [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) मध्ये दस्तऐवजीकरण केलेले, सक्रिय केलेले नाही.
- किमती बदलतात; टिकाऊ मेट्रिक टोकन घट आहे, जी प्रॉक्सी प्रत्येक विनंतीसाठी मोफत `count_tokens` काउंटरफॅक्च्युअलच्या तुलनेत नोंदवतो.

# 🔬 प्रत्येक आकडा पुनरुत्पादित करा

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

पूर्ण पद्धत आणि प्रत्येक निकाल तक्ता: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). कच्च्या प्रति-उत्तर पावत्या: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute कुटुंब

OmniGlyph [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) — मोफत AI गेटवे — मध्ये एक **नेटिव्ह कंप्रेशन इंजिन** म्हणूनही जहाज होतो. तिथे तो `omniglyph` इंजिन म्हणून चालतो (स्वतंत्र सिंगल मोड किंवा इतर इंजिन्सबरोबर स्टॅक केलेला), फेल-क्लोज्ड गेट्स आणि इमेज-जागृत टोकन अकाउंटिंगसह.

# 🛠️ तंत्रज्ञान स्टॅक

| स्तर | तंत्रज्ञान |
|---|---|
| भाषा | TypeScript (strict), ESM |
| रनटाइम | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| रेंडरिंग | स्वतःचा 1-बिट ग्लिफ अॅटलास (Spleen/Unifont-व्युत्पन्न, परवाने `assets/` मध्ये) → PNG |
| चाचण्या | Vitest — TDD, तसेच docs-integrity आणि rebrand guards |
| बेंचमार्क्स | `benchmarks/` हार्नेस (billing-sweep, density-frontier) JSONL पावत्यांसह |

## प्रकल्प रचना

| मार्ग | काय |
|---|---|
| `src/` | प्रॉक्सी: ट्रान्सफॉर्म पाइपलाइन, प्रति प्रदाता अचूक बिलिंग, रेंडरर, होस्ट्स (Node + Cloudflare Workers) |
| `benchmarks/` | वरील प्रत्येक आकडा निर्माण करणारे हार्नेस — पुन्हा-चालवण्यायोग्य |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 समर्थन आणि समुदाय

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — बग्ज आणि फीचर विनंत्या
- 🔒 [SECURITY.md](SECURITY.md) — असुरक्षितता अहवाल
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — कठोर TDD + दाव्यांआधी मोजमाप
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 परवाना

MIT — पहा [LICENSE](../../../LICENSE).
