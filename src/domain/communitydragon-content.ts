import { z } from 'zod';
import { catalog } from '../data/catalog';
import { communityDragonAssetUrl } from './communitydragon-url';
import { championSlug } from './champion-route';

const localizedText = (value: unknown): string | undefined => typeof value === 'string' && value.trim() ? value.trim() : undefined;

export interface SkinMedia {
  readonly focusedSplashUrl?: string;
  readonly unfocusedSplashUrl?: string;
  readonly focusedAnimatedSplashUrl?: string;
  readonly unfocusedAnimatedSplashUrl?: string;
  readonly tileUrl?: string;
  readonly loadScreenUrl?: string;
}

export interface ChromaRecord {
  readonly id: number;
  readonly nameEn?: string;
  readonly nameZh?: string;
  readonly colors: readonly string[];
  readonly imageUrl?: string;
  readonly prestigeArchiveSlug?: string;
}

export interface SkinStage {
  readonly key: string;
  readonly id?: number;
  readonly parentSkinId: number;
  readonly nameEn: string;
  readonly nameZh?: string;
  readonly stageIndex?: number;
  readonly media: SkinMedia;
  readonly chromas: readonly ChromaRecord[];
}

export interface SkinRecord {
  readonly id: number;
  readonly slug: string;
  readonly championId: number;
  readonly nameEn: string;
  readonly nameZh?: string;
  readonly descriptionEn?: string;
  readonly descriptionZh?: string;
  readonly isBase: boolean;
  readonly isLegacy?: boolean;
  readonly isLegacyZh?: boolean;
  /** CommunityDragon exposes `isLegacy`, but not a reliable standalone limited flag. */
  readonly availability?: 'standard' | 'legacy' | 'limited' | 'unknown';
  readonly availabilityZh?: 'standard' | 'legacy' | 'limited' | 'unknown';
  readonly rarity?: string;
  readonly rarityZh?: string;
  /** China-server display tier. It is independent from the global `rarity` key. */
  readonly regionRarityIdZh?: number;
  readonly rarityLabelZh?: string;
  readonly rarityGemUrl?: string;
  readonly rarityGemUrlZh?: string;
  readonly skinlineIds: readonly number[];
  readonly universeIds: readonly number[];
  readonly media: SkinMedia;
  readonly chromas: readonly ChromaRecord[];
  readonly stages: readonly SkinStage[];
  readonly parentSkinId?: number;
}

export interface ChampionRecord {
  readonly id: number;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameZh?: string;
  readonly titleEn?: string;
  readonly titleZh?: string;
  readonly bioEn?: string;
  readonly bioZh?: string;
  readonly portraitUrl?: string;
  readonly skinIds: readonly number[];
  readonly stageRefs: readonly SkinStage[];
}

export interface SkinlineRecord {
  readonly id: number;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameZh?: string;
  readonly descriptionEn?: string;
  readonly descriptionZh?: string;
  readonly universeIds: readonly number[];
}

export interface UniverseRecord {
  readonly id: number;
  readonly slug: string;
  readonly nameEn: string;
  readonly nameZh?: string;
  readonly descriptionEn?: string;
  readonly descriptionZh?: string;
  readonly imageUrl?: string;
  readonly skinlineIds: readonly number[];
}

export interface PbeGraph {
  readonly source: { readonly version: 'pbe'; readonly fetchedAt: string };
  readonly champions: readonly ChampionRecord[];
  readonly skins: readonly SkinRecord[];
  readonly skinlines: readonly SkinlineRecord[];
  readonly universes: readonly UniverseRecord[];
  readonly championsById: ReadonlyMap<number, ChampionRecord>;
  readonly skinsById: ReadonlyMap<number, SkinRecord>;
  readonly skinlinesById: ReadonlyMap<number, SkinlineRecord>;
  readonly universesById: ReadonlyMap<number, UniverseRecord>;
  readonly skinsByChampionId: ReadonlyMap<number, readonly SkinRecord[]>;
  readonly skinsBySkinlineId: ReadonlyMap<number, readonly SkinRecord[]>;
  readonly skinsByUniverseId: ReadonlyMap<number, readonly SkinRecord[]>;
}

export interface PbeRawSnapshot {
  readonly defaultSummary: unknown;
  readonly zhSummary?: unknown;
  readonly defaultSkins: unknown;
  readonly zhSkins?: unknown;
  readonly defaultSkinlines: unknown;
  readonly zhSkinlines?: unknown;
  readonly defaultUniverses: unknown;
  readonly zhUniverses?: unknown;
  readonly championDetails: readonly { id: number; default: unknown; zh?: unknown }[];
}

