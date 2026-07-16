import { describe, expect, it, vi } from 'vitest';
import type { Chroma } from '../domain/chroma';
import {
  parseCatalogQuery,
  queryCatalog,
  toBrowserCatalog,
  type BrowserCatalogItem,
  type CatalogQuery,
} from './browser-catalog';

function chroma(overrides: Partial<Chroma> = {}): Chroma {
  const instanceId = overrides.instanceId ?? 'rose-887034';
  return {
    id: 1,
    slug: 'gwen-rose-887034',
    skinId: 887034,
    instanceId,
    nameZh: '至臻玫瑰格温',
    nameEn: 'Prestige Rose Gwen',
    descriptionZh: null,
    descriptionEn: null,
    colors: [],
    heroId: '887',
    heroNameZh: '格温',
    heroNameEn: 'Gwen',
    sourceSkinId: 887033,
    skinSets: [],
    universes: [],
    skinNameZh: '玫瑰格温',
    skinNameEn: 'Rose Gwen',
    categoryId: '2',
    categoryName: '至臻',
    tagId: 'prestige',
    gameVer: '26.13',
    isNew: true,
    rank: 20,
    images: {
      large: `assets/chromas/${instanceId}/site3.jpg`,
      small: `assets/chromas/${instanceId}/site4.jpg`,
      medium: `assets/chromas/${instanceId}/site5.jpg`,
      tag: 'assets/tags/x-prestige.png',
    },
    ...overrides,
  };
}

function item(overrides: Partial<BrowserCatalogItem> = {}): BrowserCatalogItem {
  return {
    slug: 'gwen-rose-887034',
    skinId: 887034,
    instanceId: 'rose-887034',
    nameZh: '至臻玫瑰格温',
    nameEn: 'Prestige Rose Gwen',
    heroId: '887',
    heroNameZh: '格温',
    heroNameEn: 'Gwen',
    categoryId: '2',
    categoryName: '至臻',
    categoryNameEn: 'Crystalis Motus Chroma',
    gameVer: '26.13',
    isNew: true,
    rank: 20,
    imageMedium: 'https://img.chromaart.lol/chromas/rose-887034/site5.jpg',
    ...overrides,
  };
}

const defaultQuery: CatalogQuery = {
  sort: 'rank_desc',
  page: 1,
  pageSize: 24,
};

describe('browser catalog projection', () => {
  it('projects only list-safe fields and resolves the medium image URL', () => {
    const [projected] = toBrowserCatalog([chroma()]);

    expect(projected).toEqual(item());
    expect(Object.keys(projected)).toEqual([
      'slug', 'skinId', 'instanceId', 'nameZh', 'nameEn', 'heroId', 'heroNameZh', 'heroNameEn',
      'categoryId', 'categoryName', 'categoryNameEn', 'gameVer', 'isNew', 'rank', 'imageMedium',
    ]);
  });
});

describe('catalog URL query parsing', () => {
  it('applies safe defaults', () => {
    expect(parseCatalogQuery(new URLSearchParams())).toEqual(defaultQuery);
  });

  it('parses valid filters and pagination', () => {
    expect(parseCatalogQuery(new URLSearchParams({
      q: ' rose ', hero: '887', version: '26.13', category: '2', isNew: 'false',
      sort: 'skin_asc', page: '10000', pageSize: '48',
    }))).toEqual({
      q: 'rose', hero: '887', version: '26.13', category: '2', isNew: false,
      sort: 'skin_asc', page: 10000, pageSize: 48,
    });
  });

  it('ignores unknown parameters and defaults or omits invalid values', () => {
    expect(parseCatalogQuery(new URLSearchParams({
      unknown: 'value', q: 'x'.repeat(65), hero: 'not valid!', version: 'latest',
      category: '../bad', isNew: 'yes', sort: 'drop_table', page: '10001', pageSize: '49',
    }))).toEqual(defaultQuery);

    expect(parseCatalogQuery(new URLSearchParams({ page: '1.5', pageSize: '0' }))).toEqual(defaultQuery);
  });
});

