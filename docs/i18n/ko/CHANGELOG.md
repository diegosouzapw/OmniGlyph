# Changelog

형식: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · 시맨틱 버저닝(semantic versioning).

## [1.0.0] — 2026-07-07

첫 공개 릴리스.

### 제품

- **이미지로서의 컨텍스트 압축 프록시**: 각 LLM 요청의 부피가 큰 부분(시스템
  프롬프트, 툴 문서, 오래된 히스토리, 큰 툴 출력)을 사용자의 머신을 떠나기
  전에 밀도 높은 1비트 PNG 페이지로 다시 작성합니다. 로컬 Node 서버와
  Cloudflare Workers 호스트를 지원합니다.
- **프로바이더별 정확한 과금 수학** (`src/core/`): Anthropic 28px 패치 +
  블록당 3–4토큰 오버헤드(자체 스윕, 잔차 0), OpenAI와 Gemini 공식은 공식
  문서 대비 감사(audit)되었습니다. 패키지 루트에서 익스포트됩니다
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, 티어 상한).
- **측정된 프로덕션 렌더 설정**: 안티에일리어싱이 없는 밀도 높은 1비트
  글리프 아틀라스, 표준 티어 페이지 — 모든 선택이 `benchmarks/*/results/`의
  벤치마크 근거로 뒷받침됩니다.
- **벤치마크 하네스** (`benchmarks/`): billing-sweep(토큰 계산)과
  density-frontier(모델/밀도 전반의 판독 정확도 프론티어)는 API, OpenRouter,
  Claude Code CLI, 또는 OmniRoute(`--via-omniroute`)를 통해 재실행할 수
  있습니다.
- **거부 재시도(Refusal retry)**: 모델이 렌더링된 페이지를 거부하면 SSE/JSON
  스니퍼가 원본 요청을 재전송합니다(킬 스위치 `retryRefusalWithOriginal`).
- 결정론적 페이지를 위한 **LRU 렌더 캐시**.
- **OmniRoute 엔진**: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)의
  `omniglyph` 압축 엔진으로 제공됩니다(단일 모드와 스택형 파이프라인 모두),
  fail-closed 게이트와 이미지 인식 토큰 계산을 갖췄습니다.

### 숫자 (모두 재현 가능)

- 샘플 UI 렌더: 1015자 → 438×120 PNG, 254 → 84토큰 (**66.9% 절감**).
- 표준 페이지 1568×728 = 담고 있는 텍스트 양과 무관하게 1456 이미지 토큰.
- Claude는 프로덕션 밀도에서 밀도 높은 1비트 페이지를 100%로 읽으며, Opus
  4.8은 10×16에서 77–87%를 읽습니다.

### 부정적 결정 (측정에 기반, 의견이 아님)

- **고해상도 티어는 과금 함정입니다**: 1928² 페이지는 WYSIWYG로 과금되지만
  인코더는 전체 해상도를 받지 못합니다 — 두 티어 모두 표준 페이지를
  렌더링합니다.
- **GPT-5.5는 거부되었습니다**: 밀도 높은 스트립을 0/60 판독했고, 텍스트
  컨트롤 대비 완료(completion) 토큰이 ~40배 부풀었습니다.
- **gpt-4o-mini는 결코 이미지화되지 않습니다** (2833/5667 토큰 하한선 때문에
  수익성이 없습니다).
- **Gemini 2.5-flash는 밀도 높은 페이지에서 기권 대신 컨퓨불레이션합니다**
  (0/26) — 유료 쿼터로의 재테스트가 보류 중입니다.
