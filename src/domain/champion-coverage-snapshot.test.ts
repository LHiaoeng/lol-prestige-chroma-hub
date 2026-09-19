import { describe, expect, it } from "vitest";
import { parseChampionCoverageRepositorySnapshot } from "./champion-coverage-snapshot";

const validSnapshot = {
  schemaVersion: 1,
  source: {
    channel: "pbe",
    locales: ["default", "zh_cn"],
    urls: {
      default:
        "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-summary.json",
      zh_cn:
        "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json",
    },
    fetchedAt: "2026-09-20T00:00:00.000Z",
    contentVersion: "default:etag-a;zh_cn:etag-b",
  },
  snapshot: {
    patchVersion: "26.18",
    totalChampions: 1,
    coveredChampions: 0,
    missingChampions: 1,
    coveragePercent: 0,
    champions: [
      {
        id: "1",
        alias: "Annie",
        nameEn: "Annie",
        nameZh: "安妮",
        portraitUrl:
          "https://raw.communitydragon.org/pbe/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/1.png",
      },
    ],
  },
};

describe("champion coverage repository snapshot", () => {
  it("accepts the audited bilingual PBE envelope", () => {
    expect(parseChampionCoverageRepositorySnapshot(validSnapshot)).toEqual(
      validSnapshot,
    );
  });

  it("rejects incomplete counts, wrong channel, and untrusted source URLs", () => {
    expect(() =>
      parseChampionCoverageRepositorySnapshot({
        ...validSnapshot,
        snapshot: { ...validSnapshot.snapshot, missingChampions: 0 },
      }),
    ).toThrow(/counts/i);
    expect(() =>
      parseChampionCoverageRepositorySnapshot({
        ...validSnapshot,
        source: { ...validSnapshot.source, channel: "latest" },
      }),
    ).toThrow();
    expect(() =>
      parseChampionCoverageRepositorySnapshot({
        ...validSnapshot,
        source: {
          ...validSnapshot.source,
          urls: { ...validSnapshot.source.urls, default: "https://example.com" },
        },
      }),
    ).toThrow();
  });
});
