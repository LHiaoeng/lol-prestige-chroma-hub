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
} from "../domain/skin-reference-projection";
import { relatedRuntimeItems } from "../domain/runtime-relations";
import { isRuntimeEntityId } from "../domain/runtime-url-state";
import { runtimeSkinActions } from "../domain/detail-actions";
import type {
  RuntimeLocationState,
  RuntimePageState,
} from "./runtime-reference";
import type { RuntimeControllerLike } from "./runtime-reference-view";
import {
  appendExternalAction,
  appendBorderModule,
  appendHistoricalArtwork,
  appendMedia,
  appendMediaCollection,
  appendMissingField,
  appendRarity,
  appendSkinReferenceTitle,
  appendSkinReferenceGrid,
  appendUniverseSkinGroups,
  hasRenderableRarity,
  hrefFor,
  linkWithNavigation,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import { runtimeFailureMessage } from "./communitydragon-errors";
import { createChromaCard } from "../components/chroma-card/chroma-card";
import { createDomainIcon } from "../components/domain-icons";
import { bindImageFallbacks } from "./image-fallback";

type DetailState = Extract<RuntimeLocationState, { mode: "detail" }>;

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
  element.className = "runtime-list-count";
  element.removeAttribute("aria-hidden");
  element.textContent = value;
}

