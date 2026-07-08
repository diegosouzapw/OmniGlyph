# OmniGlyphへのコントリビュート

興味を持っていただきありがとうございます! このプロジェクトには2つの譲れない文化的ルールがあります —
READMEに載るすべての数値が信頼できる理由はこれです。

## ルール1 — 厳格なTDD

すべての本番コードは、まず失敗するテストから生まれます:

1. テストを書き、**正しい理由で失敗するのを確認する**。
2. パスさせるための最小限のコードを書く。
3. グリーンを保ちながらリファクタリングする。

必須のバーは`pnpm run typecheck && pnpm test && pnpm run build`です — 常に3つ全部を実行します
（ドキュメントのリンクリントとリブランドガードは`tests/docs-integrity.test.ts`経由で`pnpm test`の中で実行されます）。

## ルール2 — 主張の前に実測

ジオメトリ、アトラス、課金式、モデルの適用範囲への変更は、実測された数値なしにマージされません。
このリポジトリはこの規律を中心に組み立てられています:

- 課金コスト → `benchmarks/billing-sweep/`で証明する（`count_tokens`は無料; 期待される残差はゼロ）。
- 可読性 → `benchmarks/density-frontier/`で証明する（各アームn≥30、決定論的スコアリング、JSONLの根拠は`benchmarks/*/results/`にコミットされる）。
- 本番デフォルトを変更するための受け入れ基準: gist == テキストベースライン **かつ** 無自覚な完全一致エラーがゼロ **かつ** プラスの節約効果があること。

数値の裏付けがない仮説は`docs/ROADMAP.md`に仮説として記載します — 決してREADMEに事実として載せません。
「もっともらしい」アイデアが2つ、すでにデータによって反証されています（高解像度ページ、アンチエイリアス済みアトラス）。
このプロセスは機能しています。

## セットアップ

```bash
pnpm install
pnpm test              # full suite, ~40–90s
pnpm run dev:node      # local proxy in watch mode
```

Node ≥18（CIは20/22/24でテスト）、pnpm 10（package.jsonの`packageManager`で固定）。

## 構造

| フォルダ | ルール |
|---|---|
| `src/core/` | ランタイム非依存（Web APIのみ — NodeとWorkersの両方で動作） |
| `src/node.ts` / `src/worker.ts` | ホストの配線のみ |
| `benchmarks/` | 再実行可能なハーネス; JSONL結果は根拠であり、コミットされる |
| `docs/` | benchmarks/（数値）、architecture/（マップ）、ROADMAP（仮説）、ops/（OmniRoute） |

## コミットとPR

- Conventional Commits（`feat:`、`fix:`、`perf:`、`docs:`、`refactor:`、`test:`、`chore:`）を使い、
  本文には関連する数値とともに*なぜ*を説明する。
- 小さく焦点を絞ったPR; 挙動の変更にはそれを固定するテストと、該当する場合はそれを正当化するベンチマークを添える。
- クライアントの`cache_control`ブロックを書き換えない、議論なしにランタイム依存を追加しない
  （コアは意図的に依存が少ない）、レンダーパスで`Math.random`やタイムスタンプを使わない
  （決定性はバイト一致でテストされるハード不変条件）。
