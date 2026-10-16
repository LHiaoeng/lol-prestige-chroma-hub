import type {
  CommunityDragonRuntimeError,
  CommunityDragonLocale,
  RuntimeList,
  RuntimeListKind,
} from "../domain/communitydragon-runtime";
import type {
  RuntimeLocationState,
  RuntimePage,
} from "./runtime-reference";
import type { RuntimeControllerLike } from "./runtime-reference-view";
import {
  appendMedia,
  appendMissingField,
  championRoleOptions,
  hrefFor,
  linkWithNavigation,
  roleLabel,
  runtimeMissingLabel,
  setRuntimeNoindex,
  textNode,
} from "./runtime-reference-view-shared";
import { runtimeFailureMessage } from "./communitydragon-errors";
import { createTree, type TreeNode } from "../components/Tree";
import { createDomainIcon } from "../components/domain-icons";

export interface RuntimeListRendererOptions {
  readonly content: HTMLElement;
  readonly status: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly page: RuntimeListKind;
  readonly getController: () => RuntimeControllerLike;
  readonly preservesExplicitPbe: () => boolean;
  readonly updateChannel: (channel: "pbe" | "latest") => void;
}

export interface RuntimeListRenderer {
  render(
    items: RuntimeList,
    state: Extract<RuntimeLocationState, { mode: "list" }>,
  ): void;
  listRelationsLoading(): void;
  renderRelations(items: RuntimeList): void;
  listRelationsFailure(error: CommunityDragonRuntimeError, retry: () => void): void;
}

