# density-frontier — প্রতি রেজোলিউশনে খরচ × অ্যাকুরেসি

🌐 অনূদিত: [সব ভাষা](../../../README.md)

হার্নেস যা টেক্সট→ইমেজ রেন্ডারের **খরচ এবং পাঠযোগ্যতার মধ্যে প্যারেটো
ফ্রন্টিয়ার** মাপে, প্রতি প্রোভাইডার (Anthropic / OpenAI / Gemini), পৃষ্ঠা
জ্যামিতি, গ্লিফ সেল, এবং অ্যাটলাস স্টাইল অনুযায়ী।

সস্তা (ঘনতর) পৃষ্ঠা প্রতি টোকেনে বেশি chars বহন করে কিন্তু শেষে পাঠযোগ্য
থাকা বন্ধ হয়ে যায়। একটি কনফিগ শুধুমাত্র তখনই শিপ করার অনুমতি পায় যখন
**উভয়ই** সত্য হয় — খরচ কম *এবং* মডেল এখনও নিখুঁতভাবে এটি পড়ে:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

প্রতিটি উত্তর ঠিক তিনটি ফলাফলের একটিতে স্কোর করা হয় — মাঝেরটিই সেই যা
গেটকে বিশ্বাসযোগ্য করে তোলে:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

একটিও 🔴 উৎপন্ন করা কনফিগ ডিসকোয়ালিফাই হয়ে যায়, যতই সস্তা হোক না কেন।

কেন্দ্রীয় অসামঞ্জস্য: বিলিং সুইপ (2026-07-05, `benchmarks/billing-sweep/`)
থেকে, **খরচ অফলাইনে ঠিক অনুমানযোগ্য** — Anthropic-এ 28 px প্যাচ +
4/ব্লক (`src/core/anthropic-vision.ts`), OpenAI-তে প্যাচ/টাইল প্রোফাইল
(`src/core/openai.ts`), Gemini-তে tiles/media_resolution (`gemini-cost.ts`)।
শুধুমাত্র **রিড অ্যাকুরেসির** জন্য API দরকার।

## ডিজাইন

- **কর্পাস** (`corpus.ts`): ঘন log/JSON-স্টাইল ফিলার + confusability
  ম্যাট্রিক্স অনুযায়ী ব্যর্থ হওয়া ক্লাস থেকে রোপণ করা needles (12-char hex,
  camelCase, digits 6/8/5/3) + পরিমাপকৃত confusable জোড়া থেকে তৈরি
  **near-miss distractor**। যদি মডেল distractor দিয়ে উত্তর দেয়, তাহলে
  বিভ্রান্তিটি *পূর্বাভাসিত* ছিল — সেটাই নীরব ব্যর্থতা মোড যা সনাক্ত করা
  হচ্ছে, শুধু ভুল গোনা নয়। ডিটারমিনিস্টিক (mulberry32)।
- **কনফিগ** (`configs.ts`): কিউরেটেড গ্রিড — standard 1568×728 পৃষ্ঠা বনাম
  high-res 1928×1928 (যে A/B প্রতি-টিয়ার জ্যামিতি নির্ধারণ করে), AA বনাম
  1-bit (dense-render দ্বন্দ্ব সমাধান করে), 7×10/10×16 সেল (Opus সেফ
  মোড), GPT strip, এবং দুটি Gemini বাজি (≤384² = 258 flat;
  `media_resolution: low` = 280 fixed → ~116 chars/token *যদি* পাঠযোগ্য
  হয়)।
- **স্কোর** (`score.ts`): ডিটারমিনিস্টিক exact match, কোনো LLM-judge নেই।
  তিনটি ফলাফল: `correct` / `abstained` (ILEGIVEL সেন্টিনেল — সৎ
  ব্যর্থতা) / `silent_wrong` (বিপজ্জনক মোড), একটি distractor ফ্ল্যাগসহ।

## চালানো

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

