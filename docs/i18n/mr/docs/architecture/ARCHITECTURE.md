# आर्किटेक्चर

कोडबेसचा एक-पानी नकाशा.

## विनंती पाइपलाइन

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

## बिलिंग (अचूक, मोजलेले)

| मॉड्युल | प्रदाता | मॉडेल |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px पॅचेस + 4/ब्लॉक, प्रति-टियर रिसाइझ कॅप्स; पान भूमिती (दोन्ही टियर स्टँडर्ड 1568×728 पान रेंडर करतात — उच्च-रिझोल्यूशन टियर हा बिलिंग सापळा आहे, पहा [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | प्रति-मॉडेल पॅच/टाइल रेजिम, प्रति-प्रोफाइल `detail`, strip भूमिती |
| `src/core/gemini-model-profiles.ts` | Google | टाइल सूत्र (`floor(min/1.5)` क्रॉप युनिट) + `media_resolution` फ्लॅट खर्च |

## रेंडरिंग

- `src/core/render.ts` — मजकूर → PNG बेक केलेल्या ग्लिफ अॅटलासद्वारे
  (Spleen 5×8 + Unifont fallback), `↵` newline sentinels सह reflow,
  उत्पादनात 1-बिट अॅटलास (Fable वर AA पेक्षा चांगले मोजलेले).
- `src/core/render-cache.ts` — निश्चयात्मक रेंडर्सचे LRU मेमोइझेशन
  (अन्यथा स्थिर slab + frozen history chunks प्रत्येक विनंतीवर पुन्हा-रेंडर
  होतात).
- `src/core/history.ts` — जुनी वळणे append-only frozen image chunks मध्ये
  संकुचित करतो जे byte-identical राहतात जेणेकरून prompt caching हिट होत राहते.
- `src/core/png.ts` — किमान निश्चयात्मक PNG एन्कोडर (native dependencies
  नाहीत).

## संरक्षण उपाय

- मॉडेल allowlist (`src/core/applicability.ts`): फक्त वाचन बेंचमार्क
  उत्तीर्ण झालेल्या मॉडेल्सना इमेज केले जाते; बाकी सर्व byte-identical
  पास होते.
- बाइट-अचूक मूल्ये (SHAs, ids) इमेजजवळ एका fact sheet मध्ये मजकूर म्हणून
  प्रवास करतात (`src/core/factsheet.ts`); `emitRecoverable` द्वारे
  recoverable मूळ.
- Native typed tools (`type !== 'custom'`) कधीच पुन्हा लिहिले जात नाहीत
  (400 गार्ड).

## बेंचमार्क्स आणि पावत्या

`benchmarks/` मध्ये README मधील प्रत्येक आकडा तयार करणारे दोन हार्नेस आहेत
— पहा [benchmarks/README.md](../../benchmarks/README.md).
