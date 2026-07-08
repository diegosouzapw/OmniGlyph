# OmniGlyph'e Katkıda Bulunmak

İlginiz için teşekkürler! Bu projenin iki pazarlık edilemez kültür kuralı var
— README'deki her rakamın güvenilir olmasının nedeni bunlar.

## Kural 1 — Sıkı TDD

Tüm üretim kodu önce başarısız olan bir testten doğar:

1. Testi yazın ve **doğru sebepten dolayı başarısız olduğunu görün**.
2. Geçmesi için minimum kodu yazın.
3. Yeşil kalırken yeniden düzenleyin.

Tam çıta şudur: `pnpm run typecheck && pnpm test && pnpm run build` — her
üçü de, her zaman (docs link-lint ve rebrand koruyucusu, `pnpm test` içinde
`tests/docs-integrity.test.ts` aracılığıyla çalışır).

## Kural 2 — İddiadan önce ölçüm

Geometri, atlas, faturalama formülü veya model kapsamına yapılan hiçbir
değişiklik ölçülmüş bir rakam olmadan yayınlanmaz. Depo bu disiplin
etrafında inşa edilmiştir:

- Faturalama maliyeti → `benchmarks/billing-sweep/` ile kanıtlayın
  (`count_tokens` ücretsizdir; beklenen kalıntı: sıfır).
- Okunabilirlik → `benchmarks/density-frontier/` ile kanıtlayın (kol başına
  n≥30, deterministik puanlama, `benchmarks/*/results/` içine işlenen JSONL
  kanıtları).
- Bir üretim varsayılanını değiştirmek için kabul çıtası: gist == metin
  taban çizgisi **VE** sıfır sessiz tam-string hatası **VE** pozitif
  tasarruf.

Rakamsız hipotezler `docs/ROADMAP.md`'ye hipotez olarak gider — asla
README'ye gerçek olarak girmez. "Açık" görünen iki fikir zaten verilerle
çürütüldü (yüksek çözünürlüklü sayfa, anti-aliased atlas); süreç çalışıyor.

## Kurulum

```bash
pnpm install
pnpm test              # tam paket, ~40–90s
pnpm run dev:node      # izleme modunda yerel proxy
```

Node ≥18 (CI 20/22/24 test eder), pnpm 10 (package.json içindeki
`packageManager` ile sabitlenmiş).

## Yapı

| klasör | kural |
|---|---|
| `src/core/` | runtime-agnostik (yalnızca Web API'leri — Node ve Workers üzerinde çalışır) |
| `src/node.ts` / `src/worker.ts` | yalnızca host tesisatı |
| `benchmarks/` | yeniden çalıştırılabilir harness'ler; JSONL sonuçları kanıttır, işlenir |
| `docs/` | benchmarks/ (rakamlar), architecture/ (harita), ROADMAP (hipotezler), ops/ (OmniRoute) |

## Commit'ler ve PR'lar

- Conventional commits (`feat:`, `fix:`, `perf:`, `docs:`, `refactor:`,
  `test:`, `chore:`), gövde ilgili rakamlarla *neden*'i açıklar.
- Küçük, odaklı PR'lar; davranış değişiklikleri onları sabitleyen test ile
  ve uygulanabilir olduğunda onları haklı çıkaran benchmark ile birlikte gelir.
- İstemcinin `cache_control` bloklarını yeniden yazmayın, tartışma olmadan
  runtime bağımlılığı eklemeyin (core kasıtlı olarak bağımlılık açısından
  hafiftir), render yollarında `Math.random`/zaman damgaları kullanmayın
  (determinizm, byte-özdeşliğiyle test edilen sabit bir değişmezdir).
