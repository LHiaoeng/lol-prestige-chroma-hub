import {
  borderVariantLabel,
  type CommunityDragonLocale,
  type RuntimeHistoricalArtwork,
  type RuntimeMedia,
  listBorderGroups,
} from "../domain/communitydragon-runtime";
import { type RuntimeSkinAction } from "../domain/detail-actions";
import type {
  RuntimeSkinReferenceGroup,
  RuntimeSkinReferenceItem,
} from "../domain/skin-reference-projection";
import { sortSkinReferenceItems } from "../domain/skin-reference-projection";
import { localizedPath } from "../i18n/config";
import { formatRuntimeUrl } from "../domain/runtime-url-state";
import { createDomainHeading } from "../components/domain-icons";
import { createTooltip } from "../components/tooltip";
import {
  createCarousel,
  type CarouselBorderVariantMenu,
  type CarouselSelectOption,
  type CarouselSlide,
} from "../components/Carousel";
import { downloadMediaFile, saveBlob } from "./media-download";
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
      channel: values.channel,
      channelExplicit: preserveExplicitPbe,
    },
    page === "skins"
      ? ["id", "champion", "channel"]
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
  link.href = `${url.pathname}${url.search}${url.hash}`;
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
  action: Pick<RuntimeSkinAction, "label" | "href">,
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

export function appendSkinReferenceTitle(
  parent: HTMLElement,
  name: string,
  rarity: RuntimeRarityView | undefined,
): HTMLElement {
  const title = textNode("span", "", "runtime-skin-reference-title");
  const nameText = textNode("span", name, "runtime-skin-reference-name");
  const nameTooltip = createTooltip(nameText, name);
  nameTooltip.classList.add("runtime-skin-reference-name-tooltip");
  title.appendChild(nameTooltip);
  if (rarity?.iconUrl) {
    const icon = document.createElement("img");
    icon.src = rarity.iconUrl;
    icon.alt = "";
    icon.loading = "lazy";
    icon.decoding = "async";
    if (rarity.label) title.prepend(createTooltip(icon, rarity.label));
    else title.prepend(icon);
  }
  parent.appendChild(title);
  return title;
}

type DetailMediaKey =
  | "collectionSplashVideoUrl"
  | "animatedSplashUrl"
  | "unfocusedSplashUrl"
  | "focusedSplashUrl"
  | "tileUrl"
  | "loadScreenUrl"
  | "loadScreenVintageUrl";

interface DetailMediaDescriptor {
  readonly key: DetailMediaKey;
  readonly kind: "image" | "video";
  readonly en: string;
  readonly zh: string;
}

const detailMediaDescriptors: readonly DetailMediaDescriptor[] = [
  { key: "animatedSplashUrl", kind: "video", en: "Focused animated artwork", zh: "聚焦动态原画" },
  { key: "focusedSplashUrl", kind: "image", en: "Focused artwork", zh: "聚焦原画" },
  { key: "collectionSplashVideoUrl", kind: "video", en: "Unfocused animated artwork", zh: "非聚焦动态原画" },
  { key: "unfocusedSplashUrl", kind: "image", en: "Unfocused artwork", zh: "非聚焦原画" },
  { key: "tileUrl", kind: "image", en: "Thumbnail", zh: "缩略图" },
  { key: "loadScreenUrl", kind: "image", en: "Loading screen", zh: "载入图" },
  { key: "loadScreenVintageUrl", kind: "image", en: "Bordered loading screen", zh: "带边框载入图" },
];

