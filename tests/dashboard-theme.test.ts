/**
 * Phase 1 of the dashboard redesign: port the OmniRoute design system tokens
 * (coral primary, indigo/violet accent, graph-paper grid, JetBrains Mono,
 * brand gradient) into the dashboard CSS, without touching layout/markup.
 * OmniGlyph's own identity — the flame-orange "--img" family that marks
 * "this became an image" — must survive the port unchanged.
 */
import { describe, it, expect } from 'vitest';
import { renderPage } from '../src/dashboard/fragments.js';

describe('dashboard theme — OmniRoute token port', () => {
  const html = renderPage(47821);

  it('carries the OmniRoute light tokens', () => {
    expect(html).toContain('#f9f9fb'); // bg
    expect(html).toContain('#e54d5e'); // primary coral
    expect(html).toContain('#6366f1'); // accent indigo
    expect(html).toContain('#a855f7'); // accent light / violet
  });

  it('carries the OmniRoute dark tokens', () => {
    expect(html).toContain('#0b0e14'); // dark bg
    expect(html).toContain('#161b22'); // dark surface
  });

  it('renders the graph-paper grid signature', () => {
    expect(html).toContain('--grid-size: 32px');
    expect(html).toMatch(/body::before\s*\{[^}]*linear-gradient[^}]*var\(--grid-line\)/s);
  });

  it('applies the brand gradient (coral to violet)', () => {
    expect(html).toMatch(/linear-gradient\(135deg,\s*var\(--color-primary\)/);
  });

  it('keeps the OmniGlyph "became an image" identity flame-orange in light mode', () => {
    expect(html).toContain('--img: #ff5a1f');
  });

  it('uses JetBrains Mono in the mono font stack', () => {
    expect(html).toMatch(/--mono:[^;]*JetBrains Mono/);
  });

  it('defines the OmniRoute radii', () => {
    expect(html).toContain('--radius: 14px');
    expect(html).toContain('--radius-control: 9px');
  });

  it('keeps the existing data-theme dark-mode mechanism', () => {
    expect(html).toContain('data-theme="dark"');
  });
});
