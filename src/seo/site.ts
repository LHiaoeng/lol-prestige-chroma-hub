export const SITE = {
  name: 'LoL Chroma Art',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
  tagline: 'China-Exclusive Chroma Splash Art Archive',
} as const;

export const HOME_SEO = {
  title: `LoL China-Exclusive Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore an independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends, operated by Tencent.',
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
      description: 'An independent archive of unique splash arts created for selected chromas in the Chinese version of League of Legends.',
      url: `${SITE.origin}/`,
      isPartOf: { '@id': `${SITE.origin}/#website` },
    },
  ],
} as const;
