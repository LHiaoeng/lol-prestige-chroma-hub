import { describe, expect, it } from "vitest";
import {
  addTftCompanionSearchAliases,
  filterTftCompanions,
  getMultiStarTftCompanionItemIds,
  markPbeTftCompanionAdditions,
  TFT_COMPANION_BATCH_SIZE,
  paginateTftCompanions,
  projectTftCompanions,
  sortTftCompanions,
  tftCompanionPageSize,
} from "./little-legends";

describe("TFT companion projection", () => {
  it("marks all levels only when the same category and species has multiple levels", () => {
    const item = (
      itemId: number,
      companionType: "kLittleLegend" | "kChibi",
      speciesId: number,
      level: number,
    ) => ({
      companionType,
      itemId,
      name: `Companion ${itemId}`,
      speciesId,
      speciesName: `Species ${speciesId}`,
      level,
      TFTRarity: "kStandard",
      loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
    });
    const items = projectTftCompanions(
      [
        item(1, "kLittleLegend", 2, 1),
        item(2, "kLittleLegend", 2, 3),
        item(3, "kLittleLegend", 3, 1),
        item(4, "kChibi", 2, 2),
      ],
      "default",
      "pbe",
    );

    expect([...getMultiStarTftCompanionItemIds(items)]).toEqual([1, 2]);
  });

  it("includes all companion categories, preserves duplicate names, sorts deterministically, and uses the requested asset channel", () => {
    const items = projectTftCompanions(
      [
        {
          companionType: "kLittleLegend",
          itemId: 12,
          name: "Poro",
          speciesId: 2,
          speciesName: "Poro",
          level: 2,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
        {
          companionType: "kLittleLegend",
          itemId: 13,
          name: "Poro",
          speciesId: 2,
          speciesName: "Poro",
          level: 1,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
        {
          companionType: "kLittleLegend",
          itemId: 10,
          name: "Poro",
          speciesId: 2,
          speciesName: "Poro",
          level: 1,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
        {
          companionType: "kLittleLegend",
          itemId: 7,
          name: "Abyssia",
          speciesId: 3,
          speciesName: "Abyssia",
          level: 3,
          TFTRarity: "kMythic",
          loadoutsIcon:
            "/lol-game-data/assets/ASSETS/Characters/Abyssia/Icon.png",
        },
        {
          companionType: "kChibi",
          itemId: 1,
          name: "Chibi Ahri",
          speciesId: 4,
          speciesName: "Ahri",
          level: 1,
          TFTRarity: "kPrestige",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Ahri/Icon.png",
        },
        {
          companionType: "kStyle2",
          itemId: 2,
          name: "Unbound Ahri",
          speciesId: 4,
          speciesName: "Ahri",
          level: 1,
          TFTRarity: "kMythic",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Ahri/Icon.png",
        },
      ],
      "default",
      "latest",
    );

    expect(
      items.map(({ itemId, name, level }) => ({ itemId, name, level })),
    ).toEqual([
      { itemId: 1, name: "Chibi Ahri", level: 1 },
      { itemId: 2, name: "Unbound Ahri", level: 1 },
      { itemId: 7, name: "Abyssia", level: 3 },
      { itemId: 10, name: "Poro", level: 1 },
      { itemId: 13, name: "Poro", level: 1 },
      { itemId: 12, name: "Poro", level: 2 },
    ]);
    expect(items.find(({ itemId }) => itemId === 10)).toMatchObject({
      speciesId: 2,
      speciesName: "Poro",
      TFTRarity: "kStandard",
    });
    expect(items.map(({ companionType }) => companionType)).toEqual([
      "kChibi",
      "kStyle2",
      "kLittleLegend",
      "kLittleLegend",
      "kLittleLegend",
      "kLittleLegend",
    ]);
    expect(items.find(({ itemId }) => itemId === 7)?.imageUrl).toBe(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/abyssia/icon.png",
    );
    expect(
      filterTftCompanions(items, { companionType: "kChibi" }, "default").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1]);
  });

  it("rejects invalid or duplicate identities and unknown source enums", () => {
    const valid = {
      companionType: "kLittleLegend",
      itemId: 1,
      name: "Poro",
      speciesId: 2,
      speciesName: "Poro",
      level: 1,
      TFTRarity: "kStandard",
      loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
    };

    expect(() =>
      projectTftCompanions([{ ...valid, itemId: 0 }], "default", "pbe"),
    ).toThrow(/failed validation/);
    expect(() =>
      projectTftCompanions(
        [{ ...valid, speciesName: undefined }],
        "default",
        "pbe",
      ),
    ).toThrow(/failed validation/);
    expect(() =>
      projectTftCompanions(
        [{ ...valid, TFTRarity: "kUnlisted" }],
        "default",
        "pbe",
      ),
    ).toThrow(/failed validation/);
    expect(() =>
      projectTftCompanions(
        [{ ...valid, companionType: "kUnlisted" }],
        "default",
        "pbe",
      ),
    ).toThrow(/failed validation/);
    expect(() =>
      projectTftCompanions(
        [{ ...valid, loadoutsIcon: "../unexpected.png" }],
        "default",
        "pbe",
      ),
    ).toThrow(/invalid loadoutsIcon/);
    expect(() =>
      projectTftCompanions([valid, valid], "default", "pbe"),
    ).toThrow(/duplicate itemId 1/);
  });

  it("accepts source species ID zero for River Sprite entries", () => {
    expect(
      projectTftCompanions(
        [
          {
            companionType: "kLittleLegend",
            itemId: 1,
            name: "River Sprite",
            speciesId: 0,
            speciesName: "River Sprite",
            level: 3,
            TFTRarity: "kStandard",
            loadoutsIcon:
              "/lol-game-data/assets/ASSETS/Characters/RiverSprite/Icon.png",
          },
        ],
        "default",
        "pbe",
      ),
    ).toMatchObject([{ speciesId: 0, speciesName: "River Sprite" }]);
  });

  it("filters by trimmed case-insensitive localized text and the intersection of source fields", () => {
    const items = projectTftCompanions(
      [
        {
          companionType: "kLittleLegend",
          itemId: 12,
          name: "Poro",
          speciesId: 2,
          speciesName: "Frost Poro",
          level: 2,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
        {
          companionType: "kLittleLegend",
          itemId: 13,
          name: "Little Poro",
          speciesId: 2,
          speciesName: "Frost Poro",
          level: 1,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
        {
          companionType: "kLittleLegend",
          itemId: 14,
          name: "Poro",
          speciesId: 3,
          speciesName: "River Poro",
          level: 1,
          TFTRarity: "kLegendary",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
        },
      ],
      "default",
      "pbe",
    );

    expect(
      filterTftCompanions(
        items,
        {
          search: "  fRoSt  ",
          companionType: "kLittleLegend",
          speciesId: 2,
          TFTRarity: "kStandard",
          level: 1,
        },
        "default",
      ).map(({ itemId }) => itemId),
    ).toEqual([13]);
  });

  it("searches names from both localization views", () => {
    const record = (itemId: number, name: string, speciesName: string) => ({
      companionType: "kChibi",
      itemId,
      name,
      speciesId: 4,
      speciesName,
      level: 1,
      TFTRarity: "kLegendary",
      loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Ahri/Icon.png",
    });
    const english = projectTftCompanions(
      [record(1, "Chibi Ahri", "Ahri"), record(2, "Star Guardian Ahri", "Ahri")],
      "default",
      "pbe",
    );
    const chinese = projectTftCompanions(
      [record(1, "小小阿狸", "阿狸"), record(2, "星之守护者阿狸", "阿狸")],
      "zh_cn",
      "pbe",
    );
    const searchable = addTftCompanionSearchAliases(english, chinese);

    expect(
      filterTftCompanions(searchable, { search: "小小阿狸" }, "default").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1]);
    expect(
      filterTftCompanions(searchable, { search: "阿狸" }, "default").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 2]);
    expect(
      filterTftCompanions(
        addTftCompanionSearchAliases(chinese, english),
        { search: "Ahri" },
        "zh_cn",
      ).map(({ itemId }) => itemId),
    ).toEqual([1, 2]);
  });

  it("marks and filters only PBE item IDs missing from live data", () => {
    const companion = (itemId: number, name: string) => ({
      companionType: "kLittleLegend",
      itemId,
      name,
      speciesId: 1,
      speciesName: "Poro",
      level: 1,
      TFTRarity: "kStandard",
      loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Poro/Icon.png",
    });
    const pbeItems = projectTftCompanions(
      [companion(10, "Live"), companion(20, "New")],
      "default",
      "pbe",
    );
    const liveItems = projectTftCompanions(
      [companion(10, "Live")],
      "default",
      "latest",
    );
    const compared = markPbeTftCompanionAdditions(pbeItems, liveItems);

    expect(
      compared.map(({ itemId, isPbeAddition }) => [itemId, isPbeAddition]),
    ).toEqual([
      [10, undefined],
      [20, true],
    ]);
    expect(
      filterTftCompanions(compared, { onlyPbeAdditions: true }, "default").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([20]);
  });

  it("keeps PBE additions first and supports both sort directions", () => {
    const items = projectTftCompanions(
      [
        {
          companionType: "kLittleLegend",
          itemId: 1,
          name: "Zeta",
          speciesId: 1,
          speciesName: "Zeta",
          level: 1,
          TFTRarity: "kStandard",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Zeta/Icon.png",
        },
        {
          companionType: "kChibi",
          itemId: 2,
          name: "Alpha",
          speciesId: 2,
          speciesName: "Alpha",
          level: 3,
          TFTRarity: "kPrestige",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Alpha/Icon.png",
        },
        {
          companionType: "kStyle2",
          itemId: 3,
          name: "Beta",
          speciesId: 3,
          speciesName: "Beta",
          level: 2,
          TFTRarity: "kMythic",
          loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Beta/Icon.png",
        },
      ],
      "default",
      "pbe",
    ).map((item) => ({ ...item, isPbeAddition: item.itemId === 1 }));

    expect(sortTftCompanions(items, "default").map(({ itemId }) => itemId)).toEqual([
      1, 2, 3,
    ]);
    expect(
      sortTftCompanions(items, "default", "rarity_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      sortTftCompanions(items, "default", "rarity_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 3, 2]);
    expect(
      sortTftCompanions(items, "default", "type_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 3, 2]);
    expect(
      sortTftCompanions(items, "default", "type_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      sortTftCompanions(items, "default", "name_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      sortTftCompanions(items, "default", "name_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 3, 2]);
    expect(
      sortTftCompanions(items, "default", "stars_desc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 2, 3]);
    expect(
      sortTftCompanions(items, "default", "stars_asc").map(
        ({ itemId }) => itemId,
      ),
    ).toEqual([1, 3, 2]);
  });

  it("returns at most 50 items in each page", () => {
    const items = projectTftCompanions(
      Array.from({ length: 51 }, (_, index) => ({
        companionType: "kLittleLegend",
        itemId: index + 1,
        name: `Legend ${String(index + 1).padStart(2, "0")}`,
        speciesId: 1,
        speciesName: "Legend",
        level: 1,
        TFTRarity: "kStandard",
        loadoutsIcon: "/lol-game-data/assets/ASSETS/Characters/Legend/Icon.png",
      })),
      "default",
      "pbe",
    );

    expect(TFT_COMPANION_BATCH_SIZE).toBe(50);
    expect([1, 2, 3, 4, 5, 6, 7, 8].map(tftCompanionPageSize)).toEqual([
      50, 50, 48, 48, 50, 48, 49, 48,
    ]);
    expect(paginateTftCompanions(items, 0)).toHaveLength(50);
    expect(paginateTftCompanions(items, 0, 48)).toHaveLength(48);
    expect(
      paginateTftCompanions(items, 1, 48).map(({ itemId }) => itemId),
    ).toEqual([49, 50, 51]);
    expect(paginateTftCompanions(items, 2)).toEqual([]);
  });
});
