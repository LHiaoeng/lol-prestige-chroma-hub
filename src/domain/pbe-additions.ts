import type {
  RuntimeChampionSummary,
  RuntimeEmote,
  RuntimeNexusFinisher,
  RuntimeSkin,
  RuntimeSkinBorder,
  RuntimeSkinline,
  RuntimeSummonerIcon,
  RuntimeUniverse,
  RuntimeVersionMetadata,
  RuntimeWardSkin,
} from "./communitydragon-runtime";
import {
  compareRuntimeSkinReferenceItems,
  projectSkinReferenceCollectionItems,
  type RuntimeSkinReferenceItem,
} from "./skin-reference-projection";

export interface RuntimePbeComparisonCollection {
  readonly champions: readonly RuntimeChampionSummary[];
  readonly skins: readonly RuntimeSkin[];
  readonly skinlines: readonly RuntimeSkinline[];
  readonly universes: readonly RuntimeUniverse[];
  readonly icons: readonly RuntimeSummonerIcon[];
  readonly emotes: readonly RuntimeEmote[];
  readonly borders: readonly RuntimeSkinBorder[];
  readonly wards: readonly RuntimeWardSkin[];
  readonly finishers: readonly RuntimeNexusFinisher[];
  readonly version: RuntimeVersionMetadata;
}

export interface RuntimeEmoteTag {
  readonly id: number;
  readonly name?: string;
}

export interface RuntimePbeEmote {
  readonly kind: "emote";
  readonly id: number;
  readonly name?: string;
  readonly iconUrl?: string;
  readonly tags: readonly RuntimeEmoteTag[];
}

export interface RuntimePbeChroma {
  readonly kind: "chroma";
  readonly id: number;
  readonly name?: string;
  readonly imageUrl?: string;
  readonly colors?: readonly string[];
  readonly skinId: number;
  readonly championId: number;
  readonly skinName?: string;
  readonly skinlineIds: readonly number[];
  readonly universeIds: readonly number[];
}

export interface RuntimePbeAdditions {
  readonly versions: {
    readonly pbe?: string;
    readonly latest?: string;
  };
  readonly total: number;
  readonly counts: {
    readonly champions: number;
    readonly skins: number;
    readonly skinlines: number;
    readonly universes: number;
    readonly icons: number;
    readonly emotes: number;
    readonly chromas: number;
    readonly borders: number;
    readonly wards: number;
    readonly finishers: number;
  };
  readonly champions: readonly RuntimeChampionSummary[];
  readonly skins: readonly RuntimeSkinReferenceItem[];
  readonly skinlines: readonly RuntimeSkinline[];
  readonly universes: readonly RuntimeUniverse[];
  readonly icons: readonly RuntimeSummonerIcon[];
  readonly emotes: readonly RuntimePbeEmote[];
  readonly chromas: readonly RuntimePbeChroma[];
  readonly borders: readonly RuntimeSkinBorder[];
  readonly wards: readonly RuntimeWardSkin[];
  readonly finishers: readonly RuntimeNexusFinisher[];
  readonly pbeSkinlines: readonly RuntimeSkinline[];
}

export interface RuntimePbeComparisonInput {
  readonly pbe: RuntimePbeComparisonCollection;
  readonly latest: RuntimePbeComparisonCollection;
}

export interface RuntimePbeUniverseDiffItem {
  readonly universe: RuntimeUniverse;
  readonly skinlines: readonly {
    readonly id: number;
    readonly name: string;
  }[];
}

export type RuntimePbeModuleItemsByKind = {
  champions: readonly RuntimeChampionSummary[];
  skins: readonly RuntimeSkinReferenceItem[];
  skinlines: readonly RuntimeSkinline[];
  universes: readonly RuntimePbeUniverseDiffItem[];
  icons: readonly RuntimeSummonerIcon[];
  emotes: readonly RuntimePbeEmote[];
  chromas: readonly RuntimePbeChroma[];
  borders: readonly RuntimeSkinBorder[];
  wards: readonly RuntimeWardSkin[];
  finishers: readonly RuntimeNexusFinisher[];
};

export type RuntimePbeModuleKind = keyof RuntimePbeModuleItemsByKind;

export type RuntimePbeModuleItems = {
  [K in RuntimePbeModuleKind]: {
    readonly kind: K;
    readonly items: RuntimePbeModuleItemsByKind[K];
  };
}[RuntimePbeModuleKind];

export interface RuntimePbeModule {
  readonly kind: RuntimePbeModuleKind;
  load(): Promise<RuntimePbeModuleItems>;
}

export interface RuntimePbeAdditionsStream {
  /** Aborted when the page navigation supersedes this comparison. */
  readonly signal: AbortSignal;
  readonly modules: readonly RuntimePbeModule[];
}

function additionsById<T extends { readonly id: number; readonly name?: string }>(
  pbe: readonly T[],
  latest: readonly T[],
): readonly T[] {
  const latestIds = new Set(latest.map((item) => item.id));
  return pbe
    .filter((item) => !latestIds.has(item.id))
    .slice()
    .sort((left, right) =>
      left.id - right.id || (left.name ?? "").localeCompare(right.name ?? ""),
    );
}

