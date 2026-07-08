# 基準測試

🌐 已翻譯:[所有語言](../../README.md)

OmniGlyph 宣稱的每一個數字都來自以下兩套測試套件之一——
可重新執行、盡可能保持確定性,並在 `*/results/*.jsonl` 中提供原始的
逐條回答憑證。彙整分析見:[docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)。

## 節省原理(一圖看懂)

服務商對**文字**是按 token 計費,但對**圖像**是按其尺寸計費——
與圖像內塞了多少文字無關。無論文字多麼密集,一張標準頁面的成本都是
固定的:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

同樣的內容脈絡,以兩種方式計費:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

圖像為何勝出——每個 token 承載的字元數:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyph 只有在精確數學計算顯示划算時,才會進行這項替換,且僅限於
已證實能讀懂頁面的模型。以下兩套測試套件分別驗證這兩個環節。

## 1. `billing-sweep/`——一張圖像實際上要花多少錢?

對 Anthropic 正式 API 執行免費的 `count_tokens` 探測,比較已淘汰的
`w·h/750` 公式與目前的 28 px 分塊模型,涵蓋 11 種探測幾何結構,
共 2 個模型 × 2 個解析度檔位。

**結果(2026-07-05):分塊模型在每一次探測中殘差均為零**——
帳單 = 依檔位縮放後的 `⌈w/28⌉ × ⌈h/28⌉`,再加上每個圖像區塊固定
+3/+4 token。生產環境頁面(1568×728)精確花費 1,460 token,
可承載 28,080 字元,約合 **19.2 字元/token**,而高密度文字約為
2 字元/token。

```
the page as the patch grid the API actually bills:

  ⌈1568 / 28⌉ = 56 patches wide
  ⌈ 728 / 28⌉ = 26 patches tall
  ───────────────────────────────
  56 × 26  = 1,456  + 4 per-block  =  1,460 tokens   (flat, WYSIWYG)
```

```bash
node benchmarks/billing-sweep/run.mjs --dry-run          # predictions only, $0
ANTHROPIC_API_KEY=... node benchmarks/billing-sweep/run.mjs   # live sweep, still $0 (count_tokens is free)
```

## 2. `density-frontier/`——模型真的能「讀懂」它嗎?

跨渲染配置、頁面幾何結構、字形圖集與服務商的成本(離線,精確)×
讀取準確率(即時)。語料中埋入了精確字串需求(十六進位 id、
camelCase、連續數字)以及**根據已測量的字形混淆配對建構的近似
干擾項**——這樣一來,靜默虛構就能被偵測到,而不只是被算作答錯。
評分是確定性的(無 LLM 裁判):`correct` / `abstained`(誠實的
`ILEGIVEL`) / `silent_wrong` / `no_answer`。

**主要結果**(每組 n=30):

| arm | exact reads | notes |
|---|---:|---|
| Fable 5 · standard page · 1-bit atlas(生產環境) | **30/30** | 零錯誤,零虛構 |
| Fable 5 · standard page · AA atlas(舊預設) | 25/30 | 5 次誠實棄權——這正是生產環境改用 1-bit 的原因 |
| Fable 5 · high-res 1928² page | 1–2/30 | 計費高出 3.3 倍但編碼器被重新取樣——計費陷阱,未啟用 |
| Opus 4.8 · 10×16 glyphs | 23–26/30 | 選擇性啟用的安全模式 |
| GPT-5.5 · 768px strip(兩種圖集皆同) | 0/60 | + 相對其自身文字對照組(30/30,62 token)輸出 token 膨脹約 40 倍 |
| Gemini 2.5-flash(部分,受配額限制) | 0/26 | 以虛構代替棄權 |

讀取準確率一覽——這正**是**失敗即關閉的模型門控,以圖呈現:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

只有 ✅ 這一組會上線。任何讀取效果不佳的組合都會被封鎖*且附有憑證*,
而三態評分機制代表:模型猜錯(`silent_wrong`)會被視為比誠實棄權
(`ILEGIVEL`)更糟。

三種傳輸層:直接 API(`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`)、
OpenRouter(`OPENROUTER_API_KEY`),以及 `--via-cli`(Claude Code
訂閱——$0)。慘痛教訓:中介層(OpenRouter、CLI 的 Read 工具)會
對大圖像重新取樣;只有直接 API 的結果對可讀性才有權威性。

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

固定純邏輯部分的單元測試(語料、評分、成本公式):
`tests/billing-sweep-formulas.test.ts`、`tests/density-frontier.test.ts`、
`tests/anthropic-vision.test.ts`、`tests/gemini-profiles.test.ts`、
`tests/gpt-billing-audit.test.ts`。
