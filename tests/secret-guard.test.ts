import { describe, expect, it } from 'vitest';
import { findSecrets } from '../src/core/secret-guard.js';

const kinds = (t: string) => findSecrets(t).map((h) => h.kind);

describe('findSecrets — prefix patterns', () => {
  it('catches vendor key prefixes', () => {
    expect(kinds('key sk-ant-api03-abcdef0123456789abcdef')).toContain('key');
    expect(kinds('ghp_abcdefghijklmnopqrst0123456789')).toContain('key');
    expect(kinds('xoxb-1234567890-abcdefghij')).toContain('key');
    expect(kinds('AKIAIOSFODNN7EXAMPLE')).toContain('key');
    expect(kinds('AIzaSyA-abcdefghijklmnopqrstuvwxy012345')).toContain('key');
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

describe('findSecrets — entropy fallback isolates the value of NAME=value / NAME: value chunks (C1)', () => {
  it('still treats a path-shaped assignment value as public', () => {
    expect(findSecrets('ACTIVE_MANIFEST=/srv/x/runtime-map.json')).toHaveLength(0);
  });
  it('still treats a number-shaped assignment value as public', () => {
    expect(findSecrets('CONTROL_PORT=47831')).toHaveLength(0);
  });
  it('detects a high-entropy value on a non-secret-named assignment (was a false negative)', () => {
    const t = 'FOO_BAR=kJ8#mQz!vR2$xN9pLw4Yt7Bc12';
    const hits = findSecrets(t);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.kind).toBe('entropy');
    expect(t.slice(hits[0]!.start, hits[0]!.end)).toBe('kJ8#mQz!vR2$xN9pLw4Yt7Bc12');
  });
});

describe('findSecrets — dedup prefers the more specific kind over entropy (I2/M2)', () => {
  it('reports "assignment" (not "entropy") for a secret-named assignment, spanning the value', () => {
    const t = 'ACCESS_TOKEN=abcdefgh12345678';
    const hits = findSecrets(t);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.kind).toBe('assignment');
    expect(t.slice(hits[0]!.start, hits[0]!.end)).toBe('abcdefgh12345678');
  });
  it('reports "key" (not "entropy") when a vendor prefix sits inside a larger high-entropy chunk', () => {
    const t = 'token dump: prefix-sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGH end';
    const hits = findSecrets(t);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.kind).toBe('key');
  });
});

import { redactSecrets, secretGuardMode, guardImagedText } from '../src/core/secret-guard.js';
import { afterEach, beforeEach } from 'vitest';

describe('redactSecrets', () => {
  it('masks with a prefix-preserving, kind-tagged token', () => {
    const { text, hits } = redactSecrets('use sk-live-abcdefghijklmnop1234 now');
    expect(hits).toBe(1);
    expect(text).toBe('use sk-l…[REDACTED:key] now');
  });
  it('is idempotent and deterministic', () => {
    const once = redactSecrets('TOKEN=abcdefgh12345678').text;
    expect(redactSecrets(once)).toEqual({ text: once, hits: 0 });
    expect(redactSecrets('TOKEN=abcdefgh12345678').text).toBe(once);
  });
  it('never leaves more than 4 original chars of any hit', () => {
    const secret = 'kJ8#mQz!vR2$xN9pLw4Yt7Bc';
    const { text } = redactSecrets(`x ${secret} y`);
    expect(text).not.toContain(secret.slice(4));
  });
});

describe('secretGuardMode', () => {
  const saved = process.env.OMNIGLYPH_GUARD_SECRETS;
  beforeEach(() => { delete process.env.OMNIGLYPH_GUARD_SECRETS; });
  afterEach(() => {
    if (saved === undefined) delete process.env.OMNIGLYPH_GUARD_SECRETS;
    else process.env.OMNIGLYPH_GUARD_SECRETS = saved;
  });
  it("defaults to 'off' and ignores junk values", () => {
    expect(secretGuardMode()).toBe('off');
    process.env.OMNIGLYPH_GUARD_SECRETS = 'banana';
    expect(secretGuardMode()).toBe('off');
  });
  it('honors text and redact (case-insensitive)', () => {
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    expect(secretGuardMode()).toBe('text');
    process.env.OMNIGLYPH_GUARD_SECRETS = 'REDACT';
    expect(secretGuardMode()).toBe('redact');
  });
  it('guardImagedText wires the three modes', () => {
    const secret = 'API_KEY=abcdefgh12345678';
    expect(guardImagedText(secret)).toEqual({ mode: 'off', text: secret, hits: 0, blocked: false });
    process.env.OMNIGLYPH_GUARD_SECRETS = 'text';
    expect(guardImagedText(secret)).toMatchObject({ mode: 'text', text: secret, blocked: true });
    process.env.OMNIGLYPH_GUARD_SECRETS = 'redact';
    const g = guardImagedText(secret);
    expect(g.blocked).toBe(false);
    expect(g.text).toContain('[REDACTED:assignment]');
  });
});
