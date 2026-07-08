# OmniGlyph — Konsolidasiya edilmiş ölçmələr (2026-07-05)

🌐 Tərcümə: [bütün dillər](../../../README.md)

Bu sessiyada ÖLÇÜLMÜŞ hər şey, mənbə və n ilə; hipotezlər sonda aydın şəkildə
ayrılıb. Qəbzlər: `benchmarks/billing-sweep/results/` və
`benchmarks/density-frontier/results/` (cavab başına JSONL).

## TL;DR — iki zolaqda bütün nəticə

**Xərc** — bir standart 1568×728 səhifə 28,080 simvolu sabit 1,460 tokenlə
daşıyır; eyni mətn xam göndəriləndə ~10× baha başa gəlir:

```
same 28,080-char context

  as dense TEXT   ██████████████████████████████████████████████  ~14,040 tokens
  as ONE IMAGE    █████                                              1,460 tokens   (flat, WYSIWYG)
```

**Dəqiqlik** — amma yalnız model səhifəni əslində oxuduqda. Qapı fail-closed-dır;
yalnız ✅ sətri istehsalata çıxır:

```
  Fable 5 · 1-bit std page (prod)  ██████████████████████████████  30/30  ✅
  Fable 5 · AA std page (old)      █████████████████████████░░░░░  25/30  🟡 5 abstain
  Opus 4.8 · 10×16 (safe mode)     ████████████████████████░░░░░░  ~24/30 ⚠️
  Fable 5 · high-res 1928²         █░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  ~2/30  🚫 billing trap
  GPT-5.5 / Gemini 2.5-flash       ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  0      ⛔ blocked
```

Bu sənədin qalanı həmin iki zolağın arxasındakı qəbzlərdir.

## 1. Anthropic billinqi (birbaşa count_tokens, $0, 11 geometriya × 2 model)

Təsdiqlənmiş düstur: `tokens = ceil(w/28) × ceil(h/28)` səviyyə-üzrə ölçü
dəyişmədən sonra, **+3/blok (Fable 5) / +4/blok (Sonnet 4.5)** — bütün sətirlərdə
SIFIR qalıq.

| sınaq | ölçülər | Fable 5 (yüksək-çözünürlük) | Sonnet 4.5 (standart) |
|---|---|---:|---:|
| sənəd anqoru | 1092×1092 | 1524 | 1525 |
| sənəd anqoru | 1000×1000 | 1299 | 1300 |
| standart səhifə | 1568×728 | 1459 | 1460 |
| **böyük səhifə** | **1928×1928** | **4764 (WYSIWYG!)** | 1525 (yenidən nümunə) |
| yüksək-çözünürlük tavanı | 1960×1960 | 4764 (klamp) | 1525 |
| yüksək-çözünürlük uzun kənar | 2576×1204 | 3959 | 1516 |
| uzun zolaq | 768×1932 | 1935 | 1292 (yenidən nümunə) |
| 2×1092² (çoxsaylı) | — | 3048 (= 2×1524) | 3049 |
| 21×280² (>20 şəkil) | — | 2163 | 2164 |
| 20×280²+2100² | — | 6824 (2100²→kiçilmə, count_tokens-də RƏDD EDİLMİR) | 3585 |

Nəticə çıxarılan qərarlar (tətbiq edilib): dəqiq yamaq-üzrə qapı; model-üzrə
səviyyə (Fable/Mythos/Opus 4.8/4.7/Sonnet 5 = yüksək-çözünürlük); `cols` 313→312.

## 2. Oxu dəqiqliyi (density-frontier, hex/camelCase/rəqəm iynələri + distraktorlar)

### Fable 5 2×2 matris — CLI/abunə vasitəsilə, qol başına n=30, eyni korpus (~16.6k simvol)

| səhifə × atlas | dəqiq | imtinalar (ILEGIVEL) | sükutlu xətalar |
|---|---:|---:|---:|
| standart 1568×728 · **1-bit** | **30/30 (100%)** | 0 | 0 |
| standart 1568×728 · AA | 25/30 (83%) | 5 | 0 |
| yüksək-çözünürlük 1928×1928 · **1-bit** | 20/30 (67%) | 10 | 0 |
| yüksək-çözünürlük 1928×1928 · AA | 0/30 | 29 | 1 (matris tərəfindən proqnozlaşdırılıb) |

→ **1-bit hər iki səhifədə AA-dan üstündür; 120 sual boyunca sıfır uydurma.**
TƏTBİQ EDİLDİ: `DENSE_RENDER_STYLE` → `aa:false` (commit 9a25585).
⚠️ Yüksək-çözünürlük nəqliyyat yenidən-nümunəsi ilə pisləşmiş gəlir (bax H1/H3) —
67% tavan deyil, döşəmədir.

