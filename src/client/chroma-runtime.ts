import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeChampion,
  type RuntimeChroma,
  type RuntimeSkinSummary,
} from "../domain/communitydragon-runtime";
import {
  createCommunityDragonRuntime,
  type CommunityDragonRuntime,
} from "./communitydragon-runtime";
import {
  asCommunityDragonError,
  runtimeFailureMessage,
} from "./communitydragon-errors";
import { runtimeMissingLabel } from "./runtime-reference-view-shared";
import { localizedPath } from "../i18n/config";
import {
  RuntimeChannelLifecycle,
  type RuntimeChannelHistory,
} from "./runtime-channel-lifecycle";
import {
  formatRuntimeUrl,
  readRuntimeUrlState,
} from "../domain/runtime-url-state";

export interface ChromaRuntimeSupplement {
  readonly champion: RuntimeChampion;
  readonly sourceSkin: RuntimeSkinSummary;
  readonly chroma: RuntimeChroma;
}

export interface ChromaRuntimeSupplementOptions {
  readonly championId: number;
  readonly sourceSkinId: number;
  readonly chromaId: number;
  readonly locale: CommunityDragonLocale;
  readonly channel: "pbe" | "latest";
  readonly signal?: AbortSignal;
}

export interface ChromaRuntimeSupplementView {
  loading(preserveContent?: boolean, channel?: "pbe" | "latest"): void;
  render(
    supplement: ChromaRuntimeSupplement,
    channel?: "pbe" | "latest",
    url?: URL,
  ): void;
  invalid(message: string, channel?: "pbe" | "latest"): void;
  failure(
    error: CommunityDragonRuntimeError,
    retry: () => void,
    preserve?: boolean,
  ): void;
}

function notFoundError(
  kind: "champion" | "skin" | "chroma",
  id: number,
): CommunityDragonRuntimeError {
  return new CommunityDragonRuntimeError(
    "not-found",
    `${kind} ${id} was not found in the related champion record`,
  );
}

async function resolveChromaRuntimeSupplement(
  runtime: CommunityDragonRuntime,
  options: ChromaRuntimeSupplementOptions,
): Promise<ChromaRuntimeSupplement> {
  try {
    const champion = await runtime.get("champion", options.championId, {
      locale: options.locale,
      channel: options.channel,
      signal: options.signal,
    });
    if (champion.kind !== "champion")
      throw notFoundError("champion", options.championId);
    const sourceSkin = champion.skins.find(
      (skin) => skin.id === options.sourceSkinId,
    );
    if (!sourceSkin) throw notFoundError("skin", options.sourceSkinId);
    const chroma = sourceSkin.chromas?.find(
      (candidate) => candidate.id === options.chromaId,
    );
    if (!chroma) throw notFoundError("chroma", options.chromaId);
    return { champion, sourceSkin, chroma };
  } catch (error) {
    const runtimeError = asCommunityDragonError(error, options.locale);
    throw runtimeError;
  }
}

export async function loadChromaRuntimeSupplement(
  runtime: CommunityDragonRuntime,
  options: ChromaRuntimeSupplementOptions,
): Promise<ChromaRuntimeSupplement> {
  return resolveChromaRuntimeSupplement(runtime, options);
}

export function channelFromLocation(
  document: Document,
): "pbe" | "latest" | undefined {
  const href = document.defaultView?.location.href;
  if (!href) return undefined;
  const state = readRuntimeUrlState(new URL(href));
  return state.invalid.includes("channel") ? undefined : state.channel;
}

export interface ChromaRuntimeLifecycleOptions {
  readonly runtime: CommunityDragonRuntime;
  readonly history: RuntimeChannelHistory;
  readonly view: ChromaRuntimeSupplementView;
  readonly championId: number;
  readonly sourceSkinId: number;
  readonly chromaId: number;
  readonly locale: CommunityDragonLocale;
}

export function createChromaRuntimeLifecycle(
  options: ChromaRuntimeLifecycleOptions,
): RuntimeChannelLifecycle<
  "pbe" | "latest",
  ChromaRuntimeSupplement,
  CommunityDragonRuntimeError
