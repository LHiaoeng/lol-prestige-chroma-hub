import {
  borderVariantLabel,
  type CommunityDragonLocale,
  type RuntimeHistoricalArtwork,
  type RuntimeMedia,
  resolveBorderModule,
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

/**
 * Dedicated border section: a baked vintage load screen when available,
 * otherwise the plain load screen with switchable per-layer border images.
 * Returns false when the skin has no border data.
 */
export function appendBorderModule(
  parent: HTMLElement,
  media: RuntimeMedia,
  locale: CommunityDragonLocale,
  altBase: string,
): boolean {
  const module = resolveBorderModule(media);
  if (!module) return false;

  const section = document.createElement("section");
  section.className = "runtime-skin-borders";
  section.appendChild(
    textNode("h2", locale === "zh_cn" ? "边框" : "Borders"),
  );

  const frame = document.createElement("div");
  frame.className = "runtime-loadscreen-frame";
  const zh = locale === "zh_cn";

  if (module.kind === "baked") {
    const img = document.createElement("img");
    img.className = "runtime-loadscreen-baked";
    img.src = module.imageUrl;
    img.alt = `${altBase} · ${zh ? "带边框载入图" : "bordered loading screen"}`;
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => img.remove(), { once: true });
    frame.appendChild(img);
    section.appendChild(frame);

    const bakedDownload = document.createElement("button");
    bakedDownload.type = "button";
    bakedDownload.className = "runtime-border-composite-download";
    bakedDownload.dataset.downloadKind = "border";
    bakedDownload.dataset.url = module.imageUrl;
    bakedDownload.textContent = zh ? "下载带边框载入图" : "Download bordered load screen";
    section.appendChild(bakedDownload);
  } else {
    const art = document.createElement("img");
    art.className = "runtime-loadscreen-art";
    art.src = module.artUrl;
    art.alt = `${altBase} · ${zh ? "载入图" : "loading screen"}`;
    art.loading = "lazy";
    art.decoding = "async";
    frame.appendChild(art);

    module.groups.forEach((group) => {
      const layer = document.createElement("img");
      layer.className = "runtime-loadscreen-border";
      layer.dataset.layer = String(group.layer);
      layer.alt = "";
      layer.setAttribute("aria-hidden", "true");
      layer.loading = "lazy";
      layer.decoding = "async";
      layer.src = group.options[group.options.length - 1].url;
      layer.addEventListener("error", () => layer.remove(), { once: true });
      frame.appendChild(layer);
    });
    section.appendChild(frame);

    module.groups.forEach((group) => {
      if (group.options.length < 2) return;
      const toolbar = document.createElement("div");
      toolbar.className = "runtime-border-toolbar";
      toolbar.setAttribute("role", "group");
      toolbar.setAttribute(
        "aria-label",
        zh ? `第 ${group.layer + 1} 层边框` : `Layer ${group.layer + 1} border`,
      );
      const activeLayer = Array.from(
        frame.querySelectorAll<HTMLImageElement>(".runtime-loadscreen-border"),
      ).find((image) => image.dataset.layer === String(group.layer));
      group.options.forEach((option) => {
        const row = document.createElement("div");
        row.className = "runtime-border-row";

        const button = document.createElement("button");
        button.type = "button";
        button.className = "runtime-border-choice";
        const label = borderVariantLabel(option.url, locale);
        button.textContent = label;
        button.dataset.layer = String(group.layer);
        button.dataset.url = option.url;
        const pressed = activeLayer?.src.endsWith(option.url) ?? false;
        button.setAttribute("aria-pressed", pressed ? "true" : "false");
        if (pressed) button.classList.add("is-active");

        const menu = document.createElement("details");
        menu.className = "runtime-border-download-menu";
        const summary = document.createElement("summary");
        summary.textContent = "↓";
        summary.setAttribute(
          "aria-label",
          zh ? `下载${label}相关图片` : `Download ${label} assets`,
        );
        const pop = document.createElement("div");
        pop.className = "runtime-border-download-pop";
        const borderItem = document.createElement("button");
        borderItem.type = "button";
        borderItem.textContent = zh ? "边框 PNG" : "Border PNG";
        borderItem.dataset.downloadKind = "border";
        borderItem.dataset.url = option.url;
        const compositeItem = document.createElement("button");
        compositeItem.type = "button";
        compositeItem.textContent = zh ? "合成效果图" : "Composite image";
        compositeItem.dataset.downloadKind = "composite";
        pop.append(borderItem, compositeItem);
        menu.append(summary, pop);

        row.append(button, menu);
        toolbar.appendChild(row);
      });
      section.appendChild(toolbar);
    });
  }

  const closeOpenMenus = (keep?: HTMLElement): void => {
    section
      .querySelectorAll<HTMLDetailsElement>("details.runtime-border-download-menu[open]")
      .forEach((openMenu) => {
        if (openMenu !== keep) openMenu.open = false;
      });
  };
  document.addEventListener("click", (event) => {
    const target = event.target as Node | null;
    if (target && section.contains(target)) return;
    closeOpenMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeOpenMenus();
  });
  section
    .querySelectorAll<HTMLDetailsElement>("details.runtime-border-download-menu")
    .forEach((menu) => {
      menu.addEventListener("toggle", () => {
        if (menu.open) closeOpenMenus(menu);
      });
    });

  section.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;

    const downloadChoice = target?.closest<HTMLButtonElement>("[data-download-kind]");
    if (downloadChoice) {
      const menu = downloadChoice.closest("details");
      if (downloadChoice.dataset.downloadKind === "border" && downloadChoice.dataset.url) {
        void downloadImageFile(downloadChoice.dataset.url);
      } else if (downloadChoice.dataset.downloadKind === "composite") {
        void downloadCompositeFrame(frame);
      }
      if (menu) menu.open = false;
      return;
    }

    const button = target?.closest<HTMLButtonElement>(".runtime-border-choice");
    if (!button) return;
    const layerEl = Array.from(
      frame.querySelectorAll<HTMLImageElement>(".runtime-loadscreen-border"),
    ).find((image) => image.dataset.layer === button.dataset.layer);
    if (layerEl && button.dataset.url) layerEl.src = button.dataset.url;
    section
      .querySelectorAll<HTMLButtonElement>(".runtime-border-choice")
      .forEach((other) => {
        if (other.dataset.layer !== button.dataset.layer) return;
        const active = other === button;
        other.setAttribute("aria-pressed", active ? "true" : "false");
        other.classList.toggle("is-active", active);
      });
  });

  parent.appendChild(section);
  return true;
}

