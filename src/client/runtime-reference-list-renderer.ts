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
import { buildPages } from "../components/pagination";

const PAGINATION_CHEVRON_LEFT = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
const PAGINATION_CHEVRON_RIGHT = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

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
  let universeListSkinlineNames = new Map<number, readonly string[]>();
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
        ? "runtime-grid runtime-champion-grid"
        : "runtime-grid";
      const pagination = document.createElement("nav");
      pagination.className = "cn-pagination runtime-pagination";
      pagination.setAttribute(
        "aria-label",
        options.locale === "zh_cn" ? "资料分页" : "Reference pages",
      );
      let currentPage = 1;
      const pageSize = 24;
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
            card.className = isChampionList
              ? "runtime-card runtime-champion-card"
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
              meta.appendChild(textNode("span", item.name));
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
              const meta = document.createElement("span");
              meta.className = "runtime-universe-meta";
              meta.appendChild(textNode("span", item.name));
              const series = document.createElement("span");
              series.className = "runtime-universe-skinlines";
              if (universeListRelationStatus === "failed") {
                series.className += " runtime-missing";
                series.textContent = runtimeMissingLabel(options.locale, "name");
              } else if (universeListRelationStatus === "ready") {
                const names = universeListSkinlineNames.get(item.id) ?? [];
                series.textContent = names.length
                  ? names.join(options.locale === "zh_cn" ? "、" : ", ")
                  : options.locale === "zh_cn"
                    ? "所属系列缺失"
                    : "No skinlines linked";
                if (!names.length) series.className += " runtime-missing";
              } else {
                series.textContent =
                  options.locale === "zh_cn"
                    ? "正在加载所属系列…"
                    : "Loading skinlines…";
              }
              series.setAttribute(
                "aria-label",
                options.locale === "zh_cn" ? "所属皮肤系列" : "Skinlines",
              );
              meta.appendChild(series);
              link.appendChild(meta);
            }
            card.appendChild(link);
            return card;
          }),
        );
        pagination.replaceChildren();
        if (pageCount > 1) {
          const isZh = options.locale === "zh_cn";
          const prevText = isZh ? "上一页" : "Previous";
          const nextText = isZh ? "下一页" : "Next";
          const list = document.createElement("ul");
          list.className = "cn-pagination-list";

          const addItem = (child: HTMLElement): void => {
            const li = document.createElement("li");
            li.className = "cn-pagination-item";
            li.append(child);
            list.append(li);
          };

          const addPageButton = (pageNumber: number): void => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = `cn-pagination-link${pageNumber === currentPage ? " is-active" : ""}`;
            if (pageNumber === currentPage) {
              button.setAttribute("aria-current", "page");
            }
            button.setAttribute("aria-label", `Page ${pageNumber}`);
            button.textContent = String(pageNumber);
            button.addEventListener("click", () => {
              currentPage = pageNumber;
              render();
            });
            addItem(button);
          };

          const addArrowButton = (pageNumber: number, label: string, className: string, chevron: string, chevronFirst: boolean): void => {
            const button = document.createElement("button");
            button.type = "button";
            button.className = className;
            button.setAttribute("aria-label", label);
            button.innerHTML = chevronFirst
              ? `${chevron}<span class="cn-pagination-text">${label}</span>`
              : `<span class="cn-pagination-text">${label}</span>${chevron}`;
            button.addEventListener("click", () => {
              currentPage = pageNumber;
              render();
            });
            addItem(button);
          };

          if (currentPage > 1)
            addArrowButton(currentPage - 1, prevText, "cn-pagination-link cn-pagination-previous", PAGINATION_CHEVRON_LEFT, true);

          for (const entry of buildPages(currentPage, pageCount)) {
            if (entry === "...") {
              const ellipsis = document.createElement("span");
              ellipsis.className = "cn-pagination-ellipsis";
              ellipsis.setAttribute("aria-hidden", "true");
              ellipsis.textContent = "…";
              addItem(ellipsis);
            } else {
              addPageButton(entry);
            }
          }

          if (currentPage < pageCount)
            addArrowButton(currentPage + 1, nextText, "cn-pagination-link cn-pagination-next", PAGINATION_CHEVRON_RIGHT, false);

          pagination.append(list);
        }
        options.status.textContent = filtered.length
          ? isChampionList
            ? options.locale === "zh_cn"
              ? `显示 ${filtered.length} 名英雄`
              : `${filtered.length} champions`
            : options.locale === "zh_cn"
              ? `显示第 ${currentPage}/${pageCount} 页，共 ${filtered.length} 条资料`
              : `Page ${currentPage}/${pageCount} · ${filtered.length} references`
          : options.locale === "zh_cn"
            ? "没有匹配结果"
            : "No matching references";
      };
      search.addEventListener("input", () => {
        currentPage = 1;
        render();
      });
      sort.addEventListener("change", () => {
        currentPage = 1;
        render();
      });
      roleFilter?.addEventListener("change", () => {
        currentPage = 1;
        render();
      });
      options.content.replaceChildren(
        toolbar,
        ...(relationStatus ? [relationStatus] : []),
        grid,
        pagination,
      );
      renderListCards = render;
      render();
    },
    listRelationsLoading() {
      universeListRelationStatus = "loading";
      if (universeListRelationStatusElement)
        universeListRelationStatusElement.textContent =
          options.locale === "zh_cn"
            ? "正在加载所属系列…"
            : "Loading skinline names…";
      renderListCards?.();
    },
    renderRelations(items) {
      const skinlines = new Map(
        items
          .filter((item) => item.kind === "skinline")
          .map((item) => [item.id, item.name] as const),
      );
      universeListSkinlineNames = new Map(
        renderedUniverseListItems.map((item) => [
          item.id,
          item.skinlineIds
            .map((id) => skinlines.get(id))
            .filter((name): name is string => Boolean(name)),
        ]),
      );
      universeListRelationStatus = "ready";
      if (universeListRelationStatusElement)
        universeListRelationStatusElement.textContent =
          options.locale === "zh_cn"
            ? "所属系列已加载"
            : "Skinline names loaded";
      renderListCards?.();
    },
    listRelationsFailure(error, retry) {
      universeListRelationStatus = "failed";
      if (universeListRelationStatusElement) {
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
