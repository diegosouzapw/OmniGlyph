import { describe, expect, it } from 'vitest';
import { transformRequest } from '../src/core/transform.js';

const enc = (permission: string, severity: string): Uint8Array =>
  new TextEncoder().encode(JSON.stringify({
    model: 'claude-fable-5',
    system: [{
      type: 'text',
      text: [
        'You are a helpful assistant.',
        'x'.repeat(40_000),
        '<cc_automode_session_rules>ask before acting</cc_automode_session_rules>',
        `<cc_automode_permissions>${permission}</cc_automode_permissions>`,
        `<severity>${severity}</severity>`,
        '<category>filesystem</category>',
      ].join('\n'),
    }],
    messages: [{ role: 'user', content: 'go' }],
  }));

describe('Claude Code automode state', () => {
  it('routes all automode fields out of the static slab', async () => {
    const first = await transformRequest(enc('read', 'info'));
    const second = await transformRequest(enc('read,write,admin', 'warning'));

    expect(first.info.imageCount).toBeGreaterThan(0);
    expect(first.info.systemSha8).toBeDefined();
    expect(second.info.systemSha8).toBe(first.info.systemSha8);

    const unknown = first.info.unknownStaticTags ?? [];
    expect(unknown).not.toContain('cc_automode_session_rules');
    expect(unknown).not.toContain('cc_automode_permissions');
    expect(unknown).not.toContain('severity');
    expect(unknown).not.toContain('category');

    expect(first.info.dynamicChars ?? 0).toBeGreaterThan(0);
    expect(second.info.dynamicChars).not.toBe(first.info.dynamicChars);
  });
});
