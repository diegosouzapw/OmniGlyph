import { afterEach, describe, expect, it } from 'vitest';
import { transformRequest } from '../src/core/transform.js';

const SECRET = 'sk-live-abcdefghijklmnop1234';
const enc = new TextEncoder();
const dec = new TextDecoder();

function slabReq(extra = ''): Uint8Array {
  return enc.encode(JSON.stringify({
    model: 'claude-fable-5',
    // Secret placed near the front: imageSourceText telemetry caps at 64 KiB,
    // so it must land well inside that window to assert on the rendered mask.
    system: ` DEPLOY_API_TOKEN=${SECRET} ` + 'Operating rules for this session. '.repeat(6000) + extra,
    // Secret also rides natively in the user turn (never imaged in this fixture,
    // no reminders/tool_results) — proves "off" is a true no-op and that the
    // guard never touches un-imaged native content in "redact"/"text" modes.
    messages: [{ role: 'user', content: `hi ${SECRET}` }],
  }));
}

afterEach(() => { delete process.env.OMNIGLYPH_GUARD_SECRETS; });

describe('Anthropic slab lane', () => {
  it('off (default): images exactly as before, secretHits absent', async () => {
    const { body, info } = await transformRequest(slabReq());
    expect(info.compressed).toBe(true);
    expect(info.secretHits ?? 0).toBe(0);
    expect(dec.decode(body)).toContain(SECRET); // native text still carries it upstream
  });

  it('text: slab is NOT imaged, reason=secret_kept_text, body keeps the secret natively', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { body, info } = await transformRequest(slabReq());
    expect(info.imageCount ?? 0).toBe(0);
    expect(info.reason).toBe('secret_kept_text');
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).toContain(SECRET);
  });

  it('redact: slab still images; imageSourceText and factsheet carry the mask, not the secret', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { body, info } = await transformRequest(slabReq());
    expect(info.compressed).toBe(true);
    expect(info.secretHits).toBeGreaterThan(0);
    const rendered = info.imageSourceText ?? '';
    expect(rendered).toContain('[REDACTED:');
    expect(rendered).not.toContain(SECRET);
    const out = dec.decode(body);
    // The factsheet text block (rides beside the image) must be masked too…
    const factsheetBlocks = (JSON.parse(out).messages?.[0]?.content ?? [])
      .filter((b: { type?: string; text?: string }) => b.type === 'text' && /\[|factsheet|EXACT/i.test(b.text ?? ''));
    for (const b of factsheetBlocks) expect(b.text).not.toContain(SECRET);
    // …while the un-imaged native remainder is untouched (never mutate client traffic).
  });
});
