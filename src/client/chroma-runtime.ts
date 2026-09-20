import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeChampion,
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
import { localizedPath } from "../i18n/config";

export interface ChromaRuntimeSupplement {
  readonly champion: RuntimeChampion;
  readonly baseSkin: RuntimeSkinSummary;
}

export interface ChromaRuntimeSupplementOptions {
  readonly championId: number;
  readonly sourceSkinId: number;
  readonly locale: CommunityDragonLocale;
  readonly channel: "pbe" | "latest";
  readonly signal?: AbortSignal;
}

export interface ChromaRuntimeSupplementView {
  loading(): void;
  render(supplement: ChromaRuntimeSupplement): void;
  invalid(message: string): void;
  failure(
    error: CommunityDragonRuntimeError,
    retry: () => void,
    preserve?: boolean,
  ): void;
}

function notFoundError(
  kind: "champion" | "skin",
  id: number,
): CommunityDragonRuntimeError {
  return new CommunityDragonRuntimeError(
    "not-found",
    `${kind} ${id} was not found in the related champion record`,
  );
}

export async function loadChromaRuntimeSupplement(
  runtime: CommunityDragonRuntime,
  view: ChromaRuntimeSupplementView,
  options: ChromaRuntimeSupplementOptions,
  retry: () => void = () => {
    void loadChromaRuntimeSupplement(runtime, view, options, retry);
  },
): Promise<boolean> {
  view.loading();
  try {
    const champion = await runtime.get("champion", options.championId, {
      locale: options.locale,
      channel: options.channel,
      signal: options.signal,
    });
    if (champion.kind !== "champion")
      throw notFoundError("champion", options.championId);
    const baseSkin = champion.skins.find(
      (skin) => skin.id === options.sourceSkinId,
    );
    if (!baseSkin) throw notFoundError("skin", options.sourceSkinId);
    if (!baseSkin.isBase)
      throw new CommunityDragonRuntimeError(
        "schema",
        `Skin ${options.sourceSkinId} is not marked as a base skin`,
      );
    view.render({ champion, baseSkin });
    return true;
  } catch (error) {
    const runtimeError = asCommunityDragonError(error, options.locale);
    if (runtimeError.code === "aborted") return false;
    view.failure(runtimeError, retry);
    return false;
  }
}

export function channelFromLocation(
  document: Document,
): "pbe" | "latest" | undefined {
  const value = document.defaultView?.location.search
    ? new URL(document.defaultView.location.href).searchParams.get("channel")
    : null;
  if (value === null || value === "pbe") return "pbe";
  if (value === "latest") return "latest";
  return undefined;
}

function sourceLabel(
  channel: "pbe" | "latest",
  locale: CommunityDragonLocale,
): string {
  return locale === "zh_cn"
    ? `CommunityDragon · ${channel === "latest" ? "正式服" : "PBE"}`
    : `CommunityDragon · ${channel === "latest" ? "Live" : "PBE"}`;
}

