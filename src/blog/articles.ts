export interface BlogArticle {
  readonly slug: string;
  readonly href: string;
  readonly titleEn: string;
  readonly titleZh: string;
  readonly summaryEn: string;
  readonly summaryZh: string;
  readonly publishedAt: string;
  readonly readingMinutes: number;
  readonly coverUrl: string;
  readonly coverAltEn: string;
  readonly coverAltZh: string;
  readonly sourceUrl?: string;
}

export const blogArticles: readonly BlogArticle[] = [
  {
    slug: 'what-are-chroma-skins',
    href: '/blog/what-are-chroma-skins/',
    titleEn: 'What Are Chroma Skins?',
    titleZh: '什么是炫彩皮肤？',
    summaryEn: 'A guide to chroma backgrounds, colour schemes, purchase methods, and common questions.',
    summaryZh: '介绍炫彩皮肤的推出背景、配色、购买方式与常见问题。',
    publishedAt: '2026-07-20',
    readingMinutes: 7,
    coverUrl: '/images/blog/chroma-history/hero-en.png',
    coverAltEn: 'Chroma Skins 1.1 banner with a lineup of League of Legends champions',
    coverAltZh: '带有英雄阵容的英文 Chroma Skins 1.1 横幅',
  },
  {
    slug: 'what-is-league-of-legends',
    href: '/blog/what-is-league-of-legends/',
    titleEn: 'What Is League of Legends?',
    titleZh: '什么是《英雄联盟》？',
    summaryEn: 'Meet the champions, lanes, objectives, and teamwork that shape every match on Summoner’s Rift.',
    summaryZh: '从英雄、分路、地图目标与团队配合出发，认识召唤师峡谷上的每一场对局。',
    publishedAt: '2026-07-19',
    readingMinutes: 8,
    coverUrl: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/d79ab89872173d65758e134c07ef0645f7a0e504-3288x2100.png?accountingTag=LoL',
    coverAltEn: 'The blue team Nexus and base on Summoner’s Rift',
    coverAltZh: '召唤师峡谷中的蓝色方水晶枢纽与基地',
    sourceUrl: 'https://www.leagueoflegends.com/en-us/how-to-play/',
  },
] as const;
