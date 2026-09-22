import { describe, expect, it, vi } from "vitest";
import {
  loadChromaRuntimeSupplement,
  type ChromaRuntimeSupplementView,
} from "./chroma-runtime";
import type {
  RuntimeChampion,
} from "../domain/communitydragon-runtime";
import { CommunityDragonRuntimeError } from "../domain/communitydragon-runtime";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";

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

function view(): ChromaRuntimeSupplementView & { events: string[] } {
  const events: string[] = [];
  return {
    events,
    invalid: vi.fn((message: string) => events.push(`invalid:${message}`)),
    loading: vi.fn(() => events.push("loading")),
    render: vi.fn(() => events.push("render")),
    failure: vi.fn(() => events.push("failure")),
  };
}

function runtime(get: CommunityDragonRuntime["get"]): CommunityDragonRuntime {
  return {
    get,
    list: vi.fn(async () => []),
    listSkinlineSkins: vi.fn(async () => []),
  };
}

describe("static chroma runtime supplement", () => {
  it("loads the related champion and verifies the exact parent skin and chroma", async () => {
    const service = runtime(vi.fn(async () => champion));
    const viewState = view();

    await expect(loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103001,
      chromaId: 103010,
      locale: "default",
      channel: "latest",
    })).resolves.toBe(true);

    expect(service.get).toHaveBeenCalledWith("champion", 103, expect.objectContaining({
      channel: "latest",
      locale: "default",
    }));
    expect(viewState.events).toEqual(["loading", "render"]);
    expect(viewState.render).toHaveBeenCalledWith({
      champion,
      sourceSkin: champion.skins[0],
      chroma: champion.skins[0].chromas?.[0],
    });
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
    const viewState = view();

    await expect(loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103002,
      chromaId: 103020,
      locale: "default",
      channel: "pbe",
    })).resolves.toBe(true);

    expect(viewState.render).toHaveBeenCalledWith({
      champion: runtimeChampion,
      sourceSkin: parentSkin,
      chroma: parentSkin.chromas[0],
    });
  });

  it("keeps the static page usable when the optional supplement fails", async () => {
    const service = runtime(vi.fn(async () => {
      throw new CommunityDragonRuntimeError("network", "offline");
    }));
    const viewState = view();

    await expect(loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103001,
      chromaId: 103010,
      locale: "zh_cn",
      channel: "pbe",
    })).resolves.toBe(false);

    expect(viewState.events).toEqual(["loading", "failure"]);
    expect(viewState.failure).toHaveBeenCalledWith(
      expect.objectContaining({ code: "network" }),
      expect.any(Function),
    );
  });

  it("rejects a source skin that does not belong to the current champion", async () => {
    const service = runtime(vi.fn(async () => ({ ...champion, skins: [] })));
    const viewState = view();

    await loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 999001,
      chromaId: 103010,
      locale: "default",
      channel: "pbe",
    });

    expect(viewState.failure).toHaveBeenCalledWith(
      expect.objectContaining({ code: "not-found" }),
      expect.any(Function),
    );
  });

  it("rejects a source skin when the requested chroma is not nested under it", async () => {
    const service = runtime(vi.fn(async () => champion));
    const viewState = view();

    await loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103001,
      chromaId: 999999,
      locale: "default",
      channel: "pbe",
    });

    expect(viewState.failure).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "not-found",
        message: expect.stringContaining("chroma 999999"),
      }),
      expect.any(Function),
    );
  });
});
