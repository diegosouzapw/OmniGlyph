🌐 [English](../../../README.md) · [All languages](../README.md)

<div align="center">

<img src="../../../docs/assets/example-render.png" alt="A real render: system prompt + tool docs packed into one dense 1568×728 page" width="820"/>

<br/>

# 🖼️ OmniGlyph — Kontekst Şəkil Kimi

### Claude hesabınızı **59–70%** azaldın — həcmli konteksti sıx PNG səhifələri kimi render edərək, eyni məzmun, tokenlərin cüzi hissəsində.

**Modellər mətni token üzrə, amma şəkli ölçüləri üzrə hesablayır — içindəki mətnin miqdarına görə yox.**

<br/>

[![59–70% Bill Cut](https://img.shields.io/badge/59--70%25-Bill_Cut-00B894?style=for-the-badge)](#-rqmlr--llb-txmin-edilmyib)
[![10x Fewer Tokens](https://img.shields.io/badge/10%C3%97-Fewer_Tokens-6C5CE7?style=for-the-badge)](../../../benchmarks/billing-sweep/README.md)
[![100% Read Accuracy](https://img.shields.io/badge/100%25-Read_Accuracy-0984E3?style=for-the-badge)](../../../benchmarks/density-frontier/README.md)
[![Zero Confabulations](https://img.shields.io/badge/0-Silent_Confabulations-E17055?style=for-the-badge)](#-drst-hiss)

[![CI](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml/badge.svg)](https://github.com/diegosouzapw/OmniGlyph/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/omniglyph?style=flat-square)](https://www.npmjs.com/package/omniglyph)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](../../../LICENSE)
[![Node ≥18](https://img.shields.io/badge/node-%E2%89%A518-339933?style=flat-square&logo=node.js&logoColor=white)](../../../package.json)

[**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) ailəsinin bir hissəsidir · [🌐 Bütün dillər](../README.md)

</div>

---

# 📊 Rəqəmlər — ölçülüb, təxmin edilməyib

| göstərici | nəticə | qəbz |
|---|---|---|
| Uçdan-uca hesab azalması | **59–70%** | istehsalat izi, 13.709 sorğu |
| Çevrilmiş blok başına token | **10× az** (28.080 simvol: 14.040 → 1.460 token) | [billing sweep](../../../benchmarks/billing-sweep/README.md) |
| Billinq düsturunun dəqiqliyi | 2 model × 2 səviyyədə 22 `count_tokens` sınağında **sıfır** qalıq | `benchmarks/billing-sweep/results/` |
| İstehsalat konfiqurasiyasında dəqiq oxu | Claude Fable 5-də **30/30 (100%)** | [density frontier](../../../benchmarks/density-frontier/README.md) |
| ~300 oxu sınağında sükutlu uydurmalar | **0** — hər buraxılış `ILEGIVEL` kimi imtina edir | `benchmarks/density-frontier/results/` |

**Model qiymətləndirmə cədvəli** (sıx renderləri oxuya bilirmi? qol başına n=30, deterministik qiymətləndirmə):

| model | oxu | hökm |
|---|---|---|
| Claude **Fable 5** | **100%** dəqiq | ✅ istehsalat hədəfi |
| Claude Opus 4.8 | 4× qlif ölçüsündə 77–87% | ⚠️ könüllü təhlükəsiz rejim (qənaət ~2×-ə düşür) |
| GPT-5.5 | 0/60 — və cəhd edərkən cavablarını ~40× şişirdir | ❌ qapı tərəfindən bloklanıb, sübutla |
| Gemini 2.5-flash | 0/26 — və imtina etmək əvəzinə uydurur | ❌ bloklanıb (qismən test, kvota ilə məhdudlaşdırılıb) |

Üstünlük bu gün **Fable-ə xasdır** — digər görmə kodlaşdırıcıları hələ sıx qlifləri həll edə bilmir. [Benchmark hərnəsi](../../../benchmarks/README.md) hər hansı yeni modeli bir əmrlə yenidən sınayır.

# 🤔 Nə üçün OmniGlyph?

Hər uzunmüddətli agent sessiyası hər sorğuda eyni ölü yükü daşıyır: system prompt, alət sənədləri və köhnə tarixçə — hər növbədə yenidən, token üzrə hesablanır. OmniGlyph həmin həcmli hissələri *maşınınızdan çıxmazdan əvvəl* sıx PNG səhifələrinə çevirən **lokal proksidir**:

- **Həqiqi billinq riyaziyyatı, evristika deyil** — provayderin əsl şəkil-token düsturunu hesablayır (sıfır qalığa qədər ölçülüb) və yalnız riyaziyyat udanda çevirir.
- **Dizayn üzrə fail-closed** — sıx renderləri oxuya bilməyən modellər benchmark qəbzləri ilə qapı tərəfindən bloklanır. Sükutlu keyfiyyət itkisi yoxdur.
- **Məxfi və lokal-öncəlikli** — yenidənyazma `127.0.0.1`-də baş verir; heç bir əlavə məlumat heç yerə göndərilmir.
- **Təkrarlanabilir** — yuxarıdakı hər rəqəmin `benchmarks/*/results/`-da qəbzi var, bir əmrlə yenidən işə salına bilir.

# ⚡ Sürətli Başlanğıc

```bash
npx omniglyph                                     # proksi 127.0.0.1:47821-də
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude  # Claude Code-u ona yönləndirin
```

![Quickstart: start the proxy, check the dashboard, point Claude Code at it](../../../docs/assets/demo-quickstart.gif)

Hər iki halda işləyir:
- **API açarı** (token üzrə ödəniş): hesabınız uçdan-uca 59–70% azalır.
- **Abunə sessiyası**: daha az ödəmirsiniz, amma istifadə limitləri tokenlərlə sayılır — deməli limitləriniz **~2–3×** uzanır.

Panel <http://127.0.0.1:47821/> ünvanındadır: qənaət edilən tokenlər, hər mətn→şəkil çevrilməsi yan-yana, öldürmə açarı, canlı model çipləri. Cavablar normal axır — yalnız *sorğu* sıxılır, heç vaxt modelin çıxışı yox.

# ⚙️ Necə işləyir

```
həcmli sorğu bloku ──► sərfəlilik qapısı ──► yenidən düzülüş + render (1-bit 5×8 atlas)
                       (dəqiq billinq riyaziyyatı)     ──► 1568×728 PNG səhifələr ──► geri calanır, keşə dost
```

- **Billinq çevirmədən əvvəl dəqiq hesablanır**: Anthropic hər şəkil üçün `⌈w/28⌉ × ⌈h/28⌉ + 4` token hesablayır (28 px yamaqlar — sıfır qalığa qədər ölçülüb). Tam səhifə 1.460 token üçün 28.080 simvol daşıyır ≈ **19 simvol/token**, sıx mətn üçün isə ~2 simvol/token. Qapı yalnız riyaziyyat udanda çevirir.
- **Nə çevrilir**: statik system prompt + alət sənədləri, köhnə yığılmış tarixçə, böyük alət çıxışları.
- **Nə heç vaxt çevrilmir**: mesajlarınız, son növbələr, modelin çıxışı, seyrək nəsr, bayt-dəqiq dəyərlər (hash/ID-lər mətn kimi yanında gedir) və oxu benchmarkını keçməmiş hər hansı model.

# 🧭 Dürüst hissə

- **Bu, itkilidir.** Şəkillərdən bayt-dəqiq bərpa təbiətcə etibarlı deyil. Tətbiq olunan tədbirlər: dəqiq identifikatorlar şəklin yanında mətn kimi gedir və ölçülən istehsalat konfiqurasiyası **sıfır sükutlu uydurma** verdi — uğursuz oxular imtina edir.
- **Bu gün yalnız Fable 5 təsdiqlənib**, qəbzlərlə. GPT-5.5 və Gemini 2.5-flash ölçülə bilən şəkildə sıx renderləri oxuya bilmir; Opus 4.8-ə 4× böyük qliflər lazımdır. Qapı bunu tətbiq edir.
- **Bir billinq tələsi tapıb ondan qaçdıq**: yüksək çözünürlüklü şəkil səviyyəsi hər səhifə üçün 3,3× baha başa gəlir, amma görmə kodlaşdırıcısı əlavə çözünürlüyü almır — daha böyük səhifələr *daha pis* oxunur. Ölçülüb, [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md)-də sənədləşdirilib, aktiv edilməyib.
- Qiymətlər dəyişir; davamlı göstərici token azalmasıdır, proksi bunu hər sorğu üçün pulsuz `count_tokens` əks-faktına qarşı qeyd edir.

# 🔬 Hər rəqəmi təkrarlayın

```bash
pnpm install && pnpm test                                     # tam paket
node benchmarks/billing-sweep/run.mjs --dry-run               # billinq proqnozları, $0
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run    # xərc cədvəli, $0
# açarlarla: ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY (və ya Claude Code abunəsi üçün --via-cli)
```

![The two benchmark harnesses running in dry-run mode](../../../docs/assets/demo-benchmarks.gif)

Tam metodologiya və hər nəticə cədvəli: [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md). Xam cavab-başına qəbzlər: `benchmarks/*/results/*.jsonl`.

# 🚀 OmniRoute ailəsi

OmniGlyph həmçinin [**OmniRoute**](https://github.com/diegosouzapw/OmniRoute) — pulsuz AI şlüzü — daxilində **doğma sıxılma mühərriki** kimi çıxış edir. Orada `omniglyph` mühərriki kimi işləyir (tək rejim və ya digər mühərriklərlə yığılmış), fail-closed qapılar və şəkil-şüurlu token uçotu ilə.

# 🛠️ Texnologiya Yığını

| qat | texnologiya |
|---|---|
| Dil | TypeScript (strict), ESM |
| İşləmə mühiti | Node ≥18 · Cloudflare Workers (`wrangler.toml`) |
| Render | öz 1-bit qlif atlası (Spleen/Unifont-əsaslı, lisenziyalar `assets/`-də) → PNG |
| Testlər | Vitest — TDD, üstəlik docs-integrity və rebrand qoruyucuları |
| Benchmarklar | JSONL qəbzləri ilə `benchmarks/` hərnəsləri (billing-sweep, density-frontier) |

## Layihə strukturu

| yol | nə |
|---|---|
| `src/` | proksi: transformasiya boru xətti, provayder üzrə dəqiq billinq, renderer, hostlar (Node + Cloudflare Workers) |
| `benchmarks/` | yuxarıdakı hər rəqəmi yaradan hərnəslər — yenidən işə salına bilər |
| `docs/` | [BENCHMARKS](../../../docs/benchmarks/BENCHMARKS.md) · [ARCHITECTURE](../../../docs/architecture/ARCHITECTURE.md) · [ROADMAP](../../../docs/ROADMAP.md) |

# 📧 Dəstək və İcma

- 🐛 [Issues](https://github.com/diegosouzapw/OmniGlyph/issues) — xətalar və funksiya istəkləri
- 🔒 [SECURITY.md](SECURITY.md) — zəiflik bildirişləri
- 🤝 [CONTRIBUTING.md](CONTRIBUTING.md) — ciddi TDD + iddiadan-əvvəl-ölçmə
- 📜 [CHANGELOG.md](CHANGELOG.md) · [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)

## 📄 Lisenziya

MIT — bax [LICENSE](../../../LICENSE).
