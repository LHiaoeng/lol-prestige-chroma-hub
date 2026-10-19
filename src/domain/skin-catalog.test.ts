import { describe, expect, it } from "vitest";
import type { RuntimeSkin } from "./communitydragon-runtime";
import {
  catalogRarityKey,
  filterSkinCatalogItems,
  formatSkinCatalogUrl,
  projectSkinCatalogItems,
  readSkinCatalogUrlState,
} from "./skin-catalog";

const skins: RuntimeSkin[] = [
  {
    kind: "skin",
    id: 2001,
    championId: 2,
    isBase: true,
    skinlineIds: [],
    media: {},
    stages: [],
    chromas: [],
  },
  {
    kind: "skin",
    id: 2002,
    championId: 2,
    name: "Blue Skin",
    isBase: false,
    rarity: { key: "kEpic", label: "Epic" },
    skinlineIds: [],
    media: {},
    chromas: [],
    stages: [
      {
        id: 22002,
        name: "Blue Stage",
        stageIndex: 1,
        rarity: undefined,
        raritySpecified: true,
        media: {},
        chromas: [],
      },
    ],
  },
  {
    kind: "skin",
    id: 1002,
    championId: 1,
    name: "Red Skin",
    isBase: false,
    rarity: { id: 6, label: "未知" },
    skinlineIds: [],
    media: {},
    stages: [],
    chromas: [],
  },
];

describe("skin catalog domain", () => {
  const items = projectSkinCatalogItems(skins, [
    { kind: "champion", id: 1, name: "Alpha" },
    { kind: "champion", id: 2, name: "Beta" },
  ]);

  it("removes base skins, preserves stages, deduplicates identities, and joins hero names", () => {
    expect(items.map((item) => [item.stableKey, item.championName])).toEqual([
      ["1:1002", "Alpha"],
      ["2:2002", "Beta"],
      ["2:2002:stage:22002", "Beta"],
    ]);
  });

  it("keeps locale rarities isolated and allows unmarked alongside a marked class", () => {
    expect(items.map((item) => catalogRarityKey(item, "default"))).toEqual([
      "",
      "key:kEpic",
      "",
    ]);
    expect(items.map((item) => catalogRarityKey(item, "zh_cn"))).toEqual([
      "id:6",
      "",
      "",
    ]);
    expect(
      filterSkinCatalogItems(items, {
        locale: "default",
        search: " bEtA ",
        rarities: ["key:kEpic", "unmarked"],
        sort: "desc",
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage"]);
    expect(
      filterSkinCatalogItems(items, {
        locale: "zh_cn",
        search: "",
        rarities: ["id:6"],
        sort: "asc",
      }).map((item) => item.name),
    ).toEqual(["Red Skin"]);
  });

  it("sorts by hero name in either direction and keeps one hero's skins stable", () => {
    expect(
      filterSkinCatalogItems(items, {
        locale: "default",
        search: "",
        rarities: [],
        sort: "desc",
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage", "Red Skin"]);
  });

  it("validates and round-trips shareable catalog conditions", () => {
    const url = new URL(
      "https://example.test/skins/?q=%20Blue%20&rarity=key:kEpic&rarity=unmarked&sort=desc&channel=latest",
    );
    const state = readSkinCatalogUrlState(url);
    expect(state).toMatchObject({
      search: " Blue ",
      rarities: ["key:kEpic", "unmarked"],
      sort: "desc",
      channel: "latest",
      invalid: [],
    });
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, state))).toMatchObject({
      search: "Blue",
      rarities: ["key:kEpic", "unmarked"],
      sort: "desc",
      channel: "latest",
      invalid: [],
    });
    expect(
      readSkinCatalogUrlState(
        new URL("https://example.test/skins/?rarity=bad&sort=random&channel=no"),
      ).invalid,
    ).toEqual(["channel", "sort", "rarity"]);
  });
});
