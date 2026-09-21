import {
  type CommunityDragonLocale,
  type RuntimeHistoricalArtwork,
  type RuntimeList,
  type RuntimeMedia,
} from "../domain/communitydragon-runtime";
import { communityDragonChannelLabel } from "../domain/communitydragon-url";
import { projectChampionSkinReferenceItems } from "../domain/skin-reference-projection";
import { localizedPath } from "../i18n/config";
import { runtimeFailureMessage } from "./communitydragon-errors";
import {
  bindRuntimeChannelLinks,
  bindRuntimeLanguageToggle,
} from "./runtime-url-state";
import type {
  RuntimeHistory,
  RuntimePage,
  RuntimeView,
} from "./runtime-reference";

export interface RuntimeControllerLike {
  navigate(url: URL): Promise<void>;
}

export interface DomRuntimeViewOptions {
  readonly root: HTMLElement;
  readonly source: HTMLElement;
  readonly locale: CommunityDragonLocale;
  readonly page: RuntimePage;
  readonly getController: () => RuntimeControllerLike;
  readonly history: RuntimeHistory;
}

export function browserHistory(): RuntimeHistory {
  return {
    get url() {
      return new URL(window.location.href);
    },
    push(url) {
      window.history.pushState({}, "", url);
    },
    replace(url) {
      window.history.replaceState({}, "", url);
    },
    onPopState(listener) {
      window.addEventListener("popstate", listener);
      return () => window.removeEventListener("popstate", listener);
    },
  };
}

function textNode(
  tag: keyof HTMLElementTagNameMap,
  value: string,
  className?: string,
): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

function runtimePath(
  locale: CommunityDragonLocale,
  page: RuntimePage,
  mode: "list" | "detail" = "list",
): string {
  const suffix = mode === "detail" ? "/detail/" : "/";
  return localizedPath(
    locale === "zh_cn" ? "zh-cn" : "en",
    `/${page}${suffix}`,
  );
}

function hrefFor(
  locale: CommunityDragonLocale,
  page: RuntimePage,
  values: {
    id?: number;
    championId?: number;
    stageId?: number;
    channel: "pbe" | "latest";
  },
  mode: "list" | "detail" = "list",
  preserveExplicitPbe = false,
): URL {
  const url = new URL(runtimePath(locale, page, mode), window.location.origin);
  if (values.id) url.searchParams.set("id", String(values.id));
  if (values.championId)
    url.searchParams.set("champion", String(values.championId));
  if (values.stageId) url.searchParams.set("stage", String(values.stageId));
  if (values.channel === "latest" || preserveExplicitPbe)
    url.searchParams.set("channel", values.channel);
  return url;
}

export function shouldHandleRuntimeNavigation(
  url: URL,
  currentPathname: string,
): boolean {
  return url.pathname === currentPathname;
}

function linkWithNavigation(
  label: string,
  url: URL,
  controller: RuntimeControllerLike,
  className = "runtime-chip",
): HTMLAnchorElement {
  const link = document.createElement("a");
  link.className = className;
  link.href = `${url.pathname}${url.search}`;
  link.textContent = label;
  link.addEventListener("click", (event) => {
    if (!shouldHandleRuntimeNavigation(url, window.location.pathname)) return;
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    void controller.navigate(url);
  });
  return link;
}

function appendMedia(
  parent: HTMLElement,
  url: string | undefined,
  alt: string,
  className?: string,
): void {
  if (!url) return;
  const image = document.createElement("img");
  if (className) image.className = className;
  image.src = url;
  image.alt = alt;
  image.loading = "lazy";
  image.decoding = "async";
  image.addEventListener("error", () => image.remove(), { once: true });
  parent.appendChild(image);
}

const championRoleOptions = [
  ["", "All", "全部"],
  ["assassin", "Assassin", "刺客"],
  ["fighter", "Fighter", "战士"],
  ["mage", "Mage", "法师"],
  ["marksman", "Marksman", "射手"],
  ["support", "Support", "辅助"],
  ["tank", "Tank", "坦克"],
] as const;

