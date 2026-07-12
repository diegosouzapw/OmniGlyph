import { describe, expect, it } from 'vitest';
import * as fs from 'node:fs';

const README_PATH = 'README.md';
// OmniGlyph README sections are h1 with an emoji (# 🔌 …), not h2.
const USAGE_HEADING = '# 🔌 Use with Claude clients';
const REQUIRED_USAGE_TEXT = [
  'Claude Code CLI',
  'ANTHROPIC_BASE_URL=http://127.0.0.1:47821 claude',
  'Windows PowerShell',
  '$env:ANTHROPIC_BASE_URL',
  'Claude Desktop',
  'ANTHROPIC_BASE_URL',
] as const;

describe('README usage documentation', () => {
  it('documents CLI, Windows PowerShell, and Claude Desktop setup', () => {
    const readme = fs.readFileSync(README_PATH, 'utf8');
    const sectionStart = readme.indexOf(USAGE_HEADING);

    expect(sectionStart).toBeGreaterThanOrEqual(0);

    // Section runs until the next h1 heading (README uses `# ` per section).
    const nextSectionStart = readme.indexOf('\n# ', sectionStart + USAGE_HEADING.length);
    const section =
      nextSectionStart === -1 ? readme.slice(sectionStart) : readme.slice(sectionStart, nextSectionStart);

    for (const requiredText of REQUIRED_USAGE_TEXT) {
      expect(section).toContain(requiredText);
    }
  });
});
