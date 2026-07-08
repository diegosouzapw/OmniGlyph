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

# 🖥️ डॅशबोर्ड

पॅकेजमध्ये एक संपूर्ण स्थानिक डॅशबोर्ड समाविष्ट आहे — ऑफलाइन, सिंगल-फाइल, शून्य बाह्य विनंत्या. विनंत्या येताना SSE द्वारे लाइव्ह अपडेट होणारी सहा पाने:

![आढावा: मिशन-कंट्रोल KPI कार्ड्स, बचत स्पार्कलाइन आणि लाइव्ह इव्हेंट फीड](../../assets/dashboard-overview.png)

- **Overview** — मिशन कंट्रोल: बचत %, $ बचत, लेटन्सी p95, कॅश हिट्स, एरर्स, लाइव्ह फीड.
- **Live Flow** — पाइपलाइन नोड ग्राफ म्हणून: client → gate → renderer / passthrough → API, प्रत्येक खऱ्या विनंतीसाठी एक पार्टिकल.
- **Telemetry** — एक टोकन/$ ओडोमीटर आणि लाइव्ह विनंती टाइमलाइन; कोणत्याही विनंतीवर क्लिक करून नेमके कोणते भाग प्रतिमांमध्ये रूपांतरित झाले ते पाहा आणि प्रत्येक पानामागील स्रोत मजकूर वाचा.
- **Benchmarks** — `benchmarks/*/results/` मधून रेंडर केलेल्या हार्नेस पावत्या, प्रत्येक मॉडेल·कॉन्फिग प्रयोगासाठी एक ओळ, आणि **UI मधून बेंचमार्क चालवा**: `$0` ड्राय-रन्स त्यांचे आउटपुट लाइव्ह स्ट्रीम करतात; लाइव्ह रन्स तुमच्या API key आणि स्पष्ट खर्च पुष्टीकरणाच्या मागे बंद (गेटेड) राहतात.
- **Sessions / History** — जतन केलेल्या टोकन्सनुसार सर्वोच्च सत्रे आणि डिस्कवरील प्रत्येक इव्हेंट.

| Live Flow | Benchmarks |
|---|---|
| ![विनंती पाइपलाइन लाइव्ह नोड ग्राफ म्हणून](../../assets/dashboard-flow.png) | ![बेंचमार्क पावत्या आणि इन-UI ड्राय-रन्स](../../assets/dashboard-benchmarks.png) |

![Telemetry: ओडोमीटर आणि लाइव्ह विनंती टाइमलाइन](../../assets/dashboard-telemetry.png)

# ⚙️ हे कसे काम करते

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **रूपांतरणापूर्वी बिलिंगची अचूक गणना केली जाते**: Anthropic प्रति प्रतिमा `⌈w/28⌉ × ⌈h/28⌉ + 4` टोकन्स आकारते (28 px पॅचेस — शून्य अवशेषापर्यंत मोजलेले). एक पूर्ण पान 1,460 टोकन्ससाठी 28,080 अक्षरे वाहून नेते ≈ **19 अक्षरे/टोकन**, तर घन मजकुरासाठी हे प्रमाण ~2 अक्षरे/टोकन आहे. गणित जिंकतेच तेव्हाच गेट रूपांतरण करतो.
- **काय रूपांतरित होते**: स्थिर सिस्टम प्रॉम्प्ट + टूल डॉक्स, जुना संकुचित इतिहास, मोठी टूल आउटपुट्स.
- **काय कधीच रूपांतरित होत नाही**: तुमचे संदेश, अलीकडील वळणे, मॉडेलचे आउटपुट, विरळ गद्य, बाइट-अचूक मूल्ये (हॅशेस/आयडी मजकुराच्या स्वरूपात सोबत राहतात), आणि वाचन बेंचमार्कमध्ये अपयशी ठरलेले कोणतेही मॉडेल.

# 📚 लायब्ररी वापर (प्रॉक्सीशिवाय)