export function projectPbeIdDiff<
  T extends { readonly id: number; readonly name?: string },
>(pbe: readonly T[], latest: readonly T[]): readonly T[] {
  return additionsById(pbe, latest);
}

export function projectPbeChampionNames(
  champions: readonly RuntimeChampionSummary[],
): ReadonlyMap<number, string> {
  return new Map(champions.map((champion) => [champion.id, champion.name]));
}

export interface RuntimePbeSkinDiff {
  readonly items: readonly RuntimeSkinReferenceItem[];
  /** Raw new-skin count before stage expansion. */
  readonly count: number;
}

interface PbeGrouped {
  readonly skinId: number;
  readonly championId: number;
  readonly skinlineIds: readonly number[];
  readonly universeIds: readonly number[];
}

/** Universe IDs keyed by the skinline IDs listed in the universe records. */
export type RuntimePbeSkinlineUniverseIndex = ReadonlyMap<
  number,
  readonly number[]
>;

/**
 * Skin records are the primary universe source, but new PBE entries often omit
 * that relation, so the skinline's universe is used as the fallback.
 */
function resolvePbeUniverseIds(
  item: Pick<PbeGrouped, "skinlineIds" | "universeIds">,
  skinlineUniverses: RuntimePbeSkinlineUniverseIndex,
): readonly number[] {
  if (item.universeIds.length > 0) return item.universeIds;
  const universeIds = new Set<number>();
  for (const skinlineId of item.skinlineIds) {
    for (const universeId of skinlineUniverses.get(skinlineId) ?? [])
      universeIds.add(universeId);
  }
  return [...universeIds];
}

/**
 * The smallest valid ID acts as the grouping key, so an item that belongs to
 * several relations stays next to its earliest declared family.
 */
function pbeGroupKey(ids: readonly number[]): number | undefined {
  const valid = ids.filter((id) => Number.isSafeInteger(id) && id > 0);
  return valid.length ? Math.min(...valid) : undefined;
}

/**
 * Group PBE additions by universe, skinline, and champion, ordering the
 * champion layer by champion ID and keeping the caller's ordering below it.
 * Items without a relation follow the grouped items at that layer.
 */
function sortPbeItemsByUniverseAndSkinline<T extends PbeGrouped>(
  items: readonly T[],
  compareWithinGroup: (left: T, right: T) => number,
): readonly T[] {
  const universeSkinIds = new Map<number, number>();
  const skinlineSkinIds = new Map<string, number>();
  const relationKey = (universe: number | undefined, skinline: number | undefined) =>
    `${universe ?? "-"}:${skinline ?? "-"}`;
  for (const item of items) {
    const universe = pbeGroupKey(item.universeIds);
    const skinline = pbeGroupKey(item.skinlineIds);
    if (universe !== undefined) {
      const current = universeSkinIds.get(universe);
      if (current === undefined || item.skinId < current)
        universeSkinIds.set(universe, item.skinId);
    }
    const key = relationKey(universe, skinline);
    const current = skinlineSkinIds.get(key);
    if (current === undefined || item.skinId < current)
      skinlineSkinIds.set(key, item.skinId);
  }
  const rank = (item: T): readonly number[] => {
    const universe = pbeGroupKey(item.universeIds);
    const skinline = pbeGroupKey(item.skinlineIds);
    return [
      universe === undefined ? 1 : 0,
      universe === undefined ? item.skinId : universeSkinIds.get(universe) ?? item.skinId,
      universe ?? 0,
      skinline === undefined ? 1 : 0,
      skinline === undefined
        ? item.skinId
        : skinlineSkinIds.get(relationKey(universe, skinline)) ?? item.skinId,
      skinline ?? 0,
      item.championId,
    ];
  };
  return [...items].sort((left, right) => {
    const leftRank = rank(left);
    const rightRank = rank(right);
    for (let index = 0; index < leftRank.length; index += 1) {
      const diff = leftRank[index] - rightRank[index];
      if (diff !== 0) return diff;
    }
    return compareWithinGroup(left, right);
  });
}

export function projectPbeSkinDiff(
  pbe: readonly RuntimeSkin[],
  latest: readonly RuntimeSkin[],
  championNames: ReadonlyMap<number, string>,
  skinlineUniverses: RuntimePbeSkinlineUniverseIndex = new Map(),
): RuntimePbeSkinDiff {
  const newSkins = additionsById(pbe, latest);
  const items = projectSkinReferenceCollectionItems(newSkins).map((item) => ({
    ...item,
    championName: championNames.get(item.championId),
    universeIds: resolvePbeUniverseIds(item, skinlineUniverses),
  }));
  return {
    items: sortPbeItemsByUniverseAndSkinline(
      items,
      compareRuntimeSkinReferenceItems,
    ),
    count: newSkins.length,
  };
}

