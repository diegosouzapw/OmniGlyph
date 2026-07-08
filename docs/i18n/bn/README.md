🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — কনটেক্সট ছবি হিসেবে

### বাল্কি কনটেক্সটকে ঘন PNG পৃষ্ঠায় রেন্ডার করে আপনার Claude বিল **59–70%** কমিয়ে দিন — একই কনটেন্ট, অনেক কম টোকেনে।

**মডেলগুলো টেক্সটের জন্য প্রতি টোকেনে বিল করে, কিন্তু একটি ছবির জন্য বিল করে তার মাত্রা অনুযায়ী — তার ভেতরে কতটা টেক্সট আছে তার ওপর নির্ভর করে নয়।**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) পরিবারের অংশ · [🌐 All languages](../../../docs/i18n/README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| মেট্রিক | ফলাফল | রসিদ |
|---|---|---|
| এন্ড-টু-এন্ড বিল হ্রাস | **59–70%** | প্রোডাকশন ট্রেস, 13,709 রিকোয়েস্ট |
| প্রতি রূপান্তরিত ব্লকে টোকেন | **10× কম** (28,080 chars: 14,040 → 1,460 টোকেন) | [billing sweep](benchmarks/billing-sweep/README.md) |
| বিলিং-ফর্মুলার নির্ভুলতা | 22টি `count_tokens` প্রোব, 2টি মডেল × 2টি টিয়ার জুড়ে অবশিষ্ট **শূন্য** | `benchmarks/billing-sweep/results/` |
| প্রোডাকশন কনফিগে এক্সাক্ট-রিড নির্ভুলতা | Claude Fable 5-এ **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300টি রিড প্রোবে নীরব কনফ্যাবুলেশন | **0** — প্রতিটি মিস `ILEGIVEL` হিসেবে বিরত থাকে | `benchmarks/density-frontier/results/` |

**মডেল স্কোরকার্ড** (ঘন রেন্ডার পড়তে পারে কি? প্রতি আর্মে n=30, ডিটারমিনিস্টিক স্কোরিং):

| মডেল | রিডিং | রায় |
|---|---|---|
| Claude **Fable 5** | **100%** এক্সাক্ট | ✅ প্রোডাকশন টার্গেট |
| Claude Opus 4.8 | 4× গ্লিফ সাইজে 77–87% | ⚠️ অপ্ট-ইন সেফ মোড (সাশ্রয় নেমে ~2× হয়) |
| GPT-5.5 | 0/60 — এবং চেষ্টা করতে গিয়ে উত্তর ~40× ফুলিয়ে ফেলে | ❌ গেট দ্বারা ব্লকড, প্রমাণসহ |
| Gemini 2.5-flash | 0/26 — এবং বিরত থাকার বদলে কনফ্যাবুলেট করে | ❌ ব্লকড (আংশিক টেস্ট) |

সুবিধাটি আজ **Fable-নির্দিষ্ট** — অন্যান্য ভিশন এনকোডাররা এখনও ঘন গ্লিফ রেজল্ভ করতে পারে না। [বেঞ্চমার্ক হার্নেস](benchmarks/README.md) এক কমান্ডে যেকোনো নতুন মডেল পুনরায় টেস্ট করে।

# 🤔 কেন OmniGlyph?

প্রতিটি দীর্ঘকালীন এজেন্ট সেশন প্রতিটি রিকোয়েস্টে একই মৃত ওজন টেনে নিয়ে যায়: সিস্টেম প্রম্পট, টুল ডক্স, এবং পুরনো ইতিহাস — প্রতি টার্নে, প্রতি টোকেনে পুনরায় বিল করা হয়। OmniGlyph একটি **লোকাল প্রক্সি** যা সেই বাল্কি অংশগুলোকে *আপনার মেশিন থেকে বেরিয়ে যাওয়ার আগেই* ঘন PNG পৃষ্ঠায় পুনর্লিখন করে:

- **হিউরিস্টিক নয়, এক্সাক্ট বিলিং গণিত** — এটি প্রোভাইডারের প্রকৃত ইমেজ-টোকেন ফর্মুলা গণনা করে (শূন্য অবশিষ্টাংশে মাপা) এবং কেবল তখনই রূপান্তর করে যখন গণিত পক্ষে থাকে।
- **ডিজাইন অনুযায়ী ফেইল-ক্লোজড** — যেসব মডেল ঘন রেন্ডার পড়তে পারে না সেগুলো বেঞ্চমার্ক রসিদসহ একটি গেট দ্বারা ব্লক করা হয়। কোনো নীরব গুণমান হ্রাস নেই।
- **প্রাইভেট ও লোকাল-ফার্স্ট** — পুনর্লিখন `127.0.0.1`-এ ঘটে; অতিরিক্ত কিছু কোথাও পাঠানো হয় না।
- **রিপ্রোডিউসিবল** — উপরের প্রতিটি সংখ্যার `benchmarks/*/results/`-এ একটি রসিদ আছে, এক কমান্ডে পুনরায় চালানো যায়।

# ⚡ দ্রুত শুরু

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

দুইভাবেই কাজ করে:
- **API কী** (প্রতি টোকেন পে): আপনার বিল এন্ড-টু-এন্ড 59–70% কমে যায়।
- **সাবস্ক্রিপশন সেশন**: আপনি কম টাকা দেন না, কিন্তু ব্যবহারের সীমা টোকেনে গোনা হয় — তাই আপনার সীমা **~2–3×** প্রসারিত হয়।

<http://127.0.0.1:47821/>-এ ড্যাশবোর্ড: সাশ্রিত টোকেন, প্রতিটি টেক্সট→ইমেজ রূপান্তর পাশাপাশি, কিল সুইচ, লাইভ মডেল চিপ। রেসপন্স স্বাভাবিকভাবে স্ট্রিম হয় — শুধুমাত্র *রিকোয়েস্ট* কম্প্রেস করা হয়, মডেলের আউটপুট কখনো নয়।

# ⚙️ এটি কীভাবে কাজ করে

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **রূপান্তরের আগে বিলিং সঠিকভাবে গণনা করা হয়**: Anthropic প্রতি ছবিতে `⌈w/28⌉ × ⌈h/28⌉ + 4` টোকেন বিল করে (28 px প্যাচ — শূন্য অবশিষ্টাংশে মাপা)। একটি পূর্ণ পৃষ্ঠা 1,460 টোকেনের জন্য 28,080 chars বহন করে ≈ **19 chars/token**, বনাম ঘন টেক্সটের জন্য ~2 chars/token। গেট কেবল তখনই রূপান্তর করে যখন গণিত পক্ষে থাকে।
- **যা রূপান্তরিত হয়**: স্ট্যাটিক সিস্টেম প্রম্পট + টুল ডক্স, পুরনো সংকুচিত ইতিহাস, বড় টুল আউটপুট।
- **যা কখনো রূপান্তরিত হয় না**: আপনার বার্তা, সাম্প্রতিক টার্ন, মডেলের আউটপুট, বিরল প্রোজ, বাইট-এক্সাক্ট মান (হ্যাশ/আইডি টেক্সট হিসেবে পাশাপাশি চলে), এবং যেকোনো মডেল যা রিডিং বেঞ্চমার্কে ব্যর্থ হয়েছে।

# 📚 লাইব্রেরি ব্যবহার (প্রক্সি ছাড়া)

প্রক্সি প্রতিটি রিকোয়েস্টে যা কিছু করে তার সবকিছুই একটি নথিভুক্ত, ইম্পোর্টযোগ্য API হিসেবেও পাওয়া যায়:

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

`options.keepSharp(block)` ব্লকগুলোকে টেক্সট হিসেবে পিন করে রাখে; `options.emitRecoverable` ইমেজ করা ব্লকগুলোর মূল সংস্করণ ফেরত দেয়। এক্সাক্ট বিলিং গণিতও প্যাকেজ রুটে পাওয়া যায় (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — এটিই [OmniRoute](https://github.com/diegosouzapw/OmniRoute) ব্যবহার করে। বিশুদ্ধ-JS রানটাইম (Node এবং edge/Workers)। সম্পূর্ণ সারফেস: `src/core/index.ts`।

# 🧭 The honest part

- **এটি লসি।** ছবি থেকে বাইট-এক্সাক্ট রিকল স্বভাবতই অনির্ভরযোগ্য। প্রশমন ব্যবস্থা চালু আছে: এক্সাক্ট আইডেন্টিফায়ার ছবির পাশে টেক্সট হিসেবে চলে, এবং মাপা প্রোডাকশন কনফিগে **শূন্য নীরব কনফ্যাবুলেশন** হয়েছে — ব্যর্থ রিড বিরত থাকে।
- **আজ শুধুমাত্র Fable 5 অনুমোদিত**, রসিদসহ। GPT-5.5 এবং Gemini 2.5-flash পরিমাপযোগ্যভাবে ঘন রেন্ডার পড়তে পারে না; Opus 4.8-এর 4× বড় গ্লিফ দরকার। গেট এটি প্রয়োগ করে।
- **আমরা একটি বিলিং ফাঁদ খুঁজে পেয়েছি এবং এড়িয়ে গেছি**: হাই-রেজোলিউশন ইমেজ টিয়ার প্রতি পৃষ্ঠায় 3.3× বেশি বিল করে, কিন্তু ভিশন এনকোডার অতিরিক্ত রেজোলিউশন পায় না — বড় পৃষ্ঠা *খারাপভাবে* পড়া যায়। [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)-এ মাপা ও নথিভুক্ত, সক্রিয় করা হয়নি।
- দাম পরিবর্তিত হয়; স্থায়ী মেট্রিক হলো টোকেন হ্রাস, যা প্রক্সি প্রতিটি রিকোয়েস্টের জন্য একটি ফ্রি `count_tokens` কাউন্টারফ্যাকচুয়ালের বিপরীতে লগ করে।

# 🧠 প্রায়শই জিজ্ঞাসিত প্রশ্ন

**59–70% কি এন্ড-টু-এন্ড, নাকি শুধু যেসব রিকোয়েস্ট এটি স্পর্শ করেছে তার ওপর?**
এন্ড-টু-এন্ড — পুরো বিল। বেশিরভাগ কম্প্রেশন টুল শুধু তারা যে অংশ স্পর্শ করেছে তার ওপর সাশ্রয় রিপোর্ট করে, যা সংখ্যাটিকে ফুলিয়ে দেখায়। আমাদের ডিনোমিনেটর হলো *প্রতিটি* রিকোয়েস্ট: ছোট রিকোয়েস্টগুলো যেগুলো গেট সঠিকভাবে অস্পৃষ্ট রেখেছে, সব ক্যাশ রাইট ও রিড, এবং সব আউটপুট টোকেন (যা প্রক্সি কখনো কম্প্রেস করে না)। শুধু-কম্প্রেসড হিসাব বেশি দেখায় এবং তা আলাদাভাবে উল্লেখ করা হয়, কখনো হেডলাইন হিসেবে নয়।

**সাশ্রয় কীভাবে মাপা হয়?**
একই রিকোয়েস্টের দুই দিক, একই মুহূর্তে। প্রতিটি `/v1/messages` POST-এর জন্য প্রক্সি মূল অকম্প্রেসড বডির (কাউন্টারফ্যাকচুয়াল) ওপর একটি ফ্রি `count_tokens` প্রোব চালায় প্রকৃত ফরোয়ার্ডের সমান্তরালে, এবং রেসপন্স থেকে প্রোভাইডারের প্রকৃত-বিলড ইউসেজ ব্লক পড়ে — দুটোই একই ইভেন্ট রো-তে জমা হয়। ক্যাশ প্রাইসিং উভয় দিকেই সমানভাবে প্রয়োগ করা হয়, তাই ক্যাশিং ডিসকাউন্ট বাতিল হয়ে যায় এবং তাকে দ্বিতীয়বার "সাশ্রয়" হিসেবে গোনা যায় না। ফর্মুলাটি আছে `src/core/baseline.ts`-এ; নিজের ইভেন্টস লগ থেকে এটি পুনরায় বের করে নিতে পারেন।

**একটি মিস কেন রিড এরর না হয়ে কনফ্যাবুলেশন হয়?**
কারণ মডেল ভিশন OCR নয়: পৃষ্ঠাটি প্যাচ এমবেডিং হয়ে যায়, কখনো আলাদা আলাদা অক্ষর নয়, তাই কোনো প্রতি-গ্লিফ কনফিডেন্স নেই যার ওপর জোরালোভাবে ব্যর্থ হওয়া যায় — যখন পিক্সেল একটি গ্লিফকে অনির্ধারিত রাখে, তখন ভাষার প্রায়র সেই ফাঁক একটি প্রশংসনীয় কিছু দিয়ে পূরণ করে দেয়। এই কারণেই OmniGlyph এ বিষয়ে ফেইল-ক্লোজড: বাইট-এক্সাক্ট মান সবসময় ছবির পাশে টেক্সট হিসেবে চলে, যেসব মডেল ভুল পড়ে সেগুলো গেট দ্বারা ব্লক করা হয়, এবং মাপা প্রোডাকশন কনফিগ ~300টি রিড প্রোবে **শূন্য** নীরব কনফ্যাবুলেশন তৈরি করেছে — ব্যর্থ রিড বিরত থাকে।

**বাইট-এক্সাক্ট কাজের ক্ষেত্রে কী হয় (হ্যাশ, আইডি, সিক্রেট)?**
সাম্প্রতিক টার্ন এবং এক্সাক্ট আইডেন্টিফায়ার ডিজাইন অনুযায়ী টেক্সট হিসেবেই থাকে। যেসব ওয়ার্কলোড *সম্পূর্ণভাবে* বাইট-এক্সাক্ট, সেগুলোকে একটি নন-অ্যালাউলিস্টেড মডেলে রুট করুন (যেমন অন্য একটি Claude মডেলের ওপর একটি সাবএজেন্ট) — অ্যালাউলিস্টের বাইরের যেকোনো কিছু বাইট-আইডেন্টিক্যালভাবে, অস্পৃষ্ট অবস্থায় পাস হয়ে যায়।

**DeepSeek-OCR কি ইতিমধ্যে প্রমাণ করেনি যে এটি কাজ করে?**
এটি প্রমাণ করেছে যে *চ্যানেলটি* কাজ করে — এই কাজের জন্য প্রশিক্ষিত একটি এনকোডার/ডিকোডার জোড়া দিয়ে। সংশয়টি সেই সময় থেকে, যখন কোনো স্টক প্রোডাকশন মডেল ঘন রেন্ডার পড়তে পারত না; সেটি বদলে গেছে, এবং ওপরের [মডেল স্কোরকার্ড](../../../README.md#-the-numbers--measured-not-estimated) আজ ঠিক কারা এগুলো পড়তে পারে তা রসিদসহ দেখায়। [বেঞ্চমার্ক হার্নেস](../../../benchmarks/README.md) এক কমান্ডে যেকোনো নতুন মডেল পুনরায় টেস্ট করে — গেট হাইপ নয়, ডেটা অনুসরণ করে।

# 🔬 প্রতিটি সংখ্যা পুনরুৎপাদন করুন

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

সম্পূর্ণ পদ্ধতি ও প্রতিটি ফলাফল টেবিল: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)। কাঁচা প্রতি-উত্তর রসিদ: `benchmarks/*/results/*.jsonl`।

# 🚀 OmniRoute পরিবার

OmniGlyph [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-এর ভেতরেও একটি **নেটিভ কম্প্রেশন ইঞ্জিন** হিসেবে চালু হয় — বিনামূল্যের AI গেটওয়ে। সেখানে এটি `omniglyph` ইঞ্জিন হিসেবে চলে (স্ট্যান্ডঅ্যালোন সিঙ্গেল মোড বা অন্যান্য ইঞ্জিনের সাথে স্ট্যাকড), ফেইল-ক্লোজড গেট এবং ইমেজ-অ্যাওয়্যার টোকেন অ্যাকাউন্টিংসহ।

# 🛠️ টেক স্ট্যাক

| স্তর | প্রযুক্তি |
|---|---|
| ভাষা | TypeScript (strict), ESM |
| রানটাইম | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| রেন্ডারিং | নিজস্ব 1-bit গ্লিফ অ্যাটলাস (Spleen/Unifont-থেকে উদ্ভূত, লাইসেন্স `assets/`-এ) → PNG |
| টেস্ট | Vitest — TDD, প্লাস docs-integrity ও rebrand গার্ড |
| বেঞ্চমার্ক | JSONL রসিদসহ `benchmarks/` হার্নেস (billing-sweep, density-frontier) |

## প্রজেক্ট লেআউট

| পাথ | কী |
|---|---|
| `src/` | প্রক্সি: ট্রান্সফর্ম পাইপলাইন, প্রতি প্রোভাইডারে এক্সাক্ট বিলিং, রেন্ডারার, হোস্ট (Node + Cloudflare Workers) |
| `benchmarks/` | সেই হার্নেস যা উপরের প্রতিটি সংখ্যা তৈরি করেছে — পুনরায় চালানো যায় |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 সাপোর্ট ও কমিউনিটি

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — বাগ ও ফিচার রিকোয়েস্ট
- 🔒 [SECURITY.md](SECURITY.md) — দুর্বলতা রিপোর্ট
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — কঠোর TDD + দাবির আগে পরিমাপ
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

<!-- omniglyph:upstream-credits:start -->
# 🙏 কৃতজ্ঞতা স্বীকার

OmniGlyph একটি নির্দিষ্ট প্রজেক্টের কাঁধে দাঁড়িয়ে আছে — এই সেকশনটি আমাদের স্থায়ী ধন্যবাদজ্ঞাপন।

| প্রজেক্ট | OmniGlyph-কে কীভাবে গড়ে তুলেছে |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **যে আবিষ্কারের ওপর এই পুরো প্রজেক্টটি তৈরি।** pxpipe রসিদসহ প্রমাণ করেছে যে একটি প্রোডাকশন LLM-এর ভিশন চ্যানেল টোকেন খরচের একটি ভগ্নাংশে ঘন টেক্সচুয়াল কনটেক্সট বহন করতে পারে — এবং রূপান্তরটি অনুভূতি দিয়ে নয়, বরং প্রতি-রিকোয়েস্টে এক্সাক্ট বিলিং গণিত দিয়ে সিদ্ধান্ত নিতে হবে। ঘন 1-bit রেন্ডারিং, প্রফিটেবিলিটি গেট, `count_tokens` কাউন্টারফ্যাকচুয়াল, ফেইল-ক্লোজড মডেল অ্যালাউলিস্ট, এবং "দাবি করার আগে পরিমাপ করুন" ডকুমেন্টেশন সংস্কৃতি — সবকিছুরই সূচনা সেখানে। OmniGlyph সরাসরি সেই কোডবেস থেকে উদ্ভূত (MIT — মূল কপিরাইট লাইন আমাদের [LICENSE](../../../LICENSE)-এ থেকে যায়)। |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 5×8 বিটম্যাপ ফন্ট পরিবার, যা থেকে আমাদের ঘন 1-bit গ্লিফ অ্যাটলাস উদ্ভূত (লাইসেন্স `assets/`-এ)। |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Spleen-এর পরিসীমার বাইরের গ্লিফগুলোর জন্য কভারেজ, একই অ্যাটলাসে (লাইসেন্স `assets/`-এ)। |

যদি OmniGlyph আপনার কাজে লাগে, তাহলে upstream প্রজেক্টটিতেও স্টার দিন — আবিষ্কারটি তাদেরই। 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 লাইসেন্স

MIT — দেখুন [LICENSE](../../../LICENSE)।
