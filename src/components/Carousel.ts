import { createButton } from "./Button";
import { createDivider } from "./Divider";
import { createRadioButtonGroup } from "./RadioButtonGroup";
import { createDropdown } from "./dropdown-menu";

export interface CarouselSelectOption {
  readonly label: string;
  readonly value: string;
}

export interface CarouselBorderVariantMenu {
  readonly label: string;
  readonly value: () => string;
  readonly options: readonly CarouselSelectOption[];
  readonly onChange: (value: string) => void;
}

export interface CarouselBorderMenu {
  readonly label: string;
  readonly options: readonly CarouselSelectOption[];
  readonly variantSlideKey?: string;
  readonly variants?: readonly CarouselBorderVariantMenu[];
}

export interface CarouselSlide {
  readonly key: string;
  label: string;
  readonly content: HTMLElement;
  readonly download: () => Promise<void>;
  readonly tooltip?: () => string;
  readonly downloadAvailable?: () => boolean;
  readonly onSelect?: () => string | undefined;
  readonly onReselect?: () => string | undefined;
  readonly onPreviewSelect?: (key: string) => string | undefined;
}

export interface CarouselOptions {
  readonly slides: readonly CarouselSlide[];
  readonly locale: "zh_cn" | "default";
  readonly label: string;
  readonly borderMenu?: CarouselBorderMenu;
  readonly onEmpty?: () => void;
}

let carouselId = 0;

function dropdownChevron(): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("ant-dropdown-down-icon");
  icon.setAttribute("viewBox", "0 0 1024 1024");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z");
  icon.append(path);
  return icon;
}

function menuRadioItem(label: string, value: string, onSelect: () => void): HTMLLIElement {
  const item = document.createElement("li");
  item.setAttribute("role", "none");
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.antDropdownItem = "";
  button.dataset.carouselValue = value;
  button.setAttribute("role", "menuitemradio");
  button.setAttribute("aria-checked", "false");
  const check = document.createElement("span");
  check.setAttribute("aria-hidden", "true");
  check.textContent = "✓";
  const text = document.createElement("span");
  text.textContent = label;
  button.append(text, check);
  button.addEventListener("click", onSelect);
  item.append(button);
  return item;
}

/**
 * Local DOM adaptation of Antdv Next Carousel with explicit radio controls.
 * @see https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/carousel/index.tsx
 */
