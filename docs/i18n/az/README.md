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

# 🔌 Claude müştəriləri ilə istifadə

Start the proxy in one terminal, then point the client at it.

**Claude Code CLI (macOS/Linux):**

```bash
npx omniglyph
ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude
```

**Claude Code CLI (Windows PowerShell):**

```powershell
npx omniglyph
$env:ANTHROPIC_BASE_URL = "http://127.0.0.1:47821"
claude
```

**Claude Desktop** uses the same `ANTHROPIC_BASE_URL` environment variable for its bundled Claude Code runtime — start `omniglyph` first, then launch Claude Desktop from an environment where `ANTHROPIC_BASE_URL` is set to `http://127.0.0.1:47821`.

# 🖥️ Panel

Paketin daxilində tam lokal panel gəlir — oflayn, tək fayl, sıfır xarici sorğu. Sorğular axarkən SSE üzərindən canlı yenilənən altı səhifə:

![Ümumi baxış: missiya-nəzarət KPI kartları, qənaət sparkline-ı və canlı hadisə axını](../../assets/dashboard-overview.png)

- **Ümumi baxış** — missiya nəzarəti: qənaət %, qənaət edilən $, gecikmə p95, keş uğurları, xətalar, canlı axın.
- **Canlı Axın** — boru xəttinin node qrafiki kimi: müştəri → qapı → renderer / keçid → API, hər həqiqi sorğu üçün bir hissəcik.
- **Telemetriya** — token/$ odometri və canlı sorğu zaman xətti; hər hansı sorğuya klikləyərək dəqiq hansı hissələrin şəklə çevrildiyini görün və hər səhifənin arxasındakı mənbə mətnini oxuyun.
- **Benchmarklar** — `benchmarks/*/results/`-dan render olunan sınaq qəbzləri, hər model·konfiqurasiya eksperimenti üçün bir sətir, və **benchmarkları UI-dan işə salın**: `$0` dry-run-lar öz çıxışlarını canlı axıdır; canlı işlər isə API açarınızın üstəlik açıq xərc təsdiqi arxasında qapalı qalır.
- **Sessiyalar / Tarixçə** — qənaət edilən tokenlərə görə ən yaxşı sessiyalar və diskdəki hər hadisə.

| Canlı Axın | Benchmarklar |
|---|---|
| ![Sorğu boru xəttinin canlı node qrafiki kimi](../../assets/dashboard-flow.png) | ![Benchmark qəbzləri və UI daxilində dry-run-lar](../../assets/dashboard-benchmarks.png) |

![Telemetriya: odometr və canlı sorğu zaman xətti](../../assets/dashboard-telemetry.png)

# ⚙️ Necə işləyir

```
həcmli sorğu bloku ──► sərfəlilik qapısı ──► yenidən düzülüş + render (1-bit 5×8 atlas)
                       (dəqiq billinq riyaziyyatı)     ──► 1568×728 PNG səhifələr ──► geri calanır, keşə dost
```

- **Billinq çevirmədən əvvəl dəqiq hesablanır**: Anthropic hər şəkil üçün `⌈w/28⌉ × ⌈h/28⌉ + 4` token hesablayır (28 px yamaqlar — sıfır qalığa qədər ölçülüb). Tam səhifə 1.460 token üçün 28.080 simvol daşıyır ≈ **19 simvol/token**, sıx mətn üçün isə ~2 simvol/token. Qapı yalnız riyaziyyat udanda çevirir.
- **Nə çevrilir**: statik system prompt + alət sənədləri, köhnə yığılmış tarixçə, böyük alət çıxışları.
- **Nə heç vaxt çevrilmir**: mesajlarınız, son növbələr, modelin çıxışı, seyrək nəsr, bayt-dəqiq dəyərlər (hash/ID-lər mətn kimi yanında gedir) və oxu benchmarkını keçməmiş hər hansı model.

# 📚 Kitabxana istifadəsi (proksisiz)

Proksinin hər sorğuda etdiyi hər şey həm də sənədləşdirilmiş, import edilə bilən API kimi mövcuddur:

```ts
import { renderTextToImages, transformAnthropicMessages } from "omniglyph";

// Hər hansı mətni sıx 1-bit PNG səhifələrinə render edin
const { pages } = await renderTextToImages(bigToolOutput, { reflow: true });
// pages[i].png: Uint8Array · pages[i].width × pages[i].height

// Və ya tam sorğu transformasiyasını özünüz işə salın — qapı, billinq riyaziyyatı və hamısı
const { body, applied, reason } = await transformAnthropicMessages({
  body: requestBytes,           // xam /v1/messages JSON gövdəsi
  model: "claude-fable-5",
});
```

