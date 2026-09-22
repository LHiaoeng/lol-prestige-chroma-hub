import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeEntity,
  type RuntimeList,
  type RuntimeListKind,
} from "../domain/communitydragon-runtime";
import type {
  RuntimeSkinReferenceGroup,
  RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import type { RuntimePbeAdditions } from "../domain/pbe-additions";
import {
  createCommunityDragonRuntime,
  type CommunityDragonRuntime,
} from "./communitydragon-runtime";
import { asCommunityDragonError } from "./communitydragon-errors";
export { runtimeFailureMessage } from "./communitydragon-errors";
import { browserHistory, createDomRuntimeView } from "./runtime-reference-view";
import {
  RuntimeChannelLifecycle,
  type RuntimeChannelLoadContext,
  type RuntimeChannelHistory,
} from "./runtime-channel-lifecycle";
export {
  createDomRuntimeView,
  shouldHandleRuntimeNavigation,
} from "./runtime-reference-view";

export type RuntimePage = RuntimeListKind | "skins" | "pbe-additions";
export type RuntimePageMode = "list" | "detail" | "pbe";

export interface RuntimeHistory extends RuntimeChannelHistory {}

export interface RuntimeView {
  loading(preserve: boolean, channel?: "pbe" | "latest"): void;
  committed?(channel: "pbe" | "latest", url: URL): void;
  renderList(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "list" }>,
  ): void;
  renderDetail(
    item: RuntimeEntity,
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  renderPbeAdditions?(items: RuntimePbeAdditions): void;
  renderRelations?(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  renderSkinlineSkins?(
    items: readonly RuntimeSkinReferenceItem[],
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  renderUniverseSkins?(
    groups: readonly RuntimeSkinReferenceGroup[],
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
  ): void;
  renderListRelations?(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "list" }>,
  ): void;
  invalid(message: string, channel?: "pbe" | "latest"): void;
  failure(error: CommunityDragonRuntimeError, retry: () => void): void;
  relationFailure?(error: CommunityDragonRuntimeError, retry: () => void): void;
  skinlineSkinsFailure?(
    error: CommunityDragonRuntimeError,
    retry: () => void,
  ): void;
  universeSkinsFailure?(
    error: CommunityDragonRuntimeError,
    retry: () => void,
  ): void;
  listRelationsFailure?(
    error: CommunityDragonRuntimeError,
    retry: () => void,
  ): void;
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
      readonly stageId?: number;
      readonly channel: "pbe" | "latest";
    }
  | {
      readonly mode: "invalid";
      readonly page: RuntimePage;
      readonly channel?: "pbe" | "latest";
    }
  | {
      readonly mode: "pbe";
      readonly page: "pbe-additions";
    };

export interface RuntimeControllerOptions {
  readonly page: RuntimePage;
  readonly locale: CommunityDragonLocale;
  readonly pageMode: RuntimePageMode;
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
  pageMode: RuntimePageMode,
): RuntimeLocationState {
  const selectedChannel = channel(url.searchParams.get("channel"));
  if (!selectedChannel) return { mode: "invalid", page };
  if (page === "pbe-additions") return { mode: "pbe", page };
  if (pageMode === "list") {
    if (page === "skins") return { mode: "invalid", page, channel: selectedChannel };
    return { mode: "list", page, channel: selectedChannel };
  }
  const hasId = url.searchParams.has("id");
  const rawId = url.searchParams.get("id");
  if (pageMode === "detail" && !hasId)
    return { mode: "invalid", page, channel: selectedChannel };
  const id = positiveSafeInteger(rawId);
  if (!id) return { mode: "invalid", page, channel: selectedChannel };
  if (page === "skins") {
    const championId = positiveSafeInteger(url.searchParams.get("champion"));
    if (!championId) return { mode: "invalid", page, channel: selectedChannel };
    const hasStage = url.searchParams.has("stage");
    const stageId = positiveSafeInteger(url.searchParams.get("stage"));
    if (hasStage && !stageId)
      return { mode: "invalid", page, channel: selectedChannel };
    return {
      mode: "detail",
      page,
      kind: "skin",
      id,
      championId,
      stageId,
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
  if (state.mode === "pbe") return next;
  if (state.mode === "detail") {
    next.searchParams.set("id", String(state.id));
    if (state.kind === "skin" && state.championId)
      next.searchParams.set("champion", String(state.championId));
    if (state.kind === "skin" && state.stageId)
      next.searchParams.set("stage", String(state.stageId));
  }
  if (state.channel === "latest") next.searchParams.set("channel", "latest");
  return next;
}

type RuntimeDetailState = Extract<RuntimeLocationState, { mode: "detail" }>;

type RuntimeCoreResult =
  | { readonly mode: "pbe"; readonly items: RuntimePbeAdditions }
  | { readonly mode: "list"; readonly items: RuntimeList }
  | { readonly mode: "detail"; readonly item: RuntimeEntity };

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
    const universeIds = entity.universeIds ?? [];
    return items.filter(
      (item) =>
        (item.kind === "skinline" && skinlineIds.includes(item.id)) ||
        (item.kind === "universe" &&
          (universeIds.includes(item.id) ||
            item.skinlineIds.some((id) => skinlineIds.includes(id)))),
    );
  }
  return [];
}

export class RuntimeController {
  private readonly lifecycle: RuntimeChannelLifecycle<
    RuntimeLocationState,
    RuntimeCoreResult,
    CommunityDragonRuntimeError
  >;

  constructor(
    private readonly runtime: CommunityDragonRuntime,
    private readonly view: RuntimeView,
    history: RuntimeHistory,
    private readonly options: RuntimeControllerOptions,
  ) {
    this.lifecycle = new RuntimeChannelLifecycle({
      history,
      parse: (url) => {
        const state = parseRuntimeLocation(
          url,
          this.options.page,
          this.options.pageMode,
        );
        if (state.mode === "invalid")
          return {
            status: "invalid",
            channel: state.channel,
            message:
              this.options.locale === "zh_cn"
                ? "链接无效，请检查实体 ID 与版本数据源。"
                : "This link is invalid. Check the entity ID and data channel.",
          };
        return {
          status: "valid",
          channel: state.mode === "pbe" ? "pbe" : state.channel,
          target: state,
        };
      },
      load: (state, signal) => this.loadCore(state, signal),
      normalizeError: (error) =>
        asCommunityDragonError(error, this.options.locale),
      isAborted: (error) => error.code === "aborted",
      view: {
        loading: (preserveContent, context) =>
          this.view.loading(
            preserveContent,
            context.target.mode === "pbe" ? undefined : context.channel,
          ),
        render: (result, context) => this.renderCore(result, context),
        invalid: (message, channel) => this.view.invalid(message, channel),
        failure: (error, retry) => this.view.failure(error, retry),
        committed: (context) =>
          this.view.committed?.(context.channel, context.url),
      },
    });
  }

  start(): Promise<void> {
    return this.lifecycle.start();
  }

  navigate(url: URL): Promise<void> {
    return this.lifecycle.navigate(url);
  }

  dispose(): void {
    this.lifecycle.dispose();
  }

  private async loadCore(
    state: RuntimeLocationState,
    signal: AbortSignal,
  ): Promise<RuntimeCoreResult> {
    if (state.mode === "pbe") {
      const getPbeAdditions = this.runtime.getPbeAdditions;
      if (!getPbeAdditions)
        throw new CommunityDragonRuntimeError(
          "not-found",
          "PBE additions are unavailable",
        );
      return {
        mode: "pbe",
        items: await getPbeAdditions({
          locale: this.options.locale,
          signal,
        }),
      };
    }
    if (state.mode === "list")
      return {
        mode: "list",
        items: await this.runtime.list(state.page, {
          locale: this.options.locale,
          channel: state.channel,
          signal,
        }),
      };
    if (state.mode !== "detail")
      throw new Error("Invalid runtime state reached the core loader");
    return {
      mode: "detail",
      item: await this.runtime.get(state.kind, state.id, {
        locale: this.options.locale,
        channel: state.channel,
        championId: state.championId,
        stageId: state.stageId,
        signal,
      }),
    };
  }

  private renderCore(
    result: RuntimeCoreResult,
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): void {
    const state = context.target;
    if (state.mode === "pbe" && result.mode === "pbe") {
      this.view.renderPbeAdditions?.(result.items);
      return;
    }
    if (state.mode === "list" && result.mode === "list") {
      this.view.renderList(result.items, state);
      if (state.page === "universes")
        void this.loadUniverseListRelations(state, context);
      return;
    }
    if (state.mode === "detail" && result.mode === "detail") {
      this.view.renderDetail(result.item, state);
      const listKinds = relationKinds(state);
      if (listKinds.length)
        void this.loadRelations(result.item, state, listKinds, context);
      if (state.kind === "skinline")
        void this.loadSkinlineSkins(state, context);
      if (state.kind === "universe" && result.item.kind === "universe")
        void this.loadUniverseSkins(result.item, state, context);
    }
  }

  private async loadSkinlineSkins(
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): Promise<void> {
    try {
      const items = await this.runtime.listSkinlineSkins(state.id, {
        locale: this.options.locale,
        channel: state.channel,
        signal: context.signal,
      });
      if (!context.isCurrent()) return;
      this.view.renderSkinlineSkins?.(items, state);
    } catch (error) {
      if (!context.isCurrent()) return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.skinlineSkinsFailure?.(runtimeError, () => {
        if (context.isCurrent()) void this.loadSkinlineSkins(state, context);
      });
    }
  }

  private async loadUniverseSkins(
    entity: Extract<RuntimeEntity, { kind: "universe" }>,
    state: Extract<RuntimeLocationState, { mode: "detail" }>,
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): Promise<void> {
    if (!this.runtime.listUniverseSkins) return;
    try {
      const groups = await this.runtime.listUniverseSkins(
        state.id,
        entity.skinlineIds,
        {
          locale: this.options.locale,
          channel: state.channel,
          signal: context.signal,
        },
      );
      if (!context.isCurrent()) return;
      this.view.renderUniverseSkins?.(groups, state);
    } catch (error) {
      if (!context.isCurrent()) return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.universeSkinsFailure?.(runtimeError, () => {
        if (context.isCurrent())
          void this.loadUniverseSkins(entity, state, context);
      });
    }
  }

  private async loadUniverseListRelations(
    state: Extract<RuntimeLocationState, { mode: "list" }>,
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): Promise<void> {
    try {
      const items = await this.runtime.list("skinlines", {
        locale: this.options.locale,
        channel: state.channel,
        signal: context.signal,
      });
      if (!context.isCurrent()) return;
      this.view.renderListRelations?.(items, state);
    } catch (error) {
      if (!context.isCurrent()) return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.listRelationsFailure?.(runtimeError, () => {
        if (context.isCurrent())
          void this.loadUniverseListRelations(state, context);
      });
    }
  }

  private async loadRelations(
    entity: RuntimeEntity,
    state: RuntimeDetailState,
    kinds: readonly Extract<RuntimeListKind, "skinlines" | "universes">[],
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): Promise<void> {
    try {
      const results = await Promise.allSettled(
        kinds.map((kind) =>
          this.runtime.list(kind, {
            locale: this.options.locale,
            channel: state.channel,
            signal: context.signal,
          }),
        ),
      );
      if (!context.isCurrent()) return;
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
          if (context.isCurrent())
            void this.loadRelations(entity, state, kinds, context);
        });
      }
    } catch (error) {
      if (!context.isCurrent()) return;
      const runtimeError = asCommunityDragonError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.relationFailure?.(runtimeError, () => {
        if (context.isCurrent())
          void this.loadRelations(entity, state, kinds, context);
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
    !pageMode ||
    (locale !== "default" && locale !== "zh_cn") ||
    (pageMode !== "list" && pageMode !== "detail" && pageMode !== "pbe") ||
    (page === "skins" && pageMode === "list") ||
    (page === "pbe-additions" && pageMode !== "pbe") ||
    (page !== "pbe-additions" && pageMode === "pbe")
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
