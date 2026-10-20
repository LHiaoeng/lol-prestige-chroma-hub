import { describe, expect, it } from "vitest";
import type { RuntimeSkin } from "./communitydragon-runtime";
import {
  catalogRarityKey,
  filterSkinCatalogItems,
  formatSkinCatalogUrl,
  projectSkinCatalogItems,
  readSkinCatalogUrlState,
  type SkinCatalogReleaseDate,
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
  const releaseDates = new Map<number, SkinCatalogReleaseDate>([
    [1002, { globalReleaseDate: "2024-01-02", chinaReleaseDate: "2024-01-05" }],
    [2002, { globalReleaseDate: "2024-01-04", chinaReleaseDate: null }],
  ]);
  const dateContext = { channel: "latest" as const, releaseDates, pbeNewSkinIds: new Set<number>() };
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
        excludeClassic: false,
        sort: "desc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage"]);
    expect(
      filterSkinCatalogItems(items, {
        locale: "zh_cn",
        search: "",
        rarities: ["id:6"],
        excludeClassic: false,
        sort: "asc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Red Skin"]);
  });

  it("sorts by hero name in either direction and keeps one hero's skins stable", () => {
    expect(
      filterSkinCatalogItems(items, {
        locale: "default",
        search: "",
        rarities: [],
        excludeClassic: false,
        sort: "desc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage", "Red Skin"]);
  });

  it("excludes names marked Classic or 经典 only when requested", () => {
    const namedItems = [
      ...items,
      { ...items[0], stableKey: "classic-cn", name: "经典皮肤" },
      { ...items[0], stableKey: "classic-en", name: "Classic Skin" },
      { ...items[0], stableKey: "classic-middle", name: "Prestige Classic Skin" },
      { ...items[0], stableKey: "classical", name: "Classical Skin" },
    ];
    const filtered = filterSkinCatalogItems(namedItems, {
      locale: "default",
      search: "",
      rarities: [],
      excludeClassic: true,
      sort: "asc",
      ...dateContext,
    });
    expect(filtered.map((item) => item.name).sort()).toEqual([
      "Blue Skin", "Blue Stage", "Classical Skin", "Prestige Classic Skin", "Red Skin",
    ]);
    expect(filterSkinCatalogItems(namedItems, {
      locale: "default", search: "", rarities: [], excludeClassic: false, sort: "asc",
      ...dateContext,
    })).toHaveLength(7);
  });

  it("sorts releases by locale, puts PBE additions first, and leaves unknown live dates last", () => {
    const preview = { ...items[0], skinId: 5001, id: 5001, stableKey: "1:5001", name: "Preview" };
    const previewOtherChampion = { ...items[0], skinId: 3001, id: 3001, championId: 3, stableKey: "3:3001", name: "Preview Other Champion" };
    const sameDay = { ...items[0], skinId: 5002, id: 5002, championId: 3, stableKey: "3:5002", name: "Same Day" };
    const unknown = { ...items[0], skinId: 4001, id: 4001, championId: 5, stableKey: "5:4001", name: "Unknown" };
    const unknownOtherChampion = { ...items[0], skinId: 4002, id: 4002, championId: 2, stableKey: "2:4002", name: "Unknown Other Champion" };
    const catalog = [unknown, ...items, previewOtherChampion, sameDay, preview, unknownOtherChampion];
    const datesWithUnknown = new Map(releaseDates)
      .set(4001, { globalReleaseDate: null, chinaReleaseDate: null })
      .set(4002, { globalReleaseDate: null, chinaReleaseDate: null })
      .set(5002, { globalReleaseDate: "2024-01-02", chinaReleaseDate: null });
    const filters = { locale: "default" as const, search: "", rarities: [], excludeClassic: false, releaseDates: datesWithUnknown, pbeNewSkinIds: new Set([5001, 3001]) };
    expect(filterSkinCatalogItems(catalog, { ...filters, channel: "pbe", sort: "release_desc" }).map((item) => item.name))
      .toEqual(["Preview", "Preview Other Champion", "Blue Skin", "Blue Stage", "Red Skin", "Same Day", "Unknown Other Champion", "Unknown"]);
    expect(filterSkinCatalogItems(catalog, { ...filters, channel: "pbe", sort: "release_asc" }).map((item) => item.name))
      .toEqual(["Preview", "Preview Other Champion", "Red Skin", "Same Day", "Blue Skin", "Blue Stage", "Unknown Other Champion", "Unknown"]);
    expect(filterSkinCatalogItems(items, { ...filters, channel: "latest", sort: "release_asc" }).map((item) => item.name))
      .toEqual(["Red Skin", "Blue Skin", "Blue Stage"]);
    expect(filterSkinCatalogItems(items, { ...filters, locale: "zh_cn", channel: "latest", sort: "release_desc" }).map((item) => item.name))
      .toEqual(["Red Skin", "Blue Skin", "Blue Stage"]);
    expect(filterSkinCatalogItems([unknown, ...items], { ...filters, channel: "latest", sort: "release_desc" }).at(-1)?.name)
      .toBe("Unknown");
  });

  it("validates and round-trips shareable catalog conditions", () => {
    const url = new URL(
      "https://example.test/skins/?q=%20Blue%20&rarity=key:kEpic&rarity=unmarked&excludeClassic=1&sort=desc&channel=latest",
    );
    const state = readSkinCatalogUrlState(url);
    expect(state).toMatchObject({
      search: " Blue ",
      rarities: ["key:kEpic", "unmarked"],
      excludeClassic: true,
      sort: "desc",
      channel: "latest",
      invalid: [],
    });
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, state))).toMatchObject({
      search: "Blue",
      rarities: ["key:kEpic", "unmarked"],
      excludeClassic: true,
      sort: "desc",
      channel: "latest",
      invalid: [],
    });
    expect(
      readSkinCatalogUrlState(
        new URL("https://example.test/skins/?rarity=bad&sort=random&channel=no&excludeClassic=true"),
      ).invalid,
    ).toEqual(["channel", "sort", "excludeClassic", "rarity"]);
    expect(readSkinCatalogUrlState(new URL("https://example.test/skins/")).excludeClassic).toBe(false);
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, { ...state, sort: "release_desc" })).sort).toBe("release_desc");
  });
});
