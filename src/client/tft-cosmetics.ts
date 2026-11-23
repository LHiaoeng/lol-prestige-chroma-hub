import { bindDebouncedSearch } from "./search-input";
import {
  addTftCosmeticSearchAliases,
  filterTftCosmetics,
  isTftCosmeticSort,
  markPbeTftCosmeticAdditions,
  type TftCosmetic,
  type TftCosmeticCatalog,
  type TftCosmeticSort,
  withTftCosmeticFeatureTags,
} from "../domain/tft-cosmetics";
import { isTftCosmeticTier, TFT_COSMETIC_TIER_ORDER } from "../domain/tft-cosmetic-tier";
import {
  formatTftCosmeticUrl,
  readTftCosmeticUrlState,
  type TftCosmeticUrlState,
} from "../domain/tft-cosmetics-url";
import type { CommunityDragonLocale, RuntimeChannel } from "../domain/communitydragon-runtime";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import { setDomainIconTooltip } from "../components/domain-icons";
import { tftCosmeticTierIconUrl, tftCosmeticTierLabel } from "../components/tft-cosmetic-tier";
import { appendTftFeatureDetail, bindTftCardDetails, createTftFeatureFilter } from "../components/tft-feature-tags";
import { createTooltip } from "../components/tooltip";
import { createIcon } from "../components/icons/create-icon";
import { enhanceSelect, refreshSelect } from "../components/select";
import {
  createCommunityDragonRuntime,
  type CommunityDragonRuntime,
} from "./communitydragon-runtime";
import {
  asCommunityDragonError,
  runtimeFailureMessage,
} from "./communitydragon-errors";
import {
  RuntimeChannelLifecycle,
  type RuntimeChannelHistory,
} from "./runtime-channel-lifecycle";
import { browserHistory } from "./runtime-reference-view";

const copy = {
  zh_cn: {
    empty: "当前资料版本没有可展示的外观。",
    noMatches: "没有符合条件的外观。",
    invalid: "链接中的无效筛选已清除。",
    featuresUnavailable: "功能标签资料暂不可用，仍可浏览外观。",
    total: (count: number) => "共 " + count + " 个外观资料项",
    results: (count: number) => "找到 " + count + " 个结果",
    name: "名称",
    rarity: "稀有度",
    starLevel: "星级",
    stars: (level: number) => level + " 星",
    features: "功能标签",
    details: "外观详情",
    missingImage: "图片暂不可用",
    preview: (name: string) => "打开大图：" + name,
    pbeNew: "PBE 新增",
  },
  default: {
    empty: "No cosmetics are available in this data channel.",
    noMatches: "No cosmetics match these filters.",
    invalid: "Invalid filter values in this link were cleared.",
    featuresUnavailable: "Feature data is unavailable. Cosmetics are still available to browse.",
    total: (count: number) => count + " cosmetics in this data channel",
    results: (count: number) => "Found " + count + " matches",
    name: "Name",
    rarity: "Rarity",
    starLevel: "Stars",
    stars: (level: number) => level + (level === 1 ? " star" : " stars"),
    features: "Features",
    details: "Cosmetic details",
    missingImage: "Artwork unavailable",
    preview: (name: string) => "Open full-size image: " + name,
    pbeNew: "PBE addition",
  },
} as const;

interface TftCosmeticLoadResult {
  readonly items: readonly TftCosmetic[];
  readonly canComparePbe: boolean;
  readonly aliasesAvailable: boolean;
  readonly featuresAvailable: boolean;
}

function element<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const match = root.querySelector<T>(selector);
  if (!match) throw new Error("TFT cosmetics page is missing " + selector);
  return match;
}

function getCosmeticBatchSize(grid: HTMLElement): number {
  const template = getComputedStyle(grid).gridTemplateColumns.trim();
  const columns = Math.max(1, template ? template.split(/\s+/).length : 1);
  return Math.max(columns, Math.floor(48 / columns) * columns);
}

