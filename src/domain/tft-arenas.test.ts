import { describe, expect, it } from "vitest";
import {
  addTftArenaSearchAliases,
  filterTftArenas,
  markPbeTftArenaAdditions,
  projectTftArenas,
  sortTftArenas,
  type TftArena,
} from "./tft-arenas";

const baseArena = {
  itemId: 1,
  groupId: 0,
  name: "Base Arena",
  groupName: "Base",
  description: "",
  rarity: "Default",
  TFTRarity: "kMythic",
  IsWIP: true,
  loadoutsIcon:
    "/lol-game-data/assets/ASSETS/Loadouts/TFTMapSkins/Square_Base.png",
};

const arena = (
  itemId: number,
  groupId: number,
  name: string,
  groupName: string,
  TFTRarity: TftArena["TFTRarity"] = "kStandard",
): TftArena => ({
  itemId,
  groupId,
  name,
  groupName,
  TFTRarity,
  imageUrl: "https://raw.communitydragon.org/pbe/example.png",
});

describe("TFT arena projection", () => {
  it("keeps every itemId, including Base and same-name entries, using TFTRarity", () => {
    expect(
      projectTftArenas(
        [baseArena, { ...baseArena, itemId: 2 }],
        "pbe",
      ),
    ).toEqual([
      {
        itemId: 2,
        groupId: 0,
        name: "Base Arena",
        groupName: "Base",
        description: "",
        TFTRarity: "kMythic",
        imageUrl:
          "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/square_base.png",
      },
      {
        itemId: 1,
        groupId: 0,
        name: "Base Arena",
        groupName: "Base",
        description: "",
        TFTRarity: "kMythic",
        imageUrl:
          "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftmapskins/square_base.png",
      },
    ]);
    expect(
      filterTftArenas(
        projectTftArenas([baseArena, { ...baseArena, itemId: 2 }], "pbe"),
        { groupId: 0, TFTRarity: "kMythic" },
        "default",
      ).map(({ itemId }) => itemId),
    ).toEqual([2, 1]);
  });

  it("rejects malformed rows, duplicate IDs, unknown rarity, and unsafe media paths", () => {
    expect(() => projectTftArenas({}, "pbe")).toThrow(
      "TFT arena collection must be an array",
    );
    expect(() =>
      projectTftArenas([baseArena, baseArena], "pbe"),
    ).toThrow("duplicate itemId 1");
    expect(() =>
      projectTftArenas([{ ...baseArena, itemId: 0 }], "pbe"),
    ).toThrow("entry 0 failed validation");
    expect(() =>
      projectTftArenas([{ ...baseArena, groupId: -1 }], "pbe"),
    ).toThrow("entry 0 failed validation");
    expect(() =>
      projectTftArenas([{ ...baseArena, TFTRarity: "kUnlisted" }], "pbe"),
    ).toThrow("entry 0 failed validation");
    expect(() =>
      projectTftArenas([{ ...baseArena, loadoutsIcon: "/../bad.png" }], "pbe"),
    ).toThrow("invalid loadoutsIcon");
  });

  it("searches localized names and group names through their shared IDs", () => {
    const currentView = [arena(10, 7, "星界竞技场", "星神")];
    const otherView = [arena(10, 7, "Celestial Arena", "Space Gods")];
    const searchable = addTftArenaSearchAliases(currentView, otherView);

    expect(
      filterTftArenas(searchable, { search: " SPACE GODS " }, "zh_cn"),
    ).toMatchObject([
      { itemId: 10, name: "星界竞技场", groupName: "星神" },
    ]);
    expect(
      filterTftArenas(searchable, { search: "celestial" }, "zh_cn"),
    ).toMatchObject([{ itemId: 10, name: "星界竞技场" }]);
  });

  it("allows an omitted description", () => {
    const arenaWithoutDescription = {
      itemId: baseArena.itemId,
      groupId: baseArena.groupId,
      name: baseArena.name,
      groupName: baseArena.groupName,
      TFTRarity: baseArena.TFTRarity,
      loadoutsIcon: baseArena.loadoutsIcon,
    };

    expect(
      projectTftArenas([arenaWithoutDescription], "latest")[0],
    ).not.toHaveProperty("description");
  });

  it("marks only PBE itemIds absent from live as additions", () => {
    const pbe = [
      arena(2, 8, "New Arena", "New Set"),
      arena(1, 7, "Updated Name", "Current Set"),
    ];
    const live = [arena(1, 7, "Old Name", "Current Set")];

    const additions = markPbeTftArenaAdditions(pbe, live);
    expect(
      additions.map(({ itemId, isPbeAddition }) => [
        itemId,
        isPbeAddition ?? false,
      ]),
    ).toEqual([[2, true], [1, false]]);
    expect(
      sortTftArenas(additions, "default", "name_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([2, 1]);
    expect(
      filterTftArenas(
        additions,
        { onlyPbeAdditions: true },
        "default",
      ).map(({ itemId }) => itemId),
    ).toEqual([2]);
  });

  it("sorts by ID by default and applies rarity or localized name ordering", () => {
    const items = [
      arena(40, 1, "B", "Group", "kStandard"),
      arena(10, 1, "A", "Group", "kStandard"),
      arena(30, 2, "Z", "Group", "kLegendary"),
      arena(20, 2, "A", "Group", "kLegendary"),
    ];

    expect(sortTftArenas(items, "default").map(({ itemId }) => itemId)).toEqual([
      40, 30, 20, 10,
    ]);
    expect(
      sortTftArenas(items, "default", "id_asc").map(({ itemId }) => itemId),
    ).toEqual([10, 20, 30, 40]);
    expect(
      sortTftArenas(items, "default", "rarity_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([30, 20, 40, 10]);
    expect(
      sortTftArenas(items, "default", "rarity_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([40, 10, 30, 20]);
    expect(
      sortTftArenas(items, "default", "name_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([20, 10, 40, 30]);
    expect(
      sortTftArenas(items, "default", "name_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([30, 40, 20, 10]);
  });
});
