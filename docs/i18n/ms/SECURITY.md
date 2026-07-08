# Dasar Keselamatan

## Melaporkan kerentanan

Buka nasihat keselamatan peribadi di GitHub
(<https://github.com/diegosouzapw/OmniGlyph/security/advisories/new>) atau
hubungi penyelenggara secara terus (diegosouza.pw@outlook.com). Jangan buka
isu awam untuk kerentanan yang boleh dieksploitasi.

## Model ancaman (apa itu OmniGlyph)

OmniGlyph ialah **proksi tempatan** antara klien anda (contohnya Claude Code)
dan API LLM. Mengikut reka bentuk, ia melihat semua kandungan sesi anda dan
kelayakan anda semasa transit. Keputusan keselamatan yang berkaitan:

- **Mengikat kepada loopback secara lalai** (`127.0.0.1`): papan pemuka tidak
  mempunyai pengesahan dan menyajikan konteks sesi yang ditangkap (teks
  sumber imej, telemetri). `HOST=0.0.0.0` ialah opt-in nyata dan mendedahkan
  semua itu kepada rangkaian — hanya gunakan pada rangkaian yang dipercayai.
- **Kelayakan**: proksi menghantar header pengesahan klien kepada upstream
  dan tidak menyimpannya. Kunci yang dibekalkan melalui env
  (`ANTHROPIC_API_KEY` dll.) kekal dalam memori.
- **Telemetri tempatan**: `~/.omniglyph/events.jsonl` menyimpan metadata
  setiap permintaan (kiraan token, hash badan) dan, pada ralat 4xx, sampel
  badan yang dimampatkan — anggap fail ini sensitif.
- **Kandungan yang dijadikan imej bersifat lossy**: nilai tepat-bait (rahsia,
  hash) tidak boleh sekali-kali bergantung pada bacaan imej; saluran paip
  mengekalkannya sebagai teks, tetapi peraturan emas ialah: jangan letak
  rahsia dalam konteks LLM.
- **Rantaian bekalan**: `pnpm-workspace.yaml` menguatkuasakan
  `minimumReleaseAge` selama 3 hari untuk sebarang pakej baharu; teras
  mempunyai satu kebergantungan runtime sahaja.

## Versi yang disokong

Hanya barisan keluaran terkini (`main` / `v1.x` terbaharu) menerima pembaikan.