export function initTftCosmeticCatalog(
  root: HTMLElement,
  runtime: CommunityDragonRuntime = createCommunityDragonRuntime(),
  history: RuntimeChannelHistory = browserHistory(),
): RuntimeChannelLifecycle<TftCosmeticUrlState, TftCosmeticLoadResult, ReturnType<typeof asCommunityDragonError>> {
  const locale = root.dataset.cosmeticsLocale as CommunityDragonLocale;
  const catalog = root.dataset.cosmeticsCatalog as TftCosmeticCatalog;
  if (locale !== "default" && locale !== "zh_cn")
    throw new Error("TFT cosmetics locale is invalid");
  if (catalog !== "booms" && catalog !== "portals")
    throw new Error("TFT cosmetics catalog is invalid");
  const text = copy[locale];

  const filters = element<HTMLElement>(root, "[data-cosmetics-filters]");
  const filterSkeleton = element<HTMLElement>(root, "[data-cosmetics-filter-skeleton]");
  const search = element<HTMLInputElement>(root, "[data-cosmetics-search]");
  const rarity = element<HTMLSelectElement>(root, "[data-cosmetics-rarity]");
  const level = root.querySelector<HTMLSelectElement>("[data-cosmetics-level]");
  const levelField = root.querySelector<HTMLElement>("[data-cosmetics-level-field]");
  const sort = element<HTMLSelectElement>(root, "[data-cosmetics-sort]");
  const pbeOnly = element<HTMLInputElement>(root, "[data-cosmetics-pbe-only]");
  const pbeSetting = element<HTMLElement>(root, "[data-cosmetics-pbe-setting]");
  const featureFilter = createTftFeatureFilter(root, (featureTypes) => updateFilters({ featureTypes }));
  const status = element<HTMLElement>(root, "[data-cosmetics-status]");
  const aliasNotice = element<HTMLElement>(root, "[data-cosmetics-alias-notice]");
  const aliasRetry = element<HTMLButtonElement>(root, "[data-cosmetics-alias-retry]");
  const compareNotice = element<HTMLElement>(root, "[data-cosmetics-compare-notice]");
  const compareRetry = element<HTMLButtonElement>(root, "[data-cosmetics-compare-retry]");
  const spinner = element<HTMLElement>(root, "[data-runtime-spin]");
  const content = element<HTMLElement>(root, "[data-cosmetics-content]");
  const results = element<HTMLElement>(root, "[data-cosmetics-results]");
  const grid = element<HTMLElement>(root, "[data-cosmetics-grid]");
  const count = element<HTMLElement>(root, "[data-cosmetics-count]");
  const resultCount = element<HTMLElement>(root, "[data-cosmetics-result-count]");
  const loadMoreFooter = element<HTMLElement>(root, "[data-cosmetics-load-more-footer]");
  const loadMore = element<HTMLButtonElement>(root, "[data-cosmetics-load-more]");
  const emptyTemplate = element<HTMLTemplateElement>(root, "[data-cosmetics-empty-template]");
  const errorTemplate = element<HTMLTemplateElement>(root, "[data-cosmetics-error-template]");
  const channelLabel = element<HTMLElement>(root, "[data-runtime-channel-label]");
  const loadingSkeleton = content.firstElementChild?.cloneNode(true);
  const selects = level ? [rarity, level, sort] : [rarity, sort];
  selects.forEach((select) => enhanceSelect(select));
  const listCosmetics = runtime.listTftCosmeticCatalog;
  const listFeatureTags = runtime.listTftCosmeticFeatureTags;
  if (!listCosmetics || !listFeatureTags)
    throw new Error("TFT cosmetic catalog requests are unavailable");

  let state = readTftCosmeticUrlState(history.url);
  let items: readonly TftCosmetic[] = [];
  let matches: readonly TftCosmetic[] = [];
  let canComparePbe = false;
  let batchSize = 1;
  let shownCount = 0;
  let pendingChannel: RuntimeChannel | undefined;
  let errorMessage: HTMLElement | undefined;
  const popoverCleanups: (() => void)[] = [];

  const setSpinning = (spinning: boolean) => {
    spinner.dataset.spinning = String(spinning);
    spinner.classList.toggle("ant-spin-spinning", spinning);
    spinner.setAttribute("aria-busy", String(spinning));
  };
  const setControlsDisabled = (disabled: boolean) => {
    [search, ...selects, pbeOnly, loadMore, aliasRetry, compareRetry].forEach((control) => {
      control.disabled = disabled;
    });
    featureFilter.disable(disabled);
  };
  const clearPopovers = () => {
    popoverCleanups.forEach((cleanup) => cleanup());
    popoverCleanups.length = 0;
  };
  const selectedFeatures = featureFilter.selected;

  const syncControls = () => {
    if (level) level.value = state.level === undefined ? "" : String(state.level);
    rarity.value = state.TFTRarity ?? "";
    sort.value = state.sort;
    pbeOnly.checked = state.onlyPbeAdditions;
    selects.forEach(refreshSelect);
    featureFilter.sync(state.featureTypes);
    root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) => {
      button.setAttribute("aria-checked", String(button.dataset.runtimeChannel === state.channel));
    });
    const label = communityDragonChannelLabel(state.channel, locale);
    channelLabel.textContent = label;
    const icon = root.querySelector<SVGSVGElement>(".domain-icon--reference");
    if (icon) setDomainIconTooltip(icon, "reference", label, locale === "zh_cn" ? "zh-cn" : "en");
  };

  const renderOptions = () => {
    const rarities = new Set(items.map(({ TFTRarity }) => TFTRarity));
    const rarityPlaceholder = rarity.firstElementChild?.cloneNode(true);
    if (!rarityPlaceholder) throw new Error("TFT cosmetics filter is missing its all-rarity option");
    rarity.replaceChildren(rarityPlaceholder);
    TFT_COSMETIC_TIER_ORDER.filter((tier) => rarities.has(tier)).forEach((tier) => {
      const option = root.ownerDocument.createElement("option");
      option.value = tier;
      option.textContent = tftCosmeticTierLabel(tier, locale);
      rarity.append(option);
    });

    if (level && levelField) {
      const levels = [...new Set(items.flatMap((item) => item.level === undefined ? [] : [item.level]))]
        .sort((left, right) => left - right);
      while (level.options.length > 1) level.remove(1);
      for (const stars of levels) {
        const option = root.ownerDocument.createElement("option");
        option.value = String(stars);
        option.textContent = text.stars(stars);
        level.append(option);
      }
      levelField.hidden = levels.length === 0;
    }

    featureFilter.render(items.map(({ featureTags }) => featureTags), locale === "zh_cn" ? "zh-CN" : "en");
    selects.forEach(refreshSelect);
  };

  const appendCard = (item: TftCosmetic) => {
    const doc = root.ownerDocument;
    const rarityLabel = tftCosmeticTierLabel(item.TFTRarity, locale);
    const article = doc.createElement("article");
    article.className = "runtime-card tft-cosmetic-card tft-cosmetics-card";
    const media = doc.createElement("div");
    media.className = "tft-cosmetic-card-media";
    const preview = doc.createElement("button");
    preview.className = "runtime-media-preview-trigger tft-cosmetic-card-preview";
    preview.type = "button";
    preview.dataset.mediaPreviewTrigger = "";
    preview.dataset.previewKind = "image";
    preview.dataset.previewSrc = item.previewUrl;
    preview.setAttribute("aria-label", text.preview(item.name));
    const image = doc.createElement("img");
    image.src = item.imageUrl;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";
    const fallback = doc.createElement("span");
    fallback.className = "tft-cosmetic-card-image-fallback";
    fallback.textContent = text.missingImage;
    fallback.hidden = true;
    image.addEventListener("error", () => {
      preview.hidden = true;
      fallback.hidden = false;
    }, { once: true });
    const cover = doc.createElement("span");
    cover.className = "tft-cosmetic-preview-cover";
    cover.setAttribute("aria-hidden", "true");
    cover.append(createIcon("EyeOutlined"));
    preview.append(image, cover);
    media.append(preview, fallback);

    if (state.channel === "pbe" && item.isPbeAddition) {
      const marker = doc.createElement("span");
      marker.className = "tft-cosmetics-pbe-marker";
      marker.textContent = "PBE";
      const tooltip = createTooltip(marker, text.pbeNew);
      tooltip.setAttribute("aria-label", text.pbeNew);
      media.append(tooltip);
    }

    const detailList = doc.createElement("dl");
    detailList.className = "tft-cosmetic-card-popover";
    const detail = (label: string, value: string) => {
      const row = doc.createElement("div");
      row.className = "tft-cosmetic-card-detail";
      const term = doc.createElement("dt");
      term.textContent = label;
      const description = doc.createElement("dd");
      description.textContent = value;
      row.append(term, description);
      detailList.append(row);
    };
    const stars = item.level === undefined ? undefined : text.stars(item.level);
    detail(text.name, item.name);
    if (stars !== undefined) detail(text.starLevel, stars);
    detail(text.rarity, rarityLabel);
    appendTftFeatureDetail(detailList, text.features, item.featureTags);
    popoverCleanups.push(bindTftCardDetails(media, text.details, detailList));

    const body = doc.createElement("div");
    body.className = "tft-cosmetic-card-details";
    const heading = doc.createElement("h2");
    const title = doc.createElement("span");
    title.className = "tft-cosmetic-card-title-text";
    title.textContent = item.name;
    const titleTooltip = createTooltip(title, item.name);
    titleTooltip.classList.add("tft-cosmetic-card-title-tooltip");
    titleTooltip.dataset.overflowOnly = "true";
    titleTooltip.setAttribute("aria-label", item.name);
    heading.append(titleTooltip);
    if (stars !== undefined) {
      const starLabel = doc.createElement("span");
      starLabel.className = "tft-cosmetics-card-stars";
      starLabel.textContent = stars;
      heading.append(starLabel);
    }
    body.append(heading);

    const rarityIcon = doc.createElement("img");
    rarityIcon.className = "tft-cosmetic-tier-icon";
    rarityIcon.src = tftCosmeticTierIconUrl(item.TFTRarity, state.channel);
    rarityIcon.alt = "";
    rarityIcon.setAttribute("aria-hidden", "true");
    const rarityTooltip = createTooltip(rarityIcon, rarityLabel);
    rarityTooltip.classList.add("tft-cosmetic-tier-tooltip");
    rarityTooltip.setAttribute("aria-label", rarityLabel);
    article.append(media, rarityTooltip, body);
    grid.append(article);
  };

  const renderMatches = (reset: boolean) => {
    matches = filterTftCosmetics(items, {
      ...state,
      featureTypes: selectedFeatures(),
      onlyPbeAdditions: state.channel === "pbe" && canComparePbe && state.onlyPbeAdditions,
    }, locale);
    const nextBatchSize = getCosmeticBatchSize(grid);
    if (reset) {
      batchSize = nextBatchSize;
      shownCount = Math.min(matches.length, batchSize);
    } else if (batchSize !== nextBatchSize) {
      const pagesShown = Math.ceil(shownCount / batchSize);
      const allShown = shownCount >= matches.length;
      batchSize = nextBatchSize;
      shownCount = allShown ? matches.length : Math.min(matches.length, pagesShown * batchSize);
    }
    clearPopovers();
    grid.replaceChildren();
    matches.slice(0, shownCount).forEach(appendCard);
    resultCount.textContent = text.results(matches.length);
    loadMoreFooter.hidden = shownCount >= matches.length;
    if (matches.length === 0) {
      const fragment = emptyTemplate.content.cloneNode(true) as DocumentFragment;
      const description = fragment.querySelector<HTMLElement>(".ant-empty-description");
      if (!description) throw new Error("TFT cosmetics empty template is incomplete");
      description.textContent = items.length === 0 ? text.empty : text.noMatches;
      grid.append(fragment);
    }
  };

  const updateFilters = (
    patch: Partial<Pick<TftCosmeticUrlState, "TFTRarity" | "level" | "sort" | "onlyPbeAdditions" | "featureTypes">>,
  ) => {
    cancelSearch();
    state = { ...state, ...patch, search: search.value, featureTypes: patch.featureTypes ?? selectedFeatures(), invalid: [] };
    const url = formatTftCosmeticUrl(history.url, state);
    if (url.href !== history.url.href) history.push(url);
    state = readTftCosmeticUrlState(url);
    syncControls();
    renderMatches(true);
    status.textContent = "";
  };

  const cancelSearch = bindDebouncedSearch(search, () => updateFilters({}));
  grid.id = "tft-cosmetics-grid-" + catalog;

  const lifecycle = new RuntimeChannelLifecycle({
    history,
    parse(url) {
      cancelSearch();
      const target = readTftCosmeticUrlState(url);
      return { status: "valid", channel: target.channel, target };
    },
    async load(target, signal): Promise<TftCosmeticLoadResult> {
      const aliasLocale = locale === "zh_cn" ? "default" : "zh_cn";
      const optional = <T>(request: Promise<T>) => request.catch((error: unknown) => {
        if (signal.aborted) throw error;
        return undefined;
      });
      const [selectedItems, aliasItems, features, liveItems] = await Promise.all([
        listCosmetics.call(runtime, catalog, { locale, channel: target.channel, signal }),
        optional(listCosmetics.call(runtime, catalog, { locale: aliasLocale, channel: target.channel, signal })),
        optional(listFeatureTags.call(runtime, catalog, { locale, channel: target.channel, signal })),
        target.channel === "pbe"
          ? optional(listCosmetics.call(runtime, catalog, { locale, channel: "latest", signal }))
          : Promise.resolve(undefined),
      ]);
      let searchable = withTftCosmeticFeatureTags(selectedItems, features ?? new Map());
      if (aliasItems) searchable = addTftCosmeticSearchAliases(searchable, aliasItems);
      const compared = target.channel === "pbe" && liveItems
        ? markPbeTftCosmeticAdditions(searchable, liveItems)
        : searchable;
      return {
        items: compared,
        aliasesAvailable: aliasItems !== undefined,
        featuresAvailable: features !== undefined,
        canComparePbe: target.channel === "pbe" && liveItems !== undefined,
      };
    },
    normalizeError: (error) => asCommunityDragonError(error, locale),
    isAborted: (error) => error.code === "aborted",
    view: {
      loading(preserveContent, context) {
        pendingChannel = context.channel;
        errorMessage?.remove();
        errorMessage = undefined;
        setSpinning(preserveContent);
        root.setAttribute("aria-busy", "true");
        setControlsDisabled(true);
        status.textContent = "";
        if (!preserveContent) {
          if (loadingSkeleton) content.replaceChildren(loadingSkeleton.cloneNode(true));
          filterSkeleton.hidden = false;
          filters.hidden = true;
          results.hidden = true;
          content.hidden = false;
        }
      },
      render(result, context) {
        pendingChannel = undefined;
        errorMessage?.remove();
        errorMessage = undefined;
        setSpinning(false);
        const invalid = [...context.target.invalid];
        const rarityValue = context.target.TFTRarity && result.items.some((item) => item.TFTRarity === context.target.TFTRarity)
          ? context.target.TFTRarity
          : undefined;
        const levelValue = level && result.items.some((item) => item.level === context.target.level)
          ? context.target.level
          : undefined;
        if (context.target.level !== undefined && levelValue === undefined) invalid.push("level");
        const availableFeatures = new Set(result.items.flatMap((item) => item.featureTags.map(({ featureType }) => featureType)));
        const selectedFeatureTypes = context.target.featureTypes.filter((featureType) => availableFeatures.has(featureType));
        if (context.target.TFTRarity && rarityValue === undefined) invalid.push("TFTRarity");
        if (context.target.featureTypes.some((featureType) => !availableFeatures.has(featureType))) invalid.push("featureType");
        state = {
          ...context.target,
          TFTRarity: rarityValue,
          level: levelValue,
          featureTypes: selectedFeatureTypes,
          channel: context.channel,
          invalid: [...new Set(invalid)],
        };
        items = result.items;
        canComparePbe = result.canComparePbe;
        count.textContent = text.total(items.length);
        renderOptions();
        search.value = state.search;
        syncControls();
        pbeSetting.hidden = !canComparePbe;
        compareNotice.hidden = context.channel !== "pbe" || canComparePbe;
        aliasNotice.hidden = result.aliasesAvailable;
        if (!result.featuresAvailable) status.textContent = text.featuresUnavailable;
        filterSkeleton.hidden = true;
        filters.hidden = items.length === 0;
        content.hidden = true;
        results.hidden = false;
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
        if (state.invalid.length) status.textContent = text.invalid;
        renderMatches(true);
      },
      committed(context) {
        const canonical = formatTftCosmeticUrl(context.url, state);
        if (canonical.href !== context.url.href) history.replace(canonical);
      },
      invalid(message) {
        pendingChannel = undefined;
        setSpinning(false);
        status.textContent = message;
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
      },
      failure(error, retry, preserveContent) {
        pendingChannel = undefined;
        setSpinning(false);
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
        status.textContent = "";
        const fragment = errorTemplate.content.cloneNode(true) as DocumentFragment;
        const button = fragment.querySelector<HTMLButtonElement>("[data-cosmetics-retry]");
        const wrapper = fragment.firstElementChild as HTMLElement | null;
        if (!button || !wrapper) throw new Error("TFT cosmetics error template is incomplete");
        const description = wrapper.querySelector<HTMLElement>("[data-cosmetics-error-message]");
        if (description) description.textContent = runtimeFailureMessage(error, locale);
        button.addEventListener("click", retry, { once: true });
        errorMessage = wrapper;
        if (preserveContent) results.before(wrapper);
        else {
          filterSkeleton.hidden = true;
          filters.hidden = true;
          results.hidden = true;
          content.hidden = false;
          content.replaceChildren(wrapper);
        }
      },
    },
  });

  rarity.addEventListener("change", () => updateFilters({
    TFTRarity: rarity.value && isTftCosmeticTier(rarity.value) ? rarity.value : undefined,
  }));
  level?.addEventListener("change", () => updateFilters({ level: level.value ? Number(level.value) : undefined }));
  sort.addEventListener("change", () => {
    if (isTftCosmeticSort(sort.value)) updateFilters({ sort: sort.value as TftCosmeticSort });
  });
  pbeOnly.addEventListener("change", () => updateFilters({ onlyPbeAdditions: pbeOnly.checked }));
  loadMore.addEventListener("click", () => {
    shownCount = Math.min(matches.length, shownCount + batchSize);
    renderMatches(false);
  });
  aliasRetry.addEventListener("click", () => { void lifecycle.navigate(history.url); });
  compareRetry.addEventListener("click", () => { void lifecycle.navigate(history.url); });
  root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      const channel = button.dataset.runtimeChannel;
      if ((channel !== "pbe" && channel !== "latest") || channel === (pendingChannel ?? state.channel)) return;
      void lifecycle.navigate(formatTftCosmeticUrl(history.url, {
        ...state,
        search: search.value,
        channel,
        channelExplicit: true,
        featureTypes: selectedFeatures(),
      }));
    });
  });
  window.addEventListener("resize", () => {
    if (!results.hidden && matches.length && getCosmeticBatchSize(grid) !== batchSize)
      renderMatches(false);
  });
  void lifecycle.start();
  return lifecycle;
}
