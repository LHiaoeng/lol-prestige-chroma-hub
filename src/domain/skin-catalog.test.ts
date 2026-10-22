import { describe, expect, it } from "vitest";
import type { RuntimeSkin } from "./communitydragon-runtime";
import {
  catalogRarityKey,
  filterSkinCatalogItems,
  formatSkinCatalogUrl,
  getSkinCatalogTimelinePageEnd,
  groupSkinCatalogItemsByEntity,
  groupSkinCatalogTimelineItems,
  projectSkinCatalogItems,
  readSkinCatalogUrlState,
  skinCatalogReleaseDate,
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
        classicOnly: false,
        sort: "desc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage"]);
    expect(
      filterSkinCatalogItems(items, {
        locale: "zh_cn",
        search: "",
        rarities: ["id:6"],
        classicOnly: false,
        sort: "asc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Red Skin"]);
  });

  it("searches skin, champion, chroma, emblem, skinline, and universe names", () => {
    const searchableItems = projectSkinCatalogItems([{
      ...skins[2],
      emblems: [{ name: "Spirit Blossom", imageUrl: "https://example.test/emblem.png" }],
      skinlineIds: [10],
      universeIds: [],
      chromas: [{ id: 55, name: "Rose Quartz" }],
    }], [{ kind: "champion", id: 1, name: "Alpha", alias: "Fox", title: "Nine-Tailed" }]);
    const filters = {
      locale: "default" as const,
      search: "",
      skinlineNames: new Map([[10, "Starlight"]]),
      universeNames: new Map([[20, "Runeterra"]]),
      universeSkinlineIds: new Map([[20, [10]]]),
      rarities: [],
      classicOnly: false,
      sort: "asc" as const,
      channel: "latest" as const,
      releaseDates: new Map<number, SkinCatalogReleaseDate>(),
      pbeNewSkinIds: new Set<number>(),
    };

    for (const search of ["red skin", "fox", "nine-tailed", "rose quartz", "spirit blossom", "starlight", "runeterra"]) {
      expect(filterSkinCatalogItems(searchableItems, { ...filters, search })).toHaveLength(1);
    }
  });

  it("sorts by hero name in either direction and keeps one hero's skins stable", () => {
    expect(
      filterSkinCatalogItems(items, {
        locale: "default",
        search: "",
        rarities: [],
        classicOnly: false,
        sort: "desc",
        ...dateContext,
      }).map((item) => item.name),
    ).toEqual(["Blue Skin", "Blue Stage", "Red Skin"]);
  });

  it("shows only names marked Classic or 经典 when requested", () => {
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
      classicOnly: true,
      sort: "asc",
      ...dateContext,
    });
    expect(filtered.map((item) => item.name).sort()).toEqual([
      "Classic Skin", "经典皮肤",
    ]);
    expect(filterSkinCatalogItems(namedItems, {
      locale: "default", search: "", rarities: [], classicOnly: false, sort: "asc",
      ...dateContext,
    })).toHaveLength(7);
  });

  it("sorts releases by locale, puts undated non-classic skins near the front, and leaves classic skins last", () => {
    const preview = { ...items[0], skinId: 5001, id: 5001, stableKey: "1:5001", name: "Preview" };
    const previewOtherChampion = { ...items[0], skinId: 3001, id: 3001, championId: 3, stableKey: "3:3001", name: "Preview Other Champion" };
    const sameDay = { ...items[0], skinId: 5002, id: 5002, championId: 3, stableKey: "3:5002", name: "Same Day" };
    const unknown = { ...items[0], skinId: 4001, id: 4001, championId: 5, stableKey: "5:4001", name: "Unknown" };
    const unknownOtherChampion = { ...items[0], skinId: 4002, id: 4002, championId: 2, stableKey: "2:4002", name: "Unknown Other Champion" };
    const classicUnknown = { ...items[0], skinId: 60001301, id: 60001301, championId: 60001, stableKey: "60001:60001301", name: "Classic Annie" };
    const catalog = [unknown, ...items, previewOtherChampion, sameDay, preview, unknownOtherChampion, classicUnknown];
    const datesWithUnknown = new Map(releaseDates)
      .set(4001, { globalReleaseDate: null, chinaReleaseDate: null })
      .set(4002, { globalReleaseDate: null, chinaReleaseDate: null })
      .set(5002, { globalReleaseDate: "2024-01-02", chinaReleaseDate: null });
    const filters = { locale: "default" as const, search: "", rarities: [], classicOnly: false, releaseDates: datesWithUnknown, pbeNewSkinIds: new Set([5001, 3001]) };
    expect(filterSkinCatalogItems(catalog, { ...filters, channel: "pbe", sort: "release_desc" }).map((item) => item.name))
      .toEqual(["Preview", "Preview Other Champion", "Unknown Other Champion", "Unknown", "Blue Skin", "Blue Stage", "Red Skin", "Same Day", "Classic Annie"]);
    expect(filterSkinCatalogItems(catalog, { ...filters, channel: "pbe", sort: "release_asc" }).map((item) => item.name))
      .toEqual(["Preview", "Preview Other Champion", "Unknown Other Champion", "Unknown", "Red Skin", "Same Day", "Blue Skin", "Blue Stage", "Classic Annie"]);
    expect(filterSkinCatalogItems(items, { ...filters, channel: "latest", sort: "release_asc" }).map((item) => item.name))
      .toEqual(["Red Skin", "Blue Skin", "Blue Stage"]);
    expect(filterSkinCatalogItems(items, { ...filters, locale: "zh_cn", channel: "latest", sort: "release_desc" }).map((item) => item.name))
      .toEqual(["Red Skin", "Blue Skin", "Blue Stage"]);
    expect(filterSkinCatalogItems([unknown, classicUnknown, ...items], { ...filters, channel: "latest", sort: "release_desc" }).map((item) => item.name))
      .toEqual(["Unknown", "Blue Skin", "Blue Stage", "Red Skin", "Classic Annie"]);
  });

  it("uses skinline, then champion, then skin ID within the same date or undated group", () => {
    const candidates = [
      { ...skins[1], id: 10001, championId: 10, name: "Aatrox", skinlineIds: [2], stages: [] },
      { ...skins[1], id: 10002, championId: 1, name: "Zed", skinlineIds: [1], stages: [] },
      { ...skins[1], id: 10003, championId: 99, name: "Ahri", skinlineIds: [1], stages: [] },
      { ...skins[1], id: 10006, championId: 99, name: "Ahri", skinlineIds: [1], stages: [] },
      { ...skins[1], id: 10004, championId: 2, name: "No series", skinlineIds: [], stages: [] },
      { ...skins[1], id: 10005, championId: 3, name: "Newer date", skinlineIds: [3], stages: [] },
    ];
    const entries = projectSkinCatalogItems(candidates, [
      { kind: "champion", id: 10, name: "Aatrox" },
      { kind: "champion", id: 1, name: "Zed" },
      { kind: "champion", id: 99, name: "Ahri" },
      { kind: "champion", id: 2, name: "No series" },
      { kind: "champion", id: 3, name: "Newer date" },
    ]);
    const dates = new Map<number, SkinCatalogReleaseDate>(candidates.map(({ id }) => [
      id, { globalReleaseDate: id === 10005 ? "2024-01-02" : "2024-01-01", chinaReleaseDate: null },
    ]));
    const filters = { locale: "default" as const, search: "", rarities: [], classicOnly: false, sort: "release_desc" as const, channel: "latest" as const, releaseDates: dates, pbeNewSkinIds: new Set<number>() };
    expect(filterSkinCatalogItems(entries, filters).map(({ skinId }) => skinId))
      .toEqual([10005, 10003, 10006, 10002, 10001, 10004]);
    expect(groupSkinCatalogTimelineItems(entries, filters).map((group) => group.items.map(({ skinId }) => skinId)))
      .toEqual([[10005], [10003, 10006, 10002, 10001, 10004]]);
    expect(groupSkinCatalogTimelineItems(entries, { ...filters, releaseDates: new Map() })[0].items.map(({ skinId }) => skinId))
      .toEqual([10003, 10006, 10002, 10001, 10005, 10004]);
  });

  it("groups same-day skins and stages, with PBE and undated skins first and classics last", () => {
    const stage = items.find((item) => item.kind === "stage")!;
    const sameGlobalDay = { ...items[1], skinId: 3002, id: 3002, championId: 3, stableKey: "3:3002", name: "Other Skin" };
    const pbe = { ...items[0], skinId: 5001, id: 5001, name: "PBE" };
    const unknown = { ...items[0], skinId: 4001, id: 4001, name: "Unknown" };
    const classic = { ...items[0], skinId: 60001301, id: 60001301, name: "Classic Annie" };
    const dates = new Map(releaseDates)
      .set(5001, { globalReleaseDate: "2025-01-01", chinaReleaseDate: null })
      .set(3002, { globalReleaseDate: "2024-01-04", chinaReleaseDate: null })
      .set(4001, { globalReleaseDate: null, chinaReleaseDate: null });
    const groups = groupSkinCatalogTimelineItems(
      [unknown, classic, sameGlobalDay, stage, items[1], items[0], pbe],
      { locale: "default", channel: "pbe", sort: "release_desc", releaseDates: dates, pbeNewSkinIds: new Set([5001]) },
    );
    expect(groups.map((group) => [group.kind, "date" in group ? group.date : undefined, group.items.map((item) => item.name)])).toEqual([
      ["pbe", undefined, ["PBE"]],
      ["unknown", undefined, ["Unknown"]],
      ["date", "2024-01-04", ["Blue Skin", "Blue Stage", "Other Skin"]],
      ["date", "2024-01-02", ["Red Skin"]],
      ["classic", undefined, ["Classic Annie"]],
    ]);
    expect(skinCatalogReleaseDate(stage, "zh_cn", dates)).toEqual({ date: "2024-01-04", source: "global" });
  });

  it("uses the country date when known and expands batches to whole timeline groups", () => {
    expect(skinCatalogReleaseDate(items[0], "zh_cn", releaseDates)).toEqual({ date: "2024-01-05", source: "china" });
    expect(skinCatalogReleaseDate(items[0], "default", releaseDates)).toEqual({ date: "2024-01-02", source: "wiki" });
    const groups = [
      { kind: "date" as const, date: "2024-01-01", items: Array.from({ length: 48 }, () => items[0]) },
      { kind: "date" as const, date: "2024-01-02", items: Array.from({ length: 7 }, () => items[0]) },
      { kind: "unknown" as const, items: Array.from({ length: 80 }, () => items[0]) },
    ];
    expect(getSkinCatalogTimelinePageEnd(groups, 0)).toBe(2);
    expect(getSkinCatalogTimelinePageEnd(groups, 2)).toBe(3);
  });

  it("groups skins by every linked skinline or universe and sorts groups by localized name", () => {
    const linked = [
      { ...items[0], id: 3001, skinId: 3001, stableKey: "1:3001", name: "Multi", skinlineIds: [2, 1, 2], universeIds: [20, 10] },
      { ...items[1], id: 3002, skinId: 3002, stableKey: "2:3002", name: "Other", skinlineIds: [2], universeIds: [] },
    ];
    const skinlines = groupSkinCatalogItemsByEntity(linked, "skinline", "default", [
      { kind: "skinline", id: 1, name: "Starlight", universeIds: [] },
      { kind: "skinline", id: 2, name: "Arcade", universeIds: [] },
    ]);
    expect(skinlines.map(({ id, name, items: groupItems }) => [id, name, groupItems.map(({ stableKey }) => stableKey)])).toEqual([
      [2, "Arcade", ["1:3001", "2:3002"]],
      [1, "Starlight", ["1:3001"]],
    ]);
    expect(groupSkinCatalogItemsByEntity(linked, "universe", "default", [
      { kind: "universe", id: 10, name: "A Universe", skinlineIds: [1] },
      { kind: "universe", id: 20, name: "Z Universe", skinlineIds: [2] },
    ])
      .map(({ id, items: groupItems }) => [id, groupItems.map(({ stableKey }) => stableKey)])).toEqual([
        [10, ["1:3001"]],
        [20, ["1:3001", "2:3002"]],
    ]);
  });

  it("groups skins by champion without loading a relation directory", () => {
    expect(groupSkinCatalogItemsByEntity(items, "champion", "default").map(({ id, name, items: groupItems }) => [
      id, name, groupItems.map(({ stableKey }) => stableKey),
    ])).toEqual([
      [1, "Alpha", ["1:1002"]],
      [2, "Beta", ["2:2002", "2:2002:stage:22002"]],
    ]);
  });

  it("places champions without names after named champions in ID order", () => {
    const unnamedItems = [60002, 60001].map((championId) => ({
      ...items[0],
      championId,
      championName: undefined,
      stableKey: `${championId}:1002`,
    }));

    expect(groupSkinCatalogItemsByEntity([...items, ...unnamedItems], "champion", "default")
      .map(({ id, name }) => [id, name])).toEqual([
      [1, "Alpha"],
      [2, "Beta"],
      [60001, undefined],
      [60002, undefined],
    ]);
  });

  it("validates and round-trips shareable catalog conditions", () => {
    const url = new URL(
      "https://example.test/skins/?q=%20Blue%20&rarity=key:kEpic&rarity=unmarked&classicOnly=1&sort=desc&channel=latest&view=cards",
    );
    const state = readSkinCatalogUrlState(url);
    expect(state).toMatchObject({
      search: " Blue ",
      rarities: ["key:kEpic", "unmarked"],
      classicOnly: true,
      sort: "desc",
      view: "cards",
      onlyPbeAdditions: false,
      channel: "latest",
      invalid: [],
    });
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, state))).toMatchObject({
      search: "Blue",
      rarities: ["key:kEpic", "unmarked"],
      classicOnly: true,
      sort: "desc",
      view: "cards",
      onlyPbeAdditions: false,
      channel: "latest",
      invalid: [],
    });
    expect(
      readSkinCatalogUrlState(
        new URL("https://example.test/skins/?rarity=bad&sort=random&channel=no&classicOnly=true"),
      ).invalid,
    ).toEqual(["channel", "sort", "classicOnly", "rarity"]);
    expect(readSkinCatalogUrlState(new URL("https://example.test/skins/"))).toMatchObject({ view: "timeline", classicOnly: false });
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, { ...state, sort: "release_desc" })).sort).toBe("release_desc");
  });

  it("round-trips timeline mode and the PBE additions filter, while invalid views fall back to timeline", () => {
    const url = new URL("https://example.test/skins/?view=timeline&pbeOnly=1&q=Ahri");
    const state = readSkinCatalogUrlState(url);
    expect(state).toMatchObject({ view: "timeline", onlyPbeAdditions: true, search: "Ahri", invalid: [] });
    expect(readSkinCatalogUrlState(formatSkinCatalogUrl(url, state))).toMatchObject({
      view: "timeline", onlyPbeAdditions: true, search: "Ahri", invalid: [],
    });
    expect(readSkinCatalogUrlState(new URL("https://example.test/skins/?view=bad&pbeOnly=yes"))).toMatchObject({
      view: "timeline", onlyPbeAdditions: false, invalid: ["pbeOnly"],
    });
    for (const view of ["champion", "skinline", "universe"] as const) {
      const relationState = readSkinCatalogUrlState(new URL(`https://example.test/skins/?view=${view}&sort=release_asc`));
      expect(relationState).toMatchObject({ view, sort: "release_desc" });
      const normalized = formatSkinCatalogUrl(url, relationState);
      expect(normalized.searchParams.has("sort")).toBe(false);
      expect(readSkinCatalogUrlState(normalized)).toMatchObject({ view });
    }
  });
});
