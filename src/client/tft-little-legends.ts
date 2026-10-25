import {
  addTftCompanionSearchAliases,
  filterTftCompanions,
  getMultiStarTftCompanionItemIds,
  isTftCompanionType,
  isTftCompanionRarity,
  isTftCompanionSort,
  markPbeTftCompanionAdditions,
  TFT_COMPANION_RARITY_ORDER,
  TFT_COMPANION_BATCH_SIZE,
  tftCompanionPageSize,
  TFT_COMPANION_TYPE_ORDER,
  paginateTftCompanions,
  type TftCompanion,
  type TftCompanionRarity,
} from "../domain/little-legends";
import {
  formatLittleLegendUrl,
  readLittleLegendUrlState,
  type LittleLegendUrlState,
} from "../domain/little-legends-url";
import {
  communityDragonAssetUrl,
  communityDragonChannelLabel,
} from "../domain/communitydragon-url";
import type {
  CommunityDragonLocale,
  RuntimeChannel,
} from "../domain/communitydragon-runtime";
import { setDomainIconTooltip } from "../components/domain-icons";
import { createPopover } from "../components/popover";
import { createRadioButtonGroup } from "../components/RadioButtonGroup";
import { createTooltip } from "../components/tooltip";
import { enhanceSelect, refreshSelect } from "../components/select";
import { createIcon } from "../components/icons/create-icon";
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
    empty: "当前资料版本没有可展示的小小英雄。",
    noMatches: "没有符合条件的小小英雄。",
    invalid: "链接中的无效筛选已清除。",
    total: (count: number) => `共 ${count} 个小小英雄资料项`,
    results: (count: number) => `找到 ${count} 个结果`,
    missingImage: "图片暂不可用",
    pbeOnlyHelp: "只显示相较正式服新增的小小英雄。",
    pbeNew: "PBE 新增小小英雄",
    displayMode: "显示方式",
    cards: "卡片",
    groupBySpecies: "按种类分组",
    details: "小小英雄详情",
    name: "名称",
    category: "类别",
    species: "种类",
    starLevel: "星级",
    rarity: "稀有度",
  },
  default: {
    empty: "No Tacticians are available in this data channel.",
    noMatches: "No Tacticians match these filters.",
    invalid: "Invalid filter values in this link were cleared.",
    total: (count: number) => `${count} Tactician cosmetics in this data channel`,
    results: (count: number) => `Found ${count} matches`,
    missingImage: "Artwork unavailable",
    pbeOnlyHelp: "Show only Tacticians newly added on PBE compared with live.",
    pbeNew: "PBE addition",
    displayMode: "Display mode",
    cards: "Cards",
    groupBySpecies: "By species",
    details: "Tactician details",
    name: "Name",
    category: "Category",
    species: "Species",
    starLevel: "Stars",
    rarity: "Rarity",
  },
} as const;

const rarityLabels = {
  zh_cn: {
    kStandard: "经典",
    kLegendary: "传说",
    kMythic: "神话",
    kPrestige: "至臻",
  },
  default: {
    kStandard: "Standard",
    kLegendary: "Legendary",
    kMythic: "Mythic",
    kPrestige: "Prestige",
  },
} as const;

const rarityIconPaths: Record<TftCompanionRarity, string> = {
  kStandard: "game/assets/ux/tft/outofgame/raritygems/tft_standardgem_top.png",
  kLegendary: "game/assets/ux/tft/outofgame/raritygems/tft_legendarygem_top.png",
  kMythic: "game/assets/ux/tft/outofgame/raritygems/tft_mythicgem_top.png",
  kPrestige: "game/assets/ux/tft/outofgame/raritygems/tft_prestigegem_top.png",
};

const companionTypeLabels = {
  zh_cn: {
    kLittleLegend: "小小英雄",
    kChibi: "英雄级小小英雄",
    kStyle2: "不朽弈士形象",
  },
  default: {
    kLittleLegend: "Little Legends",
    kChibi: "Chibis",
    kStyle2: "Unbound",
  },
} as const;

