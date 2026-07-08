/**
 * Phase 2 of the dashboard redesign: an OmniRoute-style sidebar shell plus
 * six server-rendered pages (overview / flow / telemetry / benchmarks /
 * sessions / history), replacing the single scroll-everything page from
 * Phase 1. Each page keeps the same htmx mounts as before — they're just
 * regrouped behind routes instead of all living on one page.
 */
import { describe, it, expect } from 'vitest';
import { dashboardPath } from '../src/dashboard.js';
import { renderPage } from '../src/dashboard/fragments.js';

describe('dashboardPath() — page routes', () => {
  it('/ and /dashboard map to the overview page', () => {
    expect(dashboardPath('/')).toEqual({ kind: 'html', page: 'overview' });
    expect(dashboardPath('/dashboard')).toEqual({ kind: 'html', page: 'overview' });
  });

  it('maps each of the other five paths to its own page', () => {
    expect(dashboardPath('/flow')).toEqual({ kind: 'html', page: 'flow' });
    expect(dashboardPath('/telemetry')).toEqual({ kind: 'html', page: 'telemetry' });
    expect(dashboardPath('/benchmarks')).toEqual({ kind: 'html', page: 'benchmarks' });
    expect(dashboardPath('/sessions')).toEqual({ kind: 'html', page: 'sessions' });
    expect(dashboardPath('/history')).toEqual({ kind: 'html', page: 'history' });
  });

  it('does not swallow unrelated proxy routes', () => {
    expect(dashboardPath('/nope')).toBeNull();
  });
});

describe('renderPage() — sidebar shell', () => {
  it('the sidebar links to all six pages', () => {
    const html = renderPage(47821, 'overview');
    expect(html).toContain('href="/"');
    expect(html).toContain('href="/flow"');
    expect(html).toContain('href="/telemetry"');
    expect(html).toContain('href="/benchmarks"');
    expect(html).toContain('href="/sessions"');
    expect(html).toContain('href="/history"');
  });

  it('every page carries the theme script and the kill switch mount', () => {
    for (const page of ['overview', 'flow', 'telemetry', 'benchmarks', 'sessions', 'history'] as const) {
      const html = renderPage(47821, page);
      expect(html).toContain('ppTheme');
      expect(html).toContain('frag-toggle');
    }
  });
});

describe('renderPage() — overview', () => {
  const html = renderPage(47821, 'overview');

  it('contains the hero, header and models fragments', () => {
    expect(html).toContain('frag-session');
    expect(html).toContain('frag-header');
    expect(html).toContain('frag-models');
  });

  it('marks the Overview nav item active', () => {
    expect(html).toMatch(/nav-active[^]*?Overview|Overview[^]*?nav-active/);
  });

  it('does not contain the flow or history fragments', () => {
    // Match the actual mount, not the CSS selector text — `#frag-recent,
    // #frag-stats { ... }` in the shared <style> block contains the bare
    // substring "frag-stats" on every page regardless of which page mounts it.
    expect(html).not.toContain('id="frag-stats"');
    expect(html).not.toContain('id="frag-flow"');
  });

  it('back-compat: renderPage with no page arg defaults to overview', () => {
    const withoutArg = renderPage(47821);
    expect(withoutArg).toContain('frag-session');
    expect(withoutArg).toContain('frag-header');
    expect(withoutArg).not.toContain('id="frag-stats"');
  });
});

describe('renderPage() — flow', () => {
  const html = renderPage(47821, 'flow');

  it('contains the live pipeline fragment', () => {
    expect(html).toContain('frag-flow');
  });

  it('marks the Live Flow nav item active', () => {
    expect(html).toMatch(/nav-active[^]*?Live Flow|Live Flow[^]*?nav-active/);
  });

  it('does not contain the history fragment', () => {
    expect(html).not.toContain('id="frag-stats"');
  });
});

describe('renderPage() — telemetry', () => {
  it('mounts odometer + timeline and keeps the investigation pair (context-map, latest)', () => {
    // Phase 4 replaced the recent table with the live timeline on this page.
    // Match actual mounts (id="...") — bare names also match CSS selector text.
    const html = renderPage(47821, 'telemetry');
    expect(html).toContain('id="frag-odometer"');
    expect(html).toContain('id="frag-timeline"');
    expect(html).toContain('id="frag-context-map"');
    expect(html).toContain('id="frag-latest"');
    expect(html).not.toContain('id="frag-recent"');
  });
});

describe('renderPage() — history', () => {
  it('contains the full-history stats fragment', () => {
    expect(renderPage(47821, 'history')).toContain('frag-stats');
  });
});

describe('renderPage() — sessions', () => {
  it('contains the top sessions fragment', () => {
    expect(renderPage(47821, 'sessions')).toContain('frag-sessions');
  });
});

describe('renderPage() — benchmarks', () => {
  it('renders the live bench fragment mount and still links the docs', () => {
    const html = renderPage(47821, 'benchmarks');
    expect(html).toContain('id="frag-bench"');
    expect(html).toContain('docs/benchmarks/BENCHMARKS.md');
  });
});
