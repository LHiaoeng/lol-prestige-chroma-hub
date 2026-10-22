import { describe, expect, it } from 'vitest';
import { createTftLittleLegendsSeo } from './tft-little-legends-seo';

describe('TFT Little Legends SEO', () => {
  it('publishes localized metadata and the Home-to-TFT-to-Little-Legends breadcrumb', () => {
    const english = createTftLittleLegendsSeo('en');
    const chinese = createTftLittleLegendsSeo('zh-cn');

    expect(english).toMatchObject({
      title: 'Teamfight Tactics Tacticians | LoL Chroma Art',
      canonical: 'https://chromaart.lol/tft/companions/',
      jsonLd: [
        { '@type': 'CollectionPage', name: 'Teamfight Tactics Tacticians', inLanguage: 'en' },
        { '@type': 'BreadcrumbList', itemListElement: [
          { position: 1, name: 'Home', item: 'https://chromaart.lol/' },
          { position: 2, name: 'Teamfight Tactics', item: 'https://teamfighttactics.leagueoflegends.com/en-us/index/' },
          { position: 3, name: 'Tacticians', item: 'https://chromaart.lol/tft/companions/' },
        ] },
      ],
    });
    expect(english.description).toBe('Browse Teamfight Tactics Tacticians across Little Legends, Chibis, and Unbound by type, species, rarity, and level.');
    expect(chinese).toMatchObject({
      title: '云顶之弈小小英雄 | LoL Chroma Art',
      canonical: 'https://chromaart.lol/zh-cn/tft/companions/',
      jsonLd: [
        { '@type': 'CollectionPage', name: '云顶之弈小小英雄', inLanguage: 'zh-CN' },
        { '@type': 'BreadcrumbList', itemListElement: [
          { position: 1, name: '首页', item: 'https://chromaart.lol/zh-cn/' },
          { position: 2, name: '云顶之弈', item: 'https://teamfighttactics.leagueoflegends.com/en-us/index/' },
          { position: 3, name: '小小英雄', item: 'https://chromaart.lol/zh-cn/tft/companions/' },
        ] },
      ],
    });
    expect(chinese.description).toBe('浏览云顶之弈小小英雄资料，涵盖小小英雄、英雄级小小英雄和不朽弈士形象，并按类别、种类、稀有度和等级查找。');
  });
});
