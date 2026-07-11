/**
 * TDD spec for the 2026-07-05 OpenAI billing audit (docs/FORK-ROADMAP.md,
 * Phase 1, D1-D5). Ground truth: developers.openai.com images-vision guide,
 * "Model sizing behavior" + "Calculating costs" tables (captured 2026-07-05).
 */
import { describe, expect, it } from 'vitest';
import { resolveModelProfile } from '../src/core/openai-wire-profiles.js';
import { openAIVisionTokens, transformOpenAIChatCompletions } from '../src/core/openai.js';

const enc = new TextEncoder();

describe('D1 — o4-mini multiplies patches by 1.72, not 1.62', () => {
  it('profile carries 1.72', () => {
    const v = resolveModelProfile('o4-mini').vision;
    expect(v).toMatchObject({ regime: 'patch', multiplier: 1.72, patchCap: 1536 });
  });

  it('768×1920 strip = ceil(24×60 × 1.72) = 2477', () => {
    expect(openAIVisionTokens('o4-mini', 768, 1920)).toBe(2477);
  });
});

describe('D2 — gpt-4o-mini bills tile 2833/5667 (gate must never image it)', () => {
  it('profile carries the documented mini-tile rates', () => {
    const v = resolveModelProfile('gpt-4o-mini').vision;
    expect(v).toMatchObject({ regime: 'tile', base: 2833, perTile: 5667 });
  });

  it('a 768×1932 strip costs 48,169 tokens (~0.8 chars/token — always a loss)', () => {
    expect(openAIVisionTokens('gpt-4o-mini', 768, 1932)).toBe(2833 + 5667 * 8);
  });

  it('the transform refuses to compress for gpt-4o-mini even with generous text', async () => {
    const body = enc.encode(JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Instrução volumosa. '.repeat(2000) },
        { role: 'user', content: 'oi' },
      ],
    }));
    const result = await transformOpenAIChatCompletions(body, { minCompressChars: 1 });
    expect(result.info.compressed).toBe(false);
  });
});

describe('D3 — gpt-5.1/5.2/5.3 (incl. codex/chat-latest) are cap-1536 patch, no original', () => {
  for (const m of ['gpt-5.2', 'gpt-5.2-chat-latest', 'gpt-5.2-codex', 'gpt-5.3-codex']) {
    it(`${m}: patch cap 1536, detail high`, () => {
      const p = resolveModelProfile(m);
      expect(p.vision).toMatchObject({ regime: 'patch', patchCap: 1536 });
      expect(p.detail).toBe('high');
    });
  }

  it('flagships gpt-5.4/5.5/5.6 keep cap 10000 with detail original', () => {
    for (const m of ['gpt-5.4', 'gpt-5.5', 'gpt-5.6']) {
      const p = resolveModelProfile(m);
      expect(p.vision, m).toMatchObject({ regime: 'patch', multiplier: 1, patchCap: 10000 });
      expect(p.detail, m).toBe('original');
    }
  });
});

describe('D4 — codex-mini variants are patch models, not tile', () => {
  for (const m of ['gpt-5-codex-mini', 'gpt-5.1-codex-mini']) {
    it(`${m}: patch 1.62 cap 1536`, () => {
      const p = resolveModelProfile(m);
      expect(p.vision).toMatchObject({ regime: 'patch', multiplier: 1.62, patchCap: 1536 });
    });
  }
});

describe('D5 — detail derives from the profile instead of a hardcoded original', () => {
  it('non-flagship profiles carry detail high', () => {
    for (const m of ['gpt-5', 'gpt-5-chat-latest', 'gpt-4o', 'o1', 'gpt-5-mini', 'o4-mini', 'gpt-4o-mini']) {
      expect(resolveModelProfile(m).detail, m).toBe('high');
    }
  });

  it('the emitted image parts use the profile detail (high for gpt-5-mini)', async () => {
    const body = enc.encode(JSON.stringify({
      model: 'gpt-5-mini',
      messages: [
        { role: 'system', content: 'Instrução volumosa e densa. '.repeat(2000) },
        { role: 'user', content: 'oi' },
      ],
    }));
    const result = await transformOpenAIChatCompletions(body, { charsPerToken: 1, minCompressChars: 1 });
    expect(result.info.compressed).toBe(true);
    const out = new TextDecoder().decode(result.body);
    expect(out).toContain('"detail":"high"');
    expect(out).not.toContain('"detail":"original"');
  });
});

describe('geometry — per-profile page heights aligned to the two billing grids', () => {
  it('tile and flagship-patch profiles page at 2048 px (4×512 tiles / 64×32 patches)', () => {
    for (const m of ['gpt-5', 'gpt-4o', 'o1', 'gpt-5.5', 'gpt-5.6']) {
      expect(resolveModelProfile(m).maxHeightPx, m).toBe(2048);
    }
  });

  it('cap-1536 patch profiles page at 1920 px (60×32 = 1440 patches of slack)', () => {
    for (const m of ['gpt-5-mini', 'gpt-5-nano', 'o4-mini', 'gpt-5.2', 'gpt-5-codex-mini']) {
      expect(resolveModelProfile(m).maxHeightPx, m).toBe(1920);
    }
  });
});

describe('render style — optional per-model knob, absent for GPT', () => {
  it('current GPT models carry no render style (style stays byte-identical default)', () => {
    for (const m of ['gpt-5.6', 'gpt-5-chat-latest', 'o4-mini', 'gpt-4o-mini']) {
      // No style field on any shipped GPT profile → renderer keeps its {} default.
      expect(resolveModelProfile(m).style, m).toBeUndefined();
    }
  });
});
