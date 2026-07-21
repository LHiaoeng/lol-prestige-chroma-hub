import { describe, expect, it } from 'vitest';
import { blogArticles, formatBlogDate } from './articles';

describe('blog article metadata', () => {
  it('formats ISO publication dates consistently in both languages', () => {
    expect(formatBlogDate('2026-07-20', 'en')).toBe('July 20, 2026');
    expect(formatBlogDate('2026-07-20', 'zh')).toBe('2026年7月20日');
  });

  it('defines four bilingual articles with unique canonical routes', () => {
    expect(blogArticles).toHaveLength(4);
    expect(blogArticles[0]).toMatchObject({
      slug: 'champions-without-prestige-chroma',
      href: '/blog/champions-without-prestige-chroma/',
      titleEn: 'Which Champions Still Lack Prestige Chroma Splash Art?',
      titleZh: '哪些英雄还没有臻彩原画？',
    });
    expect(blogArticles[1]).toMatchObject({
      slug: 'what-are-prestige-chromas',
      href: '/blog/what-are-prestige-chromas/',
      titleZh: '什么是臻彩？',
    });
    expect(blogArticles[2]).toMatchObject({
      slug: 'what-are-chroma-skins',
      href: '/blog/what-are-chroma-skins/',
      titleZh: '什么是炫彩皮肤？',
      coverUrl: '/blog/chroma-history-hero-en.png',
    });
    expect(blogArticles[3]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[0].readingMinutes).toBeGreaterThan(0);
    expect(new Set(blogArticles.map((article) => article.href)).size).toBe(blogArticles.length);
    for (const article of blogArticles) {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.readingMinutes).toBeGreaterThan(0);
      if (article.sourceUrl) expect(article.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
