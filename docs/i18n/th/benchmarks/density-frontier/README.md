# density-frontier — ต้นทุน × ความแม่นยำต่อความละเอียด

🌐 แปลแล้ว: [ทุกภาษา](../../../README.md)

ชุดทดสอบที่วัด **ขอบเขต Pareto ระหว่างต้นทุนและความสามารถในการอ่าน** ของ
การเรนเดอร์ข้อความ→ภาพ ต่อผู้ให้บริการ (Anthropic / OpenAI / Gemini), รูปทรงหน้า,
เซลล์กลิฟ และสไตล์ atlas

หน้าที่ถูกกว่า (หนาแน่นกว่า) บรรจุตัวอักษรต่อโทเคนได้มากกว่า แต่ในที่สุดก็
เริ่มอ่านไม่ได้ คอนฟิกจะถูกนำไปใช้งานจริงได้ก็ต่อเมื่อ **ทั้งสองเงื่อนไข**
เป็นจริง — ต้นทุนต่ำ *และ* โมเดลยังคงอ่านได้อย่างสมบูรณ์แบบ:

```
  cost  ▲
 (tokens│  cheap
  /char)│    ·  high-res 1928²   ← ~2/30 reads  (billing trap, blocked)
        │        ·
        │            ●  std 1-bit page  ← 30/30 reads  ✅ the production pick
        │                ·
        │  expensive         ·  AA page ← 25/30 (5 abstain)
        └────────────────────────────────▶  read accuracy
                                        100%

  the sweet spot is the ● : lowest cost that still reads 30/30.
```

คำตอบทุกข้อจะถูกให้คะแนนเป็นหนึ่งในสามผลลัพธ์เท่านั้น — ผลลัพธ์ตรงกลางคือ
สิ่งที่ทำให้เกทนี้น่าเชื่อถือ:

```
  ✅ correct        exact string read back
  🟡 abstained      model said "ILEGIVEL" — an HONEST "I can't read it"
  🔴 silent_wrong   model returned a confident WRONG value  ← the dangerous mode
```

คอนฟิกที่ให้ผล 🔴 แม้เพียงหนึ่งครั้งจะถูกตัดสิทธิ์ทันที ไม่ว่าจะถูกแค่ไหนก็ตาม

ความไม่สมมาตรหลัก: นับตั้งแต่การ billing sweep (2026-07-05,
`benchmarks/billing-sweep/`), **ต้นทุนสามารถคาดการณ์ได้แบบเป๊ะออฟไลน์** — แพตช์ 28 px
+ 4/บล็อกบน Anthropic (`src/core/anthropic-vision.ts`), โปรไฟล์แพตช์/ไทล์
บน OpenAI (`src/core/openai.ts`), ไทล์/media_resolution บน Gemini
(`gemini-cost.ts`) มีเพียง **ความแม่นยำในการอ่าน** เท่านั้นที่ต้องใช้ API

## การออกแบบ

- **Corpus** (`corpus.ts`): ตัวเติมสไตล์ log/JSON หนาแน่น + needle ที่ปลูกไว้จาก
  คลาสที่เมทริกซ์ความสับสนบอกว่าจะล้มเหลว (hex 12 ตัวอักษร, camelCase,
  ตัวเลข 6/8/5/3) + **ตัวหลอกแบบ near-miss** สร้างจากคู่ที่วัดได้ว่า
  สับสนได้จริง ถ้าโมเดลตอบด้วยตัวหลอก แสดงว่าความสับสนนั้น
  *คาดการณ์ได้* — นั่นคือโหมดความล้มเหลวแบบเงียบที่กำลังถูกตรวจจับ ไม่ใช่แค่
  นับว่าผิด กำหนดผลลัพธ์แน่นอน (mulberry32)
- **คอนฟิก** (`configs.ts`): กริดที่คัดสรรไว้ — หน้ามาตรฐาน 1568×728 เทียบกับ
  ความละเอียดสูง 1928×1928 (A/B ที่ตัดสินรูปทรงต่อระดับ), AA เทียบกับ 1-bit
  (แก้ความขัดแย้งของการเรนเดอร์ความหนาแน่นสูง), เซลล์ 7×10/10×16 (โหมดปลอดภัยของ
  Opus), แถบ GPT และสมมติฐานของ Gemini สองข้อ (≤384² = 258 คงที่;
  `media_resolution: low` = 280 คงที่ → ~116 ตัวอักษร/โทเคน *ถ้า* อ่านได้)
- **คะแนน** (`score.ts`): จับคู่แบบเป๊ะที่กำหนดผลลัพธ์แน่นอน ไม่มี LLM เป็นกรรมการ สาม
  ผลลัพธ์: `correct` / `abstained` (สัญลักษณ์ ILEGIVEL — ความล้มเหลวแบบซื่อสัตย์) /
  `silent_wrong` (โหมดอันตราย) พร้อมแฟล็กตัวหลอก

## การรัน

