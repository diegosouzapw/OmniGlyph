🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — 이미지로서의 컨텍스트

### 부피가 큰 컨텍스트를 밀도 높은 PNG 페이지로 렌더링해 Claude 요금을 **59–70%** 절감하세요 — 내용은 동일하지만 토큰은 일부만 사용합니다.

**모델은 텍스트를 토큰 단위로 과금하지만, 이미지는 그 안에 담긴 텍스트의 양이 아니라 크기(dimensions)로 과금합니다.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-the-numbers--measured-not-estimated)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-the-honest-part)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) 패밀리의 일부입니다

</div>

---

# 📊 The numbers — measured, not estimated

| 지표 | 결과 | 근거 |
|---|---|---|
| 종단 간(end-to-end) 요금 절감 | **59–70%** | 프로덕션 트레이스, 13,709건 요청 |
| 변환된 블록당 토큰 수 | **10배 감소** (28,080자: 14,040 → 1,460 토큰) | [billing sweep](benchmarks/billing-sweep/README.md) |
| 과금 공식 정확도 | 모델 2종 × 티어 2종에 걸친 22회 `count_tokens` 프로브 전체에서 잔차 **0** | `benchmarks/billing-sweep/results/` |
| 프로덕션 설정에서의 정확 판독률 | Claude Fable 5에서 **30/30 (100%)** | [density frontier](benchmarks/density-frontier/README.md) |
| 약 300회 판독 프로브 중 은밀한 컨퓨불레이션(confabulation) | **0건** — 모든 미스는 `ILEGIVEL`로 기권 | `benchmarks/density-frontier/results/` |

**모델 스코어카드** (밀도 높은 렌더를 읽을 수 있는가? arm당 n=30, 결정론적 채점):

| 모델 | 판독률 | 판정 |
|---|---|---|
| Claude **Fable 5** | 정확히 **100%** | ✅ 프로덕션 목표 |
| Claude Opus 4.8 | 4배 글리프 크기에서 77–87% | ⚠️ 옵트인 세이프 모드 (절감률이 ~2배로 하락) |
| GPT-5.5 | 0/60 — 답변을 시도하며 출력을 ~40배로 부풀림 | ❌ 게이트에 의해 차단, 증거 있음 |
| Gemini 2.5-flash | 0/26 — 기권 대신 컨퓨불레이션 | ❌ 차단됨 (부분 테스트, 쿼터 제한) |

이 이점은 **현재 Fable 한정**입니다 — 다른 비전 인코더는 아직 밀도 높은 글리프를 해상하지 못합니다. [벤치마크 하네스](benchmarks/README.md)는 새 모델을 명령 한 번으로 재검사합니다.

# 🤔 Why OmniGlyph?

장시간 실행되는 모든 에이전트 세션은 요청마다 동일한 죽은 무게를 끌고 다닙니다: 시스템 프롬프트, 툴 문서, 오래된 히스토리 — 매 턴마다 토큰 단위로 다시 과금됩니다. OmniGlyph는 이러한 부피가 큰 부분을 *당신의 머신을 떠나기 전에* 밀도 높은 PNG 페이지로 다시 작성하는 **로컬 프록시**입니다:

- **휴리스틱이 아닌 정확한 과금 수학** — 프로바이더의 실제 이미지-토큰 공식을 계산하고(잔차 0으로 측정됨), 수학적으로 이득일 때만 변환합니다.
- **설계상 fail-closed** — 밀도 높은 렌더를 읽지 못하는 모델은 게이트로 차단되며, 벤치마크 근거가 있습니다. 조용한 품질 저하가 없습니다.
- **비공개 및 로컬 우선** — 재작성은 `127.0.0.1`에서 일어납니다. 그 외 어떤 것도 어디로도 전송되지 않습니다.
- **재현 가능** — 위의 모든 숫자는 `benchmarks/*/results/`에 근거가 있고, 명령 한 번으로 다시 실행할 수 있습니다.

# ⚡ Quick Start

