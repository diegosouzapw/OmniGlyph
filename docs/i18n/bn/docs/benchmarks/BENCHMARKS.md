# OmniGlyph — সংহত পরিমাপ (2026-07-05)

🌐 অনূদিত: [সব ভাষা](../../../README.md)

এই সেশনে যা কিছু MEASURED, সোর্স ও n সহ; হাইপোথিসিস শেষে স্পষ্টভাবে
আলাদা করা। রসিদ: `benchmarks/billing-sweep/results/` এবং
`benchmarks/density-frontier/results/` (প্রতি উত্তরে JSONL)।

## TL;DR — দুটি বারে সম্পূর্ণ ফলাফল

**খরচ** — একটি স্ট্যান্ডার্ড 1568×728 পৃষ্ঠা 28,080 chars ধরে ফ্ল্যাট
1,460 টোকেনে; একই টেক্সট raw পাঠালে ~10× বেশি খরচ হয়:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**অ্যাকুরেসি** — কিন্তু শুধু যেখানে মডেল আসলে পৃষ্ঠা পড়ে। গেটটি
fail-closed; শুধুমাত্র ✅ সারি শিপ করে:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

এই নথির বাকি অংশ সেই দুটি বারের পেছনের রসিদ।

## 1. Anthropic বিলিং (সরাসরি count_tokens, $0, 11টি জ্যামিতি × 2টি মডেল)

নিশ্চিত ফর্মুলা: প্রতি-টিয়ার রিসাইজের পর `tokens = ceil(w/28) × ceil(h/28)`,
**+3/ব্লক (Fable 5) / +4/ব্লক (Sonnet 4.5)** — সব সারি জুড়ে শূন্য
অবশিষ্টাংশ।

| প্রোব | মাত্রা | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc anchor | 1092×1092 | 1524 | 1525 |
| doc anchor | 1000×1000 | 1299 | 1300 |
| standard page | 1568×728 | 1459 | 1460 |
| **large page** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res ceiling | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res long edge | 2576×1204 | 3959 | 1516 |
| tall strip | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, NOT rejected in count_tokens) | 3585 |

উদ্ভূত সিদ্ধান্ত (বাস্তবায়িত): এক্সাক্ট প্রতি-প্যাচ গেট; প্রতি-মডেল টিয়ার
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312।

## 2. রিডিং অ্যাকুরেসি (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 ম্যাট্রিক্স — CLI/সাবস্ক্রিপশনের মাধ্যমে, প্রতি আর্মে n=30, একই কর্পাস (~16.6k chars)

| পৃষ্ঠা × অ্যাটলাস | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (ম্যাট্রিক্স দ্বারা পূর্বাভাসিত) |

→ **উভয় পৃষ্ঠায় 1-bit > AA; 120টি প্রশ্ন জুড়ে শূন্য কনফ্যাবুলেশন।**
প্রয়োগ করা হয়েছে: `DENSE_RENDER_STYLE` → `aa:false` (কমিট 9a25585)।
⚠️ high-res ট্রান্সপোর্ট রিস্যাম্পল দ্বারা অবনমিত হয়ে আসে (দেখুন H1/H3); 67%
একটি ফ্লোর, সিলিং নয়।

### Opus 4.8 — CLI/সাবস্ক্রিপশনের মাধ্যমে, প্রতি আর্মে n=30

| কনফিগ | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee আমাদের নিজস্ব n দিয়ে নিশ্চিত (আপস্ট্রিম n=20-এ 10×16-এ 95%
পরিমাপ করেছে)। "Opus সেফ মোড" কার্যকর: হার্নেস কর্পাসে বড় পৃষ্ঠায় 10×16
≈ প্রতি ইমেজ টোকেনে 1.7 chars।

### OpenRouter-এর মাধ্যমে (একই কর্পাস/প্রশ্ন) — পাঠযোগ্যতার জন্য অনিশ্চিত

