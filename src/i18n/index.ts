/** CLI i18n — same system as OmniRoute: locale list lives in `config/i18n.json`,
 *  message catalogs in `messages/<code>.json`, English is the fallback chain's
 *  terminal. Catalogs are read from disk next to this module so the bundle stays
 *  lean; a missing catalog silently falls back to en (never a crash path). */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

import en from './messages/en.json' with { type: 'json' };
import { DASH_LOCALES } from './locales.js';

export const MESSAGE_KEYS = Object.keys(en) as (keyof typeof en)[];
export type MessageKey = (typeof MESSAGE_KEYS)[number];

/** Locations that can hold `messages/` depending on how we run: as TS source
 *  (src/i18n/messages) or as the esbuild bundle (dist/i18n/messages, copied by
 *  scripts/build.mjs — the bundle flattens this module into dist/node.js). */
function messageDirs(): string[] {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [path.join(here, 'messages'), path.join(here, 'i18n', 'messages')];
}

function readCatalog(code: string): Record<string, string> | undefined {
  if (!/^[a-zA-Z-]+$/.test(code)) return undefined;
  for (const dir of messageDirs()) {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir, `${code}.json`), 'utf8')) as Record<
        string,
        string
      >;
    } catch {
      /* try the next location */
    }
  }
  return undefined;
}

const catalogCache = new Map<string, Record<string, string>>();

function catalogFor(locale: string): Record<string, string> {
  if (locale === 'en') return en;
  const cached = catalogCache.get(locale);
  if (cached) return cached;
  const loaded = readCatalog(locale) ?? en;
  catalogCache.set(locale, loaded);
  return loaded;
}

/** `pt_BR.UTF-8` → `pt-BR`; the region part keeps its case (zh_cn → zh-CN via
 *  catalog probe below is NOT attempted — POSIX locales are conventionally
 *  lower_UPPER, which maps 1:1 onto our catalog codes). */
function normalize(raw: string): string {
  const bare = raw.split(/[.@]/, 1)[0]!.trim();
  return bare.replace('_', '-');
}

/** Resolve the CLI locale from the environment: OMNIGLYPH_LANG beats LC_ALL
 *  beats LANG; exact catalog match beats base-language match; anything else
 *  (unknown code, `C`, `POSIX`, empty) is English. */
export function resolveLocale(env: Record<string, string | undefined>): string {
  for (const key of ['OMNIGLYPH_LANG', 'LC_ALL', 'LANG'] as const) {
    const raw = env[key];
    if (!raw) continue;
    const code = normalize(raw);
    if (!code || code === 'C' || code === 'POSIX') continue;
    if (code === 'en' || readCatalog(code)) return code;
    const base = code.split('-', 1)[0]!;
    if (base === 'en' || readCatalog(base)) return base;
  }
  return 'en';
}

/** Look a message up in the locale's catalog, falling back to English. */
export function t(key: MessageKey, locale: string): string {
  return catalogFor(locale)[key] ?? en[key];
}

/** `{name}` placeholder substitution — no dependency, just enough for the
 *  dashboard's interpolated strings (counts, percentages, formatted $/tok).
 *  Unknown placeholders are left as-is rather than throwing: a template
 *  missing a var is a caller bug, but the dashboard must never 500 on it. */
export function fmt(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : whole,
  );
}

const DASH_LOCALE_CODES = new Set(DASH_LOCALES.map((l) => l.code));

/** Extract `omniglyph_lang=<code>` from a raw `Cookie` header. */
function cookieLocale(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== 'omniglyph_lang') continue;
    const value = decodeURIComponent(part.slice(eq + 1).trim());
    return value || null;
  }
  return null;
}

/** Resolve the dashboard's locale: a valid `omniglyph_lang` cookie wins
 *  outright (even over env); a cookie present but naming a locale outside
 *  the 42-locale catalog is treated as a bad request and falls back to
 *  English directly (not to env — an operator's env shouldn't override an
 *  explicit-but-wrong client choice); no cookie (or no `omniglyph_lang` key
 *  in it) falls back to the CLI's own `resolveLocale(env)`. */
export function resolveDashLocale(
  cookieHeader: string | undefined,
  env: Record<string, string | undefined>,
): string {
  const fromCookie = cookieLocale(cookieHeader);
  if (fromCookie == null) return resolveLocale(env);
  return DASH_LOCALE_CODES.has(fromCookie) ? fromCookie : 'en';
}
