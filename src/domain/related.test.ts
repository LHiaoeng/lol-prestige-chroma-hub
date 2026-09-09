import { describe, expect, it } from 'vitest';
import type { Chroma } from './chroma';
import { findRelatedGroups } from './related';

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
    heroNameZh: '称号 英雄',
    heroNameEn: 'the Title Champion',
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

const porcelainSet = { id: 10, nameZh: '青花瓷', nameEn: 'Porcelain', descriptionZh: null, descriptionEn: null };
const runeterraUniverse = { id: 20, nameZh: '符文之地', nameEn: 'Runeterra', descriptionZh: null, descriptionEn: null };

describe('findRelatedGroups', () => {
  it('returns groups in order: hero, skinSet, universe, version', () => {
    const current = chroma('porcelain-lux-rose', {
      heroId: 'lux',
      heroNameEn: 'the Lady of Luminosity Lux',
      heroNameZh: '光辉女郎 拉克丝',
      skinSets: [porcelainSet],
      universes: [runeterraUniverse],
      gameVer: '26.14',
      rank: 50,
    });
    const candidates = [
      chroma('porcelain-irelia', { heroId: 'irelia', skinSets: [porcelainSet], universes: [runeterraUniverse], gameVer: '26.14', rank: 49 }),
      chroma('porcelain-ezreal', { heroId: 'ezreal', skinSets: [porcelainSet], gameVer: '26.13', rank: 48 }),
      chroma('faerie-lux', { heroId: 'lux', universes: [runeterraUniverse], gameVer: '26.14', rank: 60 }),
      chroma('porcelain-lux-beacon', { heroId: 'lux', skinSets: [porcelainSet], gameVer: '26.14', rank: 51 }),
      chroma('arcane-ahri', { heroId: 'ahri', universes: [runeterraUniverse], gameVer: '26.12', rank: 55 }),
      chroma('poolparty-caitlyn', { heroId: 'caitlyn', gameVer: '26.14', rank: 52 }),
    ];

    const groups = findRelatedGroups([current, ...candidates], current);

    expect(groups.map((group) => group.kind)).toEqual(['hero', 'skinSet', 'universe', 'version']);

    const hero = groups[0];
    expect(hero.titleEn).toBe('More Lux Prestige Chromas');
    expect(hero.titleZh).toBe('更多拉克丝臻彩');
    expect(hero.chromas.map((item) => item.slug)).toEqual(['porcelain-lux-beacon', 'faerie-lux']);

    const skinSet = groups[1];
    expect(skinSet.titleEn).toBe('More Porcelain Prestige Chromas');
    expect(skinSet.titleZh).toBe('更多青花瓷臻彩');
    expect(skinSet.chromas.map((item) => item.slug)).toEqual(['porcelain-irelia', 'porcelain-ezreal']);

    const universe = groups[2];
    expect(universe.titleEn).toBe('More Runeterra Prestige Chromas');
    expect(universe.titleZh).toBe('更多符文之地臻彩');
    expect(universe.chromas.map((item) => item.slug)).toEqual(['arcane-ahri']);

    const version = groups[3];
    expect(version.titleEn).toBe('More Patch 26.14 Prestige Chromas');
    expect(version.titleZh).toBe('更多26.14版本臻彩');
    expect(version.chromas.map((item) => item.slug)).toEqual(['poolparty-caitlyn']);
  });

  it('deduplicates across groups in priority order: hero first, then skinSet, universe, version', () => {
    const current = chroma('current', {
      heroId: 'lux',
      heroNameEn: 'the Lady of Luminosity Lux',
      heroNameZh: '光辉女郎 拉克丝',
      skinSets: [porcelainSet],
      universes: [runeterraUniverse],
      gameVer: '26.14',
      rank: 50,
    });
    const shared = chroma('shared', { heroId: 'lux', skinSets: [porcelainSet], universes: [runeterraUniverse], gameVer: '26.14', rank: 51 });

    const groups = findRelatedGroups([current, shared], current);

    expect(groups).toHaveLength(1);
    expect(groups[0].kind).toBe('hero');
    expect(groups[0].chromas.map((item) => item.slug)).toEqual(['shared']);
  });

  it('omits groups that have no remaining candidates after dedup', () => {
    const current = chroma('solo', {
      heroId: 'solo',
      skinSets: [porcelainSet],
      universes: [runeterraUniverse],
      gameVer: '26.14',
      rank: 1,
    });
    const unrelated = chroma('unrelated', { heroId: 'other', rank: 2 });

    const groups = findRelatedGroups([current, unrelated], current);

    expect(groups).toHaveLength(0);
  });

  it('skips skinSet and universe groups when current chroma lacks them', () => {
    const current = chroma('no-set', {
      heroId: 'lux',
      heroNameEn: 'the Lady of Luminosity Lux',
      heroNameZh: '光辉女郎 拉克丝',
      skinSets: [],
      universes: [],
      gameVer: '26.14',
      rank: 50,
    });
    const sameHero = chroma('other-lux', { heroId: 'lux', gameVer: '26.14', rank: 51 });
    const sameVersionOtherHero = chroma('poolparty-caitlyn', { heroId: 'caitlyn', gameVer: '26.14', rank: 52 });

    const groups = findRelatedGroups([current, sameHero, sameVersionOtherHero], current);

    expect(groups.map((group) => group.kind)).toEqual(['hero', 'version']);
  });

  it('limits each group to limitPerGroup entries', () => {
    const current = chroma('current', {
      heroId: 'hero',
      heroNameEn: 'the Title Hero',
      heroNameZh: '称号 英雄',
      skinSets: [porcelainSet],
      universes: [runeterraUniverse],
      gameVer: '26.14',
      rank: 100,
    });
    const sameSet = Array.from({ length: 5 }, (_, index) =>
      chroma(`set-${index}`, { heroId: `hero-${index}`, skinSets: [porcelainSet], rank: 100 + index }),
    );
    const sameHero = Array.from({ length: 5 }, (_, index) =>
      chroma(`hero-${index}`, { heroId: 'hero', rank: 100 + index }),
    );

    const groups = findRelatedGroups([current, ...sameSet, ...sameHero], current, 2);

    expect(groups[0].chromas).toHaveLength(2);
    expect(groups[1].chromas).toHaveLength(2);
  });

  it('returns all matching chromas by default without truncating', () => {
    const current = chroma('current', { heroId: 'hero', heroNameEn: 'the Title Hero', heroNameZh: '称号 英雄', skinSets: [porcelainSet], rank: 100 });
    const sameHero = Array.from({ length: 8 }, (_, index) =>
      chroma(`hero-${index}`, { heroId: 'hero', rank: 100 + index }),
    );

    const groups = findRelatedGroups([current, ...sameHero], current);

    expect(groups[0].chromas).toHaveLength(8);
  });
});
