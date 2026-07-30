import { describe, expect, it } from 'vitest';
import { adjacentBlogArticles, articleHref, blogArticles, formatBlogDate } from './articles';

describe('blog article metadata', () => {
  it('formats ISO publication dates consistently in both languages', () => {
    expect(formatBlogDate('2026-07-20', 'en')).toBe('July 20, 2026');
    expect(formatBlogDate('2026-07-20', 'zh')).toBe('2026年7月20日');
  });

  it('returns non-circular adjacent articles in newest-first order', () => {
    expect(adjacentBlogArticles(blogArticles[0].slug)).toEqual({
      newer: undefined,
      older: blogArticles[1],
    });
    expect(adjacentBlogArticles(blogArticles[1].slug)).toEqual({
      newer: blogArticles[0],
      older: blogArticles[2],
    });
    expect(adjacentBlogArticles(blogArticles.at(-1)!.slug)).toEqual({
      newer: blogArticles.at(-2),
      older: undefined,
    });
    expect(adjacentBlogArticles('missing')).toEqual({ newer: undefined, older: undefined });
  });

  it('publishes seven bilingual articles with unique canonical routes', () => {
    expect(blogArticles).toHaveLength(7);
    expect(blogArticles[0]).toMatchObject({
      slug: 'patch-26-15-prestige-chromas',
      href: '/blog/patch-26-15-prestige-chromas/',
      titleEn: 'LoL Patch 26.15: 6 New Prestige Chromas',
      titleZh: '《英雄联盟》26.15 版本：6 款新增臻彩原画',
    });
    expect(blogArticles[1]).toMatchObject({
      slug: 'champion-most-prestige-chromas',
      href: '/blog/champion-most-prestige-chromas/',
      titleEn: 'Which Champion Has the Most Prestige Chromas?',
      titleZh: '哪个英雄拥有最多臻彩？',
      summaryEn: 'See the current League of Legends prestige chroma leaderboard and a complete gallery for the champion holding first place.',
      summaryZh: '查看当前《英雄联盟》臻彩数量排行榜，以及榜首英雄按皮肤整理的完整臻彩原画。',
      coverUrl: '/img/blog/champion-most-prestige-chromas-cover.jpg',
    });
    expect(blogArticles[2]).toMatchObject({
      slug: 'kaisa-prestige-chroma',
      href: '/blog/kaisa-prestige-chroma/',
      titleEn: 'Kai\u2019Sa Prestige Chroma Gallery',
      titleZh: '卡莎臻彩原画图鉴',
      summaryEn: 'Browse Kai\u2019Sa prestige chroma artwork by skin, with names, colour palettes, and release details.',
      summaryZh: '按皮肤查看卡莎的臻彩原画，以及每款臻彩的名称、配色与获取信息。',
      coverUrl: '/img/blog/kaisa-prestige-chroma-cover.png',
    });
    expect(blogArticles[3]).toMatchObject({
      slug: 'champions-without-prestige-chroma',
      href: '/blog/champions-without-prestige-chroma/',
      titleZh: '哪些英雄还没有臻彩原画？',
    });
    expect(blogArticles[4]).toMatchObject({
      slug: 'what-are-prestige-chromas',
      href: '/blog/what-are-prestige-chromas/',
      titleZh: '什么是臻彩？',
    });
    expect(blogArticles[5]).toMatchObject({
      slug: 'what-are-chroma-skins',
      href: '/blog/what-are-chroma-skins/',
      titleZh: '什么是炫彩皮肤？',
      coverUrl: '/img/blog/chroma-history-hero-en.png',
    });
    expect(blogArticles[6]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[0].readingMinutes).toBeGreaterThan(0);
    expect(new Set(blogArticles.map((article) => article.href)).size).toBe(blogArticles.length);
    expect(blogArticles[0].slug).toBe('patch-26-15-prestige-chromas');
    expect(`${blogArticles[1].titleEn} ${blogArticles[1].titleZh}`).not.toMatch(/\d+\.\d+/);
    expect(`${blogArticles[1].summaryEn} ${blogArticles[1].summaryZh}`).not.toMatch(/Ahri|阿狸|17/);
    for (const article of blogArticles) {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.readingMinutes).toBeGreaterThan(0);
      if (article.sourceUrl) expect(article.sourceUrl).toMatch(/^https:\/\//);
    }
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
