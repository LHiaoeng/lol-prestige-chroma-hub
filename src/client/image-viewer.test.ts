import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindMediaViewers } from "./image-viewer";

type Handler = (event: Record<string, unknown>) => void;

class TestElement {
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, Handler[]>();
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
    return null;
  }
  querySelector<T extends TestElement>(_selector?: string): T | null { return null; }
  querySelectorAll<T extends TestElement>(): T[] { return []; }
  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }
  setAttribute(name: string, value: string): void { this.attributes.set(name, value); }
  focus(): void {}
}

class TestMedia extends TestElement {
  constructor(readonly tagName: string) { super(); }
  src = "";
  currentSrc = "";
  alt = "";
  style = { transform: "" };
  controls = false;
  playsInline = false;
  preload = "";
  paused = true;
  removed = false;
  remove(): void { this.removed = true; }
  pause(): void {}
}

class TestGroup extends TestElement {
  constructor(readonly triggers: TestTrigger[]) { super(); }
  override querySelectorAll<T extends TestElement>(selector?: string): T[] {
    return selector === "[data-media-preview-trigger]" ? this.triggers as unknown as T[] : [];
  }
}

class TestTrigger extends TestElement {
  constructor(readonly original: TestMedia) { super(); Object.assign(this.dataset, { mediaPreviewTrigger: "", previewKind: "image", previewSrc: "first.jpg" }); }
  override querySelector<T extends TestElement>(_selector?: string): T { return this.original as unknown as T; }
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
    return (selector === "img, video" ? this.children[0] : null) as unknown as T | null;
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
  ]);
  const dialog = new TestDialog(controls);
  return { root: new TestRoot(dialog), dialog, trigger: new TestTrigger(new TestMedia("IMG")), content, controls };
}

beforeEach(() => {
  vi.stubGlobal("Element", TestElement);
  vi.stubGlobal("document", { createElement: (tagName: string) => new TestMedia(tagName.toUpperCase()) });
});
afterEach(() => vi.unstubAllGlobals());

describe("media viewer", () => {
  it("opens the full image, zooms, and closes", () => {
    const { root, dialog, trigger, content, controls } = setup();
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(dialog.opened).toBe(1);
    expect(content.children[0]?.src).toBe("first.jpg");
    controls.get("[data-media-viewer-zoom-in]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("scale(1.5)");
    controls.get("[data-media-viewer-rotate-left]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("rotate(270deg)");
    controls.get("[data-media-viewer-flip-y]")?.dispatch("click");
    expect(content.children[0]?.style.transform).toContain("scaleY(-1)");
    controls.get("[data-media-viewer-close]")?.dispatch("click");
    expect(dialog.closed).toBe(1);
    expect(content.children).toHaveLength(0);
  });

  it("opens video with playback controls and hides image transforms", () => {
    const { root, trigger, content, controls } = setup();
    trigger.dataset.previewKind = "video";
    trigger.dataset.previewSrc = "clip.webm";
    bindMediaViewers(root as unknown as ParentNode);
    root.dispatch("click", { target: trigger });
    expect(content.children[0]?.tagName).toBe("VIDEO");
    expect(content.children[0]?.controls).toBe(true);
    expect(content.children[0]?.playsInline).toBe(true);
    expect(controls.get("[data-media-viewer-zoom-in]")?.hidden).toBe(true);
    expect(controls.get("[data-media-viewer-rotate-right]")?.hidden).toBe(true);
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
});
