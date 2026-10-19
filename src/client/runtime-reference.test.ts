import { describe, expect, it, vi } from "vitest";
import {
  RuntimeController,
  formatRuntimeState,
  runtimeFailureMessage,
  parseRuntimeLocation,
  type RuntimePageState,
  type RuntimeHistory,
  type RuntimeView,
} from "./runtime-reference";
import type {
  RuntimeEntity,
  RuntimeList,
} from "../domain/communitydragon-runtime";
import type { RuntimePbeAdditionsStream } from "../domain/pbe-additions";
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
  renderedPbe?: RuntimePbeAdditionsStream;
  retry?: () => void;
  skinRetry?: () => void;
} {
  let renderedContext: RuntimePageState["context"];
  const renderedSlots = new Map<string, unknown>();
  const result = {
    events: [] as string[],
    rendered: undefined as RuntimeList | RuntimeEntity | undefined,
    renderedPbe: undefined as RuntimePbeAdditionsStream | undefined,
    retry: undefined as (() => void) | undefined,
    skinRetry: undefined as (() => void) | undefined,
    render: vi.fn((state: RuntimePageState) => {
      if (state.core.status === "failed") {
        result.retry = state.core.retry;
        result.events.push("failure");
        return;
      }
      if (state.core.status !== "ready" || !state.context) return;
      if (renderedContext !== state.context) {
        renderedContext = state.context;
        renderedSlots.clear();
        if (state.core.value.mode === "pbe") {
          result.renderedPbe = state.core.value.items;
          result.events.push("pbe");
        } else if (state.core.value.mode === "list") {
          result.rendered = state.core.value.items;
          result.events.push("list");
        } else {
          result.rendered = state.core.value.item;
          result.events.push("detail");
        }
      }
      for (const [key, slot] of Object.entries(state.slots)) {
        if (!slot || slot.status === "loading") continue;
        if (renderedSlots.get(key) === slot) continue;
        renderedSlots.set(key, slot);
        if (key === "skinline-skins") {
          if (slot.status === "failed") {
            result.skinRetry = slot.retry;
            result.events.push("skinline-skins-failure");
          } else result.events.push(`skinline-skins:${slot.value.length}`);
        } else if (key === "universe-skins") {
          if (slot.status === "failed") result.events.push("universe-skins-failure");
          else result.events.push(`universe-skins:${slot.value.length}`);
        } else if (key.startsWith("relation-")) {
          if (slot.status === "failed") result.events.push("relation-failure");
          else result.events.push(`relations:${slot.value.length}`);
        }
      }
    }),
    loading: vi.fn((preserve: boolean) =>
      result.events.push(`loading:${preserve}`),
    ),
    invalid: vi.fn(() => result.events.push("invalid")),
  };
  return result;
}

function runtime(
  overrides: Partial<CommunityDragonRuntime> = {},
): CommunityDragonRuntime {
  return {
    list: vi.fn(async () => summary),
    get: vi.fn(async () => champion),
    listSkinlineSkins: vi.fn(async () => []),
    listSkinCatalog: vi.fn(async () => ({ skins: [], champions: [] })),
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

  it("keeps legacy list URLs in list mode and defaults their channel to pbe", () => {
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103"),
        "champions",
        "list",
      ),
    ).toEqual({ mode: "list", page: "champions", channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103&channel=latest"),
        "champions",
        "list",
      ),
    ).toEqual({ mode: "list", page: "champions", channel: "latest" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=103&channel=pbe"),
        "champions",
        "list",
      ),
    ).toEqual({ mode: "list", page: "champions", channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id=0"),
        "champions",
        "list",
      ),
    ).toMatchObject({ mode: "list" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?id="),
        "champions",
        "list",
      ),
    ).toMatchObject({ mode: "list" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/champions/?channel=staging"),
        "champions",
        "list",
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
    ).toEqual({ mode: "invalid", page: "skins", channel: "pbe" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skins/?id=103001"),
        "skins",
        "detail",
      ),
    ).toMatchObject({ mode: "invalid" });
    expect(
      parseRuntimeLocation(
        new URL("https://chromaart.lol/skins/detail/?id=103002&champion=103"),
        "skins",
        "detail",
      ),
    ).toMatchObject({ mode: "detail", id: 103002, championId: 103 });
    expect(
      parseRuntimeLocation(
        new URL(
          "https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002",
        ),
        "skins",
        "detail",
      ),
    ).toMatchObject({ mode: "invalid" });
  });

  it("formats a stage target using its own ID and channel", () => {
    expect(
      formatRuntimeState(
        new URL("https://chromaart.lol/skins/detail/"),
        {
          mode: "detail",
          page: "skins",
          kind: "skin",
          id: 103002,
          championId: 103,
          channel: "latest",
        },
      ).search,
    ).toBe("?id=103002&champion=103&channel=latest");
  });

  it("keeps explicit pbe when formatting a state from an explicit pbe URL", () => {
    expect(
      formatRuntimeState(
        new URL("https://chromaart.lol/skins/detail/?channel=pbe&tracking=drop"),
        {
          mode: "detail",
          page: "skins",
          kind: "skin",
          id: 103001,
          championId: 103,
          channel: "pbe",
        },
      ).search,
    ).toBe("?id=103001&champion=103&channel=pbe");
  });
});

