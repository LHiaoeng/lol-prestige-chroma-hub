import type {
  RuntimeChampionSummary,
  RuntimeSkin,
  RuntimeSkinline,
  RuntimeUniverse,
  RuntimeVersionMetadata,
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
  readonly version: RuntimeVersionMetadata;
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
  };
  readonly champions: readonly RuntimeChampionSummary[];
  readonly skins: readonly RuntimeSkinReferenceItem[];
  readonly skinlines: readonly RuntimeSkinline[];
  readonly universes: readonly RuntimeUniverse[];
  readonly pbeSkinlines: readonly RuntimeSkinline[];
}

export interface RuntimePbeComparisonInput {
  readonly pbe: RuntimePbeComparisonCollection;
  readonly latest: RuntimePbeComparisonCollection;
}

function additionsById<T extends { readonly id: number; readonly name: string }>(
  pbe: readonly T[],
  latest: readonly T[],
): readonly T[] {
  const latestIds = new Set(latest.map((item) => item.id));
  return pbe
    .filter((item) => !latestIds.has(item.id))
    .slice()
    .sort((left, right) => left.id - right.id || left.name.localeCompare(right.name));
}

export function projectPbeAdditions(
  input: RuntimePbeComparisonInput,
): RuntimePbeAdditions {
  const champions = additionsById(input.pbe.champions, input.latest.champions);
  const skinlines = additionsById(input.pbe.skinlines, input.latest.skinlines);
  const universes = additionsById(input.pbe.universes, input.latest.universes);
  const newSkins = additionsById(input.pbe.skins, input.latest.skins);
  const championNames = new Map(
    input.pbe.champions.map((champion) => [champion.id, champion.name]),
  );
  const skins = projectSkinReferenceCollectionItems(newSkins)
    .map((item) => ({
      ...item,
      championName: championNames.get(item.championId),
    }))
    .sort(compareRuntimeSkinReferenceItems);
  const counts = {
    champions: champions.length,
    skins: newSkins.length,
    skinlines: skinlines.length,
    universes: universes.length,
  } as const;

  return {
    versions: {
      pbe: input.pbe.version.version,
      latest: input.latest.version.version,
    },
    total: counts.champions + counts.skins + counts.skinlines + counts.universes,
    counts,
    champions,
    skins,
    skinlines,
    universes,
    pbeSkinlines: input.pbe.skinlines,
  };
}
