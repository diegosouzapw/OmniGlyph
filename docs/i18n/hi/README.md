🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — संदर्भ को छवि के रूप में

### भारी-भरकम संदर्भ को सघन PNG पेजों के रूप में रेंडर करके अपना Claude बिल **59–70%** तक घटाएँ — वही सामग्री, टोकनों के एक छोटे अंश में।

**मॉडल टेक्स्ट का बिल प्रति टोकन लगाते हैं, लेकिन किसी छवि का बिल उसके आयामों के आधार पर लगाते हैं — न कि यह कि उसके अंदर कितना टेक्स्ट है।**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) परिवार का हिस्सा · [🌐 सभी भाषाएँ](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| मीट्रिक | परिणाम | रसीद |
|---|---|---|
| एंड-टू-एंड बिल में कमी | **59–70%** | प्रोडक्शन ट्रेस, 13,709 अनुरोध |
| प्रति परिवर्तित ब्लॉक टोकन | **10× कम** (28,080 अक्षर: 14,040 → 1,460 टोकन) | [billing sweep](benchmarks/billing-sweep/README.md) |
| बिलिंग-फ़ॉर्मूला सटीकता | 22 `count_tokens` जाँचों में **शून्य** अवशिष्ट, 2 मॉडल × 2 स्तर | `benchmarks/billing-sweep/results/` |
| सटीक-पठन सटीकता, प्रोडक्शन कॉन्फ़िग | Claude Fable 5 पर **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300 पठन जाँचों में मौन मनगढ़ंत उत्तर | **0** — हर चूक `ILEGIVEL` के रूप में परहेज़ करती है | `benchmarks/density-frontier/results/` |

**मॉडल स्कोरकार्ड** (क्या यह सघन रेंडर पढ़ सकता है? n=30 प्रति भुजा, निर्धारक स्कोरिंग):

| मॉडल | पठन | निष्कर्ष |
|---|---|---|
| Claude **Fable 5** | **100%** सटीक | ✅ प्रोडक्शन लक्ष्य |
| Claude Opus 4.8 | 4× ग्लिफ़ आकार पर 77–87% | ⚠️ ऑप्ट-इन सुरक्षित मोड (बचत घटकर ~2× रह जाती है) |
| GPT-5.5 | 0/60 — और कोशिश में अपने उत्तर ~40× फुला देता है | ❌ गेट द्वारा अवरुद्ध, प्रमाण सहित |
| Gemini 2.5-flash | 0/26 — और परहेज़ करने के बजाय मनगढ़ंत उत्तर देता है | ❌ अवरुद्ध (आंशिक परीक्षण, कोटा-सीमित) |

यह लाभ आज **Fable-विशिष्ट** है — अन्य विज़न एन्कोडर अभी सघन ग्लिफ़ नहीं पढ़ पाते। [बेंचमार्क हार्नेस](benchmarks/README.md) एक ही कमांड में किसी भी नए मॉडल को दोबारा जाँच लेता है।

# 🤔 OmniGlyph क्यों?

हर लंबे समय तक चलने वाला एजेंट सत्र हर अनुरोध पर वही मृत भार खींचता है: सिस्टम प्रॉम्प्ट, टूल दस्तावेज़, और पुराना इतिहास — हर बार प्रति टोकन फिर से बिल किए जाते हैं। OmniGlyph एक **स्थानीय प्रॉक्सी** है जो उन भारी-भरकम हिस्सों को *आपकी मशीन छोड़ने से पहले* सघन PNG पेजों में फिर से लिख देता है:

- **सटीक बिलिंग गणित, अनुमान नहीं** — यह प्रोवाइडर के वास्तविक इमेज-टोकन फ़ॉर्मूले की गणना करता है (शून्य अवशिष्ट तक मापा गया) और केवल तभी परिवर्तित करता है जब गणित पक्ष में हो।
- **डिज़ाइन से फेल-क्लोज़्ड** — जो मॉडल सघन रेंडर नहीं पढ़ सकते उन्हें बेंचमार्क रसीदों के साथ एक गेट रोकता है। कोई मौन गुणवत्ता हानि नहीं।
- **निजी और लोकल-फ़र्स्ट** — पुनर्लेखन `127.0.0.1` पर होता है; कुछ भी अतिरिक्त कहीं नहीं भेजा जाता।
- **पुनरुत्पादनीय** — ऊपर दिए हर आँकड़े की एक रसीद `benchmarks/*/results/` में है, जिसे एक कमांड में दोबारा चलाया जा सकता है।

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

दोनों तरह से काम करता है:
- **API कुंजी** (प्रति टोकन भुगतान): आपका बिल एंड-टू-एंड 59–70% घट जाता है।
- **सब्सक्रिप्शन सत्र**: आप कम भुगतान नहीं करते, लेकिन उपयोग सीमाएँ टोकनों में गिनी जाती हैं — इसलिए आपकी सीमाएँ **~2–3×** तक फैल जाती हैं।

<http://127.0.0.1:47821/> पर डैशबोर्ड: बचाए गए टोकन, हर टेक्स्ट→छवि रूपांतरण साथ-साथ, किल स्विच, लाइव मॉडल चिप्स। प्रतिक्रियाएँ सामान्य रूप से स्ट्रीम होती हैं — केवल *अनुरोध* संपीड़ित होता है, मॉडल का आउटपुट कभी नहीं।

# ⚙️ यह कैसे काम करता है

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **बिलिंग की गणना परिवर्तित करने से पहले सटीक रूप से की जाती है**: Anthropic प्रति छवि `⌈w/28⌉ × ⌈h/28⌉ + 4` टोकन का बिल लगाता है (28 px पैच — शून्य अवशिष्ट तक मापा गया)। एक पूरा पेज 1,460 टोकन में 28,080 अक्षर वहन करता है ≈ **19 अक्षर/टोकन**, जबकि सघन टेक्स्ट के लिए यह ~2 अक्षर/टोकन है। गेट केवल तभी परिवर्तित करता है जब गणित पक्ष में हो।
- **क्या परिवर्तित होता है**: स्थिर सिस्टम प्रॉम्प्ट + टूल दस्तावेज़, पुराना संकुचित इतिहास, बड़े टूल आउटपुट।
- **क्या कभी परिवर्तित नहीं होता**: आपके संदेश, हाल के टर्न, मॉडल का आउटपुट, विरल गद्य, बाइट-सटीक मान (हैश/आईडी टेक्स्ट के साथ साथ चलते हैं), और कोई भी मॉडल जो पठन बेंचमार्क में विफल रहा।

# 🧭 The honest part

- **यह हानिपूर्ण (lossy) है।** छवियों से बाइट-सटीक स्मरण स्वभाव से अविश्वसनीय है। लागू शमन: सटीक पहचानकर्ता छवि के साथ टेक्स्ट के रूप में यात्रा करते हैं, और मापा गया प्रोडक्शन कॉन्फ़िगरेशन **शून्य मौन मनगढ़ंत उत्तर** देता है — असफल पठन परहेज़ करते हैं।
- **आज केवल Fable 5 अनुमोदित है**, रसीदों सहित। GPT-5.5 और Gemini 2.5-flash मापने योग्य रूप से सघन रेंडर नहीं पढ़ सकते; Opus 4.8 को 4× बड़े ग्लिफ़ चाहिए। गेट इसे लागू करता है।
- **हमने एक बिलिंग जाल पाया और उससे बचा**: उच्च-रिज़ॉल्यूशन छवि स्तर प्रति पेज 3.3× अधिक बिल लगाता है, लेकिन विज़न एन्कोडर को अतिरिक्त रिज़ॉल्यूशन नहीं मिलता — बड़े पेज *बदतर* पढ़े जाते हैं। मापा गया, [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) में दस्तावेज़ीकृत, सक्षम नहीं है।
- कीमतें बदलती हैं; टिकाऊ मीट्रिक टोकन कटौती है, जिसे प्रॉक्सी एक मुफ़्त `count_tokens` काउंटरफ़ैक्चुअल के मुक़ाबले प्रति अनुरोध लॉग करता है।

# 🔬 हर आँकड़े को पुनरुत्पादित करें

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

पूरी पद्धति और हर परिणाम तालिका: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)। कच्ची प्रति-उत्तर रसीदें: `benchmarks/*/results/*.jsonl`।

