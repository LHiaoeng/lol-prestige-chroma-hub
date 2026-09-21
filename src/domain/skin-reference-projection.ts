import type {
  RuntimeChroma,
  RuntimeHistoricalArtwork,
  RuntimeMedia,
  RuntimeRarity,
  RuntimeSkinSummary,
  RuntimeSkin,
  RuntimeSkinStage,
  RuntimeStageSkin,
  RuntimeSkinEntity,
} from "./communitydragon-runtime";

export interface RuntimeSkinTarget {
  readonly championId: number;
  readonly skinId: number;
  readonly stageId?: number;
}

export interface RuntimeSkinReferenceItem {
  readonly kind: "skin" | "stage";
  /** The top-level skin ID used by the existing skin detail route. */
  readonly id: number;
  readonly championId: number;
  readonly skinId: number;
  readonly stageId?: number;
  readonly stageIndex?: number;
  readonly target: RuntimeSkinTarget;
  readonly stableKey: string;
  readonly name?: string;
  readonly description?: string;
  readonly isBase: boolean;
  readonly isLegacy?: boolean;
  readonly rarity?: RuntimeRarity;
  readonly skinlineIds: readonly number[];
  readonly universeIds: readonly number[];
  readonly media: RuntimeMedia;
  readonly historicalArt: readonly RuntimeHistoricalArtwork[];
  readonly chromas: readonly RuntimeChroma[];
  readonly thumbnailUrl?: string;
}

export type RuntimeSkinReferenceSort = "release" | "rarity";

const defaultRarityRank: Readonly<Record<string, number>> = {
  kEpic: 1,
  kLegendary: 2,
  kMythic: 3,
  kUltimate: 4,
  kTranscendent: 5,
  kExalted: 6,
};

const regionRarityRank: Readonly<Record<number, number>> = {
  1: 0,
  2: 0,
  3: 0,
  4: 1,
  5: 2,
  6: 0,
  7: 0,
  8: 3,
  9: 4,
  10: 5,
  11: 6,
};

function stableKey(target: RuntimeSkinTarget): string {
  return target.stageId === undefined
    ? `${target.championId}:${target.skinId}`
    : `${target.championId}:${target.skinId}:stage:${target.stageId}`;
}

function stageSortValue(stageIndex: number | undefined): number {
  return stageIndex ?? Number.MAX_SAFE_INTEGER;
}

function stageRarity(
  skin: RuntimeSkinEntity,
  stage: RuntimeSkinStage,
): RuntimeRarity | undefined {
  return stage.raritySpecified === true || stage.rarity !== undefined
    ? stage.rarity
    : skin.rarity;
}

function compareReferenceItems(
  left: RuntimeSkinReferenceItem,
  right: RuntimeSkinReferenceItem,
): number {
  if (left.skinId !== right.skinId) return left.skinId - right.skinId;
  if (left.kind !== right.kind) return left.kind === "skin" ? -1 : 1;
  return (
    stageSortValue(left.stageIndex) - stageSortValue(right.stageIndex) ||
    (left.stageId ?? 0) - (right.stageId ?? 0) ||
    (left.name ?? "").localeCompare(right.name ?? "")
  );
}

function skinItem(skin: RuntimeSkinEntity): RuntimeSkinReferenceItem {
  const target = { championId: skin.championId, skinId: skin.id };
  return {
    kind: "skin",
    id: skin.id,
    championId: skin.championId,
    skinId: skin.id,
    target,
    stableKey: stableKey(target),
    name: skin.name,
    description: skin.description,
    isBase: skin.isBase,
    isLegacy: skin.isLegacy,
    rarity: skin.rarity,
    skinlineIds: skin.skinlineIds,
    universeIds: skin.universeIds ?? [],
    media: skin.media,
    historicalArt: skin.historicalArt ?? [],
    chromas: skin.chromas,
    thumbnailUrl: skin.media.tileUrl,
  };
}

function stageItem(
  skin: RuntimeSkinEntity,
  stage: RuntimeSkinEntity["stages"][number],
): RuntimeSkinReferenceItem | undefined {
  if (stage.id === undefined) return undefined;
  const target = {
    championId: skin.championId,
    skinId: skin.id,
    stageId: stage.id,
  };
  return {
    kind: "stage",
    id: skin.id,
    championId: skin.championId,
    skinId: skin.id,
    stageId: stage.id,
    stageIndex: stage.stageIndex,
    target,
    stableKey: stableKey(target),
    name: stage.name,
    description: stage.description ?? skin.description,
    isBase: skin.isBase,
    isLegacy: skin.isLegacy,
    rarity: stageRarity(skin, stage),
    skinlineIds: stage.skinlineIds ?? skin.skinlineIds,
    universeIds: stage.universeIds ?? skin.universeIds ?? [],
    media: stage.media,
    historicalArt: stage.historicalArt ?? [],
    chromas: stage.chromas,
    thumbnailUrl: stage.media.tileUrl,
  };
}

function deduplicateReferenceItems(
  items: readonly RuntimeSkinReferenceItem[],
): readonly RuntimeSkinReferenceItem[] {
  const unique = new Map<string, RuntimeSkinReferenceItem>();
  for (const item of items) {
    if (!unique.has(item.stableKey)) unique.set(item.stableKey, item);
  }
  return [...unique.values()];
}

function championSkinIdentity(item: RuntimeSkinReferenceItem): string {
  if (item.kind === "stage")
    return `stage:${item.skinId}:${item.stageId ?? item.skinId}`;
  return `skin:${item.skinId}`;
}

