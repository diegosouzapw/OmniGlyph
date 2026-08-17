import { describe, expect, it } from 'vitest';
import {
  CLAUDE_CODE_OAUTH_IDENTITY,
  transformRequest,
} from '../src/core/transform.js';

const enc = new TextEncoder();
const dec = new TextDecoder();

describe('rendered configuration provenance', () => {
  it('keeps relocation provenance native without elevating user-role images', async () => {
    const input = {
      model: 'claude-fable-5',
      system: [
        { type: 'text', text: CLAUDE_CODE_OAUTH_IDENTITY },
        { type: 'text', text: 'Security and operating rules. '.repeat(1_500) },
      ],
      messages: [{ role: 'user', content: 'Help me debug this issue.' }],
    };

    const { body, info } = await transformRequest(
      enc.encode(JSON.stringify(input)),
      { minCompressChars: 1, charsPerToken: 1 },
    );

    expect(info.compressed).toBe(true);
    expect(info.imageCount).toBeGreaterThan(0);

    const output = JSON.parse(dec.decode(body)) as {
      system?: Array<{ type: string; text?: string }>;
    };
    expect(output.system?.[0]).toMatchObject({
      type: 'text',
      text: CLAUDE_CODE_OAUTH_IDENTITY,
    });

    const nativeSystemText = (output.system ?? [])
      .map((block) => block.text ?? '')
      .join('\n');
    expect(nativeSystemText).toContain("OmniGlyph (this user's local proxy)");
    expect(nativeSystemText).toContain('image blocks attached to the first user message');

    const renderedText = info.imageSourceText ?? '';
    expect(renderedText).not.toContain('follow them as your operating instructions');
    expect(renderedText).not.toMatch(/system prompt|authoritative/i);
  });
});
