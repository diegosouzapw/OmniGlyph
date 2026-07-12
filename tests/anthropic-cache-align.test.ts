/**
 * Anthropic cache-control CONTRACT (TDD).
 *
 * Encodes the invariants we agreed on for the Anthropic /v1/messages path.
 * Some of these pin behaviour that already holds; some are EXPECTED-FAIL today
 * and define the work (append-only byte-stability + mark alignment).
 *
 * Run just this file:  pnpm vitest run tests/anthropic-cache-align.test.ts
 */
import { describe, expect, it } from 'vitest';
import { collapseHistory } from '../src/core/history.js';
import { transformRequest } from '../src/core/transform.js';
import { countCacheControlMarkers } from '../src/core/measurement.js';
import type { Message } from '../src/core/types.js';

const yes = () => true;
const big = (n: number) => 'x'.repeat(n);

function asst(content: Message['content']): Message {
  return { role: 'assistant', content };
}
function usr(content: Message['content']): Message {
  return { role: 'user', content };
}
function enc(obj: unknown): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(obj));
}
function imagesOf(msgs: Message[]): any[] {
  // the synthetic history message holds the image blocks
  const out: any[] = [];
  for (const m of msgs) {
    if (Array.isArray(m.content)) {
      for (const b of m.content as any[]) if (b?.type === 'image') out.push(b);
    }
  }
  return out;
}

/** N closed plain turns, each `chars` long. */
function convo(n: number, chars = 3500): Message[] {
  const out: Message[] = [];
  for (let i = 0; i < n; i++) {
    const body = `turn ${i}: ` + big(chars);
    out.push(i % 2 === 0 ? usr(body) : asst(body));
  }
  return out;
}

describe('Anthropic cache contract — invariants that should already hold', () => {
  it('never adds a cache_control marker (out count <= in count)', async () => {
    const msgs = convo(15);
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(80_000), cache_control: { type: 'ephemeral' } }],
      messages: msgs,
    });
    const inMarks = countCacheControlMarkers(body);
    const { body: out } = await transformRequest(body);
    const outMarks = countCacheControlMarkers(out);
    expect(outMarks).toBeLessThanOrEqual(inMarks);
  });

  it('relocates the single slab marker onto an IMAGE block (not lost, not duplicated)', async () => {
    const msgs = convo(15);
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(80_000), cache_control: { type: 'ephemeral' } }],
      messages: msgs,
    });
    const { body: out } = await transformRequest(body);
    expect(countCacheControlMarkers(out)).toBe(1); // exactly one, conserved
  });

  it('keeps the last 4 turns as live text (keepTail)', async () => {
    const msgs = convo(15);
    const { messages } = await collapseHistory(msgs, yes, { protectedPrefix: 1 });
    // tail = last 4 original turns, preserved verbatim at the end
    const tail = messages.slice(-4);
    expect(tail.map((m) => m.content)).toEqual(msgs.slice(-4).map((m) => m.content));
  });

  it('never splits a tool_use from its tool_result across the image boundary', async () => {
    // Put an OPEN tool_use right at the would-be boundary; closed prefix must
    // pull back so the pair is never separated.
    const msgs: Message[] = [];
    for (let i = 0; i < 11; i++) msgs.push(i % 2 ? asst(big(3500)) : usr(big(3500)));
    msgs.push(asst([{ type: 'tool_use', id: 'OPEN', name: 't', input: {} } as any]));
    msgs.push(usr('still flowing, no tool_result yet'));
    const { info } = await collapseHistory(msgs, yes, { protectedPrefix: 1, keepTail: 0, collapseChunk: 0 });
    // boundary stops before the open tool_use → it stays in the live tail
    expect(info.collapsedTurns).toBeLessThanOrEqual(11);
  });

  it('is deterministic — same input twice = identical image bytes', async () => {
    const a = await collapseHistory(convo(20), yes, { protectedPrefix: 1 });
    const b = await collapseHistory(convo(20), yes, { protectedPrefix: 1 });
    expect(JSON.stringify(imagesOf(a.messages))).toBe(JSON.stringify(imagesOf(b.messages)));
  });
});

