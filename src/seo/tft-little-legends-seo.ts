import { localeConfig, localizedPath, type Locale } from '../i18n/config';
import { SITE } from './site';

export function createTftLittleLegendsSeo(locale: Locale) {
  const tftHome = 'https://teamfighttactics.leagueoflegends.com/en-us/index/';
  const isZh = locale === 'zh-cn';
  const name = isZh ? '云顶之弈小小英雄' : 'Teamfight Tactics Tacticians';
  const description = isZh
    ? '浏览云顶之弈小小英雄资料，涵盖小小英雄、英雄级小小英雄和不朽弈士形象，并按类别、种类、稀有度和等级查找。'
    : 'Browse Teamfight Tactics Tacticians across Little Legends, Chibis, and Unbound by type, species, rarity, and level.';
  const canonical = new URL(localizedPath(locale, '/tft/companions/'), SITE.origin).toString();
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
          { '@type': 'ListItem', position: 3, name: isZh ? '小小英雄' : 'Tacticians', item: canonical },
        ],
      },
    ],
  };
}