type MissingRuntimeField =
  | "name"
  | "description"
  | "artwork"
  | "portrait"
  | "thumbnail"
  | "rarity"
  | "roles";

function runtimeMissingLabel(
  locale: CommunityDragonLocale,
  field: MissingRuntimeField,
): string {
  if (locale === "zh_cn") {
    return {
      name: "名称缺失",
      description: "描述缺失",
      artwork: "原画缺失",
      portrait: "头像缺失",
      thumbnail: "缩略图缺失",
      rarity: "稀有度缺失",
      roles: "定位缺失",
    }[field];
  }
  return {
    name: "Name unavailable",
    description: "Description unavailable",
    artwork: "Artwork unavailable",
    portrait: "Portrait unavailable",
    thumbnail: "Thumbnail unavailable",
    rarity: "Rarity unavailable",
    roles: "Role data unavailable",
  }[field];
}

function roleLabel(role: string, locale: CommunityDragonLocale): string {
  const option = championRoleOptions.find(([value]) => value === role);
  if (!option) return role;
  return locale === "zh_cn" ? option[2] : option[1];
}

function appendMissingField(
  parent: HTMLElement,
  locale: CommunityDragonLocale,
  field: MissingRuntimeField,
): void {
  parent.appendChild(
    textNode("span", runtimeMissingLabel(locale, field), "runtime-missing"),
  );
}

function appendRarity(
  parent: HTMLElement,
  rarity: { readonly label?: string; readonly iconUrl?: string } | undefined,
  locale: CommunityDragonLocale,
): void {
  const badge = document.createElement("span");
  badge.className = "runtime-rarity";
  if (!rarity) {
    badge.textContent = runtimeMissingLabel(locale, "rarity");
    badge.className = "runtime-rarity runtime-missing";
    parent.appendChild(badge);
    return;
  }
  if (rarity.iconUrl) {
    const icon = document.createElement("img");
    icon.src = rarity.iconUrl;
    icon.alt = rarity.label ?? "";
    icon.loading = "lazy";
    icon.decoding = "async";
    badge.appendChild(icon);
  }
  badge.appendChild(
    textNode(
      "span",
      rarity.label ?? runtimeMissingLabel(locale, "rarity"),
      rarity.label ? undefined : "runtime-missing",
    ),
  );
  parent.appendChild(badge);
}

type DetailMediaKey =
  | "focusedSplashUrl"
  | "unfocusedSplashUrl"
  | "tileUrl"
  | "loadScreenUrl"
  | "animatedSplashUrl";

interface DetailMediaDescriptor {
  readonly key: DetailMediaKey;
  readonly kind: "image" | "video";
  readonly en: string;
  readonly zh: string;
}

const detailMediaDescriptors: readonly DetailMediaDescriptor[] = [
  { key: "focusedSplashUrl", kind: "image", en: "Focused artwork", zh: "聚焦原画" },
  { key: "unfocusedSplashUrl", kind: "image", en: "Unfocused artwork", zh: "未裁剪原画" },
  { key: "tileUrl", kind: "image", en: "Thumbnail", zh: "缩略图" },
  { key: "loadScreenUrl", kind: "image", en: "Loading screen", zh: "载入图" },
  { key: "animatedSplashUrl", kind: "video", en: "Animated artwork", zh: "动态原画" },
];

const historyMediaDescriptors = detailMediaDescriptors.filter(
  ({ key }) =>
    key === "focusedSplashUrl" ||
    key === "unfocusedSplashUrl" ||
    key === "animatedSplashUrl",
);

function appendMediaResource(
  parent: HTMLElement,
  url: string,
  alt: string,
  descriptor: DetailMediaDescriptor,
  label: string,
): void {
  const figure = document.createElement("figure");
  figure.className = "runtime-media-item";
  const resource =
    descriptor.kind === "video"
      ? document.createElement("video")
      : document.createElement("img");
  resource.src = url;
  if (descriptor.kind === "video") {
    resource.setAttribute("aria-label", alt);
    resource.setAttribute("controls", "");
    resource.setAttribute("playsinline", "");
  } else {
    const image = resource as HTMLImageElement;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
  }
  resource.addEventListener("error", () => resource.remove(), { once: true });
  figure.appendChild(resource);
  figure.appendChild(
    textNode(
      "figcaption",
      label,
      "runtime-media-caption",
    ),
  );
  parent.appendChild(figure);
}

