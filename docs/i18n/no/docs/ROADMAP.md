# Fork-veikart — "vår OmniGlyph" + OmniRoute-integrasjon

Konsolidert arbeidsplan (2026-07-05) fra: målt faktureringssveip,
OpenAI/Gemini-revisjon mot offisiell dokumentasjon, analyse av beslektede
verktøy, og density-frontier-riggen. Status for hvert punkt: ☐ venter · ◐ delvis · ☑ gjort her.

## Fase 0 — Målingsgrunnlag (FERDIG i dette repoet)

- ☑ Eksakt Anthropic-fakturering (28px-patcher, 2 nivåer, +4/blokk) — `src/core/anthropic-vision.ts`, sveip i `benchmarks/billing-sweep/`.
- ☑ Lønnsomhetsport med eksakt kostnad (erstattet w·h/750 × 1,10).
- ☑ Nivåvis geometri: Fable/Opus 4.8/Sonnet 5 → 1928×1928-sider (3,3× færre bilder); standard → 1568×728. 691 tester grønne.
- ☑ `benchmarks/density-frontier/`-riggen (offline kostnad × nøyaktighet via API, needles med forvekslende distraktorer, deterministisk scoring).

## Fase 1 — Faktureringsfeil for flere leverandører (bugs bekreftet i revisjonen)

Prioritet satt av revisjonen (offisiell dokumentasjon fanget 2026-07-05):

1. ☐ **D2 (INVERTERT port)**: `gpt-4o-mini` faller inn i standardflisen 85/170, men koster **2833 base / 5667 per flis** (~33× undervurdert, ~0,8 tegn/token) — avbildning på den er alltid et tap, og porten godkjenner den. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` sendes ubetinget (`src/core/openai.ts:392,402`), men finnes kun i gpt-5.4+; utled den fra profilen.
3. ☐ **D1**: `o4-mini`-multiplikator 1,62 → **1,72** (undervurderer med 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` er i patch-bøtten **tak 1536 uten `original`** (koden antar 10000); `gpt-5-codex-mini` er i feil regime (flis → patch).
5. ☐ **GPT-geometri**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (justerer med BEGGE regimer: 64×32 patcher og 4×512 fliser; +6,25 % gratis tegn). Dedikert 5.4/5.5 `original`-profil: opptil 1568×5984 (9 163 patcher ≤ 10k, ~233k tegn i én blokk) — lesbarhets-A/B først.
6. ☐ **Gemini-støtte** (ny): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`-ruter i proxyen. Dokumenterbar geometri: **1152×1536 (eksakt beskjæringsenhet 768, 4 fliser, 42,2 tegn/token — best dokumenterte forhold av de 3 leverandørene)**; veddemål å kalibrere: 768² med `media_resolution:MEDIUM` (56,4) og Gemini 3 HIGH. Forsiktighet: Geminis OpenAI-kompatible endepunkt ville gå gjennom OpenAI-transformatoren med feil fakturering.

## Fase 2 — Lesekvalitet (density-frontier-riggen som dommer)

- ◐ Avgjørende std vs høyoppløsnings-A/B på Fable (pågår; terskel: resultat == tekst OG null stille-feil OG besparelser > 0).
- ☐ Løs AA-vs-1-bit-motsigelsen i den tette stien (koden sier "kun-eval", produksjon bruker AA).
- ☐ (UTSATT med begrunnelse 2026-07-06) Glyffkirurgi: produksjonskonfigurasjonen leser 30/30 — det finnes ingen målbar bom for kirurgien å fikse i dag. Revurder hvis et under-100%-mål kommer inn i omfanget (f.eks. Opus) eller hvis nye målinger viser en regresjon.
- ☑ ~~Lyst-tema A/B~~ LØST ved inspeksjon (2026-07-06): rendringen ER ALLEREDE svart-på-hvitt (render.ts:635/822, post-blit-invertering) — i tråd med litteraturen; hypotesen ble født fra en feil premiss (oppstrøms eksempelbilde).
- ☐ Ordliste med sjekksum for byte-eksakte ID-er (oppstrøms #38, godkjent) + avstandsbanner (#31/#32) + camelCase i faktaarket (#33/#34).
- ☑ Port #45: $schema/$id bevart, tupler strippet per element (commit på main).
- ☑ Gjenforsøk-ved-avslag (#37/H11): tapsfri gjenavspillingssniffer + ett gjenforsøk med den opprinnelige kroppen; refusalRetried-telemetri (commit på main).
- ☐ Rehydreringsverktøy (`RecoverableBlock` → kallbart verktøy; LensVLM validerer selektiv gjenutvidelse).

## Fase 3 — Ytelse/robusthet

- ☐ LRU-rendringscache (deterministisk etter invariant; slab + frosne biter rendres på nytt ved hver forespørsel i dag).
- ☐ PNG-koding i en worker-tråd; konfigurerbart deflate-nivå.
- ☐ Port åpne oppstrøms-rettelser: #44 (typede native verktøy → 400), #45 (skjema-strip draft-07 → 400-løkke), #42 (CONNECT-proxy for Claude Desktop), #19 (GPT-beskrivelser dobbeltfakturering).
- ☐ Implementer ADAPTIVE_CPT_PLAN (cpt per blokkrolle; reell slab = 1,50).

## Fase 4 — Selve forken

- ☐ Eget navn/repo (Diegos avgjørelse) + oppstrøms `git remote` for cherry-picks.
- ☐ **TS overalt**: kjernen er allerede TS, konverter `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (mønster: tsx + vitest; `benchmarks/density-frontier/` ble født slik).
- ☐ OmniRoute-kvalitetsstandard: eslint 9 + prettier, CI med typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR først), semantisk CHANGELOG.
- ☐ **GIF-er i stedet for videoer** i README-en (ta opp med vhs/asciinema+agg; side-om-side enkel vs proxy).
- ☐ Dashbord v2 (reimplementer via HTTP API — ikke arv tredjepartskode): "åpne terminal med ANTHROPIC_BASE_URL"-launcher, "går trafikken gjennom meg?"-sjekk, bilde-vs-tekst-inspektør, økter, kostnadspanel i valuta, lett i18n, SSE i stedet for polling, SQLite-persistens med oppbevaring (dens 24-kolonneskjema er et godt utgangspunkt).
- ☐ Mikroidéer fra dense-image-gen: `lines`-modus (layout bevart for kode/tabeller), `--keep-ws`, per-side opprinnelsestittel ("systemprompt" / "verktøydokumentasjon" / "historikkrunde N"), frittstående CLI `render arquivo.md -o out.png`.

