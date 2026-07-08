# বেঞ্চমার্ক

OmniGlyph যে প্রতিটি সংখ্যার দাবি করে তা নিচের দুটি হার্নেসের একটি থেকে আসে —
পুনরায় চালানো যায়, যতটা সম্ভব ডিটারমিনিস্টিক, `*/results/*.jsonl`-এ কাঁচা
প্রতি-উত্তর রসিদসহ। সংহত বিশ্লেষণ: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)।

## 1. `billing-sweep/` — একটি ইমেজের প্রকৃত খরচ কত?

লাইভ Anthropic API-এর বিরুদ্ধে ফ্রি `count_tokens` প্রোব, 2টি মডেল × 2টি
রেজোলিউশন টিয়ার জুড়ে 11টি প্রোব জ্যামিতিতে অবসৃত `w·h/750` ফর্মুলা বনাম
বর্তমান 28 px-প্যাচ মডেলের তুলনা।

**ফলাফল (2026-07-05): প্যাচ মডেল প্রতিটি প্রোবে শূন্য অবশিষ্টাংশে ফিট করে**
— বিল করা হয় = টিয়ার রিসাইজের পর `⌈w/28⌉ × ⌈h/28⌉`, প্লাস প্রতি ইমেজ ব্লকে
একটি নির্দিষ্ট +3/+4 টোকেন। প্রোডাকশন পৃষ্ঠা (1568×728) ঠিক 1,460 টোকেন
খরচ করে এবং 28,080 chars বহন করে ≈ **19.2 chars/token** বনাম ঘন টেক্সট
হিসেবে ~2 chars/token।

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/` — মডেল কি এটি আসলে পড়তে পারে?

রেন্ডার কনফিগ, পৃষ্ঠা জ্যামিতি, গ্লিফ অ্যাটলাস এবং প্রোভাইডার জুড়ে খরচ
(অফলাইন, এক্সাক্ট) × রিড-অ্যাকুরেসি (লাইভ)। কর্পাসটি এক্সাক্ট-স্ট্রিং
needles রোপণ করে (hex id, camelCase, digit run) প্লাস **পরিমাপকৃত
glyph-confusability জোড়া থেকে তৈরি near-miss distractor** — যাতে নীরব
confabulation শুধু ভুল গোনা নয়, সনাক্ত করা হয়। স্কোরিং ডিটারমিনিস্টিক
(কোনো LLM-judge নেই): `correct` / `abstained` (সৎ `ILEGIVEL`) /
`silent_wrong` / `no_answer`।

**হেডলাইন ফলাফল** (প্রতি আর্মে n=30):

| আর্ম | exact reads | নোট |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas (production) | **30/30** | শূন্য error, শূন্য confabulation |
| Fable 5 · standard page · AA atlas (old default) | 25/30 | 5টি সৎ abstention — কেন প্রোডাকশন 1-bit-এ পরিবর্তিত হয়েছে |
| Fable 5 · high-res 1928² page | 1–2/30 | 3.3× বিল করা হয়েছে কিন্তু encoder-resampled — বিলিং ফাঁদ, সক্রিয় করা হয়নি |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | opt-in সেফ মোড |
| GPT-5.5 · 768px strip (both atlases) | 0/60 | + নিজস্ব টেক্সট কন্ট্রোলের (30/30, 62 tok) তুলনায় ~40× output-token inflation |
| Gemini 2.5-flash (partial, quota) | 0/26 | abstain করার বদলে confabulate করে |

তিনটি ট্রান্সপোর্ট: সরাসরি API (`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`),
OpenRouter (`OPENROUTER_API_KEY`), এবং `--via-cli` (একটি Claude Code
সাবস্ক্রিপশন — $0)। কঠিনভাবে শেখা সতর্কতা: ইন্টারমিডিয়ারি (OpenRouter,
CLI Read টুল) বড় ছবি রিস্যাম্পল করে; শুধুমাত্র সরাসরি-API ফলাফল
পাঠযোগ্যতার জন্য কর্তৃত্বপূর্ণ।

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

খাঁটি অংশগুলো পিন করা ইউনিট টেস্ট (কর্পাস, স্কোরিং, কস্ট ফর্মুলা):
`tests/billing-sweep-formulas.test.ts`, `tests/density-frontier.test.ts`,
`tests/anthropic-vision.test.ts`, `tests/gemini-profiles.test.ts`,
`tests/gpt-billing-audit.test.ts`।