function appendMediaCollection(
  parent: HTMLElement,
  media: RuntimeMedia,
  locale: CommunityDragonLocale,
  altBase: string,
  descriptors: readonly DetailMediaDescriptor[] = detailMediaDescriptors,
): number {
  let count = 0;
  descriptors.forEach((descriptor) => {
    const url = media[descriptor.key];
    if (!url) return;
    appendMediaResource(
      parent,
      url,
      `${altBase} · ${locale === "zh_cn" ? descriptor.zh : descriptor.en}`,
      descriptor,
      locale === "zh_cn" ? descriptor.zh : descriptor.en,
    );
    count += 1;
  });
  return count;
}

function appendHistoricalArtwork(
  parent: HTMLElement,
  history: readonly RuntimeHistoricalArtwork[],
  locale: CommunityDragonLocale,
  altBase: string,
): void {
  history.forEach((entry) => {
    const item = document.createElement("article");
    item.className = "runtime-history-item";
    item.appendChild(
      textNode(
        "h3",
        entry.version ??
          (locale === "zh_cn" ? "版本信息缺失" : "Version unavailable"),
      ),
    );
    const media = document.createElement("div");
    media.className = "runtime-media-grid runtime-history-media";
    appendMediaCollection(media, entry.media, locale, altBase, historyMediaDescriptors);
    if (!media.children.length)
      appendMissingField(media, locale, "artwork");
    item.appendChild(media);
    parent.appendChild(item);
  });
}

function setRuntimeNoindex(enabled: boolean): void {
  const existing = document.head.querySelector<HTMLMetaElement>(
    "meta[data-runtime-noindex]",
  );
  if (enabled) {
    const meta =
      existing ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, nofollow");
    meta.dataset.runtimeNoindex = "true";
  } else {
    existing?.remove();
  }
}