export function tftCompanionRarityLabel(
  rarity: TftCompanionRarity,
  locale: CommunityDragonLocale,
): string {
  return rarityLabels[locale][rarity];
}

export function tftCompanionRarityIconUrl(
  rarity: TftCompanionRarity,
  channel: RuntimeChannel,
): string {
  return communityDragonAssetUrl(rarityIconPaths[rarity], channel);
}

export function tftCompanionTypeLabel(
  companionType: TftCompanion["companionType"],
  locale: CommunityDragonLocale,
): string {
  return companionTypeLabels[locale][companionType];
}

export function tftCompanionDisplayName(
  item: Pick<TftCompanion, "name" | "level">,
  hasMultipleStarLevels: boolean,
  locale: CommunityDragonLocale,
): string {
  if (!hasMultipleStarLevels) return item.name;
  if (locale === "zh_cn") return `${item.name} ${item.level}星`;
  return `${item.name} ${item.level} ${item.level === 1 ? "star" : "stars"}`;
}

type TftLittleLegendState = LittleLegendUrlState;
type TftLittleLegendView = "cards" | "species";
type TftLittleLegendError = ReturnType<typeof asCommunityDragonError>;
interface TftCompanionLoadResult {
  readonly items: readonly TftCompanion[];
  readonly canComparePbe: boolean;
}

function element<T extends HTMLElement>(
  root: HTMLElement,
  selector: string,
): T {
  const match = root.querySelector<T>(selector);
  if (!match) throw new Error(`Little Legends page is missing ${selector}`);
  return match;
}

export function initTftLittleLegends(
  root: HTMLElement,
  runtime: CommunityDragonRuntime = createCommunityDragonRuntime(),
  history: RuntimeChannelHistory = browserHistory(),
): RuntimeChannelLifecycle<
  TftLittleLegendState,
  TftCompanionLoadResult,
  TftLittleLegendError