function deduplicateChampionSkinItems(
  items: readonly RuntimeSkinReferenceItem[],
): readonly RuntimeSkinReferenceItem[] {
  // Stage IDs replace a colliding top-level ID, while the parent skin ID
  // keeps equal stage IDs from different owners as separate entries.
  const stageIds = new Set(
    items.flatMap((item) =>
      item.kind === "stage" && item.stageId !== undefined
        ? [item.stageId]
        : [],
    ),
  );
  const unique = new Map<string, RuntimeSkinReferenceItem>();
  for (const item of items) {
    if (item.kind === "skin" && stageIds.has(item.skinId)) continue;
    const identity = championSkinIdentity(item);
    if (!unique.has(identity)) unique.set(identity, item);
  }
  return [...unique.values()];
}

function championSkinEntity(
  championId: number,
  skin: RuntimeSkinSummary,
): RuntimeSkin {
  return {
    ...skin,
    kind: "skin",
    championId,
    chromas: [],
  };
}

export function projectRuntimeSkinTarget(
  skin: RuntimeSkin,
  stageId?: number,
): RuntimeSkin | RuntimeStageSkin | undefined {
  if (stageId === undefined) return skin;
  const stage = skin.stages.find((candidate) => candidate.id === stageId);
  if (!stage || stage.id === undefined) return undefined;
  const resolvedStageId = stage.id;
  return {
    ...skin,
    stageId: resolvedStageId,
    stageIndex: stage.stageIndex,
    name: stage.name,
    description: stage.description ?? skin.description,
    rarity: stageRarity(skin, stage),
    skinlineIds: stage.skinlineIds ?? skin.skinlineIds,
    universeIds: stage.universeIds ?? skin.universeIds,
    media: stage.media,
    chromaImageUrl: stage.chromaImageUrl,
    historicalArt: stage.historicalArt,
    chromas: stage.chromas,
  };
}

/**
 * Flatten one champion response's skin and valid stage records into the
 * shared page-facing item shape. Stage facts never borrow another stage's
 * media or chromas; only the explicitly allowed owner fields are inherited.
 */
export function projectSkinReferenceItems(
  skin: RuntimeSkinEntity,
): readonly RuntimeSkinReferenceItem[] {
  const items = [
    skinItem(skin),
    ...skin.stages.flatMap((stage) => {
      const item = stageItem(skin, stage);
      return item ? [item] : [];
    }),
  ];
  return [...deduplicateReferenceItems(items)].sort(compareReferenceItems);
}

/**
 * Project all of a champion response's skins into the shared page-facing
 * records. Champion responses expose skin summaries, so the champion ID is
 * supplied by the response identity rather than inferred from names or IDs.
 */
export function projectChampionSkinReferenceItems(
  championId: number,
  skins: readonly RuntimeSkinSummary[],
): readonly RuntimeSkinReferenceItem[] {
  const items = skins
    .flatMap((skin) => projectSkinReferenceItems(championSkinEntity(championId, skin)));
  return [...deduplicateChampionSkinItems(items)].sort(compareReferenceItems);
}

/**
 * Project the champion page's skin grid from top-level skins and their valid
 * stages. Stage IDs are independent list identities and replace a top-level
 * item when both records use the same ID.
 */
export function projectChampionSkinListItems(
  championId: number,
  skins: readonly RuntimeSkinSummary[],
): readonly RuntimeSkinReferenceItem[] {
  const items = skins
    .filter((skin) => !skin.isBase)
    .flatMap((skin) => projectSkinReferenceItems(championSkinEntity(championId, skin)));
  return [...deduplicateChampionSkinItems(items)].sort(compareReferenceItems);
}

function rarityRank(item: RuntimeSkinReferenceItem): number {
  if (item.rarity?.key) return defaultRarityRank[item.rarity.key] ?? 0;
  if (item.rarity?.id !== undefined)
    return regionRarityRank[item.rarity.id] ?? 0;
  return 0;
}

/**
 * Apply the champion detail's reference-project sort choices without changing
 * the stable release order used by the default view.
 */
export function sortSkinReferenceItems(
  items: readonly RuntimeSkinReferenceItem[],
  sort: RuntimeSkinReferenceSort,
): readonly RuntimeSkinReferenceItem[] {
  if (sort === "release") return items;
  return [...items].sort(
    (left, right) =>
      rarityRank(right) - rarityRank(left) || compareReferenceItems(left, right),
  );
}

export function findSkinReferenceItem(
  skin: RuntimeSkinEntity,
  target: RuntimeSkinTarget,
): RuntimeSkinReferenceItem | undefined {
  if (
    target.championId !== skin.championId ||
    target.skinId !== skin.id
  )
    return undefined;
  return projectSkinReferenceItems(skin).find(
    (item) => item.stableKey === stableKey(target),
  );
}

/**
 * Select the top-level skins and valid stages that explicitly belong to one
 * skinline. The stage projection inherits the owner's skinline IDs only when
 * the source omitted stage-specific relationship data.
 */
export function projectSkinlineReferenceItems(
  skins: readonly RuntimeSkinEntity[],
  skinlineId: number,
): readonly RuntimeSkinReferenceItem[] {
  const items = skins.flatMap((skin) =>
    projectSkinReferenceItems(skin).filter(
      (item) => !item.isBase && item.skinlineIds.includes(skinlineId),
    ),
  );
  return [...deduplicateReferenceItems(items)].sort(compareReferenceItems);
}