নির্দিষ্ট কনফিগ: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`।
উত্তরগুলো `results/*.jsonl`-এ যায় (প্রতি প্রশ্নে একটি লাইন, অডিটিংয়ের জন্য
কাঁচা উত্তরসহ)।

## গ্রহণযোগ্যতার মানদণ্ড (আপস্ট্রিম PR #35/#36 থেকে উত্তরাধিকারসূত্রে প্রাপ্ত)

একটি কনফিগ শুধুমাত্র তখনই প্রোডাকশন ডিফল্ট হয় যদি: **gist == টেক্সট
বেসলাইন** এবং **শূন্য silent wrong exact string** এবং **ধনাত্মক
সাশ্রয়**। প্রথম বাধ্যতামূলক রান হলো Fable-এ `anthropic-std-5x8-aa` বনাম
`anthropic-hires-5x8-aa` — hi-res টিয়ার সক্রিয় করার আগে বড় পৃষ্ঠার
পাঠযোগ্যতা স্পট-চেক।

## `--via-omniroute` — OmniRoute-এর মাধ্যমে e2e (P3: non-degradation প্রমাণ)

উপরের ট্রান্সপোর্টগুলো **হার্নেসে** টেক্সট→PNG রেন্ডার করে এবং ছবি পাঠায়।
`--via-omniroute` উল্টো করে, যা প্রোডাকশন পাথ: এটি **ঘন টেক্সট** একটি
চলমান OmniRoute ইনস্ট্যান্সে পাঠায়, **`omniglyph` ইঞ্জিনকে** পৃষ্ঠা
রেন্ডার করতে এবং Anthropic-এ ফরোয়ার্ড করতে দেয়, এবং রিড + সাশ্রয় পরিমাপ
করে। যদি রিডগুলো সরাসরি রুটের মতোই থাকে **এবং** OmniRoute কম্প্রেশন
রিপোর্ট করে, তাহলে প্রমাণিত হয় যে OmniRoute-এর render+forward পৃষ্ঠাগুলোকে
**অবনমিত করে না**।

পূর্বশর্ত (অপারেশনাল):

1. **OmniRoute চলমান** (`npm run dev`, ডিফল্ট `http://localhost:20128`)।
2. OmniRoute-এ একটি **বাস্তব কী**সহ কনফিগার করা **Anthropic প্রোভাইডার**
   (সরাসরি রুট — `providerTransport==='direct'` গেট শুধুমাত্র `anthropic`
   প্রোভাইডারের জন্য পাস হয়)।
3. OmniRoute-এর কম্প্রেশন কনফিগে **`omniglyph` ইঞ্জিন ENABLED**
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph` হেডার
   শুধুমাত্র ইঞ্জিন অন থাকলে ফায়ার হয়। (ইঞ্জিনটি `stable:false`/প্রিভিউ;
   স্পষ্টভাবে সক্রিয় করুন।)
4. `OMNIROUTE_API_KEY`-এ একটি **OmniRoute API কী** (যেটি ক্লায়েন্ট
   OmniRoute-এর বিরুদ্ধে অথেন্টিকেট করতে ব্যবহার করে, Anthropic-এরটি নয়)।

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

প্রতিটি উত্তর JSONL-এ `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
রেকর্ড করে (`X-OmniRoute-Compression` রেসপন্স হেডার থেকে); টেবিল সারি
দেখায় কতগুলো উত্তর কম্প্রেসড ফিরে এসেছে + মিডিয়ান সাশ্রয়। **P3 মানদণ্ড**:
সরাসরি রুটের মতো একই verbatim/gist হিট (non-degradation) **নন-নাল**
`omnirouteSavings`-সহ (একটি রেন্ডার হয়েছে তা প্রমাণ করে, raw-text রিড নয়)।
যদি `did NOT compress` দেখা যায়, তাহলে ইঞ্জিনটি OmniRoute-এ সক্রিয় নেই
(অথবা বডি fail-closed গেট পাস করেনি)।

খাঁটি অংশগুলোর জন্য টেস্ট: `tests/density-frontier.test.ts` (via-omniroute
ট্রান্সপোর্ট থেকে `buildOmnirouteRequest` এবং `parseCompressionSavings`
অন্তর্ভুক্ত)।
