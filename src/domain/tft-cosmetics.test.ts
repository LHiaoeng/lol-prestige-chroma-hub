import { describe, expect, it } from "vitest";
import {
  addTftCosmeticSearchAliases,
  filterTftCosmetics,
  indexTftCosmeticFeatureTags,
  markPbeTftCosmeticAdditions,
  projectTftCosmetics,
  type TftCosmetic,
} from "./tft-cosmetics";

const damageSkin = {
  itemId: 194003,
  contentId: "boom-content",
  name: "Crystal Rose Gwen Boom",
  description: "",
  TFTRarity: "kMythic",
  loadoutsIcon: "/lol-game-data/assets/ASSETS/Loadouts/TFTDamageSkins/Boom_Gwen.png",
};

const portal = {
  itemId: 35,
  contentId: "portal-content",
  name: "Crystal Rose Gateway",
  description: "",
  TFTRarity: "kStandard",
  loadoutsIcon: "/lol-game-data/assets/ASSETS/Loadouts/TFTZoomSkins/Portal_Small.png",
  largeLoadoutsIcon: "/lol-game-data/assets/ASSETS/Loadouts/TFTZoomSkins/Portal.png",
};

const cosmetic = (
  itemId: number,
  name: string,
  TFTRarity: TftCosmetic["TFTRarity"],
  featureTags: TftCosmetic["featureTags"] = [],
): TftCosmetic => ({
  itemId,
  contentId: "content-" + itemId,
  name,
  TFTRarity,
  imageUrl: "https://raw.communitydragon.org/pbe/thumb.png",
  previewUrl: "https://raw.communitydragon.org/pbe/preview.png",
  featureTags,
});