# 🚀 OmniRoute परिवार

OmniGlyph एक **नेटिव संपीड़न इंजन** के रूप में [OmniRoute](https://github.com/diegosouzapw/OmniRoute) — मुफ़्त AI गेटवे — के अंदर भी शिप होता है। वहाँ यह `omniglyph` इंजन के रूप में चलता है (स्टैंडअलोन सिंगल मोड या अन्य इंजनों के साथ स्टैक किया हुआ), फेल-क्लोज़्ड गेट्स और छवि-जागरूक टोकन लेखांकन के साथ।

# 🛠️ Tech Stack

| परत | तकनीक |
|---|---|
| भाषा | TypeScript (strict), ESM |
| रनटाइम | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| रेंडरिंग | अपना 1-bit ग्लिफ़ एटलस (Spleen/Unifont-व्युत्पन्न, लाइसेंस `assets/` में) → PNG |
| परीक्षण | Vitest — TDD, साथ ही docs-integrity और rebrand गार्ड |
| बेंचमार्क | `benchmarks/` हार्नेस (billing-sweep, density-frontier) JSONL रसीदों के साथ |

## प्रोजेक्ट लेआउट

| पथ | क्या |
|---|---|
| `src/` | प्रॉक्सी: ट्रांसफ़ॉर्म पाइपलाइन, प्रति-प्रोवाइडर सटीक बिलिंग, रेंडरर, होस्ट (Node + Cloudflare Workers) |
| `benchmarks/` | वे हार्नेस जिन्होंने ऊपर दिया हर आँकड़ा तैयार किया — दोबारा चलाने योग्य |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 समर्थन और समुदाय

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — बग और फ़ीचर अनुरोध
- 🔒 [SECURITY.md](SECURITY.md) — भेद्यता रिपोर्ट
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — सख़्त TDD + दावों से पहले मापन
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 लाइसेंस

MIT — देखें [LICENSE](../../../LICENSE)।
