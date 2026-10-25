import {
  addTftArenaSearchAliases,
  filterTftArenas,
  isTftArenaRarity,
  isTftArenaSort,
  markPbeTftArenaAdditions,
  TFT_ARENA_RARITY_ORDER,
  type TftArena,
} from "../domain/tft-arenas";
import { arenaPageSize, arenaVisibleCount } from "../domain/tft-arenas-page";
import {
  formatTftArenaUrl,
  readTftArenaUrlState,
  type TftArenaUrlState,
} from "../domain/tft-arenas-url";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import type { CommunityDragonLocale, RuntimeChannel } from "../domain/communitydragon-runtime";
import { setDomainIconTooltip } from "../components/domain-icons";
import { tftCosmeticRarityIconUrl, tftCosmeticRarityLabel } from "../components/tft-cosmetic-rarity";
import { createPopover } from "../components/popover";
import { createTooltip } from "../components/tooltip";
import { enhanceSelect, refreshSelect } from "../components/select";
import { createIcon } from "../components/icons/create-icon";
import { createCommunityDragonRuntime, type CommunityDragonRuntime } from "./communitydragon-runtime";
import { asCommunityDragonError, runtimeFailureMessage } from "./communitydragon-errors";
import { RuntimeChannelLifecycle, type RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { browserHistory } from "./runtime-reference-view";

const copy = {
  zh_cn: {
    empty: "当前资料版本没有可展示的棋盘。",
    noMatches: "没有符合条件的棋盘。",
    invalid: "链接中的无效筛选已清除。",
    total: (n: number) => `共 ${n} 个棋盘`,
    results: (n: number) => `找到 ${n} 个结果`,
    missingImage: "图片暂不可用",
    preview: (name: string) => `查看${name}大图`,
    details: "棋盘详情",
    name: "名称",
    group: "分组",
    tier: "等级",
    description: "描述",
    pbeNew: "PBE 新增",
  },
  default: {
    empty: "No Arenas are available in this data channel.",
    noMatches: "No Arenas match these filters.",
    invalid: "Invalid filter values in this link were cleared.",
    total: (n: number) => `${n} Arenas in this data channel`,
    results: (n: number) => `Found ${n} matches`,
    missingImage: "Artwork unavailable",
    preview: (name: string) => `Open full-size image: ${name}`,
    details: "Arena details",
    name: "Name",
    group: "Group",
    tier: "Tier",
    description: "Description",
    pbeNew: "PBE addition",
  },
} as const;

function element<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const found = root.querySelector<T>(selector);
  if (!found) throw new Error(`TFT Arenas page is missing ${selector}`);
  return found;
}