> {
  return new RuntimeChannelLifecycle({
    history: options.history,
    parse: (url) => {
      const state = readRuntimeUrlState(url);
      if (state.invalid.includes("channel") || !state.channel)
        return {
          status: "invalid",
          message:
            options.locale === "zh_cn"
              ? "链接无效，请选择有效的版本数据源。"
              : "This link is invalid. Choose a valid reference channel.",
        };
      return {
        status: "valid",
        channel: state.channel,
        target: state.channel,
      };
    },
    load: (channel, signal) =>
      loadChromaRuntimeSupplement(options.runtime, {
        championId: options.championId,
        sourceSkinId: options.sourceSkinId,
        chromaId: options.chromaId,
        locale: options.locale,
        channel,
        signal,
      }),
    normalizeError: (error) =>
      asCommunityDragonError(error, options.locale),
    isAborted: (error) => error.code === "aborted",
    view: {
      loading: (preserveContent, context) =>
        options.view.loading(preserveContent, context.channel),
      render: (supplement, context) =>
        options.view.render(supplement, context.channel, context.url),
      invalid: (message, channel) => options.view.invalid(message, channel),
      failure: (error, retry, preserveContent) =>
        options.view.failure(error, retry, preserveContent),
    },
  });
}

function sourceLabel(channel: "pbe" | "latest"): string {
  return channel;
}

export function createDomView(
  root: HTMLElement,
  locale: CommunityDragonLocale,
  getChannel: () => "pbe" | "latest",
): ChromaRuntimeSupplementView {
  let content = root.querySelector<HTMLElement>(
    "[data-chroma-runtime-content]",
  );
  if (!content) {
    content = document.createElement("dd");
    content.dataset.chromaRuntimeContent = "true";
    root.append(content);
  }
  const renderStatus = (message: string) => {
    const status = document.createElement("span");
    status.dataset.chromaRuntimeStatus = "true";
    status.setAttribute("role", "status");
    status.textContent = message;
    return status;
  };
  const syncChannel = (channel: "pbe" | "latest") =>
    root
      .querySelectorAll<HTMLButtonElement>("[data-chroma-runtime-channel]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(button.dataset.chromaRuntimeChannel === channel),
        ),
      );
  const loadingMessage =
    locale === "zh_cn"
      ? "正在加载可选游戏资料…"
      : "Loading optional game reference…";
  const view: ChromaRuntimeSupplementView = {
    invalid(message, channel) {
      root.removeAttribute("aria-busy");
      if (channel) syncChannel(channel);
      content.replaceChildren(renderStatus(message));
    },
    loading(preserveContent = false, channel) {
      root.setAttribute("aria-busy", "true");
      if (channel && !preserveContent) syncChannel(channel);
      if (preserveContent) {
        const status = content.querySelector<HTMLElement>(
          "[data-chroma-runtime-status]",
        );
        if (status) status.textContent = loadingMessage;
        return;
      }
      content.replaceChildren(
        renderStatus(loadingMessage),
      );
    },
    render({ champion, sourceSkin }, channel = getChannel(), url) {
      root.removeAttribute("aria-busy");
      syncChannel(channel);
      const status = renderStatus(sourceLabel(channel));
      const title = document.createElement("strong");
      const skinName =
        sourceSkin.name ?? runtimeMissingLabel(locale, "name");
      title.textContent = `${champion.name} · ${skinName}`;
      const links = document.createElement("span");
      links.className = "chroma-runtime-links";
      const siteLocale = locale === "zh_cn" ? "zh-cn" : "en";
      const currentUrl =
        url ??
        new URL(
          document.defaultView?.location.href ?? "https://chromaart.lol/",
        );
      const urlState = readRuntimeUrlState(currentUrl);
      const runtimeHref = (
        path: string,
        values: { readonly id?: number; readonly champion?: number },
        include: readonly ("id" | "champion" | "channel")[],
      ): string => {
        const target = new URL(localizedPath(siteLocale, path), currentUrl);
        const formatted = formatRuntimeUrl(
          target,
          {
            ...values,
            channel: channel ?? urlState.channel,
            channelExplicit: urlState.channelExplicit,
          },
          include,
        );
        return `${formatted.pathname}${formatted.search}`;
      };
      const championLink = document.createElement("a");
      championLink.href = runtimeHref(
        "/champions/detail/",
        { id: champion.id },
        ["id", "channel"],
      );
      championLink.textContent =
        locale === "zh_cn" ? "查看英雄" : "View champion";
      const skinLink = document.createElement("a");
      skinLink.href = runtimeHref(
        "/skins/detail/",
        { id: sourceSkin.id, champion: champion.id },
        ["id", "champion", "channel"],
      );
      skinLink.textContent =
        locale === "zh_cn" ? "查看所属皮肤" : "View chroma parent skin";
      links.append(championLink, skinLink);
      const descriptionText = sourceSkin.description;
      const description = descriptionText
        ? document.createElement("span")
        : undefined;
      if (description && descriptionText) {
        description.className = "chroma-runtime-description";
        description.textContent = descriptionText;
      }
      const mediaUrl = sourceSkin.media.focusedSplashUrl;
      const image = mediaUrl ? document.createElement("img") : undefined;
      if (image && mediaUrl) {
        image.src = mediaUrl;
        image.alt = skinName;
        image.loading = "lazy";
        image.width = 320;
        image.height = 180;
        image.addEventListener("error", () => image.remove(), { once: true });
      }
      content.replaceChildren(status, title, links);
      if (description) content.append(description);
      if (image) content.append(image);
    },
    failure(error, retry, preserve = false) {
      root.removeAttribute("aria-busy");
      const status = renderStatus(runtimeFailureMessage(error, locale));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chroma-runtime-retry";
      button.textContent = locale === "zh_cn" ? "重试" : "Retry";
      button.addEventListener("click", retry, { once: true });
      if (!preserve) {
        content.replaceChildren(status, button);
        return;
      }
      const previousFailure = content.querySelector(
        "[data-chroma-runtime-error]",
      );
      previousFailure?.remove();
      const failure = document.createElement("span");
      failure.dataset.chromaRuntimeError = "true";
      failure.className = "chroma-runtime-error";
      failure.append(status, button);
      content.append(failure);
    },
  };
  return view;
}

