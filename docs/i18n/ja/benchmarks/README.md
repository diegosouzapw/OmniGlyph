# ベンチマーク

OmniGlyphが主張するすべての数値は、以下の2つのハーネスのいずれかに由来します —
再実行可能で、可能な限り決定論的であり、`*/results/*.jsonl`に回答ごとの生の根拠があります。
統合された分析: [docs/benchmarks/BENCHMARKS.md](../docs/benchmarks/BENCHMARKS.md)。

## 1. `billing-sweep/` — 画像は実際いくらかかるのか?

Anthropicの本番APIに対する無料の`count_tokens`プローブで、廃止された`w·h/750`式と
現行の28pxパッチモデルを、2モデル×2解像度ティアにわたる11のプローブジオメトリで比較。

**結果（2026-07-05）: パッチモデルはすべてのプローブで残差ZEROに適合する**
— 課金額はティアリサイズ後の`⌈w/28⌉ × ⌈h/28⌉`に、画像ブロックあたり固定の
+3/+4トークンを加えたもの。本番ページ（1568×728）は正確に1,460トークンで
28,080文字を運び、これは高密度テキストとしての約2文字/トークンに対し
**約19.2文字/トークン**に相当する。

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
