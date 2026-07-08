# Fork-roadmap — "vores OmniGlyph" + OmniRoute-integration

Konsolideret arbejdsplan (2026-07-05) fra: målt afregnings-sweep,
OpenAI/Gemini-revision mod officiel dokumentation, analyse af beslægtede værktøjer,
og density-frontier-rammeværket. Status for hvert punkt: ☐ afventer · ◐ delvist · ☑ udført her.

## Fase 0 — Målingsgrundlag (UDFØRT i dette repository)

- ☑ Præcis Anthropic-afregning (28px-patches, 2 tiers, +4/blok) — `src/core/anthropic-vision.ts`, sweep i `benchmarks/billing-sweep/`.
- ☑ Profitabilitetsspærring med præcis omkostning (erstattede w·h/750 × 1,10).
- ☑ Geometri per tier: Fable/Opus 4.8/Sonnet 5 → 1928×1928-sider (3,3× færre billeder); standard → 1568×728. 691 tests grønne.
- ☑ `benchmarks/density-frontier/`-rammeværk (offline omkostning × nøjagtighed via API, needles med forvekslelige distraktorer, deterministisk scoring).

## Fase 1 — Rettelser til afregning på tværs af udbydere (bugs bekræftet i revisionen)

Prioritet fastsat af revisionen (officiel dokumentation indhentet 2026-07-05):

1. ☐ **D2 (INVERTERET spærring)**: `gpt-4o-mini` falder ind under standardfliseregimet 85/170, men koster **2833 base / 5667 per flise** (~33× undervurderet, ~0,8 tegn/token) — billeddannelse på den er altid et tab, og spærringen godkender den. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` sendes ubetinget (`src/core/openai.ts:392,402`), men findes kun i gpt-5.4+; udled det fra profilen.
3. ☐ **D1**: `o4-mini`-multiplikator 1,62 → **1,72** (undervurderer med 5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini` er i patch-bucket'en **loft 1536 uden `original`** (koden antager 10000); `gpt-5-codex-mini` er i det forkerte regime (flise → patch).
5. ☐ **GPT-geometri**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (justerer til BEGGE regimer: 64×32-patches og 4×512-fliser; +6,25 % gratis tegn). Dedikeret 5.4/5.5-`original`-profil: op til 1568×5984 (9.163 patches ≤ 10k, ~233k tegn i én blok) — læsbarheds-A/B først.
6. ☐ **Gemini-understøttelse** (ny): `src/core/gemini.ts` + `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`-ruter i proxyen. Dokumenterbar geometri: **1152×1536 (præcis beskæringsenhed 768, 4 fliser, 42,2 tegn/token — bedste dokumenterede forhold af de 3 udbydere)**; hypoteser at kalibrere: 768² med `media_resolution:MEDIUM` (56,4) og Gemini 3 HIGH. Forsigtighed: Geminis OpenAI-kompatible endpoint ville gå gennem OpenAI-transformeren med forkert afregning.

## Fase 2 — Læsekvalitet (density-frontier-rammeværket som dommer)

