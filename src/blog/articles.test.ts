import { describe, expect, it } from 'vitest';
import { blogArticles } from './articles';

describe('blog article metadata', () => {
  it('defines the bilingual launch article with a canonical route', () => {
    expect(blogArticles).toHaveLength(1);
    expect(blogArticles[0]).toMatchObject({
      slug: 'what-is-league-of-legends',
      href: '/blog/what-is-league-of-legends/',
      titleEn: 'What Is League of Legends?',
      titleZh: '什么是《英雄联盟》？',
    });
    expect(blogArticles[0].publishedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(blogArticles[0].readingMinutes).toBeGreaterThan(0);
    expect(blogArticles[0].coverUrl).toMatch(/^https:\/\/cmsassets\.rgpub\.io\//);
    expect(blogArticles[0].sourceUrl).toMatch(/^https:\/\/www\.leagueoflegends\.com\//);
  });
});
