# OmniGlyph — Consolidated measurements (2026-07-05)

Everything MEASURED in this session, with source and n; hypotheses clearly
separated at the end. Receipts: `benchmarks/billing-sweep/results/` and
`benchmarks/density-frontier/results/` (JSONL per answer).

## 1. Anthropic billing (direct count_tokens, $0, 11 geometries × 2 models)

Confirmed formula: `tokens = ceil(w/28) × ceil(h/28)` after per-tier resize,
**+3/block (Fable 5) / +4/block (Sonnet 4.5)** — ZERO residual across all rows.

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
| 20×280²+2100² | — | 6824 (2100²→downscale, NOT rejected in count_tokens) | 3585 |

Derived decisions (implemented): exact per-patch gate; per-model tier
(Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = high-res); `cols` 313→312.

## 2. Reading accuracy (density-frontier, hex/camelCase/digit needles + distractors)

### Fable 5 2×2 matrix — via CLI/subscription, n=30/arm, same corpus (~16.6k chars)

| page × atlas | exact | abstentions (ILEGIVEL) | silent errors |
|---|---:|---:|---:|
| standard 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standard 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| high-res 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| high-res 1928×1928 · AA | 0/30 | 29 | 1 (predicted by the matrix) |

→ **1-bit > AA on both pages; zero confabulation across 120 questions.**
APPLIED: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ high-res arrives degraded by transport resample (see H1/H3) — the 67%
is a floor, not a ceiling.

### Opus 4.8 — via CLI/subscription, n=30/arm

| config | exact | abstentions | errors |
|---|---:|---:|---:|
| high-res · 10×16 cell | **26/30 (87%)** | 0 | 4 (digits) |
| standard · 5×8 cell | 0/30 | 30 | 0 |

→ Opus knee confirmed with our own n (upstream measured 95% at 10×16 with
n=20). "Opus safe mode" is viable: 10×16 on the large page ≈ 1.7 chars per
image token on the harness corpus.

### Via OpenRouter (same corpus/questions) — inconclusive for legibility

| measured fact | number |
|---|---|
| content_filter on transcription questions (standard pages) | 60/60 (100%) |
| content_filter on high-res pages | 5-6/30 (~20%) |
| Fable high-res: abstentions + errors | 20 ILEGIVEL + 5 errors (2 predicted) |
| Opus 10×16 (before credits ran out) | 7/9 exact (78%) |
| misreads predicted by the confusability matrix | 4→a, 0→8, S/s case |

### Transport comparison (same question, same content)

| transport | filter/refusal | large page legible? |
|---|---|---|
| Direct API (n=9, before credits ran out) | 0 | not tested |
| OpenRouter | ~100% std / ~20% hi-res | no (suspected: resample) |
| Claude Code CLI (subscription) | 0 content_filter; ~50% of large batches stalled (resolved with chunks of 10 + retry) | no (suspected: Read resizes) |

## 3. Cost per provider (offline, exact — FULL pages, theoretical)

| provider · page | tokens/page | chars/page | **chars/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (all models) | 1460 | 28,080 | **19.2** | measured |
| Anthropic hi-res 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× fewer images) | billing measured; legibility pending (H1) |
| GPT-5 (tile) strip 768×2048 | 1190 | ~38,760 | **32.6** | audited docs |
| GPT-5.4/5.5 (patch, original) up to 1568×5984 | ~9,163 | ~233k | **25.4** | docs; legibility untested |
| gpt-4o-mini | 48,169/strip | — | **0.8 — NEVER imageify** | docs (bug D2 fixed) |
| Gemini tile 1533×1152 (native crop unit 768) | 1032 | 43,615 | **42.3 ← best documented** | docs; legibility untested |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (if legible)** | hypothesis H6 |

## 4. Bugs found and fixed (audit against official docs)

| id | bug | impact | commit |
|---|---|---|---|
| D2 | gpt-4o-mini fell into the default tile 85/170 (actual: 2833/5667) | cost underestimated ~33× — **inverted gate** | e6bc75f |
| D1 | o4-mini multiplier 1.62 (actual 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) with cap 10000 (actual 1536, no original) | would break with larger pages | e6bc75f |
| D4 | gpt-5-codex-mini in the tile regime (actual: patch 1536) | ≥+23% underestimated | e6bc75f |
| D5 | detail:'original' hardcoded for every model (only exists in 5.4+) | out of contract | e6bc75f |
| #44 | description stub injected into typed tools → 400 + silent fallback | savings zeroed with no signal | 0f66e32 |
| AA | AA atlas in production against the "eval-only" comment | −17pp reading on Fable | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× resample + extra patch column | fixed to 312 | baseline |

## 5. Open hypotheses (what each one costs to close)

