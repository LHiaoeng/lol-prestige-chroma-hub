import {
  catalogRarityKey,
  filterSkinCatalogItems,
  formatSkinCatalogUrl,
  projectSkinCatalogItems,
  readSkinCatalogUrlState,
  type SkinCatalogReleaseDate,
  type SkinCatalogSort,
  UNMARKED_RARITY,
} from "../domain/skin-catalog";
import {
  type CommunityDragonLocale,
  type RuntimeChannel,
  type RuntimeRarity,
  resolveBorderModule,
} from "../domain/communitydragon-runtime";
import { runtimeSkinRarityRank, type RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import { createDomainIcon, setDomainIconTooltip } from "../components/domain-icons";
import { createUiIcon } from "../components/ui-icons";
import { createPopover } from "../components/popover";
import { createTooltip } from "../components/tooltip";
import { createCommunityDragonRuntime, type CommunityDragonRuntime } from "./communitydragon-runtime";
import { asCommunityDragonError, runtimeFailureMessage } from "./communitydragon-errors";
import { RuntimeChannelLifecycle, type RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { browserHistory } from "./runtime-reference-view";
import { hrefFor } from "./runtime-reference-view-shared";

type CatalogState = ReturnType<typeof readSkinCatalogUrlState>;
type CatalogLoadResult = { items: readonly RuntimeSkinReferenceItem[]; pbeNewSkinIds?: ReadonlySet<number> };
type SkinCatalogArtworkMode = { plainUrl: string; framedUrl: string; borderUrls: readonly string[] };
const CATALOG_PAGE_SIZE = 50;
const isReleaseSort = (sort: SkinCatalogSort) => sort === "release_desc" || sort === "release_asc";

const zh = {
  loading: "正在加载完整皮肤目录…",
  empty: "当前资料版本没有可展示的皮肤。",
  noMatches: "没有符合条件的皮肤。",
  retry: "重试",
  invalid: "目录链接中的筛选参数无效。",
  unmarked: "其他",
  count: (shown: number, total: number) => `找到 ${shown} / ${total} 款皮肤`,
  loadMore: "加载更多",
  borderCount: (shown: number, total: number) => `带框 ${shown} / ${total} 款`,
  hideBorder: "切换到无边框载入图",
  showBorder: "切换到带边框载入图",
  borderToggle: "切换载入图边框",
  skinDetails: "皮肤详情",
  pbeNewSkin: "PBE 新增皮肤",
  missing: "暂无原画",
};
const en = {
  loading: "Loading the full skin catalog…",
  empty: "No skins are available in this data channel.",
  noMatches: "No skins match these filters.",
  retry: "Retry",
  invalid: "The catalog link contains invalid filters.",
  unmarked: "Other",
  count: (shown: number, total: number) => `${shown} / ${total} skins`,
  loadMore: "Load more",
  borderCount: (shown: number, total: number) => `${shown} / ${total} framed`,
  hideBorder: "Switch to the plain loading screen",
  showBorder: "Switch to the framed loading screen",
  borderToggle: "Toggle loading-screen border",
  skinDetails: "Skin details",
  pbeNewSkin: "New on PBE",
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

export function initSkinCatalog(
  root: HTMLElement,
  runtime: CommunityDragonRuntime = createCommunityDragonRuntime(),
  history: RuntimeChannelHistory = browserHistory(),
): RuntimeChannelLifecycle<CatalogState, CatalogLoadResult, ReturnType<typeof asCommunityDragonError>> {
  const locale = root.dataset.catalogLocale as CommunityDragonLocale;
  if (locale !== "zh_cn" && locale !== "default") throw new Error("Skin catalog locale is invalid");
  if (!root.dataset.catalogReleaseDates) throw new Error("Skin catalog release dates are missing");
  const releaseDates = new Map<number, SkinCatalogReleaseDate>(
    (JSON.parse(root.dataset.catalogReleaseDates) as [number, string | null, string | null][])
      .map(([id, globalReleaseDate, chinaReleaseDate]) => [id, { globalReleaseDate, chinaReleaseDate }]),
  );
  const copy = locale === "zh_cn" ? zh : en;
  const status = element<HTMLElement>(root, "[data-catalog-status]");
  const content = element<HTMLElement>(root, "[data-catalog-content]");
  const loadingSkeleton = element<HTMLElement>(content, ".skin-catalog-skeleton");
  const results = element<HTMLElement>(root, "[data-catalog-results]");
  const grid = element<HTMLElement>(root, "[data-catalog-grid]");
  const loadMoreFooter = element<HTMLElement>(root, "[data-catalog-load-more-footer]");
  const loadMore = element<HTMLButtonElement>(root, "[data-catalog-load-more]");
  const search = element<HTMLInputElement>(root, "[data-catalog-search]");
  const rarities = element<HTMLElement>(root, "[data-catalog-rarities]");
  const sort = element<HTMLSelectElement>(root, "[data-catalog-sort]");
  const includeClassic = element<HTMLInputElement>(root, "[data-catalog-classic]");
  const showFramedScreens = element<HTMLInputElement>(root, "[data-catalog-framed-all]");
  const showEmblems = locale === "zh_cn"
    ? element<HTMLInputElement>(root, "[data-catalog-emblems-all]")
    : undefined;
  const onlyPbeAdditions = root.querySelector<HTMLInputElement>("[data-catalog-pbe-only]");
  const framedCount = element<HTMLElement>(root, "[data-catalog-framed-count]");
  const framedTooltipTrigger = element<HTMLElement>(root, "[data-catalog-framed-tooltip-trigger]");
  const framedSetting = framedTooltipTrigger.closest<HTMLElement>(".skin-catalog-framed-setting");
  const pbeSetting = onlyPbeAdditions?.closest<HTMLElement>(".skin-catalog-pbe-setting");
  const framedTooltip = createTooltip(framedTooltipTrigger, framedCount);
  framedTooltip.className += " skin-catalog-framed-tooltip";
  framedTooltip.tabIndex = -1;
  const framedTooltipId = framedTooltip.getAttribute("aria-describedby");
  if (framedTooltipId) showFramedScreens.setAttribute("aria-describedby", framedTooltipId);
  framedSetting?.replaceChildren(framedTooltip);
  const count = element<HTMLElement>(root, "[data-catalog-count]");
  const summary = element<HTMLElement>(root, "[data-catalog-summary]");
  const summarySkeleton = element<HTMLElement>(root, "[data-catalog-summary-skeleton]");
  const filterSkeleton = element<HTMLElement>(root, "[data-catalog-filter-skeleton]");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  let items: readonly RuntimeSkinReferenceItem[] = [];
  let pbeNewSkinIds: ReadonlySet<number> | undefined;
  let state = readSkinCatalogUrlState(history.url);
  let committedChannel: RuntimeChannel | undefined;
  let filtered: readonly RuntimeSkinReferenceItem[] = [];
  let shownCount = 0;
  let framedByDefault = true;
  let emblemsVisible = true;
  const framedOverrides = new Map<number, boolean>();
  const artworkModes = new Map<number, { plain: HTMLElement; framed: HTMLElement }>();
  const popoverCleanups: (() => void)[] = [];
  const clearPopovers = () => {
    for (const cleanup of popoverCleanups) cleanup();
    popoverCleanups.length = 0;
  };
  const loadingScreenModes = (item: RuntimeSkinReferenceItem): SkinCatalogArtworkMode | undefined => {
    const plainUrl = item.media.loadScreenUrl;
    if (!plainUrl) return;
    if (item.media.loadScreenVintageUrl)
      return { plainUrl, framedUrl: item.media.loadScreenVintageUrl, borderUrls: [] };
    const borders = resolveBorderModule(item.media);
    if (borders?.kind !== "composite") return;
    return {
      plainUrl,
      framedUrl: plainUrl,
      borderUrls: borders.groups.flatMap((layer) => layer.options.at(-1)?.url ?? []),
    };
  };
  const isFramed = (id: number) => framedOverrides.get(id) ?? framedByDefault;
  const syncFramedSetting = () => {
    const eligible = items.filter((item) => loadingScreenModes(item));
    const framed = eligible.filter((item) => isFramed(item.id)).length;
    showFramedScreens.checked = framed === eligible.length;
    showFramedScreens.indeterminate = framed > 0 && framed < eligible.length;
    framedCount.textContent = copy.borderCount(framed, eligible.length);
    showFramedScreens.closest<HTMLElement>(".skin-catalog-framed-setting")?.toggleAttribute("hidden", eligible.length === 0);
  };
  const setControlsDisabled = (disabled: boolean) => {
    search.disabled = disabled;
    sort.disabled = disabled;
    includeClassic.disabled = disabled;
    loadMore.disabled = disabled;
    showFramedScreens.disabled = disabled;
    if (showEmblems) showEmblems.disabled = disabled;
    if (onlyPbeAdditions) onlyPbeAdditions.disabled = disabled;
    root.querySelectorAll<HTMLButtonElement>("[data-ant-dropdown-trigger], [data-runtime-channel], [data-catalog-rarity]")
      .forEach((button) => { button.disabled = disabled; });
  };
  setControlsDisabled(true);
  const finishLoading = () => {
    summarySkeleton.hidden = true;
    filterSkeleton.hidden = true;
    summary.hidden = false;
  };
  const showFilters = (visible: boolean) => {
    const searchRow = search.closest<HTMLElement>(".skin-catalog-search");
    const rarityRow = rarities.closest<HTMLElement>(".skin-catalog-rarities");
    const toolbar = sort.closest<HTMLElement>(".skin-catalog-toolbar");
    if (searchRow) searchRow.hidden = !visible;
    if (rarityRow) rarityRow.hidden = !visible;
    if (toolbar) toolbar.hidden = !visible;
  };

  const showMessage = (message: string, kind: "empty" | "error", retry?: () => void) => {
    const template = root.querySelector<HTMLTemplateElement>(
      kind === "empty" ? "[data-catalog-empty-template]" : "[data-catalog-error-template]",
    );
    const panel = template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
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
  const card = (item: RuntimeSkinReferenceItem): HTMLElement => {
    const article = document.createElement("article");
    article.className = "skin-catalog-card";
    const actions = document.createElement("div");
    actions.className = "skin-catalog-card-actions";
    const link = document.createElement("a");
    link.href = hrefFor(
      locale, "skins",
      { id: item.id, championId: item.championId, channel: state.channel ?? "pbe" },
      "detail", state.channelExplicit,
    ).href;
    const media = document.createElement("span");
    media.className = "skin-catalog-card-media";
    const modes = loadingScreenModes(item);
    const imageUrl = modes
      ? isFramed(item.id) ? modes.framedUrl : modes.plainUrl
      : item.media.loadScreenVintageUrl ?? item.media.loadScreenUrl ?? item.media.focusedSplashUrl ?? item.media.unfocusedSplashUrl;
    const fallbackUrl = item.media.focusedSplashUrl ?? item.media.unfocusedSplashUrl;
    const showMissingImage = () => {
      media.className += " skin-catalog-card-media--missing";
      media.replaceChildren(document.createTextNode(copy.missing));
    };
    let modeToggle: HTMLButtonElement | undefined;
    if (imageUrl) {
      media.style.setProperty("--catalog-backdrop", `url("${imageUrl}")`);
      const plain = modes ? document.createElement("span") : media;
      const framed = modes ? document.createElement("span") : undefined;
      if (modes && framed) {
        plain.className = "skin-catalog-card-artwork skin-catalog-card-artwork--plain";
        framed.className = "skin-catalog-card-artwork skin-catalog-card-artwork--framed";
        plain.hidden = isFramed(item.id);
        framed.hidden = !isFramed(item.id);
        media.append(plain, framed);
        artworkModes.set(item.id, { plain, framed });
      }
      const appendLoadScreen = (parent: HTMLElement, sourceUrl: string) => {
        const image = document.createElement("img");
        image.className = "skin-catalog-card-image";
        image.src = sourceUrl;
        image.alt = "";
        image.loading = "lazy";
        image.addEventListener("error", () => {
          if (fallbackUrl && image.src !== fallbackUrl) {
            image.src = fallbackUrl;
            media.style.setProperty("--catalog-backdrop", `url("${fallbackUrl}")`);
          } else {
            media.style.removeProperty("--catalog-backdrop");
            artworkModes.delete(item.id);
            modeToggle?.closest<HTMLElement>(".skin-catalog-card-action-tooltip")?.remove();
            showMissingImage();
          }
        });
        parent.append(image);
      };
      appendLoadScreen(plain, modes?.plainUrl ?? imageUrl);
      if (framed) {
        appendLoadScreen(framed, modes?.framedUrl ?? imageUrl);
        for (const url of modes?.borderUrls ?? []) {
          const border = document.createElement("img");
          border.className = "skin-catalog-card-border";
          border.src = url;
          border.alt = "";
          border.loading = "lazy";
          border.addEventListener("error", () => border.remove());
          framed.append(border);
        }
        modeToggle = document.createElement("button");
        modeToggle.className = "ant-btn ant-btn-sm ant-btn-icon-only skin-catalog-artwork-toggle";
        modeToggle.type = "button";
        modeToggle.dataset.skinArtworkToggle = String(item.id);
        modeToggle.setAttribute("aria-pressed", String(isFramed(item.id)));
        modeToggle.setAttribute("aria-label", isFramed(item.id) ? copy.hideBorder : copy.showBorder);
        const mediaIcon = createUiIcon("image-switch");
        mediaIcon.setAttribute("width", "14");
        mediaIcon.setAttribute("height", "14");
        modeToggle.append(mediaIcon);
        const borderTooltip = createTooltip(modeToggle, copy.borderToggle);
        borderTooltip.classList.add("skin-catalog-card-action-tooltip");
        borderTooltip.tabIndex = -1;
        const borderTooltipId = borderTooltip.getAttribute("aria-describedby");
        if (borderTooltipId) modeToggle.setAttribute("aria-describedby", borderTooltipId);
        actions.append(borderTooltip);
      }
    } else {
      showMissingImage();
    }
    link.append(media);
    const title = document.createElement("span");
    title.className = "skin-catalog-card-title";
    const name = document.createElement("span");
    name.className = "skin-catalog-card-title-name";
    name.textContent = item.name ?? item.championName ?? String(item.id);
    if (locale === "zh_cn" && item.emblems?.length) {
      const emblemGroup = document.createElement("span");
      emblemGroup.className = "skin-catalog-emblems";
      emblemGroup.dataset.catalogEmblems = "";
      emblemGroup.hidden = !emblemsVisible;
      for (const emblem of item.emblems) {
        const image = document.createElement("img");
        image.src = emblem.imageUrl;
        image.alt = emblem.name ?? "";
        image.loading = "lazy";
        const preview = document.createElement("img");
        preview.src = emblem.imageUrl;
        preview.alt = "";
        preview.className = "skin-catalog-emblem-preview";
        preview.loading = "lazy";
        const tooltip = createTooltip(image, preview);
        tooltip.classList.add("skin-catalog-emblem-tooltip");
        tooltip.querySelector(".ant-tooltip")?.classList.add("skin-catalog-emblem-image-tooltip");
        image.addEventListener("error", () => tooltip.remove());
        emblemGroup.append(tooltip);
      }
      title.append(emblemGroup);
    }
    title.append(name);
    const key = catalogRarityKey(item, locale);
    const rarity = key ? rarityLabel(item.rarity, key, locale) : undefined;
    link.setAttribute("aria-label", [item.championName, name.textContent, rarity].filter(Boolean).join(" · "));
    link.append(title);
    article.append(link);
    const detailsButton = document.createElement("button");
    detailsButton.className = "ant-btn ant-btn-sm ant-btn-icon-only skin-catalog-info-button";
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-label", copy.skinDetails);
    const detailsIcon = createUiIcon("info");
    detailsIcon.setAttribute("width", "14");
    detailsIcon.setAttribute("height", "14");
    detailsButton.append(detailsIcon);
    const dates = releaseDates.get(item.skinId);
    const releaseDate = locale === "zh_cn"
      ? dates?.chinaReleaseDate ?? dates?.globalReleaseDate
      : dates?.globalReleaseDate;
    const details = document.createElement("dl");
    details.className = "skin-catalog-details";
    const appendDetail = (
      iconName: Parameters<typeof createDomainIcon>[0],
      label: string,
      value: string,
      href?: string,
    ) => {
      const row = document.createElement("div");
      row.className = "skin-catalog-detail";
      const term = document.createElement("dt");
      term.append(createDomainIcon(iconName), document.createTextNode(label));
      const description = document.createElement("dd");
      if (href) {
        const valueLink = document.createElement("a");
        valueLink.href = href;
        valueLink.textContent = value;
        description.append(valueLink);
      } else description.textContent = value;
      row.append(term, description);
      details.append(row);
    };
    appendDetail("skins", locale === "zh_cn" ? "皮肤" : "Skin", name.textContent, link.href);
    if (item.championName) {
      appendDetail(
        "champions",
        locale === "zh_cn" ? "英雄" : "Champion",
        item.championName,
        hrefFor(locale, "champions", { id: item.championId, channel: state.channel ?? "pbe" }, "detail", state.channelExplicit).href,
      );
    }
    appendDetail("rarity", locale === "zh_cn" ? "稀有度" : "Rarity", rarity ?? copy.unmarked);
    const chromaCount = item.chromas.length;
    const chromaLink = new URL(link.href);
    chromaLink.hash = "runtime-skin-chromas";
    appendDetail(
      "prestige-chromas",
      locale === "zh_cn" ? "炫彩" : "Chromas",
      locale === "zh_cn" ? `${chromaCount} 款` : `${chromaCount} ${chromaCount === 1 ? "chroma" : "chromas"}`,
      chromaCount > 0 ? chromaLink.href : undefined,
    );
    if (releaseDate) appendDetail("release-date", locale === "zh_cn" ? "上线时间" : "Released", releaseDate);
    popoverCleanups.push(createPopover(detailsButton, copy.skinDetails, details));
    actions.append(detailsButton);
    article.append(actions);
    if (state.channel === "pbe" && pbeNewSkinIds?.has(item.skinId)) {
      const label = document.createElement("span");
      label.textContent = "PBE";
      label.setAttribute("aria-hidden", "true");
      const marker = createTooltip(label, copy.pbeNewSkin);
      marker.classList.add("skin-catalog-pbe-marker");
      marker.setAttribute("aria-label", copy.pbeNewSkin);
      article.append(marker);
    }
    if (key && item.rarity?.iconUrl) {
      const icon = document.createElement("img");
      icon.className = "skin-catalog-card-rarity";
      icon.src = item.rarity.iconUrl;
      icon.alt = rarityLabel(item.rarity, key, locale);
      icon.addEventListener("error", () => icon.remove());
      const tooltip = createTooltip(icon, icon.alt);
      tooltip.classList.add("skin-catalog-rarity-tooltip");
      article.append(tooltip);
    }
    return article;
  };
  const appendNextPage = (focusFirst = false) => {
    const columns = Number.parseInt(getComputedStyle(root).getPropertyValue("--catalog-columns"), 10);
    const pageSize = Math.ceil(CATALOG_PAGE_SIZE / columns) * columns;
    const next = filtered.slice(shownCount, shownCount + pageSize);
    const cards = next.map(card);
    grid.append(...cards);
    shownCount += next.length;
    loadMoreFooter.hidden = shownCount >= filtered.length;
    if (focusFirst) cards[0]?.querySelector<HTMLAnchorElement>("a")?.focus();
  };
  loadMore.textContent = copy.loadMore;
  loadMore.addEventListener("click", (event) => appendNextPage(event.detail === 0));
  const refresh = () => {
    filtered = filterSkinCatalogItems(items, {
      locale,
      search: state.search,
      rarities: state.rarities,
      excludeClassic: state.excludeClassic,
      onlyPbeAdditions: state.channel === "pbe" && onlyPbeAdditions?.checked === true && pbeNewSkinIds !== undefined,
      sort: state.sort,
      channel: state.channel,
      releaseDates,
      pbeNewSkinIds: pbeNewSkinIds ?? new Set<number>(),
    });
    count.textContent = copy.count(filtered.length, items.length);
    syncFramedSetting();
    clearPopovers();
    grid.replaceChildren();
    artworkModes.clear();
    shownCount = 0;
    loadMoreFooter.hidden = true;
    if (!items.length || !filtered.length) {
      results.hidden = true;
      showMessage(items.length ? copy.noMatches : copy.empty, "empty");
    } else {
      content.hidden = true;
      results.hidden = false;
      appendNextPage();
    }
  };
  showFramedScreens.addEventListener("change", () => {
    framedByDefault = showFramedScreens.checked;
    framedOverrides.clear();
    for (const [id, artwork] of artworkModes) {
      artwork.plain.hidden = framedByDefault;
      artwork.framed.hidden = !framedByDefault;
      const toggle = root.querySelector<HTMLButtonElement>(`[data-skin-artwork-toggle="${id}"]`);
      toggle?.setAttribute("aria-pressed", String(framedByDefault));
      toggle?.setAttribute("aria-label", framedByDefault ? copy.hideBorder : copy.showBorder);
    }
    syncFramedSetting();
  });
  showEmblems?.addEventListener("change", () => {
    emblemsVisible = showEmblems.checked;
    grid.querySelectorAll<HTMLElement>("[data-catalog-emblems]")
      .forEach((group) => { group.hidden = !emblemsVisible; });
  });
  onlyPbeAdditions?.addEventListener("change", refresh);
  grid.addEventListener("click", (event) => {
    const toggle = (event.target as Element).closest<HTMLButtonElement>("[data-skin-artwork-toggle]");
    if (!toggle || !grid.contains(toggle)) return;
    const id = Number(toggle.dataset.skinArtworkToggle);
    const framed = !isFramed(id);
    framedOverrides.set(id, framed);
    const artwork = artworkModes.get(id);
    if (artwork) {
      artwork.plain.hidden = framed;
      artwork.framed.hidden = !framed;
    }
    toggle.setAttribute("aria-pressed", String(framed));
    toggle.setAttribute("aria-label", framed ? copy.hideBorder : copy.showBorder);
    syncFramedSetting();
  });
  const syncControls = () => {
    search.value = state.search;
    sort.value = state.sort;
    includeClassic.checked = !state.excludeClassic;
    const selected = state.channel ?? "pbe";
    root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.runtimeChannel === selected));
    });
    const label = communityDragonChannelLabel(selected, locale);
    element<HTMLElement>(root, "[data-runtime-channel-label]").textContent = label;
    const icon = root.querySelector<SVGSVGElement>(".domain-icon--reference");
    if (icon) setDomainIconTooltip(icon, "reference", label, locale);
    rarities.querySelectorAll<HTMLButtonElement>("[data-catalog-rarity]").forEach((button) => {
      const key = button.dataset.catalogRarity ?? "";
      button.setAttribute("aria-pressed", String(key ? state.rarities.includes(key) : state.rarities.length === 0));
    });
    syncLanguageLink();
  };
  const renderRarities = () => {
    const available = new Map<string, { label: string; rank: number }>();
    for (const item of items) {
      const key = catalogRarityKey(item, locale) || UNMARKED_RARITY;
      if (!available.has(key)) available.set(key, {
        label: rarityLabel(item.rarity, key, locale),
        rank: key === UNMARKED_RARITY ? -1 : runtimeSkinRarityRank(item),
      });
    }
    rarities.replaceChildren();
    const all = document.createElement("button");
    all.type = "button";
    all.dataset.catalogRarity = "";
    all.textContent = locale === "zh_cn" ? "全部" : "All";
    all.setAttribute("aria-pressed", String(state.rarities.length === 0));
    rarities.append(all);
    const ordered = [...available].sort(
      ([, left], [, right]) =>
        right.rank - left.rank ||
        left.label.localeCompare(right.label, locale === "zh_cn" ? "zh-CN" : "en"),
    );
    for (const [key, { label }] of ordered) {
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
      const comparePbe = target.channel === "pbe" && (onlyPbeAdditions !== null || isReleaseSort(target.sort));
      const [collection, live] = await Promise.all([
        runtime.listSkinCatalog({ locale, channel: target.channel, signal }),
        comparePbe
          ? runtime.listSkinCatalog({ locale, channel: "latest", signal }).catch(() => undefined)
          : Promise.resolve(undefined),
      ]);
      const liveIds = new Set(live?.skins.map((skin) => skin.id));
      return {
        items: projectSkinCatalogItems(collection.skins, collection.champions),
        pbeNewSkinIds: live
          ? new Set(collection.skins.filter((skin) => !liveIds.has(skin.id)).map((skin) => skin.id))
          : undefined,
      };
    },
    normalizeError: (error) => asCommunityDragonError(error, locale),
    isAborted: (error) => error.code === "aborted",
    view: {
      loading(preserve) {
        setControlsDisabled(true);
        if (!preserve) {
          showFilters(false);
          summary.hidden = true;
          summarySkeleton.hidden = false;
          filterSkeleton.hidden = false;
        }
        status.textContent = copy.loading;
        content.hidden = preserve && !results.hidden;
        if (!preserve) {
          results.hidden = true;
          content.replaceChildren(loadingSkeleton);
        }
      },
      render(result, context) {
        items = result.items;
        pbeNewSkinIds = result.pbeNewSkinIds;
        framedOverrides.clear();
        const available = new Set(items.map((item) => catalogRarityKey(item, locale) || UNMARKED_RARITY));
        state = {
          ...context.target,
          rarities: context.target.rarities.filter((key) => available.has(key)),
        };
        committedChannel = context.channel;
        pbeSetting?.toggleAttribute("hidden", context.channel !== "pbe" || !pbeNewSkinIds);
        status.textContent = "";
        finishLoading();
        count.hidden = items.length === 0;
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
        finishLoading();
        count.hidden = true;
        showFilters(false);
        results.hidden = true;
        showMessage(message, "error");
      },
      failure(error, retry, preserve) {
        const message = runtimeFailureMessage(error, locale);
        status.textContent = message;
        showMessage(message, "error", retry);
        if (!preserve) {
          finishLoading();
          count.hidden = true;
          showFilters(false);
          results.hidden = true;
        }
        syncControls();
        setControlsDisabled(false);
      },
    },
  });
  search.addEventListener("input", () => update({ ...state, search: search.value }));
  includeClassic.addEventListener("change", () => update({ ...state, excludeClassic: !includeClassic.checked }));
  sort.addEventListener("change", () => update({ ...state, sort: sort.value as SkinCatalogSort }));
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
  root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      const channel = button.dataset.runtimeChannel;
      if ((channel !== "pbe" && channel !== "latest") || channel === committedChannel) return;
      void lifecycle.navigate(formatSkinCatalogUrl(history.url, {
        ...state,
        channel,
        channelExplicit: true,
      }));
    });
  });
  void lifecycle.start();
  return lifecycle;
}
