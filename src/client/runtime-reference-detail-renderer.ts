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
  appendChromaCard,
  appendExternalAction,
  appendHistoricalArtwork,
  appendMedia,
  appendMediaCollection,
  appendMissingField,
  appendRarity,
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
  showSupplementLoading(kind: "skinline" | "universe"): void;
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

  const renderRelationStates = (
    state: RuntimePageState,
    entity: RuntimeEntity,
    target: DetailState,
  ): void => {
    if (!relationSlot) return;
    const definitions: readonly {
      readonly key: "relation-skinlines" | "relation-universes";
      readonly kind: "skinline" | "universe";
      readonly label: string;
    }[] =
      target.kind === "skin"
        ? [
            {
              key: "relation-skinlines",
              kind: "skinline",
              label: options.locale === "zh_cn" ? "皮肤系列" : "Skinlines",
            },
            {
              key: "relation-universes",
              kind: "universe",
              label: options.locale === "zh_cn" ? "皮肤宇宙" : "Universes",
            },
          ]
        : target.kind === "skinline"
          ? [
              {
                key: "relation-universes",
                kind: "universe",
                label: options.locale === "zh_cn" ? "所属宇宙" : "Universes",
              },
            ]
          : target.kind === "universe"
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
          group.appendChild(
            textNode(
              "p",
              options.locale === "zh_cn"
                ? "正在加载关联资料…"
                : "Loading related references…",
              "runtime-relation-state",
            ),
          );
        } else if (slot.status === "failed") {
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
      setRuntimeNoindex(true);
      options.updateChannel(state.channel);
      const controller = options.getController();
      const article = document.createElement("article");
      article.className = "runtime-detail";
      article.appendChild(
        textNode(
          "h1",
          item.name ?? runtimeMissingLabel(options.locale, "name"),
        ),
      );
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
        const sortSelect = document.createElement("select");
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
        controls.append(sortLabel);
        section.appendChild(controls);
        const grid = document.createElement("div");
        grid.className = "runtime-skin-reference-grid";
        const skinItems = projectChampionSkinListItems(item.id, item.skins);
        const renderSkinItems = () => {
          grid.replaceChildren();
          const sortedItems = sortSkinReferenceItems(
            skinItems,
            sortSelect.value === "rarity" ? "rarity" : "release",
          );
          if (!sortedItems.length) {
            appendMissingField(grid, options.locale, "thumbnail");
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
            meta.appendChild(textNode("span", skinName));
            appendRarity(meta, skin.rarity);
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
        const championLink = linkWithNavigation(
          item.championName ??
            (options.locale === "zh_cn"
              ? `英雄 #${item.championId}`
              : `Champion #${item.championId}`),
          hrefFor(
            options.locale,
            "champions",
            { id: item.championId, channel: state.channel },
            "detail",
            options.preservesExplicitPbe(),
          ),
          controller,
        );
        championLink.className = "runtime-relation-link";
        article.appendChild(championLink);

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
        const descriptionTerm = textNode(
          "dt",
          options.locale === "zh_cn" ? "描述" : "Description",
        );
        const descriptionValue = document.createElement("dd");
        if (item.description)
          descriptionValue.appendChild(
            textNode("p", item.description, "runtime-lede"),
          );
        else appendMissingField(descriptionValue, options.locale, "description");
        summary.append(descriptionTerm, descriptionValue);
        article.appendChild(summary);

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
        appendChromaCard(chromaGrid, {
          name: item.name ?? runtimeMissingLabel(options.locale, "name"),
          imageUrl: item.chromaImageUrl ?? item.media.tileUrl,
          isBase: true,
          locale: options.locale,
        });
        item.chromas.forEach((chroma) =>
          appendChromaCard(chromaGrid, {
            name: chroma.name ?? runtimeMissingLabel(options.locale, "name"),
            imageUrl: chroma.imageUrl,
            colors: chroma.colors,
            isBase: false,
            locale: options.locale,
          }),
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

        const relations = document.createElement("section");
        relations.className = "runtime-skin-relations";
        relations.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "所属关系" : "Related references",
          ),
        );
        relationSlot = document.createElement("div");
        relationSlot.className = "runtime-relation-state";
        relations.appendChild(relationSlot);
        article.appendChild(relations);
      } else if (item.kind === "skinline") {
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

        const skins = document.createElement("section");
        skins.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "宇宙内皮肤" : "Universe skins",
          ),
        );
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
        item.kind === "champion"
          ? ""
          : options.locale === "zh_cn"
            ? "资料加载完成"
            : "Reference loaded";
    },
    renderRelations(state, entity, target) {
      renderRelationStates(state, entity, target);
    },
    renderRelationsItems(items, state) {
      if (!relationSlot) return;
      if (!items.length) {
        if (state.kind === "universe") {
          universeSkinlineNames = new Map();
          if (universeSkinCollectionState === "ready") renderUniverseGroups?.();
        }
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "当前语言没有可显示的关联资料。"
            : "No related references are available in this language.";
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
      if (!skinlineSkinsSlot) return;
      skinlineSkinsSlot.replaceChildren();
      appendSkinReferenceGrid(
        skinlineSkinsSlot,
        items,
        options.locale,
        state.channel,
        options.getController(),
        options.preservesExplicitPbe(),
      );
    },
    renderUniverseSkins(groups) {
      universeSkinGroups = groups;
      universeSkinCollectionState = "ready";
      renderUniverseGroups?.();
    },
    showRelationFailure(error, retry) {
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
    showSkinlineSkinsFailure(error, retry) {
      if (!skinlineSkinsSlot) return;
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
      if (!slot) return;
      slot.replaceChildren(
        textNode(
          "p",
          kind === "skinline"
            ? options.locale === "zh_cn"
              ? "正在加载系列皮肤…"
              : "Loading skinline skins…"
            : options.locale === "zh_cn"
              ? "正在加载宇宙皮肤…"
              : "Loading universe skins…",
          "runtime-relation-state",
        ),
      );
    },
  };
}
