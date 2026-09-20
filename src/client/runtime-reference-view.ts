import { type CommunityDragonLocale } from "../domain/communitydragon-runtime";
import {
  communityDragonChampionUrl,
  communityDragonDataUrl,
} from "../domain/communitydragon-url";
import { localizedPath } from "../i18n/config";
import { runtimeFailureMessage } from "./communitydragon-errors";
import type {
  RuntimeHistory,
  RuntimeLocationState,
  RuntimePage,
  RuntimeView,
} from "./runtime-reference";

export interface RuntimeControllerLike {
  navigate(url: URL): Promise<void>;
}

function loadedAt(locale: CommunityDragonLocale): string {
  return new Intl.DateTimeFormat(locale === "zh_cn" ? "zh-CN" : "en", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date());
}

export interface DomRuntimeViewOptions {
  readonly root: HTMLElement;
  readonly source: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly page: RuntimePage;
  readonly getController: () => RuntimeControllerLike;
  readonly history: RuntimeHistory;
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
  return localizedPath(locale === "zh_cn" ? "zh-cn" : "en", `/${page}/`);
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

function sourceUrlFor(
  state: RuntimeLocationState,
  locale: CommunityDragonLocale,
): string | undefined {
  if (state.mode === "list") {
    const file =
      state.page === "champions"
        ? "champion-summary.json"
        : `${state.page}.json`;
    return communityDragonDataUrl(file, locale, state.channel);
  }
  if (state.mode !== "detail") return undefined;
  if (state.kind === "champion")
    return communityDragonChampionUrl(
      String(state.id),
      locale === "zh_cn" ? "zh" : "en",
      state.channel,
    );
  if (state.kind === "skin")
    return communityDragonChampionUrl(
      String(state.championId),
      locale === "zh_cn" ? "zh" : "en",
      state.channel,
    );
  return communityDragonDataUrl(
    state.kind === "skinline" ? "skinlines.json" : "universes.json",
    locale,
    state.channel,
  );
}

export function shouldHandleRuntimeNavigation(
  url: URL,
  currentPathname: string,
): boolean {
  return url.pathname === currentPathname;
}

function linkWithNavigation(
  label: string,
  url: URL,
  controller: RuntimeControllerLike,
  className = "runtime-chip",
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = `${url.pathname}${url.search}`;
  link.textContent = label;
  link.addEventListener("click", (event) => {
    if (!shouldHandleRuntimeNavigation(url, window.location.pathname)) return;
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

export function createDomRuntimeView(
  options: DomRuntimeViewOptions,
): RuntimeView {
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
  const sourceLink = source.querySelector<HTMLAnchorElement>(
    "[data-runtime-source-link]",
  );
  const updateChannel = (selected: "pbe" | "latest") => {
    source
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        const active = button.dataset.runtimeChannel === selected;
        button.setAttribute("aria-pressed", String(active));
        if (button.dataset.runtimeChannel)
          button.textContent = button.dataset.runtimeChannel;
      });
    if (channelLabel) channelLabel.textContent = selected;
  };
  const updateSource = (state: RuntimeLocationState): void => {
    const url = sourceUrlFor(state, options.locale);
    if (!sourceLink || !url) return;
    sourceLink.href = url;
    sourceLink.setAttribute(
      "aria-label",
      options.locale === "zh_cn" ? "原始资料链接" : "Raw source link",
    );
  };
  let relationSlot: HTMLElement | undefined;
  const view: RuntimeView = {
    loading(preserve) {
      options.root.setAttribute("aria-busy", "true");
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
    renderList(items, state) {
      relationSlot = undefined;
      setRuntimeNoindex(false);
      options.root.removeAttribute("aria-busy");
      updateChannel(state.channel);
      updateSource(state);
      status.textContent =
        options.locale === "zh_cn"
          ? `已加载 ${items.length} 条资料`
          : `${items.length} references loaded`;
      const controller = options.getController();
      const toolbar = document.createElement("div");
      toolbar.className = "runtime-toolbar";
      const search = document.createElement("input");
      search.type = "search";
      search.id = `runtime-${options.page}-search`;
      search.placeholder =
        options.locale === "zh_cn" ? "搜索名称" : "Search names";
      search.setAttribute("aria-label", search.placeholder);
      const searchLabel = document.createElement("label");
      searchLabel.className = "runtime-toolbar-field";
      searchLabel.htmlFor = search.id;
      searchLabel.append(
        textNode("span", options.locale === "zh_cn" ? "搜索" : "Search"),
        search,
      );
      const sort = document.createElement("select");
      sort.id = `runtime-${options.page}-sort`;
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
      const sortLabel = document.createElement("label");
      sortLabel.className = "runtime-toolbar-field";
      sortLabel.htmlFor = sort.id;
      sortLabel.append(
        textNode("span", options.locale === "zh_cn" ? "排序" : "Sort"),
        sort,
      );
      toolbar.append(searchLabel, sortLabel);
      const grid = document.createElement("div");
      grid.className = "runtime-grid";
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
            card.className = "runtime-card";
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
      updateSource(state);
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
        links.className = "runtime-links";
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
        if (item.stages.length) {
          const stages = document.createElement("section");
          stages.appendChild(
            textNode("h2", options.locale === "zh_cn" ? "阶段" : "Stages"),
          );
          for (const stage of item.stages) {
            stages.appendChild(textNode("h3", stage.name));
            appendMedia(
              stages,
              stage.media.focusedSplashUrl ?? stage.media.tileUrl,
              stage.name,
            );
          }
          article.appendChild(stages);
        }
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
        const relations = document.createElement("section");
        relations.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn"
              ? "所属系列与宇宙"
              : "Skinlines and universes",
          ),
        );
        relationSlot = textNode(
          "p",
          options.locale === "zh_cn"
            ? "正在加载关联资料…"
            : "Loading related references…",
          "runtime-relation-state",
        );
        relations.appendChild(relationSlot);
        article.appendChild(relations);
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
      if (!items.length) {
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "当前区域数据视图没有可显示的关联资料。"
            : "No related references are available in this regional view.";
        return;
      }
      const links = document.createElement("div");
      links.className = "runtime-links";
      items.forEach((item) =>
        links.appendChild(
          linkWithNavigation(
            item.name,
            hrefFor(
              options.locale,
              item.kind === "skinline" ? "skinlines" : "universes",
              {
                id: item.id,
                channel: state.channel,
              },
            ),
            controller,
          ),
        ),
      );
      relationSlot.replaceChildren(links);
    },
    relationFailure(error, retry) {
      if (!relationSlot) return;
      const notice = textNode(
        "p",
        runtimeFailureMessage(error, options.locale),
        "runtime-relation-error",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent =
        options.locale === "zh_cn"
          ? "重试关联资料"
          : "Retry related references";
      button.addEventListener("click", retry, { once: true });
      notice.append(" ", button);
      relationSlot.appendChild(notice);
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
