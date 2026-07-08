# আর্কিটেকচার

কোডবেসের এক-পৃষ্ঠার মানচিত্র।

## রিকোয়েস্ট পাইপলাইন

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

## বিলিং (এক্সাক্ট, পরিমাপকৃত)

| মডিউল | প্রোভাইডার | মডেল |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px প্যাচ + 4/ব্লক, প্রতি-টিয়ার রিসাইজ ক্যাপ; পৃষ্ঠা জ্যামিতি (উভয় টিয়ার স্ট্যান্ডার্ড 1568×728 পৃষ্ঠা রেন্ডার করে — হাই-রেজ টিয়ার একটি বিলিং ফাঁদ, দেখুন [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | প্রতি-মডেল প্যাচ/টাইল রেজিম, প্রোফাইল অনুযায়ী `detail`, স্ট্রিপ জ্যামিতি |
| `src/core/gemini-model-profiles.ts` | Google | টাইল ফর্মুলা (`floor(min/1.5)` ক্রপ ইউনিট) + `media_resolution` ফ্ল্যাট খরচ |

## রেন্ডারিং

- `src/core/render.ts` — বেকড গ্লিফ অ্যাটলাস (Spleen 5×8 + Unifont ফলব্যাক)-এর
  মাধ্যমে টেক্সট → PNG, `↵` নিউলাইন সেন্টিনেলসহ রিফ্লো, প্রোডাকশনে 1-bit
  অ্যাটলাস (Fable-এ AA-এর চেয়ে ভালো বলে পরিমাপকৃত)।
- `src/core/render-cache.ts` — ডিটারমিনিস্টিক রেন্ডারের LRU মেমোইজেশন
  (স্ট্যাটিক স্ল্যাব + ফ্রোজেন হিস্ট্রি চাংক অন্যথায় প্রতিটি রিকোয়েস্টে
  পুনরায় রেন্ডার হয়)।
- `src/core/history.ts` — পুরনো টার্নগুলোকে অ্যাপেন্ড-অনলি ফ্রোজেন ইমেজ
  চাংকে সংকুচিত করে যা বাইট-আইডেন্টিক থাকে যাতে প্রম্পট ক্যাশিং হিট করতে
  থাকে।
- `src/core/png.ts` — মিনিমাল ডিটারমিনিস্টিক PNG এনকোডার (কোনো নেটিভ
  ডিপেন্ডেন্সি নেই)।

## গার্ড রেল

- মডেল allowlist (`src/core/applicability.ts`): শুধুমাত্র যেসব মডেল রিডিং
  বেঞ্চমার্ক পাস করেছে সেগুলো ইমেজড হয়; বাকি সব বাইট-আইডেন্টিক পাস থ্রু হয়।
- বাইট-এক্সাক্ট মান (SHA, আইডি) ছবির পাশে একটি ফ্যাক্ট শিটে টেক্সট হিসেবে
  চলে (`src/core/factsheet.ts`); `emitRecoverable`-এর মাধ্যমে পুনরুদ্ধারযোগ্য
  অরিজিনাল।
- নেটিভ টাইপড টুল (`type !== 'custom'`) কখনো পুনর্লিখন করা হয় না (400 গার্ড)।

## বেঞ্চমার্ক ও রসিদ

`benchmarks/` দুটি হার্নেস ধারণ করে যা README-এর প্রতিটি সংখ্যা তৈরি করেছে
— দেখুন [benchmarks/README.md](../../benchmarks/README.md)।
