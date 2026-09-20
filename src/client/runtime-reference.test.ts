import { describe, expect, it, vi } from "vitest";
import {
  RuntimeController,
  runtimeFailureMessage,
  parseRuntimeLocation,
  type RuntimeHistory,
  type RuntimeView,
} from "./runtime-reference";
import type {
  RuntimeEntity,
  RuntimeList,
} from "../domain/communitydragon-runtime";
import { CommunityDragonRuntimeError } from "../domain/communitydragon-runtime";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";

const champion = {
  kind: "champion" as const,
  id: 103,
  name: "Ahri",
  skins: [],
};
const summary = [champion] as RuntimeList;

function history(initial: string): RuntimeHistory & {
  pushes: string[];
  replaces: string[];
  emitPopstate: () => void;
} {
  let current = new URL(initial);
  const popstate = new Set<() => void>();
  const result = {
    pushes: [] as string[],
    replaces: [] as string[],
    get url() {
      return new URL(current);
    },
    push(url: URL) {
      current = new URL(url);
      result.pushes.push(url.toString());
    },
    replace(url: URL) {
      current = new URL(url);
      result.replaces.push(url.toString());
    },
    onPopState(listener: () => void) {
      popstate.add(listener);
      return () => popstate.delete(listener);
    },
    emitPopstate() {
      popstate.forEach((listener) => listener());
    },
  };
  return result;
}

function view(): RuntimeView & {
  events: string[];
  rendered?: RuntimeList | RuntimeEntity;
  retry?: () => void;
} {
  const result = {
    events: [] as string[],
    rendered: undefined as RuntimeList | RuntimeEntity | undefined,
    retry: undefined as (() => void) | undefined,
    loading: vi.fn((preserve: boolean) =>
      result.events.push(`loading:${preserve}`),
    ),
    renderList: vi.fn((items: RuntimeList) => {
      result.rendered = items;
      result.events.push("list");
    }),
    renderDetail: vi.fn((item: RuntimeEntity) => {
      result.rendered = item;
      result.events.push("detail");
    }),
    renderRelations: vi.fn((items: RuntimeList) => {
      result.events.push(`relations:${items.length}`);
    }),
    invalid: vi.fn(() => result.events.push("invalid")),
    failure: vi.fn((_error, retry: () => void) => {
      result.retry = retry;
      result.events.push("failure");
    }),
    relationFailure: vi.fn(() => result.events.push("relation-failure")),
  };
  return result;
}

function runtime(
  overrides: Partial<CommunityDragonRuntime> = {},
): CommunityDragonRuntime {
  return {
    list: vi.fn(async () => summary),
    get: vi.fn(async () => champion),
    ...overrides,
  };
}

describe("runtime URL state", () => {
  it("keeps the champion list route in list mode and requires an ID on the detail route", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103&channel=latest"),
        "champions",
        "list",
      ),
    ).toEqual({ mode: "list", page: "champions", channel: "latest" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/detail/?channel=pbe"),
        "champions",
        "detail",
      ),
    ).toMatchObject({ mode: "invalid", channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL(
          "https://chromaart.lol/champions/detail/?id=103&channel=latest",
        ),
        "champions",
        "detail",
      ),
    ).toEqual({
      mode: "detail",
      page: "champions",
      kind: "champion",
      id: 103,
      channel: "latest",
    });
  });

  it("keeps the skinline list route in list mode and parses its detail route separately", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skinlines/?id=7&channel=latest"),
        "skinlines",
        "list",
      ),
    ).toEqual({ mode: "list", page: "skinlines", channel: "latest" });
    expect(
      parseRuntimeLocation(
        new URL(
          "https://chromaart.lol/skinlines/detail/?id=7&channel=latest",
        ),
        "skinlines",
        "detail",
      ),
    ).toEqual({
      mode: "detail",
      page: "skinlines",
      kind: "skinline",
      id: 7,
      channel: "latest",
    });
  });

  it("keeps the universe list route in list mode and parses its detail route separately", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/universes/?id=200&channel=latest"),
        "universes",
        "list",
      ),
    ).toEqual({ mode: "list", page: "universes", channel: "latest" });
    expect(
      parseRuntimeLocation(
        new URL(
          "https://chromaart.lol/universes/detail/?id=200&channel=latest",
        ),
        "universes",
        "detail",
      ),
    ).toEqual({
      mode: "detail",
      page: "universes",
      kind: "universe",
      id: 200,
      channel: "latest",
    });
  });

  it("defaults to pbe and parses positive safe IDs without guessing invalid values", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103"),
        "champions",
      ),
    ).toMatchObject({ mode: "detail", id: 103, channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103&channel=latest"),
        "champions",
      ),
    ).toMatchObject({ mode: "detail", id: 103, channel: "latest" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103&channel=pbe"),
        "champions",
      ),
    ).toMatchObject({ mode: "detail", id: 103, channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=0"),
        "champions",
      ),
    ).toMatchObject({ mode: "invalid" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id="),
        "champions",
      ),
    ).toMatchObject({ mode: "invalid" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?channel=staging"),
        "champions",
      ),
    ).toMatchObject({ mode: "invalid" });
  });

  it("requires a champion hint for skin details and rejects a skin list route", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skins/?id=103001"),
        "skins",
        "list",
      ),
    ).toEqual({ mode: "intro", page: "skins", channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skins/?id=103001"),
        "skins",
        "detail",
      ),
    ).toMatchObject({ mode: "invalid" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skins/detail/?id=103001&champion=103"),
        "skins",
        "detail",
      ),
    ).toMatchObject({ mode: "detail", id: 103001, championId: 103 });
  });
});

