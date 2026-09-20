import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeEntity,
  type RuntimeList,
  type RuntimeListKind,
} from "../domain/communitydragon-runtime";
import {
  createCommunityDragonRuntime,
  type CommunityDragonRuntime,
} from "./communitydragon-runtime";
import { asCommunityDragonError } from "./communitydragon-errors";
export { runtimeFailureMessage } from "./communitydragon-errors";
import { browserHistory, createDomRuntimeView } from "./runtime-reference-view";
export {
  createDomRuntimeView,
  shouldHandleRuntimeNavigation,
} from "./runtime-reference-view";

export type RuntimePage = RuntimeListKind | "skins";
export type RuntimePageMode = "legacy" | "list" | "detail";

export interface RuntimeHistory {
  readonly url: URL;
  push(url: URL): void;
  replace(url: URL): void;
  onPopState(listener: () => void): () => void;
}

export interface RuntimeView {
  loading(preserve: boolean): void;
  renderList(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "list" }>,
  ): void;
  renderDetail(
    item: RuntimeEntity,
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  renderRelations?(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  invalid(message: string): void;
  failure(error: CommunityDragonRuntimeError, retry: () => void): void;
  relationFailure?(error: CommunityDragonRuntimeError, retry: () => void): void;
  intro?(): void;
}

export type RuntimeLocationState =
  | {
      readonly mode: "list";
      readonly page: RuntimeListKind;
      readonly channel: "pbe" | "latest";
    }
  | {
      readonly mode: "detail";
      readonly page: RuntimePage;
      readonly kind: "champion" | "skin" | "skinline" | "universe";
      readonly id: number;
      readonly championId?: number;
      readonly channel: "pbe" | "latest";
    }
  | {
      readonly mode: "intro";
      readonly page: "skins";
      readonly channel: "pbe" | "latest";
    }
  | {
      readonly mode: "invalid";
      readonly page: RuntimePage;
      readonly channel?: "pbe" | "latest";
    };

export interface RuntimeControllerOptions {
  readonly page: RuntimePage;
  readonly locale: CommunityDragonLocale;
  readonly pageMode?: RuntimePageMode;
}

function positiveSafeInteger(value: string | null): number | undefined {
  if (!value || !/^[1-9]\d*$/.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : undefined;
}

function channel(value: string | null): "pbe" | "latest" | undefined {
  if (value === null) return "pbe";
  return value === "pbe" || value === "latest" ? value : undefined;
}

export function parseRuntimeLocation(
  url: URL,
  page: RuntimePage,
  pageMode: RuntimePageMode = "legacy",
): RuntimeLocationState {
  const selectedChannel = channel(url.searchParams.get("channel"));
  if (!selectedChannel) return { mode: "invalid", page };
  const hasId = url.searchParams.has("id");
  const rawId = url.searchParams.get("id");
  if (pageMode === "list") {
    if (page === "skins")
      return { mode: "intro", page, channel: selectedChannel };
    return { mode: "list", page, channel: selectedChannel };
  }
  if (pageMode === "detail" && !hasId)
    return { mode: "invalid", page, channel: selectedChannel };
  if (!hasId) {
    if (page === "skins")
      return { mode: "intro", page, channel: selectedChannel };
    return { mode: "list", page, channel: selectedChannel };
  }
  const id = positiveSafeInteger(rawId);
  if (!id) return { mode: "invalid", page, channel: selectedChannel };
  if (page === "skins") {
    const championId = positiveSafeInteger(url.searchParams.get("champion"));
    if (!championId) return { mode: "invalid", page, channel: selectedChannel };
    return {
      mode: "detail",
      page,
      kind: "skin",
      id,
      championId,
      channel: selectedChannel,
    };
  }
  const kind =
    page === "champions"
      ? "champion"
      : page === "skinlines"
        ? "skinline"
        : "universe";
  return { mode: "detail", page, kind, id, channel: selectedChannel };
}

export function formatRuntimeState(url: URL, state: RuntimeLocationState): URL {
  const next = new URL(url);
  next.search = "";
  if (state.mode === "invalid") return next;
  if (state.mode === "detail") {
    next.searchParams.set("id", String(state.id));
    if (state.kind === "skin" && state.championId)
      next.searchParams.set("champion", String(state.championId));
  }
  if (state.channel === "latest") next.searchParams.set("channel", "latest");
  return next;
}

type RuntimeDetailState = Extract<RuntimeLocationState, { mode: "detail" }>;

function relationKinds(
  state: RuntimeDetailState,
): readonly Extract<RuntimeListKind, "skinlines" | "universes">[] {
  if (state.kind === "skinline") return ["universes"];
  if (state.kind === "universe") return ["skinlines"];
  if (state.kind === "skin") return ["skinlines", "universes"];
  return [];
}

function relatedItems(
  entity: RuntimeEntity,
  state: RuntimeDetailState,
  items: RuntimeList,
): RuntimeList {
  if (state.kind === "skinline" && entity.kind === "skinline") {
    return items.filter(
      (item) =>
        item.kind === "universe" &&
        (entity.universeIds.includes(item.id) ||
          item.skinlineIds.includes(state.id)),
    );
  }
  if (state.kind === "universe" && entity.kind === "universe") {
    return items.filter(
      (item) =>
        item.kind === "skinline" &&
        (entity.skinlineIds.includes(item.id) ||
          item.universeIds.includes(state.id)),
    );
  }
  if (state.kind === "skin" && entity.kind === "skin") {
    const skinlineIds = entity.skinlineIds;
    return items.filter(
      (item) =>
        (item.kind === "skinline" && skinlineIds.includes(item.id)) ||
        (item.kind === "universe" &&
          item.skinlineIds.some((id) => skinlineIds.includes(id))),
    );
  }
  return [];
}

export class RuntimeController {
  private abortController: AbortController | undefined;
  private generation = 0;
  private hasContent = false;
  private unsubscribePopState: (() => void) | undefined;

  constructor(
    private readonly runtime: CommunityDragonRuntime,
    private readonly view: RuntimeView,
    private readonly history: RuntimeHistory,
    private readonly options: RuntimeControllerOptions,
  ) {}

  start(): Promise<void> {
    this.unsubscribePopState?.();
    this.unsubscribePopState = this.history.onPopState(() => {
      void this.load(this.history.url, false);
    });
    return this.load(this.history.url, false);
  }

  navigate(url: URL): Promise<void> {
    return this.load(url, true);
  }

  dispose(): void {
    this.unsubscribePopState?.();
    this.unsubscribePopState = undefined;
    this.abortController?.abort();
    this.generation += 1;
  }

  private async load(url: URL, commit: boolean): Promise<void> {
    const state = parseRuntimeLocation(
      url,
      this.options.page,
      this.options.pageMode,
    );
    if (state.mode === "invalid") {
      this.abortController?.abort();
      this.generation += 1;
      this.view.invalid(
        this.options.locale === "zh_cn"
          ? "链接无效，请检查实体 ID 与版本数据源。"
          : "This link is invalid. Check the entity ID and data channel.",
      );
      return;
    }
    if (state.mode === "intro") {
      this.abortController?.abort();
      this.generation += 1;
      this.view.intro?.();
      return;
    }

    const generation = ++this.generation;
    this.abortController?.abort();
    const controller = new AbortController();
    this.abortController = controller;
    this.view.loading(this.hasContent);
    try {
      if (state.mode === "list") {
        const result = await this.runtime.list(state.page, {
          locale: this.options.locale,
          channel: state.channel,
          signal: controller.signal,
        });
        if (generation !== this.generation) return;
        this.view.renderList(result, state);
      } else {
        const result = await this.runtime.get(state.kind, state.id, {
          locale: this.options.locale,
          channel: state.channel,
          championId: state.championId,
          signal: controller.signal,
        });
        if (generation !== this.generation) return;
        this.view.renderDetail(result, state);
        const listKinds = relationKinds(state);
        if (listKinds.length)
          void this.loadRelations(
            result,
            state,
            listKinds,
            generation,
            controller,
          );
      }
      if (generation !== this.generation) return;
      this.hasContent = true;
      if (commit && this.history.url.href !== url.href) this.history.push(url);
    } catch (error) {
      if (generation !== this.generation) return;
      if (
        error instanceof CommunityDragonRuntimeError &&
        error.code === "aborted"
      )
        return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      this.view.failure(runtimeError, () => {
        void this.load(url, commit);
      });
    }
  }

  private async loadRelations(
    entity: RuntimeEntity,
    state: RuntimeDetailState,
    kinds: readonly Extract<RuntimeListKind, "skinlines" | "universes">[],
    generation: number,
    controller: AbortController,
  ): Promise<void> {
    try {
      const results = await Promise.allSettled(
        kinds.map((kind) =>
          this.runtime.list(kind, {
            locale: this.options.locale,
            channel: state.channel,
            signal: controller.signal,
          }),
        ),
      );
      if (generation !== this.generation) return;
      const items = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );
      this.view.renderRelations?.(relatedItems(entity, state, items), state);
      const rejected = results.find(
        (result): result is PromiseRejectedResult =>
          result.status === "rejected",
      );
      if (rejected) {
        const runtimeError = asCommunityDragonError(
          rejected.reason,
          this.options.locale,
        );
        if (runtimeError.code === "aborted") return;
        this.view.relationFailure?.(runtimeError, () => {
          void this.loadRelations(entity, state, kinds, generation, controller);
        });
      }
    } catch (error) {
      if (generation !== this.generation) return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.relationFailure?.(runtimeError, () => {
        void this.loadRelations(entity, state, kinds, generation, controller);
      });
    }
  }
}

export function initRuntimeReference(root: HTMLElement): RuntimeController {
  const page = root.dataset.runtimePage as RuntimePage | undefined;
  const pageMode = root.dataset.runtimeMode as RuntimePageMode | undefined;
  const locale = root.dataset.runtimeLocale as
    CommunityDragonLocale | undefined;
  if (
    !page ||
    !locale ||
    (locale !== "default" && locale !== "zh_cn") ||
    (pageMode &&
      pageMode !== "legacy" &&
      pageMode !== "list" &&
      pageMode !== "detail")
  )
    throw new Error("Runtime reference root is missing a valid page or locale");
  const source = root
    .closest<HTMLElement>(".runtime-page")
    ?.querySelector<HTMLElement>("[data-runtime-source]");
  if (!source) throw new Error("Runtime reference source controls are missing");
  const history = browserHistory();
  const runtime = createCommunityDragonRuntime();
  let controller!: RuntimeController;
  const view = createDomRuntimeView({
    root,
    source,
    locale,
    page,
    getController: () => controller,
    history,
  });
  controller = new RuntimeController(runtime, view, history, {
    page,
    pageMode,
    locale,
  });
  void controller.start();
  return controller;
}