export function projectPbeEmoteDiff(
  pbe: readonly RuntimeEmote[],
  latest: readonly RuntimeEmote[],
  championNames: ReadonlyMap<number, string>,
): readonly RuntimePbeEmote[] {
  return additionsById(pbe, latest).map((emote) => ({
    kind: "emote",
    id: emote.id,
    name: emote.name,
    iconUrl: emote.iconUrl,
    tags: emote.taggedChampionIds.map((id) => ({
      id,
      name: championNames.get(id),
    })),
  }));
}

export function projectPbeUniverseDiff(
  pbe: readonly RuntimeUniverse[],
  latest: readonly RuntimeUniverse[],
  pbeSkinlines: readonly RuntimeSkinline[],
): readonly RuntimePbeUniverseDiffItem[] {
  const skinlineNames = new Map(
    pbeSkinlines.map((skinline) => [skinline.id, skinline.name] as const),
  );
  return projectPbeIdDiff(pbe, latest).map((universe) => ({
    universe,
    skinlines: universe.skinlineIds
      .map((id) => {
        const name = skinlineNames.get(id);
        return name ? { id, name } : undefined;
      })
      .filter((item): item is { id: number; name: string } => item !== undefined),
  }));
}

export function projectPbeChromaDiff(
  pbe: readonly RuntimeSkin[],
  latest: readonly RuntimeSkin[],
  championNames: ReadonlyMap<number, string>,
  skinlineUniverses: RuntimePbeSkinlineUniverseIndex = new Map(),
): readonly RuntimePbeChroma[] {
  // Chromas live inside skins.json, so the diff runs on the chroma ID set
  // across channels and keeps the owner skin for links and labels.
  const latestChromaIds = new Set(
    latest.flatMap((skin) => skin.chromas.map((chroma) => chroma.id)),
  );
  const items = pbe
    .flatMap((skin) =>
      skin.chromas.map((chroma) => ({
        kind: "chroma" as const,
        id: chroma.id,
        name: chroma.name,
        imageUrl: chroma.imageUrl,
        colors: chroma.colors,
        skinId: skin.id,
        championId: skin.championId,
        skinName: skin.name ?? championNames.get(skin.championId),
        skinlineIds: skin.skinlineIds,
        universeIds: resolvePbeUniverseIds(
          { skinlineIds: skin.skinlineIds, universeIds: skin.universeIds ?? [] },
          skinlineUniverses,
        ),
      })),
    )
    .filter((chroma) => !latestChromaIds.has(chroma.id));
  return sortPbeItemsByUniverseAndSkinline(
    items,
    (left, right) =>
      left.id - right.id || (left.name ?? "").localeCompare(right.name ?? ""),
  );
}

export function projectPbeAdditions(
  input: RuntimePbeComparisonInput,
  skinlineUniverses: RuntimePbeSkinlineUniverseIndex = new Map(),
): RuntimePbeAdditions {
  const champions = projectPbeIdDiff(
    input.pbe.champions,
    input.latest.champions,
  );
  const championNames = projectPbeChampionNames(input.pbe.champions);
  const skinDiff = projectPbeSkinDiff(
    input.pbe.skins,
    input.latest.skins,
    championNames,
    skinlineUniverses,
  );
  const skinlines = projectPbeIdDiff(
    input.pbe.skinlines,
    input.latest.skinlines,
  );
  const universes = projectPbeIdDiff(
    input.pbe.universes,
    input.latest.universes,
  );
  const icons = projectPbeIdDiff(input.pbe.icons, input.latest.icons);
  const emotes = projectPbeEmoteDiff(
    input.pbe.emotes,
    input.latest.emotes,
    championNames,
  );
  const chromas = projectPbeChromaDiff(
    input.pbe.skins,
    input.latest.skins,
    championNames,
    skinlineUniverses,
  );
  const borders = projectPbeIdDiff(input.pbe.borders, input.latest.borders);
  const wards = projectPbeIdDiff(input.pbe.wards, input.latest.wards);
  const finishers = projectPbeIdDiff(
    input.pbe.finishers,
    input.latest.finishers,
  );
  const counts = {
    champions: champions.length,
    skins: skinDiff.count,
    skinlines: skinlines.length,
    universes: universes.length,
    icons: icons.length,
    emotes: emotes.length,
    chromas: chromas.length,
    borders: borders.length,
    wards: wards.length,
    finishers: finishers.length,
  } as const;

  return {
    versions: {
      pbe: input.pbe.version.version,
      latest: input.latest.version.version,
    },
    total:
      counts.champions +
      counts.skins +
      counts.skinlines +
      counts.universes +
      counts.icons +
      counts.emotes +
      counts.chromas +
      counts.borders +
      counts.wards +
      counts.finishers,
    counts,
    champions,
    skins: skinDiff.items,
    skinlines,
    universes,
    icons,
    emotes,
    chromas,
    borders,
    wards,
    finishers,
    pbeSkinlines: input.pbe.skinlines,
  };
}