```bash
npx omniglyph                                     # proxy on 127.0.0.1:47821
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # point Claude Code at it
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

두 방식 모두에서 동작합니다:
- **API 키** (토큰당 지불): 종단 간 요금이 59–70% 절감됩니다.
- **구독 세션**: 요금은 줄지 않지만, 사용량 한도가 토큰 단위로 계산되므로 한도가 **~2–3배** 늘어난 것처럼 느껴집니다.

<http://127.0.0.1:47821/>의 대시보드: 절약된 토큰, 나란히 비교되는 모든 텍스트→이미지 변환, 킬 스위치, 실시간 모델 칩. 응답은 정상적으로 스트리밍됩니다 — 압축되는 것은 오직 *요청*뿐이며, 모델의 출력은 결코 압축되지 않습니다.

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **과금은 변환 이전에 정확히 계산됩니다**: Anthropic은 이미지당 `⌈w/28⌉ × ⌈h/28⌉ + 4` 토큰을 과금합니다(28px 패치 — 잔차 0으로 측정됨). 전체 페이지는 28,080자를 1,460토큰으로 담아 ≈ **19자/토큰**에 달하며, 밀도 높은 텍스트의 ~2자/토큰과 대비됩니다. 게이트는 수학적으로 이득일 때만 변환합니다.
- **변환 대상**: 정적 시스템 프롬프트 + 툴 문서, 오래되어 접힌(collapsed) 히스토리, 큰 툴 출력.
- **결코 변환되지 않는 것**: 사용자의 메시지, 최근 턴, 모델의 출력, 희소한 산문, 바이트 단위로 정확해야 하는 값(해시/ID는 텍스트로 함께 전송), 그리고 판독 벤치마크를 통과하지 못한 모델.

# 🧭 The honest part

- **손실이 있습니다.** 이미지에서 바이트 단위로 정확한 복원은 본질적으로 신뢰할 수 없습니다. 적용된 완화책: 정확한 식별자는 이미지 옆에 텍스트로 함께 이동하며, 측정된 프로덕션 설정은 **은밀한 컨퓨불레이션 0건**을 기록했습니다 — 판독에 실패하면 기권합니다.
- **오늘 승인된 것은 Fable 5뿐**이며, 근거가 있습니다. GPT-5.5와 Gemini 2.5-flash는 밀도 높은 렌더를 측정 가능한 수준으로 읽지 못하며, Opus 4.8은 4배 큰 글리프가 필요합니다. 게이트가 이를 강제합니다.
- **과금 함정을 발견하고 피했습니다**: 고해상도 이미지 티어는 페이지당 3.3배 더 많이 과금되지만, 비전 인코더는 추가 해상도를 받지 못합니다 — 더 큰 페이지가 오히려 *더 나쁘게* 읽힙니다. 측정 결과는 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)에 문서화되어 있으며, 활성화되어 있지 않습니다.
- 가격은 변동됩니다. 지속되는 지표는 토큰 절감률이며, 프록시는 요청마다 무료 `count_tokens` 반사실(counterfactual) 대비로 이를 기록합니다.

# 🔬 Reproduce every number

```bash
pnpm install && pnpm test                                     # full suite
node benchmarks/billing-sweep/run.mjs --dry-run               # billing predictions, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # cost table, $0
# with keys: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (or --via-cli for a Claude Code subscription)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

전체 방법론과 모든 결과 표: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). 답변별 원시 근거: `benchmarks/*/results/*.jsonl`.

# 🚀 The OmniRoute family

OmniGlyph는 무료 AI 게이트웨이인 **[OmniRoute](https://github.com/diegosouzapw/OmniRoute) 내부의 네이티브 압축 엔진**으로도 제공됩니다. 그곳에서는 `omniglyph` 엔진으로 동작하며(독립 단일 모드 또는 다른 엔진과 함께 스택으로), fail-closed 게이트와 이미지 인식 토큰 계산을 갖추고 있습니다.

# 🛠️ Tech Stack

| 계층 | 기술 |
|---|---|
| 언어 | TypeScript (strict), ESM |
| 런타임 | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| 렌더링 | 자체 1비트 글리프 아틀라스 (Spleen/Unifont 기반, 라이선스는 `assets/`에 있음) → PNG |
| 테스트 | Vitest — TDD, 그리고 docs-integrity 및 rebrand 가드 |
| 벤치마크 | JSONL 근거를 갖춘 `benchmarks/` 하네스 (billing-sweep, density-frontier) |

## Project layout

| 경로 | 내용 |
|---|---|
| `src/` | 프록시: 변환 파이프라인, 프로바이더별 정확한 과금, 렌더러, 호스트(Node + Cloudflare Workers) |
| `benchmarks/` | 위의 모든 숫자를 만들어낸 하네스 — 재실행 가능 |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Support & Community

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — 버그 및 기능 요청
- 🔒 [SECURITY.md](SECURITY.md) — 취약점 신고
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — 엄격한 TDD + 측정-후-주장 원칙
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 License

MIT — [LICENSE](../../../LICENSE) 참고.
