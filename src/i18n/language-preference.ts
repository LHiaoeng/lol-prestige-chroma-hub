import type { Locale } from './config';

export const LANGUAGE_SWITCH_PATH = '/_language/';
export const LANGUAGE_COOKIE = 'site-language';

export function browserLocale(acceptLanguage: string | null): Locale {
  const preferences = (acceptLanguage ?? '').split(',').flatMap((range) => {
    const [tag = '', quality, ...extra] = range.trim().split(';');
    if (extra.length) return [];
    const weight = quality === undefined ? '1' : /^q=(0(?:\.\d{0,3})?|1(?:\.0{0,3})?)$/i.exec(quality.trim())?.[1];
    if (!weight || Number(weight) === 0) return [];
    try {
      return [{ locale: new Intl.Locale(tag.trim()), weight: Number(weight) }];
    } catch {
      return [];
    }
  });

  preferences.sort((first, second) => second.weight - first.weight);
  for (const { locale } of preferences) {
    const { language, script, region } = locale;
    if (language === 'en') return 'en';
    if (language === 'zh' && (script === 'Hans' || (!script && (!region || region === 'CN' || region === 'SG')))) {
      return 'zh-cn';
    }
  }
  return 'en';
}