describe("RuntimeController", () => {
  it("loads a direct stage ID", async () => {
    const service = runtime();
    const direct = history("https://chromaart.lol/skins/detail/?id=103002&champion=103");
    await new RuntimeController(service, view(), direct, {
      page: "skins", pageMode: "detail", locale: "default",
    }).start();
    expect(service.get).toHaveBeenCalledWith("skin", 103002, expect.objectContaining({ championId: 103 }));
    expect(direct.replaces).toHaveLength(0);
  });

  it("loads a list and does not rewrite the initial URL", async () => {
    const viewState = view();
    const navigation = history("https://chromaart.lol/champions/");
    const controller = new RuntimeController(runtime(), viewState, navigation, {
      page: "champions",
      pageMode: "list",
      locale: "default",
    });

    await controller.start();

    expect(viewState.events).toEqual(["loading:false", "list"]);
    expect(navigation.pushes).toHaveLength(0);
  });

  it("renders the PBE additions stream without a channel URL", async () => {
    const stream: RuntimePbeAdditionsStream = {
      signal: new AbortController().signal,
      modules: [
        {
          kind: "champions",
          load: async () => ({ kind: "champions", items: [champion] }),
        },
        { kind: "skins", load: async () => ({ kind: "skins", items: [] }) },
        {
          kind: "skinlines",
          load: async () => ({ kind: "skinlines", items: [] }),
        },
        {
          kind: "universes",
          load: async () => ({ kind: "universes", items: [] }),
        },
        { kind: "icons", load: async () => ({ kind: "icons", items: [] }) },
        { kind: "emotes", load: async () => ({ kind: "emotes", items: [] }) },
        { kind: "chromas", load: async () => ({ kind: "chromas", items: [] }) },
        { kind: "borders", load: async () => ({ kind: "borders", items: [] }) },
        { kind: "wards", load: async () => ({ kind: "wards", items: [] }) },
        {
          kind: "finishers",
          load: async () => ({ kind: "finishers", items: [] }),
        },
      ],
    };
    const service = runtime({
      getPbeAdditionsStream: vi.fn((options) => {
        expect(options).toMatchObject({ locale: "zh_cn" });
        return stream;
      }),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/zh-cn/pbe-additions/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "pbe-additions",
      pageMode: "pbe",
      locale: "zh_cn",
    });

    await controller.start();

    expect(viewState.events).toEqual(["loading:false", "pbe"]);
    expect(viewState.renderedPbe).toBe(stream);
    expect(navigation.url.search).toBe("");
  });

  it("keeps the PBE page retryable when the runtime cannot stream additions", async () => {
    const service = runtime({
      getPbeAdditionsStream: undefined,
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/pbe-additions/");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "pbe-additions",
      pageMode: "pbe",
      locale: "default",
    });

    await controller.start();
    expect(viewState.events).toEqual(["loading:false", "failure"]);
    expect(viewState.renderedPbe).toBeUndefined();
    expect(viewState.retry).toBeTypeOf("function");

    viewState.retry!();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toEqual([
      "loading:false",
      "failure",
      "loading:false",
      "failure",
    ]);
    expect(viewState.renderedPbe).toBeUndefined();
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

  it("rejects the retired skin entry route without fetching", async () => {
    const service = runtime();
    const viewState = view();
    const navigation = history("https://chromaart.lol/skins/?id=103001");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skins",
      pageMode: "list",
      locale: "default",
    });

    await controller.start();

    expect(service.list).not.toHaveBeenCalled();
    expect(service.get).not.toHaveBeenCalled();
    expect(viewState.events).toEqual(["invalid"]);
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
      pageMode: "list",
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

  it.each([
    ["champions", "champion", 103, "champions", "champion"],
    ["skinlines", "skinline", 7, "skinlines", "skinline"],
    ["universes", "universe", 200, "universes", "universe"],
  ] as const)("falls back from a missing %s to its localized target directory", async (page, kind, id, directory, reason) => {
    const source = `https://chromaart.lol/zh-cn/${page}/detail/?id=${id}`;
    const navigation = history(source);
    const destinations: URL[] = [];
    const service = runtime({
      get: vi.fn(async (_kind, _id, options) => {
        if (options.channel === "latest") throw new CommunityDragonRuntimeError("not-found", "missing");
        return { kind, id, name: "original", ...(kind === "champion" ? { skins: [] } : {}) } as RuntimeEntity;
      }),
    });
    const controller = new RuntimeController(service, view(), navigation, {
      page, pageMode: "detail", locale: "zh_cn", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL(`${source}&channel=latest`));
    expect(destinations.map(String)).toEqual([
      `https://chromaart.lol/zh-cn/${directory}/?channel=latest&fallback=${reason}`,
    ]);
    expect(navigation.url.href).toBe(source);
    expect(service.list).toHaveBeenCalledWith(directory, expect.objectContaining({ locale: "zh_cn", channel: "latest" }));
  });

  it("falls back from a missing skin to its champion, then the directory if needed", async () => {
    const source = "https://chromaart.lol/skins/detail/?id=103001&champion=103";
    for (const championMissing of [false, true]) {
      const navigation = history(source);
      const destinations: URL[] = [];
      const service = runtime({
        get: vi.fn(async (kind, _id, options) => {
          if (options.channel === "latest" && (kind === "skin" || championMissing))
            throw new CommunityDragonRuntimeError("not-found", "missing");
          return kind === "champion" ? champion : { kind: "skin", id: 103001, championId: 103, name: "PBE skin" } as RuntimeEntity;
        }),
      });
      const controller = new RuntimeController(service, view(), navigation, {
        page: "skins", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
      });
      await controller.start();
      await controller.navigate(new URL(`${source}&channel=latest`));
      expect(destinations.map(String)).toEqual([championMissing
        ? "https://chromaart.lol/champions/?channel=latest&fallback=skin-champion"
        : "https://chromaart.lol/champions/detail/?id=103&channel=latest&fallback=skin"]);
      expect(navigation.url.href).toBe(source);
      expect(service.get).toHaveBeenCalledWith("champion", 103, expect.objectContaining({ locale: "default", channel: "latest" }));
      const targetChampionLists = vi.mocked(service.list).mock.calls.filter(
        ([kind, options]) => kind === "champions" && options.channel === "latest",
      );
      expect(targetChampionLists).toHaveLength(championMissing ? 1 : 0);
    }
  });

  it("keeps the original detail and URL on a fallback lookup failure and retries", async () => {
    const source = "https://chromaart.lol/skins/detail/?id=103001&champion=103&channel=latest";
    const navigation = history(source);
    const destinations: URL[] = [];
    const shown = view();
    let attempts = 0;
    const service = runtime({
      get: vi.fn(async (kind, _id, options) => {
        if (options.channel === "pbe" && kind === "skin") throw new CommunityDragonRuntimeError("not-found", "missing");
        if (options.channel === "pbe" && kind === "champion" && ++attempts === 1) throw new Error("offline");
        return kind === "champion" ? champion : { kind: "skin", id: 103001, championId: 103, name: "Live skin" } as RuntimeEntity;
      }),
    });
    const controller = new RuntimeController(service, shown, navigation, {
      page: "skins", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL("https://chromaart.lol/skins/detail/?id=103001&champion=103&channel=pbe"));
    expect(destinations).toEqual([]);
    expect(navigation.url.href).toBe(source);
    expect(shown.rendered).toMatchObject({ name: "Live skin" });
    expect(shown.retry).toBeDefined();
    shown.retry!();
    await vi.waitFor(() => expect(destinations).toHaveLength(1));
    expect(destinations[0]?.search).toBe("?id=103&channel=pbe&fallback=skin");
  });

  it("keeps the original detail when the fallback directory fails, then retries it", async () => {
    const source = "https://chromaart.lol/champions/detail/?id=103";
    const navigation = history(source);
    const destinations: URL[] = [];
    const shown = view();
    let directoryAttempts = 0;
    const service = runtime({
      get: vi.fn(async (_kind, _id, options) => {
        if (options.channel === "latest") throw new CommunityDragonRuntimeError("not-found", "missing");
        return champion;
      }),
      list: vi.fn(async (_kind, options) => {
        if (options.channel === "latest" && ++directoryAttempts === 1) throw new Error("offline");
        return summary;
      }),
    });
    const controller = new RuntimeController(service, shown, navigation, {
      page: "champions", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL(`${source}&channel=latest`));
    expect(destinations).toEqual([]);
    expect(shown.rendered).toBe(champion);
    expect(navigation.url.href).toBe(source);
    shown.retry!();
    await vi.waitFor(() => expect(destinations.map(String)).toEqual([
      "https://chromaart.lol/champions/?channel=latest&fallback=champion",
    ]));
    expect(directoryAttempts).toBe(2);
  });

  it("leaves the original detail in browser history after a cross-page fallback", async () => {
    const source = "https://chromaart.lol/champions/detail/?id=103";
    const visited = [source];
    const service = runtime({
      get: vi.fn(async (_kind, _id, options) => {
        if (options.channel === "latest") throw new CommunityDragonRuntimeError("not-found", "missing");
        return champion;
      }),
    });
    const originalHistory = history(source);
    const original = new RuntimeController(service, view(), originalHistory, {
      page: "champions", pageMode: "detail", locale: "default",
      navigateAway: (url) => visited.push(url.href),
    });
    await original.start();
    await original.navigate(new URL(`${source}&channel=latest`));
    expect(visited).toEqual([source, "https://chromaart.lol/champions/?channel=latest&fallback=champion"]);
    expect(originalHistory.pushes).toEqual([]);

    const fallbackHistory = history(visited.at(-1)!);
    const fallback = new RuntimeController(service, view(), fallbackHistory, {
      page: "champions", pageMode: "list", locale: "default",
    });
    await fallback.start();
    expect(service.list).toHaveBeenCalledWith("champions", expect.objectContaining({ channel: "latest" }));
    visited.pop();
    const returnedHistory = history(visited.at(-1)!);
    const returnedView = view();
    const returned = new RuntimeController(service, returnedView, returnedHistory, {
      page: "champions", pageMode: "detail", locale: "default",
    });
    await returned.start();
    expect(returnedView.rendered).toBe(champion);
    expect(returnedHistory.url.href).toBe(source);
    expect(service.get).toHaveBeenLastCalledWith("champion", 103, expect.objectContaining({ channel: "pbe" }));
  });

  it("ignores a stale fallback lookup after a newer channel choice", async () => {
    const source = "https://chromaart.lol/skins/detail/?id=103001&champion=103";
    let resolveChampion!: (entity: RuntimeEntity) => void;
    const pendingChampion = new Promise<RuntimeEntity>((resolve) => { resolveChampion = resolve; });
    const destinations: URL[] = [];
    const navigation = history(source);
    const service = runtime({
      get: vi.fn(async (kind, _id, options) => {
        if (options.channel === "latest" && kind === "skin")
          throw new CommunityDragonRuntimeError("not-found", "missing");
        if (options.channel === "latest" && kind === "champion") return pendingChampion;
        return { kind: "skin", id: 103001, championId: 103, name: "PBE skin" } as RuntimeEntity;
      }),
    });
    const controller = new RuntimeController(service, view(), navigation, {
      page: "skins", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    const first = controller.navigate(new URL(`${source}&channel=latest`));
    await vi.waitFor(() => expect(service.get).toHaveBeenCalledWith(
      "champion", 103, expect.objectContaining({ channel: "latest" }),
    ));
    await controller.navigate(new URL(`${source}&channel=pbe`));
    resolveChampion(champion);
    await first;
    expect(destinations).toEqual([]);
    expect(navigation.url.search).toBe("?id=103001&champion=103&channel=pbe");
  });

  it("does not fall back when a detail is missing on direct entry", async () => {
    const source = "https://chromaart.lol/champions/detail/?id=999&channel=latest";
    const navigation = history(source);
    const destinations: URL[] = [];
    const shown = view();
    const service = runtime({ get: vi.fn(async () => { throw new CommunityDragonRuntimeError("not-found", "missing"); }) });
    const controller = new RuntimeController(service, shown, navigation, {
      page: "champions", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    expect(destinations).toEqual([]);
    expect(shown.events.at(-1)).toBe("failure");
    expect(navigation.url.href).toBe(source);
  });

  it("does not fall back when navigating to another entity in the same channel", async () => {
    const source = "https://chromaart.lol/champions/detail/?id=103";
    const navigation = history(source);
    const destinations: URL[] = [];
    const shown = view();
    const service = runtime({ get: vi.fn(async (_kind, id) => {
      if (id === 999) throw new CommunityDragonRuntimeError("not-found", "missing");
      return champion;
    }) });
    const controller = new RuntimeController(service, shown, navigation, {
      page: "champions", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL("https://chromaart.lol/champions/detail/?id=999"));
    expect(destinations).toEqual([]);
    expect(shown.events.at(-1)).toBe("failure");
    expect(navigation.url.href).toBe(source);
  });

  it.each(["network", "schema"] as const)("keeps the loaded detail on a %s target failure", async (code) => {
    const source = "https://chromaart.lol/champions/detail/?id=103";
    const navigation = history(source);
    const destinations: URL[] = [];
    const shown = view();
    const service = runtime({ get: vi.fn(async (_kind, _id, options) => {
      if (options.channel === "latest") throw new CommunityDragonRuntimeError(code, "failed");
      return champion;
    }) });
    const controller = new RuntimeController(service, shown, navigation, {
      page: "champions", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL(`${source}&channel=latest`));
    expect(destinations).toEqual([]);
    expect(shown.rendered).toBe(champion);
    expect(shown.retry).toBeDefined();
    expect(navigation.url.href).toBe(source);
  });

  it("keeps the entity detail when it exists in the target channel", async () => {
    const source = "https://chromaart.lol/champions/detail/?id=103";
    const navigation = history(source);
    const destinations: URL[] = [];
    const service = runtime();
    const shown = view();
    const controller = new RuntimeController(service, shown, navigation, {
      page: "champions", pageMode: "detail", locale: "default", navigateAway: (url) => destinations.push(url),
    });
    await controller.start();
    await controller.navigate(new URL(`${source}&channel=latest`));
    expect(destinations).toEqual([]);
    expect(shown.rendered).toBe(champion);
    expect(navigation.url.search).toBe("?id=103&channel=latest");
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
      "skinline-skins:0",
      "relations:1",
      "relations:0",
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
      listUniverseSkins: vi.fn(async () => []),
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
    expect(viewState.events).toContain("loading:false");
    expect(viewState.events).toContain("detail");
    expect(viewState.events).toContain("relations:1");
    expect(viewState.events).toContain("universe-skins:0");
    expect(service.listUniverseSkins).toHaveBeenCalledWith(
      200,
      [7],
      expect.objectContaining({ locale: "default", channel: "latest" }),
    );
  });

  it("loads a skinline's full skin collection independently of its universe relation", async () => {
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    const item = {
      kind: "skin" as const,
      id: 103001,
      skinId: 103001,
      championId: 103,
      target: { championId: 103, skinId: 103001 },
      stableKey: "103:103001",
      name: "Dynasty Ahri",
      isBase: false,
      skinlineIds: [7],
      universeIds: [],
      media: {},
      historicalArt: [],
      chromas: [],
      thumbnailUrl: "https://example.test/tile.jpg",
    };
    const service = runtime({
      get: vi.fn(async () => skinline),
      list: vi.fn(async (kind) =>
        kind === "universes"
          ? [{ kind: "universe" as const, id: 200, name: "Star Guardian", skinlineIds: [7] }]
          : [],
      ),
      listSkinlineSkins: vi.fn(async () => [item]),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/skinlines/detail/?id=7");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skinlines",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(service.listSkinlineSkins).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ locale: "default", channel: "pbe" }),
    );
    expect(viewState.events).toContain("skinline-skins:1");
    expect(service.list).not.toHaveBeenCalledWith("skins", expect.anything());
  });

  it("keeps skinline core and universe navigation when the full skin collection fails", async () => {
    const skinline = {
      kind: "skinline" as const,
      id: 7,
      name: "Star Guardian",
      universeIds: [200],
    };
    const service = runtime({
      get: vi.fn(async () => skinline),
      listSkinlineSkins: vi.fn(async () => {
        throw new Error("skins offline");
      }),
    });
    const viewState = view();
    const navigation = history("https://chromaart.lol/skinlines/detail/?id=7");
    const controller = new RuntimeController(service, viewState, navigation, {
      page: "skinlines",
      pageMode: "detail",
      locale: "default",
    });

    await controller.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(viewState.events).toContain("detail");
    expect(viewState.events).toContain("skinline-skins-failure");
    expect(viewState.events).not.toContain("failure");
    expect(viewState.skinRetry).toBeTypeOf("function");
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
      skinlineIds: [],
      universeIds: [200],
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
      pageMode: "detail",
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

    expect(viewState.events).toContain("relations:1");
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
