# Współtworzenie OmniGlyph

Dziękujemy za zainteresowanie! Ten projekt ma dwie niepodlegające negocjacji
zasady kultury — to dzięki nim każdej liczbie w README można zaufać.

## Zasada 1 — Ścisłe TDD

Cały kod produkcyjny rodzi się z testu, który najpierw zawiódł:

1. Napisz test i **zobacz, jak zawodzi z właściwego powodu**.
2. Napisz minimum, aby przeszedł.
3. Refaktoryzuj, pozostając na zielono.

Pełna poprzeczka to: `pnpm run typecheck && pnpm test && pnpm run build` —
wszystkie trzy, zawsze (kontrola linków w dokumentacji i strażnik rebrandingu
uruchamiają się wewnątrz `pnpm test` przez `tests/docs-integrity.test.ts`).

## Zasada 2 — Pomiar przed twierdzeniami

Żadna zmiana geometrii, atlasu, wzoru rozliczeniowego czy zakresu modeli nie
trafia do repozytorium bez zmierzonej liczby. Repozytorium jest zbudowane
wokół tej dyscypliny:

- Koszt rozliczeniowy → udowodnij go za pomocą `benchmarks/billing-sweep/`
  (`count_tokens` jest darmowe; oczekiwana reszta: zero).
- Czytelność → udowodnij ją za pomocą `benchmarks/density-frontier/` (n≥30
  na wariant, ocena deterministyczna, dowody JSONL zatwierdzone w
  `benchmarks/*/results/`).
- Poprzeczka akceptacji dla zmiany wartości domyślnej w produkcji: wynik
  zgodny z bazą tekstową **ORAZ** zero cichych błędów dokładnego ciągu
  znaków **ORAZ** dodatnie oszczędności.

Hipotezy bez liczb trafiają do `docs/ROADMAP.md` jako hipotezy — nigdy do
README jako fakty. Dwa „oczywiste” pomysły zostały już obalone danymi
(strona wysokiej rozdzielczości, atlas z antyaliasingiem); proces działa.

## Konfiguracja

```bash
pnpm install
pnpm test              # pełny zestaw, ~40–90s
pnpm run dev:node      # lokalny proxy w trybie obserwacji
```

Node ≥18 (CI testuje 20/22/24), pnpm 10 (przypięte przez `packageManager` w
package.json).

## Struktura

| folder | zasada |
|---|---|
| `src/core/` | niezależny od środowiska uruchomieniowego (tylko Web API — działa na Node i Workers) |
| `src/node.ts` / `src/worker.ts` | wyłącznie hydraulika hosta |
| `benchmarks/` | zestawy do ponownego uruchomienia; wyniki JSONL to dowody, zatwierdzone |
| `docs/` | benchmarks/ (liczby), architecture/ (mapa), ROADMAP (hipotezy), ops/ (OmniRoute) |

## Commity i PR-y

- Konwencjonalne commity (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), treść wyjaśniająca *dlaczego* wraz z odpowiednimi
  liczbami.
- Małe, skoncentrowane PR-y; zmiany zachowania przychodzą z testem, który je
  przypina, oraz — jeśli dotyczy — z benchmarkiem, który je uzasadnia.
- Nie przepisuj bloków `cache_control` klienta, nie dodawaj zależności
  uruchomieniowych bez dyskusji (rdzeń jest celowo lekki w zależności), nie
  używaj `Math.random`/znaczników czasu w ścieżkach renderowania
  (determinizm jest twardym niezmiennikiem, testowanym przez identyczność
  bajtową).
