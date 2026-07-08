# OmniGlyph — Pinagsama-samang mga sukatan (2026-07-05)

Lahat ng SINUKAT sa sesyong ito, na may pinagmulan at n; malinaw na
pinaghiwalay ang mga hypothesis sa dulo. Mga resibo: `benchmarks/billing-sweep/results/` at
`benchmarks/density-frontier/results/` (JSONL kada sagot).

## 1. Billing ng Anthropic (direktang count_tokens, $0, 11 geometry × 2 modelo)

Nakumpirmang formula: `tokens = ceil(w/28) × ceil(h/28)` matapos ang resize
kada tier, **+3/block (Fable 5) / +4/block (Sonnet 4.5)** — ZERO residual sa
lahat ng row.

| probe | dims | Fable 5 (high-res) | Sonnet 4.5 (standard) |
|---|---|---:|---:|
| doc anchor | 1092×1092 | 1524 | 1525 |
| doc anchor | 1000×1000 | 1299 | 1300 |
| standard page | 1568×728 | 1459 | 1460 |
| **large page** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (resample) |
| hi-res ceiling | 1960×1960 | 4764 (clamp) | 1525 |
| hi-res long edge | 2576×1204 | 3959 | 1516 |
| tall strip | 768×1932 | 1935 | 1292 (resample) |
| 2×1092² (multi) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 imgs) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→downscale, HINDI tinanggihan sa count_tokens) | 3585 |

Mga desisyong nagmula (naipatupad na): eksaktong gate kada patch; tier kada
modelo (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Katumpakan ng pagbasa (density-frontier, mga needle na hex/camelCase/digit + distractors)

### Fable 5 2×2 matrix — sa pamamagitan ng CLI/subscription, n=30/arm, parehong corpus (~16.6k chars)

| page × atlas | eksakto | abstentions (ILEGIVEL) | tahimik na error |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (hinulaan ng matrix) |

→ **1-bit > AA sa parehong pahina; zero confabulation sa 120 tanong.**
INILAPAT: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ dumarating na nadegrada ng transport resample ang high-res (tingnan ang
H1/H3) — ang 67% ay isang floor, hindi isang ceiling.

### Opus 4.8 — sa pamamagitan ng CLI/subscription, n=30/arm

| config | eksakto | abstentions | error |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Nakumpirma ang knee ng Opus gamit ang sarili naming n (sinukat ng upstream
ang 95% sa 10×16 na may n=20). Viable ang "Opus safe mode": 10×16 sa
malaking pahina ≈ 1.7 chars kada image token sa corpus ng harness.

### Sa pamamagitan ng OpenRouter (parehong corpus/tanong) — hindi tapos para sa legibility

| sinukat na katotohanan | numero |
|---|---|
| content_filter sa mga tanong ng transcription (standard pages) | 60/60 (100%) |
| content_filter sa high-res pages | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 hinulaan) |
| Opus 10×16 (bago naubos ang credits) | 7/9 eksakto (78%) |
| mga misread na hinulaan ng confusability matrix | 4→a, 0→8, S/s case |

### Paghahambing ng transport (parehong tanong, parehong nilalaman)

