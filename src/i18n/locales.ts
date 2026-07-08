/** Static, generated copy of `config/i18n.json`'s locale list — kept in sync
 *  by tests/dashboard-i18n.test.ts (which reads config/i18n.json directly and
 *  compares). Static (not read from disk at runtime) so it survives esbuild
 *  bundling into a single dist/node.js with no config/ directory shipped in
 *  the npm package (see package.json "files"). Regenerate by hand from
 *  config/i18n.json if a locale is added/removed/renamed there. */
export interface DashLocale {
  code: string;
  flag: string;
  native: string;
}

export const DASH_LOCALES: readonly DashLocale[] = [
  { code: 'ar', flag: '🇸🇦', native: 'العربية' },
  { code: 'az', flag: '🇦🇿', native: 'Azərbaycan dili' },
  { code: 'bg', flag: '🇧🇬', native: 'Български' },
  { code: 'bn', flag: '🇧🇩', native: 'বাংলা' },
  { code: 'cs', flag: '🇨🇿', native: 'Čeština' },
  { code: 'da', flag: '🇩🇰', native: 'Dansk' },
  { code: 'de', flag: '🇩🇪', native: 'Deutsch' },
  { code: 'en', flag: '🇺🇸', native: 'English' },
  { code: 'es', flag: '🇪🇸', native: 'Español' },
  { code: 'fa', flag: '🇮🇷', native: 'فارسی' },
  { code: 'fi', flag: '🇫🇮', native: 'Suomi' },
  { code: 'fr', flag: '🇫🇷', native: 'Français' },
  { code: 'gu', flag: '🇮🇳', native: 'ગુજરાતી' },
  { code: 'he', flag: '🇮🇱', native: 'עברית' },
  { code: 'hi', flag: '🇮🇳', native: 'हिन्दी' },
  { code: 'hu', flag: '🇭🇺', native: 'Magyar' },
  { code: 'id', flag: '🇮🇩', native: 'Bahasa Indonesia' },
  { code: 'it', flag: '🇮🇹', native: 'Italiano' },
  { code: 'ja', flag: '🇯🇵', native: '日本語' },
  { code: 'ko', flag: '🇰🇷', native: '한국어' },
  { code: 'mr', flag: '🇮🇳', native: 'मराठी' },
  { code: 'ms', flag: '🇲🇾', native: 'Bahasa Melayu' },
  { code: 'nl', flag: '🇳🇱', native: 'Nederlands' },
  { code: 'no', flag: '🇳🇴', native: 'Norsk' },
  { code: 'phi', flag: '🇵🇭', native: 'Filipino' },
  { code: 'pl', flag: '🇵🇱', native: 'Polski' },
  { code: 'pt', flag: '🇵🇹', native: 'Português (Portugal)' },
  { code: 'pt-BR', flag: '🇧🇷', native: 'Português (Brasil)' },
  { code: 'ro', flag: '🇷🇴', native: 'Română' },
  { code: 'ru', flag: '🇷🇺', native: 'Русский' },
  { code: 'sk', flag: '🇸🇰', native: 'Slovenčina' },
  { code: 'sv', flag: '🇸🇪', native: 'Svenska' },
  { code: 'sw', flag: '🇰🇪', native: 'Kiswahili' },
  { code: 'ta', flag: '🇮🇳', native: 'தமிழ்' },
  { code: 'te', flag: '🇮🇳', native: 'తెలుగు' },
  { code: 'th', flag: '🇹🇭', native: 'ไทย' },
  { code: 'tr', flag: '🇹🇷', native: 'Türkçe' },
  { code: 'uk-UA', flag: '🇺🇦', native: 'Українська' },
  { code: 'ur', flag: '🇵🇰', native: 'اردو' },
  { code: 'vi', flag: '🇻🇳', native: 'Tiếng Việt' },
  { code: 'zh-CN', flag: '🇨🇳', native: '中文 (简体)' },
  { code: 'zh-TW', flag: '🇹🇼', native: '中文 (繁體)' },
];

/** Locale codes that render right-to-left — mirrors config/i18n.json's `rtl` list. */
export const RTL_LOCALES: readonly string[] = ['ar', 'fa', 'he', 'ur'];
