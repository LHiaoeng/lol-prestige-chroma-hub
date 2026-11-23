import { describe, expect, it } from "vitest";
import { formatTftCosmeticUrl, readTftCosmeticUrlState } from "./tft-cosmetics-url";

describe("TFT cosmetic directory URL state", () => {
  it("restores search, rarity, multi-select features, PBE additions, and list view", () => {
    const state = readTftCosmeticUrlState(new URL(
      "https://example.test/tft/booms/?q=rose&TFTRarity=kMythic&featureType=kEvolvingBoom&featureType=kIntroCutScene&pbeOnly=1&view=list",
    ));
    expect(state).toMatchObject({
      search: "rose",
      TFTRarity: "kMythic",
      featureTypes: ["kEvolvingBoom", "kIntroCutScene"],
      onlyPbeAdditions: true,
      channel: "pbe",
      view: "list",
    });
    expect(formatTftCosmeticUrl(new URL("https://example.test/tft/booms/"), state).search).toBe(
      "?q=rose&TFTRarity=kMythic&featureType=kEvolvingBoom&featureType=kIntroCutScene&pbeOnly=1&view=list",
    );
  });

  it("clears malformed and duplicate singleton parameters", () => {
    const state = readTftCosmeticUrlState(new URL(
      "https://example.test/tft/portals/?TFTRarity=unknown&featureType=unsafe&sort=bad&view=unknown&channel=bad",
    ));
    expect(state.invalid).toEqual(["TFTRarity", "featureType", "sort", "channel", "view"]);
    expect(state.featureTypes).toEqual([]);
    expect(state.channel).toBe("pbe");
  });
});