export function entitySlug(name: string, id: number): string {
  return `${championSlug(name)}-${id}`;
}

function assertUniqueIds(values: Iterable<{ id?: unknown }>, label: string): void {
  const seen = new Set<number>();
  for (const value of values) {
    const id = Number(value.id);
    if (!Number.isInteger(id) || id <= 0) continue;
    if (seen.has(id)) throw new Error(`Duplicate ${label} id: ${id}`);
    seen.add(id);
  }
}

function asRecordMap(input: unknown): Map<number, Record<string, any>> {
  const values = Array.isArray(input)
    ? input.filter((v) => v && typeof v === 'object')
    : input && typeof input === 'object' ? Object.values(input as Record<string, any>) : undefined;
  if (values) {
    assertUniqueIds(values, 'CommunityDragon entity');
    return new Map(values.map((v: any) => [Number(v.id), v]));
  }
  throw new Error('CommunityDragon payload must be an array or object map');
}

function uniqueIds(values: readonly number[]): number[] {
  return [...new Set(values.filter((id) => Number.isInteger(id) && id > 0))];
}

function safeMedia(raw: any): SkinMedia {
  const asset = (path: unknown) => typeof path === 'string' && path.trim() ? communityDragonAssetUrl(path) : undefined;
  return {
    focusedSplashUrl: asset(raw?.splashPath),
    unfocusedSplashUrl: asset(raw?.uncenteredSplashPath),
    focusedAnimatedSplashUrl: asset(raw?.splashVideoPath),
    unfocusedAnimatedSplashUrl: asset(raw?.collectionSplashVideoPath),
    tileUrl: asset(raw?.tilePath),
    loadScreenUrl: asset(raw?.loadScreenPath),
  };
}

const RARITY_GEM_FILES: Readonly<Record<string, string>> = {
  kUltimate: 'ultimate.png',
  kMythic: 'mythic.png',
  kLegendary: 'legendary.png',
  kEpic: 'epic.png',
  kExalted: 'exalted.png',
  kTranscendent: 'transcendent.png',
};

const CHINA_REGION_RARITIES: Readonly<Record<number, { label: string; filename: string }>> = {
  4: { label: '史诗', filename: 'cn-gem-4.png' },
  5: { label: '传说', filename: 'cn-gem-5.png' },
  6: { label: '未知', filename: 'cn-gem-6.png' },
  7: { label: '限定', filename: 'cn-gem-7.png' },
  8: { label: '神话', filename: 'cn-gem-8.png' },
  9: { label: '终极', filename: 'cn-gem-9.png' },
  10: { label: '圣堂', filename: 'cn-gem-10.png' },
  11: { label: '卓越', filename: 'cn-gem-11.png' },
};

function regionRarityId(primary: unknown, fallback: unknown): number | undefined {
  const candidate = Number.isInteger(primary) ? Number(primary) : Number.isInteger(fallback) ? Number(fallback) : undefined;
  return candidate && candidate > 0 ? candidate : undefined;
}

function chinaRegionRarity(id: number | undefined): { label: string; imageUrl: string } | undefined {
  const rarity = id ? CHINA_REGION_RARITIES[id] : undefined;
  return rarity ? {
    label: rarity.label,
    imageUrl: communityDragonAssetUrl(`/lol-game-data/assets/v1/rarity-gem-icons/${rarity.filename}`),
  } : undefined;
}

function rarityGemUrl(raw: any, rarity: string | undefined): string | undefined {
  const explicitPath = localizedText(raw?.rarityGemPath);
  if (explicitPath) return communityDragonAssetUrl(explicitPath);
  const filename = rarity ? RARITY_GEM_FILES[rarity] : undefined;
  return filename ? communityDragonAssetUrl(`/lol-game-data/assets/v1/rarity-gem-icons/${filename}`) : undefined;
}

function preferredBoolean(primary: unknown, fallback: unknown): boolean | undefined {
  if (typeof primary === 'boolean') return primary;
  if (typeof fallback === 'boolean') return fallback;
  return undefined;
}

function availability(primary: any, fallback: any): SkinRecord['availability'] {
  if (primary?.availability === 'limited' || fallback?.availability === 'limited') return 'limited';
  if (primary?.isLegacy === true || fallback?.isLegacy === true) return 'legacy';
  if (primary?.isLegacy === false || fallback?.isLegacy === false) return 'standard';
  return undefined;
}

