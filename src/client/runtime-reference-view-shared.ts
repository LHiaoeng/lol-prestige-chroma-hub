import {
  type CommunityDragonLocale,
  type RuntimeHistoricalArtwork,
  type RuntimeMedia,
} from "../domain/communitydragon-runtime";
import { type RuntimeSkinAction } from "../domain/detail-actions";
import type {
  RuntimeSkinReferenceGroup,
  RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import { localizedPath } from "../i18n/config";
import { formatRuntimeUrl } from "../domain/runtime-url-state";
import type { RuntimePage } from "./runtime-reference";
import type { RuntimeControllerLike } from "./runtime-reference-view";

export function textNode(
  tag: keyof HTMLElementTagNameMap,
  value: string,
  className?: string,
): HTMLElement {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = value;
  return element;
}

export function runtimePath(
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

export function hrefFor(
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
  return formatRuntimeUrl(
    url,
    {
      id: values.id,
      champion: values.championId,
      stage: values.stageId,
      channel: values.channel,
      channelExplicit: preserveExplicitPbe,
    },
    page === "skins"
      ? ["id", "champion", "stage", "channel"]
      : ["id", "channel"],
  );
}

export function shouldHandleRuntimeNavigation(
  url: URL,
  currentPathname: string,
): boolean {
  return url.pathname === currentPathname;
}

export function linkWithNavigation(
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

export function appendMedia(
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

export function appendExternalAction(
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

export const championRoleOptions = [
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

export function runtimeMissingLabel(
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

export function roleLabel(role: string, locale: CommunityDragonLocale): string {
  const option = championRoleOptions.find(([value]) => value === role);
  if (!option) return role;
  return locale === "zh_cn" ? option[2] : option[1];
}

export function appendMissingField(
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

export function hasRenderableRarity(
  rarity: RuntimeRarityView | undefined,
): boolean {
  return Boolean(rarity?.label || rarity?.iconUrl);
}

export function appendRarity(
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

export function appendMediaCollection(
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

export function appendHistoricalArtwork(
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

export function appendChromaColorCircle(
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

export function appendChromaColors(
  parent: HTMLElement,
  colors: readonly string[] | undefined,
  locale: CommunityDragonLocale,
): void {
  appendChromaColorCircle(parent, colors, locale);
}

export function appendNonChromaState(
  parent: HTMLElement,
  locale: CommunityDragonLocale,
): void {
  appendChromaColorCircle(parent, [], locale, false);
}

export function appendChromaCard(
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

export function appendSkinReferenceCard(
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

export function appendSkinReferenceGrid(
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

export function appendUniverseSkinGroups(
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


export function setRuntimeNoindex(enabled: boolean): void {
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
