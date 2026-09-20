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
  return { get, list: vi.fn(async () => []) };
}

describe("static chroma runtime supplement", () => {
  it("loads the related champion and verifies the exact base skin", async () => {
    const service = runtime(vi.fn(async () => champion));
    const viewState = view();

    await expect(loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103001,
      locale: "default",
      channel: "latest",
    })).resolves.toBe(true);

    expect(service.get).toHaveBeenCalledWith("champion", 103, expect.objectContaining({
      channel: "latest",
      locale: "default",
    }));
    expect(viewState.events).toEqual(["loading", "render"]);
  });

  it("keeps the static page usable when the optional supplement fails", async () => {
    const service = runtime(vi.fn(async () => {
      throw new CommunityDragonRuntimeError("network", "offline");
    }));
    const viewState = view();

    await expect(loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 103001,
      locale: "zh_cn",
      channel: "pbe",
    })).resolves.toBe(false);

    expect(viewState.events).toEqual(["loading", "failure"]);
    expect(viewState.failure).toHaveBeenCalledWith(
      expect.objectContaining({ code: "network" }),
      expect.any(Function),
    );
  });

  it("rejects a related skin that is not the requested base skin", async () => {
    const service = runtime(vi.fn(async () => ({ ...champion, skins: [] })));
    const viewState = view();

    await loadChromaRuntimeSupplement(service, viewState, {
      championId: 103,
      sourceSkinId: 999001,
      locale: "default",
      channel: "pbe",
    });

    expect(viewState.failure).toHaveBeenCalledWith(
      expect.objectContaining({ code: "not-found" }),
      expect.any(Function),
    );
  });
});