describe('Anthropic cache contract — scope:"global" prefix consistency (upstream #95 shape)', () => {
  // Anthropic rejects scope:"global" unless every preceding block is also
  // globally scoped. A multi-image slab whose caller marker lands only on the
  // LAST page is therefore an invalid prefix → every compressed request 400s.
  // For the global-scope variant the caller's ONE marker must cover EVERY
  // rendered page of the slab — a deliberate exception to "out count <= in
  // count", which continues to hold for plain ephemeral markers (tests above).
  const globalMark = { type: 'ephemeral', ttl: '1h', scope: 'global' };

  function slabImagesOf(msgs: Message[]): any[] {
    // slab pages = image blocks BEFORE the '[End of rendered context.]' boundary
    for (const m of msgs) {
      if (!Array.isArray(m.content)) continue;
      const blocks = m.content as any[];
      const end = blocks.findIndex((b) => b?.type === 'text' && b.text === '[End of rendered context.]');
      if (end === -1) continue;
      return blocks.slice(0, end).filter((b) => b?.type === 'image');
    }
    return [];
  }

  it('a scope:"global" caller marker lands on EVERY page of a multi-image slab', async () => {
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(260_000), cache_control: globalMark }],
      messages: [usr('hello, quick question')],
    });
    const { body: out, info } = await transformRequest(body);
    expect(info.compressed).toBe(true);
    const msgs = JSON.parse(new TextDecoder().decode(out)).messages as Message[];
    const slabImgs = slabImagesOf(msgs);
    expect(slabImgs.length).toBeGreaterThan(1); // must exercise the multi-page case
    for (const img of slabImgs) {
      expect(img.cache_control, 'every slab page must carry the global marker').toEqual(globalMark);
    }
  });

  it('history-anchor relocation never opens a gap in a global-scoped prefix', async () => {
    // With history collapse, the anchor extends onto the history image. Moving
    // the slab marker there (the plain-ephemeral behaviour) would leave slab
    // pages unmarked BEFORE a global block — the exact invalid shape. Global
    // markers must be copied, never moved: slab pages keep theirs.
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(260_000), cache_control: globalMark }],
      messages: convo(15),
    });
    const { body: out, info } = await transformRequest(body);
    expect(info.compressed).toBe(true);
    const msgs = JSON.parse(new TextDecoder().decode(out)).messages as Message[];
    const all = imagesOf(msgs);
    const slabImgs = slabImagesOf(msgs);
    expect(slabImgs.length).toBeGreaterThan(1);
    for (const img of slabImgs) {
      expect(img.cache_control, 'slab pages must keep the global marker after relocation').toEqual(globalMark);
    }
    // Prefix rule over image blocks: nothing unmarked may precede a global-marked block.
    let gapped = false;
    for (const img of all) {
      if ((img.cache_control as any)?.scope === 'global') break;
      gapped = true;
      break;
    }
    expect(gapped, 'first image block must already be globally scoped').toBe(false);
  });

  it('plain ephemeral (no scope) keeps the existing single-marker behaviour', async () => {
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(260_000), cache_control: { type: 'ephemeral' } }],
      messages: [usr('hello, quick question')],
    });
    const { body: out } = await transformRequest(body);
    expect(countCacheControlMarkers(out)).toBe(1);
  });
});

describe('Anthropic cache contract — our agreed model (EXPECTED FAIL today)', () => {
  it('APPEND-ONLY: earlier history image stays byte-identical as the conversation grows past a chunk boundary', async () => {
    // Conversation P, then P + more turns that advance the collapse boundary.
    // The frozen earlier chunk's FIRST image must be byte-identical in both —
    // otherwise old cached prefix re-writes every time the boundary moves.
    const p = await collapseHistory(convo(20), yes, { protectedPrefix: 1 });
    const pPlus = await collapseHistory(convo(70), yes, { protectedPrefix: 1 });
    const firstP = imagesOf(p.messages)[0];
    const firstPlus = imagesOf(pPlus.messages)[0];
    expect(firstP).toBeDefined();
    expect(firstPlus).toBeDefined();
    expect(JSON.stringify(firstPlus)).toBe(JSON.stringify(firstP));
  });

  it('ALIGN: a caller cache_control marker placed mid-history is preserved (image boundary aligns to the mark)', async () => {
    const msgs = convo(15);
    // caller marks the END of an early segment (index 6) — a roaming breakpoint
    (msgs[6] as any).content = [
      { type: 'text', text: (msgs[6].content as string), cache_control: { type: 'ephemeral' } },
    ];
    const body = enc({
      model: 'claude-3-5-sonnet',
      system: [{ type: 'text', text: big(80_000), cache_control: { type: 'ephemeral' } }],
      messages: msgs,
    });
    const inMarks = countCacheControlMarkers(body); // 2: slab + mid-history
    const { body: out } = await transformRequest(body);
    // Contract: the mid-history mark is not silently dropped — both segments
    // remain independently cacheable, so the count is conserved (== 2), and the
    // image set has a boundary at that mark.
    expect(countCacheControlMarkers(out)).toBe(inMarks);
  });
});

describe('Anthropic cache contract — gate never produces negative savings', () => {
  it('tiny prefix is not profitable (no image emitted)', async () => {
    const msgs = convo(15, 30); // 30 chars/turn → trivially below the gate
    const { info } = await collapseHistory(msgs, (t) => t.length > 8000, { protectedPrefix: 1 });
    expect(info.reason).toBe('not_profitable');
    expect(info.collapsedImages ?? 0).toBe(0);
  });

  it('large prefix is profitable (image emitted)', async () => {
    const msgs = convo(15, 3500);
    const { info } = await collapseHistory(msgs, (t) => t.length > 8000, { protectedPrefix: 1 });
    // collapseHistory leaves `reason` undefined on success (the 'collapsed'
    // sentinel is applied later in transform.ts). Success = images emitted.
    expect(info.reason).toBeUndefined();
    expect(info.collapsedImages ?? 0).toBeGreaterThanOrEqual(1);
  });
});
