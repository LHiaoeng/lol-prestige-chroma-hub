export const SITE = {
  name: 'CHROMA ART',
  origin: 'https://chromaart.lol',
  defaultImage: 'https://chromaart.lol/placeholder.svg',
} as const;

export const HOME_SEO = {
  title: `LoL China Exclusive Prestige Chroma Splash Arts | ${SITE.name}`,
  description: 'Explore China Exclusive Prestige Chromas for League of Legends, featuring unique splash arts from Riot Games and updates for every new LoL patch.',
  canonical: `${SITE.origin}/`,
  jsonLd: [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE.origin}/#website`,
      name: SITE.name,
      alternateName: 'League of Legends China Exclusive Prestige Chroma Art',
      url: `${SITE.origin}/`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      '@id': `${SITE.origin}/#collection`,
      name: 'League of Legends China Exclusive Prestige Chroma Splash Arts',
      description: 'A continuously updated archive of China Exclusive Prestige Chroma splash arts for League of Legends.',
      url: `${SITE.origin}/`,
      isPartOf: { '@id': `${SITE.origin}/#website` },
    },
  ],
} as const;