export function createRuntimeListRenderer(
  options: RuntimeListRendererOptions,
): RuntimeListRenderer {
  const emptyTemplate = options.content
    .closest<HTMLElement>(".runtime-reference-root")
    ?.querySelector<HTMLTemplateElement>("[data-runtime-empty-template]");
  let universeListSkinlineNames = new Map<
    number,
    readonly { readonly id: number; readonly name: string }[]
  >();
  let skinlineUniverseNames = new Map<number, string>();
  let universeListRelationStatus: "loading" | "ready" | "failed" = "ready";
  let universeListRelationStatusElement: HTMLElement | undefined;
  let renderedUniverseListItems: readonly Extract<
    RuntimeList[number],
    { kind: "universe" }
  >[] = [];
  let renderListCards: (() => void) | undefined;

  return {
    render(items, state) {
      universeListSkinlineNames = new Map();
      skinlineUniverseNames = new Map();
      universeListRelationStatus =
        options.page === "universes" ? "loading" : "ready";
      universeListRelationStatusElement = undefined;
      renderedUniverseListItems = items.filter(
        (item): item is Extract<RuntimeList[number], { kind: "universe" }> =>
          item.kind === "universe",
      );
      setRuntimeNoindex(false);
      options.updateChannel(state.channel);
      options.status.textContent =
        options.locale === "zh_cn"
          ? `已加载 ${items.length} 条资料`
          : `${items.length} references loaded`;

      const controller = options.getController();
      const isChampionList = options.page === "champions";
      const toolbar = document.createElement("div");
      toolbar.className = "runtime-toolbar";
      let roleFilter: HTMLSelectElement | undefined;
      const search = document.createElement("input");
      search.className = "cn-input";
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
      toolbar.append(searchLabel);
      if (isChampionList) {
        const select = document.createElement("select");
        select.className = "cn-select";
        roleFilter = select;
        select.id = "runtime-champions-role";
        select.setAttribute(
          "aria-label",
          options.locale === "zh_cn" ? "英雄职业" : "Champion role",
        );
        championRoleOptions.forEach(([value, enLabel, zhLabel]) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent = options.locale === "zh_cn" ? zhLabel : enLabel;
          select.appendChild(option);
        });
        const roleLabelElement = document.createElement("label");
        roleLabelElement.className = "runtime-toolbar-field";
        roleLabelElement.htmlFor = select.id;
        roleLabelElement.append(
          textNode("span", options.locale === "zh_cn" ? "职业" : "Role"),
          select,
        );
        toolbar.append(roleLabelElement);
      }
      const sort = document.createElement("select");
      sort.className = "cn-select";
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
      toolbar.append(sortLabel);
      const grid = document.createElement("div");
      grid.className = isChampionList
        ? "ant-masonry runtime-grid runtime-champion-grid"
        : "ant-masonry runtime-grid";
      const relationStatus =
        options.page === "universes"
          ? textNode(
              "p",
              options.locale === "zh_cn"
                ? "正在加载所属系列…"
                : "Loading skinline names…",
              "runtime-relation-state",
            )
          : undefined;
      if (relationStatus) relationStatus.hidden = true;
      universeListRelationStatusElement = relationStatus;
      const render = () => {
        const query = search.value.trim().toLocaleLowerCase();
        const role = roleFilter?.value ?? "";
        const filtered = items
          .filter(
            (item) => !query || item.name.toLocaleLowerCase().includes(query),
          )
          .filter(
            (item) =>
              !role ||
              (item.kind === "champion" && item.roles?.includes(role) === true),
          )
          .slice()
          .sort((left, right) => {
            if (sort.value === "id")
              return left.id - right.id || left.name.localeCompare(right.name);
            return left.name.localeCompare(right.name) || left.id - right.id;
          });
        grid.replaceChildren(
          ...filtered.map((item) => {
            const page: RuntimePage =
              item.kind === "champion"
                ? "champions"
                : item.kind === "skinline"
                  ? "skinlines"
                  : "universes";
            const card = document.createElement("article");
            card.className = isChampionList
              ? "runtime-card runtime-champion-card"
              : item.kind === "skinline"
                ? "runtime-card runtime-skinline-card"
                : "runtime-card";
            const link = linkWithNavigation(
              isChampionList || item.kind === "universe" ? "" : item.name,
              hrefFor(
                options.locale,
                page,
                { id: item.id, channel: state.channel },
                "detail",
                options.preservesExplicitPbe(),
              ),
              controller,
              isChampionList
                ? "runtime-card-link runtime-champion-link"
                : "runtime-card-link",
            );
            if (
              item.kind === "champion" ||
              item.kind === "skinline" ||
              item.kind === "universe"
            ) {
              const mediaParent = isChampionList ? link : card;
              const mediaUrl =
                item.kind === "champion" ? item.portraitUrl : undefined;
              if (mediaUrl) {
                appendMedia(
                  mediaParent,
                  mediaUrl,
                  item.name,
                  isChampionList ? "runtime-champion-portrait" : undefined,
                );
              } else if (isChampionList && item.kind === "champion") {
                appendMissingField(mediaParent, options.locale, "portrait");
              }
            }
            if (isChampionList && item.kind === "champion") {
              const meta = document.createElement("span");
              meta.className = "runtime-champion-meta";
              meta.appendChild(textNode("span", item.name, "runtime-champion-name"));
              const roles = document.createElement("span");
              roles.className = "runtime-champion-roles";
              roles.setAttribute(
                "aria-label",
                options.locale === "zh_cn" ? "英雄定位" : "Champion roles",
              );
              const roleNames = item.roles?.filter(Boolean).map((role) =>
                roleLabel(role, options.locale),
              );
              roles.textContent = roleNames?.length
                ? roleNames.join(options.locale === "zh_cn" ? "、" : ", ")
                : runtimeMissingLabel(options.locale, "roles");
              if (!roleNames?.length) roles.className += " runtime-missing";
              meta.appendChild(roles);
              link.appendChild(meta);
            } else if (item.kind === "universe") {
              const skinlines = universeListSkinlineNames.get(item.id) ?? [];
              type UniverseTreeNode = TreeNode & {
                readonly id?: number;
                readonly kind: "universe" | "skinline" | "status";
              };
              const childNodes: UniverseTreeNode[] =
                universeListRelationStatus === "ready" && skinlines.length
                  ? skinlines.map(({ id, name }) => ({ id, title: name, kind: "skinline" }))
                  : [{
                      title:
                        universeListRelationStatus === "loading"
                          ? options.locale === "zh_cn" ? "正在加载所属系列…" : "Loading skinlines…"
                          : options.locale === "zh_cn" ? "所属系列缺失" : "No skinlines linked",
                      kind: "status",
                    }];
              const treeNodes: UniverseTreeNode[] = [
                { title: item.name, kind: "universe", children: childNodes },
              ];
              const tree = createTree(
                treeNodes,
                {
                  label: options.locale === "zh_cn" ? "宇宙层级关系" : "Universe relationships",
                  expandable: false,
                  renderIcon: (node) => {
                    if (node.kind === "status") return undefined;
                    return createDomainIcon(
                      node.kind === "universe" ? "universes" : "skinlines",
                    );
                  },
                  renderTitle: (node) => {
                    if (node.kind === "universe") {
                      link.textContent = node.title;
                      link.className = "ant-tree-title runtime-universe-title";
                      return link;
                    }
                    if (node.kind === "status")
                      return textNode("span", node.title, "ant-tree-title runtime-missing");
                    return linkWithNavigation(
                      node.title,
                      hrefFor(
                        options.locale,
                        "skinlines",
                        { id: node.id, channel: state.channel },
                        "detail",
                        options.preservesExplicitPbe(),
                      ),
                      controller,
                      "ant-tree-title",
                    );
                  },
                  expandLabel: (title, expanded) =>
                    options.locale === "zh_cn"
                      ? `${expanded ? "收起" : "展开"}${title}`
                      : `${expanded ? "Collapse" : "Expand"} ${title}`,
                },
              );
              card.classList.add("runtime-universe-card");
              const meta = document.createElement("div");
              meta.className = "runtime-universe-meta";
              meta.append(tree);
              card.append(meta);
              return card;
            } else if (item.kind === "skinline") {
              card.appendChild(link);
              const universeLinks = item.universeIds.flatMap((id) => {
                const name = skinlineUniverseNames.get(id);
                if (!name) return [];
                return [
                  linkWithNavigation(
                    name,
                    hrefFor(
                      options.locale,
                      "universes",
                      { id, channel: state.channel },
                      "detail",
                      options.preservesExplicitPbe(),
                    ),
                    controller,
                    "runtime-chip runtime-skinline-universe",
                  ),
                ];
              });
              if (universeLinks.length) {
                const meta = document.createElement("div");
                meta.className = "runtime-skinline-universes";
                meta.append(...universeLinks);
                card.append(meta);
              }
              return card;
            }
            card.appendChild(link);
            return card;
          }),
        );
        if (!filtered.length && emptyTemplate)
          grid.append(emptyTemplate.content.cloneNode(true));
        const count = options.status
          .closest<HTMLElement>(".runtime-page")
          ?.querySelector<HTMLElement>("[data-runtime-list-count]");
        if (count) {
          count.textContent = options.locale === "zh_cn"
            ? options.page === "champions"
              ? `${filtered.length} 名英雄`
              : options.page === "skinlines"
                ? `${filtered.length} 个系列`
                : `${filtered.length} 个宇宙`
            : options.page === "champions"
              ? `${filtered.length} champions`
              : options.page === "skinlines"
                ? `${filtered.length} skinlines`
                : `${filtered.length} universes`;
          count.hidden = false;
        }
        options.status.textContent = filtered.length
          ? ""
          : emptyTemplate
            ? ""
            : options.locale === "zh_cn"
              ? "没有匹配结果"
              : "No matching references";
      };
      search.addEventListener("input", () => {
        render();
      });
      sort.addEventListener("change", () => {
        render();
      });
      roleFilter?.addEventListener("change", () => {
        render();
      });
      options.content.replaceChildren(
        ...(items.length ? [toolbar] : []),
        ...(relationStatus ? [relationStatus] : []),
        grid,
      );
      renderListCards = render;
      render();
    },
    listRelationsLoading() {
      universeListRelationStatus = "loading";
      if (universeListRelationStatusElement) {
        universeListRelationStatusElement.hidden = true;
        universeListRelationStatusElement.textContent =
          options.locale === "zh_cn"
            ? "正在加载所属系列…"
            : "Loading skinline names…";
      }
      renderListCards?.();
    },
    renderRelations(items) {
      if (options.page === "skinlines") {
        skinlineUniverseNames = new Map(
          items
            .filter(
              (item): item is Extract<RuntimeList[number], { kind: "universe" }> =>
                item.kind === "universe",
            )
            .map(({ id, name }) => [id, name] as const),
        );
        renderListCards?.();
        return;
      }
      const skinlines = new Map(
        items
          .filter((item) => item.kind === "skinline")
          .map((item) => [item.id, item.name] as const),
      );
      universeListSkinlineNames = new Map(
        renderedUniverseListItems.map((item) => [
          item.id,
          item.skinlineIds
            .flatMap((id) => {
              const name = skinlines.get(id);
              return name ? [{ id, name }] : [];
            }),
        ]),
      );
      universeListRelationStatus = "ready";
      if (universeListRelationStatusElement) {
        universeListRelationStatusElement.textContent = "";
        universeListRelationStatusElement.hidden = true;
      }
      renderListCards?.();
    },
    listRelationsFailure(error, retry) {
      universeListRelationStatus = "failed";
      if (universeListRelationStatusElement) {
        universeListRelationStatusElement.hidden = false;
        universeListRelationStatusElement.replaceChildren(
          textNode(
            "span",
            runtimeFailureMessage(error, options.locale),
            "runtime-relation-error",
          ),
        );
        const button = document.createElement("button");
        button.type = "button";
        button.className = "runtime-retry";
        button.textContent =
          options.locale === "zh_cn"
            ? "重试所属系列"
            : "Retry skinline names";
        button.addEventListener("click", retry, { once: true });
        universeListRelationStatusElement.append(" ", button);
      }
      renderListCards?.();
    },
  };
}