| transport | filter/refusal | nababasa ba ang malaking pahina? |
|---|---|---|
| Direct API (n=9, bago naubos ang credits) | 0 | hindi sinubukan |
| OpenRouter | ~100% std / ~20% hi-res | hindi (hinihinala: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50% ng malalaking batch ang natigil (naresolba gamit ang mga chunk ng 10 + retry) | hindi (hinihinala: nire-resize ng Read) |

## 3. Gastos kada provider (offline, eksakto — BUONG pahina, teoretikal)

| provider · page | tokens/page | chars/page | **chars/token** | katayuan |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (lahat ng modelo) | 1460 | 28,080 | **19.2** | sinukat |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× mas kaunting imahe) | sinukat ang billing; hinihintay ang legibility (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | na-audit na dokumentasyon |
| GPT-5.4/5.5 (patch, original) hanggang 1568×5984 | ~9,163 | ~233k | **25.4** | dokumentasyon; hindi pa sinubukan ang legibility |
| gpt-4o-mini | 48,169/strip | — | **0.8 — HUWAG KAILANMAN i-image** | dokumentasyon (naayos na ang bug D2) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← pinakamahusay na dokumentado** | dokumentasyon; hindi pa sinubukan ang legibility |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (kung nababasa)** | hypothesis H6 |

## 4. Mga bug na natagpuan at naayos (audit laban sa opisyal na dokumentasyon)

| id | bug | epekto | commit |
|---|---|---|---|
| D2 | bumagsak ang gpt-4o-mini sa default na tile 85/170 (totoo: 2833/5667) | na-underestimate ang gastos ng ~33× — **inverted gate** | e6bc75f |
| D1 | multiplier ng o4-mini 1.62 (totoo 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) na may cap na 10000 (totoo 1536, walang original) | masisira sa mas malalaking pahina | e6bc75f |
| D4 | gpt-5-codex-mini sa tile regime (totoo: patch 1536) | ≥+23% na-underestimate | e6bc75f |
| D5 | detail:'original' hardcoded para sa bawat modelo (umiiral lamang sa 5.4+) | labas sa contract | e6bc75f |
| #44 | description stub na na-inject sa typed tools → 400 + tahimik na fallback | na-zero ang savings nang walang signal | 0f66e32 |
| AA | AA atlas sa production laban sa komentong "eval-only" | −17pp na pagbasa sa Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + extrang patch column | naayos sa 312 | baseline |

## 5. Mga bukas na hypothesis (magkano ang gastos para isara ang bawat isa)

| id | hypothesis | kasalukuyang ebidensya | desisibong test | gastos |
|---|---|---|---|---|
| H1 | Nagbabasa ang 1928² na pahina nang ≥ standard sa direct API (napatunayang WYSIWYG sa billing) | billing 4764 na walang resample; nababasa na ng 1-bit ang 67% kahit nadegrada | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit sa direct API ≈ 100% na may 3.3× mas kaunting imahe | H1 + 2×2 matrix | kapareho ng H1 | kapareho |
| H3 | Nire-resize ng Read ng CLI at OpenRouter ang mga imaheng >1568/2000px | namamatay ang 5×8 at nabubuhay ang 10×16 SA PAREHONG PAHINA | isang 1928² na pahina na may 20×32 glyphs kada transport | ~US$0 (CLI) |
| H4 | Nakadepende ang refusal sa framing (agent-nagbabasa-ng-file ≈ 0% vs raw API ≈ 100%) | paghahambing ng transport sa itaas | A/B ng wording sa tunay na proxy path | mababa |
| H5 | Nababasa ang Gemini tile 1533×1152 sa 5×8 (42 chars/tok) | wala | density-frontier na may GEMINI_API_KEY | ~libre (free tier) |
| H6 | Nababasa ang media_resolution:low (116 chars/tok) | malabong mangyari (low-res na encoder), ngunit walang nagsukat nito | 1 call | ~libre |
| H7 | GPT: legibility ng strip + inflation ng completion-token (panganib ng PageWatch) | nakita ng komunidad na −40% prompt ngunit +completion/2× latency | density-frontier na may OPENAI_API_KEY | ~US$2-5 |
| H8 | Ang glyph surgery (H~K, 0/8, 5/3…) ay ginagawang pagbasa ang mga abstention | matapos ang 1-bit, LAHAT ng miss ng Fable ay naging abstention | i-edit ang ~10 bitmap + patakbuhin muli ang matrix | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | literatura (Glyph paper, Tesseract); hindi pa sinukat sa isang commercial VLM | style flag + 2 arm | $0 (CLI) |
| H10 | Bumabagsak ang Opus sa 7×10 sa pagitan ng 0% (5×8) at 87% (10×16) → makatwirang trade-off | upstream curve na 35% sa 7×10 (n=20) | 1 dagdag na arm | $0 (CLI) |
| H11 | Nababawi ng retry-on-refusal sa proxy ang ~50% ng na-filter na batch | stochastic ang refusal kada call | ipatupad + sukatin sa production | code |

## 6. Mga natitirang operational na item

1. `gh auth login` → gumawa ng pribadong `diegosouzapw/omniglyph` + push (10 lokal na commit).
2. Mga credit ng Anthropic (H1/H2, ang hatol ng geometry) at OpenRouter (naubos na).
3. **I-rotate ang** mga key ng Anthropic at OpenRouter **na nalantad** sa chat.
4. Code queue: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   surgery (H8), Phase 4 (TS sa mga script, GIFs, docs, dashboard v2), Phase 5
   (OmniRoute engine).

## ADDENDUM 2026-07-06 — A/B sa pamamagitan ng direct API (165 na tawag): H1/H2 NAPABULAANAN

| config | eksakto | abst. | refusal | error |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA at 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 hinulaan) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 hinulaan) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