export function createCarousel(options: CarouselOptions): HTMLDivElement | undefined {
  if (!options.slides.length) return undefined;

  const id = ++carouselId;
  const slides = [...options.slides];
  const failedSlides = new Set<string>();
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
  const borderOptions = options.borderMenu?.options.filter(({ value }) => slides.some((slide) => slide.key === value)) ?? [];
  const borderSlideKeys = new Set(borderOptions.map(({ value }) => value));
  let selectedBorderKey = borderOptions[0]?.value;
  let radioGroup: HTMLFieldSetElement | undefined;
  let borderDropdown: HTMLDivElement | undefined;
  let borderLabel: HTMLSpanElement | undefined;
  let borderVariants: HTMLDivElement | undefined;
  let variantDropdowns: { dropdown: HTMLDivElement; variant: CarouselBorderVariantMenu; label: HTMLSpanElement }[] = [];
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
    const selectedSlide = slides.find(({ key }) => key === selectedKey);
    downloadButton.disabled = failedSlides.has(selectedKey) || selectedSlide?.downloadAvailable?.() === false;
    if (borderDropdown) {
      if (borderSlideKeys.has(selectedKey)) selectedBorderKey = selectedKey;
      const selectedBorderLabel = borderOptions.find(({ value }) => value === selectedBorderKey)?.label;
      if (borderLabel) borderLabel.textContent = selectedBorderLabel ?? options.borderMenu?.label ?? "";
      borderDropdown.querySelector(".ant-dropdown-trigger")?.setAttribute(
        "aria-label", [options.borderMenu?.label, selectedBorderLabel].filter(Boolean).join(": "),
      );
      borderDropdown.classList.toggle("ant-radio-button-wrapper-checked", borderSlideKeys.has(selectedKey));
      borderDropdown.querySelectorAll<HTMLButtonElement>("[data-ant-dropdown-item]").forEach((button) => {
        button.setAttribute("aria-checked", String(button.dataset.carouselValue === selectedBorderKey));
      });
    }
    if (borderSlideKeys.has(selectedKey)) {
      radioGroup?.querySelectorAll<HTMLInputElement>(".ant-radio-button-input").forEach((input) => {
        input.checked = false;
        input.parentElement?.classList.remove("ant-radio-button-wrapper-checked");
      });
    }
    if (borderVariants) {
      borderVariants.hidden = selectedKey !== options.borderMenu?.variantSlideKey;
      variantDropdowns.forEach(({ dropdown, variant, label }) => {
        label.textContent = `${variant.label}: ${variant.options.find(({ value }) => value === variant.value())?.label ?? ""}`;
        dropdown.querySelectorAll<HTMLButtonElement>("[data-ant-dropdown-item]").forEach((button) => {
          button.setAttribute("aria-checked", String(button.dataset.carouselValue === variant.value()));
        });
      });
    }
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
    const controlNodes: HTMLElement[] = [];
    const radioSlides = slides.filter(({ key }) => !borderSlideKeys.has(key));
    radioGroup = createRadioButtonGroup({
      size: "middle",
      options: radioSlides.map((slide) => ({
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
    controlNodes.push(radioGroup);
    borderDropdown = undefined;
    borderLabel = undefined;
    borderVariants = undefined;
    variantDropdowns = [];
    if (options.borderMenu) {
      borderLabel = document.createElement("span");
      borderLabel.textContent = options.borderMenu.label;
      borderDropdown = createDropdown(
        `ant-carousel-${id}-borders`, borderLabel,
        borderOptions.map(({ label, value }) => menuRadioItem(label, value, () => {
            selectedKey = value;
            update();
          })),
      );
      borderDropdown.classList.add("ant-radio-button-wrapper");
      borderDropdown.classList.add("runtime-carousel-border-dropdown");
      borderDropdown.querySelector(".ant-dropdown-trigger")?.append(dropdownChevron());
      borderDropdown.querySelector(".ant-dropdown-trigger")?.addEventListener("click", () => {
        if (selectedBorderKey) selectedKey = selectedBorderKey;
        update();
      });
      radioGroup?.append(borderDropdown);

      if (options.borderMenu.variants?.length) {
        const variantControls = document.createElement("div");
        variantControls.className = "runtime-carousel-border-variants";
        variantControls.hidden = true;
        options.borderMenu.variants.forEach((variant, index) => {
          const label = document.createElement("span");
          label.textContent = variant.label;
          const dropdown = createDropdown(
            `ant-carousel-${id}-border-layer-${index}`, label,
            variant.options.map(({ label: optionLabel, value }) => menuRadioItem(optionLabel, value, () => {
              variant.onChange(value);
              update();
            })),
          );
          dropdown.classList.add("runtime-carousel-border-variant-dropdown");
          dropdown.querySelector(".ant-dropdown-trigger")?.append(dropdownChevron());
          dropdown.querySelector(".ant-dropdown-trigger")?.setAttribute("aria-label", variant.label);
          variantControls.append(dropdown);
          variantDropdowns.push({ dropdown, variant, label });
        });
        borderVariants = variantControls;
        controlNodes.push(variantControls);
      }
    }
    controls.replaceChildren(...controlNodes, divider, downloadButton);
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
    content.addEventListener("carousel-slide-availability-change", update);
    content.querySelector("video")?.setAttribute("preload", "none");
    track.appendChild(content);

    content.addEventListener("error", () => {
      if (key === "border-image" || content.querySelector('[data-preview-key="loadScreenVintageUrl"]')) {
        if (key !== "border-image") failedSlides.add(key);
        const error = content.querySelector<HTMLElement>(".runtime-border-load-error")
          ?? document.createElement("p");
        error.className = key === "border-image"
          ? "runtime-border-load-error"
          : "runtime-media-load-error";
        error.setAttribute("role", "status");
        error.textContent = key === "border-image"
          ? options.locale === "zh_cn" ? "透明边框预览加载失败" : "Transparent border preview failed to load"
          : options.locale === "zh_cn" ? "带边框载入图加载失败" : "Bordered loading screen failed to load";
        error.hidden = false;
        if (!error.parentElement) content.appendChild(error);
        update();
        return;
      }
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
