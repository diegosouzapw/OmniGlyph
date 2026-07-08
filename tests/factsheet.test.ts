import { describe, it, expect } from 'vitest';
import {
  extractFactSheetTokens,
  extractFactSheetEntries,
  extractFactSheetEntriesAllPages,
  factSheetText,
  MAX_TOKENS,
} from '../src/core/factsheet.js';

describe('camelCase identifier protection (LEGIBILITY-AUDIT residual misses)', () => {
  it('extracts multi-hump camelCase / PascalCase but ignores ordinary words', () => {
    const toks = extractFactSheetTokens(
      'call extractFactSheetTokens on tokenLedgerShard and TokenLedgerShard, not getFoo or isReady',
    );
    expect(toks).toContain('extractFactSheetTokens');
    expect(toks).toContain('tokenLedgerShard');
    expect(toks).toContain('TokenLedgerShard');
    expect(toks).not.toContain('getFoo'); // single hump — below the ≥2 threshold
    expect(toks).not.toContain('isReady');
  });

  it('never lets camelCase (tier 1) evict tier-0 SHAs', () => {
    // 70 distinct lowercase-hex SHAs (tier 0) — more than the 64 budget on their own.
    const shas = Array.from({ length: 70 }, (_, i) => `deadbeef${i.toString(16).padStart(4, '0')}`);
    const camels = Array.from({ length: 70 }, (_, i) => `fooBarBaz${i}`);
    const kept = extractFactSheetTokens([...shas, ...camels].join(' '));
    expect(kept.length).toBe(MAX_TOKENS);
    // The whole budget is tier-0 SHAs; no camelCase displaced one.
    expect(kept.some((t) => t.startsWith('fooBarBaz'))).toBe(false);
    expect(kept.every((t) => t.startsWith('deadbeef'))).toBe(true);
  });

  it('caps and orders camelCase deterministically past the budget', () => {
    const camels = Array.from({ length: 100 }, (_, i) => `alphaBetaGamma${i}`);
    const a = extractFactSheetTokens(camels.join(' '));
    const b = extractFactSheetTokens([...camels].reverse().join(' '));
    expect(a.length).toBe(MAX_TOKENS);
    expect(a).toEqual(b); // order is a pure function of the token set, not input order
  });
});

describe('factsheet extraction', () => {
  it('captures precision-critical, hard-to-OCR tokens', () => {
    const text = [
      'Edited src/lib/__tests__/livekit-egress.test.ts and agents/transcription/agent.ts',
      'opened https://github.com/Keplogic/atlas/pull/93 at commit 6d80bd6',
      'set LIVEKIT_API_SECRET and ran with --max-tokens 64000, coverage 97.82',
    ].join('\n');
    const toks = extractFactSheetTokens(text);
    expect(toks).toContain('src/lib/__tests__/livekit-egress.test.ts');
    expect(toks).toContain('https://github.com/Keplogic/atlas/pull/93');
    expect(toks).toContain('6d80bd6');
    expect(toks).toContain('LIVEKIT_API_SECRET');
    expect(toks).toContain('--max-tokens');
    expect(toks).toContain('97.82');
  });

  it('captures transactional exact-token classes (email / IBAN / currency)', () => {
    const replyTo = 'ops.reply+invoice-55@example.co.uk';
    const iban = 'UA383220010000026008';
    const invoiceAmount = '$14,360';
    const text = [
      `reply-to ${replyTo}`,
      `settle IBAN ${iban}`,
      `invoice total ${invoiceAmount}, due today`,
    ].join('\n');

    const toks = extractFactSheetTokens(text);

    expect(toks).toContain(replyTo);
    expect(toks).toContain(iban);
    expect(toks).toContain(invoiceAmount);
  });

  it('drops substrings of longer kept tokens', () => {
    const toks = extractFactSheetTokens('see https://github.com/o/r/pull/9 in repo');
    // The bare /github.com path must collapse into the full URL.
    expect(toks).toContain('https://github.com/o/r/pull/9');
    expect(toks).not.toContain('/github.com');
  });

  it('does not flag pure-letter hex words (decade, facade)', () => {
    const toks = extractFactSheetTokens('this decade the facade was added');
    expect(toks).not.toContain('decade');
    expect(toks).not.toContain('facade');
  });

  it('is deterministic — identical input yields byte-identical output (cache stability)', () => {
    const text = 'paths /a/b/c.ts /d/e/f.ts ids 1a2b3c4 9f8e7d6 nums 12345 6789.0 FLAG_X FLAG_Y';
    expect(factSheetText(text)).toBe(factSheetText(text));
  });

  it('returns empty string when nothing notable is present', () => {
    expect(factSheetText('the quick brown fox jumps over')).toBe('');
  });

  it('caps the token budget', () => {
    const many = Array.from({ length: 200 }, (_, i) => `/dir${i}/file${i}.ts`).join(' ');
    expect(extractFactSheetTokens(many).length).toBeLessThanOrEqual(64);
  });

  it('protects short high-consequence tokens from eviction by long URLs', () => {
    // 80 long doc-URLs (well over the 64-token budget) plus a short commit SHA and a port —
    // the exact shape that silently dropped the SHA a coding agent needed off the image.
    const urls = Array.from({ length: 80 }, (_, i) =>
      `https://platform.claude.com/docs/en/build-with-claude/page-${String(i).padStart(2, '0')}-guide.md`);
    const text = [...urls.slice(0, 40), 'fix in commit 9d121ac on port 47821', ...urls.slice(40)].join('\n');
    const toks = extractFactSheetTokens(text);
    expect(toks).toContain('9d121ac');
    expect(toks).toContain('47821');
    expect(toks.length).toBeLessThanOrEqual(64);
    expect(toks.filter((t) => t.startsWith('http')).length).toBeLessThanOrEqual(8);
  });
});

