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
    slug: 'haibow-jax-prestige-chroma',
    href: '/blog/haibow-jax-prestige-chroma/',
    titleEn: 'Challenger: Mayhem: Free PROJECT: Jax Prestige Chroma',
    titleZh: '海斗大赛专属臻彩：源计划 贾克斯 海斗大赛限定',
    summaryEn: 'Win 15 matches in the first Challenger: Mayhem (China-server-exclusive) to earn PROJECT: Jax (Turquoise) &mdash; a free prestige chroma available from August 27.',
    summaryZh: '国服首届海斗大赛累计 15 胜即可免费领取「源计划：孤狼 贾克斯 海斗大赛限定」臻彩，8 月 27 日起开放领取。国服专属赛事，其他服务器没有。',
    publishedAt: '2026-08-18',
    readingMinutes: 3,
    coverUrl: '/img/blog/haibow-jax-prestige-chroma-cover.jpg',
    coverAltEn: 'PROJECT: Jax (Turquoise) prestige chroma',
    coverAltZh: '源计划：孤狼 贾克斯 海斗大赛限定臻彩',
    sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=1223329969537437457',
  },
  {
    slug: 'patch-26-16-prestige-chromas',
    href: '/blog/patch-26-16-prestige-chromas/',
    titleEn: 'LoL Patch 26.16: 7 New Prestige Chromas',
    titleZh: '《英雄联盟》26.16 版本：7 款新增臻彩原画',
    summaryEn: 'Patch 26.16 adds 7 prestige chromas: four Diamond Porcelain upgrades for Irelia, Ezreal, Lissandra, and Lux, plus Heavenscale Master Yi and Kai\u2019Sa, and Battle Princess Annie.',
    summaryZh: '26.16 版本新增 7 款臻彩：艾瑞莉娅、伊泽瑞尔、丽桑卓和拉克丝的青花瓷钻石臻彩，天龙之子易和卡莎，以及战斗公主安妮。',
    publishedAt: '2026-08-14',
    readingMinutes: 5,
    coverUrl: 'https://img.chromaart.lol/chromas/0a145d9e-33a7-430c-8eb0-49075a397148/site3.jpg',
    coverAltEn: 'Porcelain Irelia (Lustrous) Diamond prestige chroma splash art',
    coverAltZh: '青花瓷 艾瑞莉娅 青白月之羚钻石臻彩原画',
  },
  {
    slug: 'blue-porcelain-prestige-chromas',
    href: '/blog/blue-porcelain-prestige-chromas/',
    titleEn: 'Porcelain Prestige Chromas — Irelia, Lissandra, Ezreal, Lux',
    titleZh: '青花瓷臻彩上线：艾瑞莉娅、丽桑卓、伊泽瑞尔、拉克丝',
    summaryEn: 'Four new Jingdezhen porcelain-inspired prestige chromas launch August 13 and 19. See the full lineup and the cultural collaboration behind them.',
    summaryZh: '四款融入景德镇瓷艺美学的青花瓷臻彩分两批上线，8 月 13 日先出艾瑞莉娅和丽桑卓，8 月 19 日再出伊泽瑞尔和拉克丝。',
    publishedAt: '2026-08-11',
    readingMinutes: 3,
    coverUrl: '/img/blog/blue-porcelain-prestige-chromas-cover.jpg',
    coverAltEn: 'Porcelain prestige chromas showcase — four Jingdezhen-inspired chromas for Irelia, Lissandra, Ezreal, and Lux',
    coverAltZh: '青花瓷臻彩展示 — 四款景德镇瓷艺灵感臻彩',
    sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=8872043071403757220',
  },
  {
    slug: 'joy-club-peak-gala-202607',
    href: '/blog/joy-club-peak-gala-202607/',
    titleEn: 'Joy Club Peak Gala — Session 202607',
    titleZh: '心悦巅峰盛典 — 第 202607 期',
    summaryEn: 'The Joy Club Peak Gala rewards top spenders on the Chinese LoL server with exclusive prestige chromas. Session 202607 runs August 1–31, 2026; spend 500,000 peak value to qualify and claim Spirit Blossom Kayle (Tanzanite) — exclusive for 3 months.',
    summaryZh: '心悦巅峰盛典第 202607 期（2026 年 8 月 1 日—31 日）：在英雄联盟消费累积巅峰值满 50 万即可入席，活动结束后选择大区领取本期专属臻彩「灵魂莲华 凯尔 星回」，享 3 个月独享期。',
    publishedAt: '2026-08-10',
    readingMinutes: 4,
    coverUrl: 'https://img.chromaart.lol/chromas/11914b2b-f986-474e-b3f7-1e8cc41b72c9/site3.jpg',
    coverAltEn: 'Spirit Blossom Kayle (Tanzanite) prestige chroma — Joy Club Peak Gala session 202607 reward',
    coverAltZh: '灵魂莲华 凯尔 星回臻彩 — 心悦巅峰盛典第 202607 期奖励',
    sourceUrl: 'https://act.xinyue.qq.com/act/joyclubgala202608/index.html',
  },
  {
    slug: 'splendid-treasure-august-2026',
    href: '/blog/splendid-treasure-august-2026/',
    titleEn: 'Splendid Treasure Summoning — August 2026',
    titleZh: '华彩秘宝·召唤活动上线',
    summaryEn: 'The Splendid Treasure Summoning event runs August 7 – September 6, 2026 on the Chinese server. Two prestige chromas and one prestige skin headline the fragment exchange shop.',
    summaryZh: '8 月 7 日至 9 月 6 日，华彩秘宝·召唤活动上线。两款臻彩和一款至臻皮肤加入碎片兑换商店。',
    publishedAt: '2026-08-07',
    readingMinutes: 4,
    coverUrl: 'https://img.chromaart.lol/chromas/e27b368d-8a98-45f1-ac06-2f160a7c1400/site3.jpg',
    coverAltEn: 'Spirit Blossom Hwei Catseye prestige chroma splash art',
    coverAltZh: '灵魂莲华 彗 雁来臻彩原画',
    sourceUrl: 'https://lol.qq.com/act/a202608074415lustertreasure/index.html',
  },
  {
    slug: 'prestige-chroma-summon-august-2026',
    href: '/blog/prestige-chroma-summon-august-2026/',
    titleEn: 'Brilliant Prestige Chroma Summoning — August 2026',
    titleZh: '璀璨臻彩召唤活动上新',
    summaryEn: 'A new prestige chroma summon event is live until September 6. See the prize pool, featured chromas, and how to participate.',
    summaryZh: '新一期璀璨臻彩召唤活动上线，持续至 9 月 6 日。查看奖池、精选臻彩与参与方式。',
    publishedAt: '2026-08-07',
    readingMinutes: 4,
    coverUrl: 'https://img.chromaart.lol/chromas/b8890b94-fd18-4ee5-a844-388c74036edd/site3.jpg',
    coverAltEn: 'Battle Academia Xayah Sapphire prestige chroma splash art',
    coverAltZh: '战斗学院 霞 天马臻彩原画',
    sourceUrl: 'https://lol.qq.com/act/a202608077548tendraws34/index.html',
  },
  {
    slug: 'top-2-prestige-chroma-champions',
    href: '/blog/top-2-prestige-chroma-champions/',
    titleEn: 'Which Champion Has the Second Most Prestige Chromas?',
    titleZh: '拥有第二多臻彩的英雄是谁？',
    summaryEn: 'One champion leads the prestige chroma leaderboard. But which two are tied right behind in second?',
    summaryZh: '排行榜第一已经尘埃落定，紧随其后的第二是谁？答案是两位并列。',
    publishedAt: '2026-08-07',
    readingMinutes: 7,
    coverUrl: '/img/blog/top-2-prestige-chroma-champions-cover.jpg',
    coverAltEn: 'Ashe and Lee Sin silhouettes on a second-place podium, tied for the second most prestige chromas',
    coverAltZh: '艾希与李青剪影并肩站在第二名领奖台上，以 15 款臻彩并列第二',
  },
  {
    slug: 'patch-26-15-prestige-chromas',
    href: '/blog/patch-26-15-prestige-chromas/',
    titleEn: 'LoL Patch 26.15: 6 New Prestige Chromas',
    titleZh: '《英雄联盟》26.15 版本：6 款新增臻彩原画',
    summaryEn: 'See all 6 LoL Patch 26.15 prestige chromas for Yasuo, Lillia, Katarina, Kayle, Fiora, and Lux, with splash art, names, colours, and details.',
    summaryZh: '查看《英雄联盟》26.15 版本新增的 6 款臻彩原画，涵盖亚索、莉莉娅、卡特琳娜、凯尔、菲奥娜和拉克丝。',
    publishedAt: '2026-07-30',
    readingMinutes: 5,
    coverUrl: 'https://img.chromaart.lol/chromas/682a0450-c246-485d-b6d6-815a1acebfa0/site3.jpg',
    coverAltEn: 'Petals of Spring Yasuo Emerald prestige chroma splash art',
    coverAltZh: '踏雪寻梅 亚索 独步早春臻彩原画',
  },
  {
    slug: 'champion-most-prestige-chromas',
    href: '/blog/champion-most-prestige-chromas/',
    titleEn: 'Which Champion Has the Most Prestige Chromas?',
    titleZh: '哪个英雄拥有最多臻彩？',
    summaryEn: 'See the current League of Legends prestige chroma leaderboard and a complete gallery for the champion holding first place.',
    summaryZh: '查看当前《英雄联盟》臻彩数量排行榜，以及榜首英雄按皮肤整理的完整臻彩原画。',
    publishedAt: '2026-07-27',
    readingMinutes: 6,
    coverUrl: '/img/blog/champion-most-prestige-chromas-cover.jpg',
    coverAltEn: 'Anonymous champion silhouettes surrounding a glowing prestige chroma trophy',
    coverAltZh: '多位匿名英雄剪影围绕发光的臻彩奖杯',
  },
  {
    slug: 'kaisa-prestige-chroma',
    href: '/blog/kaisa-prestige-chroma/',
    titleEn: 'Kai\u2019Sa Prestige Chroma Gallery',
    titleZh: '\u5361\u838e\u81fb\u5f69\u539f\u753b\u56fe\u9274',
    summaryEn: 'Browse Kai\u2019Sa prestige chroma artwork by skin, with names, colour palettes, and release details.',
    summaryZh: '\u6309\u76ae\u80a4\u67e5\u770b\u5361\u838e\u7684\u81fb\u5f69\u539f\u753b\uff0c\u4ee5\u53ca\u6bcf\u6b3e\u81fb\u5f69\u7684\u540d\u79f0\u3001\u914d\u8272\u4e0e\u83b7\u53d6\u4fe1\u606f\u3002',
    publishedAt: '2026-07-22',
    readingMinutes: 5,
    coverUrl: '/img/blog/kaisa-prestige-chroma-cover.png',
    coverAltEn: 'Kai\u2019Sa prestige chroma splash art concept showcase',
    coverAltZh: '\u5361\u838e\u81fb\u5f69\u539f\u753b\u6982\u5ff5\u5c55\u793a',
  },
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
