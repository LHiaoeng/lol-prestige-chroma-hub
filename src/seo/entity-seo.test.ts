import { describe, expect, it } from 'vitest';
import { createEntitySeo } from './entity-seo';

describe('CommunityDragon entity SEO', () => {
  it('adds localized League of Legends context to indexable collections', () => {
    const seo = createEntitySeo('champions', undefined, '英雄资料', '浏览英雄联盟英雄与皮肤资料。', 'zh-cn');
    const englishSeo = createEntitySeo('champions', undefined, 'Champion references', 'Browse League of Legends champions.', 'en');

    expect(seo.title).toBe('英雄联盟 英雄资料 | LoL Chroma Art');
    expect(seo.description).toContain('英雄联盟');
    expect(seo.jsonLd[0]).toMatchObject({ '@type': 'CollectionPage', inLanguage: 'zh-CN' });
    expect(seo.jsonLd[1]).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [
        { position: 1, name: '首页' },
        { position: 2, name: '英雄联盟', item: 'https://chromaart.lol/zh-cn/#home-tools-title' },
        { position: 3, name: '英雄', item: seo.canonical },
      ],
    });
    expect(englishSeo.title).toBe('League of Legends Champion references | LoL Chroma Art');
    expect(englishSeo.jsonLd[1]).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Home' },
        { position: 2, name: 'League of Legends' },
        { position: 3, name: 'Champions', item: englishSeo.canonical },
      ],
    });
  });

  it('keeps runtime detail pages as generic web pages with their visible hierarchy', () => {
    const seo = createEntitySeo('champions/detail', undefined, 'Champion detail', 'Runtime details.', 'en');

    expect(seo.title).toBe('Champion detail | LoL Chroma Art');
    expect(seo.jsonLd[0]).toMatchObject({ '@type': 'WebPage' });
    expect(seo.jsonLd[1]).toMatchObject({
      itemListElement: [
        { position: 1, name: 'Home' },
        { position: 2, name: 'League of Legends', item: 'https://chromaart.lol/#home-tools-title' },
        { position: 3, name: 'Champions', item: 'https://chromaart.lol/champions/' },
        { position: 4, name: 'Champion detail', item: seo.canonical },
      ],
    });
  });

  it('links skin details back to the indexable skin catalog', () => {
    const seo = createEntitySeo('skins/detail', undefined, '皮肤详情', '运行时皮肤资料。', 'zh-cn');
    expect(seo.jsonLd[1]).toMatchObject({ itemListElement: [
      { position: 1, name: '首页' },
      { position: 2, name: '英雄联盟' },
      { position: 3, name: '皮肤', item: 'https://chromaart.lol/zh-cn/skins/' },
      { position: 4, name: '皮肤详情', item: seo.canonical },
    ] });
  });
});
