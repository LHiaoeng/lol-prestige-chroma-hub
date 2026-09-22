import { describe, expect, it, vi } from "vitest";
import {
  createChromaRuntimeLifecycle,
  loadChromaRuntimeSupplement,
  type ChromaRuntimeSupplementView,
} from "./chroma-runtime";
import type { RuntimeChampion } from "../domain/communitydragon-runtime";
import { CommunityDragonRuntimeError } from "../domain/communitydragon-runtime";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";
import type { RuntimeChannelHistory } from "./runtime-channel-lifecycle";

const champion: RuntimeChampion = {
  kind: "champion",
  id: 103,
  name: "Ahri",
  skins: [
    {
      id: 103001,
      name: "Dynasty Ahri",
      isBase: true,
      skinlineIds: [],
      media: {},
      stages: [],
      chromas: [
        {
          id: 103010,
          name: "Dynasty Ahri Ruby",
          imageUrl: "https://example.test/dynasty-ahri-ruby.png",
          colors: ["#c23b4a"],
        },
      ],
    },
  ],
};

function runtime(get: CommunityDragonRuntime["get"]): CommunityDragonRuntime {
  return {
    get,
    list: vi.fn(async () => []),
    listSkinlineSkins: vi.fn(async () => []),
  };
}

function history(initial: string): RuntimeChannelHistory & { readonly pushes: string[] } {
  let current = new URL(initial);
  const result = {
    pushes: [] as string[],
    get url() {
      return new URL(current);
    },
    push(url: URL) {
      current = new URL(url);
      result.pushes.push(url.href);
    },
    replace(url: URL) {
      current = new URL(url);
    },
    onPopState() {
      return () => undefined;
    },
  };
  return result;
}

describe("static chroma runtime supplement", () => {
  it("loads the related champion and verifies the exact parent skin and chroma", async () => {
    const service = runtime(vi.fn(async () => champion));

    await expect(
      loadChromaRuntimeSupplement(service, {
        championId: 103,
        sourceSkinId: 103001,
        chromaId: 103010,
        locale: "default",
        channel: "latest",
      }),
    ).resolves.toEqual({
      champion,
      sourceSkin: champion.skins[0],
      chroma: champion.skins[0].chromas?.[0],
    });

    expect(service.get).toHaveBeenCalledWith(
      "champion",
      103,
      expect.objectContaining({
        channel: "latest",
        locale: "default",
      }),
    );
  });

  it("accepts a non-default parent skin when its nested chroma matches", async () => {
    const parentSkin = {
      ...champion.skins[0],
      id: 103002,
      name: "Star Guardian Ahri",
      isBase: false,
      chromas: [{ id: 103020, name: "Star Guardian Ahri Ruby" }],
    };
    const runtimeChampion = { ...champion, skins: [parentSkin] };
    const service = runtime(vi.fn(async () => runtimeChampion));

    await expect(
      loadChromaRuntimeSupplement(service, {
        championId: 103,
        sourceSkinId: 103002,
        chromaId: 103020,
        locale: "default",
        channel: "pbe",
      }),
    ).resolves.toEqual({
      champion: runtimeChampion,
      sourceSkin: parentSkin,
      chroma: parentSkin.chromas[0],
    });
  });

  it("keeps the static page usable when the optional supplement fails", async () => {
    const service = runtime(
      vi.fn(async () => {
        throw new CommunityDragonRuntimeError("network", "offline");
      }),
    );

    await expect(
      loadChromaRuntimeSupplement(service, {
        championId: 103,
        sourceSkinId: 103001,
        chromaId: 103010,
        locale: "zh_cn",
        channel: "pbe",
      }),
    ).rejects.toMatchObject({ code: "network" });
  });

  it("rejects a source skin that does not belong to the current champion", async () => {
    const service = runtime(vi.fn(async () => ({ ...champion, skins: [] })));

    await expect(
      loadChromaRuntimeSupplement(service, {
        championId: 103,
        sourceSkinId: 999001,
        chromaId: 103010,
        locale: "default",
        channel: "pbe",
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("rejects a source skin when the requested chroma is not nested under it", async () => {
    const service = runtime(vi.fn(async () => champion));

    await expect(
      loadChromaRuntimeSupplement(service, {
        championId: 103,
        sourceSkinId: 103001,
        chromaId: 999999,
        locale: "default",
        channel: "pbe",
      }),
    ).rejects.toMatchObject({
      code: "not-found",
      message: expect.stringContaining("chroma 999999"),
    });
  });

  it("uses the shared lifecycle contract for loading, failure, and retry", async () => {
    const navigation = history("https://chromaart.lol/chromas/ahri/");
    let latestAttempts = 0;
    let rejectLatest!: (error: unknown) => void;
    const latest = new Promise<RuntimeChampion>((_, reject) => {
      rejectLatest = reject;
    });
    const service = runtime(
      vi.fn(async (_kind, _id, options) => {
        if (options.channel === "latest" && latestAttempts++ === 0)
          return latest;
        return champion;
      }),
    );
    let retry: (() => void) | undefined;
    const view: ChromaRuntimeSupplementView = {
      loading: vi.fn(),
      render: vi.fn(),
      invalid: vi.fn(),
      failure: vi.fn((_error, callback) => {
        retry = callback;
      }),
    };
    const lifecycle = createChromaRuntimeLifecycle({
      runtime: service,
      history: navigation,
      view,
      championId: 103,
      sourceSkinId: 103001,
      chromaId: 103010,
      locale: "default",
    });

    await lifecycle.start();
    const changing = lifecycle.navigate(
      new URL("https://chromaart.lol/chromas/ahri/?channel=latest"),
    );
    rejectLatest(new CommunityDragonRuntimeError("network", "offline"));
    await changing;

    expect(navigation.pushes).toEqual([]);
    expect(retry).toBeDefined();
    retry!();
    await vi.waitFor(() =>
      expect(navigation.pushes).toEqual([
        "https://chromaart.lol/chromas/ahri/?channel=latest",
      ]),
    );
    expect(service.get).toHaveBeenCalledTimes(3);
  });
});
