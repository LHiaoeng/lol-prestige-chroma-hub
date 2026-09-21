import type {
  RuntimeChroma,
  RuntimeHistoricalArtwork,
  RuntimeMedia,
  RuntimeRarity,
  RuntimeSkinSummary,
  RuntimeSkin,
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

function stableKey(target: RuntimeSkinTarget): string {
  return target.stageId === undefined
    ? `${target.championId}:${target.skinId}`
    : `${target.championId}:${target.skinId}:stage:${target.stageId}`;
}

function stageSortValue(stageIndex: number | undefined): number {
  return stageIndex ?? Number.MAX_SAFE_INTEGER;
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
    rarity: stage.rarity ?? skin.rarity,
    skinlineIds: stage.skinlineIds ?? skin.skinlineIds,
    universeIds: stage.universeIds ?? skin.universeIds ?? [],
    media: stage.media,
    historicalArt: stage.historicalArt ?? [],
    chromas: stage.chromas,
    thumbnailUrl: stage.media.tileUrl,
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
    rarity: stage.rarity ?? skin.rarity,
    skinlineIds: stage.skinlineIds ?? skin.skinlineIds,
    universeIds: stage.universeIds ?? skin.universeIds,
    media: stage.media,
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
  return items.sort(compareReferenceItems);
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
  return skins
    .flatMap((skin) =>
      projectSkinReferenceItems({
        ...skin,
        kind: "skin",
        championId,
        chromas: [],
      }),
    )
    .sort(compareReferenceItems);
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