| পরিমাপকৃত তথ্য | সংখ্যা |
|---|---|
| ট্রান্সক্রিপশন প্রশ্নে content_filter (standard পৃষ্ঠা) | 60/60 (100%) |
| high-res পৃষ্ঠায় content_filter | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (ক্রেডিট শেষ হওয়ার আগে) | 7/9 exact (78%) |
| confusability ম্যাট্রিক্স দ্বারা পূর্বাভাসিত misread | 4→a, 0→8, S/s case |

### ট্রান্সপোর্ট তুলনা (একই প্রশ্ন, একই কনটেন্ট)

| ট্রান্সপোর্ট | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, ক্রেডিট শেষ হওয়ার আগে) | 0 | not tested |
| OpenRouter | ~100% std / ~20% hi-res | no (সন্দেহ: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50% বড় ব্যাচ স্টল করেছে (10-এর চাংক + রিট্রাই দিয়ে সমাধান) | no (সন্দেহ: Read রিসাইজ করে) |

## 3. প্রতি প্রোভাইডার খরচ (অফলাইন, এক্সাক্ট — পূর্ণ পৃষ্ঠা, তাত্ত্বিক)

| প্রোভাইডার · পৃষ্ঠা | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (সব মডেল) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× কম ইমেজ) | billing measured; legibility pending (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) up to 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibility untested |
| gpt-4o-mini | 48,169/strip | — | **0.8 — NEVER imageify** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← সেরা নথিভুক্ত** | docs; legibility untested |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (যদি পাঠযোগ্য হয়)** | hypothesis H6 |

## 4. পাওয়া ও ঠিক করা বাগ (অফিসিয়াল ডকসের বিপরীতে অডিট)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini ডিফল্ট টাইল 85/170-এ পড়েছিল (আসল: 2833/5667) | খরচ ~33× আন্ডারএস্টিমেটেড — **উল্টানো গেট** | e6bc75f |
| D1 | o4-mini মাল্টিপ্লায়ার 1.62 (আসল 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) ক্যাপ 10000 সহ (আসল 1536, original ছাড়া) | বড় পৃষ্ঠার সাথে ভেঙে যেত | e6bc75f |
| D4 | tile রেজিমে gpt-5-codex-mini (আসল: patch 1536) | ≥+23% আন্ডারএস্টিমেটেড | e6bc75f |
| D5 | প্রতিটি মডেলের জন্য detail:'original' হার্ডকোডেড (শুধু 5.4+-এ বিদ্যমান) | contract-এর বাইরে | e6bc75f |
| #44 | typed টুলে description stub ইনজেক্ট করা হয়েছিল → 400 + নীরব ফলব্যাক | সংকেত ছাড়াই সাশ্রয় শূন্য | 0f66e32 |
| AA | "eval-only" কমেন্টের বিপরীতে প্রোডাকশনে AA অ্যাটলাস | Fable-এ −17pp রিডিং | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + অতিরিক্ত প্যাচ কলাম | 312-এ ফিক্সড | baseline |

## 5. খোলা হাইপোথিসিস (প্রতিটি বন্ধ করার খরচ)

