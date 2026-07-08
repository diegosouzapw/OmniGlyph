🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — コンテキストを画像として扱う

### バルクなコンテキストを高密度PNGページとしてレンダリングすることで、Claudeの請求額を**59〜70%**削減 — 中身は同じ、トークン数だけが激減。

**モデルはテキストをトークン単位で課金しますが、画像は寸法だけで課金され、中に含まれるテキスト量は問われません。**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) ファミリーの一部 · [🌐 All languages](../README.md)

</div>

---

# 📊 The numbers — measured, not estimated

| 指標 | 結果 | 根拠 |
|---|---|---|
| エンドツーエンドの請求削減 | **59–70%** | 本番トレース、13,709リクエスト |
| 変換ブロックあたりのトークン数 | **10分の1**（28,080文字: 14,040 → 1,460トークン） | [billing sweep](benchmarks/billing-sweep/README.md) |
| 課金式の精度 | 22件の`count_tokens`プローブ（2モデル×2ティア）で残差**ゼロ** | `benchmarks/billing-sweep/results/` |
| 本番構成での完全読み取り精度 | Claude Fable 5で**30/30（100%）** | [density frontier](benchmarks/density-frontier/README.md) |
| 約300件の読み取りプローブ中の無自覚な作話 | **0** — 読めない場合は必ず`ILEGIVEL`として棄権 | `benchmarks/density-frontier/results/` |

**モデル別スコアカード**（高密度レンダーを読めるか？各アームn=30、決定論的スコアリング）:

| モデル | 読み取り | 判定 |
|---|---|---|
| Claude **Fable 5** | 完全一致**100%** | ✅ 本番採用 |
| Claude Opus 4.8 | グリフサイズ4倍で77–87% | ⚠️ オプトインのセーフモード（節約率は~2倍に低下） |
| GPT-5.5 | 0/60 — しかも回答量が約40倍に膨張 | ❌ ゲートで遮断、証拠あり |
| Gemini 2.5-flash | 0/26 — 棄権せずに作話 | ❌ 遮断（部分テスト、クォータ制限） |

この優位性は**現時点ではFable固有**のものです — 他のビジョンエンコーダはまだ高密度グリフを解読できません。[ベンチマークハーネス](benchmarks/README.md)を使えば、新しいモデルを1コマンドで再テストできます。

# 🤔 なぜOmniGlyphなのか

長時間稼働するエージェントセッションは、毎リクエストで同じ死重を引きずります — system prompt、ツールのドキュメント、古い履歴がターンごとに再課金されるのです。OmniGlyphは**ローカルプロキシ**として、それらのバルクな部分をマシンから送信される*前に*高密度PNGページへ書き換えます。

- **ヒューリスティックではなく厳密な課金計算** — プロバイダの実際の画像トークン式を計算し（残差ゼロまで実測済み）、その計算が有利な場合のみ変換します。
- **設計上フェイルクローズ** — 高密度レンダーを読めないモデルはゲートでブロックされ、ベンチマークの根拠が伴います。品質が黙って劣化することはありません。
- **プライベート、ローカルファースト** — 書き換えは`127.0.0.1`上で完結し、それ以外の送信は一切ありません。
- **再現可能** — 上記のすべての数値は`benchmarks/*/results/`に根拠があり、1コマンドで再実行できます。

# ⚡ クイックスタート

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

どちらの使い方でも動作します:
- **APIキー**（トークン単位の従量課金）: エンドツーエンドで請求額が59〜70%下がります。
- **サブスクリプションセッション**: 支払額は減りませんが、利用上限はトークンで数えられるため、上限が**約2〜3倍**まで伸びます。

ダッシュボードは<http://127.0.0.1:47821/>: 節約されたトークン数、テキスト→画像の変換をすべて並べて表示、キルスイッチ、ライブのモデルチップ。レスポンスは通常どおりストリーミングされます — 圧縮されるのは*リクエスト*だけで、モデルの出力には一切手を加えません。

# ⚙️ 仕組み

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **変換前に課金を厳密に計算**: Anthropicは画像1枚あたり`⌈w/28⌉ × ⌈h/28⌉ + 4`トークンを課金します（28pxパッチ単位 — 残差ゼロまで実測済み）。1ページ分で28,080文字が1,460トークンとなり、**約19文字/トークン**（高密度テキストの場合の約2文字/トークンに対して）。ゲートは計算上有利な場合のみ変換します。
- **変換されるもの**: 静的なsystem prompt + ツールのドキュメント、折りたたまれた古い履歴、大きなツール出力。
- **変換されないもの**: あなたのメッセージ、直近のターン、モデルの出力、疎なプロース、バイト単位で正確な値（ハッシュ/IDはテキストとして併走）、そして読み取りベンチマークに失敗したモデル。

# 🧭 The honest part

- **これは非可逆です。** 画像からのバイト単位の正確な復元は本質的に信頼できません。実施済みの緩和策: 正確な識別子は画像の隣にテキストとして流れ、実測された本番構成では**無自覚な作話ゼロ**を達成しています — 読み取り失敗は棄権します。
- **現時点で承認されているのはFable 5のみ**で、根拠付きです。GPT-5.5とGemini 2.5-flashは高密度レンダーを実測上読めません。Opus 4.8は4倍のグリフサイズが必要です。ゲートがこれを強制します。
- **課金の罠を発見し、回避しました**: 高解像度画像ティアは1ページあたり3.3倍多く課金されますが、ビジョンエンコーダは追加の解像度を受け取っていません — ページを大きくすると読み取りは*むしろ悪化*します。実測結果は[docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)に記載されており、有効化されていません。
- 価格は変動しますが、恒久的な指標はトークン削減率であり、プロキシは無料の`count_tokens`による反実仮想と照らしてリクエストごとにログを記録します。

# 🔬 すべての数値を再現する

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

完全な手法とすべての結果テーブル: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)。回答ごとの生の根拠: `benchmarks/*/results/*.jsonl`。

# 🚀 OmniRouteファミリー

OmniGlyphは無料のAIゲートウェイである**[OmniRoute](https://github.com/diegosouzapw/OmniRoute)にネイティブな圧縮エンジンとしても組み込まれています**。そこでは`omniglyph`エンジンとして動作し（単体モードでも他のエンジンと積み重ねても可）、フェイルクローズなゲートと画像対応のトークン会計を備えています。

# 🛠️ 技術スタック

| レイヤー | 技術 |
|---|---|
| 言語 | TypeScript（strict）、ESM |
| ランタイム | Node ≥18 · Cloudflare Workers（`wrangler.toml`） |
| レンダリング | 自前の1ビットグリフアトラス（Spleen/Unifont由来、ライセンスは`assets/`に記載）→ PNG |
| テスト | Vitest — TDD、加えてdocs-integrityとリブランドガード |
| ベンチマーク | `benchmarks/`のハーネス（billing-sweep、density-frontier）、JSONLの根拠付き |

## プロジェクト構成

| パス | 内容 |
|---|---|
| `src/` | プロキシ本体: 変換パイプライン、プロバイダごとの厳密な課金、レンダラー、ホスト（Node + Cloudflare Workers） |
| `benchmarks/` | 上記のすべての数値を生成したハーネス — 再実行可能 |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 サポート & コミュニティ

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — バグと機能要望
- 🔒 [SECURITY.md](SECURITY.md) — 脆弱性の報告
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — 厳格なTDD + 主張の前に実測
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 ライセンス

MIT — [LICENSE](../../../LICENSE)を参照。
