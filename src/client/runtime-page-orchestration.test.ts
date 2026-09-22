import { describe, expect, it, vi } from "vitest";
import type { RuntimeChannelLoadContext } from "./runtime-channel-lifecycle";
import {
  RuntimePageOrchestration,
  type RuntimePageSlotDefinition,
} from "./runtime-page-orchestration";

interface Slots {
  readonly relations: readonly string[];
  readonly skins: readonly string[];
}

type TestError = { readonly code: "network" | "aborted" };

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function context(id: string, current: () => boolean): RuntimeChannelLoadContext<string> {
  return {
    channel: "pbe",
    target: id,
    url: new URL(`https://example.test/references/?id=${id}`),
    signal: new AbortController().signal,
    isCurrent: current,
  };
}

function orchestration(
  plan: RuntimePageSlotDefinition<string, string, Slots>[],
) {
  const states: string[] = [];
  const instance = new RuntimePageOrchestration({
    plan: () => plan,
    normalizeError: (error) => error as TestError,
    isAborted: (error) => error.code === "aborted",
    onState: (state) =>
      states.push(
        `${state.core.status}:${Object.entries(state.slots)
          .map(([key, slot]) => `${key}:${slot?.status}`)
          .join(",")}`,
      ),
  });
  return { instance, states };
}

describe("RuntimePageOrchestration", () => {
  it("publishes core first and retries only the failed supplement", async () => {
    const relations = deferred<readonly string[]>();
    const skins = deferred<readonly string[]>();
    const retrySkins = deferred<readonly string[]>();
    const loadRelations = vi.fn(() => relations.promise);
    const loadSkins = vi
      .fn()
      .mockImplementationOnce(() => skins.promise)
      .mockImplementationOnce(() => retrySkins.promise);
    const { instance, states } = orchestration([
      { key: "relations", load: loadRelations },
      { key: "skins", load: loadSkins },
    ]);
    let current = true;
    const page = context("skin", () => current);

    instance.begin(page);
    instance.ready("core", page);
    expect(instance.state.core).toEqual({ status: "ready", value: "core" });
    expect(instance.state.slots.relations).toEqual({ status: "loading" });
    expect(instance.state.slots.skins).toEqual({ status: "loading" });
    expect(states.slice(0, 2)).toEqual(["loading:", "ready:relations:loading,skins:loading"]);

    relations.resolve(["series"]);
    await Promise.resolve();
    expect(instance.state.slots.relations).toEqual({
      status: "ready",
      value: ["series"],
    });

    skins.reject({ code: "network" } satisfies TestError);
    await Promise.resolve();
    const failed = instance.state.slots.skins;
    expect(failed?.status).toBe("failed");
    if (failed?.status !== "failed") throw new Error("expected failed slot");
    expect(loadRelations).toHaveBeenCalledTimes(1);
    expect(loadSkins).toHaveBeenCalledTimes(1);

    failed.retry();
    failed.retry();
    expect(loadSkins).toHaveBeenCalledTimes(2);
    retrySkins.resolve(["skin"]);
    await Promise.resolve();
    expect(instance.state.slots.skins).toEqual({
      status: "ready",
      value: ["skin"],
    });
    current = false;
  });

  it("distinguishes an empty supplement and ignores stale results", async () => {
    const oldRelations = deferred<readonly string[]>();
    const newRelations = deferred<readonly string[]>();
    let active = "old";
    const { instance } = orchestration([
      {
        key: "relations",
        load: (page) =>
          page.target === "old" ? oldRelations.promise : newRelations.promise,
      },
    ]);
    const oldPage = context("old", () => active === "old");
    instance.begin(oldPage);
    instance.ready("old-core", oldPage);
    active = "new";
    const newPage = context("new", () => active === "new");
    instance.begin(newPage);
    instance.ready("new-core", newPage);

    oldRelations.resolve(["stale"]);
    await Promise.resolve();
    expect(instance.state.context).toBe(newPage);
    expect(instance.state.slots.relations).toEqual({ status: "loading" });

    newRelations.resolve([]);
    await Promise.resolve();
    expect(instance.state.slots.relations).toEqual({ status: "empty", value: [] });
  });

  it("does not turn cancellation into a retryable failure", async () => {
    const request = deferred<readonly string[]>();
    const { instance } = orchestration([
      { key: "relations", load: () => request.promise },
    ]);
    const page = context("skin", () => true);
    instance.begin(page);
    instance.ready("core", page);
    request.reject({ code: "aborted" } satisfies TestError);
    await Promise.resolve();
    expect(instance.state.slots.relations).toEqual({ status: "loading" });
  });
});
