import { describe, expect, it } from 'vitest';
import { createTftArenasSeo } from './tft-arenas-seo';

describe('TFT Arenas SEO', () => {
  it('publishes localized metadata and a Home-to-TFT-to-Arenas breadcrumb', () => {
    const english = createTftArenasSeo('en');
    const chinese = createTftArenasSeo('zh-cn');

    expect(english).toMatchObject({
      title: 'Teamfight Tactics Arenas | LoL Chroma Art',
      canonical: 'https://chromaart.lol/tft/arenas/',
      jsonLd: [
        {
          '@type': 'CollectionPage',
          name: 'Teamfight Tactics Arenas',
          inLanguage: 'en',
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { position: 1, name: 'Home', item: 'https://chromaart.lol/' },
            {
              position: 2,
              name: 'Teamfight Tactics',
              item: 'https://teamfighttactics.leagueoflegends.com/en-us/index/',
            },
            {
              position: 3,
              name: 'Arenas',
              item: 'https://chromaart.lol/tft/arenas/',
            },
          ],
        },
      ],
    });
    expect(english.description).toBe(
      'Browse Teamfight Tactics arenas by name, group, and cosmetic tier.',
    );
    expect(chinese).toMatchObject({
      title: '云顶之弈棋盘 | LoL Chroma Art',
      canonical: 'https://chromaart.lol/zh-cn/tft/arenas/',
      jsonLd: [
        { '@type': 'CollectionPage', name: '云顶之弈棋盘', inLanguage: 'zh-CN' },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { position: 1, name: '首页', item: 'https://chromaart.lol/zh-cn/' },
            {
              position: 2,
              name: '云顶之弈',
              item: 'https://teamfighttactics.leagueoflegends.com/en-us/index/',
            },
            {
              position: 3,
              name: '棋盘',
              item: 'https://chromaart.lol/zh-cn/tft/arenas/',
            },
          ],
        },
      ],
    });
    expect(chinese.description).toBe(
      '浏览云顶之弈棋盘外观，按名称、分组和外观等级查找。',
    );
  });
});
