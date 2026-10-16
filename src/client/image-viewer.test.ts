import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindMediaViewers } from "./image-viewer";

type Handler = (event: Record<string, unknown>) => void;

class TestElement {
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, Handler[]>();
  properties = new Map<string, string>();
  classes = new Set<string>();
  captures = new Set<number>();
  style = {
    transform: "", width: "", height: "",
    setProperty: (key: string, value: string) => this.properties.set(key, value),
    removeProperty: (key: string) => this.properties.delete(key),
  };
  classList = {
    add: (...names: string[]) => names.forEach((name) => this.classes.add(name)),
    remove: (...names: string[]) => names.forEach((name) => this.classes.delete(name)),
  };
  value = "";
  max = "";
  clientWidth = 1000;
  clientHeight = 800;
  focused = false;
  isConnected = true;
  hidden = false;
  disabled = false;
  textContent = "";
  addEventListener(type: string, handler: Handler): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), handler]);
  }
  dispatch(type: string, event: Record<string, unknown> = {}): void {
    this.listeners.get(type)?.forEach((handler) => handler({ target: this, preventDefault: () => undefined, ...event }));
  }
  closest<T extends TestElement>(selector: string): T | null {
    if (selector === "[data-media-preview-trigger]" && this.dataset.mediaPreviewTrigger !== undefined) return this as unknown as T;
    if (selector === "input, select, textarea, [contenteditable]" && this.attributes.get("type") === "range") return this as unknown as T;
    return null;
  }
  querySelector<T extends TestElement>(_selector?: string): T | null { return null; }
  querySelectorAll<T extends TestElement>(): T[] { return []; }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  focus(): void { this.focused = true; }
  setPointerCapture(id: number): void { this.captures.add(id); }
  hasPointerCapture(id: number): boolean { return this.captures.has(id); }
  releasePointerCapture(id: number): void { this.captures.delete(id); }
  getBoundingClientRect(): { left: number; top: number; width: number; height: number } {
    const width = Number.parseFloat(this.style.width) || 1000;
    const height = Number.parseFloat(this.style.height) || 800;
    return { left: (1000 - width) / 2, top: (800 - height) / 2, width, height };
  }
}

class TestMedia extends TestElement {
  constructor(readonly tagName: string) { super(); }
  src = "";
  currentSrc = "";
  alt = "";
  naturalWidth = 1920;
  naturalHeight = 1080;
  videoWidth = 1920;
  videoHeight = 1080;
  controls = false;
  playsInline = false;
  preload = "";
  paused = true;
  poster = "";
  loop = false;
  muted = false;
  volume = 1;
  playbackRate = 1;
  currentTime = 0;
  duration = 120;
  readyState = 0;
  playCalls = 0;
  removed = false;
  remove(): void { this.removed = true; }
  pause(): void { this.paused = true; this.dispatch("pause"); }
  play(): Promise<void> { this.paused = false; this.playCalls += 1; this.dispatch("play"); return Promise.resolve(); }
  metadata(): void { this.readyState = 1; this.dispatch("loadedmetadata"); }
}

class TestGroup extends TestElement {
  constructor(readonly triggers: TestTrigger[]) { super(); }
  override querySelectorAll<T extends TestElement>(selector?: string): T[] {
    return selector === "[data-media-preview-trigger]" ? this.triggers as unknown as T[] : [];
  }
}

class TestTrigger extends TestElement {
  constructor(readonly original: TestMedia) { super(); Object.assign(this.dataset, { mediaPreviewTrigger: "", previewKind: "image", previewSrc: "first.jpg" }); }
  override querySelector<T extends TestElement>(selector?: string): T | null {
    return selector === "img, video" || selector?.toUpperCase() === this.original.tagName ? this.original as unknown as T : null;
  }
  group?: TestGroup;
  override closest<T extends TestElement>(selector: string): T | null {
    if (selector === "[data-media-preview-group]" && this.group) return this.group as unknown as T;
    return super.closest(selector);
  }
}

class TestContent extends TestElement {
  children: TestMedia[] = [];
  appendChild(child: TestMedia): void { this.children.push(child); }
  replaceChildren(...children: TestMedia[]): void { this.children = children; }
  override querySelector<T extends TestElement>(selector?: string): T | null {
    return (selector === "img, video" ? this.children.find((child) => !child.removed) ?? null : null) as unknown as T | null;
  }
}

class TestDialog extends TestElement {
  opened = 0;
  closed = 0;
  constructor(private readonly controls: Map<string, TestElement>) { super(); }
  override querySelector<T extends TestElement>(selector?: string): T | null { return (this.controls.get(selector ?? "") as unknown as T | undefined) ?? null; }
  showModal(): void { this.opened += 1; }
  close(): void { this.closed += 1; this.dispatch("close"); }
}

