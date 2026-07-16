import { describe, expect, it } from 'vitest';
import type { Chroma } from './chroma';
import { findRelatedChromas } from './related';

function chroma(slug: string, overrides: Partial<Chroma> = {}): Chroma {
  return {
    id: 1,
    slug,
    skinId: 1,
    instanceId: slug,
    nameZh: slug,
    nameEn: slug,
    descriptionZh: null,
    descriptionEn: null,
    colors: [],
    heroId: 'hero-other',
    heroNameZh: '英雄',
    heroNameEn: 'Champion',
    sourceSkinId: 999,
    skinSets: [],
    universes: [],
    skinNameZh: '皮肤',
    skinNameEn: 'Skin',
    categoryId: '4',
    categoryName: '臻彩',
    tagId: '4',
    gameVer: '1.1',
    isNew: false,
    rank: 0,
    images: {
      large: `assets/chromas/${slug}/site3.jpg`,
      small: `assets/chromas/${slug}/site4.jpg`,
      medium: `assets/chromas/${slug}/site5.jpg`,
      tag: 'assets/tags/x-4.png',
    },
    ...overrides,
  };
}

describe('related chroma ranking', () => {
  it('uses skin, champion, patch, skin set, universe, then rank proximity', () => {
    const current = chroma('current', {
      sourceSkinId: 100,
      heroId: 'hero-current',
      gameVer: '26.14',
      skinSets: [{ id: 10, nameZh: '系列', nameEn: 'Set', descriptionZh: null, descriptionEn: null }],
      universes: [{ id: 20, nameZh: '宇宙', nameEn: 'Universe', descriptionZh: null, descriptionEn: null }],
      rank: 50,
    });
    const candidates = [
      chroma('fallback-far', { rank: 1 }),
      chroma('same-universe', { universes: [{ id: 20, nameZh: '宇宙', nameEn: 'Universe', descriptionZh: null, descriptionEn: null }], rank: 49 }),
      chroma('same-series', { skinSets: [{ id: 10, nameZh: '系列', nameEn: 'Set', descriptionZh: null, descriptionEn: null }], rank: 49 }),
      chroma('same-version', { gameVer: '26.14', rank: 49 }),
      chroma('same-hero', { heroId: 'hero-current', rank: 49 }),
      chroma('same-skin', { sourceSkinId: 100, rank: 1 }),
      chroma('fallback-near', { rank: 51 }),
    ];

    expect(findRelatedChromas([current, ...candidates], current, 7).map((item) => item.slug)).toEqual([
      'same-skin',
      'same-hero',
      'same-version',
      'same-series',
      'same-universe',
      'fallback-near',
      'fallback-far',
    ]);
  });

  it('excludes the current chroma and sorts equal tiers by nearest rank', () => {
    const current = chroma('current', { heroId: 'same', rank: 20 });
    const result = findRelatedChromas([
      chroma('far', { heroId: 'same', rank: 30 }),
      current,
      chroma('near', { heroId: 'same', rank: 19 }),
    ], current);

    expect(result.map((item) => item.slug)).toEqual(['near', 'far']);
  });
});