describe("RuntimeController", () => {
  it("loads a list and does not rewrite the initial URL", async () => {
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/");
    const controller = new RuntimeController(runtime(), viewState, navigation, {
      page: "champions",
      locale: "default",
    });

    await controller.start();

    expect(viewState.events).toEqual(["loading:false", "list"]);
    expect(navigation.pushes).toHaveLength(0);
  });

  it("does not turn an old champion list URL with an ID into a detail request", async () => {
    const service = runtime();
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/?id=103");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "list",
      locale: "default",
    });

    await controller.start();

    expect(service.list).toHaveBeenCalledTimes(1);
    expect(service.get).not.toHaveBeenCalled();
    expect(viewState.events).toEqual(["loading:false", "list"]);
  });

  it("passes the current locale and channel to the champion list request", async () => {
    const service = runtime();
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/zh-cn/champions/?channel=latest",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "list",
      locale: "zh_cn",
    });

    await controller.start();

    expect(service.list).toHaveBeenCalledWith(
      "champions",
      expect.objectContaining({ locale: "zh_cn", channel: "latest" }),
    );
  });

  it("recovers a failed champion list request through retry", async () => {
    let attempts = 0;
    const service = runtime({
      list: vi.fn(async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("offline");
        return summary;
      }),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "list",
      locale: "default",
    });

    await controller.start();
    expect(viewState.events).toEqual(["loading:false", "failure"]);
    expect(viewState.retry).toBeDefined();

    viewState.retry!();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toEqual([
      "loading:false",
      "failure",
      "loading:false",
      "list",
    ]);
  });

  it("does not request CommunityDragon when a detail URL has no ID", async () => {
    const service = runtime();
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/detail/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();

    expect(service.list).not.toHaveBeenCalled();
    expect(service.get).not.toHaveBeenCalled();
    expect(viewState.events).toEqual(["invalid"]);
  });

  it("rejects an invalid champion detail ID without requesting CommunityDragon", async () => {
    const service = runtime();
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/champions/detail/?id=0&channel=latest",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();

    expect(service.list).not.toHaveBeenCalled();
    expect(service.get).not.toHaveBeenCalled();
    expect(viewState.events).toEqual(["invalid"]);
  });

  it("loads a champion detail with its locale and channel", async () => {
    const service = runtime({
      get: vi.fn(async () => ({
        ...champion,
        title: "the Nine-Tailed Fox",
        shortBio: "A vastayan fox.",
      })),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/champions/detail/?id=103&channel=latest",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();

    expect(service.get).toHaveBeenCalledWith(
      "champion",
      103,
      expect.objectContaining({ locale: "default", channel: "latest" }),
    );
    expect(viewState.events).toEqual(["loading:false", "detail"]);
    expect(viewState.rendered).toMatchObject({
      kind: "champion",
      id: 103,
      title: "the Nine-Tailed Fox",
    });
  });

  it("keeps failure categories distinguishable and retryable", () => {
    expect(
      runtimeFailureMessage(
        new CommunityDragonRuntimeError("not-found", "missing"),
        "default",
      ),
    ).toContain("not found");
    expect(
      runtimeFailureMessage(
        new CommunityDragonRuntimeError("http", "unavailable", {
          status: 503,
        }),
        "default",
      ),
    ).toContain("503");
  });

  it("commits a channel change only after the target succeeds", async () => {
    let rejectLatest!: (error: Error) => void;
    const loadLatest = new Promise<RuntimeList>((_, reject) => {
      rejectLatest = reject;
    });
    const service = runtime({
      list: vi.fn(async (_kind, options) =>
        options.channel === "latest" ? loadLatest : summary,
      ),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      locale: "default",
    });
    await controller.start();

    const changing = controller.navigate(
      new URL("https://chromaart.lol/champions/?channel=latest"),
    );
    rejectLatest(new Error("offline"));
    await changing;

    expect(navigation.url.search).toBe("");
    expect(navigation.pushes).toHaveLength(0);
    expect(viewState.events.at(-1)).toBe("failure");
  });

  it("restores the committed URL when a popstate load fails", async () => {
    const service = runtime({
      list: vi.fn(async (_kind, options) => {
        if (options.channel === "latest") throw new Error("offline");
        return summary;
      }),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "list",
      locale: "default",
    });
    await controller.start();

    navigation.push(
      new URL("https://chromaart.lol/champions/?channel=latest"),
    );
    navigation.emitPopstate();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(navigation.url.search).toBe("");
    expect(navigation.replaces).toEqual([
      "https://chromaart.lol/champions/",
    ]);
    expect(viewState.rendered).toBe(summary);
    expect(viewState.events.at(-1)).toBe("failure");
  });

  it("renders named skinline relations after the core and isolates relation failure", async () => {
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    const universe = {
      kind: "universe" as const,
      id: 200,
      name: "Star Guardian universe",
      skinlineIds: [7],
    };
    const service = runtime({
      get: vi.fn(async () => skinline),
      list: vi.fn(async (kind) => (kind === "universes" ? [universe] : [])),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/skinlines/detail/?id=7",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skinlines",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toEqual([
      "loading:false",
      "detail",
      "relations:1",
    ]);
    expect(viewState.rendered).toMatchObject({ name: "Star Guardian" });
    expect(service.list).toHaveBeenCalledWith(
      "universes",
      expect.objectContaining({ channel: "pbe" }),
    );
  });

  it("loads a universe detail and only requests its skinline relations", async () => {
    const universe = {
      kind: "universe" as const,
      id: 200,
      name: "Star Guardian universe",
      description: "A bright parallel world.",
      skinlineIds: [7],
    };
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    const service = runtime({
      get: vi.fn(async () => universe),
      list: vi.fn(async (kind) => (kind === "skinlines" ? [skinline] : [])),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/universes/detail/?id=200&channel=latest",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "universes",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.get).toHaveBeenCalledWith(
      "universe",
      200,
      expect.objectContaining({ locale: "default", channel: "latest" }),
    );
    expect(service.list).toHaveBeenCalledWith(
      "skinlines",
      expect.objectContaining({ locale: "default", channel: "latest" }),
    );
    expect(service.list).not.toHaveBeenCalledWith(
      "universes",
      expect.anything(),
    );
    expect(service.list).not.toHaveBeenCalledWith("skins", expect.anything());
    expect(viewState.rendered).toMatchObject({
      kind: "universe",
      id: 200,
      description: "A bright parallel world.",
    });
    expect(viewState.events).toEqual([
      "loading:false",
      "detail",
      "relations:1",
    ]);
  });

  it("keeps the core detail when a relation request fails", async () => {
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    const service = runtime({
      get: vi.fn(async () => skinline),
      list: vi.fn(async () => {
        throw new Error("relation offline");
      }),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/skinlines/detail/?id=7",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skinlines",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toContain("detail");
    expect(viewState.events).toContain("relation-failure");
    expect(viewState.events).not.toContain("failure");
  });

  it("loads skinline and universe relations concurrently without a skin directory", async () => {
    const skin = {
      kind: "skin" as const,
      id: 103001,
      championId: 103,
      name: "Dynasty Ahri",
      isBase: false,
      skinlineIds: [7],
      media: {},
      chromas: [],
      stages: [],
    };
    const pending = new Map<string, (items: RuntimeList) => void>();
    let active = 0;
    let maxActive = 0;
    const service = runtime({
      get: vi.fn(async () => skin),
      list: vi.fn((kind) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        return new Promise<RuntimeList>((resolve) => {
          pending.set(kind, (items) => {
            active -= 1;
            resolve(items);
          });
        });
      }),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/skins/?id=103001&champion=103",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skins",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(maxActive).toBe(2);
    expect([...pending.keys()]).toEqual(["skinlines", "universes"]);
    pending.get("skinlines")?.([
      { kind: "skinline", id: 7, name: "Star Guardian", universeIds: [200] },
    ]);
    pending.get("universes")?.([
      { kind: "universe", id: 200, name: "Star Guardian", skinlineIds: [7] },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toContain("relations:2");
    expect(service.list).not.toHaveBeenCalledWith("skins", expect.anything());
  });

  it("ignores a late response from a cancelled navigation", async () => {
    let resolveOld!: (value: RuntimeEntity) => void;
    const old = new Promise<RuntimeEntity>((resolve) => {
      resolveOld = resolve;
    });
    const service = runtime({
      get: vi.fn(async (_kind, id) =>
        id === 103 ? old : { ...champion, id: 1 },
      ),
    });
    const viewState = view();
    const navigation = history(
      "https://chromaart.lol/champions/detail/?id=103",
    );
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "champions",
      pageMode: "detail",
      locale: "default",
    });
    const first = controller.start();
    await controller.navigate(
      new URL("https://chromaart.lol/champions/detail/?id=1"),
    );
    resolveOld(champion);
    await first;

    expect(viewState.rendered).toMatchObject({ id: 1 });
    expect(viewState.events).toEqual([
      "loading:false",
      "loading:false",
      "detail",
    ]);
  });
});
