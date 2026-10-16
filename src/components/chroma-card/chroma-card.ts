import type { CommunityDragonLocale } from "../../domain/communitydragon-runtime";
import "./chroma-card.css";
import {
  appendChromaColorCircle,
  appendMissingField,
  textNode,
} from "../../client/runtime-reference-view-shared";

export interface ChromaCardOptions {
  /** 显示名称（已处理缺失占位） */
  readonly name: string;
  /** 名称缺失时加 runtime-missing 类 */
  readonly nameMissing?: boolean;
  /** 标题层级，默认 h3；有链接时强制 span */
  readonly heading?: 2 | 3;
  /** 图片 URL，缺失或加载失败时渲染 missing 占位 */
  readonly imageUrl?: string;
  /** 图片 alt 文本，默认使用 name */
  readonly imageAlt?: string;
  /** Parent skin artwork used by the image toggle. */
  readonly originalImageUrl?: string;
  /** Render a linked image as a preview button, leaving the card title as its link. */
  readonly preview?: boolean;
  /** 描述文本，渲染在名称下方 */
  readonly description?: string;
  /** 炫彩色值列表 */
  readonly colors?: readonly string[];
  /** true = 原皮（非炫彩态），false = 炫彩态（默认） */
  readonly isBase?: boolean;
  readonly locale: CommunityDragonLocale;
  /** 图片缺失时的标签类型，默认 thumbnail */
  readonly missingKind?: "thumbnail" | "artwork";
  /** 预构建的链接元素，包裹媒体+名称（PBE 用） */
  readonly link?: HTMLAnchorElement;
  /** 预构建的所属皮肤链接，渲染为卡片尾部段落（无前缀文案） */
  readonly ownerLink?: HTMLAnchorElement;
}

/**
 * 创建炫彩卡片 DOM 节点。
 *
 * 结构以详情页炫彩卡为基线：
 * article > [link?] > media(图片 + 色圈叠加) + meta(名称 + 描述)
 *                + owner(所属皮肤链接，无前缀)
 *
 * 色圈叠加在图片上靠近底部居中，仅在媒体区内出现一次。
 * 图片缺失或加载失败时统一渲染 .runtime-missing 占位。
 */
export function createChromaCard(options: ChromaCardOptions): HTMLElement {
  const card = document.createElement("article");
  const classes = ["runtime-chroma-card"];
  if (options.link) classes.push("runtime-chroma-card--linked");
  if (options.ownerLink) classes.push("runtime-chroma-card--with-owner");
  if (options.isBase) classes.push("runtime-chroma-base");
  card.className = classes.join(" ");

  const content = options.link && !options.preview ? options.link : card;

  const media = document.createElement("div");
  media.className = "runtime-chroma-media";
  const missingKind = options.missingKind ?? "thumbnail";
  const showMissing = () =>
    appendMissingField(media, options.locale, missingKind);

  if (options.imageUrl) {
    const image = document.createElement("img");
    image.src = options.imageUrl;
    image.alt = options.imageAlt ?? options.name;
    image.loading = "lazy";
    image.decoding = "async";
    image.addEventListener(
      "error",
      () => {
        image.remove();
        showMissing();
      },
      { once: true },
    );
    if (options.preview) {
      const preview = document.createElement("button");
      preview.className = "runtime-chroma-preview";
      preview.type = "button";
      preview.dataset.mediaPreviewTrigger = "";
      preview.dataset.previewKind = "image";
      preview.dataset.previewSrc = options.imageUrl;
      preview.setAttribute(
        "aria-label",
        options.locale === "zh_cn"
          ? `预览${options.name}大图`
          : `Preview ${options.name}`,
      );
      preview.appendChild(image);
      media.appendChild(preview);
    } else media.appendChild(image);
  } else {
    showMissing();
  }
  appendChromaColorCircle(
    media,
    options.colors,
    options.locale,
    !options.isBase,
  );
  content.appendChild(media);

  const meta = document.createElement("div");
  meta.className = "runtime-chroma-meta";
  const nameTag = options.link
    ? "span"
    : options.heading === 2
      ? "h2"
      : "h3";
  const name = textNode(nameTag, options.name, "runtime-chroma-name");
  if (options.nameMissing) name.classList.add("runtime-missing");
  meta.appendChild(name);
  if (options.description) {
    meta.appendChild(
      textNode("p", options.description, "runtime-chroma-note"),
    );
  }
  (options.link && options.preview ? options.link : content).appendChild(meta);

  if (options.link) {
    options.link.classList.add("runtime-chroma-link");
    options.link.setAttribute("aria-label", options.name);
    card.appendChild(options.link);
  }

  const chromaImageUrl = options.imageUrl;
  const originalImageUrl = options.originalImageUrl;
  if (chromaImageUrl && originalImageUrl && chromaImageUrl !== originalImageUrl) {
    const image = card
      .querySelector<HTMLElement>(".runtime-chroma-media")
      ?.querySelector<HTMLImageElement>("img");
    const preview = card.querySelector<HTMLElement>("[data-media-preview-trigger]");
    const toggle = document.createElement("button");
    toggle.className = "runtime-chroma-image-toggle";
    toggle.type = "button";
    const setArtwork = (showOriginal: boolean): void => {
      if (!image) return;
      image.src = showOriginal ? originalImageUrl : chromaImageUrl;
      if (preview) preview.dataset.previewSrc = image.src;
      toggle.setAttribute(
        "aria-label",
        options.locale === "zh_cn"
          ? showOriginal
            ? "切换到臻彩图"
            : "切换到原图"
          : showOriginal
            ? "Show chroma artwork"
            : "Show original artwork",
      );
      toggle.title = toggle.getAttribute("aria-label") ?? "";
      toggle.dataset.showingOriginal = String(showOriginal);
    };
    toggle.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7h11l-2.5-2.5L17 3l5 5-5 5-1.5-1.5L18 9H7V7Zm10 10H6l2.5 2.5L7 21l-5-5 5-5 1.5 1.5L6 15h11v2Z"/></svg>';
    toggle.addEventListener("click", () => setArtwork(toggle.dataset.showingOriginal !== "true"));
    setArtwork(false);
    card.appendChild(toggle);
  }

  if (options.ownerLink) {
    const owner = document.createElement("p");
    owner.className = "runtime-chroma-owner";
    owner.appendChild(options.ownerLink);
    card.appendChild(owner);
  }

  return card;
}