export function createRuntimeDetailRenderer(
  options: RuntimeDetailRendererOptions,
): RuntimeDetailRenderer {
  let relationSlot: HTMLElement | undefined;
  let skinlineSkinsSlot: HTMLElement | undefined;
  let universeSkinsSlot: HTMLElement | undefined;
  let universeSkinGroups: readonly RuntimeSkinReferenceGroup[] = [];
  let universeSkinCollectionState: "loading" | "ready" | "failed" = "loading";
  let universeSkinlineNames = new Map<number, string>();
  let renderUniverseGroups: (() => void) | undefined;
  let updateChampionSkinlines: ((items: RuntimeList) => void) | undefined;
  let updateSkinlineChampionNames: ((items: RuntimeList) => void) | undefined;
  let entityDetailSource: HTMLElement | undefined;
  let entityDetailDivider: HTMLElement | undefined;
  let universeDetailSource: HTMLElement | undefined;
  let universeDetailDivider: HTMLElement | undefined;
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
    const relationLabel = kind === "skinline"
      ? options.locale === "zh_cn" ? "系列" : "Skinline"
      : options.locale === "zh_cn" ? "宇宙" : "Universe";
    relations.forEach((item) => {
      const link = linkWithNavigation(
        item.name,
        hrefFor(options.locale, page, { id: item.id, channel: target.channel }, "detail", options.preservesExplicitPbe()),
        options.getController(),
        "runtime-entity-relation-link",
      );
      link.setAttribute("aria-label", `${relationLabel}: ${item.name}`);
      links.appendChild(link);
    });
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
    if (target.kind === "champion") {
      const slot = state.slots["relation-skinlines"];
      if (slot?.status === "ready" || slot?.status === "empty")
        updateChampionSkinlines?.(slot.value);
      return;
    }
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
      relationSlot = undefined;
      skinlineSkinsSlot = undefined;
      universeSkinsSlot = undefined;
      universeSkinGroups = [];
      universeSkinCollectionState = "loading";
      renderUniverseGroups = undefined;
      universeSkinlineNames = new Map();
      updateChampionSkinlines = undefined;
      updateSkinlineChampionNames = undefined;
      if (item.kind === "skin") {
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
      const title = textNode(
        "h1",
        item.name ?? runtimeMissingLabel(options.locale, "name"),
      );
      if (
        item.kind === "champion" ||
        item.kind === "skin" ||
        item.kind === "skinline"
      ) {
        article.classList.add("runtime-detail--entity");
        title.prepend(createDomainIcon(
          item.kind === "champion" ? "champions" : item.kind === "skin" ? "skins" : "skinlines",
        ));
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
        article.appendChild(textNode("p", item.shortBio, "runtime-lede"));
      if (item.kind === "skin" && item.description)
        article.appendChild(textNode("p", item.description, "runtime-lede"));
      if (item.kind === "skinline" && item.description)
        article.appendChild(textNode("p", item.description, "runtime-lede"));
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
        section.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "皮肤资料" : "Skin references",
          ),
        );
        const controls = document.createElement("div");
        controls.className = "runtime-toolbar runtime-skin-reference-controls";
        const skinlineSelect = document.createElement("select");
        skinlineSelect.className = "cn-select";
        skinlineSelect.id = "runtime-champion-skinline-filter";
        skinlineSelect.setAttribute("aria-label", options.locale === "zh_cn" ? "系列筛选" : "Filter by skinline");
        const allSkinlines = document.createElement("option");
        allSkinlines.value = "";
        allSkinlines.textContent = options.locale === "zh_cn" ? "全部系列" : "All skinlines";
        skinlineSelect.appendChild(allSkinlines);
        const skinlineLabel = document.createElement("label");
        skinlineLabel.className = "runtime-toolbar-field";
        skinlineLabel.htmlFor = skinlineSelect.id;
        skinlineLabel.append(textNode("span", options.locale === "zh_cn" ? "系列" : "Skinline"), skinlineSelect);
        const sortSelect = document.createElement("select");
        sortSelect.className = "cn-select";
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
        controls.append(skinlineLabel, sortLabel);
        section.appendChild(controls);
        const grid = document.createElement("div");
        grid.className = "runtime-skin-reference-grid";
        const skinItems = projectChampionSkinListItems(item.id, item.skins);
        const skinlineIds = [...new Set(skinItems.flatMap((skin) => skin.skinlineIds))].sort((a, b) => a - b);
        for (const id of skinlineIds) {
          const option = document.createElement("option");
          option.value = String(id);
          option.textContent = options.locale === "zh_cn" ? `系列 #${id}` : `Skinline #${id}`;
          skinlineSelect.appendChild(option);
        }
        if (!skinlineIds.length) skinlineLabel.hidden = true;
        updateChampionSkinlines = (items) => {
          const names = new Map(items.filter((entry) => entry.kind === "skinline").map((entry) => [entry.id, entry.name] as const));
          for (const option of [...skinlineSelect.options].slice(1))
            option.textContent = names.get(Number(option.value)) ?? option.textContent;
          const selected = skinlineSelect.value;
          skinlineSelect.append(...[...skinlineSelect.options].slice(1).sort((a, b) => a.text.localeCompare(b.text, options.locale === "zh_cn" ? "zh-CN" : "en")));
          skinlineSelect.value = selected;
        };
        if (entitySkinCount) setUniverseCount(entitySkinCount, options.locale === "zh_cn" ? `${skinItems.length} 款皮肤` : `${skinItems.length} skins`);
        if (!skinItems.length) controls.remove();
        const renderSkinItems = () => {
          grid.replaceChildren();
          const sortedItems = sortSkinReferenceItems(
            skinItems.filter((skin) => !skinlineSelect.value || skin.skinlineIds.includes(Number(skinlineSelect.value))),
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
                  id: skin.skinId,
                  championId: item.id,
                  stageId: skin.stageId,
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
        skinlineSelect.addEventListener("change", renderSkinItems);
        renderSkinItems();
        section.appendChild(grid);
        article.appendChild(section);
      } else if (item.kind === "skin") {
        if (skinChampionSummary) skinChampionSummary.hidden = false;
        if (skinChampionSlot) {
          skinChampionSlot.className = "";
          skinChampionSlot.removeAttribute("aria-hidden");
        }
        const championLink = linkWithNavigation(
          item.championName ?? (options.locale === "zh_cn" ? `英雄 #${item.championId}` : `Champion #${item.championId}`),
          hrefFor(options.locale, "champions", { id: item.championId, channel: state.channel }, "detail", options.preservesExplicitPbe()),
          controller,
          "runtime-entity-relation-link",
        );
        championLink.setAttribute("aria-label", `${options.locale === "zh_cn" ? "英雄" : "Champion"}：${championLink.textContent}`);
        skinChampionSlot?.replaceChildren(championLink);

        const summary = document.createElement("dl");
        summary.className = "runtime-skin-summary";
        if (hasRenderableRarity(item.rarity)) {
          const rarityTerm = textNode(
            "dt",
            options.locale === "zh_cn" ? "稀有度" : "Rarity",
          );
          const rarityValue = document.createElement("dd");
          appendRarity(rarityValue, item.rarity);
          summary.append(rarityTerm, rarityValue);
        }
        if (summary.childElementCount) article.appendChild(summary);

        const mediaSection = document.createElement("section");
        mediaSection.className = "runtime-skin-media";
        mediaSection.appendChild(
          textNode("h2", options.locale === "zh_cn" ? "媒体" : "Media"),
        );
        const mediaGrid = document.createElement("div");
        mediaGrid.className = "runtime-media-grid";
        if (
          appendMediaCollection(
            mediaGrid,
            item.media,
            options.locale,
            item.name ?? runtimeMissingLabel(options.locale, "name"),
          ) === 0
        )
          appendMissingField(mediaGrid, options.locale, "artwork");
        mediaSection.appendChild(mediaGrid);
        article.appendChild(mediaSection);

        appendBorderModule(
          article,
          item.media,
          options.locale,
          item.name ?? runtimeMissingLabel(options.locale, "name"),
        );

        const historicalArt = item.historicalArt ?? [];
        if (historicalArt.length) {
          const historySection = document.createElement("section");
          historySection.className = "runtime-skin-history";
          historySection.appendChild(
            textNode(
              "h2",
              options.locale === "zh_cn" ? "历史版本原画" : "Historical artwork",
            ),
          );
          appendHistoricalArtwork(
            historySection,
            historicalArt,
            options.locale,
            item.name ?? runtimeMissingLabel(options.locale, "name"),
          );
          article.appendChild(historySection);
        }

        if (item.stages.length) {
          const stages = document.createElement("section");
          stages.className = "runtime-skin-stages";
          stages.appendChild(
            textNode("h2", options.locale === "zh_cn" ? "阶段" : "Stages"),
          );
          for (const stage of item.stages) {
            const stageName =
              stage.name ?? runtimeMissingLabel(options.locale, "name");
            const stageItem = document.createElement("article");
            stageItem.className = "runtime-stage-item";
            const stageHeading = document.createElement("h3");
            if (isRuntimeEntityId(stage.id)) {
              stageHeading.appendChild(
                linkWithNavigation(
                  stageName,
                  hrefFor(
                    options.locale,
                    "skins",
                    {
                      id: item.id,
                      championId: item.championId,
                      stageId: stage.id,
                      channel: state.channel,
                    },
                    "detail",
                    options.preservesExplicitPbe(),
                  ),
                  controller,
                ),
              );
            } else {
              stageHeading.appendChild(textNode("span", stageName));
            }
            stageItem.appendChild(stageHeading);
            const stageMedia = document.createElement("div");
            stageMedia.className = "runtime-media-grid runtime-stage-media";
            if (
              appendMediaCollection(stageMedia, stage.media, options.locale, stageName) ===
              0
            )
              appendMissingField(stageMedia, options.locale, "artwork");
            stageItem.appendChild(stageMedia);
            stages.appendChild(stageItem);
          }
          article.appendChild(stages);
        }

        const chromas = document.createElement("section");
        chromas.className = "runtime-skin-chromas";
        const chromaHeading = document.createElement("h2");
        chromaHeading.append(
          textNode("span", options.locale === "zh_cn" ? "炫彩" : "Chromas"),
          textNode("span", String(item.chromas.length), "runtime-chroma-count"),
        );
        chromas.appendChild(chromaHeading);
        const chromaGrid = document.createElement("div");
        chromaGrid.className = "runtime-chroma-grid";
        chromaGrid.appendChild(
          createChromaCard({
            name: item.name ?? runtimeMissingLabel(options.locale, "name"),
            imageUrl: item.chromaImageUrl ?? item.media.tileUrl,
            isBase: true,
            locale: options.locale,
          }),
        );
        item.chromas.forEach((chroma) =>
          chromaGrid.appendChild(
            createChromaCard({
              name: chroma.name ?? runtimeMissingLabel(options.locale, "name"),
              imageUrl: chroma.imageUrl,
              colors: chroma.colors,
              isBase: false,
              locale: options.locale,
            }),
          ),
        );
        chromas.appendChild(chromaGrid);
        article.appendChild(chromas);

        const actions = runtimeSkinActions(options.locale, item);
        if (actions.length) {
          const actionSection = document.createElement("section");
          actionSection.className = "runtime-skin-actions";
          actionSection.appendChild(
            textNode(
              "h2",
              options.locale === "zh_cn" ? "第三方入口" : "External references",
            ),
          );
          const actionLinks = document.createElement("div");
          actionLinks.className = "runtime-links";
          actions.forEach((action) => appendExternalAction(actionLinks, action));
          actionSection.appendChild(actionLinks);
          article.appendChild(actionSection);
        }

      } else if (item.kind === "skinline") {
        const skins = document.createElement("section");
        skins.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "系列内皮肤" : "Skins in this skinline",
          ),
        );
        skinlineSkinsSlot = document.createElement("div");
        skinlineSkinsSlot.className = "runtime-skinline-skins-state";
        skins.appendChild(skinlineSkinsSlot);
        article.appendChild(skins);
      } else {
        if (item.description)
          article.appendChild(textNode("p", item.description, "runtime-lede"));
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
      const previousChampion = skinlineSkinsSlot.querySelector<HTMLSelectElement>("#runtime-skinline-champion-filter")?.value;
      const previousSort = skinlineSkinsSlot.querySelector<HTMLSelectElement>("#runtime-skinline-skins-sort")?.value;
      const controls = document.createElement("div");
      controls.className = "runtime-toolbar runtime-skin-reference-controls";
      const championSelect = document.createElement("select");
      championSelect.className = "cn-select";
      championSelect.id = "runtime-skinline-champion-filter";
      championSelect.setAttribute("aria-label", options.locale === "zh_cn" ? "英雄筛选" : "Filter by champion");
      const allChampions = document.createElement("option");
      allChampions.value = "";
      allChampions.textContent = options.locale === "zh_cn" ? "全部英雄" : "All champions";
      championSelect.appendChild(allChampions);
      const champions = new Map(items.map((skin) => [skin.championId, skin.championName ?? (options.locale === "zh_cn" ? `英雄 #${skin.championId}` : `Champion #${skin.championId}`)]));
      [...champions].sort((a, b) => a[1].localeCompare(b[1], options.locale === "zh_cn" ? "zh-CN" : "en")).forEach(([id, name]) => {
        const option = document.createElement("option");
        option.value = String(id);
        option.textContent = name;
        championSelect.appendChild(option);
      });
      if (previousChampion && champions.has(Number(previousChampion))) championSelect.value = previousChampion;
      let championNames = new Map<number, string>();
      const championLabel = document.createElement("label");
      championLabel.className = "runtime-toolbar-field";
      championLabel.htmlFor = championSelect.id;
      championLabel.append(textNode("span", options.locale === "zh_cn" ? "英雄" : "Champion"), championSelect);
      const sortSelect = document.createElement("select");
      sortSelect.className = "cn-select";
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
      controls.append(championLabel, sortLabel);
      const results = document.createElement("div");
      const renderSkins = () => {
        results.replaceChildren();
        const filtered = items.filter((skin) => !championSelect.value || skin.championId === Number(championSelect.value));
        const sorted = sortSelect.value === "rarity"
          ? sortSkinReferenceItems(filtered, "rarity")
          : [...filtered].sort((a, b) =>
              (championNames.get(a.championId) ?? a.championName ?? "").localeCompare(championNames.get(b.championId) ?? b.championName ?? "", options.locale === "zh_cn" ? "zh-CN" : "en") ||
              (a.name ?? "").localeCompare(b.name ?? "", options.locale === "zh_cn" ? "zh-CN" : "en"),
            );
        appendSkinReferenceGrid(results, sorted, options.locale, state.channel, options.getController(), options.preservesExplicitPbe(), undefined, true);
      };
      updateSkinlineChampionNames = (references) => {
        championNames = new Map(references.filter((entry) => entry.kind === "champion").map((entry) => [entry.id, entry.name] as const));
        for (const option of [...championSelect.options].slice(1))
          option.textContent = championNames.get(Number(option.value)) ?? option.textContent;
        const selected = championSelect.value;
        championSelect.append(...[...championSelect.options].slice(1).sort((a, b) => a.text.localeCompare(b.text, options.locale === "zh_cn" ? "zh-CN" : "en")));
        championSelect.value = selected;
        renderSkins();
      };
      championSelect.addEventListener("change", renderSkins);
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
      if (skinChampionSummary) skinChampionSummary.hidden = true;
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