class TestRoot extends TestElement {
  constructor(readonly dialog: TestDialog) { super(); }
  override querySelector<T extends TestElement>(_selector?: string): T { return this.dialog as unknown as T; }
}

function setup(): { root: TestRoot; dialog: TestDialog; trigger: TestTrigger; content: TestContent; controls: Map<string, TestElement> } {
  const content = new TestContent();
  const controls = new Map<string, TestElement>([
    ["[data-media-viewer-content]", content],
    ["[data-media-viewer-close]", new TestElement()],
    ["[data-media-viewer-prev]", new TestElement()],
    ["[data-media-viewer-next]", new TestElement()],
    ["[data-media-viewer-zoom-in]", new TestElement()],
    ["[data-media-viewer-zoom-out]", new TestElement()],
    ["[data-media-viewer-rotate-left]", new TestElement()],
    ["[data-media-viewer-rotate-right]", new TestElement()],
    ["[data-media-viewer-flip-x]", new TestElement()],
    ["[data-media-viewer-flip-y]", new TestElement()],
    ["[data-media-viewer-count]", new TestElement()],
    ...["reset", "player", "play", "seek", "time", "mute", "volume", "status", "message", "retry"].map((name) => [`[data-media-viewer-${name}]`, new TestElement()] as const),
  ]);
  Object.assign(controls.get("[data-media-viewer-status]")!.dataset, { loading: "Loading media…", error: "Unable to load media" });
  Object.assign(controls.get("[data-media-viewer-play]")!.dataset, { play: "Play", pause: "Pause" });
  Object.assign(controls.get("[data-media-viewer-mute]")!.dataset, { mute: "Mute", unmute: "Unmute" });
  controls.get("[data-media-viewer-seek]")!.setAttribute("type", "range");
  controls.get("[data-media-viewer-volume]")!.setAttribute("type", "range");
  const dialog = new TestDialog(controls);
  return { root: new TestRoot(dialog), dialog, trigger: new TestTrigger(new TestMedia("IMG")), content, controls };
}

let pageRoot: TestElement;
let viewport: TestElement;
beforeEach(() => {
  pageRoot = new TestElement();
  pageRoot.clientWidth = 980;
  viewport = new TestElement();
  vi.stubGlobal("Element", TestElement);
  vi.stubGlobal("window", Object.assign(viewport, { innerWidth: 1000, innerHeight: 800 }));
  vi.stubGlobal("document", { documentElement: pageRoot, body: { scrollHeight: 2000, offsetWidth: 980 }, createElement: (tagName: string) => new TestMedia(tagName.toUpperCase()) });
});
afterEach(() => vi.unstubAllGlobals());

