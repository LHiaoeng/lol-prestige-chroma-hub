import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { localeConfig, localizedPath, type Locale } from '../i18n/config';
import { SITE } from './site';

export function chromaImageAlt(name: string, locale: Locale = 'en'): string {
  return locale === 'zh-cn'
    ? `${name} 中国服专属炫彩原画`
    : `${name} China-Exclusive Chroma Splash Art`;
}

export function createChromaSeo(chroma: Chroma, requestedLocale: Locale = 'en') {
  const locale: Locale = requestedLocale === 'zh-cn' ? 'zh-cn' : 'en';
  const isZh = locale === 'zh-cn';
  const canonical = new URL(localizedPath(locale, `/chromas/${chroma.slug}/`), SITE.origin).toString();
  const image = imageUrl(chroma.images.large);
  const name = isZh ? chroma.nameZh : chroma.nameEn;
  const description = isZh
    ? `${chroma.nameZh}：《英雄联盟》中国服务器中提供的独立炫彩原画（版本 ${chroma.gameVer}）；炫彩本身的地区可用性可能不同。`
    : `${chroma.nameEn}: standalone splash art shown in the Chinese version of League of Legends (patch ${chroma.gameVer}); chroma availability may differ by region.`;
  return {
    title: `${chromaImageAlt(name, locale)} | ${SITE.name}`,
    description,
    canonical,
    image,
    imageAlt: chromaImageAlt(name, locale),
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        name,
        url: canonical,
        contentUrl: image,
        representativeOfPage: true,
        description,
        inLanguage: localeConfig[locale].htmlLang,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: new URL(localizedPath(locale, '/'), SITE.origin).toString() },
          { '@type': 'ListItem', position: 2, name: isZh ? chroma.skinNameZh : chroma.skinNameEn },
          { '@type': 'ListItem', position: 3, name, item: canonical },
        ],
      },
    ],
  };
}
