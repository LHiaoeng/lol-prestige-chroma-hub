import { describe, expect, it } from "vitest";
import type {
  RuntimeChampionSummary,
  RuntimeEmote,
  RuntimeNexusFinisher,
  RuntimeSkin,
  RuntimeSkinBorder,
  RuntimeSkinStage,
  RuntimeSkinline,
  RuntimeSummonerIcon,
  RuntimeUniverse,
  RuntimeWardSkin,
} from "./communitydragon-runtime";
import {
  projectPbeAdditions,
  type RuntimePbeComparisonCollection,
} from "./pbe-additions";
import {
  compareRuntimeSkinReferenceItems,
  runtimeSkinReferenceIdentity,
} from "./skin-reference-projection";

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

function icon(id: number, title = `Icon ${id}`): RuntimeSummonerIcon {
  return { kind: "icon", id, title, iconUrl: `https://cdn/icon-${id}.jpg` };
}

function emote(id: number, taggedChampionIds: readonly number[] = []): RuntimeEmote {
  return {
    kind: "emote",
    id,
    name: `Emote ${id}`,
    iconUrl: `https://cdn/emote-${id}.png`,
    taggedChampionIds,
  };
}

function border(id: number, name = `Border ${id}`): RuntimeSkinBorder {
  return { kind: "border", id, name, iconUrl: `https://cdn/border-${id}.png` };
}

function ward(id: number, name = `Ward ${id}`): RuntimeWardSkin {
  return { kind: "ward", id, name, iconUrl: `https://cdn/ward-${id}.png` };
}

function finisher(id: number, name = `Finisher ${id}`): RuntimeNexusFinisher {
  return {
    kind: "finisher",
    id,
    name,
    iconUrl: `https://cdn/finisher-${id}.png`,
  };
}

function collection(
  overrides: Partial<RuntimePbeComparisonCollection> = {},
): RuntimePbeComparisonCollection {
  return {
    champions: [],
    skins: [],
    skinlines: [],
    universes: [],
    icons: [],
    emotes: [],
    borders: [],
    wards: [],
    finishers: [],
    version: {},
    ...overrides,
  };
}

describe("PBE additions projection", () => {
  it("exposes the shared skin identity and keeps PBE items in canonical order", () => {
    expect(
      runtimeSkinReferenceIdentity({
        championId: 103,
        skinId: 103001,
        stageId: 103002,
      }),
    ).toBe("103:103001:stage:103002");

    const result = projectPbeAdditions({
      pbe: collection({
        skins: [
          skin(103002),
          skin(103001, { stages: [stage(103002, 1)] }),
        ],
      }),
      latest: collection(),
    });

    expect(result.skins.map((item) => item.stableKey)).toEqual([
      "103:103001",
      "103:103001:stage:103002",
    ]);
    expect(
      [...result.skins].sort(compareRuntimeSkinReferenceItems),
    ).toEqual(result.skins);
  });

  it("keeps equal skin IDs from different champions distinct", () => {
    const result = projectPbeAdditions({
      pbe: collection({
        skins: [skin(103001), skin(103001, { championId: 104 })],
      }),
      latest: collection(),
    });

    expect(result.skins.map((item) => item.stableKey)).toEqual([
      "103:103001",
      "104:103001",
    ]);
  });

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
        icons: [icon(30, "Changed title"), icon(31, "New icon")],
        emotes: [emote(40, [1]), emote(41)],
        borders: [border(50, "Changed border"), border(51, "New border")],
        wards: [ward(60, "Changed ward"), ward(61, "New ward")],
        finishers: [finisher(70, "Changed finisher"), finisher(71, "New finisher")],
        version: { version: "16.19" },
      }),
      latest: collection({
        champions: [champion(1, "Old name")],
        skins: [skin(103002, { name: "Old skin name" })],
        skinlines: [skinline(7, "Old skinline")],
        universes: [universe(200, "Old universe")],
        icons: [icon(30, "Old title")],
        emotes: [emote(40)],
        borders: [border(50, "Old border")],
        wards: [ward(60, "Old ward")],
        finishers: [finisher(70, "Old finisher")],
        version: { version: "16.18" },
      }),
    });

    expect(result.counts).toEqual({
      champions: 1,
      skins: 1,
      skinlines: 1,
      universes: 1,
      icons: 1,
      emotes: 1,
      chromas: 0,
      borders: 1,
      wards: 1,
      finishers: 1,
    });
    expect(result.total).toBe(9);
    expect(result.champions.map((item) => item.id)).toEqual([2]);
    expect(result.skinlines.map((item) => item.id)).toEqual([8]);
    expect(result.universes.map((item) => item.id)).toEqual([201]);
    expect(result.icons.map((item) => item.id)).toEqual([31]);
    expect(result.emotes.map((item) => item.id)).toEqual([41]);
    expect(result.borders.map((item) => item.id)).toEqual([51]);
    expect(result.wards.map((item) => item.id)).toEqual([61]);
    expect(result.finishers.map((item) => item.id)).toEqual([71]);
    expect(result.skins.map((item) => [item.kind, item.stageId])).toEqual([
      ["skin", undefined],
      ["stage", 103101],
    ]);
    expect(result.pbeSkinlines.map((item) => item.id)).toEqual([7, 8]);
    expect(result.versions).toEqual({ pbe: "16.19", latest: "16.18" });
  });

  it("resolves emote champion tags against the PBE champion list", () => {
    const result = projectPbeAdditions({
      pbe: collection({
        champions: [champion(103, "Ahri")],
        emotes: [emote(401, [103, 999])],
      }),
      latest: collection(),
    });

    expect(result.emotes).toEqual([
      {
        kind: "emote",
        id: 401,
        name: "Emote 401",
        iconUrl: "https://cdn/emote-401.png",
        tags: [
          { id: 103, name: "Ahri" },
          { id: 999, name: undefined },
        ],
      },
    ]);
  });

  it("projects new chromas from PBE skins and keeps the owner skin", () => {
    const result = projectPbeAdditions({
      pbe: collection({
        champions: [champion(103, "Ahri")],
        skins: [
          skin(103002, {
            chromas: [{ id: 1030021, name: "Live chroma" }],
          }),
          skin(103001, {
            chromas: [
              {
                id: 1030012,
                name: "Ruby",
                imageUrl: "https://cdn/ruby.png",
                colors: ["#BE2625"],
              },
            ],
          }),
          skin(103003, {
            name: undefined,
            chromas: [{ id: 1030031, colors: ["#2DAFA4"] }],
          }),
        ],
      }),
      latest: collection({
        skins: [skin(103002, { chromas: [{ id: 1030021 }] })],
      }),
    });

    expect(result.chromas).toEqual([
      {
        kind: "chroma",
        id: 1030012,
        name: "Ruby",
        imageUrl: "https://cdn/ruby.png",
        colors: ["#BE2625"],
        skinId: 103001,
        championId: 103,
        skinName: "Skin 103001",
      },
      {
        kind: "chroma",
        id: 1030031,
        name: undefined,
        imageUrl: undefined,
        colors: ["#2DAFA4"],
        skinId: 103003,
        championId: 103,
        skinName: "Ahri",
      },
    ]);
    expect(result.counts.chromas).toBe(2);
    expect(result.total).toBe(5);
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