function chromas(raw: any, localeMap: Map<number, any>, archives: Map<number, string>): ChromaRecord[] {
  if (!Array.isArray(raw?.chromas)) return [];
  return raw.chromas.filter((c: any) => Number.isInteger(c?.id) && c.id > 0).map((c: any) => ({
    id: c.id,
    nameEn: localizedText(c.name),
    nameZh: localizedText(localeMap.get(c.id)?.name),
    colors: Array.isArray(c.colors) ? c.colors.filter((v: unknown): v is string => typeof v === 'string') : [],
    imageUrl: typeof c.chromaPath === 'string' && c.chromaPath ? communityDragonAssetUrl(c.chromaPath) : undefined,
    prestigeArchiveSlug: archives.get(c.id),
  }));
}

function normalizeSkin(raw: any, zhRaw: any, canonicalRaw: any, canonicalZhRaw: any, championId: number, archives: Map<number, string>, parentSkinId?: number): SkinRecord {
  const id = Number(raw.id);
  const nameEn = localizedText(raw.name) ?? localizedText(canonicalRaw?.name) ?? `Skin ${id}`;
  const skinlineIds = uniqueIds(Array.isArray(raw.skinLines) ? raw.skinLines.map((v: any) => Number(v?.id ?? v)) : []);
  const slug = entitySlug(nameEn, id);
  const localeMap = new Map<number, any>((Array.isArray(zhRaw?.chromas) ? zhRaw.chromas : []).filter((c: any) => c?.id).map((c: any) => [Number(c.id), c]));
  const tiers = Array.isArray(raw.questSkinInfo?.tiers) ? raw.questSkinInfo.tiers : [];
  const stages: SkinStage[] = tiers.map((tier: any, index: number) => {
    const tierId = Number.isInteger(tier?.id) && tier.id > 0 ? tier.id : undefined;
    const zhTier = Array.isArray(zhRaw?.questSkinInfo?.tiers) ? zhRaw.questSkinInfo.tiers.find((v: any) => v?.id === tierId || v?.stage === tier?.stage) : undefined;
    return {
      key: tierId ? `stage-${tierId}` : `stage-${index + 1}`,
      id: tierId,
      parentSkinId: id,
      nameEn: localizedText(tier?.name) ?? `${nameEn} · Stage ${tier?.stage ?? index + 1}`,
      nameZh: localizedText(zhTier?.name),
      stageIndex: Number.isInteger(tier?.stage) ? tier.stage : index + 1,
      media: safeMedia(tier),
      chromas: chromas(tier, new Map<number, any>(), archives),
    };
  });
  const regionRarityIdZh = regionRarityId(canonicalZhRaw?.regionRarityId, zhRaw?.regionRarityId);
  const chinaRarity = chinaRegionRarity(regionRarityIdZh);
  return {
    id,
    slug,
    championId,
    nameEn,
    nameZh: localizedText(zhRaw?.name) ?? localizedText(canonicalZhRaw?.name),
    descriptionEn: localizedText(raw.description) ?? localizedText(canonicalRaw?.description),
    descriptionZh: localizedText(zhRaw?.description) ?? localizedText(canonicalZhRaw?.description),
    isBase: raw.isBase === true || canonicalRaw?.isBase === true,
    isLegacy: preferredBoolean(raw.isLegacy, canonicalRaw?.isLegacy),
    isLegacyZh: preferredBoolean(zhRaw?.isLegacy, canonicalZhRaw?.isLegacy),
    availability: availability(raw, canonicalRaw),
    availabilityZh: availability(zhRaw, canonicalZhRaw),
    rarity: localizedText(raw.rarity) ?? localizedText(canonicalRaw?.rarity),
    rarityZh: localizedText(zhRaw?.rarity) ?? localizedText(canonicalZhRaw?.rarity),
    regionRarityIdZh,
    rarityLabelZh: chinaRarity?.label,
    rarityGemUrl: rarityGemUrl(canonicalRaw ?? raw, localizedText(raw.rarity) ?? localizedText(canonicalRaw?.rarity)),
    rarityGemUrlZh: chinaRarity?.imageUrl ?? rarityGemUrl(canonicalZhRaw ?? zhRaw, localizedText(zhRaw?.rarity) ?? localizedText(canonicalZhRaw?.rarity)),
    skinlineIds,
    universeIds: [],
    media: safeMedia(raw),
    chromas: chromas(raw, localeMap, archives),
    stages,
    parentSkinId,
  };
}

function localizedMap(input: unknown): Map<number, any> {
  return asRecordMap(input);
}

