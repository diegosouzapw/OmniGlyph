# Mapa drogowa forka — „nasz OmniGlyph” + integracja z OmniRoute

Skonsolidowany plan pracy (2026-07-05) na podstawie: zmierzonego sweepu
rozliczeniowego, audytu OpenAI/Gemini względem oficjalnej dokumentacji,
analizy powiązanych narzędzi oraz zestawu density-frontier. Status każdej
pozycji: ☐ oczekujące · ◐ częściowe · ☑ wykonane tutaj.

## Faza 0 — Fundament pomiarowy (WYKONANE w tym repozytorium)

- ☑ Dokładne rozliczenia Anthropic (płatki 28px, 2 poziomy, +4/blok) —
  `src/core/anthropic-vision.ts`, sweep w `benchmarks/billing-sweep/`.
- ☑ Bramka opłacalności z dokładnym kosztem (zastąpiono w·h/750 × 1,10).
- ☑ Geometria per poziom: Fable/Opus 4.8/Sonnet 5 → strony 1928×1928 (3,3×
  mniej obrazów); standard → 1568×728. 691 testów zielonych.
- ☑ Zestaw `benchmarks/density-frontier/` (offline koszt × dokładność przez
  API, needles z myląco podobnymi dystraktorami, ocena deterministyczna).

## Faza 1 — Poprawki rozliczeń wieloproviderowych (błędy potwierdzone w audycie)

Priorytet ustalony przez audyt (oficjalna dokumentacja przechwycona
2026-07-05):

1. ☐ **D2 (ODWRÓCONA bramka)**: `gpt-4o-mini` wpada do domyślnego kafelka
   85/170, ale kosztuje **2833 bazowo / 5667 na kafelek** (~33× niedoszacowane,
   ~0,8 znaku/token) — obraz na tym modelu to zawsze strata, a bramka to
   zatwierdza. `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` jest wysyłane bezwarunkowo
   (`src/core/openai.ts:392,402`), ale istnieje tylko od gpt-5.4+; wyprowadź
   to z profilu.