describe('ticket-style codes and occurrence counts', () => {
  it('captures uppercase hyphenated codes that contain a digit', () => {
    const toks = extractFactSheetTokens(
      'audit marker AUDIT-ZX9 tracked as PROJ-1482, see CVE-2024-30078 for details',
    );
    expect(toks).toContain('AUDIT-ZX9');
    expect(toks).toContain('PROJ-1482');
    expect(toks).toContain('CVE-2024-30078');
  });

  it('does not flag digit-free hyphenated prose (READ-ONLY, NON-NULL)', () => {
    const toks = extractFactSheetTokens('column is READ-ONLY and NON-NULL by default');
    expect(toks).not.toContain('READ-ONLY');
    expect(toks).not.toContain('NON-NULL');
  });

  it('annotates repeated tokens with ×N and explains the notation', () => {
    const text = 'retry DEPLOY-77 failed\nretry DEPLOY-77 ok\nfinal DEPLOY-77 done\nsha 9d121ac';
    const sheet = factSheetText(text);
    expect(sheet).toContain('DEPLOY-77 ×3');
    expect(sheet).toContain('×N marks a token that occurs N times');
    expect(sheet).not.toContain('9d121ac ×');
  });

  it('emits byte-identical sheets to the pre-count format when nothing repeats', () => {
    const text = 'commit 9d121ac on port 47821';
    expect(factSheetText(text)).toContain('from the image: ');
    expect(factSheetText(text)).not.toContain('×');
  });

  it('never double-counts one span matched by two patterns', () => {
    // 1.2.3 is hit by the version pattern; its 1.2 substring by decimal — offset dedup
    // plus substring-collapse must leave a single un-annotated v1.2.3-style entry.
    const sheet = factSheetText('release v1.2.3 shipped');
    expect(sheet).not.toMatch(/×\d/);
  });

  it('keeps a rare ticket code over a flood of per-line hex ids (log-file shape)', () => {
    const lines = Array.from({ length: 300 }, (_, i) =>
      `2026-07-26T09:40:41Z WARN svc=ingest req=${(0x10000000 + i * 7919).toString(16)} shard=12 msg=processed batch ${10000 + i} ok`,
    );
    lines[137] += ' AUDIT-ZX9';
    lines[201] += ' AUDIT-ZX9';
    const entries = extractFactSheetEntries(lines.join('\n'));
    const hit = entries.find((e) => e.token === 'AUDIT-ZX9');
    expect(hit).toBeDefined();
    expect(hit!.count).toBe(2);
  });

  it('sums counts across pages in the all-pages variant', () => {
    const page = 'x'.repeat(90) + ' TICK-42 ';
    const { kept } = extractFactSheetEntriesAllPages(page.repeat(5), 100);
    const hit = kept.find((e) => e.token === 'TICK-42');
    expect(hit).toBeDefined();
    expect(hit!.count).toBe(5);
  });
});
