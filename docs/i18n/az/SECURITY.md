# Təhlükəsizlik Siyasəti

## Zəifliklərin bildirilməsi

GitHub-da şəxsi təhlükəsizlik məsləhəti açın
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) və ya
saxlayıcı ilə birbaşa əlaqə saxlayın (diegosouza.pw@outlook.com). İstismar
edilə bilən zəiflik üçün ictimai issue açmayın.

## Təhdid modeli (OmniGlyph nədir)

OmniGlyph müştəriniz (məsələn Claude Code) ilə LLM API-ləri arasında **lokal
proksidir**. Dizayn etibarilə bütün sessiya məzmununuzu və köçürmə zamanı
etimadnamələrinizi görür. Müvafiq təhlükəsizlik qərarları:

- **Standart olaraq loopback-a bağlanır** (`127.0.0.1`): panelin autentifikasiyası
  yoxdur və tutulmuş sessiya konteksini (şəkillərin mənbə mətnini, telemetriyanı)
  xidmət edir. `HOST=0.0.0.0` açıq bir qoşulma seçimidir və bunların hamısını şəbəkəyə
  açır — yalnız etibarlı şəbəkədə istifadə edin.
- **Etimadnamələr**: proksi müştərinin auth başlıqlarını yuxarı axına ötürür və
  onları saxlamır. Env vasitəsilə verilən açarlar (`ANTHROPIC_API_KEY` və s.)
  yaddaşda qalır.
- **Lokal telemetriya**: `~/.omniglyph/events.jsonl` sorğu-başına metadata (token
  sayları, gövdə hash-ları) və, 4xx xətalarında, sıxılmış gövdə nümunələri saxlayır —
  faylı həssas kimi qiymətləndirin.
- **Şəkilləşdirilmiş məzmun itkilidir**: bayt-dəqiq dəyərlər (sirlər, hash-lar) heç
  vaxt şəkil oxularından asılı olmamalıdır; boru xətti onları mətn kimi saxlayır, amma
  qızıl qayda budur: LLM kontekstinə sirlər qoymayın.
- **Tədarük zənciri**: `pnpm-workspace.yaml` istənilən yeni paket üçün 3 günlük
  `minimumReleaseAge` tələb edir; nüvənin yalnız bir işləmə vaxtı asılılığı var.

## Dəstəklənən versiyalar

Yalnız son buraxılış xətti (`main` / ən son `v1.x`) düzəlişlər alır.
