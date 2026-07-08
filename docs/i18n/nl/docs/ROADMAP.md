# Fork-roadmap — "onze OmniGlyph" + OmniRoute-integratie

Geconsolideerd werkplan (2026-07-05) op basis van: gemeten billing sweep,
OpenAI/Gemini-audit tegen de officiële documentatie, analyse van
gerelateerde tools, en de density-frontier-harness. Status van elk item:
☐ open · ◐ gedeeltelijk · ☑ hier voltooid.

## Fase 0 — Meetfundament (VOLTOOID in deze repo)

- ☑ Exacte Anthropic-billing (28px-patches, 2 tiers, +4/blok) — `src/core/anthropic-vision.ts`, sweep in `benchmarks/billing-sweep/`.
- ☑ Winstgevendheidspoort met exacte kosten (verving w·h/750 × 1,10).
- ☑ Geometrie per tier: Fable/Opus 4.8/Sonnet 5 → 1928×1928-pagina's (3,3× minder afbeeldingen); standaard → 1568×728. 691 tests groen.
- ☑ `benchmarks/density-frontier/` harness (offline kosten × nauwkeurigheid via API, needles met verwarrende afleiders, deterministische scoring).

## Fase 1 — Fixes voor multi-provider billing (bugs bevestigd in de audit)

Prioriteit bepaald door de audit (officiële documentatie vastgelegd op 2026-07-05):

1. ☐ **D2 (OMGEKEERDE poort)**: `gpt-4o-mini` valt in de standaard tegel 85/170, maar kost **2833 basis / 5667 per tegel** (~33× onderschat, ~0,8 teken/token) — het als afbeelding renderen is altijd een verlies en de poort keurt het goed. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` wordt onvoorwaardelijk verstuurd (`src/core/openai.ts:392,402`), maar bestaat alleen vanaf gpt-5.4+; leid het af uit het profiel.
3. ☐ **D1**: `o4-mini`-multiplier 1,62 → **1,72** (onderschat met 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` zitten in de patch-bucket **cap 1536 zonder `original`** (code gaat uit van 10000); `gpt-5-codex-mini` zit in het verkeerde regime (tegel → patch).
5. ☐ **GPT-geometrie**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (lijnt uit met BEIDE regimes: 64×32 patches en 4×512 tegels; +6,25% gratis tekens). Toegewijd 5.4/5.5 `original`-profiel: tot 1568×5984 (9.163 patches ≤ 10k, ~233k tekens in één blok) — eerst leesbaarheids-A/B.
6. ☐ **Gemini-ondersteuning** (nieuw): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`-routes in de proxy. Documenteerbare geometrie: **1152×1536 (exacte crop-eenheid 768, 4 tegels, 42,2 tekens/token — beste gedocumenteerde ratio van de 3 providers)**; te kalibreren gokjes: 768² met `media_resolution:MEDIUM` (56,4) en Gemini 3 HIGH. Let op: Gemini's OpenAI-compat-endpoint zou door de OpenAI-transformer gaan met verkeerde billing.

## Fase 2 — Leeskwaliteit (density-frontier-harness als rechter)

- ◐ Doorslaggevende std vs high-res A/B op Fable (loopt; lat: gist == tekst EN nul stil-verkeerd EN besparingen > 0).
- ☐ Los de AA vs 1-bit-tegenstrijdigheid op in het dense pad (code zegt "eval-only", productie gebruikt AA).
- ☐ (UITGESTELD met motivering 2026-07-06) Glyf-chirurgie: de productieconfiguratie leest 30/30 — er is vandaag geen meetbare misser om de chirurgie voor op te lossen. Herzien als een sub-100%-doel binnen scope komt (bijv. Opus) of als nieuwe metingen een regressie tonen.
- ☑ ~~Light-theme A/B~~ OPGELOST door inspectie (2026-07-06): de render IS AL zwart-op-wit (render.ts:635/822, post-blit invert) — in lijn met de literatuur; de hypothese ontstond uit een verkeerde premisse (upstream voorbeeldafbeelding).
- ☐ Woordenlijst met checksum voor byte-exacte ID's (upstream #38, onderschreven) + onthoudingsbanner (#31/#32) + camelCase in het factsheet (#33/#34).
- ☑ Port #45: $schema/$id behouden, tuples gestript per element (commit op main).
- ☑ Retry-on-refusal (#37/H11): lossless replay-sniffer + enkele retry met de originele body; refusalRetried-telemetrie (commit op main).
- ☐ Rehydrate-tool (`RecoverableBlock` → aanroepbare tool; LensVLM valideert selectieve heruitbreiding).

## Fase 3 — Prestaties/robuustheid

- ☐ LRU-rendercache (deterministisch per invariant; slab + bevroren chunks worden vandaag bij elk verzoek opnieuw gerenderd).
- ☐ PNG-encodering in een workerthread; configureerbaar deflate-niveau.
- ☐ Port open upstream-fixes: #44 (typed native tools → 400), #45 (schema-strip draft-07 → 400-lus), #42 (CONNECT-proxy voor Claude Desktop), #19 (GPT-beschrijvingen dubbele facturering).
- ☐ Implementeer ADAPTIVE_CPT_PLAN (cpt per blokrol; werkelijke slab = 1,50).

## Fase 4 — De fork zelf

- ☐ Eigen naam/repo (Diego's keuze) + upstream `git remote` voor cherry-picks.
- ☐ **TS overal**: de core is al TS, converteer `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (patroon: tsx + vitest; `benchmarks/density-frontier/` is zo ontstaan).
- ☐ OmniRoute-kwaliteitsstandaard: eslint 9 + prettier, CI met typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR eerst), semantische CHANGELOG.
- ☐ **GIF's in plaats van video's** in de README (opnemen met vhs/asciinema+agg; naast elkaar plain vs proxy).
- ☐ Dashboard v2 (herimplementeren via HTTP-API — geen code van derden overnemen): "open terminal met ANTHROPIC_BASE_URL"-launcher, "gaat het verkeer via mij?"-check, image-vs-tekst-inspector, sessies, kostenpaneel in valuta, lichte i18n, SSE in plaats van polling, SQLite-persistentie met retentie (het schema met 24 kolommen is een goed startpunt).
- ☐ Micro-ideeën van dense-image-gen: `lines`-modus (layout behouden voor code/tabellen), `--keep-ws`, titel per pagina-oorsprong ("systeemprompt" / "tool-documentatie" / "geschiedenisbeurt N"), standalone CLI `render arquivo.md -o out.png`.