> {
  const locale = root.dataset.littleLegendsLocale as CommunityDragonLocale;
  if (locale !== "default" && locale !== "zh_cn")
    throw new Error("Little Legends locale is invalid");
  const text = copy[locale];
  const filters = element<HTMLElement>(root, "[data-little-legends-filters]");
  const filterSkeleton = element<HTMLElement>(
    root,
    "[data-little-legends-filter-skeleton]",
  );
  const search = element<HTMLInputElement>(
    root,
    "[data-little-legends-search]",
  );
  const species = element<HTMLSelectElement>(
    root,
    "[data-little-legends-species]",
  );
  const companionType = element<HTMLSelectElement>(
    root,
    "[data-little-legends-type]",
  );
  const rarity = element<HTMLSelectElement>(
    root,
    "[data-little-legends-rarity]",
  );
  const level = element<HTMLSelectElement>(root, "[data-little-legends-level]");
  const sort = element<HTMLSelectElement>(root, "[data-little-legends-sort]");
  const pbeOnly = element<HTMLInputElement>(
    root,
    "[data-little-legends-pbe-only]",
  );
  const pbeSetting = element<HTMLElement>(
    root,
    "[data-little-legends-pbe-setting]",
  );
  const pbeSettingParent = pbeSetting.parentElement;
  const pbeSettingNextSibling = pbeSetting.nextSibling;
  const pbeSettingTooltip = createTooltip(pbeSetting, text.pbeOnlyHelp);
  pbeSettingTooltip.classList.add("tft-little-legends-pbe-tooltip");
  pbeSettingTooltip.tabIndex = -1;
  const pbeSettingTooltipId =
    pbeSettingTooltip.getAttribute("aria-describedby");
  if (pbeSettingTooltipId)
    pbeOnly.setAttribute("aria-describedby", pbeSettingTooltipId);
  if (pbeSettingParent)
    pbeSettingParent.insertBefore(pbeSettingTooltip, pbeSettingNextSibling);
  const popoverCleanups: (() => void)[] = [];
  const clearPopovers = () => {
    for (const cleanup of popoverCleanups) cleanup();
    popoverCleanups.length = 0;
  };
  [companionType, species, rarity, level, sort].forEach(enhanceSelect);
  const status = element<HTMLElement>(root, "[data-little-legends-status]");
  const spinner = element<HTMLElement>(root, "[data-runtime-spin]");
  const content = element<HTMLElement>(root, "[data-little-legends-content]");
  const loadingSkeleton = content.firstElementChild?.cloneNode(true);
  const results = element<HTMLElement>(root, "[data-little-legends-results]");
  const grid = element<HTMLElement>(root, "[data-little-legends-grid]");
  const count = element<HTMLElement>(root, "[data-little-legends-count]");
  const resultCount = element<HTMLElement>(
    root,
    "[data-little-legends-result-count]",
  );
  const viewSwitcher = element<HTMLElement>(
    root,
    "[data-little-legends-view-switch]",
  );
  const loadMoreFooter = element<HTMLElement>(
    root,
    "[data-little-legends-load-more-footer]",
  );
  const loadMore = element<HTMLButtonElement>(
    root,
    "[data-little-legends-load-more]",
  );
  const setSpinning = (spinning: boolean) => {
    spinner.dataset.spinning = String(spinning);
    spinner.classList.toggle("ant-spin-spinning", spinning);
    spinner.setAttribute("aria-busy", String(spinning));
  };
  const emptyTemplate = element<HTMLTemplateElement>(
    root,
    "[data-little-legends-empty-template]",
  );
  const errorTemplate = element<HTMLTemplateElement>(
    root,
    "[data-little-legends-error-template]",
  );
  const channelLabel = element<HTMLElement>(
    root,
    "[data-runtime-channel-label]",
  );
  let state = readLittleLegendUrlState(history.url);
  let items: readonly TftCompanion[] = [];
  let multiStarItemIds: ReadonlySet<number> = new Set();
  let canComparePbe = false;
  let matches: readonly TftCompanion[] = [];
  let view: TftLittleLegendView = "cards";
  let shownCount = 0;
  let batchSize = TFT_COMPANION_BATCH_SIZE;
  let errorMessage: HTMLElement | undefined;
  let pendingChannel: RuntimeChannel | undefined;

  const setControlsDisabled = (disabled: boolean) => {
    search.disabled = disabled;
    companionType.disabled = disabled;
    species.disabled = disabled;
    rarity.disabled = disabled;
    level.disabled = disabled;
    sort.disabled = disabled;
    pbeOnly.disabled = disabled;
    loadMore.disabled = disabled;
    viewSwitcher.querySelectorAll<HTMLInputElement>("input").forEach((input) => {
      input.disabled = disabled;
    });
  };

  const getBatchSize = () => {
    const columns = getComputedStyle(grid).gridTemplateColumns
      .trim()
      .split(/\s+/).length;
    return tftCompanionPageSize(columns);
  };

  const syncControls = () => {
    search.value = state.search;
    companionType.value = state.companionType ?? "";
    species.value =
      state.speciesId === undefined ? "" : String(state.speciesId);
    rarity.value = state.TFTRarity ?? "";
    level.value = state.level === undefined ? "" : String(state.level);
    pbeOnly.checked = state.onlyPbeAdditions;
    sort.value = state.sort;
    [companionType, species, rarity, level, sort].forEach(refreshSelect);
    root
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        button.setAttribute(
          "aria-checked",
          String(button.dataset.runtimeChannel === state.channel),
        );
      });
    const label = communityDragonChannelLabel(state.channel, locale);
    channelLabel.textContent = label;
    const icon = root.querySelector<SVGSVGElement>(".domain-icon--reference");
    if (icon)
      setDomainIconTooltip(
        icon,
        "reference",
        label,
        locale === "zh_cn" ? "zh-cn" : "en",
      );
  };

  const addSelectOptions = (
    select: HTMLSelectElement,
    options: readonly [string, string][],
  ) => {
    const placeholder = select.firstElementChild?.cloneNode(true);
    if (!placeholder)
      throw new Error("Little Legends filter is missing its all option");
    select.replaceChildren(placeholder);
    for (const [value, label] of options) {
      const option = root.ownerDocument.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  };

  const renderOptions = () => {
    const companionTypes = new Set<TftCompanion["companionType"]>();
    const speciesNames = new Map<number, string>();
    const rarities = new Set<TftCompanionRarity>();
    const levels = new Set<number>();
    for (const item of items) {
      companionTypes.add(item.companionType);
      speciesNames.set(item.speciesId, item.speciesName);
      rarities.add(item.TFTRarity);
      levels.add(item.level);
    }
    addSelectOptions(
      companionType,
      TFT_COMPANION_TYPE_ORDER.filter((value) =>
        companionTypes.has(value),
      )
        .map((value) => [value, tftCompanionTypeLabel(value, locale)]),
    );
    addSelectOptions(
      species,
      [...speciesNames]
        .sort(([, left], [, right]) =>
          left.localeCompare(right, locale === "zh_cn" ? "zh-CN" : "en"),
        )
        .map(([id, name]) => [String(id), name]),
    );
    addSelectOptions(
      rarity,
      TFT_COMPANION_RARITY_ORDER.filter((value) =>
        rarities.has(value),
      )
        .map((value) => [value, tftCompanionRarityLabel(value, locale)]),
    );
    addSelectOptions(
      level,
      [...levels]
        .sort((left, right) => left - right)
        .map((value) => [String(value), String(value)]),
    );
  };

  const appendCard = (
    item: TftCompanion,
    target: HTMLElement = grid,
    grouped = false,
  ) => {
    const displayName = tftCompanionDisplayName(
      item,
      multiStarItemIds.has(item.itemId),
      locale,
    );
    const rarityLabel = tftCompanionRarityLabel(item.TFTRarity, locale);
    const article = root.ownerDocument.createElement("article");
    article.className = "runtime-card tft-little-legends-card";
    const media = root.ownerDocument.createElement("div");
    media.className = "tft-little-legends-card-media";
    const preview = root.ownerDocument.createElement("button");
    preview.className = "runtime-media-preview-trigger tft-little-legends-card-preview";
    preview.type = "button";
    preview.dataset.mediaPreviewTrigger = "";
    preview.dataset.previewKind = "image";
    preview.dataset.previewSrc = item.imageUrl;
    preview.setAttribute(
      "aria-label",
      locale === "zh_cn"
        ? `查看${displayName}大图`
        : `Open full-size image: ${displayName}`,
    );
    const image = root.ownerDocument.createElement("img");
    image.src = item.imageUrl;
    image.alt = displayName;
    image.loading = "lazy";
    image.decoding = "async";
    const fallback = root.ownerDocument.createElement("span");
    fallback.className = "tft-little-legends-card-image-fallback";
    fallback.textContent = text.missingImage;
    fallback.hidden = true;
    image.addEventListener(
      "error",
      () => {
        preview.hidden = true;
        fallback.hidden = false;
      },
      { once: true },
    );
    const previewCover = root.ownerDocument.createElement("span");
    previewCover.className = "tft-little-legends-preview-cover";
    previewCover.setAttribute("aria-hidden", "true");
    previewCover.append(createIcon("EyeOutlined"));
    preview.append(image, previewCover);
    media.append(preview, fallback);
    if (state.channel === "pbe" && item.isPbeAddition) {
      const marker = root.ownerDocument.createElement("span");
      marker.textContent = "PBE";
      marker.setAttribute("aria-hidden", "true");
      const tooltip = createTooltip(marker, text.pbeNew);
      tooltip.classList.add("tft-little-legends-pbe-marker");
      tooltip.setAttribute("aria-label", text.pbeNew);
      media.append(tooltip);
    }
    const actions = root.ownerDocument.createElement("div");
    actions.className = "tft-little-legends-card-actions";
    const detailsButton = root.ownerDocument.createElement("button");
    detailsButton.className = "ant-btn ant-btn-sm ant-btn-icon-only tft-little-legends-info-button";
    detailsButton.type = "button";
    detailsButton.setAttribute("aria-label", text.details);
    const detailsIcon = createIcon("InfoCircleOutlined");
    detailsIcon.setAttribute("width", "14");
    detailsIcon.setAttribute("height", "14");
    detailsButton.append(detailsIcon);
    const popoverDetails = root.ownerDocument.createElement("dl");
    popoverDetails.className = "tft-little-legends-card-popover";
    const appendDetail = (label: string, value: string) => {
      const row = root.ownerDocument.createElement("div");
      row.className = "tft-little-legends-card-detail";
      const term = root.ownerDocument.createElement("dt");
      term.textContent = label;
      const description = root.ownerDocument.createElement("dd");
      description.textContent = value;
      row.append(term, description);
      popoverDetails.append(row);
    };
    appendDetail(text.name, displayName);
    appendDetail(text.category, tftCompanionTypeLabel(item.companionType, locale));
    appendDetail(text.species, item.speciesName);
    appendDetail(text.starLevel, String(item.level));
    appendDetail(text.rarity, rarityLabel);
    popoverCleanups.push(createPopover(detailsButton, text.details, popoverDetails));
    actions.append(detailsButton);
    media.append(actions);
    const details = root.ownerDocument.createElement("div");
    details.className = "tft-little-legends-card-details";
    const title = root.ownerDocument.createElement(grouped ? "h3" : "h2");
    title.className = "tft-little-legends-card-title";
    const rarityIcon = root.ownerDocument.createElement("img");
    rarityIcon.className = "tft-little-legends-card-rarity-icon";
    rarityIcon.src = tftCompanionRarityIconUrl(item.TFTRarity, state.channel);
    rarityIcon.alt = "";
    rarityIcon.setAttribute("aria-hidden", "true");
    const rarityTooltip = createTooltip(rarityIcon, rarityLabel);
    rarityTooltip.classList.add("tft-little-legends-card-rarity-tooltip");
    rarityTooltip.setAttribute("aria-label", rarityLabel);
    const titleText = root.ownerDocument.createElement("span");
    titleText.className = "tft-little-legends-card-title-text";
    titleText.textContent = displayName;
    const titleTooltipLabel = displayName;
    const titleTooltip = createTooltip(titleText, titleTooltipLabel);
    titleTooltip.classList.add("tft-little-legends-card-title-tooltip");
    titleTooltip.setAttribute("aria-label", titleTooltipLabel);
    title.append(titleTooltip);
    details.append(title);
    article.append(media, rarityTooltip, details);
    target.append(article);
  };

  const renderMatches = (reset: boolean) => {
    matches = filterTftCompanions(
      items,
      {
        ...state,
        onlyPbeAdditions:
          state.channel === "pbe" && canComparePbe && state.onlyPbeAdditions,
      },
      locale,
    );
    viewSwitcher.hidden = matches.length === 0;
    const nextBatchSize = getBatchSize();
    if (reset) {
      batchSize = nextBatchSize;
      shownCount = Math.min(matches.length, batchSize);
    } else if (batchSize !== nextBatchSize) {
      const pageCount = Math.ceil(shownCount / batchSize);
      const allMatchesShown = shownCount >= matches.length;
      batchSize = nextBatchSize;
      shownCount = allMatchesShown
        ? matches.length
        : Math.min(matches.length, pageCount * batchSize);
    }
    clearPopovers();
    grid.replaceChildren();
    if (view === "cards") {
      const pageCount = Math.ceil(shownCount / batchSize);
      for (let page = 0; page < pageCount; page += 1) {
        for (const item of paginateTftCompanions(matches, page, batchSize))
          appendCard(item);
      }
    } else {
      const groups = new Map<number, { name: string; items: TftCompanion[] }>();
      for (const item of matches) {
        const group = groups.get(item.speciesId) ?? {
          name: item.speciesName,
          items: [],
        };
        group.items.push(item);
        groups.set(item.speciesId, group);
      }
      let remaining = shownCount;
      for (const [speciesId, group] of groups) {
        if (remaining <= 0) break;
        const visibleItems = group.items.slice(0, remaining);
        const section = root.ownerDocument.createElement("section");
        section.className = "tft-little-legends-species-group";
        const heading = root.ownerDocument.createElement("h2");
        heading.id = `tft-little-legends-species-${speciesId}`;
        heading.textContent = group.name;
        section.setAttribute("aria-labelledby", heading.id);
        const groupGrid = root.ownerDocument.createElement("div");
        groupGrid.className = "tft-little-legends-grid";
        section.append(heading, groupGrid);
        grid.append(section);
        visibleItems.forEach((item) => appendCard(item, groupGrid, true));
        remaining -= visibleItems.length;
      }
    }
    resultCount.textContent = text.results(matches.length);
    loadMoreFooter.hidden = shownCount >= matches.length;
    if (matches.length === 0) {
      const fragment = emptyTemplate.content.cloneNode(
        true,
      ) as DocumentFragment;
      const description = fragment.querySelector<HTMLElement>(
        ".ant-empty-description",
      );
      if (!description)
        throw new Error(
          "Little Legends empty template is missing its description",
        );
      description.textContent =
        items.length === 0 ? text.empty : text.noMatches;
      grid.append(fragment);
    }
  };

  viewSwitcher.replaceChildren(
    createRadioButtonGroup({
      name: "tft-little-legends-view",
      idPrefix: "tft-little-legends-view",
      value: "cards",
      ariaLabel: text.displayMode,
      options: [
        {
          label: text.cards,
          value: "cards",
          controls: "little-legends-grid",
        },
        {
          label: text.groupBySpecies,
          value: "species",
          controls: "little-legends-grid",
        },
      ],
      onChange(value) {
        view = value === "species" ? "species" : "cards";
        renderMatches(true);
      },
    }),
  );

  window.addEventListener("resize", () => {
    if (
      !results.hidden &&
      matches.length > 0 &&
      getBatchSize() !== batchSize
    )
      renderMatches(false);
  });

  const updateFilters = (
    patch: Partial<
      Pick<
        TftLittleLegendState,
        | "search"
        | "companionType"
        | "speciesId"
        | "TFTRarity"
        | "level"
        | "sort"
        | "onlyPbeAdditions"
      >
    >,
  ) => {
    state = { ...state, ...patch, invalid: [] };
    const url = formatLittleLegendUrl(history.url, state);
    if (url.href !== history.url.href) history.push(url);
    state = readLittleLegendUrlState(url);
    syncControls();
    renderMatches(true);
    status.textContent = "";
  };

  const lifecycle = new RuntimeChannelLifecycle({
    history,
    parse(url) {
      const target = readLittleLegendUrlState(url);
      return { status: "valid", channel: target.channel, target };
    },
    async load(target, signal): Promise<TftCompanionLoadResult> {
      const aliasLocale = locale === "zh_cn" ? "default" : "zh_cn";
      const [selectedItems, aliasItems, liveItems] = await Promise.all([
        runtime.listTftCompanions({ locale, channel: target.channel, signal }),
        runtime
          .listTftCompanions({
            locale: aliasLocale,
            channel: target.channel,
            signal,
          })
          .catch((error: unknown) => {
            if (signal.aborted) throw error;
            return undefined;
          }),
        target.channel === "pbe"
          ? runtime
              .listTftCompanions({ locale, channel: "latest", signal })
              .catch((error: unknown) => {
                if (signal.aborted) throw error;
                return undefined;
              })
          : Promise.resolve(undefined),
      ]);
      const searchableItems = addTftCompanionSearchAliases(
        selectedItems,
        aliasItems ?? [],
      );
      return {
        items:
          target.channel === "pbe" && liveItems
            ? markPbeTftCompanionAdditions(searchableItems, liveItems)
            : searchableItems,
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
          if (loadingSkeleton)
            content.replaceChildren(loadingSkeleton.cloneNode(true));
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
        items = result.items;
        multiStarItemIds = getMultiStarTftCompanionItemIds(items);
        canComparePbe = result.canComparePbe;
        const invalid = [...context.target.invalid];
        const selectedCompanionType =
          context.target.companionType !== undefined &&
          items.some(
            (item) => item.companionType === context.target.companionType,
          )
            ? context.target.companionType
            : undefined;
        const speciesId =
          context.target.speciesId !== undefined &&
          items.some((item) => item.speciesId === context.target.speciesId)
            ? context.target.speciesId
            : undefined;
        const TFTRarity =
          context.target.TFTRarity &&
          items.some((item) => item.TFTRarity === context.target.TFTRarity)
            ? context.target.TFTRarity
            : undefined;
        const selectedLevel =
          context.target.level !== undefined &&
          items.some((item) => item.level === context.target.level)
            ? context.target.level
            : undefined;
        if (context.target.speciesId !== undefined && speciesId === undefined)
          invalid.push("speciesId");
        if (
          context.target.companionType !== undefined &&
          selectedCompanionType === undefined
        )
          invalid.push("companionType");
        if (context.target.TFTRarity !== undefined && TFTRarity === undefined)
          invalid.push("TFTRarity");
        if (context.target.level !== undefined && selectedLevel === undefined)
          invalid.push("level");
        state = {
          ...context.target,
          ...(selectedCompanionType === undefined
            ? { companionType: undefined }
            : { companionType: selectedCompanionType }),
          ...(speciesId === undefined
            ? { speciesId: undefined }
            : { speciesId }),
          ...(TFTRarity === undefined
            ? { TFTRarity: undefined }
            : { TFTRarity }),
          ...(selectedLevel === undefined
            ? { level: undefined }
            : { level: selectedLevel }),
          channel: context.channel,
          invalid: [...new Set(invalid)],
        };
        count.textContent = text.total(items.length);
        renderOptions();
        syncControls();
        pbeSettingTooltip.hidden = !canComparePbe || context.channel !== "pbe";
        filterSkeleton.hidden = true;
        filters.hidden = items.length === 0;
        content.hidden = true;
        results.hidden = false;
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
        status.textContent = state.invalid.length ? text.invalid : "";
        renderMatches(true);
      },
      committed(context) {
        const canonical = formatLittleLegendUrl(context.url, state);
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
        const fragment = errorTemplate.content.cloneNode(
          true,
        ) as DocumentFragment;
        const message = fragment.querySelector<HTMLElement>(
          "[data-little-legends-error-message]",
        );
        const button = fragment.querySelector<HTMLButtonElement>(
          "[data-little-legends-retry]",
        );
        const wrapper = fragment.firstElementChild as HTMLElement | null;
        if (!message || !button || !wrapper)
          throw new Error("Little Legends error template is incomplete");
        message.textContent = runtimeFailureMessage(error, locale);
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

  search.addEventListener("input", () =>
    updateFilters({ search: search.value }),
  );
  companionType.addEventListener("change", () =>
    updateFilters({
      companionType:
        companionType.value && isTftCompanionType(companionType.value)
          ? companionType.value
          : undefined,
    }),
  );
  species.addEventListener("change", () =>
    updateFilters({
      speciesId: species.value ? Number(species.value) : undefined,
    }),
  );
  rarity.addEventListener("change", () =>
    updateFilters({
      TFTRarity:
        rarity.value && isTftCompanionRarity(rarity.value)
          ? rarity.value
          : undefined,
    }),
  );
  level.addEventListener("change", () =>
    updateFilters({ level: level.value ? Number(level.value) : undefined }),
  );
  sort.addEventListener("change", () => {
    if (isTftCompanionSort(sort.value)) updateFilters({ sort: sort.value });
  });
  pbeOnly.addEventListener("change", () =>
    updateFilters({ onlyPbeAdditions: pbeOnly.checked }),
  );
  loadMore.addEventListener("click", () => {
    shownCount = Math.min(matches.length, shownCount + batchSize);
    renderMatches(false);
  });
  root
    .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const channel = button.dataset.runtimeChannel;
        if (
          (channel !== "pbe" && channel !== "latest") ||
          channel === (pendingChannel ?? state.channel)
        )
          return;
        void lifecycle.navigate(
          formatLittleLegendUrl(history.url, {
            ...state,
            channel,
            channelExplicit: true,
          }),
        );
      });
    });

  void lifecycle.start();
  return lifecycle;
}
