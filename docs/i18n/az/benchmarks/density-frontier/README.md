# density-frontier — çözünürlük üzrə xərc × dəqiqlik

Provayder (Anthropic / OpenAI / Gemini), səhifə geometriyası, qlif xanası və atlas
üslubu üzrə mətn→şəkil render-lərinin **xərc ilə oxunaqlılıq arasındakı Pareto
sərhədini** ölçən hərnəs.

Mərkəzi asimmetriya: billinq sweep-indən bəri (2026-07-05,
`benchmarks/billing-sweep/`), **xərc oflayn tam dəqiqliklə proqnozlaşdırılabilir**
— Anthropic-də 28 px yamaqlar + 4/blok (`src/core/anthropic-vision.ts`),
OpenAI-da yamaq/plitə profilləri (`src/core/openai.ts`), Gemini-da
plitələr/media_resolution (`gemini-cost.ts`). Yalnız **oxu dəqiqliyi** API tələb
edir.

## Dizayn

- **Korpus** (`corpus.ts`): sıx log/JSON-üslublu doldurucu + çaşdırıcılıq
  matrisinin uğursuz olacağını söylədiyi siniflərdən əkilmiş iynələr (12-simvollu
  hex, camelCase, rəqəmlər 6/8/5/3) + ölçülmüş çaşdırıcı cütlərdən qurulmuş
  **yaxın-buraxılış distraktorları**. Model distraktorla cavab verərsə, çaşqınlıq
  *proqnozlaşdırılmışdı* — aşkar edilən sükutlu uğursuzluq rejimi budur, sadəcə
  yanlış sayılmır. Deterministikdir (mulberry32).
- **Konfiqurasiyalar** (`configs.ts`): seçilmiş şəbəkə — standart 1568×728
  səhifələr vs yüksək-çözünürlük 1928×1928 (səviyyə-üzrə geometriyaya qərar verən
  A/B), AA vs 1-bit (sıx-render ziddiyyətini həll edir), 7×10/10×16 xana (Opus
  təhlükəsiz rejimi), GPT zolağı, və iki Gemini mərci (≤384² = 258 sabit;
  `media_resolution: low` = 280 sabit → *oxunaqlıdırsa* ~116 simvol/token).
- **Qiymətləndirmə** (`score.ts`): deterministik dəqiq uyğunluq, LLM-hakim yoxdur.
  Üç nəticə: `correct` / `abstained` (ILEGIVEL sentinel — dürüst uğursuzluq) /
  `silent_wrong` (təhlükəli rejim), distraktor bayrağı ilə.

## İşə salma

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # xərc cədvəli, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # konfiqurasiya × sınaq başına ~9 iynə+3 gist
```

Xüsusi konfiqurasiyalar: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`.
Cavablar `results/*.jsonl`-a düşür (sual başına bir sətir, audit üçün xam cavabla).

## Qəbul çubuğu (upstream PR #35/#36-dan miras qalıb)

Konfiqurasiya yalnız bu halda istehsalat standartına çevrilir: **gist == mətn
əsası** VƏ **sıfır sükutlu səhv dəqiq sətir** VƏ **müsbət qənaət**. İlk məcburi
işə salma Fable-də `anthropic-std-5x8-aa` vs `anthropic-hires-5x8-aa`-dır —
yüksək-çözünürlük səviyyəsini aktiv etmədən əvvəl böyük səhifənin oxunaqlılıq
nöqtə-yoxlaması.

## `--via-omniroute` — OmniRoute vasitəsilə e2e (P3: deqradasiya-olmama sübutu)

Yuxarıdakı nəqliyyatlar mətn→PNG-ni **hərnəs daxilində** render edir və şəkilləri
göndərir. `--via-omniroute` əksini edir, bu isə istehsalat yoludur: **sıx mətni**
işləyən bir OmniRoute nüsxəsinə göndərir, **`omniglyph` mühərrikinin** səhifələri
render etməsinə və Anthropic-ə ötürməsinə icazə verir, və oxuları + qənaətləri
ölçür. Oxular birbaşa marşrutla eyni qalırsa **və** OmniRoute sıxılma bildirirsə,
OmniRoute-un render+ötürməsinin səhifələri **deqradasiyaya uğratmadığı** sübut
edilir.

Ilkin şərtlər (əməliyyat):

1. **OmniRoute işə salınıb** (`npm run dev`, standart `http://localhost:20128`).
2. OmniRoute-da **real açarla** konfiqurasiya edilmiş **Anthropic provayderi**
   (birbaşa marşrut — `providerTransport==='direct'` qapısı yalnız `anthropic`
   provayderi üçün keçir).
3. OmniRoute-un sıxılma konfiqurasiyasında **ENABLED `omniglyph` mühərriki**
   (`config.engines.omniglyph.enabled = true`) — `engine:omniglyph` başlığı
   yalnız mühərrik aktiv olanda işə düşür. (Mühərrik `stable:false`/preview-dir;
   açıq şəkildə aktiv edin.)
4. `OMNIROUTE_API_KEY`-də bir **OmniRoute API açarı** (müştərinin OmniRoute-a
   qarşı autentifikasiya üçün istifadə etdiyi açar, Anthropic açarı yox).

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<sizin-omniroute-açarınız> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

Hər cavab JSONL-də `omnirouteSavings: { originalTokens, compressedTokens,
savingsPercent }` qeyd edir (`X-OmniRoute-Compression` cavab başlığından);
cədvəl sətri neçə cavabın sıxılmış qayıtdığını + median qənaəti göstərir. **P3
çubuğu**: birbaşa marşrutla eyni söz-be-söz/gist uğurları (deqradasiya-olmama)
**VƏ** null olmayan `omnirouteSavings` (render baş verdiyini sübut edir, xam-mətn
oxu yox). `did NOT compress` görünərsə, mühərrik OmniRoute-da aktiv deyil (və ya
gövdə fail-closed qapılardan keçmədi).

Xalis hissələr üçün testlər: `tests/density-frontier.test.ts` (via-omniroute
nəqliyyatından `buildOmnirouteRequest` və `parseCompressionSavings` daxil olmaqla).
