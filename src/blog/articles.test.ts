import { describe, expect, it } from 'vitest';
import { adjacentBlogArticles, blogArticles, formatBlogDate } from './articles';

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

  it('publishes three bilingual articles with unique canonical routes', () => {
    expect(blogArticles).toHaveLength(3);
    expect(blogArticles[0]).toMatchObject({
      slug: 'what-are-prestige-chromas',
      href: '/blog/what-are-prestige-chromas/',
      titleZh: '什么是臻彩？',
    });
    expect(blogArticles[1]).toMatchObject({
      slug: 'what-are-chroma-skins',
      href: '/blog/what-are-chroma-skins/',
      titleZh: '什么是炫彩皮肤？',
      coverUrl: '/img/blog/chroma-history-hero-en.png',
    });
    expect(blogArticles[2]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[0].readingMinutes).toBeGreaterThan(0);
    expect(new Set(blogArticles.map((article) => article.href)).size).toBe(blogArticles.length);
    expect(blogArticles.some((article) => article.slug === 'champions-without-prestige-chroma')).toBe(false);
    for (const article of blogArticles) {
      expect(article.publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(article.readingMinutes).toBeGreaterThan(0);
      if (article.sourceUrl) expect(article.sourceUrl).toMatch(/^https:\/\//);
    }
  });
});
