# Fork yol xəritəsi — "bizim OmniGlyph" + OmniRoute inteqrasiyası

Konsolidasiya edilmiş iş planı (2026-07-05) mənbələr: ölçülmüş billinq sweep-i,
rəsmi sənədlərə qarşı OpenAI/Gemini auditi, əlaqəli alətlərin təhlili,
və density-frontier hərnəsi. Hər maddənin statusu: ☐ gözləyir · ◐ qismən · ☑ burada bitib.

## Faza 0 — Ölçmə əsası (BU repoda BİTİB)

- ☑ Dəqiq Anthropic billinqi (28px yamaqlar, 2 səviyyə, +4/blok) — `src/core/anthropic-vision.ts`, sweep `benchmarks/billing-sweep/`-də.
- ☑ Dəqiq xərcli sərfəlilik qapısı (w·h/750 × 1.10 əvəz edildi).
- ☑ Səviyyə-üzrə geometriya: Fable/Opus 4.8/Sonnet 5 → 1928×1928 səhifələr (3.3× az şəkil); standart → 1568×728. 691 test yaşıl.
- ☑ `benchmarks/density-frontier/` hərnəsi (API vasitəsilə oflayn xərc × dəqiqlik, çaşdırıcı distraktorlarla iynələr, deterministik qiymətləndirmə).

## Faza 1 — Çox-provayderli billinq düzəlişləri (auditdə təsdiqlənmiş xətalar)

Audit tərəfindən müəyyən edilmiş prioritet (rəsmi sənədlər 2026-07-05-də tutulub):

1. ☐ **D2 (TƏRSİNƏ ÇEVRİLMİŞ qapı)**: `gpt-4o-mini` standart plitə 85/170-ə düşür, amma
   **plitə başına 2833 baza / 5667** xərcləyir (~33× az qiymətləndirilib, ~0.8
   simvol/token) — onu şəkilləşdirmək həmişə itkidir və qapı onu təsdiqləyir.
   `src/core/gpt-model-profiles.ts:51-59`.
2. ☐ **D5**: `detail:'original'` şərtsiz göndərilir (`src/core/openai.ts:392,402`),
   amma yalnız gpt-5.4+-da mövcuddur; onu profildən çıxarın.
3. ☐ **D1**: `o4-mini` vuruq əmsalı 1.62 → **1.72** (5.8% az qiymətləndirir).
4. ☐ **D3/D4**: `gpt-5.2/5.2-codex/5.3-codex/5.1-codex-mini/5-codex-mini`
   `original` olmadan **tavan 1536** yamaq qutusundadır (kod 10000 fərz edir);
   `gpt-5-codex-mini` yanlış rejimdədir (plitə → yamaq).
5. ☐ **GPT geometriyası**: `GPT_MAX_HEIGHT_PX 1932 → 2048` (HƏR İKİ rejimlə uyğunlaşır:
   64×32 yamaqlar və 4×512 plitələr; +6.25% pulsuz simvol). Xüsusi 5.4/5.5 `original`
   profili: 1568×5984-ə qədər (9,163 yamaq ≤ 10k, bir blokda ~233k simvol) — əvvəlcə
   oxunaqlılıq A/B.
6. ☐ **Gemini dəstəyi** (yeni): `src/core/gemini.ts` + `gemini-model-profiles.ts` +
   proksidə `:generateContent`/`:streamGenerateContent` marşrutları. Sənədləşdirilə
   bilən geometriya: **1152×1536 (dəqiq kəsim vahidi 768, 4 plitə, 42.2 simvol/token —
   3 provayderin ən yaxşı sənədləşdirilmiş nisbəti)**; kalibrləşdirmə üçün mərclər:
   `media_resolution:MEDIUM` ilə 768² (56.4) və Gemini 3 HIGH. Diqqət: Gemini-nin
   OpenAI-uyğun endpoint-i yanlış billinqlə OpenAI transformerindən keçəcək.

## Faza 2 — Oxu keyfiyyəti (hakim kimi density-frontier hərnəsi)

