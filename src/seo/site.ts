export const SITE = {
  name: 'LoL Chroma Art',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
  tagline: 'China-Exclusive Chroma Splash Art Archive',
} as const;

export const CHINA_EXCLUSIVE_DEFINITION = {
  en: '“China Exclusive” describes the standalone splash art shown on the Chinese League of Legends server—not necessarily the regional availability of the chroma itself.',
  zh: '“中国服专属”指独立炫彩原画在《英雄联盟》中国服务器中提供，并不表示该炫彩本身一定仅限中国服务器。',
} as const;

export const HOME_SEO = {
  title: `LoL China-Exclusive Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore standalone chroma splash arts shown on the Chinese League of Legends server. “China Exclusive” refers to the artwork, not necessarily the chromas’ regional availability.',
  canonical: `${SITE.origin}/`,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      alternateName: SITE.tagline,
      url: `${SITE.origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE.origin}/#collection`,
      name: 'League of Legends China-Exclusive Chroma Splash Arts',
      description: CHINA_EXCLUSIVE_DEFINITION.en,
      url: `${SITE.origin}/`,
      isPartOf: { '@id': `${SITE.origin}/#website` },
    },
  ],
} as const;
