const MIN_SCALE = 1;
const MAX_SCALE = 50;
const SCALE_STEP = 0.5;
interface Point { x: number; y: number; }
interface PinchBaseline { center: Point; distance: number; midpoint: Point; panX: number; panY: number; scale: number; }
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);

type PreviewTrigger = HTMLElement & { readonly dataset: DOMStringMap };

function previewItems(trigger: PreviewTrigger): PreviewTrigger[] {
  const group = trigger.closest<HTMLElement>("[data-media-preview-group]");
  return group ? [...group.querySelectorAll<PreviewTrigger>("[data-media-preview-trigger]")] : [trigger];
}

export function bindMediaViewers(root: ParentNode = document): void {
  const dialog = root.querySelector<HTMLDialogElement>("[data-media-viewer]");
  if (!dialog || dialog.dataset.viewerBound) return;
  const content = dialog.querySelector<HTMLElement>("[data-media-viewer-content]");
  const close = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-close]");
  const previous = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-prev]");
  const next = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-next]");
  const zoomIn = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-zoom-in]");
  const zoomOut = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-zoom-out]");
  const rotateLeft = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-rotate-left]");
  const rotateRight = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-rotate-right]");
  const flipX = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-flip-x]");
  const flipY = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-flip-y]");
  const count = dialog.querySelector<HTMLElement>("[data-media-viewer-count]");
  if (!content || !close || !previous || !next || !zoomIn || !zoomOut || !rotateLeft || !rotateRight || !flipX || !flipY || !count) return;

  dialog.dataset.viewerBound = "1";
  let items: PreviewTrigger[] = [];
  let current = 0;
  let scale = MIN_SCALE;
  let panX = 0;
  let panY = 0;
  let rotation = 0;
  let flipXValue = false;
  let flipYValue = false;
  let activeTrigger: PreviewTrigger | undefined;
  let sourceVideoWasPlaying = false;
  const pointers = new Map<number, Point>();
  let pinch: PinchBaseline | undefined;
  let drag: { pointerId: number; point: Point; panX: number; panY: number } | undefined;
  const pageRoot = document.documentElement;
  const lockPageScroll = (): void => {
    const body = document.body;
    const bodyOverflows = body.scrollHeight > (window.innerHeight || pageRoot.clientHeight)
      && window.innerWidth > body.offsetWidth;
    if (bodyOverflows) {
      const scrollbarWidth = window.innerWidth - pageRoot.clientWidth;
      if (scrollbarWidth > 0) pageRoot.style.setProperty("--media-viewer-scrollbar-width", `${scrollbarWidth}px`);
      pageRoot.classList.add("media-viewer-scroll-compensated");
    }
    pageRoot.classList.add("media-viewer-scroll-locked");
  };
  const unlockPageScroll = (): void => {
    pageRoot.classList.remove("media-viewer-scroll-locked", "media-viewer-scroll-compensated");
    pageRoot.style.removeProperty("--media-viewer-scrollbar-width");
  };

  const media = (): HTMLImageElement | HTMLVideoElement | undefined =>
    content.querySelector<HTMLImageElement | HTMLVideoElement>("img, video") ?? undefined;
  const updateTransform = (): void => {
    const active = media();
    if (active?.tagName === "IMG") {
      active.style.transform = `translate3d(${panX}px, ${panY}px, 0) rotate(${rotation}deg) scale(${scale}) scaleX(${flipXValue ? -1 : 1}) scaleY(${flipYValue ? -1 : 1})`;
    }
    zoomOut.disabled = scale <= MIN_SCALE;
    zoomIn.disabled = scale >= MAX_SCALE;
  };
  const reset = (): void => {
    scale = MIN_SCALE;
    panX = 0;
    panY = 0;
    rotation = 0;
    flipXValue = false;
    flipYValue = false;
    pointers.clear();
    pinch = undefined;
    drag = undefined;
    delete content.dataset.dragging;
    delete content.dataset.pinching;
    updateTransform();
  };
  const render = (): void => {
    const trigger = items[current];
    if (!trigger) return;
    content.replaceChildren();
    const original = trigger.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    const kind = trigger.dataset.previewKind ?? (original?.tagName === "VIDEO" ? "video" : "image");
    const resource = document.createElement(kind === "video" ? "video" : "img");
    resource.className = "ant-image-preview-media";
    resource.src = trigger.dataset.previewSrc || (original?.tagName === "IMG" ? (original as HTMLImageElement).currentSrc || original.src : original?.src) || "";
    if (kind === "video") {
      const video = resource as HTMLVideoElement;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", trigger.getAttribute("aria-label") ?? "Video preview");
      content.dataset.mediaKind = "video";
      [zoomOut, zoomIn, rotateLeft, rotateRight, flipX, flipY].forEach((button) => { button.hidden = true; });
    } else {
      const image = resource as HTMLImageElement;
      image.alt = original?.tagName === "IMG" ? (original as HTMLImageElement).alt : trigger.getAttribute("aria-label") ?? "";
      image.draggable = false;
      image.addEventListener("error", () => {
        const fallback = trigger.dataset.previewFallback || original?.getAttribute("data-fallback");
        if (fallback && image.src !== fallback) image.src = fallback;
        else image.remove();
      }, { once: true });
      delete content.dataset.mediaKind;
      [zoomOut, zoomIn, rotateLeft, rotateRight, flipX, flipY].forEach((button) => { button.hidden = false; });
    }
    content.appendChild(resource);
    reset();
    const hasGroup = items.length > 1;
    previous.hidden = !hasGroup;
    next.hidden = !hasGroup;
    count.hidden = !hasGroup;
    count.textContent = `${current + 1} / ${items.length}`;
  };
  const change = (offset: number): void => {
    current = (current + offset + items.length) % items.length;
    render();
  };
  const zoom = (direction: -1 | 1, point?: Point): void => {
    const ratio = direction > 0 ? 1 + SCALE_STEP : 1 / (1 + SCALE_STEP);
    const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * ratio));
    const actualRatio = nextScale / scale;
    if (point && actualRatio !== 1) {
      panX += (1 - actualRatio) * (point.x - window.innerWidth / 2 - panX);
      panY += (1 - actualRatio) * (point.y - window.innerHeight / 2 - panY);
    }
    scale = nextScale;
    if (scale === MIN_SCALE) panX = panY = 0;
    updateTransform();
  };

  root.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest<PreviewTrigger>("[data-media-preview-trigger]");
    if (!trigger) return;
    event.preventDefault();
    items = previewItems(trigger);
    current = Math.max(0, items.indexOf(trigger));
    activeTrigger = trigger;
    const sourceVideo = trigger.querySelector<HTMLVideoElement>("video");
    sourceVideoWasPlaying = Boolean(sourceVideo && !sourceVideo.paused);
    trigger.closest<HTMLElement>("[data-media-preview-group]")?.querySelectorAll<HTMLVideoElement>("video").forEach((video) => video.pause());
    render();
    lockPageScroll();
    dialog.showModal();
  });
  close.addEventListener("click", () => dialog.close());
  previous.addEventListener("click", () => change(-1));
  next.addEventListener("click", () => change(1));
  zoomIn.addEventListener("click", () => zoom(1));
  zoomOut.addEventListener("click", () => zoom(-1));
  rotateLeft.addEventListener("click", () => { rotation = (rotation + 270) % 360; updateTransform(); });
  rotateRight.addEventListener("click", () => { rotation = (rotation + 90) % 360; updateTransform(); });
  flipX.addEventListener("click", () => { flipXValue = !flipXValue; updateTransform(); });
  flipY.addEventListener("click", () => { flipYValue = !flipYValue; updateTransform(); });
  dialog.addEventListener("close", () => {
    unlockPageScroll();
    media()?.tagName === "VIDEO" && (media() as HTMLVideoElement).pause();
    content.replaceChildren();
    delete content.dataset.mediaKind;
    reset();
    const sourceVideo = activeTrigger?.querySelector<HTMLVideoElement>("video");
    if (sourceVideoWasPlaying && sourceVideo && typeof sourceVideo.play === "function") void sourceVideo.play().catch(() => undefined);
    sourceVideoWasPlaying = false;
    activeTrigger?.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft" && items.length > 1) change(-1);
    if (event.key === "ArrowRight" && items.length > 1) change(1);
  });
  dialog.addEventListener("dblclick", () => { if (media()?.tagName === "IMG") reset(); });
  dialog.addEventListener("wheel", (event) => {
    if (media()?.tagName !== "IMG") return;
    event.preventDefault();
    zoom(event.deltaY < 0 ? 1 : -1, { x: event.clientX, y: event.clientY });
  }, { passive: false });
  const startPinch = (): void => {
    const [a, b] = [...pointers.values()];
    const active = media();
    if (!a || !b || !active) return;
    const initialDistance = distance(a, b);
    if (!Number.isFinite(initialDistance) || initialDistance <= 0) return;
    const bounds = active.getBoundingClientRect();
    pinch = { center: { x: bounds.left + bounds.width / 2 - panX, y: bounds.top + bounds.height / 2 - panY }, distance: initialDistance, midpoint: midpoint(a, b), panX, panY, scale };
    drag = undefined;
    delete content.dataset.dragging;
    content.dataset.pinching = "true";
  };
  const rebaseGesture = (): void => {
    pinch = undefined;
    drag = undefined;
    delete content.dataset.dragging;
    delete content.dataset.pinching;
    if (pointers.size === 2) startPinch();
    else if (pointers.size === 1 && scale > 1) {
      const [pointerId, point] = [...pointers.entries()][0] ?? [];
      if (typeof pointerId === "number" && point) {
        drag = { pointerId, point, panX, panY };
        content.dataset.dragging = "true";
      }
    }
  };
  content.addEventListener("pointerdown", (event) => {
    if (media()?.tagName !== "IMG" || (scale <= 1 && pointers.size > 0)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    content.setPointerCapture(event.pointerId);
    rebaseGesture();
  });
  content.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId)) return;
    event.preventDefault();
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2 && pinch) {
      const [a, b] = [...pointers.values()];
      if (!a || !b) return;
      const currentDistance = distance(a, b);
      if (!Number.isFinite(currentDistance) || currentDistance <= 0) return;
      const currentMidpoint = midpoint(a, b);
      const nextScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, pinch.scale * currentDistance / pinch.distance));
      const ratio = nextScale / pinch.scale;
      panX = currentMidpoint.x - pinch.center.x - ratio * (pinch.midpoint.x - pinch.center.x - pinch.panX);
      panY = currentMidpoint.y - pinch.center.y - ratio * (pinch.midpoint.y - pinch.center.y - pinch.panY);
      scale = nextScale;
      if (scale === MIN_SCALE) panX = panY = 0;
      updateTransform();
    } else if (pointers.size === 1 && drag?.pointerId === event.pointerId) {
      panX = drag.panX + event.clientX - drag.point.x;
      panY = drag.panY + event.clientY - drag.point.y;
      updateTransform();
    }
  });
  const endGesture = (event: PointerEvent): void => { pointers.delete(event.pointerId); rebaseGesture(); };
  content.addEventListener("pointerup", endGesture);
  content.addEventListener("pointercancel", endGesture);
}

export const bindImageViewers = bindMediaViewers;