| id | হাইপোথিসিস | বর্তমান প্রমাণ | নির্ণায়ক টেস্ট | খরচ |
|---|---|---|---|---|
| H1 | সরাসরি API-তে 1928² পৃষ্ঠা standard-এর সমান বা বেশি পড়ে (বিলিং-এ WYSIWYG প্রমাণিত) | resample ছাড়া বিলিং 4764; অবনমিত হলেও 1-bit ইতিমধ্যে 67% পড়ে | সরাসরি A/B std বনাম hi-res (1-bit) | ~US$4 API |
| H2 | সরাসরি API-তে hi-res + 1-bit ≈ 100%, 3.3× কম ইমেজসহ | H1 + 2×2 ম্যাট্রিক্স | H1-এর মতোই | same |
| H3 | CLI-র Read এবং OpenRouter >1568/2000px ছবি রিসাইজ করে | একই পৃষ্ঠায় 5×8 মরে যায় এবং 10×16 বেঁচে থাকে | প্রতি ট্রান্সপোর্টে 20×32 গ্লিফসহ একটি 1928² পৃষ্ঠা | ~US$0 (CLI) |
| H4 | Refusal ফ্রেমিং-এর ওপর নির্ভর করে (agent-reading-a-file ≈ 0% বনাম raw API ≈ 100%) | উপরের ট্রান্সপোর্ট তুলনা | real proxy path-এ wording A/B | low |
| H5 | Gemini tile 1533×1152 5×8-এ পাঠযোগ্য (42 chars/tok) | none | GEMINI_API_KEY সহ density-frontier | ~free (free tier) |
| H6 | media_resolution:low পাঠযোগ্য (116 chars/tok) | সম্ভাবনা কম (low-res encoder), কিন্তু কেউ মাপেনি | 1 call | ~free |
| H7 | GPT: strip legibility + completion-token inflation (PageWatch risk) | কমিউনিটি −40% prompt কিন্তু +completion/2× latency দেখেছে | OPENAI_API_KEY সহ density-frontier | ~US$2-5 |
| H8 | গ্লিফ সার্জারি (H~K, 0/8, 5/3…) abstention-কে read-এ রূপান্তর করে | 1-bit-এর পর, সব Fable miss abstention হয়ে গেছে | ~10টি বিটম্যাপ এডিট করুন + ম্যাট্রিক্স পুনরায় চালান | $0 (CLI) |
| H9 | লাইট থিম (black-on-white) > inverted | সাহিত্য (Glyph paper, Tesseract); কোনো commercial VLM-এ কখনো মাপা হয়নি | style flag + 2 arms | $0 (CLI) |
| H10 | 7×10-এ Opus 0% (5×8) এবং 87% (10×16)-এর মধ্যে পড়ে → ভালো ট্রেড-অফ | আপস্ট্রিম কার্ভ 7×10-এ 35% (n=20) | 1 extra arm | $0 (CLI) |
| H11 | প্রক্সিতে Retry-on-refusal ~50% ফিল্টার্ড ব্যাচ পুনরুদ্ধার করে | refusal প্রতি কলে স্টোকাস্টিক | প্রোডাকশনে বাস্তবায়ন + পরিমাপ | code |

## 6. অপারেশনাল পেন্ডিং আইটেম

1. `gh auth login` → প্রাইভেট `diegosouzapw/omniglyph` তৈরি করুন + পুশ (10টি লোকাল কমিট)।
2. Anthropic ক্রেডিট (H1/H2, জ্যামিতির রায়) এবং OpenRouter (শেষ)।
3. **চ্যাটে প্রকাশিত** Anthropic এবং OpenRouter **কী রোটেট করুন**।
4. কোড কিউ: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   surgery (H8), Phase 4 (স্ক্রিপ্টে TS, GIF, docs, dashboard v2), Phase 5
   (OmniRoute engine)।

## সংযোজন 2026-07-06 — সরাসরি API-এর মাধ্যমে A/B (165 কল): H1/H2 খণ্ডিত

| কনফিগ | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA এবং 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

রায়: high-res টিয়ারের 1928² পৃষ্ঠা WYSIWYG বিল করা হয় (4764 tok,
sweep) কিন্তু এনকোডার পূর্ণ রেজোলিউশন পায় না — 1-2/30 রিড, একক-গ্লিফ
সোয়াপ এররসহ (6→8, a→4), একটি অভ্যন্তরীণ resample-এর স্বাক্ষর। **বিলিং ≠
এনকোডার ইনপুট → ফাঁদ: 3.3× খরচ, খারাপ পাঠযোগ্যতা।** প্রয়োগ করা হয়েছে:
pageGeometryForTier() রিভার্ট করা হয়েছে — উভয় টিয়ারই 1568×728 রেন্ডার
করে; টিয়ার ইনফ্রা রাখা হয়েছে (এক্সাক্ট বিলিং এখনও বৈধ এবং ভবিষ্যতের
রিটিউন 1 লাইন)। H3 আপডেট করা হয়েছে: "transport resample" ছিল (এছাড়াও)
API-এর নিজস্ব এনকোডার। raw API-এর মাধ্যমে ট্রান্সক্রিপশনে refusal:
standard পৃষ্ঠায় 100% (H4 শক্তিশালী হয়েছে — শুধুমাত্র agent framing
এড়িয়ে যায়)। উভয় ট্রান্সপোর্টে Opus 10×16 নিশ্চিত (77-87%)।