/** Fetch a border image as a blob and trigger a local download. */
async function downloadImageFile(url: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed with ${response.status}`);
    const objectUrl = URL.createObjectURL(await response.blob());
    saveBlob(objectUrl, url.split("/").pop() ?? "border");
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

function saveBlob(href: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.hidden = true;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function loadCrossOriginImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Image load failed: ${src}`));
    image.src = src;
  });
}

/**
 * Composite the plain load screen with all currently selected border
 * layers on a canvas and download the result as a JPEG.
 */
async function downloadCompositeFrame(frame: HTMLElement): Promise<void> {
  const art = frame.querySelector<HTMLImageElement>(".runtime-loadscreen-art");
  if (!art?.src) return;
  const layers = Array.from(
    frame.querySelectorAll<HTMLImageElement>(".runtime-loadscreen-border"),
  ).sort((a, b) => Number(a.dataset.layer) - Number(b.dataset.layer));

  try {
    const [artImage, ...borderImages] = await Promise.all([
      loadCrossOriginImage(art.src),
      ...layers.map((layer) => loadCrossOriginImage(layer.src)),
    ]);
    const canvas = document.createElement("canvas");
    canvas.width = artImage.naturalWidth;
    canvas.height = artImage.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas 2D context unavailable");
    context.drawImage(artImage, 0, 0, canvas.width, canvas.height);
    for (const border of borderImages) {
      context.drawImage(border, 0, 0, canvas.width, canvas.height);
    }
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!blob) throw new Error("Canvas export failed");
    const stem = art.src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "loadscreen";
    saveBlob(URL.createObjectURL(blob), `${stem}_composite.jpg`);
  } catch {
    window.open(art.src, "_blank", "noopener,noreferrer");
  }
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
