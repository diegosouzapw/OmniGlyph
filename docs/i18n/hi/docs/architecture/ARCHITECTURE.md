# आर्किटेक्चर

कोडबेस का वन-पेज मानचित्र।

## अनुरोध पाइपलाइन

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## बिलिंग (सटीक, मापा गया)

| मॉड्यूल | प्रोवाइडर | मॉडल |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px पैच + 4/ब्लॉक, प्रति-टियर रीसाइज़ कैप; पेज ज्यामिति (दोनों टियर स्टैंडर्ड 1568×728 पेज ही रेंडर करते हैं — हाई-रेस टियर एक बिलिंग जाल है, देखें [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | प्रति-मॉडल पैच/टाइल व्यवस्थाएँ, प्रोफ़ाइल के अनुसार `detail`, स्ट्रिप ज्यामिति |
| `src/core/gemini-model-profiles.ts` | Google | टाइल फ़ॉर्मूला (`floor(min/1.5)` क्रॉप यूनिट) + `media_resolution` फ़्लैट लागत |

## रेंडरिंग

- `src/core/render.ts` — बेक किए गए ग्लिफ़ एटलस (Spleen 5×8 + Unifont
  फ़ॉलबैक) के ज़रिए टेक्स्ट → PNG, `↵` न्यूलाइन सेंटिनल के साथ reflow,
  प्रोडक्शन में 1-bit एटलस (Fable पर AA से बेहतर मापा गया)।
- `src/core/render-cache.ts` — निर्धारक रेंडर का LRU मेमोइज़ेशन (अन्यथा
  स्थिर स्लैब + फ़्रोज़न इतिहास चंक हर अनुरोध पर फिर से रेंडर होते हैं)।
- `src/core/history.ts` — पुराने टर्न को append-only फ़्रोज़न छवि चंक में
  संकुचित करता है जो बाइट-समान बने रहते हैं ताकि प्रॉम्प्ट कैशिंग हिट होती
  रहे।
- `src/core/png.ts` — न्यूनतम निर्धारक PNG एन्कोडर (कोई नेटिव डिपेंडेंसी
  नहीं)।

## गार्ड रेल

- मॉडल अनुमति-सूची (`src/core/applicability.ts`): केवल वे मॉडल जिन्होंने
  पठन बेंचमार्क पास किया, उन्हें इमेज किया जाता है; बाक़ी सब बाइट-समान
  रूप से गुज़रते हैं।
- बाइट-सटीक मान (SHA, आईडी) छवि के साथ टेक्स्ट के रूप में एक फ़ैक्ट शीट
  में यात्रा करते हैं (`src/core/factsheet.ts`); `emitRecoverable` के
  ज़रिए पुनर्प्राप्ति योग्य मूल।
- नेटिव टाइप्ड टूल (`type !== 'custom'`) कभी फिर से नहीं लिखे जाते (400
  गार्ड)।

## बेंचमार्क और रसीदें

`benchmarks/` में वे दो हार्नेस हैं जिन्होंने README के हर आँकड़े को
तैयार किया — देखें [benchmarks/README.md](../../benchmarks/README.md)।
