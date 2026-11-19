import {
  CommunityDragonRuntimeError,
  type CommunityDragonLocale,
  type RuntimeEntity,
  type RuntimeList,
} from "../domain/communitydragon-runtime";
import type {
  RuntimeSkinReferenceGroup,
  RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import {
  projectChampionSkinListItems,
  projectSkinReferenceItems,
  selectRuntimeBackdropItem,
  sortSkinReferenceItems,
  sortSkinlineReferenceItems,
} from "../domain/skin-reference-projection";
import { relatedRuntimeItems } from "../domain/runtime-relations";
import {
  buguoguoModelUrl,
  buguoguoVoiceUrl,
  googleSearchUrl,
  khadaChampionUrl,
  khadaModelUrl,
  leagueWikiChampionUrl,
  qqHeroBattleDataUrl,
  runtimeSkinActions,
  skinSpotlightsSearchUrl,
  type RuntimeSkinAction,
} from "../domain/detail-actions";
import type {
  RuntimeLocationState,
  RuntimePageState,
} from "./runtime-reference";
import type { RuntimeControllerLike } from "./runtime-reference-view";
import {
  appendExternalAction,
  appendHistoricalArtwork,
  appendMedia,
  appendMediaCarousel,
  appendMissingField,
  appendSkinReferenceTitle,
  appendSkinReferenceGrid,
  appendUniverseSkinGroups,
  hrefFor,
  linkWithNavigation,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import { runtimeFailureMessage } from "./communitydragon-errors";
import { createChromaCard } from "../components/chroma-card/chroma-card";
import {
  createDomainHeading,
  createDomainIcon,
  domainIconTooltipLabel,
  setDomainIconTooltip,
  type DomainIconName,
} from "../components/domain-icons";
import { createTooltip } from "../components/tooltip";
import { createPopover } from "../components/popover";
import { bindTypographyParagraphs, createParagraph, createTitle } from "../components/Typography";
import { enhanceSelect } from "../components/select";
import { createIcon } from "../components/icons/create-icon";
import type { IconName } from "../components/icons/icon-data";
import { bindImageFallbacks } from "./image-fallback";

type DetailState = Extract<RuntimeLocationState, { mode: "detail" }>;
type SummaryActionIcon = "voice" | "video" | "model" | "search" | "wiki" | "stats" | "external";
type SummaryAction = Pick<RuntimeSkinAction, "label" | "href"> & {
  readonly id?: RuntimeSkinAction["id"];
  readonly icon?: SummaryActionIcon;
};

const summaryActionIcons = {
  voice: "AudioOutlined",
  video: "VideoCameraOutlined",
  model: "CodeSandboxOutlined",
  search: "SearchOutlined",
  wiki: "BookOutlined",
  stats: "BarChartOutlined",
  external: "ExportOutlined",
} as const satisfies Record<SummaryActionIcon, IconName>;

function createSummaryActionIcon(kind: SummaryActionIcon): SVGSVGElement {
  const icon = createIcon(summaryActionIcons[kind]);
  icon.classList.add("runtime-summary-action-icon");
  return icon;
}

export interface RuntimeDetailRendererOptions {
  readonly content: HTMLElement;
  readonly status: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly getController: () => RuntimeControllerLike;
  readonly preservesExplicitPbe: () => boolean;
  readonly updateChannel: (channel: "pbe" | "latest") => void;
}

export interface RuntimeDetailRenderer {
  render(item: RuntimeEntity, state: DetailState): void;
  renderRelations(
    state: RuntimePageState,
    entity: RuntimeEntity,
    target: DetailState,
  ): void;
  renderRelationsItems(items: RuntimeList, state: DetailState): void;
  renderSkinlineSkins(
    items: readonly RuntimeSkinReferenceItem[],
    state: DetailState,
  ): void;
  renderUniverseSkins(groups: readonly RuntimeSkinReferenceGroup[]): void;
  showRelationFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
  showSkinlineSkinsFailure(
    error: CommunityDragonRuntimeError,
    retry: () => void,
  ): void;
  showUniverseSkinsFailure(
    error: CommunityDragonRuntimeError,
    retry: () => void,
  ): void;
  showDetailSummaryLoading(): void;
  showDetailSummaryFailure(): void;
  showSupplementLoading(kind: "skinline" | "universe"): void;
}

function setUniverseCountSkeleton(element: HTMLElement): void {
  const stat = element.closest<HTMLElement>(".runtime-universe-stat");
  const icon = stat?.querySelector<SVGSVGElement>(".domain-icon");
  const iconName = icon?.dataset.domainIconName as DomainIconName | undefined;
  if (icon && iconName)
    setDomainIconTooltip(
      icon,
      iconName,
      "",
      icon.dataset.domainIconTooltipLocale ?? "en",
    );
  element.classList.remove("runtime-list-count");
  element.classList.add(
    "runtime-skeleton-line",
    "runtime-skeleton-line--count",
    "runtime-universe-count-skeleton",
  );
  if (element.hasAttribute("data-runtime-universe-skin-count") || element.hasAttribute("data-runtime-entity-skin-count"))
    element.classList.add("runtime-universe-count-skeleton--skins");
  element.setAttribute("aria-hidden", "true");
  element.textContent = "";
}

function setUniverseCount(element: HTMLElement, value: string): void {
  const stat = element.closest<HTMLElement>(".runtime-universe-stat");
  const icon = stat?.querySelector<SVGSVGElement>(".domain-icon");
  const iconName = icon?.dataset.domainIconName as DomainIconName | undefined;
  if (icon && iconName)
    setDomainIconTooltip(
      icon,
      iconName,
      value,
      icon.dataset.domainIconTooltipLocale ?? "en",
    );
  element.className = "runtime-list-count";
  element.removeAttribute("aria-hidden");
  element.textContent = value;
}

export function createRuntimeDetailRenderer(
  options: RuntimeDetailRendererOptions,
): RuntimeDetailRenderer {
  const chromaLinksData = document.querySelector<HTMLElement>(
    "[data-runtime-prestige-chroma-links]",
  )?.dataset.runtimePrestigeChromaLinks;
  const chromaLinks: Record<string, { href: string; imageUrl: string; fallbackUrl: string; previewUrl: string; previewFallbackUrl: string; colors: string[] }> = chromaLinksData
    ? JSON.parse(chromaLinksData) as Record<string, { href: string; imageUrl: string; fallbackUrl: string; previewUrl: string; previewFallbackUrl: string; colors: string[] }>
    : {};
  let relationSlot: HTMLElement | undefined;
  let skinlineSkinsSlot: HTMLElement | undefined;
  let universeSkinsSlot: HTMLElement | undefined;
  let universeSkinGroups: readonly RuntimeSkinReferenceGroup[] = [];
  let universeSkinCollectionState: "loading" | "ready" | "failed" = "loading";
  let universeSkinlineNames = new Map<number, string>();
  let renderUniverseGroups: (() => void) | undefined;
  let updateSkinlineChampionNames: ((items: RuntimeList) => void) | undefined;
  let entityDetailSource: HTMLElement | undefined;
  let entityDetailDivider: HTMLElement | undefined;
  let universeDetailSource: HTMLElement | undefined;
  let universeDetailDivider: HTMLElement | undefined;
  let skinNavigation: {
    readonly championId: number;
    readonly channel: "pbe" | "latest";
    readonly items: readonly { readonly id: number; readonly name: string }[];
    readonly index: number;
  } | undefined;
  let chromaPopoverCleanups: (() => void)[] = [];
  const entitySkinCount = document.querySelector<HTMLElement>(
    "[data-runtime-entity-skin-count]",
  );
  const skinlineUniverseSummary = document.querySelector<HTMLElement>(
    "[data-runtime-skinline-universe-summary]",
  );
  const skinlineUniverseSlot = skinlineUniverseSummary?.querySelector<HTMLElement>(
    "[data-runtime-skinline-universes]",
  );
  const skinChampionSummary = document.querySelector<HTMLElement>("[data-runtime-skin-champion-summary]");
  const skinChampionSlot = document.querySelector<HTMLElement>("[data-runtime-skin-champion]");
  const skinChromaSummary = document.querySelector<HTMLElement>("[data-runtime-skin-chroma-summary]");
  const skinChromaCount = document.querySelector<HTMLElement>("[data-runtime-skin-chroma-count]");
  const skinActionsSummary = document.querySelector<HTMLElement>("[data-runtime-skin-actions-summary]");
  const skinNavigationGroup = document.querySelector<HTMLElement>("[data-runtime-skin-navigation]");
  const skinNavigationPrevious = skinNavigationGroup?.querySelector<HTMLButtonElement>("[data-runtime-skin-navigation-previous]");
  const skinNavigationPreviousName = skinNavigationGroup?.querySelector<HTMLElement>("[data-runtime-skin-navigation-previous-name]");
  const skinNavigationNext = skinNavigationGroup?.querySelector<HTMLButtonElement>("[data-runtime-skin-navigation-next]");
  const skinNavigationNextName = skinNavigationGroup?.querySelector<HTMLElement>("[data-runtime-skin-navigation-next-name]");
  const navigateSkin = (delta: number): boolean => {
    const current = skinNavigation;
    const length = current?.items.length ?? 0;
    if (!current || length < 2) return false;
    const target = current.items[(current.index + delta + length) % length];
    if (!target) return false;
    const scrollY = window.scrollY;
    void options.getController().navigate(
      hrefFor(
        options.locale,
        "skins",
        { id: target.id, championId: current.championId, channel: current.channel },
        "detail",
        options.preservesExplicitPbe(),
      ),
    ).then(() => window.scrollTo(0, scrollY));
    return true;
  };
  skinNavigationPrevious?.addEventListener("click", () => { navigateSkin(-1); });
  skinNavigationNext?.addEventListener("click", () => { navigateSkin(1); });
  const renderSkinNavigation = (): void => {
    if (!skinNavigationGroup || !skinNavigationPrevious || !skinNavigationPreviousName || !skinNavigationNext || !skinNavigationNextName) return;
    skinNavigationGroup.hidden = !skinNavigation;
    if (!skinNavigation) return;
    const updateControl = (delta: -1 | 1, button: HTMLButtonElement, name: HTMLElement, label: string): void => {
      const { index, items } = skinNavigation;
      const target = items.length > 1 ? items[(index + delta + items.length) % items.length] : undefined;
      button.disabled = !target;
      button.setAttribute("aria-label", target ? `${label}: ${target.name}` : label);
      name.textContent = target?.name ?? "";
      name.hidden = !target;
      if (target) name.setAttribute("title", target.name);
    };
    updateControl(-1, skinNavigationPrevious, skinNavigationPreviousName, options.locale === "zh_cn" ? "上一款皮肤" : "Previous skin");
    updateControl(1, skinNavigationNext, skinNavigationNextName, options.locale === "zh_cn" ? "下一款皮肤" : "Next skin");
  };
  options.content.ownerDocument.addEventListener("keydown", (event) => {
    const keyEvent = event as KeyboardEvent;
    const current = skinNavigation;
    const delta = keyEvent.key === "ArrowLeft" ? -1 : keyEvent.key === "ArrowRight" ? 1 : 0;
    if (
      !current ||
      !delta ||
      keyEvent.altKey ||
      keyEvent.ctrlKey ||
      keyEvent.metaKey ||
      keyEvent.shiftKey
    ) return;
    const target = keyEvent.target as (Element & { closest?: (selectors: string) => Element | null }) | null;
    if (target?.closest?.("input, select, textarea, button, a, [contenteditable], [role='button'], [role='radio'], [role='menuitem'], [role='menuitemradio'], [data-media-viewer]")) return;
    if (!navigateSkin(delta)) return;
    keyEvent.preventDefault();
  });
  const skinActionsMenu = skinActionsSummary?.querySelector<HTMLElement>(".ant-dropdown-menu");
  const entityActionsSummary = document.querySelector<HTMLElement>("[data-runtime-entity-actions-summary]");
  const entityActionsMenu = entityActionsSummary?.querySelector<HTMLElement>(".ant-dropdown-menu");
  const renderSummaryActions = (
    summary: HTMLElement | null | undefined,
    menu: HTMLElement | null | undefined,
    actions: readonly SummaryAction[],
  ): void => {
    if (!summary || !menu) return;
    summary.hidden = actions.length === 0;
    menu.replaceChildren();
    actions.forEach((action) => {
      const entry = document.createElement("li");
      entry.setAttribute("role", "none");
      appendExternalAction(entry, action);
      const link = entry.querySelector<HTMLElement>("a");
      if (link) {
        const kind = action.icon ?? (action.id === "voice" ? "voice"
          : action.id === "bilibili" || action.id === "skinspotlights" ? "video"
            : action.id === "wikipedia" ? "wiki"
              : action.id === "battle-data" ? "stats" : "model");
        const label = textNode("span", action.label, "runtime-summary-action-label");
        link.classList.add("runtime-summary-action");
        link.replaceChildren(createSummaryActionIcon(kind), label, createSummaryActionIcon("external"));
      }
      link?.setAttribute("role", "menuitem");
      link?.setAttribute("data-ant-dropdown-item", "");
      menu.appendChild(entry);
    });
  };
  const skinRelationSummaries = [
    { key: "relation-skinlines", kind: "skinline", page: "skinlines", label: options.locale === "zh_cn" ? "系列" : "skinlines", summary: document.querySelector<HTMLElement>("[data-runtime-skin-skinline-summary]"), slot: document.querySelector<HTMLElement>("[data-runtime-skin-skinlines]") },
    { key: "relation-universes", kind: "universe", page: "universes", label: options.locale === "zh_cn" ? "宇宙" : "universes", summary: document.querySelector<HTMLElement>("[data-runtime-skin-universe-summary]"), slot: document.querySelector<HTMLElement>("[data-runtime-skin-universes]") },
  ] as const;
  const referenceBackdrop = document.querySelector<HTMLElement>(
    "[data-runtime-reference-backdrop]",
  );
  const referenceBackdropImage = referenceBackdrop?.querySelector<HTMLImageElement>(
    "[data-runtime-reference-backdrop-image]",
  );

  const updateReferenceBackdrop = (
    items?: readonly RuntimeSkinReferenceItem[],
  ): void => {
    if (!referenceBackdrop || !referenceBackdropImage) return;
    const item = items ? selectRuntimeBackdropItem(items) : undefined;
    const src = item?.media.unfocusedSplashUrl ?? item?.media.focusedSplashUrl;
    if (!item || !src) {
      referenceBackdrop.hidden = true;
      referenceBackdropImage.removeAttribute("src");
      referenceBackdropImage.removeAttribute("data-fallback");
      delete referenceBackdropImage.dataset.fallbackStage;
      return;
    }
    const fallback = item.media.unfocusedSplashUrl
      ? item.media.focusedSplashUrl ?? item.media.tileUrl
      : item.media.tileUrl;
    if (fallback) referenceBackdropImage.dataset.fallback = fallback;
    else referenceBackdropImage.removeAttribute("data-fallback");
    delete referenceBackdropImage.dataset.fallbackStage;
    referenceBackdrop.hidden = false;
    referenceBackdropImage.src = src;
    bindImageFallbacks(referenceBackdrop);
  };

  const renderHeaderRelations = (
    items: RuntimeList,
    target: DetailState,
    kind: "skinline" | "universe",
    page: "skinlines" | "universes",
    summary: HTMLElement | null | undefined,
    slot: HTMLElement | null | undefined,
  ): void => {
    if (!summary || !slot) return;
    const relations = items.filter((item) => item.kind === kind);
    summary.hidden = relations.length === 0;
    if (!relations.length) return;
    const links = document.createElement("span");
    links.className = "runtime-entity-relation-links";
    const iconName = kind === "skinline" ? "skinlines" : "universes";
    relations.forEach((item) => {
      const link = linkWithNavigation(
        item.name,
        hrefFor(options.locale, page, { id: item.id, channel: target.channel }, "detail", options.preservesExplicitPbe()),
        options.getController(),
        "runtime-entity-relation-link",
      );
      link.setAttribute(
        "aria-label",
        domainIconTooltipLabel(iconName, item.name, options.locale),
      );
      links.appendChild(link);
    });
    const icon = slot.closest<HTMLElement>(".runtime-universe-stat")
      ?.querySelector<SVGSVGElement>(".domain-icon");
    if (icon)
      setDomainIconTooltip(
        icon,
        iconName,
        relations.map((item) => item.name).join(", "),
        options.locale,
      );
    slot.className = "";
    slot.removeAttribute("aria-hidden");
    slot.replaceChildren(links);
  };

  const renderSkinlineUniverses = (items: RuntimeList, target: DetailState): void =>
    renderHeaderRelations(items, target, "universe", "universes", skinlineUniverseSummary, skinlineUniverseSlot);

  const renderRelationStates = (
    state: RuntimePageState,
    entity: RuntimeEntity,
    target: DetailState,
  ): void => {
    if (target.kind === "champion") return;
    if (target.kind === "skinline") {
      const champions = state.slots["relation-champions"];
      if (champions?.status === "ready" || champions?.status === "empty")
        updateSkinlineChampionNames?.(champions.value);
      const slot = state.slots["relation-universes"];
      if (!slot || slot.status === "loading") {
        if (skinlineUniverseSummary && skinlineUniverseSlot) {
          skinlineUniverseSummary.hidden = false;
          setUniverseCountSkeleton(skinlineUniverseSlot);
        }
      } else if (slot.status === "ready" || slot.status === "empty")
        renderSkinlineUniverses(relatedRuntimeItems(entity, target, slot.value), target);
      else if (slot?.status === "failed") {
        if (skinlineUniverseSlot) {
          const retry = textNode("button", options.locale === "zh_cn" ? "重试宇宙" : "Retry universes", "runtime-retry") as HTMLButtonElement;
          retry.type = "button";
          retry.addEventListener("click", slot.retry, { once: true });
          skinlineUniverseSlot.className = "";
          skinlineUniverseSlot.removeAttribute("aria-hidden");
          skinlineUniverseSlot.replaceChildren(retry);
        }
      }
      return;
    }
    if (target.kind === "skin") {
      for (const { key, kind, page, label, summary, slot: content } of skinRelationSummaries) {
        if (!summary || !content || summary.hidden) continue;
        const slot = state.slots[key];
        if (!slot || slot.status === "loading") setUniverseCountSkeleton(content);
        else if (slot.status === "ready" || slot.status === "empty")
          renderHeaderRelations(relatedRuntimeItems(entity, target, slot.value), target, kind, page, summary, content);
        else {
          const retry = textNode("button", options.locale === "zh_cn" ? `重试${label}` : `Retry ${label}`, "runtime-retry") as HTMLButtonElement;
          retry.type = "button";
          retry.addEventListener("click", slot.retry, { once: true });
          content.className = "";
          content.removeAttribute("aria-hidden");
          content.replaceChildren(retry);
        }
      }
      return;
    }
    if (!relationSlot) return;
    if (target.kind === "universe") relationSlot.hidden = true;
    const definitions: readonly {
      readonly key: "relation-skinlines" | "relation-universes";
      readonly kind: "skinline" | "universe";
      readonly label: string;
    }[] =
      target.kind === "universe"
            ? [
                {
                  key: "relation-skinlines",
                  kind: "skinline",
                  label: options.locale === "zh_cn" ? "所属系列" : "Skinlines",
                },
              ]
            : [];
    if (target.kind === "universe") {
      const skinlineSlot = state.slots["relation-skinlines"];
      universeSkinlineNames = new Map(
        skinlineSlot?.status === "ready" || skinlineSlot?.status === "empty"
          ? skinlineSlot.value
              .filter((item) => item.kind === "skinline")
              .map((item) => [item.id, item.name] as const)
          : [],
      );
      if (universeSkinCollectionState === "ready") renderUniverseGroups?.();
    }
    relationSlot.replaceChildren(
      ...definitions.map(({ key, kind, label }) => {
        const group = document.createElement("section");
        group.className = "runtime-relation-group";
        if (target.kind === "skin") group.appendChild(textNode("h3", label));
        const slot = state.slots[key] as
          | { readonly status: "loading" }
          | {
              readonly status: "ready" | "empty";
              readonly value: RuntimeList;
            }
          | {
              readonly status: "failed";
              readonly error: CommunityDragonRuntimeError;
              readonly retry: () => void;
            }
          | undefined;
        if (!slot || slot.status === "loading") {
          const placeholders = document.createElement("div");
          placeholders.className = "runtime-links runtime-skeleton-relations";
          placeholders.setAttribute("aria-hidden", "true");
          for (const width of ["72px", "96px", "84px"]) {
            const chip = document.createElement("span");
            chip.className = "runtime-skeleton-line runtime-skeleton-line--chip";
            chip.style.width = width;
            placeholders.appendChild(chip);
          }
          group.appendChild(placeholders);
        } else if (slot.status === "failed") {
          if (target.kind === "universe" && relationSlot)
            relationSlot.hidden = false;
          const notice = textNode(
            "p",
            runtimeFailureMessage(slot.error, options.locale),
            "runtime-relation-error",
          );
          const button = document.createElement("button");
          button.type = "button";
          button.className = "runtime-retry";
          button.textContent =
            options.locale === "zh_cn" ? `重试${label}` : `Retry ${label}`;
          button.addEventListener("click", slot.retry, { once: true });
          notice.append(" ", button);
          group.appendChild(notice);
        } else {
          const items = relatedRuntimeItems(entity, target, slot.value).filter(
            (item) => item.kind === kind,
          );
          if (!items.length) {
            group.appendChild(
              textNode(
                "p",
                options.locale === "zh_cn"
                  ? "当前语言没有可显示的关联资料。"
                  : "No related references are available in this language.",
                "runtime-empty-state",
              ),
            );
          } else {
            const links = document.createElement("div");
            links.className = "runtime-links";
            items.forEach((item) =>
              links.appendChild(
                linkWithNavigation(
                  item.name,
                  hrefFor(
                    options.locale,
                    item.kind === "skinline" ? "skinlines" : "universes",
                    { id: item.id, channel: target.channel },
                    "detail",
                    options.preservesExplicitPbe(),
                  ),
                  options.getController(),
                ),
              ),
            );
            group.appendChild(links);
          }
        }
        return group;
      }),
    );
  };

  return {
    render(item, state) {
      chromaPopoverCleanups.forEach((cleanup) => cleanup());
      chromaPopoverCleanups = [];
      const skinReleaseOrder = item.kind === "skin"
        ? item.championSkinReleaseOrder
        : undefined;
      const skinReleaseIndex = skinReleaseOrder?.findIndex(({ id }) => id === (item.stageId ?? item.id)) ?? -1;
      skinNavigation = item.kind === "skin" && skinReleaseOrder && skinReleaseIndex >= 0
        ? {
            championId: item.championId,
            channel: state.channel,
            items: skinReleaseOrder,
            index: skinReleaseIndex,
          }
        : undefined;
      renderSkinNavigation();
      relationSlot = undefined;
      skinlineSkinsSlot = undefined;
      universeSkinsSlot = undefined;
      universeSkinGroups = [];
      universeSkinCollectionState = "loading";
      renderUniverseGroups = undefined;
      universeSkinlineNames = new Map();
      updateSkinlineChampionNames = undefined;
      if (item.kind === "skin") {
        if (skinChromaSummary && skinChromaCount) {
          skinChromaSummary.hidden = false;
          setUniverseCount(skinChromaCount, options.locale === "zh_cn"
            ? `${item.chromas.length} 个炫彩`
            : `${item.chromas.length} ${item.chromas.length === 1 ? "chroma" : "chromas"}`);
        }
        for (const { kind, summary, slot } of skinRelationSummaries) {
          if (summary) summary.hidden = kind === "skinline"
            ? item.skinlineIds.length === 0
            : (item.universeIds?.length ?? 0) === 0 && item.skinlineIds.length === 0;
          if (summary && !summary.hidden && slot) setUniverseCountSkeleton(slot);
        }
      }
      updateReferenceBackdrop(
        item.kind === "champion"
          ? projectChampionSkinListItems(item.id, item.skins)
          : item.kind === "skin"
            ? projectSkinReferenceItems(item)
            : undefined,
      );
      setRuntimeNoindex(true);
      options.updateChannel(state.channel);
      const breadcrumbEntity = document.querySelector<HTMLElement>(
        "[data-runtime-current-entity] .cn-breadcrumb-page",
      );
      if (breadcrumbEntity)
        breadcrumbEntity.textContent = item.name ?? runtimeMissingLabel(options.locale, "name");
      const controller = options.getController();
      const article = document.createElement("article");
      article.className = "runtime-detail";
      const entityName = item.name ?? runtimeMissingLabel(options.locale, "name");
      const isZh = options.locale === "zh_cn";
      const entityActions: readonly SummaryAction[] = item.kind === "champion"
        ? [
            { label: isZh ? "在 SKINSPOTLIGHTS 查看" : "VIEW ON SKINSPOTLIGHTS", href: skinSpotlightsSearchUrl(entityName), icon: "video" },
            { label: isZh ? "在 KHADA 查看 3D 模型" : "VIEW 3D MODEL ON KHADA", href: khadaChampionUrl(String(item.id)), icon: "model" },
            { label: isZh ? "谷歌搜索" : "GOOGLE SEARCH", href: googleSearchUrl(entityName), icon: "search" },
            ...(isZh ? [{ label: "布锅锅语音站", href: buguoguoVoiceUrl(item.id), icon: "voice" as const }] : []),
            ...(isZh ? [{ id: "battle-data" as const, label: "对战数据", href: qqHeroBattleDataUrl(item.id), icon: "stats" as const }] : []),
            ...(item.alias ? [{
              id: "wikipedia" as const,
              label: isZh ? "维基百科" : "Wiki",
              href: leagueWikiChampionUrl(item.alias),
              icon: "wiki" as const,
            }] : []),
          ]
        : item.kind === "skinline" || item.kind === "universe"
          ? [{ label: isZh ? "谷歌搜索" : "GOOGLE SEARCH", href: googleSearchUrl(`${entityName} ${item.kind === "skinline" ? "Skinlines" : "Universes"}`), icon: "search" }]
          : [];
      renderSummaryActions(entityActionsSummary, entityActionsMenu, entityActions);
      const title = createTitle({
        level: 1,
        className: "runtime-detail-title",
        text: item.kind === "champion" && item.title
          ? `${item.title} ${entityName}`
          : entityName,
      });
      if (
        item.kind === "champion" ||
        item.kind === "skin" ||
        item.kind === "skinline"
      ) {
        article.classList.add("runtime-detail--entity");
        const skinEmblem = item.kind === "skin" ? item.emblems?.[0] : undefined;
        const withSkinIconTooltip = (icon: HTMLElement | SVGElement): HTMLElement | SVGElement => {
          if (!skinEmblem) return item.kind === "skin" && item.rarity?.label
            ? createTooltip(icon, item.rarity.label)
            : icon;
          const content = document.createElement("div");
          content.className = "runtime-skin-emblem-tooltip-content";
          const preview = document.createElement("img");
          preview.className = "runtime-skin-emblem-preview";
          preview.src = skinEmblem.imageUrl;
          preview.alt = skinEmblem.name ?? (options.locale === "zh_cn" ? "皮肤徽章" : "Skin emblem");
          preview.loading = "lazy";
          content.appendChild(preview);
          if (item.kind === "skin" && item.rarity?.label)
            content.appendChild(textNode("span", item.rarity.label, "runtime-skin-emblem-rarity"));
          const tooltip = createTooltip(icon, content);
          tooltip.querySelector(".ant-tooltip")?.classList.add("runtime-skin-emblem-tooltip");
          return tooltip;
        };
        if (item.kind === "skin" && item.rarity?.iconUrl) {
          const icon = document.createElement("img");
          icon.className = "runtime-rarity-title-icon";
          icon.src = item.rarity.iconUrl;
          icon.alt = "";
          title.prepend(withSkinIconTooltip(icon));
        } else {
          const icon = createDomainIcon(
            item.kind === "champion" ? "champions" : item.kind === "skin" ? "skins" : "skinlines",
          );
          title.prepend(item.kind === "skin" ? withSkinIconTooltip(icon) : icon);
        }
      }
      if (item.kind === "universe") {
        article.classList.add("runtime-detail--universe");
        title.prepend(createDomainIcon("universes"));
        universeDetailSource ??= document.querySelector<HTMLElement>(
          "[data-runtime-universe-detail-source]",
        ) ?? undefined;
        universeDetailDivider ??= document.querySelector<HTMLElement>(
          ".runtime-universe-detail-divider",
        ) ?? undefined;
        const skinlineCount = universeDetailSource?.querySelector<HTMLElement>(
          "[data-runtime-universe-skinline-count]",
        );
        if (skinlineCount)
          setUniverseCount(skinlineCount, options.locale === "zh_cn"
            ? `${item.skinlineIds.length} 个皮肤系列`
            : `${item.skinlineIds.length} skinlines`);
        const skinCount = universeDetailSource?.querySelector<HTMLElement>(
          "[data-runtime-universe-skin-count]",
        );
        if (skinCount) setUniverseCountSkeleton(skinCount);
      }
      article.appendChild(title);
      if (item.kind === "champion" && item.shortBio)
        article.appendChild(createParagraph({
          text: item.shortBio,
          className: "runtime-lede",
          locale: options.locale,
        }));
      if (item.kind === "skin") {
        const description = item.description ?? (item.isBase ? item.championShortBio : undefined);
        if (description) article.appendChild(createParagraph({
          text: description,
          className: "runtime-lede",
          locale: options.locale,
        }));
      }
      if (item.kind === "skinline" && item.description)
        article.appendChild(createParagraph({
          text: item.description,
          className: "runtime-lede",
          locale: options.locale,
        }));
      if (
        item.kind === "champion" ||
        item.kind === "skin" ||
        item.kind === "skinline"
      ) {
        entityDetailSource ??= document.querySelector<HTMLElement>(
          "[data-runtime-entity-detail-source]",
        ) ?? undefined;
        entityDetailDivider ??= document.querySelector<HTMLElement>(
          ".runtime-entity-detail-divider",
        ) ?? undefined;
        if (entityDetailSource) article.appendChild(entityDetailSource);
        if (entityDetailDivider) article.appendChild(entityDetailDivider);
      }
      if (item.kind === "champion") {
        const section = document.createElement("section");
        section.setAttribute("aria-label", options.locale === "zh_cn" ? "英雄皮肤" : "Champion skins");
        const controls = document.createElement("div");
        controls.className = "runtime-toolbar runtime-skin-reference-controls";
        const sortSelect = document.createElement("select");
        sortSelect.className = "ant-select-source";
        sortSelect.id = "runtime-champion-skins-sort";
        sortSelect.setAttribute(
          "aria-label",
          options.locale === "zh_cn" ? "皮肤排序" : "Sort skins",
        );
        for (const [value, label] of [
          ["release", options.locale === "zh_cn" ? "发布顺序" : "Release"],
          ["rarity", options.locale === "zh_cn" ? "稀有度" : "Rarity"],
        ] as const) {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = label;
          sortSelect.appendChild(option);
        }
        sortSelect.value = "release";
        const sortLabel = document.createElement("label");
        sortLabel.className = "runtime-toolbar-field";
        sortLabel.htmlFor = sortSelect.id;
        sortLabel.append(
          textNode("span", options.locale === "zh_cn" ? "排序" : "Sort by"),
          sortSelect,
        );
        enhanceSelect(sortSelect);
        controls.append(sortLabel);
        section.appendChild(controls);
        const grid = document.createElement("div");
        grid.className = "runtime-skin-reference-grid";
        const skinItems = projectChampionSkinListItems(item.id, item.skins);
        const skinCount = skinItems.filter((skin) => !skin.isBase).length;
        if (entitySkinCount) setUniverseCount(entitySkinCount, options.locale === "zh_cn" ? `${skinCount} 款皮肤` : `${skinCount} skins`);
        if (!skinItems.length) controls.remove();
        const renderSkinItems = () => {
          grid.replaceChildren();
          const sortedItems = sortSkinReferenceItems(
            skinItems,
            sortSelect.value === "rarity" ? "rarity" : "release",
          );
          if (!sortedItems.length) {
            grid.appendChild(textNode("p", options.locale === "zh_cn" ? "没有符合条件的皮肤。" : "No skins match this filter.", "runtime-empty-state"));
            return;
          }
          for (const skin of sortedItems) {
            const card = document.createElement("article");
            card.className = "runtime-skin-reference-card";
            const link = linkWithNavigation(
              "",
              hrefFor(
                options.locale,
                "skins",
                {
                  id: skin.id,
                  championId: item.id,
                  channel: state.channel,
                },
                "detail",
                options.preservesExplicitPbe(),
              ),
              controller,
              "runtime-skin-reference-link",
            );
            const skinName =
              skin.name ?? runtimeMissingLabel(options.locale, "name");
            link.setAttribute("aria-label", skinName);
            if (skin.thumbnailUrl)
              appendMedia(link, skin.thumbnailUrl, skinName);
            else appendMissingField(link, options.locale, "thumbnail");
            const meta = document.createElement("span");
            meta.className = "runtime-skin-reference-meta";
            appendSkinReferenceTitle(meta, skinName, skin.rarity);
            link.appendChild(meta);
            card.appendChild(link);
            grid.appendChild(card);
          }
        };
        sortSelect.addEventListener("change", renderSkinItems);
        renderSkinItems();
        section.appendChild(grid);
        article.appendChild(section);
      } else if (item.kind === "skin") {
        if (skinChampionSummary) skinChampionSummary.hidden = false;
        if (skinChampionSlot) {
          skinChampionSlot.className = "";
          skinChampionSlot.removeAttribute("aria-hidden");
        }
        const championName = item.championName ?? (options.locale === "zh_cn" ? `英雄 #${item.championId}` : `Champion #${item.championId}`);
        const championLabel = item.championTitle && item.championTitle !== championName
          ? `${item.championTitle} ${championName}`
          : championName;
        const championIcon = skinChampionSlot
          ?.closest<HTMLElement>(".runtime-universe-stat")
          ?.querySelector<SVGSVGElement>(".domain-icon");
        if (championIcon) setDomainIconTooltip(championIcon, "champions", championLabel, options.locale);
        const championLink = linkWithNavigation(
          championLabel,
          hrefFor(options.locale, "champions", { id: item.championId, channel: state.channel }, "detail", options.preservesExplicitPbe()),
          controller,
          "runtime-entity-relation-link",
        );
        championLink.setAttribute(
          "aria-label",
          domainIconTooltipLabel("champions", championLabel, options.locale),
        );
        skinChampionSlot?.replaceChildren(championLink);

        const mediaSection = document.createElement("section");
        mediaSection.className = "runtime-skin-media";
        mediaSection.appendChild(createDomainHeading(
          "media",
          options.locale === "zh_cn" ? "媒体" : "Media",
        ));
        const mediaCarousel = document.createElement("div");
        if (
          appendMediaCarousel(
            mediaCarousel,
            item.media,
            options.locale,
            item.name ?? runtimeMissingLabel(options.locale, "name"),
          ) === 0
        ) appendMissingField(mediaCarousel, options.locale, "artwork");
        mediaSection.appendChild(mediaCarousel);
        article.appendChild(mediaSection);

        const historicalArt = item.historicalArt ?? [];
        if (historicalArt.length) {
          const historySection = document.createElement("section");
          historySection.className = "runtime-skin-history";
          historySection.appendChild(createDomainHeading(
            "skins",
            options.locale === "zh_cn" ? "历史版本原画" : "Historical artwork",
          ));
          appendHistoricalArtwork(
            historySection,
            historicalArt,
            options.locale,
            item.name ?? runtimeMissingLabel(options.locale, "name"),
          );
          article.appendChild(historySection);
        }

        const chromas = document.createElement("section");
        chromas.className = "runtime-skin-chromas";
        chromas.id = "runtime-skin-chromas";
        chromas.dataset.mediaPreviewGroup = "";
        const chromaHeading = createDomainHeading(
          "prestige-chromas",
          options.locale === "zh_cn"
            ? `炫彩（${item.chromas.length}）`
            : "Chromas",
        );
        if (options.locale !== "zh_cn") {
          chromaHeading.append(
            textNode("span", `(${item.chromas.length})`, "runtime-chroma-count"),
          );
        }
        chromas.appendChild(chromaHeading);
        const chromaGrid = document.createElement("div");
        chromaGrid.className = "runtime-chroma-grid";
        if (item.chromaImageUrl) {
          chromaGrid.appendChild(
            createChromaCard({
              name: item.name ?? runtimeMissingLabel(options.locale, "name"),
              imageUrl: item.chromaImageUrl,
              preview: true,
              isBase: true,
              locale: options.locale,
            }),
          );
        } else {
          const emptyTemplate = options.content
            .closest<HTMLElement>(".runtime-reference-root")
            ?.querySelector<HTMLTemplateElement>("[data-runtime-chroma-empty-template]");
          if (emptyTemplate) chromaGrid.append(emptyTemplate.content.cloneNode(true));
        }
        item.chromas.forEach((chroma) => {
          const prestigeChroma = chromaLinks[String(chroma.id)];
          const link = prestigeChroma
            ? document.createElement("a")
            : undefined;
          if (link && prestigeChroma) link.href = prestigeChroma.href;
          const title = options.locale === "zh_cn"
            ? prestigeChroma ? "臻彩详情" : "炫彩详情"
            : "Chroma Details";
          const card = createChromaCard({
            name: chroma.name ?? runtimeMissingLabel(options.locale, "name"),
            imageUrl: prestigeChroma?.imageUrl ?? chroma.imageUrl,
            imageFallbackUrl: prestigeChroma?.fallbackUrl,
            previewImageUrl: prestigeChroma?.previewUrl,
            previewFallbackUrl: prestigeChroma?.previewFallbackUrl,
            originalImageUrl: prestigeChroma ? chroma.imageUrl : undefined,
            preview: true,
            colors: chroma.colors,
            isBase: false,
            borderBeam: prestigeChroma
              ? { colors: ["var(--gold)", ...prestigeChroma.colors] }
              : false,
            locale: options.locale,
            link,
            modelInfoLabel: title,
          });
          const info = card.querySelector<HTMLButtonElement>(".runtime-chroma-info-button");
          if (info) {
            const modelLink = document.createElement("a");
            modelLink.href = options.locale === "zh_cn"
              ? buguoguoModelUrl(item.id, chroma.id)
              : khadaModelUrl(item.id, chroma.id);
            modelLink.target = "_blank";
            modelLink.rel = "noopener noreferrer";
            modelLink.classList.add("runtime-summary-action");
            const modelLabel = options.locale === "zh_cn"
              ? "去卡达查看3D模型"
              : "View 3D model on KHADA";
            modelLink.replaceChildren(
              createSummaryActionIcon("model"),
              textNode("span", modelLabel, "runtime-summary-action-label"),
              createSummaryActionIcon("external"),
            );
            chromaPopoverCleanups.push(createPopover(info, title, modelLink));
          }
          chromaGrid.appendChild(card);
        });
        chromas.addEventListener("media-preview-close", (event) => {
          const trigger = (event as CustomEvent<HTMLElement>).detail;
          const toggle = trigger
            ?.closest<HTMLElement>(".runtime-chroma-card")
            ?.querySelector<HTMLButtonElement>(".runtime-chroma-image-toggle");
          const showingOriginal = trigger?.dataset.previewVariant === "chroma";
          if (toggle && toggle.dataset.showingOriginal !== String(showingOriginal))
            toggle.click();
        });
        chromas.appendChild(chromaGrid);
        article.appendChild(chromas);

        const actions = runtimeSkinActions(options.locale, item);
        renderSummaryActions(skinActionsSummary, skinActionsMenu, actions);

      } else if (item.kind === "skinline") {
        const skins = document.createElement("section");
        skins.appendChild(createDomainHeading(
          "skins",
          options.locale === "zh_cn" ? "系列内皮肤" : "Skins in this skinline",
        ));
        skinlineSkinsSlot = document.createElement("div");
        skinlineSkinsSlot.className = "runtime-skinline-skins-state";
        skins.appendChild(skinlineSkinsSlot);
        article.appendChild(skins);
      } else {
        if (item.description) article.appendChild(createParagraph({
          text: item.description,
          className: "runtime-lede",
          locale: options.locale,
        }));
        relationSlot = textNode(
          "div",
          "",
          "runtime-relation-state runtime-universe-relation-state",
        );
        relationSlot.hidden = true;
        if (universeDetailSource) article.appendChild(universeDetailSource);
        if (universeDetailDivider) article.appendChild(universeDetailDivider);
        article.appendChild(relationSlot);
        const skins = document.createElement("div");
        universeSkinsSlot = document.createElement("div");
        universeSkinsSlot.className = "runtime-universe-skins-state";
        skins.appendChild(universeSkinsSlot);
        renderUniverseGroups = () => {
          if (!universeSkinsSlot || universeSkinCollectionState !== "ready")
            return;
          universeSkinsSlot.replaceChildren();
          appendUniverseSkinGroups(
            universeSkinsSlot,
            universeSkinGroups,
            universeSkinlineNames,
            options.locale,
            state.channel,
            controller,
            options.preservesExplicitPbe(),
          );
        };
        article.appendChild(skins);
      }
      options.content.replaceChildren(article);
      if (window.location.hash === "#runtime-skin-chromas") {
        article.querySelector<HTMLElement>(".runtime-skin-chromas")?.scrollIntoView({ block: "start" });
      }
      bindTypographyParagraphs(article);
      options.status.textContent =
        item.kind === "champion" || item.kind === "universe"
          ? ""
          : options.locale === "zh_cn"
            ? "资料加载完成"
            : "Reference loaded";
    },
    renderRelations(state, entity, target) {
      renderRelationStates(state, entity, target);
    },
    renderRelationsItems(items, state) {
      if (state.kind === "skinline") {
        renderSkinlineUniverses(items, state);
        return;
      }
      if (state.kind === "universe") {
        universeSkinlineNames = new Map(
          items
            .filter((item) => item.kind === "skinline")
            .map((item) => [item.id, item.name] as const),
        );
        if (universeSkinCollectionState === "ready") renderUniverseGroups?.();
      }
      if (!relationSlot) return;
      if (!items.length) {
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "当前语言没有可显示的关联资料。"
            : "No related references are available in this language.";
        return;
      }
      const grouped = new Map<"skinline" | "universe", RuntimeList>();
      items.forEach((item) => {
        if (item.kind !== "skinline" && item.kind !== "universe") return;
        const group = grouped.get(item.kind) ?? [];
        grouped.set(item.kind, [...group, item]);
      });
      relationSlot.replaceChildren(
        ...(["skinline", "universe"] as const).flatMap((kind) => {
          const groupItems = grouped.get(kind) ?? [];
          if (!groupItems.length) return [];
          const group = document.createElement("div");
          group.className = "runtime-relation-group";
          group.appendChild(
            textNode(
              "h3",
              kind === "skinline"
                ? options.locale === "zh_cn"
                  ? "皮肤系列"
                  : "Skinlines"
                : options.locale === "zh_cn"
                  ? "皮肤宇宙"
                  : "Universes",
            ),
          );
          const links = document.createElement("div");
          links.className = "runtime-links";
          groupItems.forEach((item) =>
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
                  "detail",
                  options.preservesExplicitPbe(),
                ),
                options.getController(),
              ),
            ),
          );
          group.appendChild(links);
          return [group];
        }),
      );
    },
    renderSkinlineSkins(items, state) {
      updateReferenceBackdrop(items);
      if (entitySkinCount) setUniverseCount(entitySkinCount, options.locale === "zh_cn" ? `${items.length} 款皮肤` : `${items.length} skins`);
      if (!skinlineSkinsSlot) return;
      const previousSort = skinlineSkinsSlot.querySelector<HTMLSelectElement>("#runtime-skinline-skins-sort")?.value;
      const controls = document.createElement("div");
      controls.className = "runtime-toolbar runtime-skin-reference-controls";
      let championNames = new Map<number, string>();
      const sortSelect = document.createElement("select");
      sortSelect.className = "ant-select-source";
      sortSelect.id = "runtime-skinline-skins-sort";
      sortSelect.setAttribute("aria-label", options.locale === "zh_cn" ? "皮肤排序" : "Sort skins");
      for (const [value, label] of [
        ["champion", options.locale === "zh_cn" ? "英雄" : "Champion"],
        ["rarity", options.locale === "zh_cn" ? "稀有度" : "Rarity"],
      ] as const) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        sortSelect.appendChild(option);
      }
      if (previousSort === "rarity") sortSelect.value = previousSort;
      const sortLabel = document.createElement("label");
      sortLabel.className = "runtime-toolbar-field";
      sortLabel.htmlFor = sortSelect.id;
      sortLabel.append(textNode("span", options.locale === "zh_cn" ? "排序" : "Sort by"), sortSelect);
      enhanceSelect(sortSelect);
      controls.append(sortLabel);
      const results = document.createElement("div");
      const renderSkins = () => {
        results.replaceChildren();
        const sorted = sortSkinlineReferenceItems(
          items,
          sortSelect.value === "rarity" ? "rarity" : "champion",
          championNames,
          options.locale,
        );
        appendSkinReferenceGrid(results, sorted, options.locale, state.channel, options.getController(), options.preservesExplicitPbe(), undefined, true);
      };
      updateSkinlineChampionNames = (references) => {
        championNames = new Map(references.filter((entry) => entry.kind === "champion").map((entry) => [entry.id, entry.name] as const));
        renderSkins();
      };
      sortSelect.addEventListener("change", renderSkins);
      skinlineSkinsSlot.replaceChildren(...(items.length ? [controls] : []), results);
      renderSkins();
    },
    renderUniverseSkins(groups) {
      universeSkinGroups = groups;
      universeSkinCollectionState = "ready";
      updateReferenceBackdrop(groups.flatMap((group) => group.items));
      const skinlineCount = universeDetailSource?.querySelector<HTMLElement>(
        "[data-runtime-universe-skinline-count]",
      );
      if (skinlineCount)
        setUniverseCount(skinlineCount, options.locale === "zh_cn"
          ? `${groups.length} 个皮肤系列`
          : `${groups.length} skinlines`);
      const skinCount = universeDetailSource?.querySelector<HTMLElement>(
        "[data-runtime-universe-skin-count]",
      );
      if (skinCount) {
        const count = groups.reduce((total, group) => total + group.items.length, 0);
        setUniverseCount(skinCount, options.locale === "zh_cn"
          ? `${count} 款皮肤`
          : `${count} skins`);
      }
      renderUniverseGroups?.();
    },
    showDetailSummaryLoading() {
      const source = universeDetailSource ?? document.querySelector<HTMLElement>(
        "[data-runtime-universe-detail-source]",
      );
      source?.querySelectorAll<HTMLElement>(
        "[data-runtime-universe-skinline-count], [data-runtime-universe-skin-count]",
      ).forEach(setUniverseCountSkeleton);
      if (entitySkinCount) setUniverseCountSkeleton(entitySkinCount);
      if (skinChromaSummary && skinChromaCount) {
        skinChromaSummary.hidden = false;
        setUniverseCountSkeleton(skinChromaCount);
      }
      if (skinChampionSummary && skinChampionSlot) {
        skinChampionSummary.hidden = false;
        setUniverseCountSkeleton(skinChampionSlot);
      }
      for (const { summary, slot } of skinRelationSummaries)
        if (summary && slot) {
          summary.hidden = false;
          setUniverseCountSkeleton(slot);
        }
      if (skinlineUniverseSummary && skinlineUniverseSlot) {
        skinlineUniverseSummary.hidden = false;
        setUniverseCountSkeleton(skinlineUniverseSlot);
      }
    },
    showDetailSummaryFailure() {
      const source = universeDetailSource ?? document.querySelector<HTMLElement>(
        "[data-runtime-universe-detail-source]",
      );
      const skinlineCount = source?.querySelector<HTMLElement>(
        "[data-runtime-universe-skinline-count]",
      );
      if (skinlineCount) setUniverseCount(skinlineCount, "—");
      const skinCount = source?.querySelector<HTMLElement>(
        "[data-runtime-universe-skin-count]",
      );
      if (skinCount) setUniverseCount(skinCount, "—");
      if (entitySkinCount) setUniverseCount(entitySkinCount, "—");
      if (skinChromaSummary) skinChromaSummary.hidden = true;
      if (skinChampionSummary) skinChampionSummary.hidden = true;
      if (skinNavigationGroup) skinNavigationGroup.hidden = true;
      for (const { summary } of skinRelationSummaries)
        if (summary) summary.hidden = true;
      if (skinlineUniverseSummary) skinlineUniverseSummary.hidden = true;
    },
    showRelationFailure(error, retry) {
      if (!relationSlot) return;
      relationSlot.hidden = false;
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
    showSkinlineSkinsFailure(error, retry) {
      if (!skinlineSkinsSlot) return;
      if (entitySkinCount) setUniverseCount(entitySkinCount, options.locale === "zh_cn" ? "— 款皮肤" : "— skins");
      const notice = textNode(
        "p",
        runtimeFailureMessage(error, options.locale),
        "runtime-relation-error",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent =
        options.locale === "zh_cn" ? "重试系列皮肤" : "Retry skinline skins";
      button.addEventListener("click", retry, { once: true });
      notice.append(" ", button);
      skinlineSkinsSlot.replaceChildren(notice);
    },
    showUniverseSkinsFailure(error, retry) {
      if (!universeSkinsSlot) return;
      universeSkinCollectionState = "failed";
      const skinCount = universeDetailSource?.querySelector<HTMLElement>(
        "[data-runtime-universe-skin-count]",
      );
      if (skinCount)
        setUniverseCount(
          skinCount,
          options.locale === "zh_cn" ? "— 款皮肤" : "— skins",
        );
      const notice = textNode(
        "p",
        runtimeFailureMessage(error, options.locale),
        "runtime-relation-error",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent =
        options.locale === "zh_cn" ? "重试宇宙皮肤" : "Retry universe skins";
      button.addEventListener("click", retry, { once: true });
      notice.append(" ", button);
      universeSkinsSlot.replaceChildren(notice);
    },
    showSupplementLoading(kind) {
      const slot = kind === "skinline" ? skinlineSkinsSlot : universeSkinsSlot;
      if (!slot || slot.querySelector(".runtime-skeleton")) return;
      const template = options.content
        .closest<HTMLElement>(".runtime-reference-root")
        ?.querySelector<HTMLTemplateElement>(
          `[data-runtime-supplement-skeleton-template="${kind}"]`,
        );
      if (template) slot.replaceChildren(template.content.cloneNode(true));
    },
  };
}
