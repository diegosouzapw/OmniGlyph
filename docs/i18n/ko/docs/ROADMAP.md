# 포크 로드맵 — "우리의 OmniGlyph" + OmniRoute 통합

측정된 billing sweep, 공식 문서 대비 OpenAI/Gemini 감사, 관련 도구 분석,
density-frontier 하네스로부터 통합된 작업 계획(2026-07-05). 각 항목의
상태: ☐ 보류 · ◐ 부분 완료 · ☑ 이 저장소에서 완료.

## Phase 0 — 측정 기반 (이 저장소에서 완료됨)

- ☑ 정확한 Anthropic 과금(28px 패치, 티어 2개, 블록당 +4) —
  `src/core/anthropic-vision.ts`, `benchmarks/billing-sweep/`의 스윕.
- ☑ 정확한 비용을 갖춘 수익성 게이트(기존 w·h/750 × 1.10을 대체).
- ☑ 티어별 기하 구조: Fable/Opus 4.8/Sonnet 5 → 1928×1928 페이지(이미지
  3.3배 감소); 표준 → 1568×728. 테스트 691개 통과.
- ☑ `benchmarks/density-frontier/` 하네스(혼동 가능한 방해 요소가 있는
  니들을 사용해 API를 통한 오프라인 비용 × 정확도, 결정론적 채점).

## Phase 1 — 다중 프로바이더 과금 수정 (감사에서 확인된 버그)

감사에서 정한 우선순위(공식 문서 캡처 시점 2026-07-05):

1. ☐ **D2 (역전된 게이트)**: `gpt-4o-mini`는 기본 타일 85/170에
   해당하지만 실제 비용은 **base 2833 / tile당 5667**(~33배 과소평가,
   ~0.8자/토큰)입니다 — 이 모델의 이미지화는 항상 손해이지만 게이트가
   이를 승인합니다. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'`이 무조건적으로 전송되지만
   (`src/core/openai.ts:392,402`) 이는 gpt-5.4 이상에서만 존재합니다;
   프로필에서 도출해야 합니다.
