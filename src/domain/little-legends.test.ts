import { describe, expect, it } from "vitest";
import {
  filterTftCompanions,
  TFT_COMPANION_BATCH_SIZE,
  paginateTftCompanions,
  projectTftCompanions,
} from "./little-legends";

describe("TFT companion projection", () => {
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
      { itemId: 7, name: "Abyssia", level: 3 },
      { itemId: 1, name: "Chibi Ahri", level: 1 },
      { itemId: 10, name: "Poro", level: 1 },
      { itemId: 13, name: "Poro", level: 1 },
      { itemId: 12, name: "Poro", level: 2 },
      { itemId: 2, name: "Unbound Ahri", level: 1 },
    ]);
    expect(items.find(({ itemId }) => itemId === 10)).toMatchObject({
      speciesId: 2,
      speciesName: "Poro",
      TFTRarity: "kStandard",
    });
    expect(items.map(({ companionType }) => companionType)).toEqual([
      "kLittleLegend",
      "kChibi",
      "kLittleLegend",
      "kLittleLegend",
      "kLittleLegend",
      "kStyle2",
    ]);
    expect(items[0].imageUrl).toBe(
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
    expect(paginateTftCompanions(items, 0)).toHaveLength(50);
    expect(paginateTftCompanions(items, 1).map(({ itemId }) => itemId)).toEqual(
      [51],
    );
    expect(paginateTftCompanions(items, 2)).toEqual([]);
  });
});
