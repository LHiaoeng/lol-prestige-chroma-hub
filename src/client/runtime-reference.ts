import {
  CommunityDragonRuntimeError,
  createCommunityDragonRuntime,
  type CommunityDragonLocale,
  type CommunityDragonRuntime,
  type RuntimeEntity,
  type RuntimeList,
  type RuntimeListKind,
} from "../domain/communitydragon-runtime";

export type RuntimePage = RuntimeListKind | "skins";

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
): RuntimeLocationState {
  const selectedChannel = channel(url.searchParams.get("channel"));
  if (!selectedChannel) return { mode: "invalid", page };
  const rawId = url.searchParams.get("id");
  if (!rawId) {
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

export function runtimeFailureMessage(
  error: CommunityDragonRuntimeError,
  locale: CommunityDragonLocale,
): string {
  const chinese = locale === "zh_cn";
  switch (error.code) {
    case "not-found":
      return chinese
        ? "没有找到该 CommunityDragon 实体。"
        : "That CommunityDragon entity was not found.";
    case "network":
      return chinese
        ? "无法连接 CommunityDragon，请检查网络后重试。"
        : "CommunityDragon could not be reached. Check the network and retry.";
    case "http":
      return chinese
        ? `CommunityDragon 返回了 HTTP ${error.status ?? "错误"}。`
        : `CommunityDragon returned HTTP ${error.status ?? "an error"}.`;
    case "schema":
      return chinese
        ? "CommunityDragon 返回的资料格式无法识别。"
        : "CommunityDragon returned an unrecognized data shape.";
    case "unsafe-url":
      return chinese
        ? "资料来源链接不安全，已拒绝请求。"
        : "The reference URL was unsafe and the request was blocked.";
    case "invalid-request":
      return chinese ? "请求参数无效。" : "The reference request was invalid.";
    case "aborted":
      return chinese ? "资料加载已取消。" : "Reference loading was cancelled.";
  }
}

function loadedAt(locale: CommunityDragonLocale): string {
  return new Intl.DateTimeFormat(locale === "zh_cn" ? "zh-CN" : "en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

type RuntimeDetailState = Extract<RuntimeLocationState, { mode: "detail" }>;

function relationKind(
  state: RuntimeDetailState,
): Extract<RuntimeListKind, "skinlines" | "universes"> | undefined {
  if (state.kind === "skinline") return "universes";
  if (state.kind === "universe") return "skinlines";
  return undefined;
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
  return [];
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
    const state = parseRuntimeLocation(url, this.options.page);
    if (state.mode === "invalid") {
      this.abortController?.abort();
      this.generation += 1;
      this.view.invalid(
        this.options.locale === "zh_cn"
          ? "链接无效，请检查实体 ID 与数据通道。"
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
        const listKind = relationKind(state);
        if (listKind)
          void this.loadRelations(
            result,
            state,
            listKind,
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
      const runtimeError = asRuntimeError(error, this.options.locale);
      this.view.failure(runtimeError, () => {
        void this.load(url, commit);
      });
    }
  }

  private async loadRelations(
    entity: RuntimeEntity,
    state: RuntimeDetailState,
    kind: Extract<RuntimeListKind, "skinlines" | "universes">,
    generation: number,
    controller: AbortController,
  ): Promise<void> {
    try {
      const items = await this.runtime.list(kind, {
        locale: this.options.locale,
        channel: state.channel,
        signal: controller.signal,
      });
      if (generation !== this.generation) return;
      this.view.renderRelations?.(relatedItems(entity, state, items), state);
    } catch (error) {
      if (generation !== this.generation) return;
      const runtimeError = asRuntimeError(error, this.options.locale);
      if (runtimeError.code === "aborted") return;
      this.view.relationFailure?.(runtimeError, () => {
        void this.loadRelations(entity, state, kind, generation, controller);
      });
    }
  }
}

interface DomRuntimeViewOptions {
  readonly root: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly page: RuntimePage;
  readonly getController: () => RuntimeController;
  readonly history: RuntimeHistory;
}

function browserHistory(): RuntimeHistory {
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

function textNode(
  tag: keyof HTMLElementTagNameMap,
  value: string,
  className?: string,
): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function runtimePath(locale: CommunityDragonLocale, page: RuntimePage): string {
  return `${locale === "zh_cn" ? "/zh-cn" : ""}/${page}/`;
}

function hrefFor(
  locale: CommunityDragonLocale,
  page: RuntimePage,
  values: { id?: number; championId?: number; channel: "pbe" | "latest" },
): URL {
  const url = new URL(runtimePath(locale, page), window.location.origin);
  if (values.id) url.searchParams.set("id", String(values.id));
  if (values.championId)
    url.searchParams.set("champion", String(values.championId));
  if (values.channel === "latest") url.searchParams.set("channel", "latest");
  return url;
}

function linkWithNavigation(
  label: string,
  url: URL,
  controller: RuntimeController,
  className = "pbe-chip",
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = `${url.pathname}${url.search}`;
  link.textContent = label;
  link.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    void controller.navigate(url);
  });
  return link;
}

function appendMedia(
  parent: HTMLElement,
  url: string | undefined,
  alt: string,
): void {
  if (!url) return;
  const image = document.createElement("img");
  image.src = url;
  image.alt = alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => image.remove(), { once: true });
  parent.appendChild(image);
}

function setRuntimeNoindex(enabled: boolean): void {
  const existing = document.head.querySelector<HTMLMetaElement>(
    "meta[data-runtime-noindex]",
  );
  if (enabled) {
    const meta =
      existing ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    meta.dataset.runtimeNoindex = "true";
  } else {
    existing?.remove();
  }
}

function createDomRuntimeView(options: DomRuntimeViewOptions): RuntimeView {
  const source =
    options.root.querySelector<HTMLElement>("[data-runtime-source]") ??
    document.createElement("div");
  const status =
    options.root.querySelector<HTMLElement>("[data-runtime-status]") ??
    textNode("p", "");
  const content =
    options.root.querySelector<HTMLElement>("[data-runtime-content]") ??
    document.createElement("div");
  if (!source.parentElement) options.root.append(source);
  if (!status.parentElement) options.root.append(status);
  if (!content.parentElement) options.root.append(content);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const channelLabel = source.querySelector<HTMLElement>(
    "[data-runtime-channel-label]",
  );
  const updateChannel = (selected: "pbe" | "latest") => {
    source
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        const active = button.dataset.runtimeChannel === selected;
        button.setAttribute("aria-pressed", String(active));
      });
    if (channelLabel)
      channelLabel.textContent = selected === "latest" ? "Live" : "PBE";
  };
  let relationSlot: HTMLElement | undefined;
  const view: RuntimeView = {
    loading(preserve) {
      options.root.setAttribute("aria-busy", "true");
      status.textContent =
        options.locale === "zh_cn"
          ? "正在加载 CommunityDragon 资料…"
          : "Loading CommunityDragon reference…";
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
    renderList(items, state) {
      relationSlot = undefined;
      setRuntimeNoindex(false);
      options.root.removeAttribute("aria-busy");
      updateChannel(state.channel);
      status.textContent =
        options.locale === "zh_cn"
          ? `已加载 ${items.length} 条资料`
          : `${items.length} references loaded`;
      const controller = options.getController();
      const toolbar = document.createElement("div");
      toolbar.className = "runtime-toolbar";
      const search = document.createElement("input");
      search.type = "search";
      search.placeholder =
        options.locale === "zh_cn" ? "搜索名称" : "Search names";
      search.setAttribute("aria-label", search.placeholder);
      const sort = document.createElement("select");
      sort.setAttribute(
        "aria-label",
        options.locale === "zh_cn" ? "排序" : "Sort",
      );
      for (const [value, label] of [
        ["name", options.locale === "zh_cn" ? "名称" : "Name"],
        ["id", "ID"],
      ] as const) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        sort.appendChild(option);
      }
      toolbar.append(search, sort);
      const grid = document.createElement("div");
      grid.className = "pbe-grid runtime-grid";
      const pagination = document.createElement("nav");
      pagination.className = "pagination runtime-pagination";
      pagination.setAttribute(
        "aria-label",
        options.locale === "zh_cn" ? "资料分页" : "Reference pages",
      );
      let currentPage = 1;
      const pageSize = 24;
      const render = () => {
        const query = search.value.trim().toLocaleLowerCase();
        const filtered = items
          .filter(
            (item) => !query || item.name.toLocaleLowerCase().includes(query),
          )
          .slice()
          .sort((left, right) =>
            sort.value === "id"
              ? left.id - right.id
              : left.name.localeCompare(right.name),
          );
        const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
        currentPage = Math.min(currentPage, pageCount);
        const pageStart = (currentPage - 1) * pageSize;
        grid.replaceChildren(
          ...filtered.slice(pageStart, pageStart + pageSize).map((item) => {
            const page: RuntimePage =
              item.kind === "champion"
                ? "champions"
                : item.kind === "skinline"
                  ? "skinlines"
                  : "universes";
            const card = document.createElement("article");
            card.className = "pbe-card runtime-card";
            if (
              item.kind === "champion" ||
              item.kind === "skinline" ||
              item.kind === "universe"
            )
              appendMedia(
                card,
                item.kind === "champion" ? item.portraitUrl : item.imageUrl,
                item.name,
              );
            const link = linkWithNavigation(
              item.name,
              hrefFor(options.locale, page, {
                id: item.id,
                channel: state.channel,
              }),
              controller,
              "runtime-card-link",
            );
            card.appendChild(link);
            const meta =
              item.kind === "champion" ? item.title : item.description;
            if (meta)
              card.appendChild(textNode("p", meta, "runtime-card-meta"));
            return card;
          }),
        );
        pagination.replaceChildren();
        if (pageCount > 1) {
          const addPageButton = (page: number, label: string) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.setAttribute("aria-label", label);
            if (page === currentPage)
              button.setAttribute("aria-current", "page");
            button.addEventListener("click", () => {
              currentPage = page;
              render();
            });
            pagination.appendChild(button);
          };
          if (currentPage > 1)
            addPageButton(
              currentPage - 1,
              options.locale === "zh_cn" ? "上一页" : "Previous",
            );
          for (let page = 1; page <= pageCount; page += 1)
            addPageButton(page, String(page));
          if (currentPage < pageCount)
            addPageButton(
              currentPage + 1,
              options.locale === "zh_cn" ? "下一页" : "Next",
            );
        }
        status.textContent = filtered.length
          ? options.locale === "zh_cn"
            ? `显示第 ${currentPage}/${pageCount} 页，共 ${filtered.length} 条资料 · 加载于 ${loadedAt(options.locale)}`
            : `Page ${currentPage}/${pageCount} · ${filtered.length} references · loaded at ${loadedAt(options.locale)}`
          : options.locale === "zh_cn"
            ? "没有匹配结果"
            : "No matching references";
      };
      search.addEventListener("input", () => {
        currentPage = 1;
        render();
      });
      sort.addEventListener("change", render);
      content.replaceChildren(toolbar, grid, pagination);
      render();
    },
    renderDetail(item, state) {
      relationSlot = undefined;
      setRuntimeNoindex(true);
      options.root.removeAttribute("aria-busy");
      updateChannel(state.channel);
      const controller = options.getController();
      const article = document.createElement("article");
      article.className = "runtime-detail";
      const heading = textNode("h1", item.name);
      article.appendChild(heading);
      if (item.kind === "champion") {
        if (item.title)
          article.appendChild(textNode("p", item.title, "eyebrow"));
        if (item.shortBio)
          article.appendChild(textNode("p", item.shortBio, "runtime-lede"));
        appendMedia(article, item.portraitUrl, item.name);
        const section = document.createElement("section");
        section.appendChild(
          textNode("h2", options.locale === "zh_cn" ? "皮肤" : "Skins"),
        );
        const links = document.createElement("div");
        links.className = "pbe-links";
        for (const skin of item.skins)
          links.appendChild(
            linkWithNavigation(
              skin.name,
              hrefFor(options.locale, "skins", {
                id: skin.id,
                championId: item.id,
                channel: state.channel,
              }),
              controller,
            ),
          );
        section.appendChild(links);
        article.appendChild(section);
      } else if (item.kind === "skin") {
        appendMedia(
          article,
          item.media.focusedSplashUrl ?? item.media.tileUrl,
          item.name,
        );
        article.appendChild(
          linkWithNavigation(
            options.locale === "zh_cn" ? "查看英雄" : "View champion",
            hrefFor(options.locale, "champions", {
              id: item.championId,
              channel: state.channel,
            }),
            controller,
          ),
        );
        if (item.description)
          article.appendChild(textNode("p", item.description, "runtime-lede"));
        if (item.chromas.length) {
          const chromas = document.createElement("section");
          chromas.appendChild(
            textNode("h2", options.locale === "zh_cn" ? "炫彩" : "Chromas"),
          );
          item.chromas.forEach((chroma) =>
            appendMedia(
              chromas,
              chroma.imageUrl,
              chroma.name ?? String(chroma.id),
            ),
          );
          article.appendChild(chromas);
        }
      } else if (item.kind === "skinline") {
        if (item.description)
          article.appendChild(textNode("p", item.description, "runtime-lede"));
        const section = document.createElement("section");
        section.appendChild(
          textNode("h2", options.locale === "zh_cn" ? "所属宇宙" : "Universes"),
        );
        relationSlot = textNode(
          "p",
          options.locale === "zh_cn"
            ? "正在加载关联资料…"
            : "Loading related references…",
          "runtime-relation-state",
        );
        section.appendChild(relationSlot);
        article.appendChild(section);
      } else {
        appendMedia(article, item.imageUrl, item.name);
        if (item.description)
          article.appendChild(textNode("p", item.description, "runtime-lede"));
        const section = document.createElement("section");
        section.appendChild(
          textNode("h2", options.locale === "zh_cn" ? "所属系列" : "Skinlines"),
        );
        relationSlot = textNode(
          "p",
          options.locale === "zh_cn"
            ? "正在加载关联资料…"
            : "Loading related references…",
          "runtime-relation-state",
        );
        section.appendChild(relationSlot);
        article.appendChild(section);
      }
      content.replaceChildren(article);
      status.textContent =
        options.locale === "zh_cn"
          ? `资料加载完成 · ${loadedAt(options.locale)}`
          : `Reference loaded · ${loadedAt(options.locale)}`;
    },
    renderRelations(items, state) {
      if (!relationSlot) return;
      const controller = options.getController();
      const targetPage = state.kind === "skinline" ? "universes" : "skinlines";
      if (!items.length) {
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "当前区域数据视图没有可显示的关联资料。"
            : "No related references are available in this regional view.";
        return;
      }
      const links = document.createElement("div");
      links.className = "pbe-links";
      items.forEach((item) =>
        links.appendChild(
          linkWithNavigation(
            item.name,
            hrefFor(options.locale, targetPage, {
              id: item.id,
              channel: state.channel,
            }),
            controller,
          ),
        ),
      );
      relationSlot.replaceChildren(links);
    },
    relationFailure(error, retry) {
      if (!relationSlot) return;
      relationSlot.replaceChildren(
        textNode("span", runtimeFailureMessage(error, options.locale)),
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent =
        options.locale === "zh_cn"
          ? "重试关联资料"
          : "Retry related references";
      button.addEventListener("click", retry, { once: true });
      relationSlot.append(" ", button);
    },
    invalid(message) {
      relationSlot = undefined;
      setRuntimeNoindex(true);
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
      status.appendChild(document.createTextNode(" "));
      status.appendChild(button);
    },
    intro() {
      relationSlot = undefined;
      options.root.removeAttribute("aria-busy");
      status.textContent =
        options.locale === "zh_cn"
          ? "请从英雄资料进入皮肤详情。"
          : "Open a skin from a champion reference.";
      content.replaceChildren();
    },
  };

  source
    .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const next = new URL(options.history.url);
        const selected = button.dataset.runtimeChannel;
        if (selected === "latest") next.searchParams.set("channel", "latest");
        else next.searchParams.delete("channel");
        void options.getController().navigate(next);
      });
    });
  return view;
}

export function initRuntimeReference(root: HTMLElement): RuntimeController {
  const page = root.dataset.runtimePage as RuntimePage | undefined;
  const locale = root.dataset.runtimeLocale as
    CommunityDragonLocale | undefined;
  if (!page || !locale || (locale !== "default" && locale !== "zh_cn"))
    throw new Error("Runtime reference root is missing a valid page or locale");
  const history = browserHistory();
  const runtime = createCommunityDragonRuntime();
  let controller!: RuntimeController;
  const view = createDomRuntimeView({
    root,
    locale,
    page,
    getController: () => controller,
    history,
  });
  controller = new RuntimeController(runtime, view, history, { page, locale });
  void controller.start();
  return controller;
}
