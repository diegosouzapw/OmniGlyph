import { afterEach, describe, expect, it } from 'vitest';
import { transformRequest, isCompressionProfitable } from '../src/core/transform.js';
import { collapseHistory } from '../src/core/history.js';
import type { Message } from '../src/core/types.js';

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

// Big enough to clear minReminderChars/minToolResultChars (6000) AND the
// multi-col profitability break-even, same budget as render.test.ts's
// imaging fixtures. Secret rides at the front so it is never truncated by
// paging.
const BIG_TAIL = 'output line. '.repeat(2400);

function reminderReq(): Uint8Array {
  const reminder = `<system-reminder>\n${SECRET} ` + 'a long policy note. '.repeat(1550) + '\n</system-reminder>';
  return enc.encode(JSON.stringify({
    model: 'claude',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'real user prompt' },
        { type: 'text', text: reminder },
      ],
    }],
    system: 'x'.repeat(150000),
  }));
}

function toolResultStringReq(): Uint8Array {
  return enc.encode(JSON.stringify({
    model: 'claude',
    messages: [{
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'toolu_x', content: `${SECRET} ${BIG_TAIL}` }],
    }],
    system: 'x'.repeat(150000),
  }));
}

function toolResultArrayReq(): Uint8Array {
  return enc.encode(JSON.stringify({
    model: 'claude',
    messages: [{
      role: 'user',
      content: [{
        type: 'tool_result',
        tool_use_id: 'toolu_y',
        content: [{ type: 'text', text: `${SECRET} ${BIG_TAIL}` }],
      }],
    }],
    system: 'x'.repeat(150000),
  }));
}

describe('reminder block lane (<system-reminder> in the first user message)', () => {
  it('off (default): images as today — secret never lands in plaintext body/info', async () => {
    const { body, info } = await transformRequest(reminderReq());
    expect(info.reminderImgs ?? 0).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });

  it('text: block stays native (not imaged), secret intact in the forwarded body', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { body, info } = await transformRequest(reminderReq());
    expect(info.reminderImgs ?? 0).toBe(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).toContain(SECRET);
  });

  it('redact: block images; secret raw text appears nowhere in body or JSON.stringify(info)', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { body, info } = await transformRequest(reminderReq());
    expect(info.reminderImgs ?? 0).toBeGreaterThan(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });
});

describe('tool_result block lane (string content)', () => {
  it('off (default): images as today — secret never lands in plaintext body/info', async () => {
    const { body, info } = await transformRequest(toolResultStringReq());
    expect(info.toolResultImgs ?? 0).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });

  it('text: block stays native (not imaged), secret intact in the forwarded body', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { body, info } = await transformRequest(toolResultStringReq());
    expect(info.toolResultImgs ?? 0).toBe(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).toContain(SECRET);
  });

  it('redact: block images; secret raw text appears nowhere in body or JSON.stringify(info)', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { body, info } = await transformRequest(toolResultStringReq());
    expect(info.toolResultImgs ?? 0).toBeGreaterThan(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });
});

describe('tool_result block lane (array content, tool_result_part)', () => {
  it('off (default): images as today — secret never lands in plaintext body/info', async () => {
    const { body, info } = await transformRequest(toolResultArrayReq());
    expect(info.toolResultImgs ?? 0).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });

  it('text: block stays native (not imaged), secret intact in the forwarded body', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const { body, info } = await transformRequest(toolResultArrayReq());
    expect(info.toolResultImgs ?? 0).toBe(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).toContain(SECRET);
  });

  it('redact: block images; secret raw text appears nowhere in body or JSON.stringify(info)', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { body, info } = await transformRequest(toolResultArrayReq());
    expect(info.toolResultImgs ?? 0).toBeGreaterThan(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(dec.decode(body)).not.toContain(SECRET);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });
});

describe('recoverable channel under the guard (info.recoverable[].text)', () => {
  it('redact + emitRecoverable: recoverable text is the GUARDED (masked) render source, never the raw secret', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { info } = await transformRequest(toolResultStringReq(), { emitRecoverable: true });
    expect(info.recoverable?.length ?? 0).toBeGreaterThan(0);
    for (const r of info.recoverable ?? []) {
      expect(r.text).not.toContain(SECRET);
    }
    expect(info.recoverable!.some((r) => r.text.includes('[REDACTED:'))).toBe(true);
    expect(JSON.stringify(info)).not.toContain(SECRET);
  });

  it('off + emitRecoverable: recoverable text stays byte-exact original (regression guard)', async () => {
    const { info } = await transformRequest(toolResultStringReq(), { emitRecoverable: true });
    expect(info.recoverable?.length ?? 0).toBeGreaterThan(0);
    expect(info.recoverable![0]!.text).toBe(`${SECRET} ${BIG_TAIL}`);
  });
});

// 12 micro-turns, same shape as history.test.ts's "packs micro histories via
// reflow" fixture (keepTail:0, minCollapsePrefix:5, collapseChunk:0 — reflow
// packs the strip so the profitability gate accepts it). The secret rides in
// turn 3 (an ASSISTANT turn), never in the LAST collapsed user turn (turn 10,
// plain "q10") — latestCollapsedUserPointer reads raw message content by
// design (it is the verbatim carrier for the one turn that isn't imaged at
// full fidelity) and is out of this task's scope, so the fixture must not
// depend on it being guarded.
function secretHistoryMsgs(): Message[] {
  const msgs: Message[] = [];
  for (let i = 0; i < 12; i++) {
    if (i === 3) {
      msgs.push({ role: 'assistant', content: `a${i} DEPLOY_TOKEN=${SECRET}` });
    } else if (i % 2 === 0) {
      msgs.push({ role: 'user', content: `q${i}` });
    } else {
      msgs.push({ role: 'assistant', content: `a${i}` });
    }
  }
  return msgs;
}
const historyCollapseOpts = { keepTail: 0, minCollapsePrefix: 5, collapseChunk: 0 } as const;

describe('Anthropic history lane', () => {
  it('off (default): collapses exactly as before the guard existed, secretHits absent', async () => {
    const { info } = await collapseHistory(secretHistoryMsgs(), isCompressionProfitable, historyCollapseOpts);
    expect(info.reason).toBeUndefined();
    expect(info.collapsedImages).toBeGreaterThan(0);
    expect(info.secretHits ?? 0).toBe(0);
  });

  it('text: a secret-bearing history does not collapse into images', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    const fixture = secretHistoryMsgs();
    const { messages, info } = await collapseHistory(fixture, isCompressionProfitable, historyCollapseOpts);
    expect(info.reason).toBe('secret_kept_text');
    expect(info.collapsedImages).toBe(0);
    expect(info.secretHits).toBeGreaterThan(0);
    expect(messages).toBe(fixture); // unchanged reference — history stays native text
  });

  it('redact: history still collapses; the secret never rides in the returned messages as plaintext', async () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const { messages, info } = await collapseHistory(secretHistoryMsgs(), isCompressionProfitable, historyCollapseOpts);
    expect(info.collapsedImages).toBeGreaterThan(0);
    expect(info.secretHits).toBeGreaterThan(0);
    // The secret only ever reached the renderer/factsheet through the guarded
    // (masked) string — the collapsed history image is pixels, and every text
    // block riding alongside it (factsheet, recency pointer) must be clean too.
    expect(JSON.stringify(messages)).not.toContain(SECRET);
  });
});
