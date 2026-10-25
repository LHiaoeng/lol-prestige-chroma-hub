import { describe, expect, it } from "vitest";
import {
  formatTftCompanionUrl,
  readTftCompanionUrlState,
} from "./tft-companions-url";

describe("Little Legend URL state", () => {
  it("restores and formats all supported filters and the data channel", () => {
    const initial = new URL(
      "https://chromaart.lol/tft/companions/?q=Poro&companionType=kChibi&speciesId=7&TFTRarity=kPrestige&level=3&sort=stars_desc&pbeOnly=1&channel=latest",
    );
    const state = readTftCompanionUrlState(initial);

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
    expect(formatTftCompanionUrl(initial, state).href).toBe(initial.href);
    const sourceZeroId = readTftCompanionUrlState(
      new URL("https://chromaart.lol/tft/companions/?speciesId=0"),
    );
    expect(sourceZeroId.speciesId).toBe(0);
    expect(formatTftCompanionUrl(initial, sourceZeroId).search).toBe(
      "?speciesId=0",
    );
  });

  it("falls back to safe defaults and marks malformed filter values", () => {
    const state = readTftCompanionUrlState(
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
      formatTftCompanionUrl(
        new URL("https://chromaart.lol/tft/companions/?channel=latest"),
        state,
      ).href,
    ).toBe("https://chromaart.lol/tft/companions/");
  });
});
