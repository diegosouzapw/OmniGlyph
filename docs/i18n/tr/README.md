🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="Gerçek bir render: system prompt + araç dokümanları 1568×728 boyutunda yoğun tek bir sayfada paketlenmiş" width="820"/>

<br/>

# 🖼️ OmniGlyph — Görüntü Olarak Bağlam

### Hacimli bağlamı yoğun PNG sayfalar olarak render ederek Claude faturanızı **%59–70** azaltın — aynı içerik, tokenların çok küçük bir kısmında.

**Modeller metni token başına faturalandırır, ancak görüntüyü boyutlarına göre faturalandırır — içinde ne kadar metin olduğuna göre değil.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-rakamlar--tahmin-deil-lm)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-drst-ksm)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) ailesinin bir parçası · [🌐 All languages](../../../docs/i18n/README.md)

</div>

---

# 📊 Rakamlar — tahmin değil, ölçüm

| metrik | sonuç | kanıt |
|---|---|---|
| Uçtan uca fatura azalması | **%59–70** | üretim izi, 13.709 istek |
| Dönüştürülen blok başına token | **10× daha az** (28.080 karakter: 14.040 → 1.460 token) | [billing sweep](benchmarks/billing-sweep/README.md) |
| Faturalama formülü doğruluğu | 22 `count_tokens` probunda, 2 model × 2 katmanda **sıfır** kalıntı | `benchmarks/billing-sweep/results/` |
| Üretim yapılandırmasında tam okuma doğruluğu | Claude Fable 5'te **30/30 (%100)** | [density frontier](benchmarks/density-frontier/README.md) |
| ~300 okuma probunda sessiz uydurma | **0** — her başarısızlık `ILEGIVEL` olarak çekimser kalıyor | `benchmarks/density-frontier/results/` |