### Opus 4.8 — CLI/abunə vasitəsilə, qol başına n=30

| konfiqurasiya | dəqiq | imtinalar | xətalar |
|---|---:|---:|---:|
| yüksək-çözünürlük · 10×16 xana | **26/30 (87%)** | 0 | 4 (rəqəmlər) |
| standart · 5×8 xana | 0/30 | 30 | 0 |

→ Opus dizini öz n-imizlə təsdiqlənib (upstream n=20 ilə 10×16-da 95% ölçüb).
"Opus təhlükəsiz rejimi" mümkündür: hərnəs korpusunda böyük səhifədə 10×16 ≈ şəkil
tokeni başına 1.7 simvol.

### OpenRouter vasitəsilə (eyni korpus/suallar) — oxunaqlılıq üçün qətiyyətsiz

| ölçülmüş fakt | rəqəm |
|---|---|
| Transkripsiya suallarında content_filter (standart səhifələr) | 60/60 (100%) |
| Yüksək-çözünürlük səhifələrdə content_filter | 5-6/30 (~20%) |
| Fable yüksək-çözünürlük: imtinalar + xətalar | 20 ILEGIVEL + 5 xəta (2 proqnozlaşdırılıb) |
| Opus 10×16 (kreditlər bitmədən əvvəl) | 7/9 dəqiq (78%) |
| Çaşdırıcılıq matrisi tərəfindən proqnozlaşdırılmış səhv oxular | 4→a, 0→8, S/s hal |

### Nəqliyyat müqayisəsi (eyni sual, eyni məzmun)

| nəqliyyat | süzgəc/imtina | böyük səhifə oxunaqlıdırmı? |
|---|---|---|
| Birbaşa API (n=9, kreditlər bitmədən əvvəl) | 0 | sınanmayıb |
| OpenRouter | ~100% std / ~20% yüksək-çözünürlük | yox (şübhəli: yenidən nümunə) |
| Claude Code CLI (abunə) | 0 content_filter; böyük partiyaların ~50%-i dayandı (10-luq bloklar + təkrar cəhdlə həll edildi) | yox (şübhəli: Read yenidən ölçür) |

## 3. Provayder başına xərc (oflayn, dəqiq — TAM səhifələr, nəzəri)

| provayder · səhifə | token/səhifə | simvol/səhifə | **simvol/token** | status |
|---|---:|---:|---:|---|
| Anthropic std 1568×728 (bütün modellər) | 1460 | 28,080 | **19.2** | ölçülüb |
| Anthropic yüksək-çözünürlük 1928×1928 (Fable/Opus4.8/Sonnet5) | 4765 | 92,160 | **19.3** (3.3× az şəkil) | billinq ölçülüb; oxunaqlılıq gözlənilir (H1) |
| GPT-5 (plitə) zolaq 768×2048 | 1190 | ~38,760 | **32.6** | auditə alınmış sənədlər |
| GPT-5.4/5.5 (yamaq, original) 1568×5984-ə qədər | ~9,163 | ~233k | **25.4** | sənədlər; oxunaqlılıq sınanmayıb |
| gpt-4o-mini | 48,169/zolaq | — | **0.8 — HEÇ VAXT ŞƏKİLLƏŞDİRMƏYİN** | sənədlər (bug D2 düzəldilib) |
| Gemini plitə 1533×1152 (doğma kəsim vahidi 768) | 1032 | 43,615 | **42.3 ← ən yaxşı sənədləşdirilmiş** | sənədlər; oxunaqlılıq sınanmayıb |
| Gemini 3 media_resolution:low 1148×1152 | 280 | 32,604 | **116 (oxunaqlıdırsa)** | hipotez H6 |

## 4. Tapılmış və düzəldilmiş bug-lar (rəsmi sənədlərə qarşı audit)

| id | bug | təsir | commit |
|---|---|---|---|
| D2 | gpt-4o-mini standart plitə 85/170-ə düşürdü (əsl: 2833/5667) | xərc ~33× az qiymətləndirilib — **tərsinə çevrilmiş qapı** | e6bc75f |
| D1 | o4-mini vuruq əmsalı 1.62 (əsl 1.72) | −5.8% | e6bc75f |
| D3 | gpt-5.1/5.2/5.3(+codex) tavan 10000 ilə (əsl 1536, original yoxdur) | daha böyük səhifələrlə qırılardı | e6bc75f |
| D4 | gpt-5-codex-mini plitə rejimində (əsl: yamaq 1536) | ≥+23% az qiymətləndirilib | e6bc75f |
| D5 | detail:'original' hər model üçün hardkodlanıb (yalnız 5.4+-da mövcuddur) | müqavilədən kənar | e6bc75f |
| #44 | tiplənmiş alətlərə təsvir stub-u yeridilib → 400 + sükutlu fallback | qənaət siqnalsız sıfırlanıb | 0f66e32 |
| AA | "yalnız-qiymətləndirmə üçün" şərhinə qarşı istehsalatda AA atlası | Fable-də −17pp oxu | 9a25585 |
| — | slab cols 313 (1573px) → 0.997× yenidən nümunə + əlavə yamaq sütunu | 312-yə düzəldilib | əsas |