describe('catalog querying', () => {
  const other = item({
    slug: 'senna-lunar-235010', skinId: 235010, instanceId: 'lunar-235010',
    nameZh: '月蚀赛娜', nameEn: 'Lunar Eclipse Senna', heroId: '235', heroNameZh: '赛娜',
    categoryId: '1', categoryName: '神话', gameVer: '25.9', isNew: false, rank: 10,
  });

  it.each([
    ['Chinese name', { q: '玫瑰' }, ['gwen-rose-887034']],
    ['English name case-insensitively', { q: 'rOsE' }, ['gwen-rose-887034']],
    ['hero', { hero: '235' }, ['senna-lunar-235010']],
    ['version', { version: '25.9' }, ['senna-lunar-235010']],
    ['category', { category: '1' }, ['senna-lunar-235010']],
    ['new status', { isNew: false }, ['senna-lunar-235010']],
  ] as const)('filters by %s', (_label, filter, expected) => {
    const result = queryCatalog([item(), other], { ...defaultQuery, ...filter });
    expect(result.items.map(({ slug }) => slug)).toEqual(expected);
  });

  it('matches lowercase ASCII queries against uppercase English names independent of runtime locale', () => {
    const localeLower = String.prototype.toLocaleLowerCase;
    const localeSpy = vi.spyOn(String.prototype, 'toLocaleLowerCase')
      .mockImplementation(function localeAwareLower(this: string) {
        return localeLower.call(this, 'tr');
      });

    const result = queryCatalog(
      [item({ slug: 'irelia', nameEn: 'PRESTIGE IRELIA' })],
      { ...defaultQuery, q: 'irelia' },
    );
    localeSpy.mockRestore();

    expect(result.items.map(({ slug }) => slug)).toEqual(['irelia']);
  });

  it('combines all filters and reports pagination metadata', () => {
    const result = queryCatalog([item(), other], {
      q: 'rose', hero: '887', version: '26.13', category: '2', isNew: true,
      sort: 'rank_desc', page: 1, pageSize: 24,
    });

    expect(result.items.map(({ slug }) => slug)).toEqual(['gwen-rose-887034']);
    expect(result.pagination).toEqual({ page: 1, pageSize: 24, total: 1, pages: 1 });
  });

  it.each([
    ['rank_desc', ['high-skin', 'low-skin', 'lower-rank']],
    ['rank_asc', ['lower-rank', 'low-skin', 'high-skin']],
    ['skin_desc', ['high-skin', 'lower-rank', 'low-skin']],
    ['skin_asc', ['low-skin', 'lower-rank', 'high-skin']],
  ] as const)('sorts by %s with deterministic prior tie-breakers', (sort, expected) => {
    const items = [
      item({ slug: 'low-skin', skinId: 10, rank: 5 }),
      item({ slug: 'high-skin', skinId: 30, rank: 5 }),
      item({ slug: 'lower-rank', skinId: 20, rank: 1 }),
    ];
    expect(queryCatalog(items, { ...defaultQuery, sort }).items.map(({ slug }) => slug)).toEqual(expected);
  });

  it('sorts dotted versions numerically and uses rank then skin ID as tie-breakers', () => {
    const items = [
      item({ slug: 'v9', gameVer: '9.20', rank: 100, skinId: 99 }),
      item({ slug: 'v10-low', gameVer: '10.2', rank: 1, skinId: 10 }),
      item({ slug: 'v10-high-low-skin', gameVer: '10.2', rank: 5, skinId: 20 }),
      item({ slug: 'v10-high-high-skin', gameVer: '10.2', rank: 5, skinId: 30 }),
    ];

    expect(queryCatalog(items, { ...defaultQuery, sort: 'version_desc' }).items.map(({ slug }) => slug))
      .toEqual(['v10-high-high-skin', 'v10-high-low-skin', 'v10-low', 'v9']);
  });

  it('clamps an out-of-range page to the last available page', () => {
    const items = [item({ slug: 'third', rank: 1 }), item({ slug: 'second', rank: 2 }), item({ slug: 'first', rank: 3 })];
    const result = queryCatalog(items, { ...defaultQuery, page: 99, pageSize: 2 });

    expect(result.items.map(({ slug }) => slug)).toEqual(['third']);
    expect(result.pagination).toEqual({ page: 2, pageSize: 2, total: 3, pages: 2 });
  });

  it('returns page one and zero pages for an empty result', () => {
    expect(queryCatalog([], { ...defaultQuery, page: 99 })).toEqual({
      items: [],
      pagination: { page: 1, pageSize: 24, total: 0, pages: 0 },
    });
  });
});