export function createDomRuntimeView(
  options: DomRuntimeViewOptions,
): RuntimeView {
  const { source } = options;
  const status =
    options.root.querySelector<HTMLElement>("[data-runtime-status]") ??
    textNode("p", "");
  const content =
    options.root.querySelector<HTMLElement>("[data-runtime-content]") ??
    document.createElement("div");
  if (!status.parentElement) options.root.append(status);
  if (!content.parentElement) options.root.append(content);
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  const channelLabel = source.querySelector<HTMLElement>(
    "[data-runtime-channel-label]",
  );
  const preservesExplicitPbe = () =>
    options.history.url.searchParams.get("channel") === "pbe";
  const updateChannel = (selected: "pbe" | "latest") => {
    source
      .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
      .forEach((button) => {
        const active = button.dataset.runtimeChannel === selected;
        button.setAttribute("aria-pressed", String(active));
        if (button.dataset.runtimeChannel)
          button.textContent = communityDragonChannelLabel(
            button.dataset.runtimeChannel as "pbe" | "latest",
            options.locale,
          );
    });
    if (channelLabel)
      channelLabel.textContent = communityDragonChannelLabel(
        selected,
        options.locale,
      );
    bindRuntimeChannelLinks(document, options.history.url);
    bindRuntimeLanguageToggle(document, options.history.url);
  };
  let relationSlot: HTMLElement | undefined;
  const view: RuntimeView = {
    loading(preserve, channel) {
      options.root.setAttribute("aria-busy", "true");
      if (!preserve && channel) updateChannel(channel);
      status.textContent =
        options.locale === "zh_cn"
          ? "正在加载游戏资料…"
          : "Loading game reference…";
      if (!preserve) {
        const skeleton = document.createElement("div");
        skeleton.className = "runtime-skeleton-grid";
        skeleton.setAttribute("aria-hidden", "true");
        for (let index = 0; index < 6; index += 1) {
          const card = document.createElement("div");
          card.className = "runtime-skeleton-card";
          skeleton.appendChild(card);
        }
        content.replaceChildren(skeleton);
      }
    },
    renderList(items, state) {
      relationSlot = undefined;
      setRuntimeNoindex(false);
      options.root.removeAttribute("aria-busy");
      updateChannel(state.channel);
      status.textContent =
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
        const roleLabel = document.createElement("label");
        roleLabel.className = "runtime-toolbar-field";
        roleLabel.htmlFor = select.id;
        roleLabel.append(
          textNode("span", options.locale === "zh_cn" ? "职业" : "Role"),
          select,
        );
        toolbar.append(roleLabel);
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
      pagination.className = "pagination runtime-pagination";
      pagination.setAttribute(
        "aria-label",
        options.locale === "zh_cn" ? "资料分页" : "Reference pages",
      );
      let currentPage = 1;
      const pageSize = 24;
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
              isChampionList ? "" : item.name,
              hrefFor(options.locale, page, {
                id: item.id,
                channel: state.channel,
              }, "detail", preservesExplicitPbe()),
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
                item.kind === "champion" ? item.portraitUrl : item.imageUrl;
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
            }
            card.appendChild(link);
            return card;
          }),
        );
        pagination.replaceChildren();
        if (pageCount > 1) {
          const addPageButton = (page: number, label: string) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = label;
            button.setAttribute("aria-label", label);
            if (page === currentPage)
              button.setAttribute("aria-current", "page");
            button.addEventListener("click", () => {
              currentPage = page;
              render();
            });
            pagination.appendChild(button);
          };
          if (currentPage > 1)
            addPageButton(
              currentPage - 1,
              options.locale === "zh_cn" ? "上一页" : "Previous",
            );
          for (let page = 1; page <= pageCount; page += 1)
            addPageButton(page, String(page));
          if (currentPage < pageCount)
            addPageButton(
              currentPage + 1,
              options.locale === "zh_cn" ? "下一页" : "Next",
            );
        }
        status.textContent = filtered.length
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
      content.replaceChildren(toolbar, grid, pagination);
      render();
    },
    renderDetail(item, state) {
      relationSlot = undefined;
      setRuntimeNoindex(true);
      options.root.removeAttribute("aria-busy");
      updateChannel(state.channel);
      const controller = options.getController();
      const article = document.createElement("article");
      article.className = "runtime-detail";
      const heading = textNode(
        "h1",
        item.name ?? runtimeMissingLabel(options.locale, "name"),
      );
      article.appendChild(heading);
      if (item.kind === "champion") {
        const baseSkin = item.skins.find((skin) => skin.isBase);
        const baseSection = document.createElement("section");
        baseSection.className = "runtime-champion-base";
        baseSection.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "英雄默认外观" : "Default appearance",
          ),
        );
        const baseArtwork = baseSkin?.media.focusedSplashUrl ??
          baseSkin?.media.unfocusedSplashUrl;
        if (baseArtwork) appendMedia(baseSection, baseArtwork, item.name);
        else appendMissingField(baseSection, options.locale, "artwork");
        article.appendChild(baseSection);

        const section = document.createElement("section");
        section.appendChild(
          textNode(
            "h2",
            options.locale === "zh_cn" ? "皮肤资料" : "Skin references",
          ),
        );
        const grid = document.createElement("div");
        grid.className = "runtime-skin-reference-grid";
        const skinItems = projectChampionSkinReferenceItems(item.id, item.skins);
        if (!skinItems.length) {
          appendMissingField(grid, options.locale, "thumbnail");
        }
        for (const skin of skinItems) {
          const card = document.createElement("article");
          card.className = "runtime-skin-reference-card";
          const link = linkWithNavigation(
            "",
            hrefFor(options.locale, "skins", {
              id: skin.skinId,
              championId: item.id,
              stageId: skin.stageId,
              channel: state.channel,
            }, "detail", preservesExplicitPbe()),
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
          appendRarity(meta, skin.rarity, options.locale);
          link.appendChild(meta);
          card.appendChild(link);
          grid.appendChild(card);
        }
        section.appendChild(grid);
        article.appendChild(section);
      } else if (item.kind === "skin") {
        const championLink = linkWithNavigation(
          item.championName ??
            (options.locale === "zh_cn"
              ? `英雄 #${item.championId}`
              : `Champion #${item.championId}`),
          hrefFor(options.locale, "champions", {
            id: item.championId,
            channel: state.channel,
          }, "detail", preservesExplicitPbe()),
          controller,
        );
        championLink.className = "runtime-relation-link";
        article.appendChild(championLink);

        const summary = document.createElement("dl");
        summary.className = "runtime-skin-summary";
        const rarityTerm = textNode(
          "dt",
          options.locale === "zh_cn" ? "稀有度" : "Rarity",
        );
        const rarityValue = document.createElement("dd");
        appendRarity(rarityValue, item.rarity, options.locale);
        summary.append(rarityTerm, rarityValue);
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
            if (stage.id) {
              stageHeading.appendChild(
                linkWithNavigation(
                  stageName,
                  hrefFor(options.locale, "skins", {
                    id: item.id,
                    championId: item.championId,
                    stageId: stage.id,
                    channel: state.channel,
                  }, "detail", preservesExplicitPbe()),
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
              appendMediaCollection(
                stageMedia,
                stage.media,
                options.locale,
                stageName,
              ) === 0
            )
              appendMissingField(stageMedia, options.locale, "artwork");
            stageItem.appendChild(stageMedia);
            stages.appendChild(stageItem);
          }
          article.appendChild(stages);
        }

        if (item.chromas.length) {
          const chromas = document.createElement("section");
          chromas.appendChild(
            textNode("h2", options.locale === "zh_cn" ? "炫彩" : "Chromas"),
          );
          item.chromas.forEach((chroma) =>
            appendMedia(
              chromas,
              chroma.imageUrl,
              chroma.name ?? String(chroma.id),
            ),
          );
          article.appendChild(chromas);
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
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "正在加载关联资料…"
            : "Loading related references…";
        relations.appendChild(relationSlot);
        article.appendChild(relations);
      } else if (item.kind === "skinline") {
        appendMedia(article, item.imageUrl, item.name);
        if (item.description)
          article.appendChild(textNode("p", item.description, "runtime-lede"));
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
      } else {
        appendMedia(article, item.imageUrl, item.name);
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
      }
      content.replaceChildren(article);
      status.textContent =
        options.locale === "zh_cn"
          ? "资料加载完成"
          : "Reference loaded";
    },
    renderRelations(items, state) {
      if (!relationSlot) return;
      const controller = options.getController();
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
      const relationGroups = ["skinline", "universe"] as const;
      relationSlot.replaceChildren(
        ...relationGroups.flatMap((kind) => {
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
                  preservesExplicitPbe(),
                ),
                controller,
              ),
            ),
          );
          group.appendChild(links);
          return [group];
        }),
      );
    },
    relationFailure(error, retry) {
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
    invalid(message, channel) {
      relationSlot = undefined;
      setRuntimeNoindex(true);
      if (channel) updateChannel(channel);
      options.root.removeAttribute("aria-busy");
      status.textContent = message;
      content.replaceChildren();
    },
    failure(error, retry) {
      options.root.removeAttribute("aria-busy");
      status.textContent = runtimeFailureMessage(error, options.locale);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "runtime-retry";
      button.textContent = options.locale === "zh_cn" ? "重试" : "Retry";
      button.addEventListener("click", retry, { once: true });
      status.appendChild(document.createTextNode(" "));
      status.appendChild(button);
    },
  };

  source
    .querySelectorAll<HTMLButtonElement>("[data-runtime-channel]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const next = new URL(options.history.url);
        const selected = button.dataset.runtimeChannel;
        if (selected === "latest") next.searchParams.set("channel", "latest");
        else next.searchParams.delete("channel");
        void options.getController().navigate(next);
      });
    });
  return view;
}