## সংযোজন 2026-07-06 (2) — সরাসরি API-এর মাধ্যমে GPT-5.5 ব্যাটারি: H7 বন্ধ (ব্যর্থ)

| আর্ম | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 গ্লিফ পড়তে পারে না (0/60; এমনকি gist-ও টেকে না) এবং সেগুলো
বোঝার চেষ্টা করতে গিয়ে completion ~40× ফুলিয়ে ফেলে (প্রতি প্রশ্নে 2.4-2.7k
reasoning টোকেন) — prompt সাশ্রয় output দ্বারা গ্রাস হয়ে যায়। নিখুঁত টেক্সট
কন্ট্রোল প্রমাণ করে কর্পাস/প্রশ্ন যুক্তিসঙ্গত। 5.5 opt-in নিশ্চিত ও পরিমাপ করে;
gpt-5.6 (ডিফল্ট) এখনও টেস্ট করা যায়নি (অ্যাকাউন্টে অ্যাক্সেস নেই)। ভবিষ্যৎ
(H12): শুধু prompt টোকেন নয়, GPT গেটকে অবশ্যই output inflation মডেল করতে
হবে।

## সংযোজন 2026-07-06 (3) — Gemini 2.5-flash (আংশিক: ফ্রি-টিয়ার কোটা মাঝপথে শেষ)

কোটা মারা যাওয়ার আগে যে ~26টি ইমেজ উত্তর পাস হয়েছিল তার মধ্যে: **0টি সঠিক,
1টি abstention, ~25টি CONFABULATION** — এবং সেগুলো glyph confusion নয়: এগুলো
এলোমেলো সংখ্যা (`indexLedgerInd → 0040375615`), অর্থাৎ পরীক্ষিত ডেনসিটিতে
এনকোডার প্রায় কিছুই দেখে না (native tile 42 chars/tok এবং MEDIUM flat) এবং
2.5-flash abstain করার বদলে INVENT করে (ILEGIVEL নির্দেশনা উপেক্ষা করে)।
টেক্সট কন্ট্রোল: যেগুলো পাস হয়েছে তার মধ্যে 3/3। কোনো output inflation নেই
(6-28 tok/answer)।

প্রাথমিক সংকেত: H5/H6 2.5-flash-এ NO-এর দিকে ঝুঁকছে, GPT-এর চেয়ে **খারাপ**
একটি ব্যর্থতা মোডসহ (abstention-এর বদলে নীরব confabulation) — Gemini-র
প্রক্সিতে অতিরিক্ত সুরক্ষা দরকার হবে। বন্ধ করার জন্য পেন্ডিং: পেইড কোটা বা
অন্য দিন পুনরায় চালান, এবং gemini-2.5-pro টেস্ট করুন (flash পরিবারের সবচেয়ে
দুর্বল রিডার)। native-tile পৃষ্ঠায় এখনও সেরা নথিভুক্ত অনুপাত আছে (42.3
chars/token); সন্দেহ পাঠযোগ্যতায়।

খরচ নোট: আংশিক পৃষ্ঠা (কর্পাসের শেষটি) tile রেজিমে খারাপভাবে বিল করে
(কম উচ্চতা → ছোট crop unit → বেশি tile) — শেষ পৃষ্ঠাকে 1152px উচ্চতায়
প্যাডিং করা একটি বাধ্যতামূলক অপ্টিমাইজেশন যদি Gemini আসে।