export function buildPbeGraph(snapshot: PbeRawSnapshot): PbeGraph {
  const defaultSkinMap = asRecordMap(snapshot.defaultSkins);
  const zhSkinMap = asRecordMap(snapshot.zhSkins ?? []);
  const archives = new Map(catalog.flatMap((entry) => [[entry.skinId, entry.slug] as const]));
  const defaultSummary = z.array(z.object({ id: z.number().int(), name: z.string().trim().min(1), title: z.string().optional(), shortBio: z.string().optional(), squarePortraitPath: z.string().optional() })).parse(snapshot.defaultSummary);
  assertUniqueIds(defaultSummary, 'champion summary');
  const zhSummary = z.array(z.object({ id: z.number().int(), name: z.string().optional(), title: z.string().optional(), description: z.string().optional(), shortBio: z.string().optional(), squarePortraitPath: z.string().optional() })).parse(snapshot.zhSummary ?? []);
  assertUniqueIds(zhSummary, 'localized champion summary');
  const zhSummaryMap = new Map(zhSummary.map((v) => [v.id, v]));
  assertUniqueIds(snapshot.championDetails, 'champion detail');
  const details = new Map(snapshot.championDetails.map((entry) => [entry.id, entry]));
  const championRecords: ChampionRecord[] = [];
  const skinsById = new Map<number, SkinRecord>();
  const usedChampionSlugs = new Set<string>();
  for (const summary of defaultSummary.filter((v) => v.id > 0)) {
    const detail = details.get(summary.id)?.default as any;
    if (!detail) continue;
    const zhDetail = details.get(summary.id)?.zh as any;
    const enSkins = Array.isArray(detail.skins) ? detail.skins : [];
    const zhSkins = new Map<number, any>((Array.isArray(zhDetail?.skins) ? zhDetail.skins : []).filter((v: any) => v?.id).map((v: any) => [Number(v.id), v]));
    const ids: number[] = [];
    const stageRefs: SkinStage[] = [];
    const championSkinIds = new Set<number>();
    const championStageIds = new Set<number>();
    for (const raw of enSkins) {
      const rawId = Number(raw?.id);
      if (Number.isInteger(rawId) && rawId > 0) {
        if (championSkinIds.has(rawId)) throw new Error(`Duplicate skin id: ${rawId}`);
        championSkinIds.add(rawId);
      }
    }
    for (const raw of enSkins) {
      const skinId = Number(raw.id);
      const skin = normalizeSkin(raw, zhSkins.get(skinId), defaultSkinMap.get(skinId), zhSkinMap.get(skinId), summary.id, archives);
      const existingSkin = skinsById.get(skin.id);
      if (existingSkin && existingSkin.championId !== skin.championId) throw new Error(`Duplicate skin id: ${skin.id}`);
      if (!existingSkin) skinsById.set(skin.id, skin);
      ids.push(skin.id);
      for (const stage of skin.stages) {
        stageRefs.push(stage);
        if (stage.id && stage.id !== skin.id && !skinsById.has(stage.id)) {
          if (championSkinIds.has(stage.id) || championStageIds.has(stage.id)) throw new Error(`Duplicate skin stage id: ${stage.id}`);
          championStageIds.add(stage.id);
          skinsById.set(stage.id, {
            ...skin,
            id: stage.id,
            slug: entitySlug(stage.nameEn, stage.id),
            nameEn: stage.nameEn,
            nameZh: stage.nameZh,
            media: stage.media,
            chromas: stage.chromas,
            stages: [],
            parentSkinId: skin.id,
            isBase: false,
          });
          ids.push(stage.id);
        } else if (stage.id && stage.id !== skin.id && skinsById.get(stage.id)?.championId !== skin.championId) {
          throw new Error(`Duplicate skin stage id: ${stage.id}`);
        } else if (stage.id && stage.id !== skin.id) {
          throw new Error(`Duplicate skin stage id: ${stage.id}`);
        }
      }
    }
    const baseSlug = championSlug(summary.name);
    const slug = usedChampionSlugs.has(baseSlug) ? `${baseSlug}-${summary.id}` : baseSlug;
    usedChampionSlugs.add(slug);
    championRecords.push({
      id: summary.id,
      slug,
      nameEn: summary.name,
      nameZh: localizedText(zhDetail?.title ?? zhSummaryMap.get(summary.id)?.description ?? zhSummaryMap.get(summary.id)?.title),
      titleEn: localizedText(detail.title ?? summary.title),
      titleZh: localizedText(zhDetail?.name ?? zhSummaryMap.get(summary.id)?.name),
      bioEn: localizedText(detail.shortBio ?? summary.shortBio),
      bioZh: localizedText(zhDetail?.shortBio ?? zhSummaryMap.get(summary.id)?.shortBio),
      portraitUrl: typeof detail.squarePortraitPath === 'string' ? communityDragonAssetUrl(detail.squarePortraitPath) : undefined,
      skinIds: uniqueIds(ids),
      stageRefs,
    });
  }
  const skinlineRaw = asRecordMap(snapshot.defaultSkinlines);
  const skinlineZh = localizedMap(snapshot.zhSkinlines ?? []);
  const universeRaw = asRecordMap(snapshot.defaultUniverses);
  const universeZh = localizedMap(snapshot.zhUniverses ?? []);
  const universeBySkinline = new Map<number, number[]>();
  for (const universe of universeRaw.values()) for (const skinlineId of uniqueIds(Array.isArray(universe.skinSets) ? universe.skinSets.map(Number) : [])) universeBySkinline.set(skinlineId, [...(universeBySkinline.get(skinlineId) ?? []), Number(universe.id)]);
  const skinlines: SkinlineRecord[] = [...skinlineRaw.values()].filter((v) => Number(v.id) > 0 && localizedText(v.name)).map((v) => ({
    id: Number(v.id), slug: entitySlug(v.name, Number(v.id)), nameEn: v.name, nameZh: localizedText(skinlineZh.get(Number(v.id))?.name), descriptionEn: localizedText(v.description), descriptionZh: localizedText(skinlineZh.get(Number(v.id))?.description), universeIds: universeBySkinline.get(Number(v.id)) ?? [],
  }));
  const universes: UniverseRecord[] = [...universeRaw.values()].filter((v) => Number(v.id) > 0 && localizedText(v.name)).map((v) => ({
    id: Number(v.id), slug: entitySlug(v.name, Number(v.id)), nameEn: v.name, nameZh: localizedText(universeZh.get(Number(v.id))?.name), descriptionEn: localizedText(v.description), descriptionZh: localizedText(universeZh.get(Number(v.id))?.description), imageUrl: typeof v.imagePath === 'string' && v.imagePath ? communityDragonAssetUrl(v.imagePath) : undefined, skinlineIds: uniqueIds(Array.isArray(v.skinSets) ? v.skinSets.map(Number) : []),
  }));
  const skinlineIds = new Set(skinlines.map((v) => v.id));
  for (const skin of skinsById.values()) {
    const universesForSkin = uniqueIds(skin.skinlineIds.flatMap((id) => universeBySkinline.get(id) ?? []));
    Object.assign(skin, { universeIds: universesForSkin.filter((id) => universeRaw.has(id)).filter(() => true) });
    Object.assign(skin, { skinlineIds: skin.skinlineIds.filter((id) => skinlineIds.has(id)) });
  }
  const skins = [...skinsById.values()].sort((a, b) => a.id - b.id);
  const byId = <T extends { id: number }>(items: readonly T[]) => new Map(items.map((item) => [item.id, item]));
  const championsById = byId(championRecords); const skinsByIdFinal = byId(skins); const skinlinesById = byId(skinlines); const universesById = byId(universes);
  const skinsByChampionId = new Map<number, SkinRecord[]>(); const skinsBySkinlineId = new Map<number, SkinRecord[]>(); const skinsByUniverseId = new Map<number, SkinRecord[]>();
  for (const skin of skins) { (skinsByChampionId.get(skin.championId) ?? (skinsByChampionId.set(skin.championId, []), skinsByChampionId.get(skin.championId)!)).push(skin); for (const id of skin.skinlineIds) (skinsBySkinlineId.get(id) ?? (skinsBySkinlineId.set(id, []), skinsBySkinlineId.get(id)!)).push(skin); for (const id of skin.universeIds) (skinsByUniverseId.get(id) ?? (skinsByUniverseId.set(id, []), skinsByUniverseId.get(id)!)).push(skin); }
  return { source: { version: 'pbe', fetchedAt: new Date().toISOString() }, champions: championRecords.sort((a, b) => a.nameEn.localeCompare(b.nameEn)), skins, skinlines: skinlines.sort((a, b) => a.nameEn.localeCompare(b.nameEn)), universes: universes.sort((a, b) => a.nameEn.localeCompare(b.nameEn)), championsById, skinsById: skinsByIdFinal, skinlinesById, universesById, skinsByChampionId, skinsBySkinlineId, skinsByUniverseId };
}
