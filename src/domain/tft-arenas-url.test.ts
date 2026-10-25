import { describe, expect, it } from "vitest";
import { formatTftArenaUrl, readTftArenaUrlState } from "./tft-arenas-url";

describe("TFT arena URL state", () => {
  it("restores and shares the channel, search, group, rarity, sort, and PBE filter", () => {
    const url = new URL("https://chromaart.lol/tft/arenas/?q=Pengu&groupId=0&TFTRarity=kMythic&sort=id_asc&pbeOnly=1&channel=pbe");
    const state = readTftArenaUrlState(url);

    expect(state).toEqual({
      search: "Pengu",
      groupId: 0,
      TFTRarity: "kMythic",
      sort: "id_asc",
      onlyPbeAdditions: true,
      channel: "pbe",
      channelExplicit: true,
      invalid: [],
    });
    expect(formatTftArenaUrl(url, state).href).toBe(url.href);
  });

  it("clears malformed parameters and never carries an arbitrary source into a shared URL", () => {
    const url = new URL("https://chromaart.lol/zh-cn/tft/arenas/?q=one&q=two&groupId=-1&TFTRarity=unknown&sort=bad&sort=id_asc&pbeOnly=yes&channel=https://example.com&source=https://example.com");
    const state = readTftArenaUrlState(url);

    expect(state).toEqual({
      search: "",
      sort: "default",
      onlyPbeAdditions: false,
      channel: "pbe",
      channelExplicit: false,
      invalid: ["q", "groupId", "TFTRarity", "sort", "pbeOnly", "channel"],
    });
    expect(formatTftArenaUrl(url, state).href).toBe("https://chromaart.lol/zh-cn/tft/arenas/");
  });
});
