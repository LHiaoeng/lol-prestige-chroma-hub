import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeEntity,
  type RuntimeList,
} from "../domain/communitydragon-runtime";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import type { RuntimePbeAdditions } from "../domain/pbe-additions";
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
  renderPbeAdditions(items: RuntimePbeAdditions): void;
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
  if (!status.parentElement) options.root.append(status);
  if (!content.parentElement) options.root.append(content);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const channelLabel = source.querySelector<HTMLElement>(
    "[data-runtime-channel-label]",
  );
  let renderedContext: RuntimeChannelLoadContext<RuntimeLocationState> | undefined;
  const preservesExplicitPbe = () =>
    readRuntimeUrlState(renderedContext?.url ?? options.history.url)
      .channelExplicit;
  const updateChannel = (selected: "pbe" | "latest") => {
    source
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        const active = button.dataset.runtimeChannel === selected;
        button.setAttribute("aria-pressed", String(active));
        if (button.dataset.runtimeChannel)
          button.textContent = communityDragonChannelLabel(
            button.dataset.runtimeChannel as "pbe" | "latest",
            options.locale,
          );
      });
    if (channelLabel)
      channelLabel.textContent = communityDragonChannelLabel(
        selected,
        options.locale,
      );
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
      if (renderedContext !== context) {
        renderedContext = context;
        const target = context.target;
        if (state.core.value.mode === "pbe")
          pbeRenderer.render(state.core.value.items);
        else if (target.mode === "list" && state.core.value.mode === "list")
          listRenderer.render(state.core.value.items, target);
        else if (target.mode === "detail" && state.core.value.mode === "detail")
          detailRenderer.render(state.core.value.item, target);
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
      if (target.mode !== "detail" || state.core.value.mode !== "detail") return;
      const entity = state.core.value.item;
      detailRenderer.renderRelations(state, entity, target);

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
    },
    committed(channel, url) {
      updateChannel(channel);
      bindRuntimeChannelLinks(document, url);
      bindRuntimeLanguageToggle(document, url);
    },
    loading(preserve, context) {
      options.root.setAttribute("aria-busy", "true");
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
      if (!preserve) {
        const skeleton = document.createElement("div");
        skeleton.className = "runtime-skeleton-grid";
        skeleton.setAttribute("aria-hidden", "true");
        for (let index = 0; index < 6; index += 1) {
          const card = document.createElement("div");
          card.className = "runtime-skeleton-card";
          skeleton.appendChild(card);
        }
        content.replaceChildren(skeleton);
      }
    },
    invalid(message, channel) {
      setRuntimeNoindex(true);
      if (channel) updateChannel(channel);
      options.root.removeAttribute("aria-busy");
      status.textContent = message;
      content.replaceChildren();
    },
    failure(error, retry) {
      options.root.removeAttribute("aria-busy");
      status.textContent = runtimeFailureMessage(error, options.locale);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent = options.locale === "zh_cn" ? "重试" : "Retry";
      button.addEventListener("click", retry, { once: true });
      status.append(" ", button);
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
          ["id", "champion", "stage", "channel"],
        );
        void options.getController().navigate(next);
      });
    });
  return view;
}
