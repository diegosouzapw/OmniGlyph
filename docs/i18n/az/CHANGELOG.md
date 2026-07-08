# Dəyişikliklər Jurnalı

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · semantik versiyalaşdırma.

## [1.0.0] — 2026-07-07

İlk ictimai buraxılış.

### Məhsul

- **Kontekst-şəkil-kimi sıxma proksisi**: hər LLM sorğusunun həcmli hissələrini
  (system prompt, alət sənədləri, köhnə tarixçə, böyük alət çıxışları) maşınınızdan
  çıxmazdan əvvəl sıx 1-bit PNG səhifələrinə yenidən yazır. Lokal Node serveri və
  Cloudflare Workers hostu.
- **Provayder üzrə dəqiq billinq riyaziyyatı** (`src/core/`): Anthropic 28px yamaqlar +
  blok başına 3–4 token yükü (öz sweep-imiz, sıfır qalıq), OpenAI və Gemini
  düsturları rəsmi sənədlərə qarşı auditə alınıb. Paket kökündə ixrac olunur
  (`anthropicImageTokens`, `resolveAnthropicVisionTier`, səviyyə tavanları).
- **Ölçülmüş istehsalat render konfiqurasiyası**: sıx 1-bit qlif atlası (anti-aliasing
  yoxdur), standart-səviyyə səhifələr — hər seçim `benchmarks/*/results/`-da benchmark
  qəbzi ilə dəstəklənir.
- **Benchmark hərnəsləri** (`benchmarks/`): billing-sweep (token uçotu) və
  density-frontier (modellər/sıxlıqlar üzrə oxu-dəqiqliyi sərhədi), API, OpenRouter,
  Claude Code CLI vasitəsilə və ya OmniRoute üzərindən (`--via-omniroute`) yenidən
  işə salına bilir.
- **İmtina üzrə təkrar cəhd**: SSE/JSON sniffer model render olunmuş səhifəni imtina
  edəndə orijinal sorğunu təkrarlayır (öldürmə açarı `retryRefusalWithOriginal`).
- Deterministik səhifələr üçün **LRU render keşi**.
- **OmniRoute mühərriki**: [OmniRoute](https://github.com/diegosouzapw/OmniRoute)-da
  `omniglyph` sıxma mühərriki kimi çıxış edir (tək rejim və yığılmış boru xətti),
  fail-closed qapılar və şəkil-şüurlu token uçotu ilə.

### Rəqəmlər (hamısı təkrarlanabilir)

- Nümunə UI render: 1015 simvol → 438×120 PNG, 254 → 84 token (**66.9% qənaət**).
- Standart səhifə 1568×728 = neçə mətn olmasından asılı olmayaraq 1456 şəkil tokeni.
- Claude istehsalat sıxlığında sıx 1-bit səhifələri 100%-lə oxuyur; Opus 4.8 10×16-da
  77–87% oxuyur.

### Mənfi qərarlar (ölçülüb, rəy deyil)

- **Yüksək-çözünürlük səviyyəsi billinq tələsidir**: 1928² səhifə WYSIWYG hesablanır,
  amma kodlaşdırıcı tam çözünürlüyü almır — hər iki səviyyə standart səhifələri render
  edir.
- **GPT-5.5 rədd edilib**: sıx zolağın 0/60 oxusu və mətn nəzarətinə qarşı ~40×
  tamamlama şişkinliyi.
- **gpt-4o-mini heç vaxt şəkilləşdirilmir** (2833/5667 token tavanı onu sərfəsiz edir).
- **Gemini 2.5-flash** sıx səhifələrdə imtina etmək əvəzinə **uydurur** (0/26) —
  ödənişli kvota ilə yenidən sınaq gözlənilir.
