import type { ChampionDetail } from '../domain/champion-detail';
import { localeConfig, localizedPath, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createChampionSeo(champion: ChampionDetail, locale: Locale = 'en') {
  const isZh = locale === 'zh-cn';
  const localized = isZh ? champion.zh : champion.en;
  const canonical = new URL(localizedPath(locale, `/champions/${champion.slug}/`), SITE.origin).toString();
  const description = isZh
    ? `${localized.name}（${localized.title}）英雄资料、背景故事、皮肤列表与相关国服臻彩原画。`
    : `${localized.name}, ${localized.title}: champion profile, biography, skin gallery, and related China Server prestige chroma splash arts.`;
  return {
    title: `${localized.name} — ${localized.title} | ${SITE.name}`,
    description,
    canonical,
    image: champion.splashUrl,
    imageAlt: isZh ? `${localized.name} 英雄原画` : `${localized.name} champion splash art`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: localized.name,
        description,
        url: canonical,
        image: champion.splashUrl,
        inLanguage: localeConfig[locale].htmlLang,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: new URL(localizedPath(locale, '/'), SITE.origin).toString() },
          { '@type': 'ListItem', position: 2, name: localized.name, item: canonical },
        ],
      },
    ],
  };
}
