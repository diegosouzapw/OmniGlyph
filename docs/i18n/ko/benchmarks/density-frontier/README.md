# density-frontier — 해상도별 비용 × 정확도

프로바이더(Anthropic / OpenAI / Gemini), 페이지 기하 구조, 글리프 셀,
아틀라스 스타일별로 텍스트→이미지 렌더의 **비용과 가독성 사이의 파레토
프론티어**를 측정하는 하네스입니다.

핵심 비대칭성: billing sweep(2026-07-05,
`benchmarks/billing-sweep/`) 이후로 **비용은 오프라인에서 정확히 예측
가능**합니다 — Anthropic은 28px 패치 + 블록당 4
(`src/core/anthropic-vision.ts`), OpenAI는 패치/타일 프로필
(`src/core/openai.ts`), Gemini는 타일/media_resolution
(`gemini-cost.ts`). 오직 **판독 정확도**만 API가 필요합니다.

## Design

- **코퍼스** (`corpus.ts`): 밀도 높은 로그/JSON 형태의 필러 + 혼동 가능성
  매트릭스가 실패할 것이라고 말하는 클래스에서 심어진 니들(12자 hex,
  camelCase, 숫자 6/8/5/3) + **측정된 혼동 가능 쌍으로 만들어진 near-miss
  방해 요소**. 모델이 방해 요소로 답한다면 그 혼동은 *예측된* 것입니다 —
  그것이 바로 탐지하려는 은밀한 실패 모드이지, 단순히 집계되는 오답이
  아닙니다. 결정론적(mulberry32).
- **구성** (`configs.ts`): 엄선된 그리드 — 표준 1568×728 페이지 vs
  고해상도 1928×1928(티어별 기하 구조를 결정하는 A/B), AA vs 1비트
  (밀도 높은 렌더의 모순을 해소), 7×10/10×16 셀(Opus 세이프 모드), GPT
  스트립, 그리고 두 가지 Gemini 베팅(≤384² = 258 고정;
  `media_resolution: low` = 280 고정 → 읽을 수 *있다면* ~116자/토큰).
- **채점** (`score.ts`): 결정론적 정확 일치, LLM 심판 없음. 세 가지 결과:
  `correct` / `abstained`(ILEGIVEL 센티널 — 정직한 실패) /
  `silent_wrong`(위험한 모드), 방해 요소 플래그 포함.

## Running

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

특정 구성: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
답변은 `results/*.jsonl`에 남습니다(질문당 한 줄, 감사를 위한 원본
답변 포함).

## Acceptance bar (업스트림 PR #35/#36에서 계승됨)

구성이 프로덕션 기본값이 되려면: **gist == 텍스트 베이스라인** 그리고
**은밀한 오답 정확 문자열 0건** 그리고 **양(positive)의 절감**이
필요합니다. 첫 번째 필수 실행은 Fable에서 `anthropic-std-5x8-aa` vs
`anthropic-hires-5x8-aa`입니다 — 고해상도 티어를 활성화하기 전에
큰 페이지의 가독성을 표본 점검하는 것입니다.

## `--via-omniroute` — OmniRoute를 통한 종단 간(e2e) 검증 (P3: 비저하 증명)

위의 전송 계층들은 **하네스 안에서** 텍스트→PNG를 렌더링하고 이미지를
전송합니다. `--via-omniroute`는 그 반대로, 프로덕션 경로와 동일하게
동작합니다: **밀도 높은 텍스트**를 실행 중인 OmniRoute 인스턴스로
보내고, **`omniglyph` 엔진이 렌더링**하여 Anthropic으로 전달하게 하며,
판독 결과와 절감액을 측정합니다. 판독 결과가 직접 경로와 동일하게
유지되고 **동시에** OmniRoute가 압축을 보고하면, OmniRoute의 렌더+전달이
페이지를 **저하시키지 않는다**는 것이 증명됩니다.

전제 조건 (운영상):

1. **OmniRoute 실행 중**(`npm run dev`, 기본값 `http://localhost:20128`).
2. OmniRoute에 설정된 **Anthropic 프로바이더**와 **실제 키**(직접 경로 —
   `providerTransport==='direct'` 게이트는 `anthropic` 프로바이더에서만
   통과함).
3. OmniRoute의 압축 설정에서 **`omniglyph` 엔진이 활성화**됨
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph`
   헤더는 엔진이 켜져 있을 때만 발생합니다. (이 엔진은
   `stable:false`/프리뷰입니다; 명시적으로 활성화하세요.)
4. `OMNIROUTE_API_KEY`에 담긴 **OmniRoute API 키**(클라이언트가
   OmniRoute에 인증할 때 사용하는 키이며, Anthropic 키가 아닙니다).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

각 답변은 JSONL에 `X-OmniRoute-Compression` 응답 헤더로부터
`omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`를
기록합니다; 표 행은 압축되어 돌아온 답변 수 + 중앙값 절감액을 보여줍니다.
**P3 기준**: 직접 경로와 동일한 축자적/gist 적중(비저하) **그리고**
null이 아닌 `omnirouteSavings`(원시 텍스트 판독이 아니라 실제로 렌더링이
발생했다는 증명). `did NOT compress`가 나타나면, OmniRoute에서 엔진이
활성화되지 않았거나(또는 바디가 fail-closed 게이트를 통과하지 못한
것입니다).

순수한 부분에 대한 테스트: `tests/density-frontier.test.ts`(via-omniroute
전송 계층의 `buildOmnirouteRequest`와 `parseCompressionSavings` 포함).
