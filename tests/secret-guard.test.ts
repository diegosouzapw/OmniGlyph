import { describe, expect, it } from 'vitest';
import { findSecrets } from '../src/core/secret-guard.js';

const kinds = (t: string) => findSecrets(t).map((h) => h.kind);

describe('findSecrets — prefix patterns', () => {
  it('catches vendor key prefixes', () => {
    expect(kinds('key sk-ant-api03-abcdef0123456789abcdef')).toContain('key');
    expect(kinds('ghp_abcdefghijklmnopqrst0123456789')).toContain('key');
    expect(kinds('xoxb-1234567890-abcdefghij')).toContain('key');
    expect(kinds('AKIAIOSFODNN7EXAMPLE')).toContain('key');
    expect(kinds('AIzaSyA-abcdefghijklmnopqrstuvwxyz0123456')).toContain('key');
  });
  it('catches PEM private key blocks as one hit', () => {
    const pem = '-----BEGIN RSA PRIVATE KEY-----\nMIIEow…snip…\n-----END RSA PRIVATE KEY-----';
    const hits = findSecrets(pem);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.kind).toBe('pem');
  });
});

describe('findSecrets — Bearer', () => {
  it('flags the token after Bearer, not the word Bearer', () => {
    const t = 'authorization: Bearer abcdefghijklmnopqrstuv123456';
    const [h] = findSecrets(t);
    expect(h!.kind).toBe('bearer');
    expect(t.slice(h!.start, h!.end)).toBe('abcdefghijklmnopqrstuv123456');
  });
  it('ignores short Bearer values (< 20 chars)', () => {
    expect(findSecrets('Bearer abc123')).toHaveLength(0);
  });
});

describe('findSecrets — labeled assignments', () => {
  it('flags the VALUE of secret-named assignments regardless of entropy', () => {
    const t = 'export STRIPE_API_KEY=hello-world-not-random';
    const [h] = findSecrets(t);
    expect(h!.kind).toBe('assignment');
    expect(t.slice(h!.start, h!.end)).toBe('hello-world-not-random');
  });
  it('supports colon separators and PASSWORD/TOKEN/CREDENTIAL names', () => {
    expect(kinds('DB_PASSWORD: hunter2hunter2')).toContain('assignment');
    expect(kinds('ACCESS_TOKEN=abcdefgh12345678')).toContain('assignment');
  });
  it('does NOT flag non-secret-named assignments (factsheet keeps them)', () => {
    expect(findSecrets('ACTIVE_MANIFEST=/srv/x/runtime-map.json')).toHaveLength(0);
    expect(findSecrets('CONTROL_PORT=47831')).toHaveLength(0);
  });
});

describe('findSecrets — entropy fallback excludes every public factsheet shape', () => {
  it('flags a bare high-entropy chunk', () => {
    expect(kinds('deploy with kJ8#mQz!vR2$xN9pLw4Yt7Bc')).toContain('entropy');
  });
  it('rejects git SHAs, UUIDs, tickets, consts, numbers, URLs, paths', () => {
    const publicText = [
      'commit 9065ada2df9cad31e2ffe2d71bf2',                     // SHAPE_HEX
      '123e4567-e89b-12d3-a456-426614174000',                    // SHAPE_UUID
      'PROJ-1482 CVE-2024-30078',                                // SHAPE_TICKET
      'OMNIGLYPH_GPT_HISTORY_MAX_IMAGES',                        // SHAPE_CONST
      '1,234,567 47821 3.14159',                                 // SHAPE_NUM
      'https://github.com/anthropics/claude-code/issues/123',    // URL
      'src/core/anthropic-vision.ts /home/user/.config/app.json' // paths
    ].join('\n');
    expect(findSecrets(publicText)).toHaveLength(0);
  });
});
