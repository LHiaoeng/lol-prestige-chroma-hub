import { describe, expect, it, vi } from "vitest";
import {
  RuntimeChannelLifecycle,
  type RuntimeChannelHistory,
  type RuntimeChannelView,
} from "./runtime-channel-lifecycle";

type TestError = { readonly code: "network" | "aborted" };

function history(initial: string): RuntimeChannelHistory & {
  readonly pushes: string[];
  readonly replaces: string[];
  visit(url: string): void;
} {
  let current = new URL(initial);
  const listeners = new Set<() => void>();
  const result = {
    pushes: [] as string[],
    replaces: [] as string[],
    get url() {
      return new URL(current);
    },
    push(url: URL) {
      current = new URL(url);
      result.pushes.push(url.href);
    },
    replace(url: URL) {
      current = new URL(url);
      result.replaces.push(url.href);
    },
    onPopState(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    visit(url: string) {
      current = new URL(url);
      listeners.forEach((listener) => listener());
    },
  };
  return result;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createLifecycle(
  navigation: RuntimeChannelHistory,
  load: (channel: "pbe" | "latest", signal: AbortSignal) => Promise<string>,
) {
  const events: string[] = [];
  const retries: Array<() => void> = [];
  let content: string | undefined;
  const view: RuntimeChannelView<"pbe" | "latest", string, TestError> = {
    loading(preserve, context) {
      events.push(`loading:${preserve}:${context.channel}`);
    },
    render(result, context) {
      content = result;
      events.push(`render:${result}:${context.channel}:${navigation.url.search}`);
    },
    committed(context) {
      events.push(`committed:${context.channel}:${navigation.url.search}`);
    },
    invalid(message) {
      events.push(`invalid:${message}`);
    },
    failure(error, retry, preserve) {
      retries.push(retry);
      events.push(`failure:${error.code}:${preserve}`);
    },
  };
  const lifecycle = new RuntimeChannelLifecycle({
    history: navigation,
    parse(url) {
      const channel = url.searchParams.get("channel");
      if (channel !== null && channel !== "pbe" && channel !== "latest")
        return { status: "invalid", message: "invalid channel" };
      const selected = channel === "latest" ? "latest" : "pbe";
      return { status: "valid", channel: selected, target: selected };
    },
    load,
    normalizeError(error) {
      return error as TestError;
    },
    isAborted(error) {
      return error.code === "aborted";
    },
    view,
  });
  return { lifecycle, events, retries, get content() { return content; } };
}

describe("RuntimeChannelLifecycle", () => {
  it("loads the URL channel by default and commits a successful navigation after render is ready", async () => {
    const navigation = history("https://example.test/references/");
    const loaded: string[] = [];
    const state = createLifecycle(navigation, async (channel) => {
      loaded.push(channel);
      return `${channel}-data`;
    });

    await state.lifecycle.start();
    expect(loaded).toEqual(["pbe"]);
    expect(state.content).toBe("pbe-data");
    expect(state.events).toEqual([
      "loading:false:pbe",
      "render:pbe-data:pbe:",
      "committed:pbe:",
    ]);

    await state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=pbe"),
    );
    expect(navigation.pushes).toEqual([
      "https://example.test/references/?channel=pbe",
    ]);
    expect(state.events.slice(-2)).toEqual([
      "render:pbe-data:pbe:",
      "committed:pbe:?channel=pbe",
    ]);
  });

  it("keeps the last content and target channel on failure, then retries the failed channel", async () => {
    const navigation = history("https://example.test/references/");
    const latest = deferred<string>();
    const loads: string[] = [];
    const state = createLifecycle(navigation, (channel) => {
      loads.push(channel);
      return channel === "latest" && loads.length === 2
        ? latest.promise
        : Promise.resolve(`${channel}-data`);
    });

    await state.lifecycle.start();
    const changing = state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=latest"),
    );
    latest.reject({ code: "network" });
    await changing;

    expect(state.content).toBe("pbe-data");
    expect(navigation.url.search).toBe("");
    expect(navigation.pushes).toEqual([]);
    expect(state.events.at(-1)).toBe("failure:network:true");

    state.retries[0]!();
    await vi.waitFor(() => expect(loads).toHaveLength(3));
    expect(loads).toEqual(["pbe", "latest", "latest"]);
    expect(navigation.pushes).toEqual([
      "https://example.test/references/?channel=latest",
    ]);
    expect(state.content).toBe("latest-data");
  });

  it("cancels and ignores stale results during fast channel changes", async () => {
    const navigation = history("https://example.test/references/");
    const first = deferred<string>();
    const second = deferred<string>();
    const signals: AbortSignal[] = [];
    const state = createLifecycle(navigation, (channel, signal) => {
      signals.push(signal);
      if (signals.length === 1) return Promise.resolve("pbe-data");
      return channel === "latest" ? second.promise : first.promise;
    });

    await state.lifecycle.start();
    const latestNavigation = state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=latest"),
    );
    const pbeNavigation = state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=pbe"),
    );
    expect(signals[1]?.aborted).toBe(true);
    first.resolve("old-pbe-data");
    second.resolve("latest-data");
    await Promise.all([latestNavigation, pbeNavigation]);

    expect(state.content).toBe("old-pbe-data");
    expect(state.events).not.toContain("render:latest-data:latest:?channel=latest");
    expect(navigation.pushes).toEqual([
      "https://example.test/references/?channel=pbe",
    ]);
  });

  it("does not surface cancelled errors or allow an invalidated retry callback to restart a request", async () => {
    const navigation = history("https://example.test/references/");
    const pending = deferred<string>();
    const load = vi.fn((channel: "pbe" | "latest") => {
      if (channel === "pbe") return pending.promise;
      return Promise.resolve("latest-data");
    });
    const state = createLifecycle(navigation, load);

    const first = state.lifecycle.start();
    await state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=latest"),
    );
    pending.reject({ code: "aborted" });
    await first;
    expect(state.events.filter((event) => event.startsWith("failure"))).toEqual(
      [],
    );

    load.mockImplementationOnce(async () => {
      throw { code: "network" } satisfies TestError;
    });
    await state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=pbe"),
    );
    const retry = state.retries.at(-1)!;
    await state.lifecycle.navigate(
      new URL("https://example.test/references/?channel=latest"),
    );
    const callsBeforeRetry = load.mock.calls.length;
    retry();
    await Promise.resolve();
    expect(load.mock.calls).toHaveLength(callsBeforeRetry);
  });

  it("restores the committed URL when a history navigation fails and does not request invalid channels", async () => {
    const navigation = history("https://example.test/references/");
    const state = createLifecycle(navigation, async (channel) => {
      if (channel === "latest") throw { code: "network" } satisfies TestError;
      return "pbe-data";
    });

    await state.lifecycle.start();
    navigation.visit("https://example.test/references/?channel=latest");
    await Promise.resolve();
    expect(navigation.url.search).toBe("");
    expect(navigation.replaces).toEqual(["https://example.test/references/"]);

    navigation.visit("https://example.test/references/?channel=staging");
    await Promise.resolve();
    expect(state.events.at(-1)).toBe("invalid:invalid channel");
  });
});