- ◐ Afgørende std vs. hi-res A/B på Fable (kører; bar: resultat == tekst OG nul stille-forkert OG besparelser > 0).
- ☐ Løs AA vs. 1-bit-modsigelsen i den tætte rendering-sti (koden siger "kun-eval", produktionen bruger AA).
- ☐ (UDSAT med begrundelse 2026-07-06) Glyfkirurgi: produktionskonfigurationen læser 30/30 — der er ingen målbar fejl for kirurgien at rette i dag. Genbesøg hvis et sub-100 %-mål kommer i scope (f.eks. Opus), eller hvis nye målinger viser en regression.
- ☑ ~~Lyst tema-A/B~~ LØST ved inspektion (2026-07-06): renderingen ER ALLEREDE sort-på-hvidt (render.ts:635/822, post-blit-invertering) — i overensstemmelse med litteraturen; hypotesen udsprang af en forkert forudsætning (upstream-eksempelbillede).
- ☐ Ordliste med checksum til byte-nøjagtige id'er (upstream #38, godkendt) + afståelsesbanner (#31/#32) + camelCase i faktaarket (#33/#34).
- ☑ Port #45: $schema/$id bevaret, tupler fjernet per element (commit på main).
- ☑ Genforsøg-ved-afvisning (#37/H11): lossless replay-sniffer + enkelt genforsøg med den oprindelige body; refusalRetried-telemetri (commit på main).
- ☐ Rehydreringsværktøj (`RecoverableBlock` → kaldbart værktøj; LensVLM validerer selektiv genudvidelse).

## Fase 3 — Ydeevne/robusthed

- ☐ LRU-rendering-cache (deterministisk efter invariant; slab + frosne chunks genrenderes ved hver forespørgsel i dag).
- ☐ PNG-kodning i en worker-tråd; konfigurerbart deflate-niveau.
- ☐ Port af åbne upstream-rettelser: #44 (typede native værktøjer → 400), #45 (schema-strip draft-07 → 400-loop), #42 (CONNECT-proxy for Claude Desktop), #19 (GPT-beskrivelser dobbeltafregning).
- ☐ Implementér ADAPTIVE_CPT_PLAN (cpt per blok-rolle; reel slab = 1,50).

## Fase 4 — Forket'en selv

- ☐ Eget navn/repository (Diegos beslutning) + upstream `git remote` til cherry-picks.
- ☐ **TS overalt**: kernen er allerede TS, konvertér `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/` (mønster: tsx + vitest; `benchmarks/density-frontier/` blev født sådan).
- ☐ OmniRoute-kvalitetsstandard: eslint 9 + prettier, CI med typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n (pt-BR først), semantisk CHANGELOG.
- ☐ **GIF'er i stedet for videoer** i README'en (optag med vhs/asciinema+agg; side om side almindelig vs. proxy).
- ☐ Dashboard v2 (genimplementér via HTTP-API — arv ikke tredjepartskode): "åbn terminal med ANTHROPIC_BASE_URL"-launcher, "går trafikken gennem mig?"-tjek, billed-vs-tekst-inspektør, sessioner, omkostningspanel i valuta, let i18n, SSE i stedet for polling, SQLite-persistens med opbevaring (dens 24-kolonne-skema er et godt udgangspunkt).
- ☐ Mikroidéer fra dense-image-gen: `lines`-tilstand (layout bevaret til kode/tabeller), `--keep-ws`, per-side oprindelsestitel ("system prompt" / "tool docs" / "history turn N"), standalone CLI `render arquivo.md -o out.png`.

## Fase 5 — Port til OmniRoute

- ☐ `CompressionEngine`-motor (`cavemanAdapter.ts`-skabelon), registreret i `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ VVS: send `supportsVision` i `chatCore.ts:1297` (1 linje) eller løs via `isVisionModelId`.
- ☐ Stakrækkefølge: sidst (RTK/Caveman/semantiske renderere først; OmniGlyph billeddanner resten).
- ☐ Invarianter: omskriv aldrig blokke med klientens `cache_control` (lektion #4560); fidelity-spærringen (#5127) kræver en erklæret undtagelse eller et tekst-faktaark, der opfylder invarianterne; forsøgstelemetri med `skip_reason` (lektion #4268).
- ☐ Routing: post-motor fallback/genforsøg skal respektere synskapacitet og allowlisten (genkomprimér eller omgå).
- ☐ CCR-synergi: `emitRecoverable` → CCR-lager med per-udsnit-hentning (`head/tail/grep`, #5187) = fuld selektiv genudvidelse.
- ☐ Gratistier-udstrækning som marketing-feature: hver gratistier-token giver ~2-3× flere tegn på synsmodeller; Geminis gratistier + 1152×1536-geometri er det stærkeste eksempel.

## Åbne risici

- Fable-afvisninger efter geninstallation i billeddannet kontekst (upstream #37) — afhjælp før standard-til i OmniRoute.
- Prisarbitrage: hvis Anthropic ompriser vision, ændres besparelserne — den per-forespørgsel-kontrafaktiske værdi (`count_tokens`) er forsvaret.
- OpenAI: fællesskabsmåling (PageWatch) så completion-tokens stige og 2× latenstid — mål per udbyder før aktivering.

## A/B-resultater 2026-07-05 (via OpenRouter — UAFGJORT for geometri, gyldigt for fejltilstande)

| konfiguration | verbatim | afst. | filtreret | stille-forkert |
|---|---|---|---|---|
| fable std 5×8 (AA og 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 forudsagt) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 forudsagt) |
| opus hires 10×16 | **7/9 læst** | 0 | 21 løbet tør for kredit | 2 (ciffer) |

Gyldige fund: (1) klassificeren (issue #37) er den DOMINERENDE fejltilstand
for transskriptionsspørgsmål på standardsiden — 100 % filtreret — og udløses
ikke på den store side; ordlyd betyder noget. (2) Afståelse virker: 20×
ILEGIVEL mod 5 konfabulationer på den store side. (3) Opus ved 10×16 læser 78 %
nøjagtigt (n=9) mod 0 % historisk ved 5×8 — første direkte bevis på knækpunktet.
(4) Den store sides ulæselighed via OpenRouter antyder en transport-
RESAMPLING (Bedrock/Vertex standardtier?) — afgørende hypotese at teste på
Anthropics direkte API; geometri-A/B'en forbliver ÅBEN indtil da. OpenRouter-
kredit løb tør midt i Opus-armen.

## Endelig 2×2-matrix (2026-07-05, via CLI/abonnement, Fable 5, n=30/arm)

| side × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 afst. |
| hi-res 1928×1928 | **20/30 (67 %)** + 10 afst. | 0/30 + 29 afst. |

Nul konfabulation på tværs af de 4 arme (120 spørgsmål — hver eneste fejl var
ILEGIVEL). ANVENDT: DENSE_RENDER_STYLE ændret til 1-bit (aa:false) med en
pin i tests/dense-style.test.ts. Opus 4.8: 26/30 ved 10×16 på den store
side, 30/30 ILEGIVEL ved 5×8 — Opus sikker tilstand er levedygtig. Hi-res-siden
er fortsat degraderet af transporterne (CLI Read/OpenRouter-resampling); den
WYSIWYG-geometriske dom afhænger stadig af det direkte API.
