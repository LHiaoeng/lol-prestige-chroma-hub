import { describe, expect, it } from 'vitest';
import { adjacentBlogArticles, articleHref, blogArticles, blogArticlesNewestFirst, formatBlogDate } from './articles';

describe('blog article metadata', () => {
  it('formats ISO publication dates consistently in both languages', () => {
    expect(formatBlogDate('2026-07-20', 'en')).toBe('July 20, 2026');
    expect(formatBlogDate('2026-07-20', 'zh')).toBe('2026年7月20日');
  });

  it('returns non-circular adjacent articles in newest-first order', () => {
    expect(blogArticlesNewestFirst[0].slug).toBe('prestige-chroma-summon-2026-21');
    expect(adjacentBlogArticles(blogArticlesNewestFirst[0].slug)).toEqual({
      newer: undefined,
      older: blogArticlesNewestFirst[1],
    });
    expect(adjacentBlogArticles(blogArticlesNewestFirst[1].slug)).toEqual({
      newer: blogArticlesNewestFirst[0],
      older: blogArticlesNewestFirst[2],
    });
    expect(adjacentBlogArticles(blogArticlesNewestFirst.at(-1)!.slug)).toEqual({
      newer: blogArticlesNewestFirst.at(-2),
      older: undefined,
    });
    expect(adjacentBlogArticles('missing')).toEqual({ newer: undefined, older: undefined });
  });

  it('publishes twenty-seven bilingual articles with unique canonical routes', () => {
    expect(blogArticles).toHaveLength(27);
    expect(blogArticles[0]).toMatchObject({
      slug: 'prestige-chroma-summon-2026-21',
      href: '/blog/prestige-chroma-summon-2026-21/',
      titleEn: 'Brilliant Prestige Chroma Summoning — Session 202621',
      titleZh: '璀璨臻彩召唤 — 第 202621 期',
      publishedAt: '2026-09-17',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=4154363561357956970',
      coverUrl: 'https://img.chromaart.lol/chromas/6c5d5c56-66af-4744-988c-6ebe19092c66/site3.jpg',
    });
    expect(blogArticles[1]).toMatchObject({
      slug: 'lucky-gate-ocean-song-202609',
      href: '/blog/lucky-gate-ocean-song-202609/',
      titleEn: 'Lucky Gate: Ocean Song Summoning Event — Session 202618',
      titleZh: '幸运之门·海之歌召唤活动 — 第 202618 期',
      publishedAt: '2026-09-13',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=17083628231197355254',
      coverUrl: 'https://img.chromaart.lol/chromas/d3bf92b5-7e37-4f09-815b-df86b34bc3bd/site3.jpg',
    });
    expect(blogArticles[2]).toMatchObject({
      slug: 'canyon-peak-2026-split-2-rewards',
      href: '/blog/canyon-peak-2026-split-2-rewards/',
      titleEn: 'Canyon Peak 2026 Split 2 Rewards: Headhunter Akali Prestige Chroma',
      titleZh: '峡谷之巅 2026 第二赛段奖励：铁血女忍 阿卡丽 斩魂粉樱臻彩',
      publishedAt: '2026-09-11',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=16574079340694607129',
      coverUrl: 'https://img.chromaart.lol/chromas/20ae2d84-67d5-485f-a8a7-3bfb8310a2bf/site3.jpg',
    });
    expect(blogArticles[3]).toMatchObject({
      slug: 'patch-26-18-prestige-chromas',
      href: '/blog/patch-26-18-prestige-chromas/',
      titleEn: 'LoL Patch 26.18: 4 New Prestige Chromas',
      titleZh: '《英雄联盟》26.18 版本：4 款新增臻彩原画',
      publishedAt: '2026-09-10',
      sourceUrl: 'https://lol.qq.com/gicp/news/410/37096116.html',
      coverUrl: 'https://img.chromaart.lol/chromas/788e0493-4fa1-4f9a-9b7c-e8f1e99fd25b/site3.jpg',
    });
    expect(blogArticles[4]).toMatchObject({
      slug: 'prestige-chroma-summon-september-2026',
      href: '/blog/prestige-chroma-summon-september-2026/',
      titleEn: 'Brilliant Prestige Chroma Summoning — Session 202620',
      titleZh: '璀璨臻彩召唤 — 第 202620 期',
      publishedAt: '2026-09-04',
      sourceUrl: 'https://lol.qq.com/act/a202609047293tendraws35/index.html',
      coverUrl: 'https://img.chromaart.lol/chromas/93781ae8-55cd-4ba4-82eb-d21ee984f063/site3.jpg',
    });
    expect(blogArticles[5]).toMatchObject({
      slug: 'joy-club-peak-gala-202608',
      href: '/blog/joy-club-peak-gala-202608/',
      titleEn: 'Joy Club Peak Gala — Session 202608',
      titleZh: '心悦巅峰盛典 — 第 202608 期',
      publishedAt: '2026-09-02',
      sourceUrl: 'https://act.xinyue.qq.com/act/joyclubgala202609/index.html',
      coverUrl: 'https://img.chromaart.lol/chromas/0745a936-f477-408b-a743-870f9d6e96d8/site3.jpg',
    });
    expect(blogArticles[6]).toMatchObject({
      slug: 'full-gift-reward-prestige-chroma-202608',
      href: '/blog/full-gift-reward-prestige-chroma-202608/',
      titleEn: 'Full Gift Reward Event: Battle Queen Fiora Prestige Chroma',
      titleZh: '满额礼赠活动：女帝菲奥娜臻彩获取指南',
      publishedAt: '2026-09-01',
      sourceUrl: 'https://lol.qq.com/act/a202608276213sale/index.html?e_code=558097',
      coverUrl: 'https://img.chromaart.lol/chromas/619946f6-b69c-4df3-9266-9588322c9802/site3.jpg',
    });
    expect(blogArticles[7]).toMatchObject({
      slug: 'heartsong-seraphine-prestige-chromas-202608',
      href: '/blog/heartsong-seraphine-prestige-chromas-202608/',
      titleEn: 'Heartsong Seraphine Launch: GEM, Three Prestige Chromas, and a Lucky Gate',
      titleZh: '心之歌萨勒芬妮上线：邓紫棋、三款臻彩与幸运之门',
      publishedAt: '2026-08-27',
      sourceUrl: 'https://lol.qq.com/act/a20260828heartsong/index.html',
      coverUrl: 'https://img.chromaart.lol/chromas/94dccf54-86af-4c8d-9525-99e5a989d5f5/site3.jpg',
    });
    expect(blogArticles[8]).toMatchObject({
      slug: 'patch-26-17-prestige-chromas',
      href: '/blog/patch-26-17-prestige-chromas/',
      titleEn: 'LoL Patch 26.17: 7 New Prestige Chromas',
      titleZh: '《英雄联盟》26.17 版本：7 款新增臻彩原画',
      publishedAt: '2026-08-27',
      coverUrl: 'https://img.chromaart.lol/chromas/78495da2-e6c6-4e30-b643-fb1f920535ea/site3.jpg',
    });
    expect(blogArticles[9]).toMatchObject({
      slug: 'lucky-gate-porcelain-charm-202608',
      href: '/blog/lucky-gate-porcelain-charm-202608/',
      titleEn: 'Lucky Gate: Porcelain Charm Summoning Event — Session 202616',
      titleZh: '幸运之门·青瓷彩韵召唤活动 — 第 202616 期',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=17896616915886300256',
      coverUrl: '/img/blog/lucky-gate-porcelain-charm-cover.jpg',
    });
    expect(blogArticles[10]).toMatchObject({
      slug: 'challenger-mayhem-jax-prestige-chroma',
      href: '/blog/challenger-mayhem-jax-prestige-chroma/',
      titleEn: 'Challenger: Mayhem: Free PROJECT: Jax Prestige Chroma',
      titleZh: '海斗大赛专属臻彩：源计划 贾克斯 海斗大赛限定',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=1223329969537437457',
      coverUrl: '/img/blog/challenger-mayhem-jax-prestige-chroma-cover.jpg',
    });
    expect(blogArticles[11]).toMatchObject({
      slug: 'patch-26-16-prestige-chromas',
      href: '/blog/patch-26-16-prestige-chromas/',
      titleEn: 'LoL Patch 26.16: 7 New Prestige Chromas',
      titleZh: '《英雄联盟》26.16 版本：7 款新增臻彩原画',
    });
    expect(blogArticles[12]).toMatchObject({
      slug: 'blue-porcelain-prestige-chromas',
      href: '/blog/blue-porcelain-prestige-chromas/',
      titleEn: 'Porcelain Prestige Chromas — Irelia, Lissandra, Ezreal, Lux',
      titleZh: '青花瓷臻彩上线：艾瑞莉娅、丽桑卓、伊泽瑞尔、拉克丝',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=8872043071403757220',
    });
    expect(blogArticles[13]).toMatchObject({
      slug: 'joy-club-peak-gala-202607',
      href: '/blog/joy-club-peak-gala-202607/',
      titleEn: 'Joy Club Peak Gala — Session 202607',
      titleZh: '心悦巅峰盛典 — 第 202607 期',
      summaryEn: 'The Joy Club Peak Gala rewards top spenders on the Chinese LoL server with exclusive prestige chromas. Session 202607 runs August 1–31, 2026; spend 500,000 peak value to qualify and claim Spirit Blossom Kayle (Tanzanite) — exclusive for 3 months.',
      summaryZh: '心悦巅峰盛典第 202607 期（2026 年 8 月 1 日—31 日）：在英雄联盟消费累积巅峰值满 50 万即可入席，活动结束后选择大区领取本期专属臻彩「灵魂莲华 凯尔 星回」，享 3 个月独享期。',
      coverUrl: 'https://img.chromaart.lol/chromas/11914b2b-f986-474e-b3f7-1e8cc41b72c9/site3.jpg',
      sourceUrl: 'https://act.xinyue.qq.com/act/joyclubgala202608/index.html',
    });
    expect(blogArticles[14]).toMatchObject({
      slug: 'splendid-treasure-august-2026',
      href: '/blog/splendid-treasure-august-2026/',
      titleEn: 'Splendid Treasure Summoning — August 2026',
      titleZh: '华彩秘宝·召唤活动上线',
    });
    expect(blogArticles[15]).toMatchObject({
      slug: 'prestige-chroma-summon-august-2026',
      href: '/blog/prestige-chroma-summon-august-2026/',
      titleEn: 'Brilliant Prestige Chroma Summoning — Session 202619',
      titleZh: '璀璨臻彩召唤 — 第 202619 期',
    });
    expect(blogArticles[16]).toMatchObject({
      slug: 'top-2-prestige-chroma-champions',
      href: '/blog/top-2-prestige-chroma-champions/',
      titleEn: 'Which Champion Has the Second Most Prestige Chromas?',
      titleZh: '拥有第二多臻彩的英雄是谁？',
      summaryEn: 'One champion leads the prestige chroma leaderboard. But which two are tied right behind in second?',
      summaryZh: '排行榜第一已经尘埃落定，紧随其后的第二是谁？答案是两位并列。',
    });
    expect(blogArticles[17]).toMatchObject({
      slug: 'patch-26-15-prestige-chromas',
      href: '/blog/patch-26-15-prestige-chromas/',
      titleEn: 'LoL Patch 26.15: 6 New Prestige Chromas',
      titleZh: '《英雄联盟》26.15 版本：6 款新增臻彩原画',
    });
    expect(blogArticles[18]).toMatchObject({
      slug: 'lucky-gate-petals-of-spring-chromas-202607',
      href: '/blog/lucky-gate-petals-of-spring-chromas-202607/',
      titleEn: 'Lucky Gate: Three Petals of Spring Prestige Chromas',
      titleZh: '幸运之门：三款踏雪寻梅臻彩',
      publishedAt: '2026-07-29',
      sourceUrl: 'https://lol.qq.com/news/detail.shtml?docid=15850902128487429757',
    });
    expect(blogArticles[19]).toMatchObject({
      slug: 'champion-most-prestige-chromas',
      href: '/blog/champion-most-prestige-chromas/',
      titleEn: 'Which Champion Has the Most Prestige Chromas?',
      titleZh: '哪个英雄拥有最多臻彩？',
      summaryEn: 'See the current League of Legends prestige chroma leaderboard and a complete gallery for the champion holding first place.',
      summaryZh: '查看当前《英雄联盟》臻彩数量排行榜，以及榜首英雄按皮肤整理的完整臻彩原画。',
      coverUrl: '/img/blog/champion-most-prestige-chromas-cover.jpg',
    });
    expect(blogArticles[20]).toMatchObject({
      slug: 'kaisa-prestige-chroma',
      href: '/blog/kaisa-prestige-chroma/',
      titleEn: 'Kai\u2019Sa Prestige Chroma Gallery',
      titleZh: '卡莎臻彩原画图鉴',
      summaryEn: 'Browse Kai\u2019Sa prestige chroma artwork by skin, with names, colour palettes, and release details.',
      summaryZh: '按皮肤查看卡莎的臻彩原画，以及每款臻彩的名称、配色与获取信息。',
      coverUrl: '/img/blog/kaisa-prestige-chroma-cover.png',
    });
    expect(blogArticles[21]).toMatchObject({
      slug: 'champions-without-prestige-chroma',
      href: '/blog/champions-without-prestige-chroma/',
      titleZh: '哪些英雄还没有臻彩原画？',
    });
    expect(blogArticles[22]).toMatchObject({
      slug: 'what-are-prestige-chromas',
      href: '/blog/what-are-prestige-chromas/',
      titleZh: '什么是臻彩？',
    });
    expect(blogArticles[23]).toMatchObject({
      slug: 'what-are-chroma-skins',
      href: '/blog/what-are-chroma-skins/',
      titleZh: '什么是炫彩皮肤？',
      coverUrl: '/img/blog/chroma-history-hero-en.png',
    });
    expect(blogArticles[24]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[25]).toMatchObject({
      slug: 'joy-club-peak-gala-202606',
      href: '/blog/joy-club-peak-gala-202606/',
      titleEn: 'Joy Club Peak Gala — Session 202606',
      titleZh: '心悦巅峰盛典 — 第 202606 期',
      publishedAt: '2026-07-01',
      sourceUrl: 'https://act.xinyue.qq.com/act/joyclubgala202607/index.html',
    });
    expect(blogArticles.find((article) => article.slug === 'brilliant-prestige-chroma-summoning-guide')).toMatchObject({
      href: '/blog/brilliant-prestige-chroma-summoning-guide/',
      titleEn: 'Brilliant Prestige Chroma Summoning: Complete Guide',
      titleZh: '璀璨臻彩召唤完全指南',
      publishedAt: '2026-09-15',
      sourceUrl: 'https://lol.qq.com/act/a202609047293tendraws35/index.html',
      category: 'guide',
    });
    expect(blogArticles[18].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[18].readingMinutes).toBeGreaterThan(0);
    expect(new Set(blogArticles.map((article) => article.href)).size).toBe(blogArticles.length);
    expect(blogArticles[16].slug).toBe('top-2-prestige-chroma-champions');
    expect(`${blogArticles[19].titleEn} ${blogArticles[19].titleZh}`).not.toMatch(/\d+\.\d+/);
    expect(`${blogArticles[19].summaryEn} ${blogArticles[19].summaryZh}`).not.toMatch(/Ahri|阿狸|17/);
    for (const article of blogArticles) {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.readingMinutes).toBeGreaterThan(0);
      if (article.sourceUrl) expect(article.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it('marks every blog article as ad eligible', () => {
    expect(blogArticles.every((article) => article.adEligible)).toBe(true);
  });

  it('derives crawlable article routes for each locale', () => {
    const article = blogArticles[0];
    expect(articleHref(article, 'en')).toBe(`/blog/${article.slug}/`);
    expect(articleHref(article, 'zh-cn')).toBe(`/zh-cn/blog/${article.slug}/`);
  });

  it('keeps live coverage article metadata free of stale counts and patch numbers', () => {
    const article = blogArticles.find((item) => item.slug === 'champions-without-prestige-chroma');
    expect(article).toBeDefined();
    expect(article!.summaryEn).toBe('A live League of Legends tracker showing every champion that still lacks prestige chroma splash art.');
    expect(article!.summaryZh).toBe('动态追踪《英雄联盟》中仍未获得臻彩原画的全部英雄。');
    expect(`${article!.summaryEn} ${article!.summaryZh}`).not.toMatch(/26\.14|173|105|68|60\.7/);
  });
});
