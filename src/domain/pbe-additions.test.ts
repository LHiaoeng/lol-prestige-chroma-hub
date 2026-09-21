import { describe, expect, it } from "vitest";
import type {
  RuntimeChampionSummary,
  RuntimeSkin,
  RuntimeSkinStage,
  RuntimeSkinline,
  RuntimeUniverse,
} from "./communitydragon-runtime";
import {
  projectPbeAdditions,
  type RuntimePbeComparisonCollection,
} from "./pbe-additions";

function champion(id: number, name = `Champion ${id}`): RuntimeChampionSummary {
  return { kind: "champion", id, name };
}

function skin(
  id: number,
  overrides: Partial<RuntimeSkin> = {},
): RuntimeSkin {
  return {
    kind: "skin",
    id,
    championId: 103,
    name: `Skin ${id}`,
    isBase: false,
    skinlineIds: [7],
    universeIds: [200],
    media: {},
    stages: [],
    chromas: [],
    ...overrides,
  };
}

function stage(id: number | undefined, stageIndex: number): RuntimeSkinStage {
  return {
    id,
    stageIndex,
    name: id === undefined ? undefined : `Stage ${id}`,
    media: {},
    chromas: [],
  };
}

function skinline(id: number, name = `Skinline ${id}`): RuntimeSkinline {
  return { kind: "skinline", id, name, universeIds: [200] };
}

function universe(id: number, name = `Universe ${id}`): RuntimeUniverse {
  return { kind: "universe", id, name, skinlineIds: [7] };
}

function collection(
  overrides: Partial<RuntimePbeComparisonCollection> = {},
): RuntimePbeComparisonCollection {
  return {
    champions: [],
    skins: [],
    skinlines: [],
    universes: [],
    version: {},
    ...overrides,
  };
}

describe("PBE additions projection", () => {
  it("compares top-level IDs, ignores field changes, and expands valid new stages", () => {
    const changedSkin = skin(103002, { name: "PBE name" });
    const newSkin = skin(103100, {
      stages: [stage(103101, 1), stage(undefined, 2)],
    });
    const result = projectPbeAdditions({
      pbe: collection({
        champions: [champion(1, "Changed name"), champion(2, "New champion")],
        skins: [changedSkin, newSkin],
        skinlines: [skinline(7, "Changed skinline"), skinline(8, "New skinline")],
        universes: [universe(200, "Changed universe"), universe(201, "New universe")],
        version: { version: "16.19" },
      }),
      latest: collection({
        champions: [champion(1, "Old name")],
        skins: [skin(103002, { name: "Old skin name" })],
        skinlines: [skinline(7, "Old skinline")],
        universes: [universe(200, "Old universe")],
        version: { version: "16.18" },
      }),
    });

    expect(result.counts).toEqual({
      champions: 1,
      skins: 1,
      skinlines: 1,
      universes: 1,
    });
    expect(result.total).toBe(4);
    expect(result.champions.map((item) => item.id)).toEqual([2]);
    expect(result.skinlines.map((item) => item.id)).toEqual([8]);
    expect(result.universes.map((item) => item.id)).toEqual([201]);
    expect(result.skins.map((item) => [item.kind, item.stageId])).toEqual([
      ["skin", undefined],
      ["stage", 103101],
    ]);
    expect(result.pbeSkinlines.map((item) => item.id)).toEqual([7, 8]);
    expect(result.versions).toEqual({ pbe: "16.19", latest: "16.18" });
  });

  it("keeps a missing source version missing instead of using a channel token", () => {
    const result = projectPbeAdditions({
      pbe: collection(),
      latest: collection(),
    });

    expect(result.versions).toEqual({ pbe: undefined, latest: undefined });
  });

  it("does not treat a stage added to an existing skin as a new entity", () => {
    const result = projectPbeAdditions({
      pbe: collection({
        skins: [skin(103100, { stages: [stage(103101, 1)] })],
      }),
      latest: collection({ skins: [skin(103100)] }),
    });

    expect(result.counts.skins).toBe(0);
    expect(result.total).toBe(0);
    expect(result.skins).toEqual([]);
  });
});