**Model karnesi** (yoğun render'ları okuyabiliyor mu? kol başına n=30, deterministik puanlama):

| model | okuma | karar |
|---|---|---|
| Claude **Fable 5** | **%100** tam | ✅ üretim hedefi |
| Claude Opus 4.8 | 4× glif boyutunda %77–87 | ⚠️ opt-in güvenli mod (tasarruf ~2×'ye düşer) |
| GPT-5.5 | 0/60 — ve denerken cevaplarını ~40× şişiriyor | ❌ kapı tarafından engellendi, kanıtlı |
| Gemini 2.5-flash | 0/26 — ve çekimser kalmak yerine uyduruyor | ❌ engellendi (kısmi test, kota sınırlı) |

Avantaj bugün için **Fable'a özgü** — diğer görüntü kodlayıcılar henüz yoğun glifleri çözemiyor. [Benchmark harness](benchmarks/README.md) yeni herhangi bir modeli tek komutla yeniden test eder.

# 🤔 Neden OmniGlyph?

Uzun süre çalışan her ajan oturumu, her istekte aynı ölü ağırlığı sürükler: system prompt, araç dokümanları ve eski geçmiş — her turda token başına yeniden faturalandırılır. OmniGlyph, bu hacimli parçaları *makinenizden çıkmadan önce* yoğun PNG sayfalara dönüştüren **yerel bir proxy**'dir:

- **Sezgisel değil, tam faturalama matematiği** — sağlayıcının gerçek görüntü-token formülünü hesaplar (sıfır kalıntıya kadar ölçülmüş) ve yalnızca matematik kazandığında dönüştürür.
- **Tasarım gereği fail-closed** — yoğun render'ları okuyamayan modeller, benchmark kanıtlarıyla bir kapı tarafından engellenir. Sessiz kalite kaybı yoktur.
- **Özel ve yerel öncelikli** — yeniden yazma `127.0.0.1` üzerinde gerçekleşir; hiçbir yere fazladan bir şey gönderilmez.
- **Yeniden üretilebilir** — yukarıdaki her rakamın `benchmarks/*/results/` içinde bir kanıtı vardır, tek komutla yeniden çalıştırılabilir.

# ⚡ Hızlı Başlangıç

```bash
npx omniglyph                                     # proxy 127.0.0.1:47821'de
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # Claude Code'u ona yönlendirin
```

![Hızlı başlangıç: proxy'yi başlat, dashboard'u kontrol et, Claude Code'u ona yönlendir](../../../docs/assets/demo-quickstart.gif)

Her iki şekilde de çalışır:
- **API anahtarı** (token başına ödeme): faturanız uçtan uca %59–70 düşer.
- **Abonelik oturumu**: daha az ödemezsiniz, ancak kullanım limitleri token cinsinden sayılır — bu yüzden limitleriniz **~2–3×** uzar.

<http://127.0.0.1:47821/> adresindeki dashboard: kaydedilen tokenlar, yan yana her metin→görüntü dönüşümü, kill switch, canlı model çipleri. Yanıtlar normal şekilde stream edilir — yalnızca *istek* sıkıştırılır, modelin çıktısı asla değil.

# ⚙️ Nasıl çalışır

```
hacimli istek bloğu ──► kârlılık kapısı ──► yeniden akış + render (1-bit 5×8 atlas)
                       (tam faturalama matematiği)     ──► 1568×728 PNG sayfalar ──► geri ekleme, cache-dostu
```

- **Faturalama, dönüştürmeden önce tam olarak hesaplanır**: Anthropic her görüntü için `⌈w/28⌉ × ⌈h/28⌉ + 4` token faturalandırır (28 px parçalar — sıfır kalıntıya ölçülmüş). Tam bir sayfa 1.460 token için 28.080 karakter taşır ≈ **19 karakter/token**, yoğun metin için ise ~2 karakter/token. Kapı yalnızca matematik kazandığında dönüştürür.
- **Neler dönüştürülür**: statik system prompt + araç dokümanları, eski daraltılmış geçmiş, büyük araç çıktıları.
- **Neler asla dönüştürülmez**: mesajlarınız, son turlar, modelin çıktısı, seyrek nesir, byte-tam değerler (hash'ler/ID'ler metin olarak görüntünün yanında gider) ve okuma benchmark'ını geçemeyen herhangi bir model.

# 🧭 Dürüst kısım

- **Kayıplıdır.** Görüntülerden byte-tam geri çağırma doğası gereği güvenilmezdir. Sevk edilen önlemler: tam kimlikler görüntünün yanında metin olarak taşınır ve ölçülen üretim yapılandırması **sıfır sessiz uydurma** üretti — başarısız okumalar çekimser kalır.
- **Bugün yalnızca Fable 5 onaylı**, kanıtlarla. GPT-5.5 ve Gemini 2.5-flash ölçülebilir şekilde yoğun render'ları okuyamıyor; Opus 4.8, 4× daha büyük gliflere ihtiyaç duyuyor. Kapı bunu zorunlu kılar.
- **Bir faturalama tuzağı bulduk ve kaçındık**: yüksek çözünürlüklü görüntü katmanı sayfa başına 3,3× daha fazla faturalandırır, ancak görüntü kodlayıcı ekstra çözünürlüğü almaz — daha büyük sayfalar *daha kötü* okunur. Ölçüldü, [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md) içinde belgelendi, etkinleştirilmedi.
- Fiyatlar değişir; kalıcı metrik, proxy'nin her istek için ücretsiz bir `count_tokens` karşı olgusuna karşı kaydettiği token kesintisidir.

# 🔬 Her rakamı yeniden üretin

```bash
pnpm install && pnpm test                                     # tam paket
node benchmarks/billing-sweep/run.mjs --dry-run               # faturalama tahminleri, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # maliyet tablosu, $0
# anahtarlarla: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (veya Claude Code aboneliği için --via-cli)
```

![Kuru çalıştırma modunda çalışan iki benchmark harness'i](../../../docs/assets/demo-benchmarks.gif)

Tam metodoloji ve her sonuç tablosu: [docs/benchmarks/BENCHMARKS.md](docs/benchmarks/BENCHMARKS.md). Ham cevap başına kanıtlar: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute ailesi

OmniGlyph ayrıca [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) — ücretsiz AI gateway — içinde **yerel bir sıkıştırma motoru** olarak da gönderilir. Orada `omniglyph` motoru olarak çalışır (bağımsız tek mod veya diğer motorlarla yığılmış), fail-closed kapılar ve görüntü-farkında token muhasebesiyle.

# 🛠️ Teknoloji Yığını

| katman | teknoloji |
|---|---|
| Dil | TypeScript (strict), ESM |
| Runtime | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Render | kendi 1-bit glif atlası (Spleen/Unifont türevi, lisanslar `assets/` içinde) → PNG |
| Testler | Vitest — TDD, artı docs-integrity ve rebrand koruyucuları |
| Benchmarklar | `benchmarks/` harness'leri (billing-sweep, density-frontier) JSONL kanıtlarıyla |

## Proje yerleşimi

| yol | ne |
|---|---|
| `src/` | proxy: dönüştürme pipeline'ı, sağlayıcı başına tam faturalama, render motoru, host'lar (Node + Cloudflare Workers) |
| `benchmarks/` | yukarıdaki her rakamı üreten harness'ler — yeniden çalıştırılabilir |
| `docs/` | [BENCHMARKS](docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](docs/architecture/ARCHITECTURE.md) · [ROADMAP](docs/ROADMAP.md) |

# 📧 Destek & Topluluk

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — hatalar ve özellik istekleri
- 🔒 [SECURITY.md](SECURITY.md) — güvenlik açığı bildirimleri
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — sıkı TDD + iddiadan önce ölçüm
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Lisans

MIT — bkz. [LICENSE](../../../LICENSE).
