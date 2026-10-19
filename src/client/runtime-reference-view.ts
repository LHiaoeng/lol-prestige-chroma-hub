import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeEntity,
  type RuntimeList,
} from "../domain/communitydragon-runtime";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import type { RuntimePbeAdditionsStream } from "../domain/pbe-additions";
import type {
  RuntimeSkinReferenceGroup,
  RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import { runtimeFailureMessage } from "./communitydragon-errors";
import {
  bindRuntimeChannelLinks,
  bindRuntimeLanguageToggle,
} from "./runtime-url-state-dom";
import {
  formatRuntimeUrl,
  readRuntimeUrlState,
} from "../domain/runtime-url-state";
import type {
  RuntimeHistory,
  RuntimeLocationState,
  RuntimePage,
  RuntimeView,
} from "./runtime-reference";
import type { RuntimeChannelLoadContext } from "./runtime-channel-lifecycle";
import { createRuntimeDetailRenderer } from "./runtime-reference-detail-renderer";
import { createRuntimeListRenderer } from "./runtime-reference-list-renderer";
import { createRuntimePbeRenderer } from "./runtime-reference-pbe-renderer";
import { setDomainIconTooltip } from "../components/domain-icons";
import {
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
export { shouldHandleRuntimeNavigation } from "./runtime-reference-view-shared";

export interface RuntimeControllerLike {
  navigate(url: URL): Promise<void>;
}

export interface DomRuntimeViewOptions {
  readonly root: HTMLElement;
  readonly source: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly page: RuntimePage;
  readonly getController: () => RuntimeControllerLike;
  readonly history: RuntimeHistory;
}

interface DomRenderInternals {
  renderList(items: RuntimeList, state: Extract<RuntimeLocationState, { mode: "list" }>): void;
  renderDetail(item: RuntimeEntity, state: Extract<RuntimeLocationState, { mode: "detail" }>): void;
  renderPbeAdditions(items: RuntimePbeAdditionsStream): void;
  renderRelations(items: RuntimeList, state: Extract<RuntimeLocationState, { mode: "detail" }>): void;
  renderSkinlineSkins(items: readonly RuntimeSkinReferenceItem[], state: Extract<RuntimeLocationState, { mode: "detail" }>): void;
  renderUniverseSkins(groups: readonly RuntimeSkinReferenceGroup[], state: Extract<RuntimeLocationState, { mode: "detail" }>): void;
  renderListRelations(items: RuntimeList, state: Extract<RuntimeLocationState, { mode: "list" }>): void;
  relationFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
  skinlineSkinsFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
  universeSkinsFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
  listRelationsFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
  failure(error: CommunityDragonRuntimeError, retry: () => void): void;
}

export function browserHistory(): RuntimeHistory {
  return {
    get url() {
      return new URL(window.location.href);
    },
    push(url) {
      window.history.pushState({}, "", url);
    },
    replace(url) {
      window.history.replaceState({}, "", url);
    },
    onPopState(listener) {
      window.addEventListener("popstate", listener);
      return () => window.removeEventListener("popstate", listener);
    },
  };
}

export function createDomRuntimeView(options: DomRuntimeViewOptions): RuntimeView {
  const { source } = options;
  const status =
    options.root.querySelector<HTMLElement>("[data-runtime-status]") ??
    textNode("p", "");
  const content =
    options.root.querySelector<HTMLElement>("[data-runtime-content]") ??
    document.createElement("div");
  const pageShell = options.root.closest<HTMLElement>("[data-runtime-page-shell]");
  const pbeSummary = pageShell?.querySelector<HTMLElement>("[data-runtime-pbe-summary]") ?? null;
  const pbeSummarySkeleton = pbeSummary?.firstElementChild?.cloneNode(true);
  const entityDetailSummary = options.root.ownerDocument.querySelector<HTMLElement>(
    "[data-runtime-entity-detail-summary]",
  );
  const entityHeaderSkeleton = options.root.ownerDocument.querySelector<HTMLElement>(
    "[data-runtime-entity-header-skeleton]",
  );
  const entityChannelSource = options.root.ownerDocument.querySelector<HTMLElement>(
    "[data-runtime-entity-detail-source], [data-runtime-universe-detail-source]",
  );
  const entityDivider = options.root.ownerDocument.querySelector<HTMLElement>(
    ".runtime-entity-detail-divider, .runtime-universe-detail-divider",
  );
  entityHeaderSkeleton?.addEventListener("animationend", (event) => {
    if (
      event.animationName === "runtime-skeleton-exit" &&
      !pageShell?.hasAttribute("data-runtime-loading")
    ) entityHeaderSkeleton.setAttribute("hidden", "");
  });
  const clearRuntimeAlert = () =>
    options.root.querySelector("[data-runtime-error-alert]")?.remove();
  const showFallbackNotice = (context: RuntimeChannelLoadContext<RuntimeLocationState>) => {
    options.root.querySelector("[data-runtime-fallback-notice]")?.remove();
    const reason = context.url.searchParams.get("fallback");
    const isChampionDetail = context.target.mode === "detail" && context.target.kind === "champion";
    const isChampionList = context.target.mode === "list" && context.target.page === "champions";
    if (!reason || (reason === "skin" && !isChampionDetail) ||
      (reason === "skin-champion" && !isChampionList) ||
      (reason === "champion" && !isChampionList) ||
      (reason === "skinline" && !(context.target.mode === "list" && context.target.page === "skinlines")) ||
      (reason === "universe" && !(context.target.mode === "list" && context.target.page === "universes"))) return;
    const messages = options.locale === "zh_cn" ? {
      skin: "目标通道没有该皮肤，已显示所属英雄资料。",
      "skin-champion": "目标通道没有该皮肤及所属英雄，已显示英雄目录。",
      champion: "目标通道没有该英雄，已显示英雄目录。",
      skinline: "目标通道没有该皮肤系列，已显示皮肤系列目录。",
      universe: "目标通道没有该皮肤宇宙，已显示皮肤宇宙目录。",
    } : {
      skin: "This skin is unavailable in the selected channel. Showing its champion instead.",
      "skin-champion": "This skin and its champion are unavailable in the selected channel. Showing the champion directory.",
      champion: "This champion is unavailable in the selected channel. Showing the champion directory.",
      skinline: "This skinline is unavailable in the selected channel. Showing the skinline directory.",
      universe: "This universe is unavailable in the selected channel. Showing the universe directory.",
    };
    if (!Object.hasOwn(messages, reason)) return;
    const notice = textNode("p", `${communityDragonChannelLabel(context.channel, options.locale)}${options.locale === "zh_cn" ? "：" : ": "}${messages[reason as keyof typeof messages]}`);
    notice.dataset.runtimeFallbackNotice = "";
    notice.setAttribute("role", "status");
    content.before(notice);
  };
  if (!status.parentElement) options.root.append(status);
  if (!content.parentElement) options.root.append(content);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const channelLabel = source.querySelector<HTMLElement>(
    "[data-runtime-channel-label]",
  );
  const channelIcon = source.querySelector<SVGSVGElement>(
    ".domain-icon--reference",
  );
  let renderedContext: RuntimeChannelLoadContext<RuntimeLocationState> | undefined;
  let preservingContent = false;
  const preservesExplicitPbe = () =>
    readRuntimeUrlState(renderedContext?.url ?? options.history.url)
      .channelExplicit;
  const updateChannel = (selected: "pbe" | "latest") => {
    source
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        const active = button.dataset.runtimeChannel === selected;
        button.setAttribute("aria-checked", String(active));
        if (button.getAttribute("role") !== "menuitemradio")
          button.setAttribute("aria-pressed", String(active));
        if (button.dataset.runtimeChannel)
          button.textContent = communityDragonChannelLabel(
            button.dataset.runtimeChannel as "pbe" | "latest",
            options.locale,
          );
      });
    const selectedLabel = communityDragonChannelLabel(selected, options.locale);
    if (channelLabel) channelLabel.textContent = selectedLabel;
    if (channelIcon)
      setDomainIconTooltip(channelIcon, "reference", selectedLabel, options.locale);
    bindRuntimeChannelLinks(document, options.history.url);
    bindRuntimeLanguageToggle(document, options.history.url);
  };

  const listRenderer = createRuntimeListRenderer({
    content,
    status,
    locale: options.locale,
    page: options.page === "champions" || options.page === "skinlines" || options.page === "universes"
      ? options.page
      : "champions",
    getController: options.getController,
    preservesExplicitPbe,
    updateChannel,
  });
  const detailRenderer = createRuntimeDetailRenderer({
    content,
    status,
    locale: options.locale,
    getController: options.getController,
    preservesExplicitPbe,
    updateChannel,
  });
  const pbeRenderer = createRuntimePbeRenderer({
    content,
    summary: pbeSummary,
    status,
    locale: options.locale,
    getController: options.getController,
  });

  const view: RuntimeView & DomRenderInternals = {
    renderList(items, state) {
      listRenderer.render(items, state);
    },
    renderDetail(item, state) {
      detailRenderer.render(item, state);
    },
    renderPbeAdditions(items) {
      pbeRenderer.render(items);
    },
    renderRelations(items, state) {
      detailRenderer.renderRelationsItems(items, state);
    },
    renderSkinlineSkins(items, state) {
      detailRenderer.renderSkinlineSkins(items, state);
    },
    renderUniverseSkins(groups) {
      detailRenderer.renderUniverseSkins(groups);
    },
    renderListRelations(items) {
      listRenderer.renderRelations(items);
    },
    relationFailure(error, retry) {
      detailRenderer.showRelationFailure(error, retry);
    },
    skinlineSkinsFailure(error, retry) {
      detailRenderer.showSkinlineSkinsFailure(error, retry);
    },
    universeSkinsFailure(error, retry) {
      detailRenderer.showUniverseSkinsFailure(error, retry);
    },
    listRelationsFailure(error, retry) {
      listRenderer.listRelationsFailure(error, retry);
    },
    render(state) {
      if (state.core.status === "failed") {
        options.root.removeAttribute("aria-busy");
        view.failure(state.core.error, state.core.retry);
        return;
      }
      if (state.core.status !== "ready" || !state.context) return;
      const { context } = state;
      options.root.removeAttribute("aria-busy");
      pageShell?.removeAttribute("data-runtime-loading");
      if (entityHeaderSkeleton) {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          entityHeaderSkeleton.setAttribute("hidden", "");
        else entityHeaderSkeleton.setAttribute("data-runtime-exiting", "");
      }
      status.textContent = "";
      clearRuntimeAlert();
      if (renderedContext !== context) {
        renderedContext = context;
        const target = context.target;
        if (state.core.value.mode === "pbe")
          pbeRenderer.render(state.core.value.items);
        else if (target.mode === "list" && state.core.value.mode === "list")
          listRenderer.render(state.core.value.items, target);
        else if (target.mode === "detail" && state.core.value.mode === "detail")
          detailRenderer.render(state.core.value.item, target);
        showFallbackNotice(context);
      }

      const target = context.target;
      if (target.mode === "list" && target.page === "universes") {
        const slot = state.slots["list-skinlines"];
        if (slot?.status === "loading") listRenderer.listRelationsLoading();
        else if (slot?.status === "ready" || slot?.status === "empty")
          listRenderer.renderRelations(slot.value);
        else if (slot?.status === "failed")
          listRenderer.listRelationsFailure(slot.error, slot.retry);
        return;
      }
      if (target.mode === "list" && target.page === "skinlines") {
        const slot = state.slots["list-universes"];
        if (slot?.status === "ready" || slot?.status === "empty")
          listRenderer.renderRelations(slot.value);
        return;
      }
      if (target.mode !== "detail" || state.core.value.mode !== "detail") return;
      const entity = state.core.value.item;
      const skinlineSkins = state.slots["skinline-skins"];
      if (skinlineSkins?.status === "loading")
        detailRenderer.showSupplementLoading("skinline");
      else if (skinlineSkins?.status === "ready" || skinlineSkins?.status === "empty")
        detailRenderer.renderSkinlineSkins(skinlineSkins.value, target);
      else if (skinlineSkins?.status === "failed")
        detailRenderer.showSkinlineSkinsFailure(skinlineSkins.error, skinlineSkins.retry);

      const universeSkins = state.slots["universe-skins"];
      if (universeSkins?.status === "loading")
        detailRenderer.showSupplementLoading("universe");
      else if (universeSkins?.status === "ready" || universeSkins?.status === "empty")
        detailRenderer.renderUniverseSkins(universeSkins.value);
      else if (universeSkins?.status === "failed")
        detailRenderer.showUniverseSkinsFailure(universeSkins.error, universeSkins.retry);
      detailRenderer.renderRelations(state, entity, target);
      const summarySlots = target.kind === "skin"
        ? ["relation-skinlines", "relation-universes"] as const
        : target.kind === "skinline"
          ? ["relation-universes", "skinline-skins"] as const
          : target.kind === "universe"
            ? ["universe-skins"] as const
            : [];
      entityChannelSource?.toggleAttribute(
        "data-runtime-summary-loading",
        summarySlots.some((key) => !state.slots[key] || state.slots[key].status === "loading"),
      );
    },
    committed(channel, url) {
      updateChannel(channel);
      bindRuntimeChannelLinks(document, url);
      bindRuntimeLanguageToggle(document, url);
    },
    loading(preserve, context) {
      preservingContent = preserve;
      options.root.setAttribute("aria-busy", "true");
      if (!preserve) pageShell?.setAttribute("data-runtime-loading", "");
      if (!preserve && context && typeof context === "object" && context.target.mode === "pbe") {
        pbeSummary?.removeAttribute("hidden");
        if (pbeSummarySkeleton) pbeSummary?.replaceChildren(pbeSummarySkeleton.cloneNode(true));
      }
      clearRuntimeAlert();
      const isEntityDetail =
        context &&
        typeof context === "object" &&
        context.target.mode === "detail" &&
        ["champion", "skin", "skinline", "universe"].includes(context.target.kind);
      if (isEntityDetail && !preserve) {
        entityDetailSummary?.removeAttribute("hidden");
        entityHeaderSkeleton?.removeAttribute("data-runtime-exiting");
        entityHeaderSkeleton?.removeAttribute("hidden");
        if (entityDetailSummary && entityChannelSource && entityDivider)
          entityDetailSummary.append(entityChannelSource, entityDivider);
        entityChannelSource?.setAttribute("data-runtime-summary-loading", "");
      } else if (!preserve) entityHeaderSkeleton?.setAttribute("hidden", "");
      if (isEntityDetail && !preserve) detailRenderer.showDetailSummaryLoading();
      const channel =
        context && typeof context === "object"
          ? context.target.mode === "pbe"
            ? undefined
            : context.channel
          : context;
      if (!preserve && channel) updateChannel(channel);
      status.textContent =
        options.locale === "zh_cn"
          ? "正在加载游戏资料…"
          : "Loading game reference…";
      const targetMode = context && typeof context === "object"
        ? context.target.mode
        : "list";
      const template = options.root.querySelector<HTMLTemplateElement>(
        `[data-runtime-skeleton-template="${targetMode}"]`,
      );
      if (template && !preserve) content.replaceChildren(template.content.cloneNode(true));
    },
    invalid(message, channel) {
      setRuntimeNoindex(true);
      detailRenderer.showDetailSummaryFailure();
      entityHeaderSkeleton?.removeAttribute("data-runtime-exiting");
      entityHeaderSkeleton?.setAttribute("hidden", "");
      entityChannelSource?.removeAttribute("data-runtime-summary-loading");
      if (channel) updateChannel(channel);
      options.root.removeAttribute("aria-busy");
      pageShell?.removeAttribute("data-runtime-loading");
      entityDetailSummary?.setAttribute("hidden", "");
      clearRuntimeAlert();
      const template = options.root.querySelector<HTMLTemplateElement>(
        "[data-runtime-invalid-template]",
      );
      const fragment = template?.content.cloneNode(true) as DocumentFragment | undefined;
      const header = fragment?.querySelector<HTMLElement>("[data-runtime-invalid-header]");
      const alert = fragment?.querySelector<HTMLElement>("[data-alert]");
      const alertMessage = fragment?.querySelector<HTMLElement>("[data-runtime-invalid-message]");
      if (!fragment || !alert || !alertMessage) {
        status.textContent = message;
        content.replaceChildren();
        return;
      }
      if (options.root.dataset.runtimeMode !== "detail") header?.remove();
      alertMessage.textContent = message;
      alert.dataset.runtimeErrorAlert = "";
      status.textContent = "";
      content.replaceChildren(fragment);
    },
    failure(error, retry) {
      if (!preservingContent) detailRenderer.showDetailSummaryFailure();
      if (!preservingContent) pbeSummary?.setAttribute("hidden", "");
      entityHeaderSkeleton?.removeAttribute("data-runtime-exiting");
      entityHeaderSkeleton?.setAttribute("hidden", "");
      entityChannelSource?.removeAttribute("data-runtime-summary-loading");
      options.root.removeAttribute("aria-busy");
      pageShell?.removeAttribute("data-runtime-loading");
      clearRuntimeAlert();
      const template = options.root.querySelector<HTMLTemplateElement>(
        "[data-runtime-alert-template]",
      );
      const fragment = template?.content.cloneNode(true) as DocumentFragment | undefined;
      const alert = fragment?.querySelector<HTMLElement>("[data-alert]");
      const message = fragment?.querySelector<HTMLElement>(
        "[data-runtime-alert-message]",
      );
      const button = fragment?.querySelector<HTMLButtonElement>(
        "[data-runtime-alert-retry]",
      );
      if (!alert || !message || !button) {
        status.textContent = runtimeFailureMessage(error, options.locale);
        const fallbackRetry = textNode(
          "button",
          options.locale === "zh_cn" ? "重试" : "Retry",
          "runtime-retry",
        ) as HTMLButtonElement;
        fallbackRetry.type = "button";
        fallbackRetry.addEventListener("click", retry, { once: true });
        status.append(" ", fallbackRetry);
        return;
      }
      alert.dataset.runtimeErrorAlert = "";
      message.textContent = runtimeFailureMessage(error, options.locale);
      button.addEventListener("click", retry, { once: true });
      status.textContent = "";
      if (content.querySelector(".runtime-skeleton"))
        content.replaceChildren();
      content.before(alert);
    },
  };

  source
    .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const current = readRuntimeUrlState(options.history.url);
        const selected = button.dataset.runtimeChannel;
        if (selected !== "pbe" && selected !== "latest") return;
        const next = formatRuntimeUrl(
          options.history.url,
          {
            ...current,
            channel: selected,
            channelExplicit:
              selected === "latest" ||
              (current.channel === "pbe" && current.channelExplicit),
          },
          ["id", "champion", "channel"],
        );
        void options.getController().navigate(next);
      });
    });
  return view;
}
