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
import {
  RuntimePageOrchestration,
  type RuntimePageSlotDefinition,
  type RuntimePageState as OrchestratedRuntimePageState,
} from "./runtime-page-orchestration";
import {
  formatRuntimeUrl,
  readRuntimeUrlState,
} from "../domain/runtime-url-state";
export {
  createDomRuntimeView,
  shouldHandleRuntimeNavigation,
} from "./runtime-reference-view";

export type RuntimePage = RuntimeListKind | "skins" | "pbe-additions";
export type RuntimePageMode = "list" | "detail" | "pbe";

export interface RuntimeHistory extends RuntimeChannelHistory {}

export interface RuntimeView {
  loading(
    preserve: boolean,
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
  ): void;
  render(state: RuntimePageState): void;
  committed?(channel: "pbe" | "latest", url: URL): void;
  invalid(message: string, channel?: "pbe" | "latest"): void;
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

export function parseRuntimeLocation(
  url: URL,
  page: RuntimePage,
  pageMode: RuntimePageMode,
): RuntimeLocationState {
  const urlState = readRuntimeUrlState(url);
  const selectedChannel = urlState.invalid.includes("channel")
    ? undefined
    : urlState.channel;
  if (selectedChannel === undefined) return { mode: "invalid", page };
  if (page === "pbe-additions") return { mode: "pbe", page };
  if (pageMode === "list") {
    if (page === "skins") return { mode: "invalid", page, channel: selectedChannel };
    return { mode: "list", page, channel: selectedChannel };
  }
  const hasId = url.searchParams.has("id");
  if (
    pageMode === "detail" &&
    (!hasId || urlState.invalid.includes("id") || urlState.id === undefined)
  )
    return { mode: "invalid", page, channel: selectedChannel };
  const id = urlState.id;
  if (!id) return { mode: "invalid", page, channel: selectedChannel };
  if (page === "skins") {
    const championId = urlState.champion;
    if (
      !championId ||
      urlState.invalid.includes("champion")
    )
      return { mode: "invalid", page, channel: selectedChannel };
    const hasStage = url.searchParams.has("stage");
    const stageId = urlState.stage;
    if (hasStage && (urlState.invalid.includes("stage") || !stageId))
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
  if (state.mode === "invalid") return formatRuntimeUrl(url, {}, []);
  if (state.mode === "pbe") return formatRuntimeUrl(url, {}, []);
  const source = readRuntimeUrlState(url);
  const include =
    state.mode === "detail" && state.kind === "skin"
      ? (["id", "champion", "stage", "channel"] as const)
      : (["id", "channel"] as const);
  return formatRuntimeUrl(
    url,
    {
      id: state.mode === "detail" ? state.id : undefined,
      champion: state.mode === "detail" ? state.championId : undefined,
      stage: state.mode === "detail" ? state.stageId : undefined,
      channel: state.mode === "detail" || state.mode === "list" ? state.channel : undefined,
      channelExplicit:
        state.channel === "pbe" &&
        source.channel === "pbe" &&
        source.channelExplicit,
    },
    include,
  );
}

export type RuntimeCoreResult =
  | { readonly mode: "pbe"; readonly items: RuntimePbeAdditions }
  | { readonly mode: "list"; readonly items: RuntimeList }
  | { readonly mode: "detail"; readonly item: RuntimeEntity };

export interface RuntimePageSlotValues {
  readonly "list-skinlines": RuntimeList;
  readonly "relation-skinlines": RuntimeList;
  readonly "relation-universes": RuntimeList;
  readonly "skinline-skins": readonly RuntimeSkinReferenceItem[];
  readonly "universe-skins": readonly RuntimeSkinReferenceGroup[];
}

export type RuntimePageState = OrchestratedRuntimePageState<
  RuntimeLocationState,
  RuntimeCoreResult,
  RuntimePageSlotValues,
  CommunityDragonRuntimeError
>;

export class RuntimeController {
  private readonly lifecycle: RuntimeChannelLifecycle<
    RuntimeLocationState,
    RuntimeCoreResult,
    CommunityDragonRuntimeError
  >;
  private readonly orchestration: RuntimePageOrchestration<
    RuntimeLocationState,
    RuntimeCoreResult,
    RuntimePageSlotValues,
    CommunityDragonRuntimeError
  >;

  constructor(
    private readonly runtime: CommunityDragonRuntime,
    private readonly view: RuntimeView,
    history: RuntimeHistory,
    private readonly options: RuntimeControllerOptions,
  ) {
    this.orchestration = new RuntimePageOrchestration({
      plan: (context, core) => this.planSupplements(context, core),
      normalizeError: (error) =>
        asCommunityDragonError(error, this.options.locale),
      isAborted: (error) => error.code === "aborted",
      onState: (state) => this.view.render(state),
    });
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
          (this.orchestration.begin(context),
          this.view.loading(preserveContent, context)),
        render: (result, context) =>
          this.orchestration.ready(result, context),
        invalid: (message, channel) => {
          this.orchestration.invalidate();
          this.view.invalid(message, channel);
        },
        failure: (error, retry) => {
          const context = this.orchestration.state.context;
          if (context) this.orchestration.failed(error, retry, context);
        },
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
    this.orchestration.invalidate();
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

  private planSupplements(
    context: RuntimeChannelLoadContext<RuntimeLocationState>,
    core: RuntimeCoreResult,
  ): readonly RuntimePageSlotDefinition<
    RuntimeLocationState,
    RuntimeCoreResult,
    RuntimePageSlotValues
  >[] {
    const state = context.target;
    if (core.mode === "pbe") return [];
    if (state.mode === "list") {
      if (state.page !== "universes") return [];
      return [
        {
          key: "list-skinlines" as const,
          load: (slotContext) =>
            this.runtime.list("skinlines", {
              locale: this.options.locale,
              channel: state.channel,
              signal: slotContext.signal,
            }),
        },
      ];
    }
    if (state.mode !== "detail" || core.mode !== "detail") return [];
    if (state.kind === "champion") return [];
    const slots: RuntimePageSlotDefinition<
      RuntimeLocationState,
      RuntimeCoreResult,
      RuntimePageSlotValues
    >[] = [];
    const entity = core.item;
    if (state.kind === "skinline" && entity.kind === "skinline") {
      slots.push(
        {
          key: "skinline-skins",
          load: (slotContext) =>
            this.runtime.listSkinlineSkins(state.id, {
              locale: this.options.locale,
              channel: state.channel,
              signal: slotContext.signal,
            }),
        },
        {
          key: "relation-universes",
          load: (slotContext) =>
            this.runtime.list("universes", {
              locale: this.options.locale,
              channel: state.channel,
              signal: slotContext.signal,
            }),
        },
      );
    } else if (state.kind === "universe" && entity.kind === "universe") {
      slots.push({
        key: "relation-skinlines",
        load: (slotContext) =>
          this.runtime.list("skinlines", {
            locale: this.options.locale,
            channel: state.channel,
            signal: slotContext.signal,
          }),
      });
      slots.push({
        key: "universe-skins",
        load: (slotContext) =>
          this.runtime.listUniverseSkins
            ? this.runtime.listUniverseSkins(state.id, entity.skinlineIds, {
                locale: this.options.locale,
                channel: state.channel,
                signal: slotContext.signal,
              })
            : Promise.resolve([]),
      });
    } else if (state.kind === "skin" && entity.kind === "skin") {
      for (const kind of ["skinlines", "universes"] as const)
        slots.push({
          key:
            kind === "skinlines"
              ? "relation-skinlines"
              : "relation-universes",
          load: (slotContext) =>
            this.runtime.list(kind, {
              locale: this.options.locale,
              channel: state.channel,
              signal: slotContext.signal,
            }),
        });
    }
    return slots;
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
