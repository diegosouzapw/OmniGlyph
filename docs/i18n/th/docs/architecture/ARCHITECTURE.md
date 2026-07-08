# สถาปัตยกรรม

แผนผังโค้ดในหน้าเดียว

## Pipeline ของคำขอ

```
ไคลเอนต์ (Claude Code / SDK ใดก็ตาม)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        โฮสต์ (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  fetch handler เดียวตามมาตรฐาน Web:
  │                                การจัดเส้นทาง, การส่งต่อ auth, ค่าตรงข้าม
  │                                count_tokens, เหตุการณ์การใช้งาน/ข้อมูลทางไกล
  ▼
src/core/transform.ts              ตัว pipeline หลัก (เส้นทาง Anthropic):
  │   1. แยกวิเคราะห์ body, กำหนดระดับการมองเห็นจากโมเดล
  │   2. เกทตรวจสอบความคุ้มค่า — ต้นทุนภาพแบบเป๊ะ เทียบกับ ต้นทุนข้อความ
  │   3. แปลง: slab แบบคงที่ · tool_results ขนาดใหญ่ · ประวัติที่ยุบรวม
  │   4. นำกลับเข้าที่เดิม โดยรักษา anchor cache_control ของไคลเอนต์
  ▼
API upstream (api.anthropic.com / api.openai.com)
```

## การคิดค่าใช้จ่าย (แบบเป๊ะ วัดผลแล้ว)

| โมดูล | ผู้ให้บริการ | โมเดล |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | แพตช์ 28 px + 4/บล็อก, ขีดจำกัดการปรับขนาดตามระดับ; รูปทรงหน้า (ทั้งสองระดับเรนเดอร์หน้ามาตรฐาน 1568×728 — ระดับความละเอียดสูงเป็นกับดักด้านค่าใช้จ่าย ดู [BENCHMARKS](../benchmarks/BENCHMARKS.md)) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | ระบอบแพตช์/ไทล์ต่อโมเดล, `detail` ต่อโปรไฟล์, รูปทรงแถบ |
| `src/core/gemini-model-profiles.ts` | Google | สูตรไทล์ (หน่วยครอป `floor(min/1.5)`) + ต้นทุนคงที่ของ `media_resolution` |

## การเรนเดอร์

- `src/core/render.ts` — ข้อความ → PNG ผ่าน atlas กลิฟที่คอมไพล์ไว้ล่วงหน้า
  (Spleen 5×8 + fallback Unifont), reflow ด้วยสัญลักษณ์ขึ้นบรรทัดใหม่
  `↵`, atlas แบบ 1-bit ในการใช้งานจริง (วัดผลแล้วว่าดีกว่า AA บน Fable)
- `src/core/render-cache.ts` — การจดจำผลลัพธ์แบบ LRU สำหรับการเรนเดอร์ที่กำหนดผลลัพธ์แน่นอน
  (slab แบบคงที่ + chunk ประวัติที่หยุดนิ่งจะถูกเรนเดอร์ใหม่ทุกคำขอ
  ถ้าไม่มีแคชนี้)
- `src/core/history.ts` — ยุบรวมการสนทนาเก่าเป็น chunk ภาพแบบเพิ่มต่อท้ายเท่านั้น
  ที่หยุดนิ่ง ซึ่งคงความเหมือนเดิมทุกไบต์ เพื่อให้
  แคชของ prompt ยังคงตรงกันต่อไป
- `src/core/png.ts` — ตัวเข้ารหัส PNG แบบกำหนดผลลัพธ์แน่นอนขนาดเล็ก (ไม่มี dependency
  แบบเนทีฟ)

## Guard rails

- Allowlist ของโมเดล (`src/core/applicability.ts`): เฉพาะโมเดลที่
  ผ่าน benchmark การอ่านเท่านั้นที่ถูกแปลงเป็นภาพ; ที่เหลือ
  ผ่านไปโดยเหมือนเดิมทุกไบต์
- ค่าที่ต้องเป๊ะทุกไบต์ (SHA, id) เดินทางเป็นข้อความในแฟ็กต์ชีตข้าง
  ภาพ (`src/core/factsheet.ts`); ต้นฉบับกู้คืนได้ผ่าน
  `emitRecoverable`
- เครื่องมือเนทีฟแบบมีชนิด (`type !== 'custom'`) จะไม่ถูกเขียนใหม่เด็ดขาด
  (guard 400)

## Benchmark และหลักฐาน

`benchmarks/` เก็บชุดทดสอบทั้งสองที่สร้างทุกตัวเลขใน README
— ดู [benchmarks/README.md](../../benchmarks/README.md)
