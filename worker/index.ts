import { buildCatalogQuery, parseSearchParams } from './query';

export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  RELEASE_ID: string;
}

type DbRow = Record<string, unknown>;

function publicItem(row: DbRow): Record<string, unknown> {
  const fields: Record<string, string> = {
    slug: 'slug', skin_id: 'skinId', instance_id: 'instanceId', name_zh: 'nameZh', name_en: 'nameEn',
    hero_id: 'heroId', hero_name_zh: 'heroNameZh', hero_name_en: 'heroNameEn',
    skin_name_zh: 'skinNameZh', skin_name_en: 'skinNameEn', category_id: 'categoryId',
    category_name: 'categoryName', game_ver: 'gameVer', rank: 'rank', image_large: 'imageLarge',
    image_medium: 'imageMedium', image_small: 'imageSmall', image_tag: 'imageTag',
  };
  const result: Record<string, unknown> = {};
  for (const [source, target] of Object.entries(fields)) if (row[source] !== undefined) result[target] = row[source];
  if (row.is_new !== undefined) result.isNew = Boolean(row.is_new);
  return result;
}

function json(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'cache-control': status === 200 ? 'public, max-age=60, stale-while-revalidate=300' : 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
      'access-control-allow-origin': 'https://chromaart.lol',
    },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname !== '/api/chromas') return env.ASSETS.fetch(request);
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    try {
      const input = parseSearchParams(url.searchParams);
      const query = buildCatalogQuery(input, env.RELEASE_ID);
      const [rows, count] = await Promise.all([
        env.DB.prepare(query.sql).bind(...query.params).all<DbRow>(),
        env.DB.prepare(query.countSql).bind(...query.countParams).first<{ total: number }>(),
      ]);
      const total = Number(count?.total ?? 0);
      return json({
        items: (rows.results ?? []).map(publicItem),
        pagination: { page: input.page, pageSize: input.pageSize, total, pages: Math.ceil(total / input.pageSize) },
      });
    } catch (error) {
      if (error instanceof zodLikeError || error instanceof Error && /parameter|page|sort|version|isNew|q|hero|category/i.test(error.message)) {
        return json({ error: 'Invalid query parameters' }, 400);
      }
      console.error('Catalog API failed', error);
      return json({ error: 'Service unavailable' }, 503);
    }
  },
};

// Avoid coupling the Worker bundle to Zod internals while still classifying validation failures.
const zodLikeError = class extends Error {
  static [Symbol.hasInstance](value: unknown): boolean {
    return Boolean(value && typeof value === 'object' && (value as { name?: string }).name === 'ZodError');
  }
};
