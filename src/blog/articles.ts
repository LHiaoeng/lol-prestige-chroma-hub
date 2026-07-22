import { localizedPath, type Locale } from '../i18n/config';

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

export function articleHref(article: Pick<BlogArticle, 'slug'>, locale: Locale): string {
  return localizedPath(locale, `/blog/${article.slug}/`);
}

export function formatBlogDate(date: string, language: 'en' | 'zh'): string {
  if (language === 'zh') {
    const [year, month, day] = date.split('-').map(Number);
    return `${year}年${month}月${day}日`;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}

export const blogArticles: readonly BlogArticle[] = [
  {
    slug: 'champions-without-prestige-chroma',
    href: '/blog/champions-without-prestige-chroma/',
    titleEn: 'Which Champions Still Lack Prestige Chroma Splash Art?',
    titleZh: '哪些英雄还没有臻彩原画？',
    summaryEn: 'A live League of Legends tracker showing every champion that still lacks prestige chroma splash art.',
    summaryZh: '动态追踪《英雄联盟》中仍未获得臻彩原画的全部英雄。',
    publishedAt: '2026-07-22',
    readingMinutes: 5,
    coverUrl: '/img/blog/cover-champions-without-prestige-chroma.jpg',
    coverAltEn: 'Prestige chroma splash art showcase in the League of Legends client',
    coverAltZh: '《英雄联盟》客户端中的臻彩原画展示',
  },
  {
    slug: 'what-are-prestige-chromas',
    href: '/blog/what-are-prestige-chromas/',
    titleEn: 'What Are Prestige Chromas?',
    titleZh: '什么是臻彩？',
    summaryEn: 'A rare cosmetic tier in League of Legends: how prestige chromas work, how to collect them, and what makes them special.',
    summaryZh: '了解《英雄联盟》中的珍稀限定炫彩——臻彩的获取方式、收藏系统与独特之处。',
    publishedAt: '2026-07-21',
    readingMinutes: 6,
    coverUrl: '/img/blog/prestige-chromas-cover.png',
    coverAltEn: 'Prestige Chroma Collection interface in the League of Legends client',
    coverAltZh: '《英雄联盟》客户端中的臻彩藏馆界面',
  },
  {
    slug: 'what-are-chroma-skins',
    href: '/blog/what-are-chroma-skins/',
    titleEn: 'What Are Chroma Skins?',
    titleZh: '什么是炫彩皮肤？',
    summaryEn: 'A guide to chroma backgrounds, colour schemes, purchase methods, and common questions.',
    summaryZh: '介绍炫彩皮肤的推出背景、配色、购买方式与常见问题。',
    publishedAt: '2026-07-20',
    readingMinutes: 7,
    coverUrl: '/img/blog/chroma-history-hero-en.png',
    coverAltEn: 'Chroma Skins 1.1 banner with a lineup of League of Legends champions',
    coverAltZh: '带有英雄阵容的英文 Chroma Skins 1.1 横幅',
  },
  {
    slug: 'what-is-league-of-legends',
    href: '/blog/what-is-league-of-legends/',
    titleEn: 'What Is League of Legends?',
    titleZh: '什么是《英雄联盟》？',
    summaryEn: 'Meet the champions, lanes, objectives, and teamwork that shape every match on Summoner\u2019s Rift.',
    summaryZh: '从英雄、分路、地图目标与团队配合出发，认识召唤师峡谷上的每一场对局。',
    publishedAt: '2026-07-19',
    readingMinutes: 8,
    coverUrl: 'https://cmsassets.rgpub.io/sanity/images/dsfx7636/news/d79ab89872173d65758e134c07ef0645f7a0e504-3288x2100.png?accountingTag=LoL',
    coverAltEn: 'The blue team Nexus and base on Summoner\u2019s Rift',
    coverAltZh: '召唤师峡谷中的蓝色方水晶枢纽与基地',
    sourceUrl: 'https://www.leagueoflegends.com/en-us/how-to-play/',
  },
] as const;

export function adjacentBlogArticles(currentSlug: string): {
  newer: BlogArticle | undefined;
  older: BlogArticle | undefined;
} {
  const index = blogArticles.findIndex((article) => article.slug === currentSlug);
  if (index < 0) return { newer: undefined, older: undefined };
  return {
    newer: blogArticles[index - 1],
    older: blogArticles[index + 1],
  };
}
