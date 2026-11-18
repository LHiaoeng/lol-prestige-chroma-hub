export const SITE = {
  name: 'LoL Chroma Art',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
  tagline: {
    en: 'League of Legends, Teamfight Tactics & Wild Rift Content Hub',
    'zh-cn': '英雄联盟、云顶之弈与英雄联盟手游内容聚合站',
  },
} as const;

export const CHINA_EXCLUSIVE_DEFINITION = {
  en: '“China Exclusive” describes the standalone Prestige Chroma splash art provided on the League of Legends China Server—not necessarily the regional availability of the chroma itself.',
  zh: '“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。',
} as const;

const homeDescription = 'Browse China-server prestige chroma splash arts, skin catalogs, and Teamfight Tactics cosmetics. Catch up on PBE additions, patches, and events.';

export const HOME_SEO = {
  title: `${SITE.tagline.en} | ${SITE.name}`,
  description: homeDescription,
  canonical: `${SITE.origin}/`,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      url: `${SITE.origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE.origin}/#collection`,
      name: SITE.tagline.en,
      description: homeDescription,
      url: `${SITE.origin}/`,
      isPartOf: { '@id': `${SITE.origin}/#website` },
    },
  ],
} as const;
