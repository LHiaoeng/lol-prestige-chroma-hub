import {
  type CommunityDragonLocale,
  type RuntimeHistoricalArtwork,
  type RuntimeList,
  type RuntimeMedia,
} from "../domain/communitydragon-runtime";
import {
  communityDragonChannelLabel,
  communityDragonVersionMetadataUrl,
} from "../domain/communitydragon-url";
import type { RuntimePbeAdditions } from "../domain/pbe-additions";
import {
  runtimeSkinActions,
  type RuntimeSkinAction,
} from "../domain/detail-actions";
import {
  projectChampionSkinListItems,
  sortSkinReferenceItems,
  type RuntimeSkinReferenceGroup,
  type RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
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

function appendExternalAction(
  parent: HTMLElement,
  action: RuntimeSkinAction,
): void {
  const link = document.createElement("a");
  link.className = "runtime-chip runtime-external-link";
  link.setAttribute("href", action.href);
  link.href = action.href;
  link.textContent = action.label;
  link.setAttribute("target", "_blank");
  link.setAttribute("rel", "noopener noreferrer");
  link.setAttribute("aria-label", action.label);
  parent.appendChild(link);
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
  | "roles"
  | "colors";

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
      roles: "定位缺失",
      colors: "颜色缺失",
    }[field];
  }
  return {
    name: "Name unavailable",
    description: "Description unavailable",
    artwork: "Artwork unavailable",
    portrait: "Portrait unavailable",
    thumbnail: "Thumbnail unavailable",
    roles: "Role data unavailable",
    colors: "Colors unavailable",
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

type RuntimeRarityView = {
  readonly label?: string;
  readonly iconUrl?: string;
};

function hasRenderableRarity(
  rarity: RuntimeRarityView | undefined,
): boolean {
  return Boolean(rarity?.label || rarity?.iconUrl);
}

function appendRarity(
  parent: HTMLElement,
  rarity: RuntimeRarityView | undefined,
): void {
  const badge = document.createElement("span");
  badge.className = "runtime-rarity";
  const label = rarity?.label;
  const iconUrl = rarity?.iconUrl;
  if (!hasRenderableRarity(rarity)) return;
  if (iconUrl) {
    const icon = document.createElement("img");
    icon.src = iconUrl;
    icon.alt = label ?? "";
    icon.loading = "lazy";
    icon.decoding = "async";
    badge.appendChild(icon);
  }
  if (label) badge.appendChild(textNode("span", label));
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

function appendChromaColorCircle(
  parent: HTMLElement,
  colors: readonly string[] | undefined,
  locale: CommunityDragonLocale,
  isChroma = true,
): void {
  const values = [...new Set(colors ?? [])];
  const wrapper = document.createElement("span");
  wrapper.className = "color-wrap";
  if (isChroma && values.length) wrapper.setAttribute("tabindex", "0");
  if (!isChroma) {
    wrapper.setAttribute("role", "img");
    wrapper.setAttribute(
      "aria-label",
      locale === "zh_cn" ? "不是炫彩" : "Not a chroma",
    );
  }

  const circle = document.createElement("span");
  circle.className = `color-circle${values.length ? "" : " color-circle-empty"}${isChroma ? "" : " non-chroma"}`;
  if (isChroma) {
    circle.setAttribute("aria-label", values.join(", "));
  } else {
    circle.setAttribute("aria-hidden", "true");
  }
  const size = values.length ? 100 / values.length : 100;
  const stops = values.map(
    (color, index) => `${color} ${index * size}% ${(index + 1) * size}%`,
  );
  const background = !isChroma
    ? "transparent"
    : values.length === 1
      ? values[0]
      : values.length
        ? `conic-gradient(from 45deg, ${stops.join(", ")})`
        : "transparent";
  circle.setAttribute("style", `background:${background}`);
  wrapper.appendChild(circle);

  if (isChroma && values.length) {
    const tooltip = document.createElement("span");
    tooltip.className = "color-tooltip";
    tooltip.setAttribute("role", "tooltip");
    values.forEach((color) => {
      const row = document.createElement("span");
      row.className = "color-row";
      const swatch = document.createElement("i");
      swatch.setAttribute("style", `background:${color}`);
      row.appendChild(swatch);
      row.appendChild(textNode("code", color));
      tooltip.appendChild(row);
    });
    wrapper.appendChild(tooltip);
  }
  parent.appendChild(wrapper);
  if (isChroma && !values.length) appendMissingField(parent, locale, "colors");
}

function appendChromaColors(
  parent: HTMLElement,
  colors: readonly string[] | undefined,
  locale: CommunityDragonLocale,
): void {
  appendChromaColorCircle(parent, colors, locale);
}

function appendNonChromaState(
  parent: HTMLElement,
  locale: CommunityDragonLocale,
): void {
  appendChromaColorCircle(parent, [], locale, false);
}

function appendChromaCard(
  parent: HTMLElement,
  options: {
    readonly name: string;
    readonly imageUrl?: string;
    readonly colors?: readonly string[];
    readonly isBase: boolean;
    readonly locale: CommunityDragonLocale;
  },
): void {
  const card = document.createElement("article");
  card.className = options.isBase
    ? "runtime-chroma-card runtime-chroma-base"
    : "runtime-chroma-card";
  const media = document.createElement("div");
  media.className = "runtime-chroma-media";
  if (options.imageUrl) appendMedia(media, options.imageUrl, options.name);
  else appendMissingField(media, options.locale, "thumbnail");
  card.appendChild(media);

  const meta = document.createElement("div");
  meta.className = "runtime-chroma-meta";
  meta.appendChild(textNode("h3", options.name, "runtime-chroma-name"));
  if (options.isBase) {
    appendNonChromaState(meta, options.locale);
  } else {
    appendChromaColors(meta, options.colors, options.locale);
  }
  card.appendChild(meta);
  parent.appendChild(card);
}

function appendSkinReferenceCard(
  parent: HTMLElement,
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  controller: RuntimeControllerLike,
  preserveExplicitPbe: boolean,
): void {
  const card = document.createElement("article");
  card.className = "runtime-skin-reference-card";
  const link = linkWithNavigation(
    "",
    hrefFor(
      locale,
      "skins",
      {
        id: item.skinId,
        championId: item.championId,
        stageId: item.stageId,
        channel,
      },
      "detail",
      preserveExplicitPbe,
    ),
    controller,
    "runtime-skin-reference-link",
  );
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  link.setAttribute("aria-label", name);
  if (item.thumbnailUrl) appendMedia(link, item.thumbnailUrl, name);
  else appendMissingField(link, locale, "thumbnail");
  const meta = document.createElement("span");
  meta.className = "runtime-skin-reference-meta";
  meta.appendChild(textNode("span", name));
  appendRarity(meta, item.rarity);
  link.appendChild(meta);
  card.appendChild(link);
  parent.appendChild(card);
}

function appendSkinReferenceGrid(
  parent: HTMLElement,
  items: readonly RuntimeSkinReferenceItem[],
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  controller: RuntimeControllerLike,
  preserveExplicitPbe: boolean,
  emptyMessage?: string,
): void {
  const grid = document.createElement("div");
  grid.className = "runtime-skin-reference-grid";
  if (!items.length) {
    parent.appendChild(
      textNode(
        "p",
        emptyMessage ??
          (locale === "zh_cn"
            ? "当前语言没有可显示的系列皮肤资料。"
            : "No skin records are available for this skinline in this language."),
        "runtime-empty-state",
      ),
    );
  } else {
    parent.appendChild(grid);
    items.forEach((item) =>
      appendSkinReferenceCard(
        grid,
        item,
        locale,
        channel,
        controller,
        preserveExplicitPbe,
      ),
    );
  }
}

function appendUniverseSkinGroups(
  parent: HTMLElement,
  groups: readonly RuntimeSkinReferenceGroup[],
  skinlineNames: ReadonlyMap<number, string>,
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  controller: RuntimeControllerLike,
  preserveExplicitPbe: boolean,
): void {
  if (!groups.length) {
    parent.appendChild(
      textNode(
        "p",
        locale === "zh_cn"
          ? "当前宇宙没有可用的皮肤系列关系。"
          : "No skinline relationships are available for this universe.",
        "runtime-empty-state",
      ),
    );
    return;
  }
  groups.forEach((group) => {
    const section = document.createElement("section");
    section.className = "runtime-universe-skin-group";
    section.appendChild(
      textNode(
        "h3",
        skinlineNames.get(group.skinlineId) ??
          runtimeMissingLabel(locale, "name"),
      ),
    );
    appendSkinReferenceGrid(
      section,
      group.items,
      locale,
      channel,
      controller,
      preserveExplicitPbe,
      locale === "zh_cn"
        ? "当前语言没有可显示的宇宙皮肤资料。"
        : "No skin records are available for this universe in this language.",
    );
    parent.appendChild(section);
  });
}

function appendPbeVersion(
  parent: HTMLElement,
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  version: string | undefined,
): void {
  const item = document.createElement("div");
  item.className = "runtime-pbe-version";
  item.appendChild(
    textNode("dt", communityDragonChannelLabel(channel, locale)),
  );
  const value = document.createElement("dd");
  const link = document.createElement("a");
  link.href = communityDragonVersionMetadataUrl(channel);
  link.textContent =
    version ??
    (locale === "zh_cn" ? "版本信息缺失" : "Version unavailable");
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  value.appendChild(link);
  item.appendChild(value);
  parent.appendChild(item);
}

function appendPbeSkinCard(
  parent: HTMLElement,
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const card = document.createElement("article");
  card.className = "runtime-pbe-card runtime-pbe-skin-card";
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  const link = linkWithNavigation(
    "",
    hrefFor(
      locale,
      "skins",
      {
        id: item.skinId,
        championId: item.championId,
        stageId: item.stageId,
        channel: "pbe",
      },
      "detail",
      true,
    ),
    controller,
    "runtime-pbe-card-link",
  );
  link.setAttribute("aria-label", name);
  if (item.thumbnailUrl) appendMedia(link, item.thumbnailUrl, name);
  else appendMissingField(link, locale, "thumbnail");
  const meta = document.createElement("span");
  meta.className = "runtime-pbe-card-meta";
  meta.appendChild(textNode("span", name));
  appendRarity(meta, item.rarity);
  link.appendChild(meta);
  card.appendChild(link);

  const owner = document.createElement("p");
  owner.className = "runtime-pbe-card-owner";
  owner.appendChild(
    textNode("span", locale === "zh_cn" ? "所属英雄：" : "Champion: "),
  );
  owner.appendChild(
    (() => {
      const link = linkWithNavigation(
        item.championName ?? runtimeMissingLabel(locale, "name"),
        hrefFor(
          locale,
          "champions",
          { id: item.championId, channel: "pbe" },
          "detail",
          true,
        ),
        controller,
        "runtime-relation-link",
      );
      if (!item.championName) link.classList.add("runtime-missing");
      return link;
    })(),
  );
  card.appendChild(owner);
  parent.appendChild(card);
}

function appendPbeAdditions(
  parent: HTMLElement,
  additions: RuntimePbeAdditions,
  locale: CommunityDragonLocale,
  controller: RuntimeControllerLike,
): void {
  const versions = document.createElement("dl");
  versions.className = "runtime-pbe-versions";
  appendPbeVersion(versions, locale, "pbe", additions.versions.pbe);
  appendPbeVersion(versions, locale, "latest", additions.versions.latest);
  parent.appendChild(versions);

  const summary = document.createElement("div");
  summary.className = "runtime-pbe-summary";
  const totalLabel = locale === "zh_cn" ? "新增实体总数" : "Total new entities";
  summary.appendChild(textNode("strong", `${totalLabel}: ${additions.total}`));
  const countItems = locale === "zh_cn"
    ? [
        ["英雄", additions.counts.champions],
        ["皮肤", additions.counts.skins],
        ["皮肤系列", additions.counts.skinlines],
        ["皮肤宇宙", additions.counts.universes],
      ]
    : [
        ["Champions", additions.counts.champions],
        ["Skins", additions.counts.skins],
        ["Skinlines", additions.counts.skinlines],
        ["Universes", additions.counts.universes],
      ];
  countItems.forEach(([label, count]) =>
    summary.appendChild(textNode("span", `${label}: ${count}`)),
  );
  parent.appendChild(summary);

  const skinlineNames = new Map<number, string>(
    additions.pbeSkinlines.map(
      (skinline) => [skinline.id, skinline.name] as const,
    ),
  );
  const sections: readonly {
    readonly title: string;
    readonly count: number;
    readonly empty: string;
    readonly render: (grid: HTMLElement) => void;
  }[] = [
    {
      title: locale === "zh_cn" ? "新增英雄" : "New champions",
      count: additions.counts.champions,
      empty: locale === "zh_cn" ? "没有新增英雄。" : "No new champions.",
      render: (grid) =>
        additions.champions.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          const link = linkWithNavigation(
            "",
            hrefFor(locale, "champions", { id: item.id, channel: "pbe" }, "detail", true),
            controller,
            "runtime-pbe-card-link",
          );
          if (item.portraitUrl) appendMedia(link, item.portraitUrl, item.name, "runtime-champion-portrait");
          else appendMissingField(link, locale, "portrait");
          link.appendChild(textNode("span", item.name, "runtime-pbe-card-name"));
          card.appendChild(link);
          grid.appendChild(card);
        }),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤" : "New skins",
      count: additions.counts.skins,
      empty: locale === "zh_cn" ? "没有新增皮肤。" : "No new skins.",
      render: (grid) => additions.skins.forEach((item) => appendPbeSkinCard(grid, item, locale, controller)),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤系列" : "New skinlines",
      count: additions.counts.skinlines,
      empty: locale === "zh_cn" ? "没有新增皮肤系列。" : "No new skinlines.",
      render: (grid) =>
        additions.skinlines.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          card.appendChild(
            linkWithNavigation(
              item.name,
              hrefFor(locale, "skinlines", { id: item.id, channel: "pbe" }, "detail", true),
              controller,
              "runtime-pbe-card-link runtime-pbe-text-link",
            ),
          );
          grid.appendChild(card);
        }),
    },
    {
      title: locale === "zh_cn" ? "新增皮肤宇宙" : "New universes",
      count: additions.counts.universes,
      empty: locale === "zh_cn" ? "没有新增皮肤宇宙。" : "No new universes.",
      render: (grid) =>
        additions.universes.forEach((item) => {
          const card = document.createElement("article");
          card.className = "runtime-pbe-card";
          card.appendChild(
            linkWithNavigation(
              item.name,
              hrefFor(locale, "universes", { id: item.id, channel: "pbe" }, "detail", true),
              controller,
              "runtime-pbe-card-link runtime-pbe-text-link",
            ),
          );
          const relations = document.createElement("div");
          relations.className = "runtime-pbe-card-relations";
          item.skinlineIds.forEach((skinlineId) => {
            const name = skinlineNames.get(skinlineId);
            if (!name) return;
            relations.appendChild(
              linkWithNavigation(
                name,
                hrefFor(locale, "skinlines", { id: skinlineId, channel: "pbe" }, "detail", true),
                controller,
                "runtime-relation-link",
              ),
            );
          });
          if (relations.children.length) card.appendChild(relations);
          grid.appendChild(card);
        }),
    },
  ];

  sections.forEach((definition) => {
    const section = document.createElement("section");
    section.className = "runtime-pbe-section";
    section.appendChild(textNode("h2", `${definition.title} (${definition.count})`));
    if (!definition.count) {
      section.appendChild(textNode("p", definition.empty, "runtime-empty-state"));
    } else {
      const grid = document.createElement("div");
      grid.className = "runtime-pbe-grid";
      definition.render(grid);
      section.appendChild(grid);
    }
    parent.appendChild(section);
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
  let skinlineSkinsSlot: HTMLElement | undefined;
  let universeSkinsSlot: HTMLElement | undefined;
  let universeSkinGroups: readonly RuntimeSkinReferenceGroup[] = [];
  let universeSkinCollectionState: "loading" | "ready" | "failed" =
    "loading";
  let universeSkinlineNames = new Map<number, string>();
  let universeListSkinlineNames = new Map<number, readonly string[]>();
  let renderUniverseGroups: (() => void) | undefined;
  let universeListRelationStatus: "loading" | "ready" | "failed" =
    "loading";
  let universeListRelationError: string | undefined;
  let universeListRelationStatusElement: HTMLElement | undefined;
  let renderedUniverseListItems: readonly Extract<
    RuntimeList[number],
    { kind: "universe" }
  >[] = [];
  let renderListCards: (() => void) | undefined;
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
    renderPbeAdditions(additions) {
      relationSlot = undefined;
      skinlineSkinsSlot = undefined;
      universeSkinsSlot = undefined;
      setRuntimeNoindex(false);
      options.root.removeAttribute("aria-busy");
      const article = document.createElement("article");
      article.className = "runtime-pbe-additions";
      appendPbeAdditions(
        article,
        additions,
        options.locale,
        options.getController(),
      );
      content.replaceChildren(article);
      status.textContent =
        options.locale === "zh_cn"
          ? `已比较 PBE 与正式服，发现 ${additions.total} 个新增实体`
          : `Compared PBE and Live: ${additions.total} new entities`;
    },
    renderList(items, state) {
      relationSlot = undefined;
      universeSkinsSlot = undefined;
      universeSkinGroups = [];
      universeSkinCollectionState = "loading";
      renderUniverseGroups = undefined;
      universeSkinlineNames = new Map();
      universeListSkinlineNames = new Map();
      universeListRelationStatus =
        options.page === "universes" ? "loading" : "ready";
      universeListRelationError = undefined;
      universeListRelationStatusElement = undefined;
      renderedUniverseListItems = items.filter(
        (item): item is Extract<RuntimeList[number], { kind: "universe" }> =>
          item.kind === "universe",
      );
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
              const mediaUrl = item.kind === "champion" ? item.portraitUrl : undefined;
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
      content.replaceChildren(
        toolbar,
        ...(relationStatus ? [relationStatus] : []),
        grid,
        pagination,
      );
      renderListCards = render;
      render();
    },
    renderDetail(item, state) {
      relationSlot = undefined;
      skinlineSkinsSlot = undefined;
      universeSkinsSlot = undefined;
      universeSkinGroups = [];
      universeSkinCollectionState = "loading";
      renderUniverseGroups = undefined;
      universeSkinlineNames = new Map();
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
        relationSlot.textContent =
          options.locale === "zh_cn"
            ? "正在加载关联资料…"
            : "Loading related references…";
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
        skinlineSkinsSlot.textContent =
          options.locale === "zh_cn"
            ? "正在加载系列皮肤…"
            : "Loading skinline skins…";
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
        universeSkinsSlot.textContent =
          options.locale === "zh_cn"
            ? "正在加载宇宙皮肤…"
            : "Loading universe skins…";
        skins.appendChild(universeSkinsSlot);
        renderUniverseGroups = () => {
          if (
            !universeSkinsSlot ||
            universeSkinCollectionState !== "ready"
          )
            return;
          universeSkinsSlot.replaceChildren();
          appendUniverseSkinGroups(
            universeSkinsSlot,
            universeSkinGroups,
            universeSkinlineNames,
            options.locale,
            state.channel,
            controller,
            preservesExplicitPbe(),
          );
        };
        article.appendChild(skins);
      }
      content.replaceChildren(article);
      status.textContent =
        item.kind === "champion"
          ? ""
          : options.locale === "zh_cn"
            ? "资料加载完成"
          : "Reference loaded";
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
        preservesExplicitPbe(),
      );
    },
    renderUniverseSkins(groups) {
      universeSkinGroups = groups;
      universeSkinCollectionState = "ready";
      renderUniverseGroups?.();
    },
    renderListRelations(items) {
      const skinlines = new Map(
        items
          .filter((item) => item.kind === "skinline")
          .map((item) => [item.id, item.name] as const),
      );
      universeListSkinlineNames = new Map(
        (renderedUniverseListItems ?? []).map((item) => [
          item.id,
          item.skinlineIds
            .map((id) => skinlines.get(id))
            .filter((name): name is string => Boolean(name)),
        ]),
      );
      universeListRelationStatus = "ready";
      universeListRelationError = undefined;
      if (universeListRelationStatusElement)
        universeListRelationStatusElement.textContent =
          options.locale === "zh_cn"
            ? "所属系列已加载"
            : "Skinline names loaded";
      renderListCards?.();
    },
    listRelationsFailure(error, retry) {
      universeListRelationStatus = "failed";
      universeListRelationError = runtimeFailureMessage(error, options.locale);
      if (universeListRelationStatusElement) {
        universeListRelationStatusElement.replaceChildren(
          textNode(
            "span",
            universeListRelationError,
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
    renderRelations(items, state) {
      if (!relationSlot) return;
      const controller = options.getController();
      if (!items.length) {
        if (state.kind === "universe") {
          universeSkinlineNames = new Map();
          if (universeSkinCollectionState === "ready")
            renderUniverseGroups?.();
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
        if (universeSkinCollectionState === "ready")
          renderUniverseGroups?.();
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
    skinlineSkinsFailure(error, retry) {
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
    universeSkinsFailure(error, retry) {
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