`options.keepSharp(block)` blokları mətn kimi sabitləyir; `options.emitRecoverable` şəklə çevrilmiş blokların orijinallarını qaytarır. Dəqiq billinq riyaziyyatı paket kökündə də mövcuddur (`anthropicImageTokens`, `resolveAnthropicVisionTier`, `openAIVisionTokens`) — [OmniRoute](https://github.com/diegosouzapw/OmniRoute) məhz bunu istifadə edir. Təmiz JS runtime (Node və edge/Workers). Tam səth: `src/core/index.ts`.

# 📤 Oflayn eksport — proksisiz, Claude Code-suz

Claude Code-da deyilsiniz? Konteksti **lokal olaraq** PNG səhifələrinə render edin və onları Cursor, ChatGPT və ya şəkil yükləmələrini qəbul edən istənilən çata yapışdırın. Proksi yox, API açarı yox, qoşulmuş hesab yox:

```bash
npx omniglyph export --include "*.ts" src/   # render a folder to image pages
cat big.log | npx omniglyph export --stdin   # …or pipe any text through
```

Çata atmaq üçün hər şeyi bir qovluqda alırsınız:

```
OmniGlyph-export-<hash>/
  page-001.png …   the rendered image pages — attach these
  factsheet.txt    verbatim precision tokens (paths, SHAs, ids, numbers)
  prompt.txt       a paste-ready instruction that points the model at the pages
  manifest.json    metadata + the text-vs-image token report (% saved)
```

`--git` commit edilməmiş diff-inizi render edir, `--diff <ref>` bir commit aralığını, `--open` isə qovluğu üzə çıxarır (macOS). Hamısı sizin maşınınızda işləyir — eksport yolu heç vaxt proksini başlatmır və heç vaxt modelə müraciət etmir. Bütün bayraqlar üçün `omniglyph export --help` işə salın.

# 🧭 Dürüst hissə

- **Bu, itkilidir.** Şəkillərdən bayt-dəqiq bərpa təbiətcə etibarlı deyil. Tətbiq olunan tədbirlər: dəqiq identifikatorlar şəklin yanında mətn kimi gedir və ölçülən istehsalat konfiqurasiyası **sıfır sükutlu uydurma** verdi — uğursuz oxular imtina edir.
- **Bu gün yalnız Fable 5 təsdiqlənib**, qəbzlərlə. GPT-5.5 və Gemini 2.5-flash ölçülə bilən şəkildə sıx renderləri oxuya bilmir; Opus 4.8-ə 4× böyük qliflər lazımdır. Qapı bunu tətbiq edir.
- **Bir billinq tələsi tapıb ondan qaçdıq**: yüksək çözünürlüklü şəkil səviyyəsi hər səhifə üçün 3,3× baha başa gəlir, amma görmə kodlaşdırıcısı əlavə çözünürlüyü almır — daha böyük səhifələr *daha pis* oxunur. Ölçülüb, [docs/benchmarks/BENCHMARKS.md](../../../docs/benchmarks/BENCHMARKS.md)-də sənədləşdirilib, aktiv edilməyib.
- Qiymətlər dəyişir; davamlı göstərici token azalmasıdır, proksi bunu hər sorğu üçün pulsuz `count_tokens` əks-faktına qarşı qeyd edir.

# 🧠 Tez-tez verilən suallar

**59–70% uçdan-uca rəqəmdir, yoxsa yalnız toxunduğu sorğularda?**
Uçdan-uca — bütün hesab. Əksər sıxılma alətləri qənaəti yalnız toxunduqları hissədə bildirir, bu da rəqəmi şişirdir. Bizim məxrəcimiz *hər* sorğudur: qapının düzgün toxunmadan buraxdığı kiçik sorğular, bütün keş yazma və oxumaları, və bütün çıxış tokenləri (proksi bunları heç vaxt sıxmır). Yalnız-sıxılmış rəqəm daha yüksək çıxır və ayrıca qeyd olunur, heç vaxt başlıq kimi yox.

**Qənaət necə ölçülür?**
Eyni sorğunun hər iki tərəfi, eyni anda. Hər `/v1/messages` POST-u üçün proksi orijinal, sıxılmamış gövdə üzərində pulsuz bir `count_tokens` sınağı (əks-fakt) işə salır — real yönləndirmə ilə paralel — və provayderin faktiki hesabladığı istifadə blokunu cavabdan oxuyur; hər ikisi eyni hadisə sətrinə düşür. Keş qiymətləndirməsi hər iki tərəfə eyni tətbiq olunur, ona görə keş endirimi bir-birini ləğv edir və "qənaət" kimi ikiqat hesablana bilmir. Düstur `src/core/baseline.ts`-də yerləşir; öz hadisə jurnalınızdan yenidən çıxara bilərsiniz.

**Niyə xəta oxu səhvi deyil, uydurma sayılır?**
Çünki modelin görməsi OCR deyil: səhifə yamaq (patch) embeddinglərinə çevrilir, heç vaxt ayrıca simvollara yox, ona görə hər qlif üçün ucadan uğursuz olacaq bir etibarlılıq göstəricisi yoxdur — piksellər bir qlifi qeyri-müəyyən buraxanda, dil prioru boşluğu inandırıcı bir şeylə doldurur. Məhz bu mexanizm OmniGlyph-i bu məsələdə fail-closed edir: bayt-dəqiq dəyərlər həmişə şəklin yanında mətn kimi gedir, səhv oxuyan modellər qapı tərəfindən bloklanır, və ölçülən istehsalat konfiqurasiyası ~300 oxu sınağında **sıfır** sükutlu uydurma verdi — uğursuz oxular imtina edir.

**Bayt-dəqiq iş (hash-lər, ID-lər, sirlər) haqqında nə demək olar?**
Son növbələr və dəqiq identifikatorlar dizayn üzrə mətn olaraq qalır. *Tamamilə* bayt-dəqiq olan iş yükləri üçün onları icazə siyahısında olmayan bir modelə yönləndirin (məsələn, başqa Claude modelində subagent) — icazə siyahısından kənarda olan hər şey bayt-eyni, toxunulmadan keçir.

**DeepSeek-OCR bunun işlədiyini artıq sübut etmədimi?**
O, *kanalın* işlədiyini sübut etdi — bu iş üçün öyrədilmiş encoder/decoder cütü ilə. Şübhəçilik heç bir hazır istehsalat modelinin sıx renderləri oxuya bilmədiyi dövrdən qalıb; bu dəyişdi, və yuxarıdakı [model qiymətləndirmə cədvəli](../../../README.md#-the-numbers--measured-not-estimated) bu gün onları kimin oxuduğunu, qəbzlərlə göstərir. [Benchmark hərnəsi](../../../benchmarks/README.md) hər hansı yeni modeli bir əmrlə yenidən sınayır — qapı hipe deyil, məlumatı izləyir.

**Onu Claude Code olmadan istifadə edə bilərəmmi — Cursor, ChatGPT, sadə pipe?**
Bəli, iki yolla. **Proksi** kimi o, API baza URL-ni təyin etməyə imkan verən istənilən müştəri ilə işləyir (`ANTHROPIC_BASE_URL` və ya OpenAI baza URL-i) — Claude Code, öz skriptləriniz, istənilən HTTP şey. Və proksi edə bilməyən alətlər üçün yuxarıdakı **Oflayn eksport** konteksti əllə yapışdırdığınız PNG səhifələrinə render edir — `omniglyph export --stdin` hətta birbaşa Unix pipe-dan oxuyur.

**O, mətni əslində necə şəklə çevirir?**
O, mətni yenidən düzür və onu 1-bit 5×8 piksel qlif atlası ilə sıx 1568×728 PNG səhifələrinə çəkir — hər piksel üçün bir bit, anti-aliasing yoxdur, ona görə model səhifəni ölçüləri üzrə hesablayır, içində neçə simvol olduğuna görə yox. Yuxarıdakı **Necə işləyir** boru xəttini göstərir; benchmark sənədi isə həndəsəni və nə üçün daha sıxın həmişə daha ucuz olmadığını izah edir.

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

<!-- omniglyph:upstream-credits:start -->
# 🙏 Təşəkkürlər

OmniGlyph məhz bir layihənin çiyinləri üstündə dayanır — bu bölmə bizim daimi təşəkkürümüzdür.

| Layihə | OmniGlyph-ə necə təsir etdi |
|---|---|
| **[pxpipe](https://github.com/teamchong/pxpipe)** · [teamchong](https://github.com/teamchong) | **Bütün bu layihənin qurulduğu kəşf.** pxpipe qəbzlərlə sübut etdi ki, istehsalat LLM-inin görmə kanalı sıx mətn kontekstini token dəyərinin bir hissəsi qarşılığında daşıya bilər — və çevrilmə hər sorğuda dəqiq billinq riyaziyyatı ilə qərarlaşdırılmalıdır, heç vaxt hissiyata görə yox. Sıx 1-bit render, sərfəlilik qapısı, `count_tokens` əks-faktı, fail-closed model icazə siyahısı və "iddia etməzdən əvvəl ölç" sənədləşdirmə mədəniyyəti hamısı orada ilk dəfə tətbiq olundu. OmniGlyph birbaşa həmin kod bazasından törəyib (MIT — orijinal müəllif hüququ sətri [LICENSE](../../../LICENSE) faylımızda qalır). |
| **[Spleen](https://github.com/fcambus/spleen)** · Frederic Cambus | Sıx 1-bit qlif atlasımızın törədiyi 5×8 bitmap şrift ailəsi (lisenziya `assets/`-də). |
| **[GNU Unifont](https://unifoundry.com/unifont/)** · Unifoundry | Eyni atlasda Spleen-in əhatə dairəsindən kənarda qalan qliflər üçün örtük (lisenziya `assets/`-də). |

Əgər OmniGlyph sizə faydalı olubsa, əsl mənbəyə də ulduz qoyun — kəşf onlarındır. 🙏
<!-- omniglyph:upstream-credits:end -->

## 📄 Lisenziya

MIT — bax [LICENSE](../../../LICENSE).
