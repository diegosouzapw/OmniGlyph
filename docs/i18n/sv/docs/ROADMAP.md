# Fork-färdplan — "vår OmniGlyph" + OmniRoute-integration

Konsoliderad arbetsplan (2026-07-05) från: mätt faktureringsgenomgång,
OpenAI/Gemini-granskning mot officiell dokumentation, analys av relaterade
verktyg, och density-frontier-ramverket. Status för varje post: ☐ väntande
· ◐ delvis · ☑ klar här.

## Fas 0 — Mätningsgrund (KLAR i detta repo)

- ☑ Exakt Anthropic-fakturering (28px-patchar, 2 nivåer, +4/block) —
  `src/core/anthropic-vision.ts`, genomgång i `benchmarks/billing-sweep/`.
- ☑ Lönsamhetsspärr med exakt kostnad (ersatte w·h/750 × 1,10).
- ☑ Geometri per nivå: Fable/Opus 4.8/Sonnet 5 → 1928×1928-sidor (3,3× färre
  bilder); standard → 1568×728. 691 tester gröna.
- ☑ `benchmarks/density-frontier/`-ramverk (offline kostnad × noggrannhet
  via API, nålar med förvillande distraktorer, deterministisk
  poängsättning).

## Fas 1 — Fixar för fakturering hos flera leverantörer (buggar bekräftade i granskningen)

Prioritet satt av granskningen (officiell dokumentation hämtad 2026-07-05):

1. ☐ **D2 (OMVÄND spärr)**: `gpt-4o-mini` hamnar i standardplattan 85/170,
   men kostar **2833 bas / 5667 per platta** (~33× underskattat,
   ~0,8 tecken/token) — avbildning på den är alltid en förlust och spärren
   godkänner den. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` skickas ovillkorligt
   (`src/core/openai.ts:392,402`), men finns bara från gpt-5.4+; härled det
   från profilen.
3. ☐ **D1**: `o4-mini`-multiplikator 1,62 → **1,72** (underskattar med
   5,8 %).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`
   ligger i patchhinken **tak 1536 utan `original`** (koden antar 10000);
   `gpt-5-codex-mini` är i fel regim (platta → patch).
5. ☐ **GPT-geometri**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (anpassar sig till
   BÅDA regimerna: 64×32 patchar och 4×512 plattor; +6,25 % fria tecken).
   Dedikerad 5.4/5.5 `original`-profil: upp till 1568×5984 (9 163 patchar
   ≤ 10k, ~233k tecken i ett block) — läsbarhets-A/B först.
6. ☐ **Gemini-stöd** (nytt): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + `:generateContent`/`:streamGenerateContent`
   -rutter i proxyn. Dokumenterbar geometri: **1152×1536 (exakt
   beskärningsenhet 768, 4 plattor, 42,2 tecken/token — bäst dokumenterade
   förhållandet av de 3 leverantörerna)**; hypoteser att kalibrera: 768²
   med `media_resolution:MEDIUM` (56,4) och Gemini 3 HIGH. Varning:
   Geminis OpenAI-kompatibla slutpunkt skulle gå genom
   OpenAI-transformatorn med felaktig fakturering.

## Fas 2 — Läskvalitet (density-frontier-ramverket som domare)

- ◐ Avgörande std vs high-res A/B på Fable (pågår; ribba: gist == text OCH
  noll tysta-fel OCH besparingar > 0).
- ☐ Lös AA vs 1-bit-motsägelsen i den täta renderingsvägen (koden säger
  "eval-only", produktionen använder AA).
- ☐ (UPPSKJUTEN med motivering 2026-07-06) Glyfkirurgi:
  produktionskonfigurationen läser 30/30 — det finns ingen mätbar missad
  läsning för kirurgin att åtgärda idag. Återbesök om ett mål under 100 %
  kommer in i omfånget (t.ex. Opus) eller om nya mätningar visar en
  regression.
- ☑ ~~Ljust tema-A/B~~ LÖST genom inspektion (2026-07-06): renderingen ÄR
  REDAN svart-på-vitt (render.ts:635/822, invertering efter blit) —
  anpassad till litteraturen; hypotesen föddes ur en felaktig premiss
  (uppströms exempelbild).