export function initTftArenas(
  root: HTMLElement,
  runtime: CommunityDragonRuntime = createCommunityDragonRuntime(),
  history: RuntimeChannelHistory = browserHistory(),
): RuntimeChannelLifecycle<TftArenaUrlState, readonly TftArena[], ReturnType<typeof asCommunityDragonError>> {
  const locale = root.dataset.arenasLocale as CommunityDragonLocale;
  if (locale !== "default" && locale !== "zh_cn") throw new Error("TFT Arenas locale is invalid");
  const t = copy[locale];
  const filters = element<HTMLElement>(root, "[data-arenas-filters]");
  const filterSkeleton = element<HTMLElement>(root, "[data-arenas-filter-skeleton]");
  const search = element<HTMLInputElement>(root, "[data-arenas-search]");
  const group = element<HTMLSelectElement>(root, "[data-arenas-group]");
  const rarity = element<HTMLSelectElement>(root, "[data-arenas-rarity]");
  const sort = element<HTMLSelectElement>(root, "[data-arenas-sort]");
  const pbeOnly = element<HTMLInputElement>(root, "[data-arenas-pbe-only]");
  const pbeSetting = element<HTMLElement>(root, "[data-arenas-pbe-setting]");
  const status = element<HTMLElement>(root, "[data-arenas-status]");
  const aliasNotice = element<HTMLElement>(root, "[data-arenas-alias-notice]");
  const aliasRetry = element<HTMLButtonElement>(root, "[data-arenas-alias-retry]");
  const compareNotice = element<HTMLElement>(root, "[data-arenas-compare-notice]");
  const compareRetry = element<HTMLButtonElement>(root, "[data-arenas-compare-retry]");
  const spinner = element<HTMLElement>(root, "[data-runtime-spin]");
  const content = element<HTMLElement>(root, "[data-arenas-content]");
  const loadingSkeleton = content.firstElementChild?.cloneNode(true);
  const results = element<HTMLElement>(root, "[data-arenas-results]");
  const grid = element<HTMLElement>(root, "[data-arenas-grid]");
  const count = element<HTMLElement>(root, "[data-arenas-count]");
  const resultCount = element<HTMLElement>(root, "[data-arenas-result-count]");
  const loadMoreFooter = element<HTMLElement>(root, "[data-arenas-load-more-footer]");
  const loadMore = element<HTMLButtonElement>(root, "[data-arenas-load-more]");
  const emptyTemplate = element<HTMLTemplateElement>(root, "[data-arenas-empty-template]");
  const errorTemplate = element<HTMLTemplateElement>(root, "[data-arenas-error-template]");
  const channelLabel = element<HTMLElement>(root, "[data-runtime-channel-label]");
  [group, rarity, sort].forEach(enhanceSelect);

  let state = readTftArenaUrlState(history.url);
  let baseItems: readonly TftArena[] = [];
  let items: readonly TftArena[] = [];
  let matches: readonly TftArena[] = [];
  let aliasItems: readonly TftArena[] | undefined;
  let liveItems: readonly TftArena[] | undefined;
  let loadedRows = 0;
  let columns = 1;
  let allShown = false;
  let pendingChannel: RuntimeChannel | undefined;
  let errorMessage: HTMLElement | undefined;
  const popoverCleanups: (() => void)[] = [];

  const setSpinning = (spinning: boolean) => {
    spinner.dataset.spinning = String(spinning);
    spinner.classList.toggle("ant-spin-spinning", spinning);
    spinner.setAttribute("aria-busy", String(spinning));
  };
  const setControlsDisabled = (disabled: boolean) => {
    for (const control of [search, group, rarity, sort, pbeOnly, loadMore]) control.disabled = disabled;
  };
  const gridColumns = () => {
    const template = getComputedStyle(grid).gridTemplateColumns.trim();
    return Math.max(1, template ? template.split(/\s+/).length : 1);
  };
  const clearPopovers = () => {
    popoverCleanups.forEach((cleanup) => cleanup());
    popoverCleanups.length = 0;
  };
  const syncControls = () => {
    search.value = state.search;
    group.value = state.groupId === undefined ? "" : String(state.groupId);
    rarity.value = state.TFTRarity ?? "";
    sort.value = state.sort;
    pbeOnly.checked = state.onlyPbeAdditions;
    [group, rarity, sort].forEach(refreshSelect);
    root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) =>
      button.setAttribute("aria-checked", String(button.dataset.runtimeChannel === state.channel)),
    );
    const label = communityDragonChannelLabel(state.channel, locale);
    channelLabel.textContent = label;
    const icon = root.querySelector<SVGSVGElement>(".domain-icon--reference");
    if (icon) setDomainIconTooltip(icon, "reference", label, locale === "zh_cn" ? "zh-cn" : "en");
  };
  const addSelectOptions = (select: HTMLSelectElement, options: readonly [string, string][]) => {
    const placeholder = select.firstElementChild?.cloneNode(true);
    if (!placeholder) throw new Error("TFT Arenas filter is missing its all option");
    select.replaceChildren(placeholder);
    for (const [value, label] of options) {
      const option = root.ownerDocument.createElement("option");
      option.value = value;
      option.textContent = label;
      select.append(option);
    }
  };
  const renderOptions = () => {
    const groups = new Map<number, string>();
    const rarities = new Set<TftArena["TFTRarity"]>();
    for (const item of baseItems) {
      groups.set(item.groupId, item.groupName);
      rarities.add(item.TFTRarity);
    }
    addSelectOptions(group, [...groups].sort((a, b) => a[1].localeCompare(b[1], locale === "zh_cn" ? "zh-CN" : "en")).map(([id, name]) => [String(id), name]));
    addSelectOptions(rarity, TFT_ARENA_RARITY_ORDER.filter((tier) => rarities.has(tier)).map((tier) => [tier, tftCosmeticRarityLabel(tier, locale)]));
  };
  const appendCard = (item: TftArena) => {
    const doc = root.ownerDocument;
    const rarityLabel = tftCosmeticRarityLabel(item.TFTRarity, locale);
    const article = doc.createElement("article");
    article.className = "runtime-card tft-arenas-card";
    const media = doc.createElement("div");
    media.className = "tft-arenas-card-media";
    const preview = doc.createElement("button");
    preview.className = "runtime-media-preview-trigger tft-arenas-card-preview";
    preview.type = "button";
    preview.dataset.mediaPreviewTrigger = "";
    preview.dataset.previewKind = "image";
    preview.dataset.previewSrc = item.imageUrl;
    preview.setAttribute("aria-label", t.preview(item.name));
    const image = doc.createElement("img");
    image.src = item.imageUrl;
    image.alt = item.name;
    image.loading = "lazy";
    image.decoding = "async";
    const fallback = doc.createElement("span");
    fallback.className = "tft-arenas-image-fallback";
    fallback.textContent = t.missingImage;
    fallback.hidden = true;
    image.addEventListener("error", () => { preview.hidden = true; fallback.hidden = false; }, { once: true });
    const cover = doc.createElement("span");
    cover.className = "tft-arenas-preview-cover";
    cover.setAttribute("aria-hidden", "true");
    cover.append(createIcon("EyeOutlined"));
    preview.append(image, cover);
    media.append(preview, fallback);
    if (state.channel === "pbe" && item.isPbeAddition) {
      const badge = doc.createElement("span");
      badge.className = "tft-arenas-pbe-marker";
      badge.textContent = t.pbeNew;
      media.append(badge);
    }
    const info = doc.createElement("button");
    info.className = "ant-btn ant-btn-sm ant-btn-icon-only tft-arenas-info-button";
    info.type = "button";
    info.setAttribute("aria-label", `${t.details}: ${item.name}`);
    info.append(createIcon("InfoCircleOutlined"));
    const details = doc.createElement("dl");
    details.className = "tft-arenas-card-popover";
    const detail = (label: string, value: string) => {
      const row = doc.createElement("div");
      const dt = doc.createElement("dt");
      const dd = doc.createElement("dd");
      dt.textContent = label;
      dd.textContent = value;
      row.append(dt, dd);
      details.append(row);
    };
    detail(t.name, item.name);
    detail(t.group, item.groupName);
    detail(t.tier, rarityLabel);
    if (item.description?.trim()) detail(t.description, item.description.trim());
    popoverCleanups.push(createPopover(info, t.details, details));
    media.append(info);
    const body = doc.createElement("div");
    body.className = "tft-arenas-card-body";
    const heading = doc.createElement("h2");
    heading.textContent = item.name;
    const tier = doc.createElement("span");
    tier.className = "tft-arenas-card-tier";
    tier.textContent = rarityLabel;
    body.append(heading, tier);
    const rarityIcon = doc.createElement("img");
    rarityIcon.className = "tft-cosmetic-rarity-icon";
    rarityIcon.src = tftCosmeticRarityIconUrl(item.TFTRarity, state.channel);
    rarityIcon.alt = "";
    rarityIcon.setAttribute("aria-hidden", "true");
    const rarityTooltip = createTooltip(rarityIcon, rarityLabel);
    rarityTooltip.classList.add("tft-cosmetic-rarity-tooltip");
    rarityTooltip.setAttribute("aria-label", rarityLabel);
    article.append(media, rarityTooltip, body);
    grid.append(article);
  };
  const renderMatches = (reset: boolean) => {
    matches = filterTftArenas(items, { ...state, onlyPbeAdditions: state.channel === "pbe" && liveItems !== undefined && state.onlyPbeAdditions }, locale);
    const nextColumns = gridColumns();
    if (reset) {
      columns = nextColumns;
      loadedRows = arenaPageSize(columns) / columns;
      allShown = matches.length <= loadedRows * columns;
    } else columns = nextColumns;
    const visible = allShown ? matches.length : arenaVisibleCount(loadedRows, columns, matches.length);
    clearPopovers();
    grid.replaceChildren();
    for (const item of matches.slice(0, visible)) appendCard(item);
    resultCount.textContent = t.results(matches.length);
    loadMoreFooter.hidden = visible >= matches.length;
    if (matches.length === 0) {
      const fragment = emptyTemplate.content.cloneNode(true) as DocumentFragment;
      const description = fragment.querySelector<HTMLElement>(".ant-empty-description");
      if (!description) throw new Error("TFT Arenas empty template is incomplete");
      description.textContent = baseItems.length === 0 ? t.empty : t.noMatches;
      grid.append(fragment);
    }
  };
  const recomputeItems = () => {
    const searchable = addTftArenaSearchAliases(baseItems, aliasItems ?? []);
    items = state.channel === "pbe" && liveItems
      ? markPbeTftArenaAdditions(searchable, liveItems) : searchable;
    pbeSetting.hidden = state.channel !== "pbe" || liveItems === undefined;
    renderMatches(false);
  };
  const updateFilters = (patch: Partial<Pick<TftArenaUrlState, "search" | "groupId" | "TFTRarity" | "sort" | "onlyPbeAdditions">>) => {
    state = { ...state, ...patch, invalid: [] };
    const url = formatTftArenaUrl(history.url, state);
    if (url.href !== history.url.href) history.push(url);
    state = readTftArenaUrlState(url);
    syncControls();
    renderMatches(true);
    status.textContent = "";
  };
  const lifecycle = new RuntimeChannelLifecycle({
    history,
    parse(url) {
      const target = readTftArenaUrlState(url);
      return { status: "valid", channel: target.channel, target };
    },
    load(target, signal) { return runtime.listTftArenas({ locale, channel: target.channel, signal }); },
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
        state = context.target;
        baseItems = result;
        aliasItems = undefined;
        liveItems = undefined;
        aliasNotice.hidden = true;
        compareNotice.hidden = true;
        const invalid = [...state.invalid];
        if (state.groupId !== undefined && !baseItems.some((item) => item.groupId === state.groupId)) { invalid.push("groupId"); state = { ...state, groupId: undefined }; }
        if (state.TFTRarity !== undefined && !baseItems.some((item) => item.TFTRarity === state.TFTRarity)) { invalid.push("TFTRarity"); state = { ...state, TFTRarity: undefined }; }
        state = { ...state, invalid };
        count.textContent = t.total(baseItems.length);
        renderOptions();
        syncControls();
        filterSkeleton.hidden = true;
        filters.hidden = baseItems.length === 0;
        content.hidden = true;
        results.hidden = false;
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
        status.textContent = invalid.length ? t.invalid : "";
        items = baseItems;
        pbeSetting.hidden = true;
        renderMatches(true);
        const loadAliases = async () => {
          aliasRetry.disabled = true;
          try {
            const otherLocale = locale === "zh_cn" ? "default" : "zh_cn";
            const result = await runtime.listTftArenas({ locale: otherLocale, channel: context.channel, signal: context.signal });
            if (!context.isCurrent()) return;
            aliasItems = result;
            aliasNotice.hidden = true;
            recomputeItems();
          } catch {
            if (context.isCurrent() && !context.signal.aborted) aliasNotice.hidden = false;
          } finally { if (context.isCurrent()) aliasRetry.disabled = false; }
        };
        const loadComparison = async () => {
          compareRetry.disabled = true;
          try {
            const result = await runtime.listTftArenas({ locale, channel: "latest", signal: context.signal });
            if (!context.isCurrent()) return;
            liveItems = result;
            compareNotice.hidden = true;
            recomputeItems();
          } catch {
            if (context.isCurrent() && !context.signal.aborted) compareNotice.hidden = false;
          } finally { if (context.isCurrent()) compareRetry.disabled = false; }
        };
        aliasRetry.onclick = () => { void loadAliases(); };
        compareRetry.onclick = () => { void loadComparison(); };
        void loadAliases();
        if (context.channel === "pbe") void loadComparison();
      },
      committed(context) {
        const canonical = formatTftArenaUrl(context.url, state);
        if (canonical.href !== context.url.href) history.replace(canonical);
      },
      invalid(message) { setSpinning(false); status.textContent = message; root.removeAttribute("aria-busy"); setControlsDisabled(false); },
      failure(error, retry, preserveContent) {
        pendingChannel = undefined;
        setSpinning(false);
        root.removeAttribute("aria-busy");
        setControlsDisabled(false);
        const fragment = errorTemplate.content.cloneNode(true) as DocumentFragment;
        const wrapper = fragment.firstElementChild as HTMLElement | null;
        const message = fragment.querySelector<HTMLElement>("[data-arenas-error-message]");
        const button = fragment.querySelector<HTMLButtonElement>("[data-arenas-retry]");
        if (!wrapper || !message || !button) throw new Error("TFT Arenas error template is incomplete");
        message.textContent = runtimeFailureMessage(error, locale);
        button.addEventListener("click", retry, { once: true });
        errorMessage = wrapper;
        if (preserveContent) results.before(wrapper);
        else { filterSkeleton.hidden = true; filters.hidden = true; results.hidden = true; content.hidden = false; content.replaceChildren(wrapper); }
      },
    },
  });
  search.addEventListener("input", () => updateFilters({ search: search.value }));
  group.addEventListener("change", () => updateFilters({ groupId: group.value ? Number(group.value) : undefined }));
  rarity.addEventListener("change", () => updateFilters({ TFTRarity: rarity.value && isTftArenaRarity(rarity.value) ? rarity.value : undefined }));
  sort.addEventListener("change", () => { if (isTftArenaSort(sort.value)) updateFilters({ sort: sort.value }); });
  pbeOnly.addEventListener("change", () => updateFilters({ onlyPbeAdditions: pbeOnly.checked }));
  loadMore.addEventListener("click", () => {
    loadedRows += arenaPageSize(columns) / columns;
    if (arenaVisibleCount(loadedRows, columns, matches.length) >= matches.length) allShown = true;
    renderMatches(false);
  });
  window.addEventListener("resize", () => { if (!results.hidden && gridColumns() !== columns) renderMatches(false); });
  root.querySelectorAll<HTMLButtonElement>("[data-runtime-channel]").forEach((button) => {
    button.addEventListener("click", () => {
      const channel = button.dataset.runtimeChannel;
      if ((channel !== "pbe" && channel !== "latest") || channel === (pendingChannel ?? state.channel)) return;
      void lifecycle.navigate(formatTftArenaUrl(history.url, { ...state, channel, channelExplicit: true, onlyPbeAdditions: channel === "pbe" && state.onlyPbeAdditions }));
    });
  });
  void lifecycle.start();
  return lifecycle;
}
