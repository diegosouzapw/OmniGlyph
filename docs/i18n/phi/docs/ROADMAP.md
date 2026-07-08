# Roadmap ng fork — "ang aming OmniGlyph" + integrasyon sa OmniRoute

Pinagsama-samang work plan (2026-07-05) mula sa: sinukat na billing sweep,
audit ng OpenAI/Gemini laban sa opisyal na dokumentasyon, pagsusuri ng mga
kaugnay na tool, at ang density-frontier harness. Katayuan ng bawat item:
☐ pending · ◐ bahagya · ☑ tapos na dito.

## Phase 0 — Pundasyon ng sukatan (TAPOS NA sa repo na ito)

- ☑ Eksaktong billing ng Anthropic (28px na patches, 2 tier, +4/block) — `src/core/anthropic-vision.ts`, sweep sa `benchmarks/billing-sweep/`.
- ☑ Profitability gate na may eksaktong gastos (pinalitan ang w·h/750 × 1.10).
- ☑ Geometry kada tier: Fable/Opus 4.8/Sonnet 5 → 1928×1928 na pahina (3.3× mas kaunting imahe); standard → 1568×728. 691 na test na green.
- ☑ `benchmarks/density-frontier/` harness (offline na gastos × katumpakan sa pamamagitan ng API, mga needle na may confusable distractors, deterministic scoring).

## Phase 1 — Mga ayos sa billing ng multi-provider (mga bug na kinumpirma sa audit)

Priyoridad na itinakda ng audit (opisyal na dokumentasyon na na-capture noong 2026-07-05):

1. ☐ **D2 (INVERTED gate)**: bumabagsak ang `gpt-4o-mini` sa default na tile 85/170, ngunit ang gastos ay **2833 base / 5667 kada tile** (~33× na-underestimate, ~0.8 char/token) — palaging talo ang pag-image dito ngunit inaaprubahan ito ng gate. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: ipinapadala ang `detail:'original'` nang walang kondisyon (`src/core/openai.ts:392,402`), ngunit umiiral lamang mula sa gpt-5.4+; kunin ito mula sa profile.
3. ☐ **D1**: multiplier ng `o4-mini` 1.62 → **1.72** (na-underestimate ng 5.8%).
4. ☐ **D3/D4**: nasa patch bucket ang `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` na may **cap na 1536 nang walang `original`** (inaakala ng code na 10000); nasa maling regime ang `gpt-5-codex-mini` (tile → patch).
5. ☐ **GPT geometry**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (naaayon sa PAREHONG regime: 64×32 na patches at 4×512 na tiles; +6.25% na libreng chars). Dedikadong profile na `original` para sa 5.4/5.5: hanggang 1568×5984 (9,163 patches ≤ 10k, ~233k chars sa isang block) — A/B sa kakayahang mabasa muna.
6. ☐ **Suporta sa Gemini** (bago): `src/core/gemini.ts` + `gemini-model-profiles.ts` + mga route na `:generateContent`/`:streamGenerateContent` sa proxy. Madodokumentong geometry: **1152×1536 (eksaktong crop unit 768, 4 tiles, 42.2 chars/token — ang pinakamahusay na dokumentadong ratio sa 3 provider)**; mga pusta para kalibrahin: 768² na may `media_resolution:MEDIUM` (56.4) at Gemini 3 HIGH. Pag-iingat: ang OpenAI-compat endpoint ng Gemini ay dadaan sa OpenAI transformer na may maling billing.

## Phase 2 — Kalidad ng pagbasa (density-frontier harness bilang hukom)

