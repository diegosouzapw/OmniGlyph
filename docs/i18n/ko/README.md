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

# 🖥️ 대시보드

패키지 안에 완전한 로컬 대시보드가 포함되어 있습니다 — 오프라인, 단일 파일, 외부 요청 없음. 요청이 흐름에 따라 SSE를 통해 실시간으로 업데이트되는 6개의 페이지:

![Overview: 미션 컨트롤 KPI 카드, 절감 스파크라인, 실시간 이벤트 피드](../../assets/dashboard-overview.png)

- **Overview** — 미션 컨트롤: 절감률(%), 절약된 금액($), 지연 시간 p95, 캐시 적중, 오류, 실시간 피드.
- **Live Flow** — 파이프라인을 노드 그래프로 표현: client → gate → renderer / passthrough → API, 실제 요청마다 하나의 파티클로 표시됩니다.
- **Telemetry** — 토큰/$ 주행계와 실시간 요청 타임라인; 어떤 요청이든 클릭하면 어떤 부분이 이미지로 변환되었는지 정확히 확인하고 모든 페이지 뒤에 있는 원본 텍스트를 읽을 수 있습니다.
- **Benchmarks** — `benchmarks/*/results/`에서 렌더링된 하네스 근거로, 모델·설정 실험당 한 행씩 표시되며, **UI에서 직접 벤치마크를 실행**할 수 있습니다: `$0` dry-run은 출력을 실시간으로 스트리밍하고, 실제 실행은 API 키와 명시적인 비용 확인이 있어야만 진행됩니다.
- **Sessions / History** — 절약된 토큰 기준 상위 세션과 디스크에 기록된 모든 이벤트.

| Live Flow | Benchmarks |
|---|---|
| ![실시간 노드 그래프로 표현된 요청 파이프라인](../../assets/dashboard-flow.png) | ![벤치마크 근거와 UI 내 dry-run](../../assets/dashboard-benchmarks.png) |

![Telemetry: 주행계와 실시간 요청 타임라인](../../assets/dashboard-telemetry.png)

# ⚙️ How it works

```
bulky request block ──► profitability gate ──► reflow + render (1-bit 5×8 atlas)
                       (exact billing math)     ──► 1568×728 PNG pages ──► splice back, cache-friendly
```

- **과금은 변환 이전에 정확히 계산됩니다**: Anthropic은 이미지당 `⌈w/28⌉ × ⌈h/28⌉ + 4` 토큰을 과금합니다(28px 패치 — 잔차 0으로 측정됨). 전체 페이지는 28,080자를 1,460토큰으로 담아 ≈ **19자/토큰**에 달하며, 밀도 높은 텍스트의 ~2자/토큰과 대비됩니다. 게이트는 수학적으로 이득일 때만 변환합니다.
- **변환 대상**: 정적 시스템 프롬프트 + 툴 문서, 오래되어 접힌(collapsed) 히스토리, 큰 툴 출력.
- **결코 변환되지 않는 것**: 사용자의 메시지, 최근 턴, 모델의 출력, 희소한 산문, 바이트 단위로 정확해야 하는 값(해시/ID는 텍스트로 함께 전송), 그리고 판독 벤치마크를 통과하지 못한 모델.

# 📚 Library use (no proxy)