HATOL: ang 1928² na pahina ng high-res tier ay SINISINGIL nang WYSIWYG
(4764 tok, sweep) ngunit hindi natatanggap ng ENCODER ang buong resolution —
1-2/30 lamang ang nababasa, na may single-glyph swap errors (6→8, a→4), ang
lagda ng isang internal resample. **Billing ≠ input ng encoder → bitag: 3.3×
ang gastos, mas masamang legibility.** INILAPAT: binawi ang
pageGeometryForTier() — parehong tier ay nagre-render ng 1568×728; pinananatili
ang tier infra (balido pa rin ang eksaktong billing at ang hinaharap na
retune ay 1 linya lamang). Na-update ang H3: ang "transport resample" ay
(dagdag pa rito) ang sariling encoder ng API. Refusal sa transcription sa
pamamagitan ng raw API: 100% sa standard page (napalakas ang H4 — ang agent
framing lamang ang nakaka-iwas). Nakumpirma ang Opus 10×16 sa parehong
transport (77-87%).

## ADDENDUM 2026-07-06 (2) — GPT-5.5 battery sa pamamagitan ng direct API: nasarhan ang H7 (NABIGO)

| arm | verbatim | gist | output/sagot |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

Hindi kayang basahin ng GPT-5.5 ang 5×8 glyphs (0/60; kahit ang gist ay hindi
nakaligtas) at pinapalaki ang completion nang ~40× habang sinusubukang
i-decipher ang mga ito (2.4-2.7k reasoning tokens kada tanong) — nilalamon ng
output ang savings sa prompt. Pinapatunayan ng perpektong text control na
matino ang corpus/mga tanong. Kinukumpirma at kinukuwenta ang opt-in ng 5.5;
mananatiling hindi masusubukan ang gpt-5.6 (default) (walang access ang
account). Hinaharap (H12): dapat i-model ng GPT gate ang output inflation,
hindi lamang ang prompt tokens.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (BAHAGYA: naubos ang free-tier quota sa gitna ng run)

Sa ~26 na sagot ng imahe na nakarating bago namatay ang quota: **0 tama, 1
abstention, ~25 CONFABULATIONS** — at hindi ito mga glyph confusion: mga
random na digit ang mga ito (`indexLedgerInd → 0040375615`), ibig sabihin,
halos wala nang nakikita ang encoder sa mga density na sinubok (native tile
42 chars/tok at MEDIUM flat) at NAGIIMBENTO ang 2.5-flash sa halip na umatras
(binabalewala ang instruction na ILEGIVEL). Text control: 3/3 sa mga
nakarating. Walang output inflation (6-28 tok/sagot).

Paunang signal: humihilig ang H5/H6 patungo sa HINDI sa 2.5-flash, na may
failure mode na MAS MASAMA kaysa sa GPT (tahimik na confabulation sa halip na
abstention) — mangangailangan ang Gemini ng dagdag na safeguard sa proxy.
Naghihintay na isara: patakbuhin muli gamit ang paid quota o sa ibang araw,
at subukan ang gemini-2.5-pro (ang flash ang pinakamahinang reader sa
pamilya). Mayroon pa ring pinakamahusay na DOKUMENTADONG ratio ang
native-tile page (42.3 chars/token); ang legibility ang nasa duda.

Tala sa gastos: ang mga partial na pahina (ang huli sa corpus) ay masamang
sinisingil sa ilalim ng tile regime (maikling taas → maliit na crop unit →
mas maraming tile) — sapilitang optimization ang pag-pad ng huling pahina
hanggang 1152px na taas kung papasok ang Gemini.