- ◐ Desisibong A/B ng std vs high-res sa Fable (tumatakbo; bar: gist == text AT zero silent-wrong AT positibong savings).
- ☐ Resolbahin ang kontradiksyon ng AA vs 1-bit sa dense path (sinasabi ng code na "eval-only", gumagamit ang production ng AA).
- ☐ (IPINAGPALIBAN na may katwiran noong 2026-07-06) Glyph surgery: nagbabasa ang production config ng 30/30 — walang masukat na miss para ayusin ng surgery ngayon. Balikan kung may sub-100% na target na papasok sa saklaw (hal. Opus) o kung ipapakita ng bagong sukatan ang isang regression.
- ☑ ~~A/B ng light-theme~~ NARESOLBA sa pamamagitan ng inspeksyon (2026-07-06): black-on-white NA ANG render (render.ts:635/822, post-blit invert) — naaayon sa literatura; ang hypothesis ay nagmula sa maling premise (upstream na example image).
- ☐ Wordlist na may checksum para sa byte-exact na ID (upstream #38, sinang-ayunan) + abstention banner (#31/#32) + camelCase sa factsheet (#33/#34).
- ☑ Port #45: napanatili ang $schema/$id, tinanggal ang mga tuple kada element (commit sa main).
- ☑ Retry-on-refusal (#37/H11): lossless replay sniffer + isang retry gamit ang orihinal na body; refusalRetried telemetry (commit sa main).
- ☐ Rehydrate tool (`RecoverableBlock` → callable tool; sini-validate ng LensVLM ang selective re-expansion).

## Phase 3 — Performance/robustness

- ☐ LRU render cache (deterministic ayon sa invariant; ang slab + frozen chunks ay muling nire-render sa bawat request ngayon).
- ☐ PNG encode sa isang worker thread; naka-configure na antas ng deflate.
- ☐ I-port ang mga bukas na upstream fix: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400 loop), #42 (CONNECT proxy para sa Claude Desktop), #19 (double-billing ng GPT descriptions).
- ☐ Ipatupad ang ADAPTIVE_CPT_PLAN (cpt kada block role; totoong slab = 1.50).

## Phase 4 — Ang fork mismo

- ☐ Sariling pangalan/repo (desisyon ni Diego) + upstream `git remote` para sa cherry-picks.
- ☐ **TS saanman**: TS na ang core; i-convert ang `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (pattern: tsx + vitest; ganito nagsimula ang `benchmarks/density-frontier/`).
- ☐ Pamantayan ng kalidad ng OmniRoute: eslint 9 + prettier, CI na may typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR muna), semantic CHANGELOG.
- ☐ **Mga GIF sa halip na video** sa README (i-record gamit ang vhs/asciinema+agg; magkatabing plain vs proxy).
- ☐ Dashboard v2 (ipatupad-muli sa pamamagitan ng HTTP API — huwag magmana ng third-party code): "buksan ang terminal na may ANTHROPIC_BASE_URL" launcher, "dumadaan ba ang traffic sa akin?" na check, image-vs-text inspector, mga session, cost panel sa currency, magaan na i18n, SSE sa halip na polling, SQLite persistence na may retention (ang 24-column na schema nito ay magandang simula).
- ☐ Micro-ideas mula sa dense-image-gen: `lines` mode (napanatili ang layout para sa code/tables), `--keep-ws`, pamagat ng pinagmulan kada pahina ("system prompt" / "dokumentasyon ng tool" / "history turn N"), standalone CLI `render arquivo.md -o out.png`.

## Phase 5 — Pag-port sa OmniRoute

- ☐ `CompressionEngine` engine (template na `cavemanAdapter.ts`), nakarehistro sa `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: ipasa ang `supportsVision` sa `chatCore.ts:1297` (1 linya) o i-resolve sa pamamagitan ng `isVisionModelId`.
- ☐ Ayos ng stack: pinakahuli (RTK/Caveman/semantic renderers muna; ini-imahe ng OmniGlyph ang residual).
- ☐ Mga invariant: huwag kailanman isulat-muli ang mga block na may `cache_control` ng client (aral #4560); kailangan ng fidelity gate (#5127) ng ideniklarang exemption o isang text factsheet na tumutugon sa mga invariant; attempt telemetry na may `skip_reason` (aral #4268).
- ☐ Routing: dapat igalang ng post-engine fallback/retry ang vision capability at ang allowlist (i-recompress o i-bypass).
- ☐ Synergy sa CCR: `emitRecoverable` → CCR store na may per-slice retrieval (`head/tail/grep`, #5187) = buong selective re-expansion.
- ☐ Pagpapaunlad ng free tier bilang marketing feature: bawat free-tier token ay nagbubunga ng ~2-3× pang chars sa mga vision model; ang free tier ng Gemini + geometry na 1152×1536 ang pinakamalakas na kaso.

## Mga bukas na panganib

- Mga refusal ng Fable pagkatapos ng redeploy sa naka-image na konteksto (upstream #37) — mitigahin bago i-default-on sa OmniRoute.
- Arbitrage ng presyo: kung magbago ang presyo ng vision ng Anthropic, magbabago ang savings — ang per-request na counterfactual (`count_tokens`) ang depensa.
- OpenAI: nakita ng komunidad na sukatan (PageWatch) na tumaas ang completion tokens at 2× na latency — sukatin kada provider bago paganahin.

## Resulta ng A/B 2026-07-05 (sa pamamagitan ng OpenRouter — HINDI TAPOS para sa geometry, valid para sa failure modes)

| config | verbatim | abst. | na-filter | silent-wrong |
|---|---|---|---|---|
| fable std 5×8 (AA at 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 hinulaan) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 hinulaan) |
| opus hires 10×16 | **7/9 nabasa** | 0 | 21 walang credits | 2 (digit) |

Mga valid na natuklasan: (1) ang classifier (issue #37) ay ang DOMINANTENG
failure mode para sa mga tanong ng transkripsyon sa standard page — 100%
na-filter — at hindi nagti-trigger sa malaking pahina; mahalaga ang wording.
(2) Gumagana ang abstention: 20× ILEGIVEL kumpara sa 5 confabulations sa
malaking pahina. (3) Nagbabasa ang Opus sa 10×16 nang 78% eksakto (n=9)
kumpara sa 0% na historical sa 5×8 — unang first-hand na ebidensya ng knee.
(4) Iminumungkahi ng illegibility ng malaking pahina sa pamamagitan ng
OpenRouter ang isang transport RESAMPLE (Bedrock/Vertex standard tier?) —
desisibong hypothesis na susubukan sa direktang API ng Anthropic; nananatiling
BUKAS ang A/B ng geometry hanggang doon. Naubos ang credits ng OpenRouter sa
gitna ng Opus arm.

## Huling 2×2 matrix (2026-07-05, sa pamamagitan ng CLI/subscription, Fable 5, n=30/arm)

| page × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 abst. |
| high-res 1928×1928 | **20/30 (67%)** + 10 abst. | 0/30 + 29 abst. |

Zero confabulation sa 4 na arm (120 na tanong — bawat miss ay ILEGIVEL).
INILAPAT: pinalitan ang DENSE_RENDER_STYLE sa 1-bit (aa:false) na may pin sa
tests/dense-style.test.ts. Opus 4.8: 26/30 sa 10×16 sa malaking pahina, 30/30
ILEGIVEL sa 5×8 — viable ang safe mode ng Opus. Nananatiling nadegrada ng mga
transport (CLI Read/OpenRouter resample) ang high-res na pahina; nakadepende
pa rin ang hatol ng geometry na WYSIWYG sa direktang API.