- ◐ Fable-də qəti std vs high-res A/B (işləyir; çubuq: gist == mətn VƏ sıfır sükutlu-səhv VƏ qənaət > 0).
- ☐ Sıx yolda AA vs 1-bit ziddiyyətini həll etmək (kod "yalnız-qiymətləndirmə üçün" deyir, istehsalat AA istifadə edir).
- ☐ (ƏSASLANDIRMA ilə 2026-07-06-a TƏXİRƏ SALINIB) Qlif cərrahiyyəsi: istehsalat konfiqurasiyası 30/30 oxuyur — cərrahiyyənin düzəldəcəyi ölçülə bilən buraxılış bu gün yoxdur. Sub-100% hədəf əhatəyə daxil olsa (məs. Opus) və ya yeni ölçmələr geriləmə göstərsə yenidən baxılacaq.
- ☑ ~~İşıq-tema A/B~~ İNSPEKSİYA İLƏ HƏLL EDİLİB (2026-07-06): render ARTIQ qara-ağ üzərində-dir (render.ts:635/822, blit-dən-sonra tərsinə çevrilmə) — ədəbiyyata uyğundur; hipotez yanlış öncüldən doğulmuşdu (yuxarı axın nümunə şəkli).
- ☐ Bayt-dəqiq ID-lər üçün checksum-lu söz siyahısı (upstream #38, təsdiqlənib) + imtina banneri (#31/#32) + faktlar vərəqəsində camelCase (#33/#34).
- ☑ #45 portlanıb: $schema/$id qorunub, hər element üzrə tuple-lar silinib (main-də commit).
- ☑ İmtinada-təkrar-cəhd (#37/H11): itkisiz təkrar oynatma sniffer-i + orijinal gövdə ilə tək təkrar cəhd; refusalRetried telemetriyası (main-də commit).
- ☐ Bərpa aləti (`RecoverableBlock` → çağırıla bilən alət; LensVLM seçici yenidən genişləndirməni doğrulayır).

## Faza 3 — Performans/dözümlülük

- ☐ LRU render keşi (dəyişməzliklə deterministik; slab + dondurulmuş parçalar bu gün hər sorğuda yenidən render olunur).
- ☐ İşçi thread-də PNG kodlaşdırması; konfiqurasiya edilə bilən deflate səviyyəsi.
- ☐ Açıq upstream düzəlişlərini portlamaq: #44 (tiplənmiş doğma alətlər → 400), #45 (sxem-silmə draft-07 → 400 dövrü), #42 (Claude Desktop üçün CONNECT proksisi), #19 (GPT təsvirlərinin ikiqat hesablanması).
- ☐ ADAPTIVE_CPT_PLAN tətbiq etmək (blok rolu başına cpt; həqiqi slab = 1.50).

## Faza 4 — Fork-un özü

- ☐ Öz ad/repo (Diego-nun qərarı) + cherry-pick-lər üçün upstream `git remote`.
- ☐ **Hər yerdə TS**: nüvə artıq TS-dir, `eval/*.mjs`, `demo/`, `scripts/*.mjs`, `bench/`-i çevirin (nümunə: tsx + vitest; `benchmarks/density-frontier/` bu şəkildə doğulub).
- ☐ OmniRoute keyfiyyət standartı: eslint 9 + prettier, typecheck/test/build/link-check ilə CI, CONTRIBUTING, SECURITY, README i18n (əvvəlcə pt-BR), semantik CHANGELOG.
- ☐ README-də **video əvəzinə GIF-lər** (vhs/asciinema+agg ilə qeyd edin; sadə vs proksi yan-yana).
- ☐ Panel v2 (HTTP API vasitəsilə yenidən tətbiq — üçüncü tərəf kodunu miras almayın): "ANTHROPIC_BASE_URL ilə terminal aç" başladıcı, "trafik məndən keçirmi?" yoxlaması, şəkil-vs-mətn müfəttişi, sessiyalar, valyutada xərc paneli, yüngül i18n, sorğulama əvəzinə SSE, saxlama müddəti ilə SQLite davamlılığı (onun 24-sütunlu sxemi yaxşı başlanğıc nöqtəsidir).
- ☐ dense-image-gen-dən mikro-ideyalar: `lines` rejimi (kod/cədvəllər üçün layout qorunub), `--keep-ws`, səhifə-başına mənşə başlığı ("system prompt" / "alət sənədləri" / "tarixçə növbə N"), müstəqil CLI `render arquivo.md -o out.png`.

## Faza 5 — OmniRoute-a portlama

- ☐ `CompressionEngine` mühərriki (`cavemanAdapter.ts` şablonu), `engines/index.ts` + `engineCatalog.ts`-də qeydiyyatdan keçirilib; `targets: ["messages","tool_results"]`, `applyAsync`.
- ☐ Boru kəməri: `chatCore.ts:1297`-də `supportsVision` ötürün (1 sətir) və ya `isVisionModelId` ilə həll edin.
- ☐ Yığın sırası: sonuncu (əvvəlcə RTK/Caveman/semantik render-lər; OmniGlyph qalıqı şəkilləşdirir).
- ☐ Dəyişməzlər: müştərinin `cache_control` bloklarını heç vaxt yenidən yazmayın (dərs #4560); sadiqlik qapısı (#5127) elan edilmiş istisna və ya dəyişməzləri qane edən mətn faktlar vərəqəsi tələb edir; `skip_reason` ilə cəhd telemetriyası (dərs #4268).
- ☐ Marşrutlaşdırma: mühərrikdən-sonrakı fallback/təkrar cəhd görmə qabiliyyətinə və icazə siyahısına hörmət etməlidir (yenidən sıxma və ya keçid).
- ☐ CCR sinergiyası: `emitRecoverable` → parça-üzrə əldə etmə ilə CCR store (`head/tail/grep`, #5187) = tam seçici yenidən genişləndirmə.
- ☐ Marketinq xüsusiyyəti kimi pulsuz-səviyyə uzatma: hər pulsuz-səviyyə tokeni görmə modellərində ~2-3× daha çox simvol verir; Gemini pulsuz səviyyəsi + 1152×1536 geometriyası ən güclü nümunədir.

## Açıq risklər

- Şəkilləşdirilmiş kontekstdə yenidən-yerləşdirmədən sonra Fable imtinaları (upstream #37) — OmniRoute-da standart-aktiv olmadan əvvəl azaldın.
- Qiymət arbitrajı: Anthropic görmə qiymətlərini dəyişərsə, qənaətlər dəyişir — sorğu-başına əks-fakt (`count_tokens`) müdafiədir.
- OpenAI: icma ölçməsi (PageWatch) tamamlama tokenlərinin artdığını və 2× gecikməni gördü — aktiv etmədən əvvəl provayder üzrə ölçün.

## 2026-07-05 A/B nəticələri (OpenRouter vasitəsilə — geometriya üçün QƏTİYYƏTSİZ, uğursuzluq rejimləri üçün etibarlı)

| konfiqurasiya | söz-be-söz | imtina | süzülmüş | sükutlu-səhv |
|---|---|---|---|---|
| fable std 5×8 (AA və 1-bit) | 0/30 | 0 | **30/30 content_filter** | 0 |
| fable hires 5×8 (AA) | 0/30 | **20 ILEGIVEL** | 0 | 5 (2 proqnozlaşdırılıb) |
| fable hires 5×8 (1-bit) | 0/30 | 20 | 1 | 4 (2 proqnozlaşdırılıb) |
| opus hires 10×16 | **7/9 oxu** | 0 | 21-i kredit çatmazlığından | 2 (rəqəm) |

Etibarlı tapıntılar: (1) təsnifatçı (issue #37) standart səhifədə transkripsiya
sualları üçün DOMİNANT uğursuzluq rejimidir — 100% süzülüb — və böyük səhifədə işə
düşmür; ifadə vacibdir. (2) İmtina işləyir: böyük səhifədə 20× ILEGIVEL vs 5 uydurma.
(3) 10×16-da Opus 78% dəqiq oxuyur (n=9) vs 5×8-də tarixi 0% — dizin ilk əl-ilə
sübutu. (4) OpenRouter vasitəsilə böyük səhifənin oxunmazlığı nəqliyyat RESAMPLE-ini
göstərir (Bedrock/Vertex standart səviyyəsi?) — Anthropic-in birbaşa API-sində
sınamaq üçün qəti hipotez; geometriya A/B bu vaxta qədər AÇIQ qalır. OpenRouter
kreditləri Opus qolunun ortasında bitdi.

## Yekun 2×2 matris (2026-07-05, CLI/abunə vasitəsilə, Fable 5, n=30/qol)

| səhifə × atlas | 1-bit | AA |
|---|---|---|
| standart 1568×728 | **30/30 (100%)** | 25/30 + 5 imtina |
| yüksək-çözünürlük 1928×1928 | **20/30 (67%)** + 10 imtina | 0/30 + 29 imtina |

4 qol boyunca sıfır uydurma (120 sual — hər buraxılış ILEGIVEL idi). TƏTBİQ EDİLDİ:
DENSE_RENDER_STYLE tests/dense-style.test.ts-də pin ilə 1-bit-ə (aa:false) çevrildi.
Opus 4.8: böyük səhifədə 10×16-da 26/30, 5×8-də 30/30 ILEGIVEL — Opus təhlükəsiz
rejimi mümkündür. Yüksək-çözünürlük səhifəsi nəqliyyatlar (CLI Read/OpenRouter
resample) tərəfindən pisləşdirilmiş qalır — WYSIWYG geometriya hökmü hələ də birbaşa
API-dən asılıdır.