| id | hypothesis | current evidence | decisive test | cost |
|---|---|---|---|---|
| H1 | The 1928² page reads ≥ standard on the direct API (WYSIWYG proven in billing) | billing 4764 with no resample; 1-bit already reads 67% even degraded | direct A/B std vs hi-res (1-bit) | ~US$4 API |
| H2 | hi-res + 1-bit on the direct API ≈ 100% with 3.3× fewer images | H1 + 2×2 matrix | same as H1 | same |
| H3 | The CLI's Read and OpenRouter resize images >1568/2000px | 5×8 dies and 10×16 survives ON THE SAME page | one 1928² page with 20×32 glyphs per transport | ~US$0 (CLI) |
| H4 | Refusal depends on framing (agent-reading-a-file ≈ 0% vs raw API ≈ 100%) | transport comparison above | wording A/B on the real proxy path | low |
| H5 | Gemini tile 1533×1152 legible at 5×8 (42 chars/tok) | none | density-frontier with GEMINI_API_KEY | ~free (free tier) |
| H6 | media_resolution:low legible (116 chars/tok) | unlikely (low-res encoder), but nobody measured it | 1 call | ~free |
| H7 | GPT: strip legibility + completion-token inflation (PageWatch risk) | community saw −40% prompt but +completion/2× latency | density-frontier with OPENAI_API_KEY | ~US$2-5 |
| H8 | Glyph surgery (H~K, 0/8, 5/3…) converts abstentions into reads | after 1-bit, ALL Fable misses became abstentions | edit ~10 bitmaps + re-run the matrix | $0 (CLI) |
| H9 | Light theme (black-on-white) > inverted | literature (Glyph paper, Tesseract); never measured on a commercial VLM | style flag + 2 arms | $0 (CLI) |
| H10 | Opus at 7×10 lands between 0% (5×8) and 87% (10×16) → fine trade-off | upstream curve 35% at 7×10 (n=20) | 1 extra arm | $0 (CLI) |
| H11 | Retry-on-refusal in the proxy recovers the ~50% of filtered batches | refusal is stochastic per call | implement + measure in production | code |

## 6. Operational pending items

1. `gh auth login` → create private `diegosouzapw/omniglyph` + push (10 local commits).
2. Anthropic credits (H1/H2, the geometry verdict) and OpenRouter (exhausted).
3. **Rotate the** Anthropic and OpenRouter **keys** exposed in the chat.
4. Code queue: #45 (schema-strip draft-07), retry-on-refusal (H11), glyph
   surgery (H8), Phase 4 (TS in the scripts, GIFs, docs, dashboard v2), Phase 5
   (OmniRoute engine).

## ADDENDUM 2026-07-06 — A/B via direct API (165 calls): H1/H2 REFUTED

| config | exact | abst. | refusal | errors |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA and 1-bit) | 0/60 | 0 | **60/60 refusal** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 predicted) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 predicted) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

VERDICT: the high-res tier's 1928² page is BILLED WYSIWYG (4764 tok,
sweep) but the ENCODER does not receive the full resolution — 1-2/30 read,
with single-glyph swap errors (6→8, a→4), the signature of an internal
resample. **Billing ≠ encoder input → trap: 3.3× the cost, worse legibility.**
APPLIED: pageGeometryForTier() reverted — both tiers render 1568×728;
tier infra kept (exact billing remains valid and the future retune is
1 line). H3 updated: the "transport resample" was (also) the API's own
encoder. Refusal on transcription via raw API: 100% on the standard page
(H4 reinforced — only the agent framing escapes). Opus 10×16 confirmed on
both transports (77-87%).

## ADDENDUM 2026-07-06 (2) — GPT-5.5 battery via direct API: H7 closed (FAILED)

| arm | verbatim | gist | output/answer |
|---|---:|---:|---:|
| strip 768×2048 5×8 AA | 0/30 (18 abst, 5 filtered, 7 errors) | 0/3 | 2,639 tok |
| strip 5×8 1-bit | 0/30 (15 abst, 5 filtered, 10 errors) | 1/3 | 2,383 tok |
| TEXT (control) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 cannot read 5×8 glyphs (0/60; not even gist survives) and inflates
the completion ~40× trying to decipher them (2.4-2.7k reasoning tokens per
question) — the prompt savings are devoured by the output. The perfect text
control proves the corpus/questions are sane. Confirms and quantifies the
5.5 opt-in; gpt-5.6 (default) remains untestable (account has no access).
Future (H12): the GPT gate must model output inflation, not just prompt
tokens.

## ADDENDUM 2026-07-06 (3) — Gemini 2.5-flash (PARTIAL: free-tier quota blew mid-run)

Of the ~26 image answers that got through before the quota died: **0 correct,
1 abstention, ~25 CONFABULATIONS** — and they are not glyph confusions: they
are random digits (`indexLedgerInd → 0040375615`), i.e. the encoder sees
almost nothing at the tested densities (native tile 42 chars/tok and MEDIUM
flat) and 2.5-flash INVENTS instead of abstaining (ignores the ILEGIVEL
instruction). Text control: 3/3 on the ones that got through. No output
inflation (6-28 tok/answer).

Preliminary signal: H5/H6 lean toward NO on 2.5-flash, with a failure mode
WORSE than GPT's (silent confabulation instead of abstention) — Gemini would
require extra safeguards in the proxy. Pending to close: re-run with paid
quota or on another day, and test gemini-2.5-pro (flash is the weakest
reader in the family). The native-tile page still has the best DOCUMENTED
ratio (42.3 chars/token); it is the legibility that is in doubt.

Cost note: partial pages (the corpus's last one) bill badly under the tile
regime (short height → small crop unit → more tiles) — padding the last
page to 1152px of height is a mandatory optimization if Gemini comes in.