describe("media viewer", () => {
  it("opens the full image, zooms, and closes", () => {
    const { root, dialog, trigger, content, controls } = setup();
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(dialog.opened).toBe(1);
    expect(content.children[0]?.src).toBe("first.jpg");
    expect(Number.parseFloat(content.children[0]!.style.width)).toBeCloseTo(1000);
    expect(Number.parseFloat(content.children[0]!.style.height)).toBeCloseTo(562.5);
    expect(pageRoot.classes.has("media-viewer-scroll-locked")).toBe(true);
    expect(pageRoot.properties.get("--media-viewer-scrollbar-width")).toBe("20px");
    controls.get("[data-media-viewer-zoom-in]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("scale(1.5)");
    controls.get("[data-media-viewer-rotate-left]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("rotate(270deg)");
    controls.get("[data-media-viewer-flip-y]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("scaleY(-1)");
    controls.get("[data-media-viewer-close]")?.dispatch("click");
    expect(dialog.closed).toBe(1);
    expect(content.children).toHaveLength(0);
    expect(pageRoot.classes.size).toBe(0);
    expect(pageRoot.properties.size).toBe(0);
    expect(trigger.focused).toBe(true);
  });

  it("gives video the same viewport and transforms while playback controls stay separate", () => {
    const { root, trigger, content, controls } = setup();
    trigger.dataset.previewKind = "video";
    trigger.dataset.previewSrc = "clip.webm";
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(content.children[0]?.tagName).toBe("VIDEO");
    const video = content.children[0]!;
    video.metadata();
    expect(video.controls).toBe(false);
    expect(content.children[0]?.playsInline).toBe(true);
    expect(Number.parseFloat(video.style.width)).toBeCloseTo(1000);
    expect(controls.get("[data-media-viewer-player]")?.hidden).toBe(false);
    expect(controls.get("[data-media-viewer-zoom-in]")?.hidden).toBe(false);
    controls.get("[data-media-viewer-zoom-in]")?.dispatch("click");
    controls.get("[data-media-viewer-rotate-right]")?.dispatch("click");
    controls.get("[data-media-viewer-flip-x]")?.dispatch("click");
    expect(video.style.transform).toContain("rotate(90deg) scale(1.5) scaleX(-1)");
    expect(controls.get("[data-media-viewer-player]")?.style.transform).toBe("");
    controls.get("[data-media-viewer-reset]")?.dispatch("click");
    expect(video.style.transform).toContain("rotate(0deg) scale(1)");
    content.dispatch("wheel", { deltaY: -1, clientX: 500, clientY: 400 });
    expect(video.style.transform).toContain("scale(1.5)");
    content.clientWidth = 320;
    content.clientHeight = 640;
    viewport.dispatch("resize");
    expect(video.style.width).toBe("320px");
    expect(video.style.height).toBe("180px");
  });

  it("switches grouped media and updates the count", () => {
    const { root, trigger, content, controls } = setup();
    const second = new TestTrigger(new TestMedia("IMG"));
    second.dataset.previewSrc = "second.jpg";
    const group = new TestGroup([trigger, second]);
    trigger.group = second.group = group;
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(controls.get("[data-media-viewer-count]")?.textContent).toBe("1 / 2");
    controls.get("[data-media-viewer-next]")?.dispatch("click");
    expect(content.children[0]?.src).toBe("second.jpg");
    expect(controls.get("[data-media-viewer-count]")?.textContent).toBe("2 / 2");
  });

  it.each(["image", "video"])("allows pinch zoom from the initial scale and then dragging for %s", (kind) => {
    const { root, trigger, content } = setup();
    trigger.dataset.previewKind = kind;
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    content.dispatch("pointerdown", { pointerId: 1, pointerType: "touch", clientX: 400, clientY: 400 });
    content.dispatch("pointerdown", { pointerId: 2, pointerType: "touch", clientX: 600, clientY: 400 });
    content.dispatch("pointermove", { pointerId: 2, clientX: 700, clientY: 400 });
    expect(content.children[0]!.style.transform).toContain("scale(1.5)");
    content.dispatch("pointerup", { pointerId: 2 });
    content.dispatch("pointermove", { pointerId: 1, clientX: 450, clientY: 420 });
    expect(content.children[0]!.style.transform).toContain("translate3d(100px, 20px, 0)");
    content.dispatch("pointercancel", { pointerId: 1 });
    expect(content.captures.size).toBe(0);
    expect(content.dataset.dragging).toBeUndefined();
  });

  it("preserves video progress, sound and playback across mixed-media switching and closing", () => {
    const { root, dialog, content, controls } = setup();
    const source = new TestMedia("VIDEO");
    Object.assign(source, { readyState: 1, currentTime: 42, volume: 0.4, muted: true, paused: false, playbackRate: 1.5 });
    const trigger = new TestTrigger(source);
    trigger.dataset.previewKind = "video";
    trigger.dataset.previewSrc = "clip.webm";
    const second = new TestTrigger(new TestMedia("IMG"));
    const group = new TestGroup([trigger, second]);
    trigger.group = second.group = group;
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    const firstVideo = content.children[0]!;
    firstVideo.metadata();
    expect(source.paused).toBe(true);
    expect(firstVideo.currentTime).toBe(42);
    expect(firstVideo.volume).toBe(0.4);
    expect(firstVideo.muted).toBe(true);
    expect(firstVideo.playbackRate).toBe(1.5);
    expect(firstVideo.paused).toBe(false);
    firstVideo.currentTime = 65;
    firstVideo.volume = 0.7;
    firstVideo.muted = false;
    controls.get("[data-media-viewer-zoom-in]")?.dispatch("click");
    controls.get("[data-media-viewer-next]")?.dispatch("click");
    expect(firstVideo.paused).toBe(true);
    expect(source.currentTime).toBe(65);
    expect(content.children[0]!.style.transform).toContain("scale(1)");
    expect(controls.get("[data-media-viewer-player]")?.hidden).toBe(true);
    controls.get("[data-media-viewer-prev]")?.dispatch("click");
    content.children[0]!.metadata();
    expect(content.children[0]!.currentTime).toBe(65);
    expect(content.children[0]!.volume).toBe(0.7);
    dialog.close();
    expect(source.currentTime).toBe(65);
    expect(source.volume).toBe(0.7);
    expect(source.muted).toBe(false);
    expect(source.paused).toBe(false);
    expect(source.playCalls).toBe(1);
  });

  it("keeps originally paused video paused after returning to the page", () => {
    const { root, dialog, content, controls } = setup();
    const source = new TestMedia("VIDEO");
    const trigger = new TestTrigger(source);
    trigger.dataset.previewKind = "video";
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    content.children[0]!.metadata();
    controls.get("[data-media-viewer-play]")?.dispatch("click");
    content.children[0]!.currentTime = 18;
    dialog.close();
    expect(source.currentTime).toBe(18);
    expect(source.paused).toBe(true);
    expect(source.playCalls).toBe(0);
  });

  it("does not compensate for scrollbar width when the page has no scrollbar", () => {
    const { root, dialog, trigger } = setup();
    pageRoot.clientWidth = 1000;
    vi.stubGlobal("document", { documentElement: pageRoot, body: { scrollHeight: 700, offsetWidth: 1000 }, createElement: (tagName: string) => new TestMedia(tagName.toUpperCase()) });
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(pageRoot.classes.has("media-viewer-scroll-locked")).toBe(true);
    expect(pageRoot.classes.has("media-viewer-scroll-compensated")).toBe(false);
    expect(pageRoot.properties.size).toBe(0);
    dialog.close();
    expect(pageRoot.classes.size).toBe(0);
  });

  it("pauses and restores group videos even when preview opens on an image", () => {
    const { root, dialog, trigger } = setup();
    const source = new TestMedia("VIDEO");
    source.paused = false;
    const second = new TestTrigger(source);
    const group = new TestGroup([trigger, second]);
    trigger.group = second.group = group;
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(source.paused).toBe(true);
    dialog.close();
    expect(source.paused).toBe(false);
  });

  it("keeps seek, volume and playback controls separate from gallery navigation", () => {
    const { root, dialog, trigger, content, controls } = setup();
    trigger.dataset.previewKind = "video";
    const second = new TestTrigger(new TestMedia("IMG"));
    const group = new TestGroup([trigger, second]);
    trigger.group = second.group = group;
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    const video = content.children[0]!;
    video.metadata();
    const seek = controls.get("[data-media-viewer-seek]")!;
    seek.value = "55.5";
    seek.dispatch("input");
    expect(video.currentTime).toBe(55.5);
    expect(controls.get("[data-media-viewer-time]")?.textContent).toBe("0:55 / 2:00");
    dialog.dispatch("keydown", { target: seek, key: "ArrowRight" });
    expect(content.children[0]).toBe(video);
    controls.get("[data-media-viewer-mute]")?.dispatch("click");
    expect(video.muted).toBe(true);
    const volume = controls.get("[data-media-viewer-volume]")!;
    volume.value = "0.3";
    volume.dispatch("input");
    expect(video.volume).toBe(0.3);
    expect(video.muted).toBe(false);
    controls.get("[data-media-viewer-play]")?.dispatch("click");
    expect(video.paused).toBe(false);
    expect(controls.get("[data-media-viewer-play]")?.getAttribute("aria-label")).toBe("Pause");
    dialog.dispatch("keydown", { key: " " });
    expect(video.paused).toBe(true);
    dialog.dispatch("keydown", { key: "ArrowRight" });
    expect(content.children[0]!.tagName).toBe("IMG");
  });

  it("shows loading and a retry after image fallback fails, ignoring stale load events", () => {
    const { root, trigger, content, controls } = setup();
    trigger.dataset.previewFallback = "fallback.jpg";
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    const image = content.children[0]!;
    expect(controls.get("[data-media-viewer-status]")?.hidden).toBe(false);
    image.dispatch("error");
    expect(image.src).toBe("fallback.jpg");
    image.dispatch("error");
    expect(controls.get("[data-media-viewer-message]")?.textContent).toBe("Unable to load media");
    expect(controls.get("[data-media-viewer-retry]")?.hidden).toBe(false);
    controls.get("[data-media-viewer-retry]")?.dispatch("click");
    image.dispatch("load");
    expect(controls.get("[data-media-viewer-status]")?.hidden).toBe(false);
    content.children[0]!.dispatch("load");
    expect(controls.get("[data-media-viewer-status]")?.hidden).toBe(true);
  });

  it("provides the same loading and retry states for video", () => {
    const { root, trigger, content, controls } = setup();
    trigger.dataset.previewKind = "video";
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    const video = content.children[0]!;
    video.metadata();
    video.dispatch("loadeddata");
    expect(controls.get("[data-media-viewer-status]")?.hidden).toBe(true);
    video.dispatch("waiting");
    expect(controls.get("[data-media-viewer-message]")?.textContent).toBe("Loading media…");
    video.dispatch("error");
    expect(controls.get("[data-media-viewer-message]")?.textContent).toBe("Unable to load media");
    controls.get("[data-media-viewer-retry]")?.dispatch("click");
    expect(video.paused).toBe(true);
    expect(content.children[0]).not.toBe(video);
  });
});
