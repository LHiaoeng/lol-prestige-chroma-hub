import { describe, expect, it } from "vitest";
import { formatTftCosmeticUrl, readTftCosmeticUrlState } from "./tft-cosmetics-url";

describe("TFT cosmetic directory URL state", () => {
  it("restores search, rarity, multi-select features, PBE additions, and drops the retired list view", () => {
    const state = readTftCosmeticUrlState(new URL(
      "https://example.test/tft/booms/?q=rose&TFTRarity=kMythic&featureType=kEvolvingBoom&featureType=kIntroCutScene&pbeOnly=1&view=list",
    ));
    expect(state).toMatchObject({
      search: "rose",
      TFTRarity: "kMythic",
      featureTypes: ["kEvolvingBoom", "kIntroCutScene"],
      onlyPbeAdditions: true,
      channel: "pbe",
    });
    expect(formatTftCosmeticUrl(new URL("https://example.test/tft/booms/"), state).search).toBe(
      "?q=rose&TFTRarity=kMythic&featureType=kEvolvingBoom&featureType=kIntroCutScene&pbeOnly=1",
    );
  });

  it("round-trips a single positive star level and clears invalid values", () => {
    const route = "https://example.test/tft/booms/";
    const state = readTftCosmeticUrlState(new URL(route + "?level=2"));
    expect(state.level).toBe(2);
    expect(formatTftCosmeticUrl(new URL(route), state).search).toBe("?level=2");
    for (const query of ["level=0", "level=1&level=2", "level=2.5"])
      expect(readTftCosmeticUrlState(new URL(route + "?" + query)).invalid).toContain("level");
  });

  it("clears malformed and duplicate singleton parameters", () => {
    const state = readTftCosmeticUrlState(new URL(
      "https://example.test/tft/portals/?TFTRarity=unknown&featureType=unsafe&sort=bad&view=unknown&channel=bad",
    ));
    expect(state.invalid).toEqual(["TFTRarity", "featureType", "sort", "channel"]);
    expect(state.featureTypes).toEqual([]);
    expect(state.channel).toBe("pbe");
  });
});
