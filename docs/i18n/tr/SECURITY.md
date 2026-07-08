# Güvenlik Politikası

## Güvenlik açıklarını bildirme

GitHub üzerinde özel bir güvenlik danışma belgesi açın
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) veya
doğrudan bakım sorumlusuyla iletişime geçin (diegosouza.pw@outlook.com).
İstismar edilebilir bir güvenlik açığı için herkese açık bir issue açmayın.

## Tehdit modeli (OmniGlyph nedir)

OmniGlyph, istemciniz (örn. Claude Code) ile LLM API'leri arasında **yerel
bir proxy**'dir. Tasarım gereği, oturumunuzun tüm içeriğini ve iletim
sırasındaki kimlik bilgilerinizi görür. İlgili güvenlik kararları:

- **Varsayılan olarak loopback'e bağlanır** (`127.0.0.1`): dashboard'da
  kimlik doğrulama yoktur ve yakalanan oturum bağlamını sunar (görüntülerin
  kaynak metni, telemetri). `HOST=0.0.0.0` açık bir opt-in'dir ve bunların
  hepsini ağa açar — yalnızca güvenilir bir ağda kullanın.
- **Kimlik bilgileri**: proxy, istemcinin auth başlıklarını upstream'e
  iletir ve bunları kalıcı hale getirmez. Env aracılığıyla sağlanan
  anahtarlar (`ANTHROPIC_API_KEY` vb.) bellekte kalır.
- **Yerel telemetri**: `~/.omniglyph/events.jsonl`, istek başına metadata
  (token sayıları, gövde hash'leri) ve 4xx hatalarında sıkıştırılmış gövde
  örnekleri tutar — dosyayı hassas olarak değerlendirin.
- **Görüntülenen içerik kayıplıdır**: byte-tam değerler (sırlar, hash'ler)
  asla görüntü okumalarına bağlı olmamalıdır; pipeline bunları metin olarak
  tutar, ancak altın kural şudur: LLM bağlamına sır koymayın.
- **Tedarik zinciri**: `pnpm-workspace.yaml`, yeni herhangi bir paket için
  3 günlük bir `minimumReleaseAge` uygular; core'un tek bir runtime
  bağımlılığı vardır.

## Desteklenen sürümler

Yalnızca en son sürüm hattı (`main` / en son `v1.x`) düzeltme alır.
