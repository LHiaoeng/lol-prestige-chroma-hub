import { localeConfig, localizedPath, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createTftArenasSeo(locale: Locale) {
  const tftHome = 'https://teamfighttactics.leagueoflegends.com/en-us/index/';
  const isZh = locale === 'zh-cn';
  const name = isZh ? '云顶之弈棋盘' : 'Teamfight Tactics Arenas';
  const description = isZh
    ? '浏览云顶之弈棋盘外观，按名称、分组和外观等级查找。'
    : 'Browse Teamfight Tactics arenas by name, group, and cosmetic tier.';
  const canonical = new URL(localizedPath(locale, '/tft/arenas/'), SITE.origin).toString();
  const homeUrl = new URL(localizedPath(locale, '/'), SITE.origin).toString();

  return {
    title: `${name} | ${SITE.name}`,
    description,
    canonical,
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'CollectionPage', name, description, url: canonical, inLanguage: localeConfig[locale].htmlLang },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: isZh ? '首页' : 'Home', item: homeUrl },
          { '@type': 'ListItem', position: 2, name: isZh ? '云顶之弈' : 'Teamfight Tactics', item: tftHome },
          { '@type': 'ListItem', position: 3, name: isZh ? '棋盘' : 'Arenas', item: canonical },
        ],
      },
    ],
  };
}
