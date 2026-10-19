import {
  catalogRarityKey,
  filterSkinCatalogItems,
  formatSkinCatalogUrl,
  projectSkinCatalogItems,
  readSkinCatalogUrlState,
  UNMARKED_RARITY,
} from "../domain/skin-catalog";
import {
  type CommunityDragonLocale,
  type RuntimeChannel,
  type RuntimeRarity,
  resolveBorderModule,
} from "../domain/communitydragon-runtime";
import type { RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";
import { createCommunityDragonRuntime, type CommunityDragonRuntime } from "./communitydragon-runtime";
import { asCommunityDragonError, runtimeFailureMessage } from "./communitydragon-errors";
import { RuntimeChannelLifecycle, type RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { browserHistory } from "./runtime-reference-view";
import { hrefFor } from "./runtime-reference-view-shared";

type CatalogState = ReturnType<typeof readSkinCatalogUrlState>;

const zh = {
  loading: "正在加载完整皮肤目录…",
  empty: "当前资料版本没有可展示的皮肤。",
  noMatches: "没有符合条件的皮肤。",
  retry: "重试",
  invalid: "目录链接中的筛选参数无效。",
  unmarked: "未标注",
  count: (shown: number, total: number) => `找到 ${shown} / ${total} 款皮肤`,
  missing: "暂无原画",
};
const en = {
  loading: "Loading the full skin catalog…",
  empty: "No skins are available in this data channel.",
  noMatches: "No skins match these filters.",
  retry: "Retry",
  invalid: "The catalog link contains invalid filters.",
  unmarked: "Unmarked",
  count: (shown: number, total: number) => `${shown} / ${total} skins`,
  missing: "Artwork unavailable",
};

function element<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const match = root.querySelector<T>(selector);
  if (!match) throw new Error(`Skin catalog is missing ${selector}`);
  return match;
}

function rarityLabel(rarity: RuntimeRarity | undefined, key: string, locale: CommunityDragonLocale): string {
  if (key === UNMARKED_RARITY) return locale === "zh_cn" ? zh.unmarked : en.unmarked;
  return rarity?.label || rarity?.key || String(rarity?.id ?? key);
}

export function catalogColumns(viewport: HTMLElement): number {
  const parsed = Number.parseInt(getComputedStyle(viewport).getPropertyValue("--catalog-columns"), 10);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 2;
}

export function initSkinCatalog(
  root: HTMLElement,
  runtime: CommunityDragonRuntime = createCommunityDragonRuntime(),
  history: RuntimeChannelHistory = browserHistory(),
): RuntimeChannelLifecycle<CatalogState, readonly RuntimeSkinReferenceItem[], ReturnType<typeof asCommunityDragonError>> {
  const locale = root.dataset.catalogLocale as CommunityDragonLocale;
  if (locale !== "zh_cn" && locale !== "default") throw new Error("Skin catalog locale is invalid");
  const copy = locale === "zh_cn" ? zh : en;
  const status = element<HTMLElement>(root, "[data-catalog-status]");
  const content = element<HTMLElement>(root, "[data-catalog-content]");
  const viewport = element<HTMLElement>(root, "[data-catalog-viewport]");
  const search = element<HTMLInputElement>(root, "[data-catalog-search]");
  const rarities = element<HTMLElement>(root, "[data-catalog-rarities]");
  const sort = element<HTMLSelectElement>(root, "[data-catalog-sort]");
  const count = element<HTMLElement>(root, "[data-catalog-count]");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  const grid = document.createElement("div");
  grid.className = "skin-catalog-grid";
  viewport.replaceChildren(grid);
  let items: readonly RuntimeSkinReferenceItem[] = [];
  let state = readSkinCatalogUrlState(history.url);
  let committedChannel: RuntimeChannel | undefined;
  let filtered: readonly RuntimeSkinReferenceItem[] = [];
  let rowHeight = 380;
  let lastColumns = 0;
  let lastStart = -1;
  let lastEnd = -1;
  const setControlsDisabled = (disabled: boolean) => {
    search.disabled = disabled;
    sort.disabled = disabled;
    root.querySelectorAll<HTMLButtonElement>("[data-catalog-channel], [data-catalog-rarity]")
      .forEach((button) => { button.disabled = disabled; });
  };
  setControlsDisabled(true);
  const showFilters = (visible: boolean) => {
    const searchRow = search.closest<HTMLElement>(".skin-catalog-search");
    const rarityRow = rarities.closest<HTMLElement>(".skin-catalog-rarities");
    const toolbar = sort.closest<HTMLElement>(".skin-catalog-toolbar");
    if (searchRow) searchRow.hidden = !visible;
    if (rarityRow) rarityRow.hidden = !visible;
    if (toolbar) toolbar.hidden = !visible;
  };

  const showMessage = (message: string, kind: "plain" | "empty" | "error" = "plain", retry?: () => void) => {
    const template = root.querySelector<HTMLTemplateElement>(
      kind === "empty" ? "[data-catalog-empty-template]" : "[data-catalog-error-template]",
    );
    const panel = kind === "plain" ? document.createElement("p") : template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    if (panel) {
      const description = kind === "empty" ? panel.querySelector(".ant-empty-description") : panel.querySelector(".alert__content");
      (description ?? panel).textContent = message;
      content.replaceChildren(panel);
    } else {
      const line = document.createElement("p");
      line.textContent = message;
      content.replaceChildren(line);
    }
    if (retry) {
      const button = document.createElement("button");
      button.className = "ant-btn";
      button.type = "button";
      button.textContent = copy.retry;
      button.addEventListener("click", retry);
      content.append(button);
    }
    content.hidden = false;
  };
  const syncLanguageLink = () => {
    const toggle = root.ownerDocument.querySelector<HTMLAnchorElement>(".language-toggle");
    const href = toggle?.getAttribute("href");
    if (!toggle || !href) return;
    const target = formatSkinCatalogUrl(new URL(href, history.url), state);
    toggle.setAttribute("href", `${target.pathname}${target.search}${target.hash}`);
  };
  const card = (item: RuntimeSkinReferenceItem, index: number): HTMLElement => {
    const article = document.createElement("article");
    article.className = "skin-catalog-card";
    const link = document.createElement("a");
    link.dataset.catalogIndex = String(index);
    link.href = hrefFor(
      locale, "skins",
      { id: item.id, championId: item.championId, channel: state.channel ?? "pbe" },
      "detail", state.channelExplicit,
    ).href;
    const media = document.createElement("span");
    media.className = "skin-catalog-card-media";
    const imageUrl = item.media.loadScreenVintageUrl ?? item.media.loadScreenUrl ?? item.media.focusedSplashUrl ?? item.media.unfocusedSplashUrl;
    const fallbackUrl = item.media.focusedSplashUrl ?? item.media.unfocusedSplashUrl;
    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "skin-catalog-card-image";
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.addEventListener("error", () => {
        if (fallbackUrl && image.src !== fallbackUrl) {
          media.querySelectorAll(".skin-catalog-card-border").forEach((border) => border.remove());
          image.src = fallbackUrl;
        } else media.replaceChildren(document.createTextNode(copy.missing));
      });
      media.append(image);
      if (!item.media.loadScreenVintageUrl && imageUrl === item.media.loadScreenUrl) {
        const borders = resolveBorderModule(item.media);
        if (borders?.kind === "composite") {
          for (const layer of borders.groups) {
            const selected = layer.options.at(-1);
            if (!selected) continue;
            const border = document.createElement("img");
            border.className = "skin-catalog-card-border";
            border.src = selected.url;
            border.alt = "";
            border.loading = "lazy";
            border.addEventListener("error", () => border.remove());
            media.append(border);
          }
        }
      }
    } else {
      media.textContent = copy.missing;
    }
    link.append(media);
    const title = document.createElement("span");
    title.className = "skin-catalog-card-title";
    title.textContent = item.name ?? item.championName ?? String(item.id);
    const key = catalogRarityKey(item, locale);
    const rarity = key ? rarityLabel(item.rarity, key, locale) : undefined;
    link.setAttribute("aria-label", [item.championName, title.textContent, rarity].filter(Boolean).join(" · "));
    link.title = [title.textContent, rarity].filter(Boolean).join(" · ");
    if (rarity && item.rarity?.iconUrl) link.dataset.catalogRarityHint = rarity;
    link.append(title);
    article.append(link);
    if (key && item.rarity?.iconUrl) {
      const icon = document.createElement("img");
      icon.className = "skin-catalog-card-rarity";
      icon.src = item.rarity.iconUrl;
      icon.alt = rarityLabel(item.rarity, key, locale);
      icon.title = icon.alt;
      icon.addEventListener("error", () => icon.remove());
      article.append(icon);
    }
    return article;
  };
  const draw = (force = false) => {
    const columns = catalogColumns(viewport);
    const first = Math.max(0, Math.floor(viewport.scrollTop / rowHeight) - 2);
    const start = first * columns;
    const end = Math.min(filtered.length, (Math.ceil((viewport.scrollTop + viewport.clientHeight) / rowHeight) + 2) * columns);
    if (!force && columns === lastColumns && start === lastStart && end === lastEnd) return;
    lastColumns = columns;
    lastStart = start;
    lastEnd = end;
    grid.style.paddingTop = `${first * rowHeight}px`;
    grid.style.paddingBottom = `${Math.max(0, Math.ceil(filtered.length / columns) - Math.ceil(end / columns)) * rowHeight}px`;
    grid.replaceChildren(...filtered.slice(start, end).map((item, offset) => card(item, start + offset)));
    const firstCard = grid.querySelector<HTMLElement>(".skin-catalog-card");
    if (firstCard) {
      const measured = firstCard.getBoundingClientRect().height;
      const gap = Number.parseFloat(getComputedStyle(grid).rowGap) || 0;
      if (measured > 0 && Math.abs(measured + gap - rowHeight) > 2) {
        rowHeight = measured + gap;
        draw(true);
      }
    }
  };
  const refresh = () => {
    filtered = filterSkinCatalogItems(items, {
      locale,
      search: state.search,
      rarities: state.rarities,
      sort: state.sort,
    });
    count.textContent = copy.count(filtered.length, items.length);
    viewport.scrollTop = 0;
    grid.replaceChildren();
    lastStart = -1;
    if (!items.length || !filtered.length) {
      viewport.hidden = true;
      showMessage(items.length ? copy.noMatches : copy.empty, "empty");
    } else {
      content.hidden = true;
      viewport.hidden = false;
      draw(true);
    }
  };
  const syncControls = () => {
    search.value = state.search;
    sort.value = state.sort;
    root.querySelectorAll<HTMLButtonElement>("[data-catalog-channel]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.catalogChannel === state.channel));
    });
    rarities.querySelectorAll<HTMLButtonElement>("[data-catalog-rarity]").forEach((button) => {
      const key = button.dataset.catalogRarity ?? "";
      button.setAttribute("aria-pressed", String(key ? state.rarities.includes(key) : state.rarities.length === 0));
    });
    syncLanguageLink();
  };
  const renderRarities = () => {
    const available = new Map<string, string>();
    for (const item of items) {
      const key = catalogRarityKey(item, locale) || UNMARKED_RARITY;
      if (!available.has(key)) available.set(key, rarityLabel(item.rarity, key, locale));
    }
    rarities.replaceChildren();
    const all = document.createElement("button");
    all.type = "button";
    all.dataset.catalogRarity = "";
    all.textContent = locale === "zh_cn" ? "全部" : "All";
    all.setAttribute("aria-pressed", String(state.rarities.length === 0));
    rarities.append(all);
    for (const [key, label] of available) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.catalogRarity = key;
      button.textContent = label;
      button.setAttribute("aria-pressed", String(state.rarities.includes(key)));
      rarities.append(button);
    }
  };
  const update = (next: CatalogState) => {
    state = next;
    history.push(formatSkinCatalogUrl(history.url, next));
    syncControls();
    if (committedChannel) refresh();
  };
  const lifecycle = new RuntimeChannelLifecycle({
    history,
    parse(url) {
      const parsed = readSkinCatalogUrlState(url);
      return parsed.invalid.length
        ? { status: "invalid", channel: parsed.channel, message: copy.invalid }
        : { status: "valid", channel: parsed.channel ?? "pbe", target: parsed };
    },
    async load(target, signal) {
      const collection = await runtime.listSkinCatalog({ locale, channel: target.channel, signal });
      return projectSkinCatalogItems(collection.skins, collection.champions);
    },
    normalizeError: (error) => asCommunityDragonError(error, locale),
    isAborted: (error) => error.code === "aborted",
    view: {
      loading(preserve) {
        setControlsDisabled(true);
        if (!preserve) showFilters(false);
        status.textContent = copy.loading;
        content.hidden = preserve;
        if (!preserve) {
          viewport.hidden = true;
          if (!content.querySelector(".skin-catalog-skeleton")) showMessage(copy.loading);
        }
      },
      render(result, context) {
        items = result;
        const available = new Set(result.map((item) => catalogRarityKey(item, locale) || UNMARKED_RARITY));
        state = {
          ...context.target,
          rarities: context.target.rarities.filter((key) => available.has(key)),
        };
        committedChannel = context.channel;
        status.textContent = "";
        renderRarities();
        showFilters(items.length > 0);
        syncControls();
        refresh();
        setControlsDisabled(false);
      },
      committed() {
        if (state.rarities.length !== readSkinCatalogUrlState(history.url).rarities.length)
          history.replace(formatSkinCatalogUrl(history.url, state));
      },
      invalid(message) {
        status.textContent = message;
        showFilters(false);
        viewport.hidden = true;
        showMessage(message, "error");
      },
      failure(error, retry, preserve) {
        const message = runtimeFailureMessage(error, locale);
        status.textContent = message;
        showMessage(message, "error", retry);
        if (!preserve) {
          showFilters(false);
          viewport.hidden = true;
        }
        setControlsDisabled(false);
      },
    },
  });
  search.addEventListener("input", () => update({ ...state, search: search.value }));
  sort.addEventListener("change", () => update({ ...state, sort: sort.value === "desc" ? "desc" : "asc" }));
  rarities.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-catalog-rarity]");
    if (!button || !rarities.contains(button)) return;
    const key = button.dataset.catalogRarity ?? "";
    update({
      ...state,
      rarities: key
        ? state.rarities.includes(key) ? state.rarities.filter((value) => value !== key) : [...state.rarities, key]
        : [],
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-catalog-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      const channel = button.dataset.catalogChannel;
      if ((channel !== "pbe" && channel !== "latest") || channel === committedChannel) return;
      void lifecycle.navigate(formatSkinCatalogUrl(history.url, {
        ...state,
        channel,
        channelExplicit: true,
      }));
    });
  });
  viewport.addEventListener("scroll", () => draw());
  viewport.setAttribute(
    "aria-description",
    locale === "zh_cn" ? "用方向键或 Tab 键继续浏览皮肤。" : "Use arrow keys or Tab to browse more skins.",
  );
  viewport.addEventListener("keydown", (event) => {
    const focused = (event.target as Element).closest<HTMLAnchorElement>("[data-catalog-index]");
    const index = focused ? Number(focused.dataset.catalogIndex) : -1;
    let next: number;
    if (event.key === "ArrowDown") next = index < 0 ? 0 : index + catalogColumns(viewport);
    else if (event.key === "ArrowUp") next = index - catalogColumns(viewport);
    else if (event.key === "ArrowRight") next = index + 1;
    else if (event.key === "ArrowLeft") next = index - 1;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = filtered.length - 1;
    else if (event.key === "Tab" && focused && !event.shiftKey && index === lastEnd - 1) next = index + 1;
    else if (event.key === "Tab" && focused && event.shiftKey && index === lastStart) next = index - 1;
    else return;
    if (next < 0 || next >= filtered.length) return;
    event.preventDefault();
    viewport.scrollTop = Math.floor(next / catalogColumns(viewport)) * rowHeight;
    draw(true);
    grid.querySelector<HTMLAnchorElement>(`[data-catalog-index="${next}"]`)?.focus();
  });
  new ResizeObserver(() => {
    rowHeight = 380;
    draw(true);
  }).observe(viewport);
  void lifecycle.start();
  return lifecycle;
}