प्रॉक्सी प्रत्येक विनंतीसाठी जे काही करतो, ते सर्व एक दस्तऐवजीकरण केलेले, इम्पोर्ट करण्यायोग्य API म्हणूनही उपलब्ध आहे:

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

`options.keepSharp(block)` ब्लॉक्सना मजकूर म्हणून पिन करतो; `options.emitRecoverable` प्रतिमारूपांतरित ब्लॉक्सचे मूळ मजकूर परत देतो. अचूक बिलिंग गणित पॅकेज रूटवरही जहाज होते (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — हेच [OmniRoute](https://github.com/diegosouzapw/OmniRoute) वापरतो. शुद्ध-JS रनटाइम (Node आणि edge/Workers). पूर्ण पृष्ठभाग: `src/core/index.ts`.

# 📤 ऑफलाइन एक्सपोर्ट — प्रॉक्सी नाही, Claude Code नाही

Claude Code वर नाही? कॉन्टेक्स्टला **लोकल** पातळीवर PNG पानांमध्ये रेंडर करा आणि Cursor, ChatGPT, किंवा प्रतिमा अपलोड स्वीकारणाऱ्या कोणत्याही चॅटमध्ये पेस्ट करा. प्रॉक्सी नाही, API key नाही, जोडलेले कोणतेही खाते नाही:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

चॅटमध्ये टाकण्यासाठी सर्व काही असलेले एकच फोल्डर तुम्हाला मिळते:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` तुमचा अनकमिटेड diff रेंडर करते, `--diff <ref>` एक कमिट रेंज, `--open` फोल्डर उघडून दाखवते (macOS). हे सर्व तुमच्या मशीनवर चालते — एक्सपोर्ट मार्ग कधीच प्रॉक्सी सुरू करत नाही आणि कधीच मॉडेलला कॉल करत नाही. प्रत्येक फ्लॅगसाठी `omniglyph export --help` चालवा.

# 🧭 The honest part

- **हे नुकसानकारी (lossy) आहे.** प्रतिमांमधून बाइट-अचूक स्मरण स्वभावतः अविश्वसनीय आहे. जहाज केलेले उपाय: अचूक ओळखकर्ते प्रतिमेजवळ मजकूर म्हणून प्रवास करतात, आणि मोजलेल्या उत्पादन कॉन्फिगने **शून्य मूक गोंधळ** निर्माण केले — अयशस्वी वाचने थांबतात.
- **आज फक्त Fable 5 मान्यताप्राप्त आहे**, पावत्यांसह. GPT-5.5 आणि Gemini 2.5-flash मोजमापाने घन रेंडर वाचू शकत नाहीत; Opus 4.8 ला 4× मोठे ग्लिफ हवे आहेत. गेट हे सक्तीने लागू करते.
- **आम्हाला एक बिलिंग सापळा सापडला व टाळला**: उच्च-रिझोल्यूशन इमेज टियर प्रति पान 3.3× जास्त शुल्क आकारतो, पण व्हिजन एन्कोडरला अतिरिक्त रिझोल्यूशन मिळत नाही — मोठी पाने *वाईट* वाचली जातात. मोजलेले, [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) मध्ये दस्तऐवजीकरण केलेले, सक्रिय केलेले नाही.
- किमती बदलतात; टिकाऊ मेट्रिक टोकन घट आहे, जी प्रॉक्सी प्रत्येक विनंतीसाठी मोफत `count_tokens` काउंटरफॅक्च्युअलच्या तुलनेत नोंदवतो.

# 🧠 वारंवार विचारले जाणारे प्रश्न (FAQ)

**59–70% ही एंड-टू-एंड आहे, की फक्त ज्या विनंत्यांना स्पर्श केला त्यावरच?**
एंड-टू-एंड — संपूर्ण बिल. बहुतांश कंप्रेशन साधने फक्त त्यांनी स्पर्श केलेल्या भागावरच बचत नोंदवतात, ज्यामुळे आकडा चांगला दिसतो. आमचा भाजक (denominator) *प्रत्येक* विनंती आहे: गेटने योग्यरित्या स्पर्श न केलेल्या छोट्या विनंत्या, सर्व कॅश लेखन आणि वाचन, आणि सर्व आउटपुट टोकन्स (जे प्रॉक्सी कधीच संकुचित करत नाही). फक्त-संकुचित आकडा जास्त येतो आणि तो वेगळा नोंदवला जातो, कधीच मुख्य आकडा म्हणून नाही.

**बचत कशी मोजली जाते?**
एकाच विनंतीच्या दोन्ही बाजू, एकाच क्षणी. प्रत्येक `/v1/messages` POST साठी प्रॉक्सी मूळ असंकुचित बॉडीवर (काउंटरफॅक्च्युअल) एक मोफत `count_tokens` प्रोब खऱ्या फॉरवर्डसोबत समांतर पाठवतो, आणि प्रतिसादावरून प्रदात्याने प्रत्यक्ष बिल केलेला usage ब्लॉक वाचतो — दोन्ही एकाच इव्हेंट रांगेत उतरतात. कॅश किंमत दोन्ही बाजूंना सारखीच लागू केली जाते, त्यामुळे कॅशिंग सवलत रद्द होते आणि तिला "बचत" म्हणून दुहेरी मोजले जाऊ शकत नाही. सूत्र `src/core/baseline.ts` मध्ये आहे; तुमच्या स्वतःच्या इव्हेंट्स लॉगवरून ते पुन्हा काढा.

**चूक ही वाचन-त्रुटी न ठरता गोंधळ (confabulation) का ठरते?**
कारण मॉडेल व्हिजन ही OCR नाही: पान पॅच एम्बेडिंग्जमध्ये रूपांतरित होते, कधीच वेगळ्या अक्षरांमध्ये नाही, त्यामुळे मोठ्याने अपयशी होण्यासाठी प्रति-ग्लिफ आत्मविश्वास (confidence) नसतोच — जेव्हा पिक्सेल्स एखादा ग्लिफ अपुरेपणे ठरवतात, तेव्हा भाषेचा पूर्वग्रह (language prior) ती जागा एखाद्या प्रशंसनीय गोष्टीने भरतो. हीच यंत्रणा नेमकी का OmniGlyph याबाबत फेल-क्लोज्ड आहे: बाइट-अचूक मूल्ये नेहमी प्रतिमेजवळ मजकूर म्हणून प्रवास करतात, चुकीचे वाचणारी मॉडेल्स गेटद्वारे अडवली जातात, आणि मोजलेल्या उत्पादन कॉन्फिगने ~300 वाचन प्रोब्जमध्ये **शून्य** मूक गोंधळ निर्माण केले — अयशस्वी वाचने थांबतात.

**बाइट-अचूक काम (हॅशेस, आयडी, सिक्रेट्स) यांचे काय?**
अलीकडील वळणे आणि अचूक ओळखकर्ते डिझाइननुसार मजकूर म्हणूनच राहतात. जे वर्कलोड्स *पूर्णपणे* बाइट-अचूक आहेत, त्यांना allowlist नसलेल्या मॉडेलकडे वळवा (उदा. दुसऱ्या Claude मॉडेलवरील सबएजंट) — allowlist च्या बाहेरचे काहीही बाइट-समान, अस्पर्शित राहून जाते.

**DeepSeek-OCR ने हे काम करते की नाही हे आधीच सिद्ध केले नाही का?**
त्याने *चॅनेल* काम करतो हे सिद्ध केले — त्या कामासाठी प्रशिक्षित एन्कोडर/डिकोडर जोडीसह. साशंकता त्या काळापासून आहे जेव्हा कोणतेही स्टॉक उत्पादन मॉडेल घन रेंडर वाचू शकत नव्हते; ती परिस्थिती बदलली, आणि वरील [मॉडेल स्कोअरकार्ड](../../../README.md#-the-numbers--measured-not-estimated) आज नेमके कोण ती वाचू शकते हे पावत्यांसह दाखवते. [बेंचमार्क हार्नेस](../../../benchmarks/README.md) एका कमांडमध्ये कोणत्याही नव्या मॉडेलची पुन्हा चाचणी करतो — गेट प्रचारामागे नाही, डेटामागे जातो.

**मी हे Claude Code शिवाय वापरू शकतो का — Cursor, ChatGPT, एक साधा पाइप?**
होय, दोन प्रकारे. **प्रॉक्सी** म्हणून, तो अशा कोणत्याही क्लायंटसोबत काम करतो जो तुम्हाला API base URL सेट करू देतो (`ANTHROPIC_BASE_URL`, किंवा OpenAI base URL) — Claude Code, तुमच्या स्वतःच्या स्क्रिप्ट्स, कोणतेही HTTP. आणि जी साधने प्रॉक्सी करू शकत नाहीत, त्यांच्यासाठी वरील **ऑफलाइन एक्सपोर्ट** कॉन्टेक्स्टला PNG पानांमध्ये रेंडर करते जी तुम्ही हाताने पेस्ट करता — `omniglyph export --stdin` तर थेट Unix पाइपमधूनही वाचतो.

**तो प्रत्यक्षात मजकुराचे प्रतिमेत रूपांतर कसे करतो?**
तो मजकूर पुन्हा प्रवाहित (reflow) करतो आणि 1-बिट 5×8 पिक्सेल ग्लिफ अॅटलासने घन 1568×728 PNG पानांवर रंगवतो — प्रति पिक्सेल एक बिट, अँटी-अलायझिंग नाही, त्यामुळे मॉडेल पानाला त्याच्या परिमाणांनुसार बिल करते, आत किती अक्षरे आहेत यानुसार नाही. वरील **हे कसे काम करते** मध्ये पाइपलाइन आहे; बेंचमार्क दस्तऐवजात भूमिती आहे आणि घनदाट असणे नेहमीच स्वस्त का नसते हेही आहे.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 आभार

OmniGlyph एका विशिष्ट प्रकल्पाच्या खांद्यावर उभा आहे — हा विभाग आमचे कायमस्वरूपी आभारप्रदर्शन आहे.

| प्रकल्प | OmniGlyph ला कसे आकार दिले |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **या संपूर्ण प्रकल्पाचा पाया असलेला शोध.** pxpipe ने पावत्यांसह सिद्ध केले की उत्पादन LLM चा व्हिजन चॅनेल टोकन खर्चाच्या एका अंशात घन मजकूर संदर्भ वाहून नेऊ शकतो — आणि हे रूपांतरण प्रति-विनंती अचूक बिलिंग गणिताने ठरवले पाहिजे, कधीच अंदाजाने नाही. घन 1-बिट रेंडरिंग, नफा गेट, `count_tokens` काउंटरफॅक्च्युअल, फेल-क्लोज्ड मॉडेल allowlist, आणि "दावा करण्याआधी मोजा" ही दस्तऐवजीकरण संस्कृती — या सर्वांचा पायंडा तिथेच पडला. OmniGlyph थेट त्याच कोडबेसमधून उतरला आहे (MIT — मूळ कॉपीराइट ओळ आमच्या [LICENSE](../../../LICENSE) मध्ये कायम आहे). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | आमचा घन 1-बिट ग्लिफ अॅटलास ज्या 5×8 बिटमॅप फॉन्ट कुटुंबातून व्युत्पन्न झाला आहे (परवाना `assets/` मध्ये). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | त्याच अॅटलासमध्ये Spleen च्या व्याप्तीबाहेरील ग्लिफ्ससाठी कव्हरेज (परवाना `assets/` मध्ये). |

जर तुम्हाला OmniGlyph उपयुक्त वाटला, तर मूळ प्रकल्पालाही स्टार द्या — शोध त्यांचाच होता. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 परवाना

MIT — पहा [LICENSE](../../../LICENSE).
