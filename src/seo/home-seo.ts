import { localeConfig, localizedPath, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createHomeSeo(locale: Locale) {
  const tagline = SITE.tagline[locale];
  const description = locale === 'zh-cn'
    ? '浏览国服臻彩原画、皮肤目录和云顶之弈外观，查看 PBE 新增、版本动态与活动文章。'
    : 'Browse China-server prestige chroma splash arts, skin catalogs, and Teamfight Tactics cosmetics. Catch up on PBE additions, patches, and events.';
  const canonical = new URL(localizedPath(locale, '/'), SITE.origin).toString();
  const inLanguage = localeConfig[locale].htmlLang;

  return {
    tagline,
    title: `${tagline} | ${SITE.name}`,
    description,
    canonical,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${canonical}#website`,
        name: SITE.name,
        url: canonical,
        inLanguage,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${canonical}#collection`,
        name: tagline,
        description,
        url: canonical,
        inLanguage,
        isPartOf: { '@id': `${canonical}#website` },
      },
    ],
  } as const;
}
