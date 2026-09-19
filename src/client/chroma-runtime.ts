import {
  CommunityDragonRuntimeError,
  createCommunityDragonRuntime,
  type CommunityDragonLocale,
  type CommunityDragonRuntime,
  type RuntimeChampion,
  type RuntimeSkinSummary,
} from "../domain/communitydragon-runtime";

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
  failure(error: CommunityDragonRuntimeError, retry: () => void): void;
}

function asRuntimeError(
  error: unknown,
  locale: CommunityDragonLocale,
): CommunityDragonRuntimeError {
  return error instanceof CommunityDragonRuntimeError
    ? error
    : new CommunityDragonRuntimeError(
        "network",
        locale === "zh_cn"
          ? "CommunityDragon 请求失败。"
          : "The CommunityDragon request failed.",
        { cause: error },
      );
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
    const runtimeError = asRuntimeError(error, options.locale);
    if (runtimeError.code === "aborted") return false;
    view.failure(runtimeError, retry);
    return false;
  }
}

function channelFromLocation(document: Document): "pbe" | "latest" {
  const value = document.defaultView?.location.search
    ? new URL(document.defaultView.location.href).searchParams.get("channel")
    : null;
  return value === "latest" ? "latest" : "pbe";
}

function sourceLabel(
  channel: "pbe" | "latest",
  locale: CommunityDragonLocale,
): string {
  return locale === "zh_cn"
    ? `CommunityDragon · ${channel === "latest" ? "正式服" : "PBE"}`
    : `CommunityDragon · ${channel === "latest" ? "Live" : "PBE"}`;
}

function runtimeFailureMessage(
  error: CommunityDragonRuntimeError,
  locale: CommunityDragonLocale,
): string {
  if (error.code === "aborted")
    return locale === "zh_cn" ? "资料加载已取消。" : "Reference loading was cancelled.";
  if (error.code === "network")
    return locale === "zh_cn"
      ? "无法连接 CommunityDragon。"
      : "CommunityDragon could not be reached.";
  if (error.code === "not-found")
    return locale === "zh_cn"
      ? "没有找到对应的英雄或基础皮肤资料。"
      : "The related champion or base skin was not found.";
  if (error.code === "http")
    return locale === "zh_cn"
      ? `CommunityDragon 返回了 HTTP ${error.status ?? "错误"}。`
      : `CommunityDragon returned HTTP ${error.status ?? "an error"}.`;
  return locale === "zh_cn"
    ? "CommunityDragon 返回的资料无法识别。"
    : "CommunityDragon returned an unrecognized reference.";
}

function createDomView(
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
      const championLink = document.createElement("a");
      championLink.href = `/champions/?id=${champion.id}${getChannel() === "latest" ? "&channel=latest" : ""}`;
      championLink.textContent = locale === "zh_cn" ? "查看英雄" : "View champion";
      const skinLink = document.createElement("a");
      skinLink.href = `/skins/?id=${baseSkin.id}&champion=${champion.id}${getChannel() === "latest" ? "&channel=latest" : ""}`;
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
    failure(error, retry) {
      root.removeAttribute("aria-busy");
      const status = renderStatus(runtimeFailureMessage(error, locale));
      const button = document.createElement("button");
      button.type = "button";
      button.className = "chroma-runtime-retry";
      button.textContent = locale === "zh_cn" ? "重试" : "Retry";
      button.addEventListener("click", retry, { once: true });
      content.replaceChildren(status, button);
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
    let selectedChannel = channelFromLocation(document);
    let generation = 0;
    let controller: AbortController | undefined;
    const view = createDomView(root, locale, () => selectedChannel);
    const run = (channel: "pbe" | "latest") => {
      selectedChannel = channel;
      controller?.abort();
      controller = new AbortController();
      const current = ++generation;
      const guardedView: ChromaRuntimeSupplementView = {
        loading: () => { if (current === generation) view.loading(); },
        render: (supplement) => { if (current === generation) view.render(supplement); },
        failure: (error, retry) => {
          if (current === generation) view.failure(error, retry);
        },
      };
      void loadChromaRuntimeSupplement(runtime, guardedView, {
        championId,
        sourceSkinId,
        locale,
        channel,
        signal: controller.signal,
      });
    };
    const buttons = root.querySelectorAll<HTMLButtonElement>("[data-chroma-runtime-channel]");
    const syncButtons = () => buttons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.chromaRuntimeChannel === selectedChannel));
    });
    buttons.forEach((button) => button.addEventListener("click", () => {
      const next = button.dataset.chromaRuntimeChannel === "latest" ? "latest" : "pbe";
      const url = new URL(document.defaultView?.location.href ?? "https://chromaart.lol/");
      if (next === "latest") url.searchParams.set("channel", "latest");
      else url.searchParams.delete("channel");
      document.defaultView?.history.pushState({}, "", url);
      syncButtons();
      run(next);
    }));
    syncButtons();
    run(selectedChannel);
  });
}