- ☐ Ordlista med kontrollsumma för byte-exakta id:n (uppströms #38,
  understödd) + avstående-banner (#31/#32) + camelCase i faktabladet
  (#33/#34).
- ☑ Port #45: $schema/$id bevarat, tuplar strippade per element (commit
  på main).
- ☑ Omförsök vid avvisning (#37/H11): förlustfri uppspelnings-sniffer +
  ett omförsök med den ursprungliga kroppen; refusalRetried-telemetri
  (commit på main).
- ☐ Rehydreringsverktyg (`RecoverableBlock` → anropbart verktyg; LensVLM
  validerar selektiv återexpandering).

## Fas 3 — Prestanda/robusthet

- ☐ LRU-renderingscache (deterministisk genom invariant; slab + frysta
  bitar renderas om vid varje förfrågan idag).
- ☐ PNG-kodning i en arbetstråd; konfigurerbar deflate-nivå.
- ☐ Port av öppna uppströmsfixar: #44 (typade inbyggda verktyg → 400), #45
  (schema-strippning draft-07 → 400-loop), #42 (CONNECT-proxy för Claude
  Desktop), #19 (GPT-beskrivningar dubbelfakturering).
- ☐ Implementera ADAPTIVE_CPT_PLAN (cpt per blockroll; verklig slab = 1,50).

## Fas 4 — Själva forket

- ☐ Eget namn/repo (Diegos beslut) + uppströms `git remote` för
  cherry-picks.
- ☐ **TS överallt**: kärnan är redan TS, konvertera `eval/*.mjs`, `demo/`,
  `scripts/*.mjs`, `bench/` (mönster: tsx + vitest;
  `benchmarks/density-frontier/` föddes så).
- ☐ OmniRoute-kvalitetsstandard: eslint 9 + prettier, CI med
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README-i18n
  (pt-BR först), semantisk CHANGELOG.
- ☐ **GIF:er i stället för videor** i README:n (spela in med
  vhs/asciinema+agg; sida vid sida enkel vs proxy).
- ☐ Instrumentpanel v2 (implementera om via HTTP-API — ärv inte
  tredjepartskod): "öppna terminal med ANTHROPIC_BASE_URL"-startare, "går
  trafiken genom mig?"-kontroll, bild-mot-text-inspektör, sessioner,
  kostnadspanel i valuta, lätt i18n, SSE i stället för polling,
  SQLite-persistens med kvarhållning (dess 24-kolumnsschema är en bra
  utgångspunkt).
- ☐ Mikroidéer från dense-image-gen: `lines`-läge (layout bevarad för
  kod/tabeller), `--keep-ws`, sidursprungstitel per sida ("system prompt" /
  "tool docs" / "history turn N"), fristående CLI
  `render arquivo.md -o out.png`.

## Fas 5 — Portering till OmniRoute

- ☐ `CompressionEngine`-motor (`cavemanAdapter.ts`-mall), registrerad i
  `engines/index.ts` + `engineCatalog.ts`; `targets: ["messages","tool_results"]`,
  `applyAsync`.
- ☐ Rördragning: skicka `supportsVision` i `chatCore.ts:1297` (1 rad) eller
  lös via `isVisionModelId`.
- ☐ Stapelordning: sist (RTK/Caveman/semantiska renderare först; OmniGlyph
  avbildar resten).
- ☐ Invarianter: skriv aldrig om block med klientens `cache_control`
  (lärdom #4560); fidelitetsspärren (#5127) behöver ett deklarerat
  undantag eller ett textfaktablad som uppfyller invarianterna;
  försökstelemetri med `skip_reason` (lärdom #4268).
- ☐ Routing: efter-motor-fallback/omförsök måste respektera
  vision-kapacitet och tillåtelselistan (omkomprimera eller kringgå).
- ☐ CCR-synergi: `emitRecoverable` → CCR-lager med hämtning per skiva
  (`head/tail/grep`, #5187) = full selektiv återexpandering.
- ☐ Gratisnivå-förlängning som marknadsföringsfunktion: varje
  gratisnivå-token ger ~2-3× fler tecken på vision-modeller; Geminis
  gratisnivå + 1152×1536-geometrin är det starkaste fallet.

## Öppna risker

- Fable-avvisningar efter omdistribuering i avbildad kontext (uppströms
  #37) — mildra innan standard-på i OmniRoute.
- Prisarbitrage: om Anthropic omprissätter vision ändras besparingarna —
  motfaktumet per förfrågan (`count_tokens`) är försvaret.
- OpenAI: gemenskapsmätning (PageWatch) såg completion-tokens öka och 2×
  latens — mät per leverantör innan aktivering.

## A/B-resultat 2026-07-05 (via OpenRouter — OAVGJORT för geometri, giltigt för felmoder)

| konfiguration | ordagrant | avstår | filtrerat | tyst-fel |
|---|---|---|---|---|
| fable std 5×8 (AA och 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 förutspådda) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 förutspådda) |
| opus hires 10×16 | **7/9 läst** | 0 | 21 slut på krediter | 2 (siffra) |

Giltiga fynd: (1) klassificeraren (ärende #37) är den DOMINERANDE
felmoden för transkriptionsfrågor på standardsidan — 100 % filtrerat —
och utlöses inte på den stora sidan; formulering spelar roll.
(2) Avstående fungerar: 20× ILEGIVEL mot 5 konfabulationer på den stora
sidan. (3) Opus vid 10×16 läser 78 % exakt (n=9) mot 0 % historiskt vid
5×8 — första direkta beviset på knäet. (4) Den stora sidans oläslighet
via OpenRouter antyder en transport-RESAMPLING (Bedrock/Vertex
standardnivå?) — avgörande hypotes att testa på Anthropics direkta
API; geometri-A/B:n förblir ÖPPEN tills dess. OpenRouter-krediterna tog
slut mitt i Opus-armen.

## Slutlig 2×2-matris (2026-07-05, via CLI/prenumeration, Fable 5, n=30/arm)

| sida × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100 %)** | 25/30 + 5 avstår |
| high-res 1928×1928 | **20/30 (67 %)** + 10 avstår | 0/30 + 29 avstår |

Noll konfabulation över de 4 armarna (120 frågor — varje missad läsning
var ILEGIVEL). TILLÄMPAT: DENSE_RENDER_STYLE ändrad till 1-bit (aa:false)
med en fästning i tests/dense-style.test.ts. Opus 4.8: 26/30 vid 10×16 på
den stora sidan, 30/30 ILEGIVEL vid 5×8 — Opus säkert läge är
genomförbart. Den högupplösta sidan förblir försämrad av transporterna
(CLI Read/OpenRouter-resampling); det slutgiltiga WYSIWYG-geometribeslutet
beror fortfarande på det direkta API:et.