export function initChromaRuntime(document: Document): void {
  const roots = document.querySelectorAll<HTMLElement>("[data-chroma-runtime]");
  roots.forEach((root) => {
    const championId = Number(root.dataset.championId);
    const sourceSkinId = Number(root.dataset.sourceSkinId);
    const chromaId = Number(root.dataset.chromaId);
    const locale: CommunityDragonLocale =
      root.dataset.runtimeLocale === "zh_cn" ? "zh_cn" : "default";
    if (
      !Number.isSafeInteger(championId) ||
      !Number.isSafeInteger(sourceSkinId) ||
      !Number.isSafeInteger(chromaId)
    )
      return;
    const runtime = createCommunityDragonRuntime();
    const view = createDomView(
      root,
      locale,
      () => channelFromLocation(document) ?? "pbe",
    );
    const history: RuntimeChannelHistory = {
      get url() {
        return new URL(
          document.defaultView?.location.href ?? "https://chromaart.lol/",
        );
      },
      push(url) {
        document.defaultView?.history.pushState({}, "", url);
      },
      replace(url) {
        document.defaultView?.history.replaceState({}, "", url);
      },
      onPopState(listener) {
        document.defaultView?.addEventListener("popstate", listener);
        return () =>
          document.defaultView?.removeEventListener("popstate", listener);
      },
    };
    const lifecycle = createChromaRuntimeLifecycle({
      runtime,
      history,
      view,
      championId,
      sourceSkinId,
      chromaId,
      locale,
    });
    root
      .querySelectorAll<HTMLButtonElement>("[data-chroma-runtime-channel]")
      .forEach((button) => {
        button.addEventListener("click", () => {
          const selected = button.dataset.chromaRuntimeChannel;
          if (selected !== "pbe" && selected !== "latest") return;
          const current = readRuntimeUrlState(history.url);
          const next = formatRuntimeUrl(
            history.url,
            {
              ...current,
              channel: selected,
              channelExplicit:
                selected === "latest" ||
                (current.channel === "pbe" && current.channelExplicit),
            },
            ["channel"],
          );
          void lifecycle.navigate(next);
        });
      });
    void lifecycle.start();
  });
}
