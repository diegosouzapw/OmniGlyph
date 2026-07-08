# Mimari

Kod tabanının tek sayfalık haritası.

## İstek pipeline'ı

```
istemci (Claude Code / herhangi bir SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        host'lar (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  tek Web-standart fetch handler'ı:
  │                                yönlendirme, auth geçişi, count_tokens
  │                                karşı olgusu, kullanım/telemetri olayları
  ▼
src/core/transform.ts              PIPELINE'IN KENDİSİ (Anthropic yolu):
  │   1. gövdeyi ayrıştır, modelden görüntü katmanını çöz
  │   2. kârlılık kapısı — tam görüntü maliyeti vs metin maliyeti
  │   3. dönüştür: statik slab · büyük tool_results · daraltılmış geçmiş
  │   4. istemcinin cache_control çapalarını koruyarak geri ekle
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## Faturalama (tam, ölçülmüş)

| modül | sağlayıcı | model |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | 28 px parça + blok başına 4, katman başına yeniden boyutlandırma sınırları; sayfa geometrisi (her iki katman da standart 1568×728 sayfayı render eder — yüksek çözünürlüklü katman bir faturalama tuzağıdır, bkz. [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | model başına parça/döşeme rejimleri, profil başına `detail`, şerit geometrisi |
| `src/core/gemini-model-profiles.ts` | Google | döşeme formülü (`floor(min/1.5)` kırpma birimi) + `media_resolution` sabit maliyetleri |

## Render

- `src/core/render.ts` — pişirilmiş bir glif atlası (Spleen 5×8 + Unifont
  yedeği) üzerinden metin → PNG, `↵` yeni satır sentinelleriyle yeniden akış,
  üretimde 1-bit atlas (Fable'da AA'dan daha iyi ölçülmüş).
- `src/core/render-cache.ts` — deterministik render'ların LRU
  ezberlemesi (statik slab + dondurulmuş geçmiş parçaları, aksi halde her
  istekte yeniden render edilir).
- `src/core/history.ts` — eski turları, prompt önbelleğinin isabet almaya
  devam etmesi için byte-özdeş kalan yalnızca-ekleme dondurulmuş görüntü
  parçalarına daraltır.
- `src/core/png.ts` — minimal deterministik PNG kodlayıcı (native
  bağımlılık yok).

## Koruma önlemleri

- Model izin listesi (`src/core/applicability.ts`): yalnızca okuma
  benchmark'ını geçen modeller görüntülenir; diğer her şey byte-özdeş
  geçer.
- Byte-tam değerler (SHA'lar, id'ler) görüntünün yanında bir fact sheet'te
  metin olarak taşınır (`src/core/factsheet.ts`); `emitRecoverable`
  aracılığıyla kurtarılabilir orijinaller.
- Native yazılı araçlar (`type !== 'custom'`) asla yeniden yazılmaz (400
  koruması).

## Benchmark'lar & kanıtlar

`benchmarks/`, README'deki her rakamı üreten iki harness'i barındırır — bkz.
[benchmarks/README.md](../../benchmarks/README.md).