const historyMediaDescriptors = detailMediaDescriptors.filter(
  ({ key }) =>
    key === "collectionSplashVideoUrl" ||
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
  showCaption = true,
): void {
  const figure = document.createElement("figure");
  figure.className = "runtime-media-item";
  if (descriptor.key === "loadScreenUrl" || descriptor.key === "loadScreenVintageUrl")
    figure.classList.add("runtime-media-item--load-screen");
  if (descriptor.key === "tileUrl") figure.classList.add("runtime-media-item--thumbnail");
  const trigger = createMediaPreviewTrigger(url, alt, descriptor, label);
  const cover = document.createElement("span");
  cover.className = "runtime-media-preview-cover";
  cover.setAttribute("aria-hidden", "true");
  cover.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 12s3.2-6 9-6 9 6 9 6-3.2 6-9 6-9-6-9-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  const resource =
    descriptor.kind === "video"
      ? document.createElement("video")
      : document.createElement("img");
  resource.src = url;
  if (descriptor.kind === "video") {
    resource.setAttribute("aria-label", alt);
    const video = resource as HTMLVideoElement;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
  } else {
    const image = resource as HTMLImageElement;
    image.alt = alt;
    image.loading = "lazy";
    image.decoding = "async";
  }
  resource.addEventListener("error", () => resource.remove(), { once: true });
  trigger.appendChild(resource);
  trigger.appendChild(cover);
  figure.appendChild(trigger);
  if (showCaption) figure.appendChild(textNode("figcaption", label, "runtime-media-caption"));
  parent.appendChild(figure);
}

function createMediaPreviewTrigger(
  url: string,
  alt: string,
  descriptor: DetailMediaDescriptor,
  label: string,
): HTMLButtonElement {
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "runtime-media-preview-trigger";
  trigger.dataset.mediaPreviewTrigger = "";
  trigger.dataset.previewKey = descriptor.key;
  trigger.dataset.previewKind = descriptor.kind;
  trigger.dataset.previewSrc = url;
  trigger.dataset.previewFilename = alt;
  trigger.setAttribute("aria-label", `${alt} · ${label}`);
  return trigger;
}

function appendHiddenMediaPreviewTrigger(
  parent: HTMLElement,
  url: string,
  alt: string,
  descriptor: DetailMediaDescriptor,
  label: string,
): void {
  parent.appendChild(createMediaPreviewTrigger(url, alt, descriptor, label));
}

