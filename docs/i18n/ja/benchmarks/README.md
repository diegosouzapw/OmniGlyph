# ベンチマーク

🌐 翻訳: [すべての言語](../../README.md)

OmniGlyphが主張するすべての数値は、以下の2つのハーネスのいずれかに由来します —
再実行可能で、可能な限り決定論的であり、`*/results/*.jsonl`に回答ごとの生の根拠があります。
統合された分析: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)。

## 節約の仕組み(一枚の図で)

プロバイダは**テキストはトークン単位**で課金するが、**画像は寸法単位**で課金する —
中にどれだけテキストが詰まっているかは関係ない。標準ページ1枚は、テキストが
どれだけ高密度であっても一律のコストになる:

```
                         ┌─────────────────────────────────────────────┐
28,080 characters   →    │  one 1568 × 728 PNG page   =  1,460 tokens   │
of dense context         └─────────────────────────────────────────────┘
                                          the SAME 1,460 whether the page
                                          holds 200 chars or 28,080
```

同じコンテキストを2通りの方法で課金すると:

```
as dense TEXT    ██████████████████████████████████████████████  ~14,040 tokens
as ONE IMAGE     █████                                              1,460 tokens
                                                                    ▼
                                                              ~10× fewer tokens
```

画像が勝る理由 — トークンあたりに運べる文字数:

```
image (dense page)  ███████████████████████████████████████  19.2 chars/token
dense text          ████                                       ~2  chars/token
```

OmniGlyphは、厳密な数式がこの入れ替えが勝つと示す場合にのみ、かつページを読める
ことが証明されたモデルに対してのみこの変換を行う。以下の2つのハーネスがそれぞれの
半分を証明する。

## 1. `billing-sweep/` — 画像は実際いくらかかるのか?

Anthropicの本番APIに対する無料の`count_tokens`プローブで、廃止された`w·h/750`式と
現行の28pxパッチモデルを、2モデル×2解像度ティアにわたる11のプローブジオメトリで比較。

**結果（2026-07-05）: パッチモデルはすべてのプローブで残差ZEROに適合する**
— 課金額はティアリサイズ後の`⌈w/28⌉ × ⌈h/28⌉`に、画像ブロックあたり固定の
+3/+4トークンを加えたもの。本番ページ（1568×728）は正確に1,460トークンで
28,080文字を運び、これは高密度テキストとしての約2文字/トークンに対し
**約19.2文字/トークン**に相当する。

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

## 2. `density-frontier/` — モデルは実際にそれを読めるのか?

レンダー構成、ページジオメトリ、グリフアトラス、プロバイダをまたいだ
コスト（オフライン、厳密）×読み取り精度（ライブ）。コーパスには完全一致の
needle（16進ID、camelCase、桁の連番）に加え、**実測されたグリフ混同ペアから
構築された近似ミスのdistractor**を仕込んでいるため、単に不正解として数えるのではなく、
無自覚な作話そのものを検出できる。スコアリングは決定論的（LLM判定なし）:
`correct` / `abstained`（正直な`ILEGIVEL`）/ `silent_wrong` / `no_answer`。

**主な結果**（各アームn=30）:

| アーム | 完全一致の読み取り | 備考 |
|---|---:|---|
| Fable 5 · standardページ · 1ビットアトラス（本番） | **30/30** | エラーゼロ、作話ゼロ |
| Fable 5 · standardページ · AAアトラス（旧デフォルト） | 25/30 | 正直な棄権5件 — 本番が1ビットへ切り替わった理由 |
| Fable 5 · high-res 1928²ページ | 1–2/30 | 課金は3.3倍だがエンコーダにリサンプルされる — 課金の罠、有効化されていない |
| Opus 4.8 · 10×16グリフ | 23–26/30 | オプトインのセーフモード |
| GPT-5.5 · 768pxストリップ（両アトラス） | 0/60 | + テキスト対照群（30/30、62トークン）比で出力トークンが約40倍膨張 |
| Gemini 2.5-flash（部分的、クォータ制限） | 0/26 | 棄権せずに作話 |

読み取り精度を一目で — これがまさに、フェイルクローズなモデルゲートを図示したものである:

```
Fable 5 · 1-bit page (prod)   ██████████████████████████████  30/30  ✅ approved
Opus 4.8 · 10×16 (safe mode)  ████████████████████████░░░░░░  ~24/30 ⚠️ opt-in
Fable 5 · high-res 1928²      █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
GPT-5.5 · 768px strip         ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/60   ⛔ blocked
Gemini 2.5-flash              ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0/26   ⛔ confabulates
```

出荷されるのは✅のアームのみ。読み取りが不十分なものはすべて*根拠付きで*ブロックされ、
三択のスコアリングにより、誤って推測するモデル（`silent_wrong`）は正直に棄権する
モデル（`ILEGIVEL`）よりも悪いものとして扱われる。

3種類のトランスポート: direct API（`ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY`）、
OpenRouter（`OPENROUTER_API_KEY`）、そして`--via-cli`（Claude Codeサブスクリプション —
$0）。苦労して学んだ注意点: 中間者（OpenRouter、CLIのReadツール）は大きい画像を
リサンプルする; 可読性について権威があるのはdirect APIの結果のみ。

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run                    # cost table, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --via-cli --sections 30     # via subscription, $0
ANTHROPIC_API_KEY=... pnpm exec tsx benchmarks/density-frontier/run.ts --configs anthropic-std-5x8-1bit
```

純粋な部分（コーパス、スコアリング、コスト式）を固定するユニットテスト:
`tests/billing-sweep-formulas.test.ts`、`tests/density-frontier.test.ts`、
`tests/anthropic-vision.test.ts`、`tests/gemini-profiles.test.ts`、
`tests/gpt-billing-audit.test.ts`。
