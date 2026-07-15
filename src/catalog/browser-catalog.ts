import type { Chroma } from '../domain/chroma';
import { imageUrl } from '../domain/chroma';
import { categoryName } from '../i18n';

export interface BrowserCatalogItem {
  slug: string;
  skinId: number;
  instanceId: string;
  nameZh: string;
  nameEn: string;
  heroId: string;
  heroNameZh: string;
  heroNameEn: string;
  categoryId: string;
  categoryName: string;
  categoryNameEn: string;
  gameVer: string;
  isNew: boolean;
  rank: number;
  imageMedium: string;
}

export type CatalogSort = 'rank_desc' | 'rank_asc' | 'skin_desc' | 'skin_asc' | 'version_desc';

export interface CatalogQuery {
  q?: string;
  hero?: string;
  version?: string;
  category?: string;
  isNew?: boolean;
  sort: CatalogSort;
  page: number;
  pageSize: number;
}

export interface CatalogResult {
  items: BrowserCatalogItem[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    pages: number;
  };
}

const catalogSorts = new Set<CatalogSort>([
  'rank_desc',
  'rank_asc',
  'skin_desc',
  'skin_asc',
  'version_desc',
]);
const safeFilter = /^[A-Za-z0-9_-]+$/;
const gameVersion = /^\d{1,2}\.\d{1,2}$/;

export function toBrowserCatalog(catalog: Chroma[]): BrowserCatalogItem[] {
  return catalog.map((item) => ({
    slug: item.slug,
    skinId: item.skinId,
    instanceId: item.instanceId,
    nameZh: item.nameZh,
    nameEn: item.nameEn,
    heroId: item.heroId,
    heroNameZh: item.heroNameZh,
    heroNameEn: item.heroNameEn,
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    categoryNameEn: categoryName(item.categoryId, 'en'),
    gameVer: item.gameVer,
    isNew: item.isNew,
    rank: item.rank,
    imageMedium: imageUrl(item.images.medium),
  }));
}

function optionalText(params: URLSearchParams, key: string, pattern?: RegExp): string | undefined {
  const value = params.get(key)?.trim();
  if (!value || value.length > 64 || (pattern && !pattern.test(value))) return undefined;
  return value;
}

function boundedInteger(params: URLSearchParams, key: string, fallback: number, maximum: number): number {
  const value = params.get(key);
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 1 && parsed <= maximum ? parsed : fallback;
}

export function parseCatalogQuery(params: URLSearchParams): CatalogQuery {
  const query: CatalogQuery = {
    sort: 'rank_desc',
    page: boundedInteger(params, 'page', 1, 10_000),
    pageSize: boundedInteger(params, 'pageSize', 24, 48),
  };
  const q = optionalText(params, 'q');
  const hero = optionalText(params, 'hero', safeFilter);
  const version = optionalText(params, 'version', gameVersion);
  const category = optionalText(params, 'category', safeFilter);
  const isNew = params.get('isNew');
  const sort = params.get('sort');

  if (q) query.q = q;
  if (hero) query.hero = hero;
  if (version) query.version = version;
  if (category) query.category = category;
  if (isNew === 'true' || isNew === 'false') query.isNew = isNew === 'true';
  if (sort && catalogSorts.has(sort as CatalogSort)) query.sort = sort as CatalogSort;

  return query;
}

function compareVersions(left: string, right: string): number {
  const [leftMajor, leftMinor] = left.split('.').map(Number);
  const [rightMajor, rightMinor] = right.split('.').map(Number);
  return leftMajor - rightMajor || leftMinor - rightMinor;
}

function compareCatalog(left: BrowserCatalogItem, right: BrowserCatalogItem, sort: CatalogSort): number {
  switch (sort) {
    case 'rank_asc':
      return left.rank - right.rank || left.skinId - right.skinId;
    case 'skin_desc':
      return right.skinId - left.skinId;
    case 'skin_asc':
      return left.skinId - right.skinId;
    case 'version_desc':
      return compareVersions(right.gameVer, left.gameVer)
        || right.rank - left.rank
        || right.skinId - left.skinId;
    case 'rank_desc':
      return right.rank - left.rank || right.skinId - left.skinId;
  }
}

export function queryCatalog(items: BrowserCatalogItem[], query: CatalogQuery): CatalogResult {
  const keyword = query.q?.toLowerCase();
  const filtered = items.filter((item) => (
    (!keyword || item.nameZh.toLowerCase().includes(keyword) || item.nameEn.toLowerCase().includes(keyword))
    && (!query.hero || item.heroId === query.hero)
    && (!query.version || item.gameVer === query.version)
    && (!query.category || item.categoryId === query.category)
    && (query.isNew === undefined || item.isNew === query.isNew)
  ));
  filtered.sort((left, right) => compareCatalog(left, right, query.sort));

  const total = filtered.length;
  const pages = Math.ceil(total / query.pageSize);
  const page = pages === 0 ? 1 : Math.min(query.page, pages);
  const offset = (page - 1) * query.pageSize;

  return {
    items: filtered.slice(offset, offset + query.pageSize),
    pagination: { page, pageSize: query.pageSize, total, pages },
  };
}
