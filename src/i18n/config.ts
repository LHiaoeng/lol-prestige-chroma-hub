import { SITE } from '../seo/site';

export const SITE_LOCALES = ['en', 'zh-cn'] as const;
export type Locale = typeof SITE_LOCALES[number];

export const localeConfig = {
  en: { htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US', pathPrefix: '' },
  'zh-cn': { htmlLang: 'zh-CN', hreflang: 'zh-CN', ogLocale: 'zh_CN', pathPrefix: '/zh-cn' },
} as const satisfies Record<Locale, {
  htmlLang: string;
  hreflang: string;
  ogLocale: string;
  pathPrefix: string;
}>;

export function resolveLocale(value: string | undefined): Locale {
  return SITE_LOCALES.includes(value as Locale) ? value as Locale : 'en';
}

function unprefixedPath(pathname: string): string {
  if (pathname === '/zh-cn') return '/';
  return pathname.startsWith('/zh-cn/') ? pathname.slice('/zh-cn'.length) : pathname;
}

export function localizedPath(locale: Locale, value: string): string {
  const url = new URL(value, SITE.origin);
  const pathname = unprefixedPath(url.pathname);
  const localized = locale === 'en' ? pathname : `/zh-cn${pathname}`;
  return `${localized}${url.search}${url.hash}`;
}

export function alternateUrls(value: string): readonly {
  locale: Locale | 'x-default';
  hreflang: 'en' | 'zh-CN' | 'x-default';
  url: string;
}[] {
  const source = new URL(value, SITE.origin);
  const pathname = `${source.pathname}${source.search}${source.hash}`;
  const english = new URL(localizedPath('en', pathname), SITE.origin).toString();
  return [
    { locale: 'en', hreflang: 'en', url: english },
    { locale: 'zh-cn', hreflang: 'zh-CN', url: new URL(localizedPath('zh-cn', pathname), SITE.origin).toString() },
    { locale: 'x-default', hreflang: 'x-default', url: english },
  ];
}