export function createDomView(
  root: HTMLElement,
  locale: CommunityDragonLocale,
  getChannel: () => "pbe" | "latest",
): ChromaRuntimeSupplementView {
  let content = root.querySelector<HTMLElement>("[data-chroma-runtime-content]");
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
  const view: ChromaRuntimeSupplementView = {
    invalid(message) {
      root.removeAttribute("aria-busy");
      content.replaceChildren(renderStatus(message));
    },
    loading() {
      root.setAttribute("aria-busy", "true");
      content.replaceChildren(
        renderStatus(
          locale === "zh_cn"
            ? "正在加载可选 CommunityDragon 资料…"
            : "Loading optional CommunityDragon reference…",
        ),
      );
    },
    render({ champion, baseSkin }) {
      root.removeAttribute("aria-busy");
      const status = renderStatus(sourceLabel(getChannel(), locale));
      const title = document.createElement("strong");
      title.textContent = `${champion.name} · ${baseSkin.name}`;
      const meta = document.createElement("span");
      meta.className = "chroma-runtime-meta";
      meta.textContent = locale === "zh_cn"
        ? `英雄 ID ${champion.id} · 基础皮肤 ID ${baseSkin.id}`
        : `Champion ID ${champion.id} · Base skin ID ${baseSkin.id}`;
      const links = document.createElement("span");
      links.className = "chroma-runtime-links";
      const siteLocale = locale === "zh_cn" ? "zh-cn" : "en";
      const channelQuery = getChannel() === "latest" ? "&channel=latest" : "";
      const championLink = document.createElement("a");
      championLink.href = localizedPath(
        siteLocale,
        `/champions/?id=${champion.id}${channelQuery}`,
      );
      championLink.textContent = locale === "zh_cn" ? "查看英雄" : "View champion";
      const skinLink = document.createElement("a");
      skinLink.href = localizedPath(
        siteLocale,
        `/skins/?id=${baseSkin.id}&champion=${champion.id}${channelQuery}`,
      );
      skinLink.textContent = locale === "zh_cn" ? "查看基础皮肤" : "View base skin";
      links.append(championLink, skinLink);
      const descriptionText = baseSkin.description;
      const description = descriptionText
        ? document.createElement("span")
        : undefined;
      if (description && descriptionText) {
        description.className = "chroma-runtime-description";
        description.textContent = descriptionText;
      }
      const mediaUrl = baseSkin.media.focusedSplashUrl;
      const image = mediaUrl ? document.createElement("img") : undefined;
      if (image && mediaUrl) {
        image.src = mediaUrl;
        image.alt = baseSkin.name;
        image.loading = "lazy";
        image.width = 320;
        image.height = 180;
        image.addEventListener("error", () => image.remove(), { once: true });
      }
      content.replaceChildren(status, title, meta, links);
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
    const locale: CommunityDragonLocale =
      root.dataset.runtimeLocale === "zh_cn" ? "zh_cn" : "default";
    if (!Number.isSafeInteger(championId) || !Number.isSafeInteger(sourceSkinId))
      return;
    const runtime = createCommunityDragonRuntime();
    const initialChannel = channelFromLocation(document);
    let selectedChannel = initialChannel ?? "pbe";
    let requestedChannel = selectedChannel;
    let hasLoadedSupplement = false;
    let generation = 0;
    let controller: AbortController | undefined;
    const view = createDomView(root, locale, () => requestedChannel);
    const buttons = root.querySelectorAll<HTMLButtonElement>("[data-chroma-runtime-channel]");
    const syncButtons = () => buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.chromaRuntimeChannel === selectedChannel),
      );
    });
    const run = async (
      channel: "pbe" | "latest",
      commitHistory = false,
    ): Promise<void> => {
      const preserveContent = hasLoadedSupplement;
      requestedChannel = channel;
      controller?.abort();
      controller = new AbortController();
      const current = ++generation;
      const guardedView: ChromaRuntimeSupplementView = {
        loading: () => {
          if (current === generation && !preserveContent) view.loading();
        },
        render: (supplement) => { if (current === generation) view.render(supplement); },
        invalid: (message) => { if (current === generation) view.invalid(message); },
        failure: (error) => {
          if (current === generation)
            view.failure(error, () => void run(channel), preserveContent);
        },
      };
      const loaded = await loadChromaRuntimeSupplement(runtime, guardedView, {
        championId,
        sourceSkinId,
        locale,
        channel,
        signal: controller.signal,
      });
      if (current !== generation) return;
      if (loaded) {
        hasLoadedSupplement = true;
        selectedChannel = channel;
        requestedChannel = channel;
        syncButtons();
        if (commitHistory) {
          const url = new URL(
            document.defaultView?.location.href ?? "https://chromaart.lol/",
          );
          if (channel === "latest") url.searchParams.set("channel", "latest");
          else url.searchParams.delete("channel");
          document.defaultView?.history.pushState({}, "", url);
        }
      } else {
        requestedChannel = selectedChannel;
        syncButtons();
      }
    };
    buttons.forEach((button) => button.addEventListener("click", () => {
      const next = button.dataset.chromaRuntimeChannel === "latest" ? "latest" : "pbe";
      void run(next, true);
    }));
    buttons.forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.chromaRuntimeChannel === selectedChannel),
      );
    });
    document.defaultView?.addEventListener("popstate", () => {
      const channel = channelFromLocation(document);
      if (!channel) {
        controller?.abort();
        generation += 1;
        view.invalid(
          locale === "zh_cn"
            ? "链接无效，请选择有效的资料通道。"
            : "This link is invalid. Choose a valid reference channel.",
        );
        return;
      }
      void run(channel);
    });
    if (initialChannel) {
      void run(initialChannel);
    } else {
      view.invalid(
        locale === "zh_cn"
          ? "链接无效，请选择有效的资料通道。"
          : "This link is invalid. Choose a valid reference channel.",
      );
    }
  });
}