## 5. Açıq hipotezlər (hər birini bağlamaq nəyə başa gəlir)

| id | hipotez | cari sübut | qəti sınaq | xərc |
|---|---|---|---|---|
| H1 | 1928² səhifə birbaşa API-də ≥ standart oxuyur (WYSIWYG billinqdə sübut edilib) | yenidən nümunəsiz 4764 billinq; 1-bit pisləşmiş halda belə 67% oxuyur | birbaşa A/B std vs yüksək-çözünürlük (1-bit) | ~4 ABŞ dolları API |
| H2 | Birbaşa API-də yüksək-çözünürlük + 1-bit 3.3× az şəkillə ≈ 100% | H1 + 2×2 matris | H1 ilə eyni | eyni |
| H3 | CLI-nin Read-i və OpenRouter şəkilləri >1568/2000px kiçildir | eyni səhifədə 5×8 ölür, 10×16 sağ qalır | hər nəqliyyat üçün 20×32 qliflərlə bir 1928² səhifə | ~$0 (CLI) |
| H4 | İmtina çərçivələşdirmədən asılıdır (agent-fayl-oxuyur ≈ 0% vs xam API ≈ 100%) | yuxarıdakı nəqliyyat müqayisəsi | əsl proksi yolunda ifadə A/B | aşağı |
| H5 | Gemini plitə 1533×1152 5×8-də oxunaqlı (42 simvol/tok) | yoxdur | GEMINI_API_KEY ilə density-frontier | ~pulsuz (pulsuz səviyyə) |
| H6 | media_resolution:low oxunaqlı (116 simvol/tok) | ehtimal deyil (aşağı-çözünürlük kodlaşdırıcı), amma heç kim ölçməyib | 1 çağırış | ~pulsuz |
| H7 | GPT: zolaq oxunaqlılığı + tamamlama-tokeni şişkinliyi (PageWatch riski) | icma −40% prompt gördü, amma +tamamlama/2× gecikmə | OPENAI_API_KEY ilə density-frontier | ~$2-5 ABŞ dolları |
| H8 | Qlif cərrahiyyəsi (H~K, 0/8, 5/3…) imtinaları oxulara çevirir | 1-bit-dən sonra BÜTÜN Fable buraxılışları imtinaya çevrildi | ~10 bitmap redaktə et + matrisi yenidən işə sal | $0 (CLI) |
| H9 | İşıq teması (qara-ağ üzərində) > tərsinə çevrilmiş | ədəbiyyat (Glyph məqaləsi, Tesseract); kommersiya VLM-də heç ölçülməyib | üslub bayrağı + 2 qol | $0 (CLI) |
| H10 | Opus 7×10-da 0% (5×8) ilə 87% (10×16) arasında yerləşir → yaxşı mübadilə | upstream əyri n=20-də 7×10-da 35% | 1 əlavə qol | $0 (CLI) |
| H11 | Proksidə imtina-üzrə-təkrar-cəhd süzülmüş partiyaların ~50%-ni bərpa edir | zəng başına imtina stoxastikdir | tətbiq et + istehsalatda ölç | kod |

## 6. Əməliyyat gözləyən maddələr

1. `gh auth login` → şəxsi `diegosouzapw/omniglyph` yarat + push et (10 lokal commit).
2. Anthropic kreditləri (H1/H2, geometriya hökmü) və OpenRouter (tükənib).
3. Söhbətdə açıqlanmış Anthropic və OpenRouter **açarlarını dəyişdirin**.
4. Kod növbəsi: #45 (schema-strip draft-07), imtina-üzrə-təkrar-cəhd (H11), qlif
   cərrahiyyəsi (H8), Faza 4 (skriptlərdə TS, GIF-lər, sənədlər, panel v2), Faza 5
   (OmniRoute mühərriki).

## ƏLAVƏ 2026-07-06 — Birbaşa API vasitəsilə A/B (165 zəng): H1/H2 TƏKZİB EDİLDİ

| konfiqurasiya | dəqiq | imtina | imtina (refusal) | xətalar |
|---|---:|---:|---:|---:|
| fable std 5×8 (AA və 1-bit) | 0/60 | 0 | **60/60 imtina** | 0 |
| fable hires 5×8 AA | 2/30 | 21 | 3 | 4 (4 proqnozlaşdırılıb) |
| fable hires 5×8 1-bit | 1/30 | 23 | 1 | 3 (2 proqnozlaşdırılıb) |
| opus hires 10×16 | **23/30 (77%)** | 1 | 0 | 6 |