3. ☐ **D1**: mnożnik `o4-mini` 1,62 → **1,72** (niedoszacowanie o 5,8%).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`
   są w koszyku patch **z limitem 1536 bez `original`** (kod zakłada
   10000); `gpt-5-codex-mini` jest w złym reżimie (kafelek → patch).
5. ☐ **Geometria GPT**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (dopasowuje się do
   OBU reżimów: płatki 64×32 i kafelki 4×512; +6,25% darmowych znaków).
   Dedykowany profil `original` 5.4/5.5: do 1568×5984 (9163 płatki ≤ 10k,
   ~233 tys. znaków w jednym bloku) — najpierw test A/B czytelności.
6. ☐ **Wsparcie dla Gemini** (nowe): `src/core/gemini.ts` +
   `gemini-model-profiles.ts` + trasy `:generateContent`/
   `:streamGenerateContent` w proxy. Udokumentowana geometria: **1152×1536
   (dokładna jednostka przycięcia 768, 4 kafelki, 42,2 znaku/token —
   najlepszy udokumentowany współczynnik z 3 dostawców)**; zakłady do
   skalibrowania: 768² z `media_resolution:MEDIUM` (56,4) i Gemini 3 HIGH.
   Uwaga: punkt końcowy Gemini kompatybilny z OpenAI przechodziłby przez
   transformator OpenAI z błędnym rozliczeniem.

## Faza 2 — Jakość odczytu (zestaw density-frontier jako sędzia)

- ◐ Rozstrzygający A/B std vs high-res na Fable (w trakcie; poprzeczka:
  wynik zgodny z bazą tekstową ORAZ zero cichych błędów ORAZ oszczędności
  > 0).
- ☐ Rozwiązać sprzeczność AA vs 1-bit w gęstej ścieżce (kod mówi
  „eval-only”, produkcja używa AA).
- ☐ (ODROCZONE z uzasadnieniem 2026-07-06) Chirurgia glifów: konfiguracja
  produkcyjna odczytuje 30/30 — nie ma dziś mierzalnego niepowodzenia,
  które chirurgia miałaby naprawić. Wrócić do tego, jeśli w zakresie
  pojawi się cel poniżej 100% (np. Opus) lub jeśli nowe pomiary pokażą
  regresję.
- ☑ ~~A/B trybu jasnego~~ ROZWIĄZANE przez inspekcję (2026-07-06): render
  JUŻ JEST czarny na białym (render.ts:635/822, odwrócenie po blicie) —
  zgodne z literaturą; hipoteza wzięła się z błędnej przesłanki (przykładowy
  obraz upstream).
- ☐ Lista słów z sumą kontrolną dla identyfikatorów dokładnych co do bajtu
  (upstream #38, zatwierdzone) + baner wstrzymania (#31/#32) + camelCase w
  arkuszu faktów (#33/#34).
- ☑ Port #45: `$schema`/`$id` zachowane, krotki usunięte per element (commit
  na main).
- ☑ Ponawianie przy odmowie (#37/H11): sniffer odtwarzania bezstratnego +
  pojedyncze ponowienie z oryginalną treścią; telemetria refusalRetried
  (commit na main).
- ☐ Narzędzie rehydratacji (`RecoverableBlock` → wywoływalne narzędzie;
  LensVLM waliduje selektywne ponowne rozwinięcie).

## Faza 3 — Wydajność/odporność

- ☐ Pamięć podręczna LRU renderowania (deterministyczna przez niezmiennik;
  dziś slab + zamrożone fragmenty renderują się ponownie przy każdym
  zapytaniu).
- ☐ Kodowanie PNG w wątku roboczym; konfigurowalny poziom deflate.
- ☐ Port otwartych poprawek upstream: #44 (typowane narzędzia natywne →
  400), #45 (pętla schema-strip draft-07 → 400), #42 (proxy CONNECT dla
  Claude Desktop), #19 (podwójne rozliczanie opisów GPT).
- ☐ Wdrożyć ADAPTIVE_CPT_PLAN (cpt per rola bloku; rzeczywisty slab = 1,50).

## Faza 4 — Sam fork

- ☐ Własna nazwa/repozytorium (decyzja Diega) + `git remote` upstream dla
  cherry-picków.
- ☐ **TS wszędzie**: rdzeń jest już w TS, przekonwertować `eval/*.mjs`,
  `demo/`, `scripts/*.mjs`, `bench/` (wzorzec: tsx + vitest;
  `benchmarks/density-frontier/` powstało w ten sposób).
- ☐ Standard jakości OmniRoute: eslint 9 + prettier, CI z
  typecheck/test/build/link-check, CONTRIBUTING, SECURITY, README i18n
  (najpierw pt-BR), semantyczny CHANGELOG.
- ☐ **GIFy zamiast filmów** w README (nagrywanie przez vhs/asciinema+agg;
  porównanie plain vs proxy obok siebie).
- ☐ Panel v2 (reimplementacja przez API HTTP — bez dziedziczenia kodu
  zewnętrznego): uruchamianie „otwórz terminal z ANTHROPIC_BASE_URL”,
  sprawdzenie „czy ruch przechodzi przeze mnie?”, inspektor obraz-vs-tekst,
  sesje, panel kosztów w walucie, lekkie i18n, SSE zamiast pollingu,
  trwałość SQLite z retencją (schemat 24 kolumn to dobry punkt wyjścia).
- ☐ Mikropomysły z dense-image-gen: tryb `lines` (zachowany układ dla
  kodu/tabel), `--keep-ws`, tytuł pochodzenia per strona („system prompt” /
  „dokumentacja narzędzi” / „tura historii N”), samodzielne CLI
  `render arquivo.md -o out.png`.

## Faza 5 — Port do OmniRoute

- ☐ Silnik `CompressionEngine` (szablon `cavemanAdapter.ts`),
  zarejestrowany w `engines/index.ts` + `engineCatalog.ts`;
  `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Hydraulika: przekazać `supportsVision` w `chatCore.ts:1297` (1 linia)
  lub rozwiązywać przez `isVisionModelId`.
- ☐ Kolejność stosu: ostatni (najpierw renderery RTK/Caveman/semantyczne;
  OmniGlyph zamienia resztę na obraz).
- ☐ Niezmienniki: nigdy nie przepisywać bloków z `cache_control` klienta
  (lekcja #4560); bramka wierności (#5127) potrzebuje zadeklarowanego
  wyjątku lub arkusza faktów tekstowych, który spełnia niezmienniki;
  telemetria próby z `skip_reason` (lekcja #4268).
- ☐ Routing: ponowienie/fallback po silniku musi respektować możliwość
  obsługi wizji i listę dozwolonych (ponowna kompresja lub ominięcie).
- ☐ Synergia z CCR: `emitRecoverable` → magazyn CCR z odzyskiwaniem per
  fragment (`head/tail/grep`, #5187) = pełne selektywne ponowne
  rozwinięcie.
- ☐ Rozciąganie darmowego poziomu jako funkcja marketingowa: każdy token
  darmowego poziomu daje ~2-3× więcej znaków na modelach wizji; darmowy
  poziom Gemini + geometria 1152×1536 to najmocniejszy przypadek.

## Otwarte ryzyka

- Odmowy Fable po ponownym wdrożeniu w kontekście przekształconym na obraz
  (upstream #37) — złagodzić przed domyślnym włączeniem w OmniRoute.
- Arbitraż cenowy: jeśli Anthropic zmieni ceny wizji, oszczędności się
  zmienią — kontrfaktyczny `count_tokens` per zapytanie jest obroną.
- OpenAI: pomiar społecznościowy (PageWatch) zaobserwował wzrost tokenów
  ukończenia i 2× opóźnienia — mierzyć per dostawca przed włączeniem.

## Wyniki A/B 2026-07-05 (przez OpenRouter — NIEROZSTRZYGAJĄCE dla geometrii, ważne dla trybów awarii)

| konfiguracja | dosłowne | wstrzym. | odfiltrowane | ciche błędy |
|---|---|---|---|---|
| fable std 5×8 (AA i 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 przewidziane) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 przewidziane) |
| opus hires 10×16 | **7/9 odczytane** | 0 | 21 poza kredytami | 2 (cyfra) |

Ważne ustalenia: (1) klasyfikator (issue #37) jest DOMINUJĄCYM trybem
awarii dla pytań transkrypcyjnych na standardowej stronie — 100%
odfiltrowane — i nie uruchamia się na dużej stronie; sformułowanie ma
znaczenie. (2) Wstrzymanie działa: 20× ILEGIVEL vs 5 konfabulacji na
dużej stronie. (3) Opus przy 10×16 odczytuje 78% dokładnie (n=9) vs 0%
historyczne przy 5×8 — pierwszy naoczny dowód załamania krzywej.
(4) Nieczytelność dużej strony przez OpenRouter sugeruje RESAMPLE w
transporcie (Bedrock/Vertex poziom standardowy?) — decydująca hipoteza
do przetestowania na bezpośrednim API Anthropic; A/B geometrii pozostaje
OTWARTY do tego czasu. Kredyty OpenRouter skończyły się w połowie
ramienia Opus.

## Ostateczna macierz 2×2 (2026-07-05, przez CLI/subskrypcję, Fable 5, n=30/ramię)

| strona × atlas | 1-bit | AA |
|---|---|---|
| standard 1568×728 | **30/30 (100%)** | 25/30 + 5 wstrzym. |
| wysoka rozdz. 1928×1928 | **20/30 (67%)** + 10 wstrzym. | 0/30 + 29 wstrzym. |

Zero konfabulacji w 4 ramionach (120 pytań — każda pomyłka to ILEGIVEL).
ZASTOSOWANE: DENSE_RENDER_STYLE przełączone na 1-bit (aa:false) z pinem w
tests/dense-style.test.ts. Opus 4.8: 26/30 przy 10×16 na dużej stronie,
30/30 ILEGIVEL przy 5×8 — tryb bezpieczny Opus wykonalny. Strona wysokiej
rozdzielczości pozostaje zdegradowana przez transporty (CLI Read/resample
OpenRouter); werdykt geometrii WYSIWYG wciąż zależy od bezpośredniego API.