## Fase 5 — Overzetten naar OmniRoute

- ☐ `CompressionEngine`-engine (`cavemanAdapter.ts`-template), geregistreerd in `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Plumbing: geef `supportsVision` door in `chatCore.ts:1297` (1 regel) of los op via `isVisionModelId`.
- ☐ Stackvolgorde: laatste (RTK/Caveman/semantische renderers eerst; OmniGlyph maakt afbeeldingen van het residu).
- ☐ Invarianten: herschrijf nooit blokken met de `cache_control` van de client (lesson #4560); de fidelity gate (#5127) heeft een verklaarde uitzondering of een tekst-factsheet nodig dat aan de invarianten voldoet; poging-telemetrie met `skip_reason` (lesson #4268).
- ☐ Routering: post-engine fallback/retry moet vision-capaciteit en de allowlist respecteren (opnieuw comprimeren of omzeilen).
- ☐ CCR-synergie: `emitRecoverable` → CCR-store met retrieval per segment (`head/tail/grep`, #5187) = volledige selectieve heruitbreiding.
- ☐ Free-tier-verlenging als marketingfeature: elke free-tier-token levert ~2-3× meer tekens op vision-modellen; Gemini free tier + 1152×1536-geometrie is het sterkste voorbeeld.

## Open risico's

- Fable-weigeringen na herdeploy in ingebeelde context (upstream #37) — mitigeren vóór default-on in OmniRoute.
- Prijsarbitrage: als Anthropic vision herprijst, veranderen de besparingen — het per-verzoek-tegenfeitelijke (`count_tokens`) is de verdediging.
- OpenAI: community-meting (PageWatch) zag completion-tokens stijgen en 2× latency — per provider meten voordat het wordt ingeschakeld.

## A/B-resultaten 2026-07-05 (via OpenRouter — NIET CONCLUSIEF voor geometrie, geldig voor faalmodi)

| config | verbatim | onth. | gefilterd | stil-verkeerd |
|---|---|---|---|---|
| fable std 5×8 (AA en 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 voorspeld) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 voorspeld) |
| opus hires 10×16 | **7/9 gelezen** | 0 | 21 zonder credits | 2 (cijfer) |

Geldige bevindingen: (1) de classifier (issue #37) is de DOMINANTE faalmodus
voor transcriptievragen op de standaardpagina — 100% gefilterd — en treedt
niet op bij de grote pagina; formulering is belangrijk. (2) Onthouding
werkt: 20× ILEGIVEL versus 5 confabulaties op de grote pagina. (3) Opus bij
10×16 leest 78% exact (n=9) versus 0% historisch bij 5×8 — eerste
eerstehands bewijs van de knik. (4) De onleesbaarheid van de grote pagina
via OpenRouter suggereert een transport-RESAMPLE (Bedrock/Vertex
standaardtier?) — beslissende hypothese om te testen op Anthropic's directe
API; de geometrie-A/B blijft OPEN tot dan. OpenRouter-credits raakten op
halverwege de Opus-arm.

## Definitieve 2×2-matrix (2026-07-05, via CLI/abonnement, Fable 5, n=30/arm)

| pagina × atlas | 1-bit | AA |
|---|---|---|
| standaard 1568×728 | **30/30 (100%)** | 25/30 + 5 onth. |
| high-res 1928×1928 | **20/30 (67%)** + 10 onth. | 0/30 + 29 onth. |

Nul confabulatie over de 4 armen (120 vragen — elke misser was ILEGIVEL).
TOEGEPAST: DENSE_RENDER_STYLE omgezet naar 1-bit (aa:false) met een pin in
tests/dense-style.test.ts. Opus 4.8: 26/30 bij 10×16 op de grote pagina,
30/30 ILEGIVEL bij 5×8 — Opus safe mode haalbaar. De high-res-pagina blijft
gedegradeerd door de transporten (CLI Read/OpenRouter-resample); het
WYSIWYG-geometrieoordeel hangt nog steeds af van de directe API.
