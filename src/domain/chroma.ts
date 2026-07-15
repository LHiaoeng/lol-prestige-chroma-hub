import { z } from 'zod';

const safeId = z.string().trim().min(1).max(128).regex(/^[A-Za-z0-9_-]+$/);
const assetPath = z.string().refine(
  (value) => !value.includes('\\') && !value.includes('..') && !/^(?:[A-Za-z]:|\/)/.test(value),
  'must be a safe repository-relative path',
);

const imageSchema = z.object({
  large: assetPath,
  small: assetPath,
  medium: assetPath,
  tag: assetPath,
});

const relationSchema = z.object({
  id: z.number().int().positive(),
  nameZh: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  descriptionZh: z.string().trim().min(1).nullable(),
  descriptionEn: z.string().trim().min(1).nullable(),
});

const relationArraySchema = z.array(relationSchema).superRefine((items, context) => {
  for (let index = 1; index < items.length; index += 1) {
    if (items[index - 1].id >= items[index].id) {
      context.addIssue({
        code: 'custom',
        path: [index, 'id'],
        message: 'relation IDs must be unique and sorted',
      });
    }
  }
});

export const chromaSourceSchema = z.object({
  id: z.number().int().nonnegative(),
  skinId: z.number().int().positive(),
  instanceId: safeId,
  nameZh: z.string().trim().min(1),
  nameEn: z.string().trim().min(1),
  heroId: safeId,
  heroNameZh: z.string().trim().min(1),
  heroNameEn: z.string().trim().min(1),
  sourceSkinId: z.number().int().positive(),
  skinSets: relationArraySchema,
  universes: relationArraySchema,
  skinNameZh: z.string().trim().min(1),
  skinNameEn: z.string().trim().min(1),
  categoryId: safeId,
  categoryName: z.string().trim().min(1),
  tagId: safeId,
  gameVer: z.string().trim().regex(/^\d{1,2}\.\d{1,2}$/),
  isNew: z.boolean(),
  rank: z.number().int(),
  images: imageSchema,
});

export type ChromaSource = z.infer<typeof chromaSourceSchema>;
export type Chroma = ChromaSource & { slug: string };

export function createSlug(heroNameEn: string, chromaNameEn: string, skinId: number): string {
  const normalize = (value: string) => value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = `${normalize(heroNameEn)}-${normalize(chromaNameEn)}-${skinId}`;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('Unable to create a valid slug');
  return slug;
}

function assertImagePaths(item: ChromaSource): void {
  const base = `assets/chromas/${item.instanceId}/`;
  const expected = {
    large: `${base}site3.jpg`,
    small: `${base}site4.jpg`,
    medium: `${base}site5.jpg`,
    tag: `assets/tags/${item.tagId}.png`,
  } as const;
  for (const key of Object.keys(expected) as Array<keyof typeof expected>) {
    if (item.images[key] !== expected[key]) throw new Error(`Invalid ${key} image path`);
  }
}

export function parseCatalog(input: unknown): Chroma[] {
  const source = z.array(chromaSourceSchema).parse(input);
  const instanceIds = new Set<string>();
  const skinIds = new Set<number>();
  const slugs = new Set<string>();
  return source.map((item) => {
    assertImagePaths(item);
    if (instanceIds.has(item.instanceId)) throw new Error(`Duplicate instanceId: ${item.instanceId}`);
    instanceIds.add(item.instanceId);
    const slug = createSlug(item.heroNameEn, item.nameEn, item.skinId);
    if (slugs.has(slug)) throw new Error(`Duplicate slug: ${slug}`);
    if (skinIds.has(item.skinId)) throw new Error(`Duplicate skinId: ${item.skinId}`);
    skinIds.add(item.skinId);
    slugs.add(slug);
    return { ...item, slug };
  });
}

export type ImageKind = 'large' | 'small' | 'medium' | 'tag';

export function sourceImageUrl(kind: ImageKind, id: string): string {
  const root = 'https://game.gtimg.cn/images/lol/act/a20230715chromahub';
  const files: Record<ImageKind, string> = {
    large: `skin/site3-${id}.jpg`,
    small: `skin/site4-${id}.jpg`,
    medium: `skin/site5-${id}.jpg`,
    tag: `tag/x-${id}.png`,
  };
  return `${root}/${files[kind]}`;
}

export function r2Key(repositoryPath: string): string {
  if (!repositoryPath.startsWith('assets/')) throw new Error('R2 source must be under assets/');
  return repositoryPath.slice('assets/'.length);
}

export function imageUrl(repositoryPath: string): string {
  const key = repositoryPath.startsWith('assets/') ? r2Key(repositoryPath) : repositoryPath;
  return `https://img.chromaart.lol/${key}`;
}

export function safeJsonLd(value: unknown): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}
