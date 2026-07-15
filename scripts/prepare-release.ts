import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseCatalog, r2Key, type ChromaSource } from '../src/domain/chroma';

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(',')}}`;
  return JSON.stringify(value);
}

export function createReleaseId(value: unknown): string {
  return createHash('sha256').update(stable(value)).digest('hex').slice(0, 20);
}

export function sqlString(value: string): string { return `'${value.replaceAll("'", "''")}'`; }

type ReleaseRecord = Pick<ChromaSource,
  'skinId' | 'instanceId' | 'nameZh' | 'nameEn' | 'heroId' | 'heroNameZh' | 'heroNameEn'
  | 'skinNameZh' | 'skinNameEn' | 'categoryId' | 'categoryName' | 'gameVer' | 'isNew' | 'rank' | 'images'
> & { slug: string };

export function createReleaseSql(records: ReleaseRecord[], releaseId: string): string {
  const columns = ['release_id','slug','skin_id','instance_id','name_zh','name_en','hero_id','hero_name_zh','hero_name_en','skin_name_zh','skin_name_en','category_id','category_name','game_ver','is_new','rank','image_large','image_medium','image_small','image_tag'];
  const rows = records.map((item) => {
    const slug = item.slug;
    const values = [releaseId, slug, item.skinId, item.instanceId, item.nameZh, item.nameEn, item.heroId, item.heroNameZh, item.heroNameEn, item.skinNameZh, item.skinNameEn, item.categoryId, item.categoryName, item.gameVer, item.isNew ? 1 : 0, item.rank, r2Key(item.images.large), r2Key(item.images.medium), r2Key(item.images.small), r2Key(item.images.tag)];
    return `(${values.map((value) => typeof value === 'number' ? value : sqlString(value)).join(', ')})`;
  });
  return `INSERT INTO releases (release_id, created_at, deployed_at, status) VALUES (${sqlString(releaseId)}, CURRENT_TIMESTAMP, NULL, 'imported') ON CONFLICT(release_id) DO UPDATE SET created_at = CURRENT_TIMESTAMP, deployed_at = NULL, status = 'imported';\nDELETE FROM chromas WHERE release_id = ${sqlString(releaseId)};\n${rows.length ? `INSERT INTO chromas (${columns.join(', ')}) VALUES\n${rows.join(',\n')};\n` : ''}`;
}

async function cli(): Promise<void> {
  const root = process.cwd();
  const raw = JSON.parse(await readFile(resolve(root, 'data/prestige-chromas.json'), 'utf8'));
  const catalog = parseCatalog(raw);
  const releaseId = createReleaseId(catalog);
  const out = resolve(root, '.release');
  await mkdir(out, { recursive: true });
  await writeFile(resolve(out, 'release-id.txt'), `${releaseId}\n`);
  await writeFile(resolve(out, 'import.sql'), createReleaseSql(catalog, releaseId));
  console.log(releaseId);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) cli().catch((error) => { console.error(error); process.exitCode = 1; });
