import { describe, expect, it, vi } from "vitest";
import {
  CommunityDragonRuntimeError,
  createCommunityDragonRuntime,
  type CommunityDragonLocale,
  type RuntimeChannel,
} from "./communitydragon-runtime";

const summary = (locale: CommunityDragonLocale, channel: RuntimeChannel) => [
  {
    id: 103,
    name: locale === "default" ? "Ahri" : "阿狸",
    title: locale === "default" ? "the Nine-Tailed Fox" : "九尾妖狐",
    shortBio: locale === "default" ? "A vastayan fox." : "一名瓦斯塔亚狐妖。",
    squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/103.png",
    channel,
  },
];

const champion = (locale: CommunityDragonLocale) => ({
  id: 103,
  name: locale === "default" ? "Ahri" : "阿狸",
  title: locale === "default" ? "the Nine-Tailed Fox" : "九尾妖狐",
  shortBio: locale === "default" ? "A vastayan fox." : "一名瓦斯塔亚狐妖。",
  squarePortraitPath: "/lol-game-data/assets/v1/champion-icons/103.png",
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

    expect(result[0]).toMatchObject({ id: 103, name: "阿狸" });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0][0]).toBe(
      "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/champion-summary.json",
    );
    expect(fetcher.mock.calls[0][1]).toMatchObject({
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
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
    expect(fetcher.mock.calls[0][0]).toContain("/champions/103.json");
    expect(fetcher.mock.calls[0][0]).not.toContain("skins.json");
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