HÖKM: yüksək-çözünürlük səviyyəsinin 1928² səhifəsi WYSIWYG hesablanır (4764 tok,
sweep), amma KODLAŞDIRICI tam çözünürlüyü almır — 1-2/30 oxu, tək-qlif dəyişmə
xətaları ilə (6→8, a→4), daxili yenidən nümunənin imzası. **Billinq ≠ kodlaşdırıcı
girişi → tələ: 3.3× xərc, daha pis oxunaqlılıq.** TƏTBİQ EDİLDİ: pageGeometryForTier()
geri qaytarıldı — hər iki səviyyə 1568×728 render edir; səviyyə infrastrukturu
saxlanıb (dəqiq billinq etibarlı qalır və gələcək yenidən tənzimləmə 1 sətirdir). H3
yeniləndi: "nəqliyyat yenidən nümunəsi" (həmçinin) API-nin öz kodlaşdırıcısı idi.
Xam API vasitəsilə transkripsiyada imtina: standart səhifədə 100% (H4 gücləndi —
yalnız agent çərçivələşdirməsi qaçır). Opus 10×16 hər iki nəqliyyatda təsdiqləndi
(77-87%).

## ƏLAVƏ 2026-07-06 (2) — Birbaşa API vasitəsilə GPT-5.5 batareyası: H7 bağlandı (UĞURSUZ)

| qol | söz-be-söz | gist | çıxış/cavab |
|---|---:|---:|---:|
| zolaq 768×2048 5×8 AA | 0/30 (18 imtina, 5 süzülmüş, 7 xəta) | 0/3 | 2,639 tok |
| zolaq 5×8 1-bit | 0/30 (15 imtina, 5 süzülmüş, 10 xəta) | 1/3 | 2,383 tok |
| MƏTN (nəzarət) | **30/30** | **3/3** | **62 tok** |

GPT-5.5 5×8 qlifləri oxuya bilmir (0/60; hətta gist də sağ qalmır) və cəhd edərkən
tamamlamanı ~40× şişirdir (sual başına 2.4-2.7k əsaslandırma tokeni) — prompt
qənaəti çıxışla udulur. Mükəmməl mətn nəzarəti korpusun/sualların sağlam olduğunu
sübut edir. 5.5 könüllü qoşulmasını təsdiqləyir və kəmiyyətini müəyyən edir;
gpt-5.6 (standart) sınanmamış qalır (hesabın girişi yoxdur). Gələcək (H12): GPT
qapısı yalnız prompt tokenlərini deyil, çıxış şişkinliyini də modelləşdirməlidir.

## ƏLAVƏ 2026-07-06 (3) — Gemini 2.5-flash (QİSMƏN: kvota işin ortasında pulsuz-səviyyə üzrə bitdi)

Kvota ölmədən əvvəl keçən ~26 şəkil cavabından: **0 düzgün, 1 imtina,
~25 UYDURMA** — və bunlar qlif çaşqınlığı deyil: onlar təsadüfi rəqəmlərdir
(`indexLedgerInd → 0040375615`), yəni kodlaşdırıcı sınanmış sıxlıqlarda demək olar
ki, heç nə görmür (doğma plitə 42 simvol/tok və MEDIUM sabit) və 2.5-flash imtina
etmək əvəzinə İCAD EDİR (ILEGIVEL göstərişinə məhəl qoymur). Mətn nəzarəti: keçənlərin
3/3-ü. Çıxış şişkinliyi yoxdur (6-28 tok/cavab).

İlkin siqnal: H5/H6 2.5-flash-də XEYIR-ə meyllidir, GPT-nin uğursuzluğundan DAHA
PİS bir uğursuzluq rejimi ilə (imtina əvəzinə sükutlu uydurma) — Gemini proksidə
əlavə qoruyucular tələb edərdi. Bağlanmalı qalanlar: ödənişli kvota ilə və ya başqa
gündə yenidən işə salmaq, və gemini-2.5-pro-nu sınamaq (flash ailənin ən zəif
oxuyucusudur). Doğma-plitə səhifəsi hələ də ən yaxşı SƏNƏDLƏŞDİRİLMİŞ nisbətə malikdir
(42.3 simvol/token); şübhəli olan oxunaqlılıqdır.

Xərc qeydi: qismən səhifələr (korpusun sonuncusu) plitə rejimində pis hesablanır
(qısa hündürlük → kiçik kəsim vahidi → daha çox plitə) — sonuncu səhifəni 1152px
hündürlüyünə doldurmaq Gemini daxil olarsa məcburi optimallaşdırmadır.