export function appendMediaCollection(
  parent: HTMLElement,
  media: RuntimeMedia,
  locale: CommunityDragonLocale,
  altBase: string,
  descriptors: readonly DetailMediaDescriptor[] = detailMediaDescriptors,
): number {
  let count = 0;
  parent.dataset.mediaPreviewGroup = "";
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

export function appendMediaCarousel(
  parent: HTMLElement,
  media: RuntimeMedia,
  locale: CommunityDragonLocale,
  altBase: string,
): number {
  const artworkKeys = new Set<DetailMediaKey>([
    "animatedSplashUrl",
    "focusedSplashUrl",
    "collectionSplashVideoUrl",
    "unfocusedSplashUrl",
  ]);
  const artworkEntries = detailMediaDescriptors.flatMap((descriptor) => {
    const url = media[descriptor.key];
    return artworkKeys.has(descriptor.key) && url ? [{ descriptor, url }] : [];
  });
  const artworkKinds = [...new Set(artworkEntries.map(({ descriptor }) => descriptor.kind))].sort(
    (left, right) => {
      const preferredIndex = (kind: DetailMediaDescriptor["kind"]): number => {
        const focusedKey = kind === "video" ? "animatedSplashUrl" : "focusedSplashUrl";
        const focusedIndex = artworkEntries.findIndex(({ descriptor }) => descriptor.key === focusedKey);
        return focusedIndex >= 0
          ? focusedIndex
          : artworkEntries.findIndex(({ descriptor }) => descriptor.kind === kind);
      };
      return preferredIndex(left) - preferredIndex(right);
    },
  );
  const slides: CarouselSlide[] = artworkKinds.map((kind) => {
    const variants = artworkEntries.filter(({ descriptor }) => descriptor.kind === kind);
    const focusedKey = kind === "video" ? "animatedSplashUrl" : "focusedSplashUrl";
    let selected = variants.find(({ descriptor }) => descriptor.key === focusedKey) ?? variants[0]!;
    const slide = document.createElement("div");
    const kindLabel = locale === "zh_cn"
      ? kind === "video" ? "动态原画" : "静态原画"
      : kind === "video" ? "Animated artwork" : "Static artwork";
    const focusLabel = (descriptor: DetailMediaDescriptor) =>
      descriptor.key === focusedKey
        ? locale === "zh_cn" ? "聚焦" : "Focused"
        : locale === "zh_cn" ? "非聚焦" : "Unfocused";
    const label = () => `${kindLabel} · ${focusLabel(selected.descriptor)}`;
    const render = () => {
      slide.replaceChildren();
      const mediaLabel = locale === "zh_cn" ? selected.descriptor.zh : selected.descriptor.en;
      appendMediaResource(
        slide,
        selected.url,
        `${altBase} · ${mediaLabel}`,
        selected.descriptor,
        mediaLabel,
        false,
      );
      const gallery = document.createElement("div");
      gallery.hidden = true;
      variants.filter((variant) => variant !== selected).forEach(({ descriptor, url }) => {
        const itemLabel = locale === "zh_cn" ? descriptor.zh : descriptor.en;
        appendHiddenMediaPreviewTrigger(
          gallery,
          url,
          `${altBase} · ${itemLabel}`,
          descriptor,
          itemLabel,
        );
      });
      slide.appendChild(gallery);
      slide.querySelector("video")?.setAttribute("preload", "none");
    };
    render();
    return {
      key: `artwork-${kind}`,
      label: label(),
      content: slide,
      tooltip: variants.length > 1 ? () => {
        const nextIndex = (variants.indexOf(selected) + 1) % variants.length;
        const next = variants[nextIndex]!;
        const currentFocus = focusLabel(selected.descriptor);
        const nextFocus = focusLabel(next.descriptor);
        return locale === "zh_cn"
          ? `当前显示${currentFocus}${kindLabel}，点击此按钮切换为${nextFocus}${kindLabel}`
          : `Showing ${currentFocus.toLowerCase()} ${kindLabel.toLowerCase()}; click this button to switch to ${nextFocus.toLowerCase()} ${kindLabel.toLowerCase()}`;
      } : undefined,
      download: () => {
        const mediaLabel = locale === "zh_cn" ? selected.descriptor.zh : selected.descriptor.en;
        return downloadMediaFile(selected.url, `${altBase} · ${mediaLabel}`);
      },
      onSelect: () => {
        selected = variants.find(({ descriptor }) => descriptor.key === focusedKey) ?? variants[0]!;
        render();
        return label();
      },
      onReselect: variants.length > 1 ? () => {
        const currentIndex = variants.indexOf(selected);
        selected = variants[(currentIndex + 1) % variants.length]!;
        render();
        return label();
      } : undefined,
      onPreviewSelect: (key) => {
        const variant = variants.find(({ descriptor }) => descriptor.key === key);
        if (!variant || variant === selected) return undefined;
        selected = variant;
        render();
        return label();
      },
    };
  });
  const borderOptions: CarouselSelectOption[] = [];
  const otherMediaSlides = detailMediaDescriptors
    .filter((descriptor) => !artworkKeys.has(descriptor.key))
    .flatMap((descriptor, index) => {
      const url = media[descriptor.key];
      if (!url) return [];
      const slide = document.createElement("div");
      const label = locale === "zh_cn" ? descriptor.zh : descriptor.en;
      appendMediaResource(slide, url, `${altBase} · ${label}`, descriptor, label, false);
      const key = `other-media-${index}`;
      if (descriptor.key === "loadScreenVintageUrl")
        borderOptions.push({ label, value: key });
      return [{
        key,
        label,
        content: slide,
        download: () => downloadMediaFile(url, `${altBase} · ${label}`),
      }];
    });
  slides.push(...otherMediaSlides);
  const borderModule = appendBorderModule(media, locale, altBase);
  if (borderModule) {
    slides.push(borderModule.slide);
    borderOptions.push({ label: borderModule.slide.label, value: borderModule.slide.key });
  }
  if (!slides.length) return 0;
  const carousel = createCarousel({
    slides,
    locale,
    label: locale === "zh_cn" ? "皮肤媒体" : "Skin media",
    borderMenu: borderOptions.length
      ? {
        label: locale === "zh_cn" ? "边框" : "Borders",
        options: borderOptions,
        variantSlideKey: borderModule?.slide.key,
        variants: borderModule?.variants,
      }
      : undefined,
    onEmpty: () => appendMissingField(parent, locale, "artwork"),
  });
  if (carousel) {
    carousel.dataset.mediaPreviewGroup = "";
    parent.appendChild(carousel);
  }
  return slides.length;
}

interface BorderCarouselModule {
  readonly slide: CarouselSlide;
  readonly variants: readonly CarouselBorderVariantMenu[];
}

/** Add the transparent border image as its own carousel slide and layer selectors. */
export function appendBorderModule(
  media: RuntimeMedia,
  locale: CommunityDragonLocale,
  altBase: string,
): BorderCarouselModule | undefined {
  const groups = listBorderGroups(media.loadScreenBorders);
  if (!groups.length) return undefined;
  const zh = locale === "zh_cn";
  const label = zh ? "透明边框图" : "Transparent border image";
  const selectedBorders = new Map(
    groups.flatMap((group) => {
      const option = group.options.at(-1);
      return option ? [[group.layer, option] as const] : [];
    }),
  );

  const section = document.createElement("section");
  section.className = "runtime-skin-borders runtime-skin-borders--carousel";
  section.dataset.borderPreview = "border";
  const frame = document.createElement("div");
  frame.className = "runtime-loadscreen-frame";
  frame.setAttribute("role", "img");
  frame.setAttribute("aria-label", label);
  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "runtime-media-preview-trigger runtime-border-preview-trigger";
  trigger.dataset.mediaPreviewTrigger = "";
  trigger.dataset.previewKey = "border-image";
  trigger.dataset.previewKind = "image";
  trigger.dataset.previewFilename = `${altBase} · ${label}`;
  trigger.setAttribute("aria-label", `${altBase} · ${label}`);
  const previewError = document.createElement("span");
  previewError.className = "runtime-border-load-error";
  previewError.setAttribute("role", "status");
  previewError.textContent = zh ? "透明边框预览加载失败" : "Transparent border preview failed to load";
  previewError.hidden = true;
  const failedLayers = new Set<number>();
  const layers = groups.flatMap((group) => {
    const option = selectedBorders.get(group.layer);
    if (!option) return [];
    const layer = document.createElement("img");
    layer.className = "runtime-loadscreen-border";
    layer.dataset.layer = String(group.layer);
    layer.alt = "";
    layer.setAttribute("aria-hidden", "true");
    layer.loading = "lazy";
    layer.decoding = "async";
    layer.src = option.url;
    layer.addEventListener("error", () => {
      failedLayers.add(group.layer);
      trigger.disabled = true;
      previewError.hidden = false;
      section.dispatchEvent(new Event("carousel-slide-availability-change"));
    });
    frame.appendChild(layer);
    return [layer];
  });
  trigger.appendChild(frame);
  section.appendChild(trigger);
  section.appendChild(previewError);

  const slide: CarouselSlide = {
    key: "border-image",
    label,
    content: section,
    downloadAvailable: () => failedLayers.size === 0,
    download: () => downloadBorderLayers(frame),
  };

  let previewRevision = 0;
  const updatePreview = (
    trigger: HTMLButtonElement,
    layers: readonly HTMLImageElement[],
    revision: number,
  ): void => {
    trigger.disabled = true;
    void compositePreviewUrl(layers).then((src) => {
      if (revision !== previewRevision || !trigger.isConnected) return;
      trigger.dataset.previewSrc = src;
      trigger.disabled = false;
      previewError.hidden = true;
    }).catch(() => {
      if (revision === previewRevision) {
        trigger.disabled = true;
        previewError.hidden = false;
      }
    });
  };
  function updatePreviewSources(): void {
    previewRevision += 1;
    updatePreview(trigger, layers, previewRevision);
  }

  const variants = groups.flatMap<CarouselBorderVariantMenu>((group) => {
    const layerLabel = zh ? `第 ${group.layer + 1} 层边框` : `Layer ${group.layer + 1} border`;
    return group.options.length > 1 ? [{
      label: layerLabel,
      value: () => selectedBorders.get(group.layer)?.url ?? "",
      options: group.options.map((option) => ({
        label: borderVariantLabel(option.url, locale),
        value: option.url,
      })),
      onChange: (value) => {
        const option = group.options.find(({ url }) => url === value);
        if (!option) return;
        selectedBorders.set(group.layer, option);
        failedLayers.delete(group.layer);
        const layer = layers.find(({ dataset }) => dataset.layer === String(group.layer));
        if (layer) layer.src = option.url;
        section.dispatchEvent(new Event("carousel-slide-availability-change"));
        updatePreviewSources();
      },
    }] : [];
  });
  updatePreviewSources();
  return { slide, variants };
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

async function compositeCanvas(
  borderUrls: readonly string[],
): Promise<HTMLCanvasElement> {
  const images = await Promise.all(borderUrls.map(loadCrossOriginImage));
  const base = images[0];
  if (!base) throw new Error("No image layers to composite");
  const canvas = document.createElement("canvas");
  canvas.width = base.naturalWidth;
  canvas.height = base.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context unavailable");
  images.forEach((border) => context.drawImage(border, 0, 0, canvas.width, canvas.height));
  return canvas;
}

async function compositePreviewUrl(
  layers: readonly HTMLImageElement[],
): Promise<string> {
  const borderUrls = [...layers]
    .sort((a, b) => Number(a.dataset.layer) - Number(b.dataset.layer))
    .map(({ src }) => src);
  const canvas = await compositeCanvas(borderUrls);
  return canvas.toDataURL("image/png", 0.92);
}

/** Download all selected transparent border layers as one PNG. */
async function downloadBorderLayers(frame: HTMLElement): Promise<void> {
  const layers = Array.from(
    frame.querySelectorAll<HTMLImageElement>(".runtime-loadscreen-border"),
  ).sort((a, b) => Number(a.dataset.layer) - Number(b.dataset.layer));
  if (!layers.length) return;

  try {
    const canvas = await compositeCanvas(layers.map(({ src }) => src));
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Border image export failed");
    const stem = layers[0].src.split("/").pop()?.replace(/\.[a-z0-9]+$/i, "") ?? "border";
    saveBlob(URL.createObjectURL(blob), `${stem}_border.png`);
  } catch {
    window.open(layers[0].src, "_blank", "noopener,noreferrer");
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
    const tooltipTrigger = createTooltip(circle, tooltip);
    tooltipTrigger.classList.add("color-wrap");
    parent.appendChild(tooltipTrigger);
  } else {
    wrapper.appendChild(circle);
    parent.appendChild(wrapper);
  }
  if (isChroma && !values.length) appendMissingField(parent, locale, "colors");
}

export function appendSkinReferenceCard(
  parent: HTMLElement,
  item: RuntimeSkinReferenceItem,
  locale: CommunityDragonLocale,
  channel: "pbe" | "latest",
  controller: RuntimeControllerLike,
  preserveExplicitPbe: boolean,
  showChampionName = false,
): void {
  const card = document.createElement("article");
  card.className = "runtime-skin-reference-card";
  const link = linkWithNavigation(
    "",
    hrefFor(
      locale,
      "skins",
      {
        id: item.id,
        championId: item.championId,
        channel,
      },
      "detail",
      preserveExplicitPbe,
    ),
    controller,
    "runtime-skin-reference-link",
  );
  const name = item.name ?? runtimeMissingLabel(locale, "name");
  link.setAttribute(
    "aria-label",
    showChampionName && item.championName
      ? `${item.championName}: ${name}`
      : name,
  );
  if (item.thumbnailUrl) appendMedia(link, item.thumbnailUrl, name);
  else appendMissingField(link, locale, "thumbnail");
  const meta = document.createElement("span");
  meta.className = "runtime-skin-reference-meta";
  if (showChampionName && item.championName)
    meta.appendChild(
      textNode("span", item.championName, "runtime-skin-reference-champion"),
    );
  appendSkinReferenceTitle(meta, name, item.rarity);
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
  showChampionName = false,
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
        showChampionName,
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
  const controls = document.createElement("div");
  controls.className = "runtime-toolbar runtime-universe-filters";
  const skinlineSelect = document.createElement("select");
  skinlineSelect.className = "cn-select";
  skinlineSelect.id = "runtime-universe-skinline-filter";
  skinlineSelect.setAttribute("aria-label", locale === "zh_cn" ? "系列筛选" : "Filter by skinline");
  const allOption = document.createElement("option");
  allOption.value = "";
  allOption.textContent = locale === "zh_cn" ? "全部系列" : "All skinlines";
  skinlineSelect.appendChild(allOption);
  groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = String(group.skinlineId);
    option.textContent =
      skinlineNames.get(group.skinlineId) ?? runtimeMissingLabel(locale, "name");
    skinlineSelect.appendChild(option);
  });
  const skinlineLabel = document.createElement("label");
  skinlineLabel.className = "runtime-toolbar-field";
  skinlineLabel.htmlFor = skinlineSelect.id;
  skinlineLabel.append(
    textNode("span", locale === "zh_cn" ? "系列" : "Skinline"),
    skinlineSelect,
  );

  const sortSelect = document.createElement("select");
  sortSelect.className = "cn-select";
  sortSelect.id = "runtime-universe-skins-sort";
  sortSelect.setAttribute("aria-label", locale === "zh_cn" ? "皮肤排序" : "Sort skins");
  for (const [value, label] of [
    ["champion", locale === "zh_cn" ? "英雄" : "Champion"],
    ["rarity", locale === "zh_cn" ? "稀有度" : "Rarity"],
  ] as const) {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    sortSelect.appendChild(option);
  }
  const sortLabel = document.createElement("label");
  sortLabel.className = "runtime-toolbar-field";
  sortLabel.htmlFor = sortSelect.id;
  sortLabel.append(
    textNode("span", locale === "zh_cn" ? "排序" : "Sort by"),
    sortSelect,
  );
  controls.append(skinlineLabel, sortLabel);
  parent.appendChild(controls);

  const skinGroups = document.createElement("div");
  skinGroups.className = "runtime-universe-skin-groups";
  const renderGroups = () => {
    skinGroups.replaceChildren();
    groups
      .filter((group) => !skinlineSelect.value || String(group.skinlineId) === skinlineSelect.value)
      .forEach((group, index) => {
        if (index > 0) {
          const divider = document.createElement("div");
          divider.className = "ant-divider ant-divider-horizontal ant-divider-dashed runtime-universe-skin-divider";
          divider.setAttribute("role", "separator");
          skinGroups.appendChild(divider);
        }
        const section = document.createElement("section");
        section.className = "runtime-universe-skin-group";
        const skinlineLink = linkWithNavigation(
          skinlineNames.get(group.skinlineId) ??
            runtimeMissingLabel(locale, "name"),
          hrefFor(
            locale,
            "skinlines",
            { id: group.skinlineId, channel },
            "detail",
            preserveExplicitPbe,
          ),
          controller,
          "runtime-universe-skinline-link",
        );
        const heading = createDomainHeading("skinlines", skinlineLink);
        section.appendChild(heading);
        const cards = document.createElement("div");
        cards.className = "runtime-universe-skin-cards";
        const items = sortSelect.value === "rarity"
          ? sortSkinReferenceItems(group.items, "rarity")
          : [...group.items].sort((left, right) =>
              (left.championName ?? "").localeCompare(
                right.championName ?? "",
                locale === "zh_cn" ? "zh-CN" : "en",
              ) || (left.name ?? "").localeCompare(
                right.name ?? "",
                locale === "zh_cn" ? "zh-CN" : "en",
              ),
            );
        appendSkinReferenceGrid(
          cards,
          items,
          locale,
          channel,
          controller,
          preserveExplicitPbe,
          locale === "zh_cn"
            ? "当前语言没有可显示的宇宙皮肤资料。"
            : "No skin records are available for this universe in this language.",
          true,
        );
        section.appendChild(cards);
        skinGroups.appendChild(section);
      });
  };
  skinlineSelect.addEventListener("change", renderGroups);
  sortSelect.addEventListener("change", renderGroups);
  renderGroups();
  parent.appendChild(skinGroups);
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