```bash
pnpm exec tsx benchmarks/density-frontier/run.ts --dry-run     # cost table, $0

ANTHROPIC_API_KEY=... OPENAI_API_KEY=... GEMINI_API_KEY=... \
  pnpm exec tsx benchmarks/density-frontier/run.ts --trials 2  # ~9 needles+3 gist × config × trial
```

คอนฟิกเฉพาะ: `--configs anthropic-std-5x8-aa,anthropic-hires-5x8-aa`
คำตอบจะไปอยู่ใน `results/*.jsonl` (หนึ่งบรรทัดต่อคำถาม พร้อมคำตอบดิบ
สำหรับการตรวจสอบ)

## เกณฑ์การยอมรับ (สืบทอดจาก upstream PR #35/#36)

คอนฟิกจะกลายเป็นค่าเริ่มต้นสำหรับใช้งานจริงได้ก็ต่อเมื่อ: **gist == baseline
ข้อความ** และ **ไม่มี silent wrong exact string เลย** และ **การประหยัดเป็นบวก**
การรันแรกที่จำเป็นคือ `anthropic-std-5x8-aa` เทียบกับ `anthropic-hires-5x8-aa` บน Fable —
การตรวจสอบความสามารถในการอ่านของหน้าใหญ่แบบสุ่มตรวจ ก่อนเปิดใช้ระดับความละเอียดสูง

## `--via-omniroute` — end-to-end ผ่าน OmniRoute (P3: การพิสูจน์ไม่มีการเสื่อมคุณภาพ)

ช่องทางการส่งข้อมูลข้างต้นเรนเดอร์ข้อความ→PNG **ในตัวชุดทดสอบเอง** แล้วส่งภาพไป
`--via-omniroute` ทำตรงกันข้าม ซึ่งเป็นเส้นทางที่ใช้งานจริง: มันส่ง
**ข้อความหนาแน่น** ไปยังอินสแตนซ์ OmniRoute ที่กำลังรันอยู่ ให้เอนจิน
**`omniglyph` เรนเดอร์** หน้าและส่งต่อไปยัง Anthropic แล้ววัดผลการอ่าน +
การประหยัด ถ้าการอ่านยังคงเหมือนกับเส้นทางตรง **และ** OmniRoute รายงาน
การบีบอัด ก็พิสูจน์ได้ว่าการเรนเดอร์+ส่งต่อของ OmniRoute **ไม่ทำให้**
หน้าเสื่อมคุณภาพ

ข้อกำหนดเบื้องต้น (เชิงปฏิบัติการ):

1. **OmniRoute กำลังทำงานอยู่** (`npm run dev`, ค่าเริ่มต้น `http://localhost:20128`)
2. **ผู้ให้บริการ Anthropic** ที่ตั้งค่าไว้ใน OmniRoute พร้อม **คีย์จริง** (เส้นทาง
   ตรง — เกท `providerTransport==='direct'` จะผ่านเฉพาะผู้ให้บริการ `anthropic` เท่านั้น)
3. **เอนจิน `omniglyph` เปิดใช้งานแล้ว** ในคอนฟิกการบีบอัดของ OmniRoute
   (`config.engines.omniglyph.enabled = true`) — header `engine:omniglyph` จะทำงานก็ต่อเมื่อ
   เอนจินเปิดอยู่เท่านั้น (เอนจินเป็น `stable:false`/preview; ต้องเปิดใช้งานเอง)
4. **API key ของ OmniRoute** ใน `OMNIROUTE_API_KEY` (คีย์ที่ไคลเอนต์ใช้เพื่อ
   ยืนยันตัวตนกับ OmniRoute ไม่ใช่คีย์ของ Anthropic)

```bash
OMNIROUTE_URL=http://localhost:20128 \
OMNIROUTE_API_KEY=<your-omniroute-key> \
  pnpm exec tsx benchmarks/density-frontier/run.ts \
    --via-omniroute --configs anthropic-std-5x8-1bit --trials 2
```

แต่ละคำตอบบันทึก `omnirouteSavings: { originalTokens, compressedTokens, savingsPercent }`
(จาก header ผลลัพธ์ `X-OmniRoute-Compression`) ใน JSONL; แถวในตารางแสดง
จำนวนคำตอบที่กลับมาแบบบีบอัดแล้ว + การประหยัดค่ามัธยฐาน **เกณฑ์ P3**: ผลการอ่านแบบ
verbatim/gist เท่ากับเส้นทางตรง (ไม่มีการเสื่อมคุณภาพ) **พร้อม** `omnirouteSavings`
ที่ไม่ใช่ null (พิสูจน์ว่ามีการเรนเดอร์เกิดขึ้นจริง ไม่ใช่การอ่านข้อความดิบ) ถ้าปรากฏ
`did NOT compress` แสดงว่าเอนจินยังไม่ได้เปิดใช้งานใน OmniRoute (หรือ body
ไม่ผ่านเกท fail-closed)

การทดสอบส่วนที่บริสุทธิ์: `tests/density-frontier.test.ts` (รวม `buildOmnirouteRequest`
และ `parseCompressionSavings` จากตัวส่งข้อมูล via-omniroute)
