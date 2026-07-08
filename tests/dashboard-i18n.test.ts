/**
 * Dashboard i18n infrastructure: the 42-locale selector (topbar, flag +
 * native name), locale resolution (cookie beats env, catalog gate), and
 * locale threading through renderPage/serveFragment. This is the seeding
 * step — every non-English catalog gets the dash.* keys copied in English
 * (except the handful of pt-BR strings asserted below); mass translation
 * for the other 40 locales is a separate pass.
 */
import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderPage } from '../src/dashboard/fragments.js';
import { DashboardState } from '../src/dashboard.js';
import { DASH_LOCALES, RTL_LOCALES } from '../src/i18n/locales.js';
import { resolveDashLocale } from '../src/i18n/index.js';
import type { SessionsPaths } from '../src/sessions.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

interface ConfigLocale {
  code: string;
  flag: string;
  native: string;
}
const i18nConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'config', 'i18n.json'), 'utf8'),
) as { default: string; rtl: string[]; locales: ConfigLocale[] };

describe('DASH_LOCALES / RTL_LOCALES — sync with config/i18n.json', () => {
  it('has exactly the same codes, in the same order, as config/i18n.json', () => {
    expect(DASH_LOCALES.map((l) => l.code)).toEqual(i18nConfig.locales.map((l) => l.code));
  });

  it('carries the same flag and native name as config/i18n.json for every locale', () => {
    for (const cfg of i18nConfig.locales) {
      const dash = DASH_LOCALES.find((l) => l.code === cfg.code);
      expect(dash, `missing DASH_LOCALES entry for ${cfg.code}`).toBeDefined();
      expect(dash!.flag).toBe(cfg.flag);
      expect(dash!.native).toBe(cfg.native);
    }
  });

  it('DASH_LOCALES has exactly 42 entries', () => {
    expect(DASH_LOCALES.length).toBe(42);
    expect(DASH_LOCALES.length).toBe(i18nConfig.locales.length);
  });

  it('RTL_LOCALES matches config/i18n.json exactly', () => {
    expect([...RTL_LOCALES].sort()).toEqual([...i18nConfig.rtl].sort());
  });
});

describe('resolveDashLocale — cookie beats env, catalog-gated', () => {
  it('a valid cookie wins over env', () => {
    expect(
      resolveDashLocale('omniglyph_lang=pt-BR', { OMNIGLYPH_LANG: 'fr' }),
    ).toBe('pt-BR');
  });

  it('missing cookie falls back to resolveLocale(env)', () => {
    expect(resolveDashLocale(undefined, { OMNIGLYPH_LANG: 'de' })).toBe('de');
    expect(resolveDashLocale('', { OMNIGLYPH_LANG: 'de' })).toBe('de');
  });

  it('a cookie header without the omniglyph_lang key falls back to resolveLocale(env)', () => {
    expect(resolveDashLocale('other=1; theme=dark', { OMNIGLYPH_LANG: 'ja' })).toBe('ja');
  });

  it('no cookie and no env falls back to en', () => {
    expect(resolveDashLocale(undefined, {})).toBe('en');
  });

  it('a cookie value outside the catalog resolves to en, ignoring env', () => {
    expect(
      resolveDashLocale('omniglyph_lang=xx-XX', { OMNIGLYPH_LANG: 'de' }),
    ).toBe('en');
  });

  it('picks the cookie out of a multi-cookie header', () => {
    expect(
      resolveDashLocale('theme=dark; omniglyph_lang=ja; foo=bar', {}),
    ).toBe('ja');
  });
});

