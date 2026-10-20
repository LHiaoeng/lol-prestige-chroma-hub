import { createButton } from "./Button";
import { createDivider } from "./Divider";
import { createRadioButtonGroup } from "./RadioButtonGroup";

export interface CarouselSlide {
  readonly key: string;
  label: string;
  readonly content: HTMLElement;
  readonly download: () => Promise<void>;
  readonly tooltip?: () => string;
  readonly onSelect?: () => string | undefined;
  readonly onReselect?: () => string | undefined;
  readonly onPreviewSelect?: (key: string) => string | undefined;
}

export interface CarouselOptions {
  readonly slides: readonly CarouselSlide[];
  readonly locale: "zh_cn" | "default";
  readonly label: string;
  readonly onEmpty?: () => void;
}

let carouselId = 0;

/**
 * Local DOM adaptation of Antdv Next Carousel with explicit radio controls.
 * @see https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/carousel/index.tsx
 */
export function createCarousel(options: CarouselOptions): HTMLDivElement | undefined {
  if (!options.slides.length) return undefined;

  const id = ++carouselId;
  const slides = [...options.slides];
  let selectedKey = slides[0]?.key ?? "";

  const carousel = document.createElement("div");
  carousel.className = "ant-carousel runtime-media-carousel";
  carousel.setAttribute("role", "region");
  carousel.setAttribute("aria-roledescription", options.locale === "zh_cn" ? "轮播" : "carousel");
  carousel.setAttribute("aria-label", options.label);

  const viewport = document.createElement("div");
  viewport.className = "ant-carousel-viewport runtime-media-carousel-viewport";
  const track = document.createElement("div");
  track.className = "ant-carousel-track runtime-media-carousel-track";
  viewport.appendChild(track);

  const controls = document.createElement("div");
  controls.className = "runtime-media-carousel-controls";
  const divider = createDivider({ type: "vertical", className: "runtime-media-carousel-divider" });
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 16 16");
  icon.setAttribute("width", "16");
  icon.setAttribute("height", "16");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M8 1.5v8m0 0 3-3m-3 3-3-3M3 10v3.5h10V10");
  icon.appendChild(path);
  const downloadLabel = options.locale === "zh_cn" ? "下载当前显示内容" : "Download displayed media";
  const downloadButton = createButton({
    size: "middle",
    icon,
    block: true,
    ariaLabel: downloadLabel,
    title: downloadLabel,
    className: "runtime-media-carousel-download",
  });
  downloadButton.addEventListener("click", async () => {
    const slide = slides.find(({ key }) => key === selectedKey);
    if (!slide) return;
    downloadButton.disabled = true;
    try {
      await slide.download();
    } catch {
      // Individual download actions provide their own fallback behavior.
    } finally {
      downloadButton.disabled = false;
    }
  });

  const update = (): void => {
    const activeIndex = Math.max(0, slides.findIndex(({ key }) => key === selectedKey));
    track.style.transform = `translateX(-${activeIndex * 100}%)`;
    slides.forEach(({ content }, index) => {
      content.setAttribute("aria-hidden", String(index !== activeIndex));
      content.inert = index !== activeIndex;
      content.querySelectorAll("video").forEach((video) => {
        if (typeof video.play !== "function") return;
        if (index === activeIndex) void video.play().catch(() => undefined);
        else video.pause();
      });
    });
  };

  const renderControls = (): void => {
    const group = createRadioButtonGroup({
      size: "middle",
      options: slides.map((slide) => ({
        label: slide.label,
        value: slide.key,
        controls: slide.content.id,
        tooltip: slide.tooltip,
        onSelect: slide.onSelect ? () => {
          const nextLabel = slide.onSelect?.();
          if (nextLabel !== undefined) slide.label = nextLabel;
          return slide.label;
        } : undefined,
        onReselect: slide.onReselect ? () => {
          if (selectedKey !== slide.key) return undefined;
          const nextLabel = slide.onReselect?.();
          if (nextLabel !== undefined) slide.label = nextLabel;
          update();
          return slide.label;
        } : undefined,
      })),
      name: `ant-carousel-radio-${id}`,
      idPrefix: `ant-carousel-radio-${id}`,
      value: selectedKey,
      ariaLabel: options.locale === "zh_cn" ? "选择媒体" : "Choose media",
      onChange: (value) => {
        selectedKey = value;
        update();
      },
    });
    controls.replaceChildren(group, divider, downloadButton);
  };

  slides.forEach(({ key, content }, index) => {
    content.classList.add("ant-carousel-slide", "runtime-media-carousel-slide");
    content.id = `ant-carousel-${id}-slide-${index}`;
    content.setAttribute("role", "group");
    content.setAttribute("aria-roledescription", options.locale === "zh_cn" ? "幻灯片" : "slide");
    content.setAttribute(
      "aria-label",
      options.locale === "zh_cn"
        ? `第 ${index + 1} 项，共 ${slides.length} 项`
        : `Slide ${index + 1} of ${slides.length}`,
    );
    content.querySelector("video")?.setAttribute("preload", "none");
    track.appendChild(content);

    content.addEventListener("error", () => {
      const failedIndex = slides.findIndex((slide) => slide.key === key);
      if (failedIndex < 0) return;
      const wasSelected = selectedKey === key;
      slides.splice(failedIndex, 1);
      content.remove();
      if (!slides.length) {
        carousel.remove();
        options.onEmpty?.();
        return;
      }
      if (wasSelected) {
        const nextSelected = slides[Math.min(failedIndex, slides.length - 1)];
        if (nextSelected) selectedKey = nextSelected.key;
      }
      slides.forEach((slide, currentIndex) => {
        slide.content.setAttribute(
          "aria-label",
          options.locale === "zh_cn"
            ? `第 ${currentIndex + 1} 项，共 ${slides.length} 项`
            : `Slide ${currentIndex + 1} of ${slides.length}`,
        );
      });
      renderControls();
      update();
    }, { once: true, capture: true });
  });

  carousel.append(viewport, controls);
  carousel.addEventListener("media-preview-close", (event) => {
    const trigger = (event as CustomEvent<HTMLElement>).detail;
    const slide = slides.find(({ content }) => content.contains(trigger));
    if (!slide) return;
    const label = slide.onPreviewSelect?.(trigger.dataset.previewKey ?? "");
    if (label !== undefined) slide.label = label;
    if (selectedKey === slide.key && label === undefined) return;
    selectedKey = slide.key;
    renderControls();
    update();
  });
  renderControls();
  update();
  return carousel;
}
