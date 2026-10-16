const MIN_SCALE = 1;
const MAX_SCALE = 50;
const SCALE_STEP = 0.5;
interface Point { x: number; y: number; }
interface PinchBaseline { center: Point; distance: number; midpoint: Point; panX: number; panY: number; scale: number; }
interface VideoState { time: number; volume: number; muted: boolean; rate: number; playing: boolean; }
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);
const formatTime = (value: number): string => {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

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
  const resetButton = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-reset]");
  const player = dialog.querySelector<HTMLElement>("[data-media-viewer-player]");
  const play = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-play]");
  const seek = dialog.querySelector<HTMLInputElement>("[data-media-viewer-seek]");
  const time = dialog.querySelector<HTMLElement>("[data-media-viewer-time]");
  const mute = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-mute]");
  const volume = dialog.querySelector<HTMLInputElement>("[data-media-viewer-volume]");
  const status = dialog.querySelector<HTMLElement>("[data-media-viewer-status]");
  const message = dialog.querySelector<HTMLElement>("[data-media-viewer-message]");
  const retry = dialog.querySelector<HTMLButtonElement>("[data-media-viewer-retry]");
  if (!content || !close || !previous || !next || !zoomIn || !zoomOut || !rotateLeft || !rotateRight || !flipX || !flipY || !count || !resetButton || !player || !play || !seek || !time || !mute || !volume || !status || !message || !retry) return;

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
  let displayedTrigger: PreviewTrigger | undefined;
  const videoStates = new Map<PreviewTrigger, VideoState>();
  const sourcePlayback = new Map<HTMLVideoElement, boolean>();
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
  const video = (): HTMLVideoElement | undefined => {
    const active = media();
    return active?.tagName === "VIDEO" ? active as HTMLVideoElement : undefined;
  };
  const showStatus = (state?: "loading" | "error"): void => {
    status.hidden = !state;
    message.textContent = state ? status.dataset[state] ?? "" : "";
    retry.hidden = state !== "error";
  };
  const fitMedia = (): void => {
    const active = media();
    if (!active) return;
    const width = active.tagName === "IMG" ? (active as HTMLImageElement).naturalWidth : (active as HTMLVideoElement).videoWidth;
    const height = active.tagName === "IMG" ? (active as HTMLImageElement).naturalHeight : (active as HTMLVideoElement).videoHeight;
    if (!width || !height) return;
    const rotated = rotation % 180 !== 0;
    const ratio = Math.min((content.clientWidth || window.innerWidth) / (rotated ? height : width), (content.clientHeight || window.innerHeight) / (rotated ? width : height));
    active.style.width = `${width * ratio}px`;
    active.style.height = `${height * ratio}px`;
  };
  const updateTransform = (): void => {
    const active = media();
    if (active) {
      active.style.transform = `translate3d(${panX}px, ${panY}px, 0) rotate(${rotation}deg) scale(${scale}) scaleX(${flipXValue ? -1 : 1}) scaleY(${flipYValue ? -1 : 1})`;
    }
    content.dataset.zoomed = String(scale > MIN_SCALE);
    zoomOut.disabled = scale <= MIN_SCALE;
    zoomIn.disabled = scale >= MAX_SCALE;
  };
  const updatePlayback = (): void => {
    const active = video();
    if (!active) return;
    const duration = Number.isFinite(active.duration) ? active.duration : 0;
    play.dataset.playing = String(!active.paused);
    play.setAttribute("aria-label", active.paused ? play.dataset.play! : play.dataset.pause!);
    mute.dataset.muted = String(active.muted || active.volume === 0);
    mute.setAttribute("aria-label", active.muted || active.volume === 0 ? mute.dataset.unmute! : mute.dataset.mute!);
    seek.disabled = duration <= 0;
    seek.max = String(duration);
    seek.value = String(active.currentTime);
    seek.setAttribute("aria-valuetext", `${formatTime(active.currentTime)} / ${formatTime(duration)}`);
    time.textContent = `${formatTime(active.currentTime)} / ${formatTime(duration)}`;
    volume.value = String(active.muted ? 0 : active.volume);
    volume.setAttribute("aria-valuetext", `${Math.round(Number(volume.value) * 100)}%`);
  };
  const storeVideo = (): void => {
    const active = video();
    if (!active || !displayedTrigger) return;
    const state = { time: active.readyState >= 1 ? active.currentTime : videoStates.get(displayedTrigger)?.time ?? 0, volume: active.volume, muted: active.muted, rate: active.playbackRate, playing: !active.paused };
    videoStates.set(displayedTrigger, state);
    active.pause();
    const source = displayedTrigger.querySelector<HTMLVideoElement>("video");
    if (source) {
      source.currentTime = state.time;
      source.volume = state.volume;
      source.muted = state.muted;
      source.playbackRate = state.rate;
    }
  };
  const togglePlayback = (): void => {
    const active = video();
    if (!active) return;
    if (active.paused) void active.play().catch(() => updatePlayback());
    else active.pause();
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
    fitMedia();
    updateTransform();
  };
  const render = (): void => {
    const trigger = items[current];
    if (!trigger) return;
    storeVideo();
    content.replaceChildren();
    displayedTrigger = trigger;
    showStatus("loading");
    const original = trigger.querySelector<HTMLImageElement | HTMLVideoElement>("img, video");
    const kind = trigger.dataset.previewKind ?? (original?.tagName === "VIDEO" ? "video" : "image");
    const resource = document.createElement(kind === "video" ? "video" : "img");
    resource.className = "ant-image-preview-media";
    const src = trigger.dataset.previewSrc || original?.currentSrc || original?.src || "";
    resource.addEventListener("error", () => {
      if (media() === resource && kind === "video") showStatus("error");
    });
    player.hidden = kind !== "video";
    if (kind === "video") {
      const video = resource as HTMLVideoElement;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("aria-label", trigger.getAttribute("aria-label") ?? "Video preview");
      const source = original?.tagName === "VIDEO" ? original as HTMLVideoElement : undefined;
      const state = videoStates.get(trigger) ?? { time: source?.currentTime ?? 0, volume: source?.volume ?? 1, muted: source?.muted ?? false, rate: source?.playbackRate ?? 1, playing: source ? sourcePlayback.get(source) ?? false : false };
      videoStates.set(trigger, state);
      video.volume = state.volume;
      video.muted = state.muted;
      video.playbackRate = state.rate;
      video.poster = source?.poster ?? "";
      video.loop = source?.loop ?? false;
      video.addEventListener("loadedmetadata", () => {
        if (media() !== video) return;
        video.currentTime = Number.isFinite(video.duration) ? Math.min(state.time, video.duration) : state.time;
        fitMedia();
        updatePlayback();
      }, { once: true });
      video.addEventListener("resize", () => { if (media() === video) fitMedia(); });
      for (const event of ["play", "pause", "timeupdate", "durationchange", "volumechange", "ended"]) {
        video.addEventListener(event, () => { if (media() === video) updatePlayback(); });
      }
      for (const event of ["loadeddata", "canplay", "playing"]) {
        video.addEventListener(event, () => { if (media() === video) showStatus(); });
      }
      video.addEventListener("waiting", () => { if (media() === video) showStatus("loading"); });
      content.dataset.mediaKind = "video";
    } else {
      const image = resource as HTMLImageElement;
      image.alt = original?.tagName === "IMG" ? (original as HTMLImageElement).alt : trigger.getAttribute("aria-label") ?? "";
      image.draggable = false;
      let usingFallback = false;
      image.addEventListener("load", () => {
        if (media() !== image) return;
        fitMedia();
        showStatus();
      });
      image.addEventListener("error", () => {
        if (media() !== image) return;
        const fallback = trigger.dataset.previewFallback || original?.getAttribute("data-fallback");
        if (fallback && !usingFallback) {
          usingFallback = true;
          image.src = fallback;
        } else {
          image.remove();
          showStatus("error");
        }
      });
      delete content.dataset.mediaKind;
    }
    content.appendChild(resource);
    resource.src = src;
    reset();
    updatePlayback();
    if (kind === "video" && videoStates.get(trigger)?.playing) void (resource as HTMLVideoElement).play().catch(() => updatePlayback());
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
    videoStates.clear();
    sourcePlayback.clear();
    for (const item of items) {
      const source = item.querySelector<HTMLVideoElement>("video");
      if (source && !sourcePlayback.has(source)) {
        sourcePlayback.set(source, !source.paused);
        source.pause();
      }
    }
    render();
    lockPageScroll();
    dialog.showModal();
  });
  close.addEventListener("click", () => dialog.close());
  previous.addEventListener("click", () => change(-1));
  next.addEventListener("click", () => change(1));
  zoomIn.addEventListener("click", () => zoom(1));
  zoomOut.addEventListener("click", () => zoom(-1));
  rotateLeft.addEventListener("click", () => { rotation = (rotation + 270) % 360; fitMedia(); updateTransform(); });
  rotateRight.addEventListener("click", () => { rotation = (rotation + 90) % 360; fitMedia(); updateTransform(); });
  flipX.addEventListener("click", () => { flipXValue = !flipXValue; updateTransform(); });
  flipY.addEventListener("click", () => { flipYValue = !flipYValue; updateTransform(); });
  resetButton.addEventListener("click", reset);
  retry.addEventListener("click", render);
  play.addEventListener("click", togglePlayback);
  seek.addEventListener("input", () => {
    const active = video();
    const position = Number(seek.value);
    if (active && Number.isFinite(position) && Number.isFinite(active.duration)) {
      active.currentTime = Math.max(0, Math.min(active.duration, position));
      updatePlayback();
    }
  });
  mute.addEventListener("click", () => {
    const active = video();
    if (!active) return;
    if (active.volume === 0) { active.volume = 1; active.muted = false; }
    else active.muted = !active.muted;
    updatePlayback();
  });
  volume.addEventListener("input", () => {
    const active = video();
    const level = Number(volume.value);
    if (!active || !Number.isFinite(level)) return;
    active.volume = Math.max(0, Math.min(1, level));
    active.muted = active.volume === 0;
    updatePlayback();
  });
  dialog.addEventListener("close", () => {
    unlockPageScroll();
    storeVideo();
    content.replaceChildren();
    delete content.dataset.mediaKind;
    reset();
    player.hidden = true;
    showStatus();
    for (const [source, wasPlaying] of sourcePlayback) {
      if (wasPlaying && source.isConnected) void source.play().catch(() => undefined);
    }
    sourcePlayback.clear();
    videoStates.clear();
    displayedTrigger = undefined;
    activeTrigger?.focus();
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener("keydown", (event) => {
    const target = event.target;
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || (target instanceof Element && target.closest("input, select, textarea, [contenteditable]"))) return;
    if (event.key === "ArrowLeft" && items.length > 1) { event.preventDefault(); change(-1); }
    if (event.key === "ArrowRight" && items.length > 1) { event.preventDefault(); change(1); }
    if (event.key === " " && video() && !(target instanceof Element && target.closest("button"))) { event.preventDefault(); togglePlayback(); }
  });
  content.addEventListener("dblclick", reset);
  content.addEventListener("wheel", (event) => {
    if (!media()) return;
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
    if (!media() || (event.pointerType === "mouse" && event.button !== 0)) return;
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
  const endGesture = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (content.hasPointerCapture(event.pointerId)) content.releasePointerCapture(event.pointerId);
    rebaseGesture();
  };
  content.addEventListener("pointerup", endGesture);
  content.addEventListener("pointercancel", endGesture);
  content.addEventListener("lostpointercapture", endGesture);
  window.addEventListener("resize", fitMedia);
}

export const bindImageViewers = bindMediaViewers;