describe('renderPage() — locale selector', () => {
  it('renders the 42-option language selector with the current locale selected', () => {
    const html = renderPage(47821, 'overview', 'pt-BR');
    expect(html).toContain('id="lang-select"');
    // The aria-label is itself localized (dash.common.langSelectLabel), so it
    // reads "Language" only in English; on a pt-BR page it is translated.
    expect(html).toMatch(/id="lang-select"[^>]*aria-label="[^"]+"/);
    const optionCount = (html.match(/<option value="/g) ?? []).length;
    expect(optionCount).toBe(42);
    expect(html).toContain('🇧🇷 Português (Brasil)');
    expect(html).toMatch(/<option value="pt-BR"[^>]*selected[^>]*>/);
  });

  it('renders the language-selector aria-label in English on the default page', () => {
    expect(renderPage(47821, 'overview')).toContain('aria-label="Language"');
  });

  it('does not mark a different locale as selected', () => {
    const html = renderPage(47821, 'overview', 'pt-BR');
    expect(html).not.toMatch(/<option value="en"[^>]*selected[^>]*>/);
  });
});

describe('renderPage() — pt-BR translated chrome', () => {
  const html = renderPage(47821, 'overview', 'pt-BR');

  it('translates the Overview nav label', () => {
    expect(html).toContain('Visão Geral');
  });

  it('translates the page title and subtitle', () => {
    expect(html).toContain('<h1 class="page-title">Visão Geral</h1>');
    expect(html).toContain('Economia em tempo real desde que este proxy foi iniciado.');
  });

  it('translates inline page-body chrome (Live feed heading)', () => {
    expect(html).toContain('Feed ao vivo');
  });
});

describe('renderPage() — English default (back-compat)', () => {
  it('renderPage with no locale arg renders English chrome', () => {
    const html = renderPage(47821, 'overview');
    expect(html).toContain('Overview');
    expect(html).toContain('Live savings at a glance since this proxy started.');
    expect(html).toContain('Live feed');
    expect(html).not.toContain('Visão Geral');
  });
});

describe('renderPage() — RTL', () => {
  // Match only the <html ...> tag itself — the shared <style> block legitimately
  // contains `[dir="rtl"]` CSS selectors on every page (see the RTL rules in
  // fragments.ts), so a whole-document substring check would false-positive.
  function htmlTag(html: string): string {
    return html.match(/<html\b[^>]*>/)?.[0] ?? '';
  }

  it('ar renders dir="rtl" on <html>', () => {
    const html = renderPage(47821, 'overview', 'ar');
    expect(htmlTag(html)).toMatch(/<html lang="ar"[^>]*dir="rtl"/);
  });

  it('pt-BR does not render dir="rtl"', () => {
    const html = renderPage(47821, 'overview', 'pt-BR');
    expect(htmlTag(html)).not.toContain('dir="rtl"');
    expect(htmlTag(html)).toBe('<html lang="pt-BR">');
  });

  it('en does not render a dir attribute (back-compat)', () => {
    const html = renderPage(47821, 'overview');
    expect(htmlTag(html)).toBe('<html lang="en">');
    expect(htmlTag(html)).not.toContain('dir="rtl"');
  });
});

describe('serveFragment — locale threading', () => {
  it('serveFragment("kpis", ..., "pt-BR") renders a translated label', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-i18n-'));
    const paths: SessionsPaths = {
      eventsFile: path.join(dir, 'events.jsonl'),
      sidecarDir: path.join(dir, '4xx-bodies'),
    };
    const dash = new DashboardState(paths, async () => new Map());
    const html = await (
      await dash.serveFragment('kpis', new URL('http://x/fragments/kpis'), 47821, 'pt-BR')
    ).text();
    expect(html).toContain('Economia %');
  });

  it('serveFragment("kpis") with no locale arg stays English (back-compat)', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'OmniGlyph-i18n-'));
    const paths: SessionsPaths = {
      eventsFile: path.join(dir, 'events.jsonl'),
      sidecarDir: path.join(dir, '4xx-bodies'),
    };
    const dash = new DashboardState(paths, async () => new Map());
    const html = await (
      await dash.serveFragment('kpis', new URL('http://x/fragments/kpis'), 47821)
    ).text();
    expect(html).toContain('Savings %');
  });
});
