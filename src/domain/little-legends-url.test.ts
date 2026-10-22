import { describe, expect, it } from "vitest";
import {
  formatLittleLegendUrl,
  readLittleLegendUrlState,
} from "./little-legends-url";

describe("Little Legend URL state", () => {
  it("restores and formats all supported filters and the data channel", () => {
    const initial = new URL(
      "https://chromaart.lol/tft/companions/?q=Poro&companionType=kChibi&speciesId=7&TFTRarity=kPrestige&level=3&sort=stars_desc&pbeOnly=1&channel=latest",
    );
    const state = readLittleLegendUrlState(initial);

    expect(state).toEqual({
      search: "Poro",
      companionType: "kChibi",
      speciesId: 7,
      TFTRarity: "kPrestige",
      level: 3,
      sort: "stars_desc",
      onlyPbeAdditions: true,
      channel: "latest",
      channelExplicit: true,
      invalid: [],
    });
    expect(formatLittleLegendUrl(initial, state).href).toBe(initial.href);
    const sourceZeroId = readLittleLegendUrlState(
      new URL("https://chromaart.lol/tft/companions/?speciesId=0"),
    );
    expect(sourceZeroId.speciesId).toBe(0);
    expect(formatLittleLegendUrl(initial, sourceZeroId).search).toBe(
      "?speciesId=0",
    );
  });

  it("falls back to safe defaults and marks malformed filter values", () => {
    const state = readLittleLegendUrlState(
      new URL(
        "https://chromaart.lol/tft/companions/?q=one&q=two&companionType=unknown&companionType=kChibi&speciesId=9007199254740992&TFTRarity=unknown&sort=unknown&sort=name_asc&level=0&pbeOnly=yes&channel=https://example.com",
      ),
    );

    expect(state).toEqual({
      search: "",
      sort: "default",
      onlyPbeAdditions: false,
      channel: "pbe",
      channelExplicit: false,
      invalid: [
        "q",
        "companionType",
        "speciesId",
        "TFTRarity",
        "sort",
        "level",
        "pbeOnly",
        "channel",
      ],
    });
    expect(
      formatLittleLegendUrl(
        new URL("https://chromaart.lol/tft/companions/?channel=latest"),
        state,
      ).href,
    ).toBe("https://chromaart.lol/tft/companions/");
  });
});
