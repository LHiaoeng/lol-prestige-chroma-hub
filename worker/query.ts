import { z } from 'zod';

const sortSql = {
  rank_desc: 'rank DESC, skin_id DESC',
  rank_asc: 'rank ASC, skin_id ASC',
  skin_desc: 'skin_id DESC',
  skin_asc: 'skin_id ASC',
  version_desc: "CAST(substr(game_ver, 1, instr(game_ver, '.') - 1) AS INTEGER) DESC, CAST(substr(game_ver, instr(game_ver, '.') + 1) AS INTEGER) DESC, rank DESC, skin_id DESC",
} as const;

const querySchema = z.object({
  q: z.string().trim().max(64).optional(),
  hero: z.string().trim().max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  version: z.string().regex(/^\d{1,2}\.\d{1,2}$/).optional(),
  category: z.string().trim().max(64).regex(/^[A-Za-z0-9_-]+$/).optional(),
  isNew: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  sort: z.enum(Object.keys(sortSql) as [keyof typeof sortSql, ...(keyof typeof sortSql)[]]).default('rank_desc'),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(48).default(24),
});

export type SearchInput = z.output<typeof querySchema>;

export function parseSearchParams(params: URLSearchParams): SearchInput {
  const known = new Set(['q', 'hero', 'version', 'category', 'isNew', 'sort', 'page', 'pageSize']);
  for (const key of params.keys()) if (!known.has(key)) throw new Error(`Unknown parameter: ${key}`);
  return querySchema.parse(Object.fromEntries(params));
}

export interface CatalogQuery {
  sql: string;
  countSql: string;
  params: Array<string | number>;
  countParams: Array<string | number>;
}

const publicColumns = `slug, skin_id, instance_id, name_zh, name_en, hero_id, hero_name_zh,
  hero_name_en, skin_name_zh, skin_name_en, category_id, category_name, game_ver,
  is_new, rank, image_large, image_medium, image_small, image_tag`;

export function buildCatalogQuery(input: SearchInput, releaseId: string): CatalogQuery {
  const where = ['release_id = ?'];
  const values: Array<string | number> = [releaseId];
  if (input.q) {
    where.push('(name_zh LIKE ? OR name_en LIKE ?)');
    values.push(`%${input.q}%`, `%${input.q}%`);
  }
  if (input.hero) { where.push('hero_id = ?'); values.push(input.hero); }
  if (input.version) { where.push('game_ver = ?'); values.push(input.version); }
  if (input.category) { where.push('category_id = ?'); values.push(input.category); }
  if (input.isNew !== undefined) { where.push('is_new = ?'); values.push(input.isNew ? 1 : 0); }
  const clause = where.join(' AND ');
  return {
    sql: `SELECT ${publicColumns} FROM chromas WHERE ${clause} ORDER BY ${sortSql[input.sort]} LIMIT ? OFFSET ?`,
    countSql: `SELECT COUNT(*) AS total FROM chromas WHERE ${clause}`,
    params: [...values, input.pageSize, (input.page - 1) * input.pageSize],
    countParams: values,
  };
}