describe("TFT cosmetic catalog projection", () => {
  it("projects booms and portals as separate item namespaces with portal preview fallback", () => {
    const boomId = projectTftCosmetics([damageSkin], "booms", "pbe")[0]?.itemId;
    const portalWithSameId = projectTftCosmetics(
      [{ ...portal, itemId: damageSkin.itemId }],
      "portals",
      "pbe",
    )[0];
    expect(portalWithSameId?.itemId).toBe(boomId);

    expect(projectTftCosmetics([damageSkin], "booms", "pbe")).toEqual([
      expect.objectContaining({
        itemId: 194003,
        imageUrl: "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/boom_gwen.png",
        previewUrl: "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftdamageskins/boom_gwen.png",
        featureTags: [],
      }),
    ]);
    expect(projectTftCosmetics([portal], "portals", "latest")[0]).toMatchObject({
      itemId: 35,
      imageUrl: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/portal_small.png",
      previewUrl: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/portal.png",
    });
    expect(
      projectTftCosmetics([{ ...portal, largeLoadoutsIcon: undefined }], "portals", "pbe")[0]?.previewUrl,
    ).toBe("https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/assets/loadouts/tftzoomskins/portal_small.png");
  });

  it("joins feature display definitions by content ID and maps localized icon paths", () => {
    const contentRecords = [
      {
        TFTDamageSkin: {
          id: "boom-content",
          contentData: { featureTags: [
            { featureType: "kEvolvingBoom", type: "kFeature" },
            { featureType: "kTransformation", type: "kFeature" },
          ] },
        },
      },
      {
        TFTZoomSkin: {
          id: "portal-content",
          contentData: { featureTags: [{ featureType: "kIntroCutScene", type: "kFeature" }] },
        },
      },
      {
        TFTDamageSkin: {
          id: "unmapped-content",
          contentData: { featureTags: [{ featureType: "kUnknownFeature", type: "kFeature" }] },
        },
      },
      {
        TFTDamageSkin: {
          id: "shared-content",
          contentData: { featureTags: [{ featureType: "kEvolvingBoom", type: "kFeature" }] },
        },
        TFTZoomSkin: {
          id: "shared-content",
          contentData: { featureTags: [{ featureType: "kIntroCutScene", type: "kFeature" }] },
        },
      },
      ];
    const displayTags = [
      { TFTFeatureDisplayTag: { featureType: "kEvolvingBoom", name: "Evolving Boom", icon: "/lol-game-data/assets/ASSETS/UX/TFT/EvolvingBoom.png" } },
      { TFTFeatureDisplayTag: { featureType: "kTransformation", name: "Transformation", icon: "/lol-game-data/assets/ASSETS/UX/TFT/Transformation.png" } },
      { TFTFeatureDisplayTag: { featureType: "kIntroCutScene", name: "Intro Cut Scene", icon: "/lol-game-data/assets/ASSETS/UX/TFT/Intro.png" } },
    ];
    const boomTags = indexTftCosmeticFeatureTags(contentRecords, displayTags, "booms", "latest");
    const portalTags = indexTftCosmeticFeatureTags(contentRecords, displayTags, "portals", "latest");

    expect(boomTags.get("boom-content")).toEqual([
      { featureType: "kEvolvingBoom", name: "Evolving Boom", iconUrl: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tft/evolvingboom.png" },
      { featureType: "kTransformation", name: "Transformation", iconUrl: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tft/transformation.png" },
    ]);
    expect(portalTags.get("portal-content")).toEqual([
      { featureType: "kIntroCutScene", name: "Intro Cut Scene", iconUrl: "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/ux/tft/intro.png" },
    ]);
    expect(boomTags.has("unmapped-content")).toBe(false);
    expect(boomTags.get("shared-content")?.[0]?.featureType).toBe("kEvolvingBoom");
    expect(portalTags.get("shared-content")?.[0]?.featureType).toBe("kIntroCutScene");
  });

  it("matches localized feature labels by name and selected IDs", () => {
    const current = [cosmetic(1, "进化特效", "kMythic", [{ featureType: "kEvolvingBoom", name: "可进化型进攻特效", iconUrl: "/feature.png" }])];
    const aliases = [cosmetic(1, "Evolving Boom", "kMythic")];
    const searchable = addTftCosmeticSearchAliases(current, aliases);
    expect(filterTftCosmetics(searchable, { search: "evolving boom" }, "zh_cn")).toHaveLength(1);
    expect(filterTftCosmetics(searchable, { featureTypes: ["kEvolvingBoom"] }, "zh_cn")).toHaveLength(1);
  });

  it("allows any selected feature and intersects it with rarity and PBE filters", () => {
    const pbe = markPbeTftCosmeticAdditions(
      [
        cosmetic(10, "New Boom", "kMythic", [{ featureType: "kEvolvingBoom", name: "Evolving", iconUrl: "/evolving.png" }]),
        cosmetic(11, "New Portal", "kMythic", [{ featureType: "kIntroCutScene", name: "Intro", iconUrl: "/intro.png" }]),
        cosmetic(12, "Existing Portal", "kStandard", [{ featureType: "kIntroCutScene", name: "Intro", iconUrl: "/intro.png" }]),
      ],
      [cosmetic(12, "Changed Existing Portal", "kMythic")],
    );

    expect(filterTftCosmetics(pbe, {
      onlyPbeAdditions: true,
      TFTRarity: "kMythic",
      featureTypes: ["kEvolvingBoom", "kIntroCutScene"],
    }, "default").map(({ itemId }) => itemId)).toEqual([11, 10]);
  });

  it("keeps cosmetics usable without feature metadata and reports empty filter results", () => {
    const baseItems = projectTftCosmetics([damageSkin], "booms", "latest");
    expect(baseItems[0]?.featureTags).toEqual([]);
    expect(filterTftCosmetics(baseItems, {}, "default")).toHaveLength(1);
    expect(filterTftCosmetics(baseItems, { featureTypes: ["kEvolvingBoom"] }, "default")).toEqual([]);
    expect(filterTftCosmetics(baseItems, { search: "not found" }, "default")).toEqual([]);
  });

  it("rejects malformed rows, invalid asset paths, and duplicate IDs within a catalog", () => {
    expect(() => projectTftCosmetics({}, "booms", "pbe")).toThrow("must be an array");
    expect(() => projectTftCosmetics([damageSkin, damageSkin], "booms", "pbe")).toThrow("duplicate itemId");
    expect(() => projectTftCosmetics([{ ...damageSkin, loadoutsIcon: "/../unsafe.png" }], "booms", "pbe")).toThrow("invalid image path");
  });
});
