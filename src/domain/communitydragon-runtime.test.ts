import { describe, expect, it, vi } from "vitest";
import {
  CommunityDragonRuntimeError,
  parseRuntimeEntity,
  type CommunityDragonLocale,
  type RuntimeChannel,
  type RuntimeChampion,
} from "./communitydragon-runtime";
import {
  projectChampionSkinListItems,
  projectChampionSkinReferenceItems,
  projectSkinReferenceItems,
  sortSkinReferenceItems,
} from "./skin-reference-projection";
import { createCommunityDragonRuntime } from "../client/communitydragon-runtime";

const summary = (locale: CommunityDragonLocale, channel: RuntimeChannel) => [
  {
    id: 103,
    name: locale === "default" ? "Ahri" : "九尾妖狐",
    title: locale === "default" ? "the Nine-Tailed Fox" : "阿狸",
    shortBio: locale === "default" ? "A vastayan fox." : "一名瓦斯塔亚狐妖。",
    squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/103.png",
    roles: ["mage", "assassin"],
    channel,
  },
];

const champion = (locale: CommunityDragonLocale) => ({
  id: 103,
  name: locale === "default" ? "Ahri" : "九尾妖狐",
  title: locale === "default" ? "the Nine-Tailed Fox" : "阿狸",
  shortBio: locale === "default" ? "A vastayan fox." : "一名瓦斯塔亚狐妖。",
  squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/103.png",
  roles: ["mage", "assassin"],
  skins: [
    {
      id: 103000,
      name: locale === "default" ? "Ahri" : "阿狸",
      isBase: true,
      splashPath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Base/Ahri_Splash.jpg",
    },
    {
      id: 103001,
      name: locale === "default" ? "Dynasty Ahri" : "玉狐",
      isBase: false,
      splashPath:
        "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/Ahri_Splash.jpg",
      skinLines: [{ id: 7 }],
      questSkinInfo: {
        tiers: [
          {
            id: 103002,
            stage: 2,
            name: "Dynasty Ahri · Stage 2",
            splashPath:
              "/lol-game-data/assets/ASSETS/Characters/Ahri/Skins/Skin01/Stage2.jpg",
          },
        ],
      },
      chromas: [],
    },
  ],
});

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("CommunityDragon runtime reference", () => {
  it("lists only the requested locale and channel", async () => {
    const fetcher = vi.fn(async (input: string, _init?: RequestInit) =>
      jsonResponse(
        summary(
          input.includes("/zh_cn/") ? "zh_cn" : "default",
          input.includes("/latest/") ? "latest" : "pbe",
        ),
      ),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    const result = await runtime.list("champions", {
      locale: "zh_cn",
      channel: "latest",
    });

    expect(result[0]).toMatchObject({ id: 103, name: "阿狸", title: "九尾妖狐" });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  });

  it("normalizes the live champion summary shape and skips its placeholder row", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse([
        {
          id: -1,
          name: "None",
          description: "",
          alias: "None",
          squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/-1.png",
        },
        {
          id: 103,
          name: "Ahri",
          description: "the Nine-Tailed Fox",
          alias: "Ahri",
          squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/103.png",
          roles: ["mage", "assassin"],
        },
        {
          id: 60103,
          name: "Ahri",
          description: "the Nine-Tailed Fox",
          alias: "Jade_Ahri",
          squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/60103.png",
        },
      ]),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.list("champions", { locale: "default", channel: "pbe" }),
    ).resolves.toMatchObject([
      {
        id: 103,
        name: "Ahri",
        title: "the Nine-Tailed Fox",
        roles: ["mage", "assassin"],
      },
    ]);
  });

  it("deduplicates in-flight requests by channel, locale, and resource", async () => {
    let resolveResponse!: (response: Response) => void;
    const response = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetcher = vi.fn(() => response);
    const runtime = createCommunityDragonRuntime(fetcher);

    const first = runtime.list("champions", { locale: "default" });
    const second = runtime.list("champions", { locale: "default" });
    resolveResponse(jsonResponse(summary("default", "pbe")));

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("uses the champion hint for a skin and validates the returned skin identity", async () => {
    const fetcher = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse(champion("default")),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    const result = await runtime.get("skin", 103001, {
      locale: "default",
      championId: 103,
    });

    expect(result).toMatchObject({
      kind: "skin",
      id: 103001,
      championId: 103,
      name: "Dynasty Ahri",
    });
    expect(result).toMatchObject({
      stages: [
        {
          id: 103002,
          stageIndex: 2,
          name: "Dynasty Ahri · Stage 2",
        },
      ],
    });
    expect(fetcher.mock.calls[0][0]).toContain("/champions/103.json");
    expect(fetcher.mock.calls[0][0]).not.toContain("skins.json");
  });

  it("keeps every valid stage ID without inventing a missing stage name", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...champion("default"),
        skins: [
          {
            ...champion("default").skins[1],
            questSkinInfo: {
              tiers: [
                { id: 103010, stage: 2, name: "Ascended Ahri" },
                { id: 103011, stage: 3 },
                { stage: 4, name: "No identity" },
                { id: 0, stage: 5, name: "Invalid ID" },
              ],
            },
          },
        ],
      }),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("skin", 103001, {
        locale: "default",
        championId: 103,
      }),
    ).resolves.toMatchObject({
      stages: [
        { id: 103010, name: "Ascended Ahri", stageIndex: 2 },
        { id: 103011, stageIndex: 3 },
      ],
    });
  });

  it("normalizes locale-specific rarity, complete media, history, and chroma colors", () => {
    const raw = {
      ...champion("default"),
      skins: [
        {
          id: 103001,
          name: "Dynasty Ahri",
          isBase: false,
          rarity: "kLegendary",
          regionRarityId: 5,
          rarityGemPath: "/lol-game-data/assets/v1/rarity-gem-icons/5_large.png",
          splashPath: "/lol-game-data/assets/splash.jpg",
          uncenteredSplashPath: "/lol-game-data/assets/uncentered.jpg",
          tilePath: "/lol-game-data/assets/tile.jpg",
          loadScreenPath: "/lol-game-data/assets/load.jpg",
          loadScreenVintagePath: "/lol-game-data/assets/load-vintage.jpg",
          splashVideoPath: "/lol-game-data/assets/splash.webm",
          previewVideoUrl: "/lol-game-data/assets/preview.webm",
          collectionSplashVideoPath: "/lol-game-data/assets/collection.webm",
          collectionCardHoverVideoPath: "/lol-game-data/assets/card.webm",
          historicalVersions: [
            { version: "14.1", splashPath: "/lol-game-data/assets/old.jpg" },
          ],
          skinLines: [{ id: 7 }],
          chromas: [
            {
              id: 103051,
              name: "Dynasty Ahri (Ruby)",
              chromaPath: "/lol-game-data/assets/ruby.png",
              colors: ["#ff0000", "#FF0000", "#00FF00"],
            },
          ],
        },
      ],
    };

    expect(parseRuntimeEntity("skin", 103001, raw, {
      locale: "default",
      channel: "latest",
      championId: 103,
    })).toMatchObject({
      rarity: {
        key: "kLegendary",
        label: "Legendary",
        iconUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/legendary.png",
      },
      media: {
        focusedSplashUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/splash.jpg",
        loadScreenVintageUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/load-vintage.jpg",
        previewVideoUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/preview.webm",
        collectionSplashVideoUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/collection.webm",
        collectionCardHoverVideoUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/card.webm",
      },
      historicalArt: [
        {
          version: "14.1",
          media: {
            focusedSplashUrl:
              "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/old.jpg",
          },
        },
      ],
      chromas: [{ colors: ["#FF0000", "#00FF00"] }],
    });

    expect(parseRuntimeEntity("skin", 103001, raw, {
      locale: "zh_cn",
      channel: "latest",
      championId: 103,
    })).toMatchObject({
      rarity: {
        id: 5,
        label: "传说",
        iconUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/cn-gem-5.png",
      },
    });
    expect(parseRuntimeEntity("skin", 103001, raw, {
      locale: "zh_cn",
      channel: "latest",
      championId: 103,
    })).not.toHaveProperty("rarity.key");
  });

  it("keeps the Chinese rarity badge family separate from global rarity icons", () => {
    const raw = {
      ...champion("default"),
      skins: [
        {
          ...champion("default").skins[1],
          rarity: "kLegendary",
          regionRarityId: 7,
          rarityGemPath: "/lol-game-data/assets/v1/rarity-gem-icons/7_large.png",
        },
      ],
    };

    expect(
      parseRuntimeEntity("skin", 103001, raw, {
        locale: "zh_cn",
        channel: "latest",
        championId: 103,
      }),
    ).toMatchObject({
      rarity: {
        id: 7,
        label: "限定",
        iconUrl:
          "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/rarity-gem-icons/cn-gem-7.png",
      },
    });
  });

  it("projects the owning skin and stages with stable targets and allowed inheritance", () => {
    const skin = parseRuntimeEntity("skin", 103001, {
      ...champion("default"),
      skins: [
        {
          ...champion("default").skins[1],
          description: "Owner description",
          rarity: "kEpic",
          skinLines: [{ id: 7 }],
          universeIds: [200],
          questSkinInfo: {
            tiers: [
              {
                id: 103003,
                stage: 2,
                name: "Second form",
                tilePath: "/lol-game-data/assets/ASSETS/stage-2-tile.jpg",
                chromas: [
                  {
                    id: 103053,
                    name: "Stage chroma",
                    colors: ["#AABBCC"],
                  },
                ],
              },
              {
                id: 103002,
                stage: 1,
                name: "First form",
                description: "Stage description",
              },
            ],
          },
        },
      ],
    }, {
      locale: "default",
      championId: 103,
    }) as Extract<ReturnType<typeof parseRuntimeEntity>, { kind: "skin" }>;

    expect(projectSkinReferenceItems(skin)).toMatchObject([
      {
        kind: "skin",
        id: 103001,
        target: { championId: 103, skinId: 103001 },
        name: "Dynasty Ahri",
        rarity: { key: "kEpic" },
        skinlineIds: [7],
        universeIds: [200],
      },
      {
        kind: "stage",
        id: 103001,
        stageId: 103002,
        target: { championId: 103, skinId: 103001, stageId: 103002 },
        name: "First form",
        description: "Stage description",
        rarity: { key: "kEpic" },
        skinlineIds: [7],
        universeIds: [200],
      },
      {
        kind: "stage",
        id: 103001,
        stageId: 103003,
        target: { championId: 103, skinId: 103001, stageId: 103003 },
        name: "Second form",
        description: "Owner description",
        rarity: { key: "kEpic" },
        media: { tileUrl: expect.stringContaining("stage-2-tile.jpg") },
        chromas: [{ colors: ["#AABBCC"] }],
      },
    ]);
  });

  it("projects a champion's skins and stages with the champion identity", () => {
    const result = parseRuntimeEntity(
      "champion",
      103,
      champion("default"),
      { locale: "default", championId: 103 },
    ) as RuntimeChampion;

    expect(projectChampionSkinReferenceItems(result.id, result.skins)).toMatchObject([
      {
        stableKey: "103:103000",
        target: { championId: 103, skinId: 103000 },
      },
      {
        stableKey: "103:103001",
        target: { championId: 103, skinId: 103001 },
      },
      {
        stableKey: "103:103001:stage:103002",
        target: { championId: 103, skinId: 103001, stageId: 103002 },
      },
    ]);
  });

  it("deduplicates champion skin cards and keeps quest stages out of the grid", () => {
    const result = parseRuntimeEntity(
      "champion",
      103,
      champion("default"),
      { locale: "default", championId: 103 },
    ) as RuntimeChampion;

    expect(
      projectChampionSkinListItems(result.id, [
        ...result.skins,
        result.skins[1],
      ]),
    ).toMatchObject([
      { stableKey: "103:103000", kind: "skin" },
      { stableKey: "103:103001", kind: "skin" },
    ]);
    expect(
      projectChampionSkinReferenceItems(result.id, [
        result.skins[1],
        result.skins[1],
      ]),
    ).toHaveLength(2);
  });

  it("sorts champion skin references by rarity while preserving stable ties", () => {
    const result = parseRuntimeEntity(
      "champion",
      103,
      champion("default"),
      { locale: "default", championId: 103 },
    ) as RuntimeChampion;
    const items = projectChampionSkinReferenceItems(result.id, result.skins);
    const sortableItems = items.map((item) =>
      item.skinId === 103001
        ? { ...item, rarity: { key: "kLegendary" } }
        : item,
    );

    expect(
      sortSkinReferenceItems(sortableItems, "rarity").map(
        (item) => item.stableKey,
      ),
    ).toEqual([
      "103:103001",
      "103:103001:stage:103002",
      "103:103000",
    ]);
    expect(sortSkinReferenceItems(items, "release")).toBe(items);
  });

  it("rejects a duplicate stage identity instead of guessing which stage to open", () => {
    expect(() =>
      parseRuntimeEntity("skin", 103001, {
        ...champion("default"),
        skins: [
          {
            ...champion("default").skins[1],
            questSkinInfo: {
              tiers: [
                { id: 103002, stage: 1, name: "First" },
                { id: 103002, stage: 2, name: "Duplicate" },
              ],
            },
          },
        ],
      }, {
        locale: "default",
        championId: 103,
      }),
    ).toThrow(CommunityDragonRuntimeError);
  });

  it("resolves a stage target from its parent skin response without another request", async () => {
    const fetcher = vi.fn(async () => jsonResponse(champion("default")));
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("skin", 103001, {
        locale: "default",
        championId: 103,
        stageId: 103002,
      }),
    ).resolves.toMatchObject({
      id: 103001,
      stageId: 103002,
      name: "Dynasty Ahri · Stage 2",
      media: { focusedSplashUrl: expect.stringContaining("stage2.jpg") },
    });
    expect(fetcher).toHaveBeenCalledOnce();

    await expect(
      runtime.get("skin", 103001, {
        locale: "default",
        championId: 103,
        stageId: 999999,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("opens a valid unnamed stage without fabricating a player-facing name", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...champion("default"),
        skins: [
          {
            ...champion("default").skins[1],
            questSkinInfo: { tiers: [{ id: 103011, stage: 3 }] },
          },
        ],
      }),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("skin", 103001, {
        locale: "default",
        championId: 103,
        stageId: 103011,
      }),
    ).resolves.toMatchObject({
      stageId: 103011,
      name: undefined,
      description: undefined,
    });
  });

  it("validates champion detail identity against the requested ID", async () => {
    const fetcher = vi.fn(async (_input: string) =>
      jsonResponse({ ...champion("default"), id: 104 }),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("champion", 103, { locale: "default", channel: "latest" }),
    ).rejects.toMatchObject({ code: "schema" });
    expect(fetcher.mock.calls[0][0]).toContain("/champions/103.json");
  });

  it("accepts nullable fields used by live champion detail responses", async () => {
    const raw = champion("default");
    const fetcher = vi.fn(async () =>
      jsonResponse({
        ...raw,
        skins: [
          {
            ...raw.skins[0],
            description: null,
            skinLines: null,
            chromas: null,
            splashVideoPath: null,
          },
        ],
      }),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("champion", 103, { locale: "default", channel: "pbe" }),
    ).resolves.toMatchObject({
      kind: "champion",
      id: 103,
      skins: [{ id: 103000, skinlineIds: [], chromas: [] }],
    });
  });

  it("skips zero-valued placeholder rows in relation directories", async () => {
    const runtime = createCommunityDragonRuntime(
      vi.fn(async (input: string) =>
        jsonResponse(
          input.includes("skinlines")
            ? [
                { id: 0, name: "", description: "" },
                { id: 7, name: "Star Guardian", description: "" },
              ]
            : [
                { id: 0, name: "", description: "", skinSets: [] },
                { id: 200, name: "Star Guardian", description: "", skinSets: [7] },
              ],
        ),
      ),
    );

    await expect(
      runtime.list("skinlines", { locale: "default", channel: "pbe" }),
    ).resolves.toMatchObject([{ id: 7, name: "Star Guardian" }]);
    await expect(
      runtime.list("universes", { locale: "default", channel: "pbe" }),
    ).resolves.toMatchObject([{ id: 200, name: "Star Guardian", skinlineIds: [7] }]);
  });

  it("rejects a skin request without a safe champion hint before fetching", async () => {
    const fetcher = vi.fn(async (_input: string, _init?: RequestInit) =>
      jsonResponse({}),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    await expect(
      runtime.get("skin", 103001, { locale: "default" }),
    ).rejects.toMatchObject({ code: "invalid-request" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("keeps a missing localized field missing instead of borrowing another locale", async () => {
    const fetcher = vi.fn(async () =>
      jsonResponse([{ id: 7, name: "Star Guardian", description: "" }]),
    );
    const runtime = createCommunityDragonRuntime(fetcher);

    const result = await runtime.get("skinline", 7, { locale: "zh_cn" });

    expect(result).toMatchObject({ id: 7, name: "Star Guardian" });
    expect((result as { description?: string }).description).toBeUndefined();
  });

  it("rejects malformed collection entries and skin relationship IDs", async () => {
    const malformedCollection = createCommunityDragonRuntime(
      vi.fn(async () => jsonResponse([{ id: 7, name: "Star Guardian" }, null])),
    );
    await expect(
      malformedCollection.list("skinlines", { locale: "default" }),
    ).rejects.toMatchObject({ code: "schema" });

    const malformedSkin = createCommunityDragonRuntime(
      vi.fn(async () =>
        jsonResponse({
          ...champion("default"),
          skins: [{
            id: 103001,
            name: "Dynasty Ahri",
            skinLines: [{ id: 0 }],
          }],
        }),
      ),
    );
    await expect(
      malformedSkin.get("skin", 103001, {
        locale: "default",
        championId: 103,
      }),
    ).rejects.toMatchObject({ code: "schema" });
  });

  it("classifies unsafe asset paths without requesting a fallback resource", async () => {
    const runtime = createCommunityDragonRuntime(
      vi.fn(async () =>
        jsonResponse([
          {
            id: 7,
            name: "Star Guardian",
            imagePath: "https://example.com/unsafe.png",
          },
        ]),
      ),
    );

    await expect(
      runtime.list("skinlines", { locale: "default", channel: "latest" }),
    ).rejects.toMatchObject({ code: "unsafe-url" });
  });

  it("classifies not found, HTTP, schema, and abort failures", async () => {
    const notFoundRuntime = createCommunityDragonRuntime(
      vi.fn(async () => jsonResponse({}, 404)),
    );
    await expect(
      notFoundRuntime.list("champions", { locale: "default" }),
    ).rejects.toMatchObject({ code: "not-found" });

    const httpRuntime = createCommunityDragonRuntime(
      vi.fn(async () => jsonResponse({}, 503)),
    );
    await expect(
      httpRuntime.list("champions", { locale: "default" }),
    ).rejects.toMatchObject({ code: "http", status: 503 });

    const schemaRuntime = createCommunityDragonRuntime(
      vi.fn(async () => jsonResponse([{ id: -1, name: "" }])),
    );
    await expect(
      schemaRuntime.list("champions", { locale: "default" }),
    ).rejects.toMatchObject({ code: "schema" });

    const controller = new AbortController();
    controller.abort();
    const abortedRuntime = createCommunityDragonRuntime(vi.fn());
    await expect(
      abortedRuntime.list("champions", {
        locale: "default",
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(CommunityDragonRuntimeError);
  });
});
