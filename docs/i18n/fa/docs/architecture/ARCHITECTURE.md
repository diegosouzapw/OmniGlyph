# معماری

نقشهٔ یک‌صفحه‌ای پایگاه کد.

## Pipeline درخواست

```
client (Claude Code / any SDK)
  │  ANTHROPIC_BASE_URL=http://127.0.0.1:47821
  ▼
src/node.ts · src/worker.ts        hosts (node:http / Cloudflare Workers)
  ▼
src/core/proxy.ts                  single Web-standard fetch handler:
  │                                routing, auth passthrough, count_tokens
  │                                counterfactual, usage/telemetry events
  ▼
src/core/transform.ts              THE pipeline (Anthropic path):
  │   1. parse body, resolve vision tier from model
  │   2. profitability gate — exact image cost vs text cost
  │   3. convert: static slab · large tool_results · collapsed history
  │   4. splice back preserving the client's cache_control anchors
  ▼
upstream API (api.anthropic.com / api.openai.com)
```

## صورت‌حساب (دقیق، اندازه‌گیری‌شده)

| ماژول | ارائه‌دهنده | مدل |
|---|---|---|
| `src/core/anthropic-vision.ts` | Anthropic | پچ‌های ۲۸ پیکسلی + ۴/بلاک، سقف‌های تغییر اندازه به‌ازای هر لایه؛ هندسهٔ صفحه (هر دو لایه صفحهٔ استاندارد 1568×728 را رندر می‌کنند — لایهٔ وضوح‌بالا یک تلهٔ صورت‌حساب است، به [BENCHMARKS](../benchmarks/BENCHMARKS.md) مراجعه کنید) |
| `src/core/gpt-model-profiles.ts` + `openai.ts` | OpenAI | رژیم‌های پچ/تایل به‌ازای هر مدل، `detail` به‌ازای هر پروفایل، هندسهٔ strip |
| `src/core/gemini-model-profiles.ts` | Google | فرمول تایل (واحد برش `floor(min/1.5)`) + هزینه‌های ثابت `media_resolution` |

## رندر

- `src/core/render.ts` — تبدیل متن به PNG از طریق یک اطلس گلیف پخته‌شده
  (Spleen 5×8 + بازگشت به Unifont)، reflow با نشانگرهای خط جدید `↵`، اطلس
  ۱-بیتی در تولید (اندازه‌گیری‌شده بهتر از AA روی Fable).
- `src/core/render-cache.ts` — حافظه‌گذاری LRU برای رندرهای قطعی (اسلب
  ثابت + بخش‌های منجمد تاریخچه که در غیر این صورت در هر درخواست دوباره
  رندر می‌شوند).
- `src/core/history.ts` — نوبت‌های قدیمی را به بخش‌های تصویری منجمد و
  append-only فشرده می‌کند که بایت-یکسان می‌مانند تا کش پرامپت همچنان کار
  کند.
- `src/core/png.ts` — رمزگذار PNG قطعی و حداقلی (بدون وابستگی بومی).

## نگهبان‌ها

- allowlist مدل (`src/core/applicability.ts`): فقط مدل‌هایی که در بنچمارک
  خواندن قبول شده‌اند تصویر می‌شوند؛ بقیه بایت-یکسان عبور می‌کنند.
- مقادیر بایت-دقیق (SHAها، شناسه‌ها) به‌صورت متن در یک factsheet کنار
  تصویر سوار می‌شوند (`src/core/factsheet.ts`)؛ اصل‌های قابل‌بازیابی از طریق
  `emitRecoverable`.
- ابزارهای بومی تایپ‌شده (`type !== 'custom'`) هرگز بازنویسی نمی‌شوند
  (گارد 400).

## بنچمارک‌ها و رسیدها

`benchmarks/` دو مجموعه‌ای را نگه می‌دارد که هر عدد در README را تولید
کرده‌اند — به [benchmarks/README.md](../../benchmarks/README.md) مراجعه
کنید.
