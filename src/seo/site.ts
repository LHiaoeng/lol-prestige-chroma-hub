export const SITE = {
  name: 'LoL Chroma Art',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
  tagline: 'China-Exclusive Chroma Splash Art Archive',
} as const;

export const CHINA_EXCLUSIVE_DEFINITION = {
  en: '“China Exclusive” describes the standalone Prestige Chroma splash art provided on the League of Legends China Server—not necessarily the regional availability of the chroma itself.',
  zh: '“中国服专属”指中国大陆服为臻彩单独提供的臻彩原画，并不表示对应炫彩一定仅限中国大陆服。',
} as const;

export const HOME_SEO = {
  title: `LoL China-Exclusive Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore standalone chroma splash arts shown on the League of Legends China Server. “China Exclusive” refers to the artwork, not necessarily the chromas’ regional availability.',
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