## Fase 5 — Port til OmniRoute

- ☐ `CompressionEngine`-motor (`cavemanAdapter.ts`-mal), registrert i `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Rørlegging: send `supportsVision` i `chatCore.ts:1297` (1 linje) eller løs via `isVisionModelId`.
- ☐ Stabelrekkefølge: sist (RTK/Caveman/semantiske renderere først; OmniGlyph avbilder resten).
- ☐ Invarianter: aldri skriv om blokker med klientens `cache_control` (lærdom #4560); troverdighetsporten (#5127) trenger et deklarert unntak eller et tekstfaktaark som tilfredsstiller invariantene; forsøkstelemetri med `skip_reason` (lærdom #4268).
- ☐ Ruting: etter-motor-fallback/gjenforsøk må respektere synskapasitet og tillatelseslisten (rekomprimer eller omgå).
- ☐ CCR-synergi: `emitRecoverable` → CCR-lager med per-skive-henting (`head/tail/grep`, #5187) = full selektiv gjenutvidelse.
- ☐ Gratisnivå-strekking som en markedsføringsfunksjon: hver gratisnivå-token gir ~2-3× flere tegn på synsmodeller; Gemini gratisnivå + 1152×1536-geometri er det sterkeste tilfellet.

## Åpne risikoer

- Fable-avslag etter omfordeling i avbildet kontekst (oppstrøms #37) — demp før standard-på i OmniRoute.
- Prisarbitrasje: hvis Anthropic prissetter syn på nytt, endrer besparelsene seg — den per-forespørsel-motfaktiske verdien (`count_tokens`) er forsvaret.
- OpenAI: fellesskapsmåling (PageWatch) så fullføringstokens stige og 2× latens — mål per leverandør før aktivering.

## A/B-resultater 2026-07-05 (via OpenRouter — UAVGJORT for geometri, gyldig for feilmoduser)

| konfig | ordrett | avst. | filtrert | stille-feil |
|---|---|---|---|---|
| fable std 5×8 (AA og 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 forutsagt) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 forutsagt) |
| opus hires 10×16 | **7/9 lest** | 0 | 21 tomt for kreditter | 2 (siffer) |

Gyldige funn: (1) klassifikatoren (issue #37) er den DOMINERENDE
feilmodusen for transkripsjonsspørsmål på standardsiden — 100 % filtrert —
og utløses ikke på den store siden; ordlyd betyr noe. (2) Avstandsevne
fungerer: 20× ILEGIVEL mot 5 konfabulasjoner på den store siden. (3) Opus
ved 10×16 leser 78 % eksakt (n=9) mot 0 % historisk ved 5×8 — første
førstehåndsbevis for kneet. (4) Den store sidens ulesbarhet via OpenRouter
antyder en transport-RESAMPLE (Bedrock/Vertex standardnivå?) — avgjørende
hypotese å teste på Anthropics direkte API; geometri-A/B-en forblir ÅPEN
til da. OpenRouter-kreditter ble oppbrukt midt i Opus-armen.

## Endelig 2×2-matrise (2026-07-05, via CLI/abonnement, Fable 5, n=30/arm)

| side × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 avst. |
| høyoppløsning 1928×1928 | **20/30 (67 %)** + 10 avst. | 0/30 + 29 avst. |

Null konfabulasjon på tvers av de 4 armene (120 spørsmål — hver bom var
ILEGIVEL). ANVENDT: DENSE_RENDER_STYLE vippet til 1-bit (aa:false) med en
pinning i tests/dense-style.test.ts. Opus 4.8: 26/30 ved 10×16 på den store
siden, 30/30 ILEGIVEL ved 5×8 — Opus sikker modus levedyktig.
Høyoppløsningssiden forblir degradert av transportene (CLI Read/OpenRouter-
resampling) — WYSIWYG-geometridommen avhenger fortsatt av det direkte API-et.
