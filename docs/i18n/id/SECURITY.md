# Kebijakan Keamanan

## Melaporkan kerentanan

Buka advisory keamanan pribadi di GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) atau
hubungi maintainer langsung (diegosouza.pw@outlook.com). Jangan membuka issue
publik untuk kerentanan yang dapat dieksploitasi.

## Model ancaman (apa itu OmniGlyph)

OmniGlyph adalah **proxy lokal** antara klien Anda (mis. Claude Code) dan API
LLM. Secara desain ia melihat seluruh konten sesi Anda dan kredensial Anda
saat transit. Keputusan keamanan yang sesuai:

- **Terikat ke loopback secara default** (`127.0.0.1`): dashboard tidak
  memiliki autentikasi dan menyajikan konteks sesi yang ditangkap (teks
  sumber dari gambar, telemetri). `HOST=0.0.0.0` adalah opt-in eksplisit dan
  mengekspos semua itu ke jaringan — hanya gunakan di jaringan yang
  tepercaya.
- **Kredensial**: proxy meneruskan header auth klien ke upstream dan tidak
  menyimpannya. Key yang disediakan lewat env (`ANTHROPIC_API_KEY` dll.)
  tetap di memori.
- **Telemetri lokal**: `~/.omniglyph/events.jsonl` menyimpan metadata per
  permintaan (jumlah token, hash body) dan, pada error 4xx, sampel body yang
  dikompresi — perlakukan file ini sebagai sensitif.
- **Konten yang digambar bersifat lossy**: nilai byte-exact (secret, hash)
  tidak boleh bergantung pada pembacaan gambar; pipeline menyimpannya sebagai
  teks, tetapi aturan emasnya adalah: jangan taruh secret di konteks LLM.
- **Rantai pasok**: `pnpm-workspace.yaml` menegakkan `minimumReleaseAge`
  sebesar 3 hari untuk paket baru mana pun; core memiliki satu runtime
  dependency.

## Versi yang didukung

Hanya lini rilis terbaru (`main` / `v1.x` terbaru) yang menerima perbaikan.