프록시가 요청마다 수행하는 모든 작업은 문서화된, 임포트 가능한 API로도 제공됩니다:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Render any text to dense 1-bit PNG pages
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Or run the full request transform yourself — gate, billing math and all
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // the raw /v1/messages JSON body
  model: "claude-fable-5",
});
```

`options.keepSharp(block)`는 블록을 텍스트로 고정합니다. `options.emitRecoverable`는 이미지화된 블록의 원본을 반환합니다. 정확한 과금 수학은 패키지 루트에서도 제공됩니다(`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — 이것이 바로 [OmniRoute](https://github.com/diegosouzapw/OmniRoute)가 사용하는 것입니다. 순수 JS 런타임(Node 및 edge/Workers)입니다. 전체 API 표면: `src/core/index.ts`.

# 📤 오프라인 내보내기 — 프록시 없이, Claude Code 없이

Claude Code를 쓰지 않으시나요? 컨텍스트를 **로컬에서** PNG 페이지로 렌더링해 Cursor, ChatGPT, 또는 이미지 업로드를 받는 어떤 채팅에든 붙여넣으세요. 프록시도, API 키도, 연결된 계정도 필요 없습니다:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

채팅에 그대로 넣을 수 있는 모든 것이 담긴 폴더 하나가 생성됩니다:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git`는 커밋되지 않은 diff를, `--diff <ref>`는 커밋 범위를 렌더링하고, `--open`은 폴더를 표시합니다(macOS). 모든 작업은 여러분의 머신에서 실행됩니다 — 내보내기 경로는 결코 프록시를 시작하지 않으며 모델을 호출하지도 않습니다. 모든 플래그는 `omniglyph export --help`로 확인하세요.

# 🧭 The honest part

- **손실이 있습니다.** 이미지에서 바이트 단위로 정확한 복원은 본질적으로 신뢰할 수 없습니다. 적용된 완화책: 정확한 식별자는 이미지 옆에 텍스트로 함께 이동하며, 측정된 프로덕션 설정은 **은밀한 컨퓨불레이션 0건**을 기록했습니다 — 판독에 실패하면 기권합니다.
- **오늘 승인된 것은 Fable 5뿐**이며, 근거가 있습니다. GPT-5.5와 Gemini 2.5-flash는 밀도 높은 렌더를 측정 가능한 수준으로 읽지 못하며, Opus 4.8은 4배 큰 글리프가 필요합니다. 게이트가 이를 강제합니다.
- **과금 함정을 발견하고 피했습니다**: 고해상도 이미지 티어는 페이지당 3.3배 더 많이 과금되지만, 비전 인코더는 추가 해상도를 받지 못합니다 — 더 큰 페이지가 오히려 *더 나쁘게* 읽힙니다. 측정 결과는 [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md)에 문서화되어 있으며, 활성화되어 있지 않습니다.
- 가격은 변동됩니다. 지속되는 지표는 토큰 절감률이며, 프록시는 요청마다 무료 `count_tokens` 반사실(counterfactual) 대비로 이를 기록합니다.

# 🧠 FAQ

**59–70%는 종단 간(end-to-end) 수치입니까, 아니면 프록시가 손댄 요청에만 해당합니까?**
종단 간입니다 — 전체 요금 기준입니다. 대부분의 압축 도구는 자신이 손댄 부분에서만 절감률을 보고하는데, 이는 숫자를 부풀립니다. 저희의 분모는 *모든* 요청입니다: 게이트가 올바르게 그대로 둔 작은 요청들, 모든 캐시 쓰기와 읽기, 그리고 (프록시가 결코 압축하지 않는) 모든 출력 토큰까지 포함합니다. 압축된 요청만 놓고 보면 수치는 더 높게 나오며, 이는 헤드라인이 아니라 별도로 표기됩니다.

**절감률은 어떻게 측정합니까?**
동일한 요청의 양쪽을, 동일한 시점에 측정합니다. 모든 `/v1/messages` POST 요청에 대해 프록시는 원본 비압축 본문(반사실, counterfactual)에 대해 무료 `count_tokens` 프로브를 실제 전달과 병렬로 실행하고, 응답에서 프로바이더가 실제로 과금한 usage 블록을 읽습니다 — 둘 다 동일한 이벤트 행에 기록됩니다. 캐시 가격은 양쪽에 동일하게 적용되므로 캐싱 할인은 상쇄되며 "절감"으로 이중 계산될 수 없습니다. 이 공식은 `src/core/baseline.ts`에 있습니다. 여러분 자신의 이벤트 로그에서 직접 재도출해 볼 수 있습니다.

**왜 미스가 판독 오류가 아니라 컨퓨불레이션(confabulation)이 됩니까?**
모델의 비전은 OCR이 아니기 때문입니다: 페이지는 패치 임베딩이 될 뿐 결코 개별 문자가 되지 않으므로, 크게 실패를 알릴 수 있는 글리프 단위의 신뢰도가 존재하지 않습니다 — 픽셀이 글리프를 충분히 결정하지 못할 때, 언어 사전 지식이 그 빈틈을 그럴듯한 무언가로 채웁니다. 이것이 바로 OmniGlyph가 이 문제에 대해 fail-closed로 설계된 이유입니다: 바이트 단위로 정확해야 하는 값은 항상 이미지 옆에 텍스트로 함께 이동하고, 오독하는 모델은 게이트로 차단되며, 측정된 프로덕션 설정은 약 300회의 판독 프로브 중 은밀한 컨퓨불레이션이 **0건**이었습니다 — 판독에 실패하면 기권합니다.

**바이트 단위로 정확해야 하는 작업(해시, ID, 비밀값)은 어떻게 됩니까?**
최근 턴과 정확한 식별자는 설계상 텍스트로 유지됩니다. 작업 전체가 바이트 단위로 정확해야 하는 경우, 허용 목록(allowlist)에 없는 모델로 라우팅하세요(예: 다른 Claude 모델을 사용하는 서브에이전트) — 허용 목록 밖에 있는 것은 무엇이든 바이트 단위로 동일하게, 손대지 않고 통과합니다.

**DeepSeek-OCR가 이미 이것이 통한다는 것을 증명하지 않았습니까?**
그것은 *채널*이 작동한다는 것을 증명했습니다 — 해당 작업을 위해 훈련된 인코더/디코더 쌍으로요. 회의론은 어떤 기성 프로덕션 모델도 밀도 높은 렌더를 읽지 못하던 시절에서 비롯된 것입니다. 상황은 바뀌었고, 위의 [모델 스코어카드](../../../README.md#-the-numbers--measured-not-estimated)는 오늘날 정확히 누가 이를 판독할 수 있는지 근거와 함께 보여줍니다. [벤치마크 하네스](../../../benchmarks/README.md)는 새 모델을 명령 한 번으로 재검사합니다 — 게이트는 과대광고가 아니라 데이터를 따릅니다.

**Claude Code 없이도 사용할 수 있나요 — Cursor, ChatGPT, 단순 파이프에서도?**
네, 두 가지 방법이 있습니다. **프록시**로서는 API 베이스 URL(`ANTHROPIC_BASE_URL`, 또는 OpenAI 베이스 URL)을 설정할 수 있는 모든 클라이언트와 동작합니다 — Claude Code, 여러분 자신의 스크립트, HTTP를 쓰는 무엇이든요. 그리고 프록시를 쓸 수 없는 도구를 위해서는, 위의 **오프라인 내보내기**가 컨텍스트를 손으로 직접 붙여넣는 PNG 페이지로 렌더링합니다 — `omniglyph export --stdin`은 Unix 파이프에서 곧바로 읽어들이기까지 합니다.

**실제로 텍스트를 어떻게 이미지로 바꾸나요?**
텍스트를 리플로우한 뒤 1비트 5×8 픽셀 글리프 아틀라스로 밀도 높은 1568×728 PNG 페이지에 그려 넣습니다 — 픽셀당 1비트, 안티앨리어싱 없음, 그래서 모델은 페이지를 그 안에 담긴 문자 수가 아니라 크기(dimensions)로 과금합니다. 위의 **How it works**에 파이프라인이 있고, 벤치마크 문서에는 그 기하학적 구조와 왜 더 밀도를 높인다고 항상 더 저렴해지는 것은 아닌지가 담겨 있습니다.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Acknowledgments

OmniGlyph는 특히 한 프로젝트의 어깨 위에 서 있습니다 — 이 섹션은 저희의 변치 않는 감사 인사입니다.

| 프로젝트 | OmniGlyph에 미친 영향 |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **이 프로젝트 전체가 기반하고 있는 발견.** pxpipe는 프로덕션 LLM의 비전 채널이 밀도 높은 텍스트 컨텍스트를 훨씬 적은 토큰 비용으로 실어 나를 수 있다는 것을, 그리고 그 변환은 감이 아니라 정확한 과금 수학으로 요청마다 결정되어야 한다는 것을 근거와 함께 증명했습니다. 밀도 높은 1비트 렌더링, 수익성 게이트, `count_tokens` 반사실(counterfactual), fail-closed 모델 허용 목록, 그리고 "주장하기 전에 측정하라"는 문서화 문화는 모두 그곳에서 처음 시작되었습니다. OmniGlyph는 그 코드베이스에서 직접 파생되었습니다(MIT — 원본 저작권 표시는 저희 [LICENSE](../../../LICENSE)에 그대로 유지됩니다). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | 저희의 밀도 높은 1비트 글리프 아틀라스가 파생된 5×8 비트맵 폰트 패밀리(라이선스는 `assets/`에 있음). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | 같은 아틀라스에서 Spleen의 범위를 넘어서는 글리프를 커버합니다(라이선스는 `assets/`에 있음). |

OmniGlyph가 유용하다고 느끼신다면 업스트림에도 별을 눌러 주세요 — 이 발견은 그들의 것입니다. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 License

MIT — [LICENSE](../../../LICENSE) 참고.
