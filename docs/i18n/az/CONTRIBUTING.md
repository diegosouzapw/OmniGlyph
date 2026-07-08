# OmniGlyph-ə Töhfə Vermək

Marağınıza görə təşəkkürlər! Bu layihənin iki danışıqsız mədəniyyət qaydası var —
onlar README-dəki hər rəqəmin etibarlı olmasının səbəbidir.

## 1-ci Qayda — Ciddi TDD

Bütün istehsalat kodu əvvəlcə uğursuz olan bir testdən doğulur:

1. Testi yazın və **düzgün səbəbdən uğursuz olduğunu görün**.
2. Onu keçirmək üçün minimumu yazın.
3. Yaşıl qalaraq refaktorinq edin.

Tam çərçivə: `pnpm run typecheck && pnpm test && pnpm run build` — üçü də, həmişə
(sənəd link-lint və rebrand qoruyucusu `pnpm test` daxilində `tests/docs-integrity.test.ts`
vasitəsilə işləyir).

## 2-ci Qayda — İddiadan əvvəl ölçmə

Ölçülmüş rəqəm olmadan geometriya, atlas, billinq düsturu və ya model əhatəsinə heç bir
dəyişiklik daxil olmur. Repozitoriya bu prinsip ətrafında qurulub:

- Billinq xərci → `benchmarks/billing-sweep/` ilə sübut edin (`count_tokens` pulsuzdur;
  gözlənilən qalıq: sıfır).
- Oxunaqlılıq → `benchmarks/density-frontier/` ilə sübut edin (qol başına n≥30,
  deterministik qiymətləndirmə, `benchmarks/*/results/`-a commit edilmiş JSONL qəbzləri).
- İstehsalat standartını dəyişmək üçün qəbul çubuğu: gist == mətn əsası **VƏ** sıfır
  sükutlu dəqiq-sətir xətası **VƏ** müsbət qənaət.

Rəqəmsiz hipotezlər `docs/ROADMAP.md`-ə hipotez kimi gedir — heç vaxt README-yə fakt
kimi yox. İki "aydın" fikir artıq məlumatlarla təkzib edilib (yüksək-çözünürlük səhifəsi,
anti-aliased atlas); proses işləyir.

## Quraşdırma

```bash
pnpm install
pnpm test              # tam paket, ~40–90s
pnpm run dev:node      # izləmə rejimində lokal proksi
```

Node ≥18 (CI 20/22/24-ü sınayır), pnpm 10 (package.json-da `packageManager` ilə
sabitlənib).

## Struktur

| qovluq | qayda |
|---|---|
| `src/core/` | işləmə mühitindən asılı olmayan (yalnız Web API-ləri — Node və Workers-də işləyir) |
| `src/node.ts` / `src/worker.ts` | yalnız host boru kəməri |
| `benchmarks/` | yenidən işə salına bilən hərnəslər; JSONL nəticələri commit edilmiş qəbzlərdir |
| `docs/` | benchmarks/ (rəqəmlər), architecture/ (xəritə), ROADMAP (hipotezlər), ops/ (OmniRoute) |

## Commit-lər və PR-lar

- Konvensional commit-lər (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), müvafiq rəqəmlərlə *niyə*-ni izah edən gövdə.
- Kiçik, fokuslanmış PR-lar; davranış dəyişiklikləri onları sabitləyən testlə və,
  tətbiq oluna bilərsə, onları əsaslandıran benchmark ilə gəlir.
- Müştərinin `cache_control` bloklarını yenidən yazmayın, müzakirəsiz işləmə vaxtı
  asılılıqları əlavə etməyin (nüvə qəsdən asılılıqlarda yüngüldür), render yollarında
  `Math.random`/zaman möhürlərindən istifadə etməyin (determinizm bayt-eyniliklə
  sınanan sərt dəyişməzdir).