3. ☐ **D1**: `o4-mini` 배수 1.62 → **1.72**로 수정(5.8% 과소평가).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`는
   패치 버킷의 **상한 1536(`original` 없음)**에 속하지만(코드는 10000으로
   가정) `gpt-5-codex-mini`는 잘못된 체제(타일 → 패치)에 있습니다.
5. ☐ **GPT 기하 구조**: `GPT_MAX_HEIGHT_PX 1932 → 2048`(두 체제 모두와
   정렬 — 64×32 패치와 4×512 타일; 자유 문자 +6.25%). 전용 5.4/5.5
   `original` 프로필: 최대 1568×5984(9,163 패치 ≤ 10k, 한 블록에 약
   233k자) — 먼저 가독성 A/B 테스트 필요.
6. ☐ **Gemini 지원**(신규): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + 프록시 내 `:generateContent`/
   `:streamGenerateContent` 라우트. 문서화 가능한 기하 구조: **1152×1536
   (정확한 크롭 단위 768, 타일 4개, 42.2자/토큰 — 세 프로바이더 중 문서화된
   최고 비율)**; 보정할 베팅: `media_resolution:MEDIUM`을 갖춘 768²(56.4)와
   Gemini 3 HIGH. 주의: Gemini의 OpenAI 호환 엔드포인트는 잘못된 과금으로
   OpenAI 변환기를 거치게 됩니다.

## Phase 2 — 판독 품질 (심판 역할의 density-frontier 하네스)

- ◐ Fable에서 표준 vs 고해상도의 결정적 A/B(진행 중; 기준선: gist ==
  텍스트 그리고 은밀한 오답 0건 그리고 절감 > 0).
- ☐ 밀도 높은 경로에서의 AA vs 1비트 모순 해결(코드는 "eval 전용"이라고
  적혀 있지만 프로덕션은 AA를 사용).
- ☐ (2026-07-06에 근거와 함께 연기됨) 글리프 수술(glyph surgery): 프로덕션
  설정은 30/30을 읽어내므로 오늘 이 수술로 고칠 수 있는 측정 가능한 미스가
  없습니다. 100% 미만 목표가 범위에 들어오거나(예: Opus) 새로운 측정이
  회귀를 보인다면 재검토합니다.
- ☑ ~~Light-theme A/B~~ 검사(inspection)로 해결됨(2026-07-06): 렌더는
  이미 흑백(black-on-white)입니다(render.ts:635/822, 블릿 후 반전) —
  문헌과 정렬됨; 가설은 잘못된 전제(업스트림 예시 이미지)에서 비롯되었음.
- ☐ 바이트 단위로 정확한 ID를 위한 체크섬 포함 워드리스트(업스트림 #38,
  승인됨) + 기권 배너(#31/#32) + 팩트시트의 camelCase(#33/#34).
- ☑ 포트 #45: $schema/$id 보존, 요소별 튜플 제거(main에 커밋됨).
- ☑ 거부 시 재시도(#37/H11): 무손실 재생(replay) 스니퍼 + 원본 바디로
  단일 재시도; refusalRetried 텔레메트리(main에 커밋됨).
- ☐ 재수화(rehydrate) 도구(`RecoverableBlock` → 호출 가능한 도구;
  LensVLM이 선택적 재전개를 검증).

## Phase 3 — 성능/견고성

- ☐ LRU 렌더 캐시(불변식에 의해 결정론적; 슬랩과 고정된 청크가 오늘은
  모든 요청마다 다시 렌더링됨).
- ☐ 워커 스레드에서의 PNG 인코딩; 설정 가능한 deflate 레벨.
- ☐ 열려 있는 업스트림 수정 사항 포트: #44(타입 지정된 네이티브 도구 →
  400), #45(스키마 제거 draft-07 → 400 루프), #42(Claude Desktop을 위한
  CONNECT 프록시), #19(GPT 설명 이중 과금).
- ☐ ADAPTIVE_CPT_PLAN 구현(블록 역할별 cpt; 실제 슬랩 = 1.50).

## Phase 4 — 포크 자체

- ☐ 자체 이름/저장소(Diego의 결정) + 체리픽을 위한 업스트림 `git remote`.
- ☐ **어디서나 TS**: core는 이미 TS입니다; `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/`를 변환(패턴: tsx + vitest;
  `benchmarks/density-frontier/`는 처음부터 그렇게 만들어졌음).
- ☐ OmniRoute 품질 표준: eslint 9 + prettier, typecheck/test/build/link-check를
  갖춘 CI, CONTRIBUTING, SECURITY, README i18n(pt-BR 우선), 시맨틱
  CHANGELOG.
- ☐ README에 비디오 대신 **GIF**(vhs/asciinema+agg로 녹화; 원본 vs 프록시
  나란히 비교).
- ☐ 대시보드 v2(HTTP API를 통해 재구현 — 서드파티 코드를 물려받지 않음):
  "ANTHROPIC_BASE_URL로 터미널 열기" 런처, "트래픽이 나를 거쳐 가고
  있는가?" 확인, 이미지-vs-텍스트 인스펙터, 세션, 통화 단위 비용 패널,
  가벼운 i18n, 폴링 대신 SSE, 보존 기능을 갖춘 SQLite 영속화(24개 컬럼
  스키마가 좋은 출발점).
- ☐ dense-image-gen에서 가져온 마이크로 아이디어: `lines` 모드(코드/표를
  위한 레이아웃 보존), `--keep-ws`, 페이지별 출처 제목("system prompt" /
  "tool docs" / "history turn N"), 독립 실행형 CLI
  `render arquivo.md -o out.png`.

## Phase 5 — OmniRoute로 포팅

- ☐ `CompressionEngine` 엔진(`cavemanAdapter.ts` 템플릿), `engines/index.ts`
  + `engineCatalog.ts`에 등록; `targets: ["messages","tool_results"]`,
  `applyAsync`.
- ☐ 배관 작업: `chatCore.ts:1297`에서 `supportsVision` 전달(1줄) 또는
  `isVisionModelId`를 통해 해결.
- ☐ 스택 순서: 마지막(RTK/Caveman/시맨틱 렌더러가 먼저; OmniGlyph는
  나머지를 이미지화).
- ☐ 불변식: 클라이언트의 `cache_control`이 있는 블록은 절대 다시 쓰지
  않음(교훈 #4560); 충실도 게이트(#5127)는 명시적 예외 또는 불변식을
  충족하는 텍스트 팩트시트가 필요; `skip_reason`을 포함한 시도 텔레메트리
  (교훈 #4268).
- ☐ 라우팅: 엔진 이후의 폴백/재시도는 비전 능력과 허용 목록을 존중해야
  함(재압축 또는 우회).
- ☐ CCR 시너지: `emitRecoverable` → 슬라이스별 조회를 갖춘 CCR 스토어
  (`head/tail/grep`, #5187) = 완전한 선택적 재전개.
- ☐ 마케팅 기능으로서의 무료 티어 확장: 프리 티어 토큰 하나가 비전
  모델에서 ~2–3배 더 많은 문자를 산출; Gemini 프리 티어 +
  1152×1536 기하 구조가 가장 강력한 사례.

## 열려 있는 위험

- 재배포 이후 이미지화된 컨텍스트에서의 Fable 거부(업스트림 #37) —
  OmniRoute에서 기본 활성화 전에 완화 필요.
- 가격 차익거래: Anthropic이 비전 가격을 재조정하면 절감액이 변합니다 —
  요청별 반사실(`count_tokens`)이 방어책입니다.
- OpenAI: 커뮤니티 측정(PageWatch)에서 완료 토큰이 증가하고 지연 시간이
  2배가 되는 것을 관찰함 — 활성화 전에 프로바이더별로 측정해야 함.

## A/B 결과 2026-07-05 (OpenRouter 경유 — 기하 구조에는 결론 없음, 실패 모드에는 유효)

| 설정 | 축자적(verbatim) | 기권 | 필터됨 | 은밀한 오답 |
|---|---|---|---|---|
| fable std 5×8 (AA와 1비트) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2건 예측됨) |
| fable hires 5×8 (1비트) | 0/30 | 20 | 1 | 4 (2건 예측됨) |
| opus hires 10×16 | **9건 중 7건 판독** | 0 | 크레딧 소진으로 21건 | 2 (숫자) |

유효한 발견: (1) 분류기(이슈 #37)는 표준 페이지의 전사(transcription)
질문에 대한 지배적인 실패 모드입니다 — 100% 필터됨 — 그리고 큰 페이지에서는
발생하지 않습니다; 문구가 중요합니다. (2) 기권은 작동합니다: 큰 페이지에서
ILEGIVEL 20건 vs 컨퓨불레이션 5건. (3) 10×16에서 Opus는 78%(n=9) 정확하게
읽는 반면 5×8에서는 역사적으로 0%였습니다 — 무릎(knee) 지점에 대한 최초의
직접적 증거. (4) OpenRouter를 통한 큰 페이지의 판독 불가능은 전송 계층의
RESAMPLE(Bedrock/Vertex 표준 티어?)을 시사합니다 — Anthropic의 직접 API에서
테스트해야 할 결정적 가설; 기하 구조 A/B는 그때까지 미해결(OPEN)로
남습니다. OpenRouter 크레딧은 Opus arm 도중 소진되었습니다.

## 최종 2×2 매트릭스 (2026-07-05, CLI/구독 경유, Fable 5, arm당 n=30)

| 페이지 × 아틀라스 | 1비트 | AA |
|---|---|---|
| 표준 1568×728 | **30/30 (100%)** | 25/30 + 5 기권 |
| 고해상도 1928×1928 | **20/30 (67%)** + 10 기권 | 0/30 + 29 기권 |

4개 arm 전체에서 컨퓨불레이션 0건(질문 120개 — 모든 미스는 ILEGIVEL이었음).
적용됨: DENSE_RENDER_STYLE이 1비트(aa:false)로 전환되었으며
tests/dense-style.test.ts에 고정됨. Opus 4.8: 큰 페이지의 10×16에서
26/30, 5×8에서 30/30 ILEGIVEL — Opus 세이프 모드가 실행 가능함을 확인.
고해상도 페이지는 여전히 전송 계층(CLI Read/OpenRouter 리샘플)에 의해
저하된 상태이며, WYSIWYG 기하 구조의 판정은 여전히 직접 API에 달려
있습니다.
