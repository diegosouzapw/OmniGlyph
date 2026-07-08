import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveLocale, t, MESSAGE_KEYS } from '../src/i18n/index.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const messagesDir = path.join(repoRoot, 'src', 'i18n', 'messages');

interface LocaleEntry {
  code: string;
}
const i18nConfig = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'config', 'i18n.json'), 'utf8'),
) as { default: string; locales: LocaleEntry[] };

describe('resolveLocale', () => {
  it('prefers OMNIGLYPH_LANG over LC_ALL and LANG', () => {
    expect(resolveLocale({ OMNIGLYPH_LANG: 'pt-BR', LC_ALL: 'de_DE.UTF-8', LANG: 'fr_FR' })).toBe(
      'pt-BR',
    );
    expect(resolveLocale({ LC_ALL: 'de_DE.UTF-8', LANG: 'fr_FR' })).toBe('de');
    expect(resolveLocale({ LANG: 'fr_FR.UTF-8' })).toBe('fr');
  });

  it('normalizes POSIX locale syntax to catalog codes', () => {
    expect(resolveLocale({ LANG: 'pt_BR.UTF-8' })).toBe('pt-BR');
    expect(resolveLocale({ LANG: 'zh_CN' })).toBe('zh-CN');
    expect(resolveLocale({ LANG: 'uk_UA' })).toBe('uk-UA');
  });

  it('falls back to the base language when the region variant has no catalog', () => {
    expect(resolveLocale({ LANG: 'de_AT.UTF-8' })).toBe('de');
    expect(resolveLocale({ LANG: 'es_MX' })).toBe('es');
  });

  it('falls back to en for unknown, empty, or C locales', () => {
    expect(resolveLocale({ LANG: 'xx_XX' })).toBe('en');
    expect(resolveLocale({ LANG: 'C' })).toBe('en');
    expect(resolveLocale({ LANG: 'POSIX' })).toBe('en');
    expect(resolveLocale({})).toBe('en');
    expect(resolveLocale({ OMNIGLYPH_LANG: '' })).toBe('en');
  });
});

describe('t', () => {
  it('returns the English help text for en', () => {
    expect(t('cli.help', 'en')).toContain('OmniGlyph');
    expect(t('cli.help', 'en')).toContain('omniglyph export');
    expect(t('cli.exportHelp', 'en')).toContain('--include');
  });

  it('falls back to English when a catalog or key is missing', () => {
    expect(t('cli.help', 'xx' as string)).toBe(t('cli.help', 'en'));
  });
});

describe('message catalogs', () => {
  const en = JSON.parse(fs.readFileSync(path.join(messagesDir, 'en.json'), 'utf8')) as Record<
    string,
    string
  >;

  it('en.json defines every exported message key', () => {
    for (const key of MESSAGE_KEYS) {
      expect(en[key], `en.json missing key ${key}`).toBeTypeOf('string');
      expect(en[key]!.length).toBeGreaterThan(0);
    }
  });

  it('every locale in config/i18n.json has a catalog with exactly the en keys', () => {
    for (const { code } of i18nConfig.locales) {
      const file = path.join(messagesDir, `${code}.json`);
      expect(fs.existsSync(file), `missing catalog ${code}.json`).toBe(true);
      const messages = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
      expect(Object.keys(messages).sort(), `key set mismatch in ${code}.json`).toEqual(
        Object.keys(en).sort(),
      );
      for (const [key, value] of Object.entries(messages)) {
        expect(value, `${code}.json ${key} empty`).toBeTypeOf('string');
        expect(value.length, `${code}.json ${key} empty`).toBeGreaterThan(0);
      }
    }
  });

  it('every catalog keeps env var names and CLI flags untranslated', () => {
    for (const { code } of i18nConfig.locales) {
      const file = path.join(messagesDir, `${code}.json`);
      if (!fs.existsSync(file)) continue; // presence enforced above
      const messages = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, string>;
      for (const token of ['OMNIGLYPH_MODELS', 'ANTHROPIC_BASE_URL', '--version']) {
        expect(messages['cli.help'], `${code}.json cli.help lost ${token}`).toContain(token);
      }
      for (const token of ['--include', '--git', '--stdin', 'manifest.json']) {
        expect(messages['cli.exportHelp'], `${code}.json cli.exportHelp lost ${token}`).toContain(
          token,
        );
      }
    }
  });
});
