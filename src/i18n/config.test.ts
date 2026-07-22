import { describe, expect, it } from 'vitest';
import {
  SITE_LOCALES,
  alternateUrls,
  localeConfig,
  localizedPath,
  resolveLocale,
} from './config';

describe('internationalized route configuration', () => {
  it('registers unprefixed English and prefixed Simplified Chinese', () => {
    expect(SITE_LOCALES).toEqual(['en', 'zh-cn']);
    expect(localeConfig.en).toMatchObject({ htmlLang: 'en', hreflang: 'en', ogLocale: 'en_US' });
    expect(localeConfig['zh-cn']).toMatchObject({ htmlLang: 'zh-CN', hreflang: 'zh-CN', ogLocale: 'zh_CN' });
    expect(resolveLocale(undefined)).toBe('en');
    expect(resolveLocale('zh-cn')).toBe('zh-cn');
  });

  it('maps the same canonical pathname between locale routes', () => {
    expect(localizedPath('en', '/blog/post/')).toBe('/blog/post/');
    expect(localizedPath('zh-cn', '/blog/post/')).toBe('/zh-cn/blog/post/');
    expect(localizedPath('en', '/zh-cn/blog/post/')).toBe('/blog/post/');
    expect(localizedPath('zh-cn', '/zh-cn/')).toBe('/zh-cn/');
  });

  it('preserves query strings and fragments while switching locale', () => {
    expect(localizedPath('zh-cn', '/?category=4&page=2#catalog')).toBe('/zh-cn/?category=4&page=2#catalog');
    expect(localizedPath('en', '/zh-cn/?category=4&page=2#catalog')).toBe('/?category=4&page=2#catalog');
  });

  it('generates reciprocal absolute alternates and English x-default', () => {
    expect(alternateUrls('/zh-cn/blog/')).toEqual([
      { locale: 'en', hreflang: 'en', url: 'https://chromaart.lol/blog/' },
      { locale: 'zh-cn', hreflang: 'zh-CN', url: 'https://chromaart.lol/zh-cn/blog/' },
      { locale: 'x-default', hreflang: 'x-default', url: 'https://chromaart.lol/blog/' },
    ]);
  });
});
