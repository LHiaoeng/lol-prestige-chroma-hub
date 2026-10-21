import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createDomRuntimeView as createRuntimeDomView,
  shouldHandleRuntimeNavigation,
  type RuntimeHistory,
} from "./runtime-reference";
import {
  appendPbeChromaCard,
  appendPbeSkinCard,
  createRuntimePbeRenderer,
} from "./runtime-reference-pbe-renderer";
import type { RuntimeSkinReferenceItem } from "../domain/skin-reference-projection";

function dataProperty(attribute: string): string {
  return attribute
    .slice(5)
    .replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

class TestElement {
  readonly attributes = new Map<string, string>();
  readonly children: TestElement[] = [];
  readonly listeners = new Map<string, (() => void)[]>();
  readonly dataset: Record<string, string> = {};
  parentElement: TestElement | null = null;
  className = "";
  private ownTextContent = "";
  get textContent(): string {
    return this.ownTextContent + this.children.map((child) => child.textContent).join("");
  }
  set textContent(value: string) {
    this.ownTextContent = value;
    this.replaceChildren();
  }
  value = "";
  type = "";
  checked = false;
  hidden = false;
  id = "";
  href = "";
  src = "";
  alt = "";
  loading = "";
  width = 0;
  height = 0;
  disabled = false;
  style = { setProperty(): void {} };

  constructor(readonly tagName: string) {}

  get ownerDocument(): TestDocument {
    return document as unknown as TestDocument;
  }
  getBoundingClientRect(): { top: number; bottom: number } {
    return { top: 0, bottom: this.height };
  }
  get nextSibling(): TestElement | null {
    if (!this.parentElement) return null;
    const siblings = this.parentElement.children;
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }

  readonly classList = {
    add: (name: string): void => {
      const classes = this.className.split(" ").filter(Boolean);
      if (!classes.includes(name)) this.setAttribute("class", [...classes, name].join(" "));
    },
    remove: (name: string): void => {
      this.setAttribute(
        "class",
        this.className.split(" ").filter((c) => c && c !== name).join(" "),
      );
    },
    toggle: (name: string, force?: boolean): boolean => {
      const has = this.className.split(" ").includes(name);
      const next = force === undefined ? !has : force;
      this.classList[next ? "add" : "remove"](name);
      return next;
    },
  };

  closest(selector: string): TestElement | null {
    let node: TestElement | null = this;
    while (node) {
      if (node.matches(selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  click(): void {
    if (this.tagName === "input" && this.type === "radio") {
      this.checked = true;
      this.listeners.get("change")?.forEach((listener) => listener());
    }
    const event = { type: "click", target: this };
    let node: TestElement | null = this;
    while (node) {
      (node.listeners.get("click") ?? []).forEach((listener) =>
        (listener as (e: typeof event) => void)(event),
      );
      node = node.parentElement;
    }
  }

  contains(target: TestElement): boolean {
    return this === target || this.children.some((child) => child.contains(target));
  }

  dispatchEvent(event: Event): boolean {
    (this.listeners.get(event.type) ?? []).forEach((listener) =>
      (listener as (event: Event) => void)(event),
    );
    return true;
  }


  addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  append(...children: TestElement[]): void {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  prepend(...children: TestElement[]): void {
    children.forEach((child) => { child.parentElement = this; });
    this.children.unshift(...children);
  }

  before(...siblings: TestElement[]): void {
    if (!this.parentElement) return;
    const index = this.parentElement.children.indexOf(this);
    siblings.forEach((sibling) => { sibling.parentElement = this.parentElement; });
    this.parentElement.children.splice(index, 0, ...siblings);
  }

  appendChild(child: TestElement): TestElement {
    this.append(child);
    return child;
  }

  insertBefore(child: TestElement, reference: TestElement | null): TestElement {
    if (!reference) return this.appendChild(child);
    const index = this.children.indexOf(reference);
    child.parentElement = this;
    this.children.splice(index, 0, child);
    return child;
  }

  replaceChildren(...children: TestElement[]): void {
    this.children.forEach((child) => {
      child.parentElement = null;
    });
    this.children.length = 0;
    this.append(...children);
  }

  remove(): void {
    if (!this.parentElement) return;
    const index = this.parentElement.children.indexOf(this);
    if (index >= 0) this.parentElement.children.splice(index, 1);
    this.parentElement = null;
  }

  replaceWith(replacement: TestElement): void {
    if (!this.parentElement) return;
    const siblings = this.parentElement.children;
    const index = siblings.indexOf(this);
    replacement.parentElement = this.parentElement;
    siblings[index] = replacement;
    this.parentElement = null;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === "class") this.className = value;
    if (name === "id") this.id = value;
    if (name.startsWith("data-")) this.dataset[dataProperty(name)] = value;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
    if (name.startsWith("data-")) delete this.dataset[dataProperty(name)];
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  hasAttribute(name: string): boolean {
    return name.startsWith("data-")
      ? dataProperty(name) in this.dataset
      : this.attributes.has(name);
  }

  matches(selector: string): boolean {
    if (selector.includes(","))
      return selector.split(",").some((part) => this.matches(part.trim()));
    const data = selector.match(/^\[data-([a-z0-9-]+)\]$/);
    if (data) return dataProperty(`data-${data[1]}`) in this.dataset;
    const metaData = selector.match(/^meta\[data-([a-z0-9-]+)\]$/);
    if (metaData)
      return (
        this.tagName === "meta" &&
        dataProperty(`data-${metaData[1]}`) in this.dataset
      );
    const inputValue = selector.match(/^input\[value="([^"]+)"\]$/);
    if (inputValue) return this.tagName === "input" && this.value === inputValue[1];
    return selector.startsWith(".")
      ? selector.slice(1).split(".").every((name) => this.className.split(" ").includes(name))
      : this.tagName === selector;
  }

  querySelectorAll<T = TestElement>(selector: string): T[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child as unknown as T] : []),
      ...child.querySelectorAll<T>(selector),
    ]);
  }

  querySelector<T = TestElement>(selector: string): T | null {
    return this.querySelectorAll<T>(selector)[0] ?? null;
  }
}

class TestDocument {
  readonly head = new TestElement("head");
  readonly listeners = new Map<string, ((event: Record<string, unknown>) => void)[]>();
  defaultView: { location: { href: string; search: string } } | null = null;

  addEventListener(type: string, listener: (event: Record<string, unknown>) => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  dispatch(type: string, event: Record<string, unknown> = {}): Record<string, unknown> {
    const dispatched = { type, target: null, preventDefault: vi.fn(), ...event };
    this.listeners.get(type)?.forEach((listener) => listener(dispatched));
    return dispatched;
  }

  querySelector<T = TestElement>(selector: string): T | null {
    return this.head.querySelector<T>(selector);
  }

  querySelectorAll<T = TestElement>(selector: string): T[] {
    return this.head.querySelectorAll<T>(selector);
  }

  createElement(tagName: string): TestElement {
    return new TestElement(tagName);
  }

  createElementNS(_namespace: string, tagName: string): TestElement {
    return this.createElement(tagName);
  }

  createTextNode(text: string): TestElement {
    const node = new TestElement("text");
    node.textContent = text;
    return node;
  }
}

function history(initial = "https://chromaart.lol/champions/"): RuntimeHistory {
  return {
    url: new URL(initial),
    push() {},
    replace() {},
    onPopState() {
      return () => {};
    },
  };
}

type DomRenderTestView = Omit<ReturnType<typeof createRuntimeDomView>, "loading"> & {
  loading: (preserve: boolean, context: any) => void;
} &
  Record<string, (...args: any[]) => any>;

function createDomRuntimeView(
  options: Parameters<typeof createRuntimeDomView>[0],
): DomRenderTestView {
  return createRuntimeDomView(options) as DomRenderTestView;
}

afterEach(() => vi.unstubAllGlobals());

describe("runtime DOM boundaries", () => {
  it("shows only the PBE summary after a successful comparison", async () => {
    vi.stubGlobal("document", new TestDocument());
    const content = new TestElement("div");
    const summarySlot = new TestElement("div");
    const status = new TestElement("p");
    createRuntimePbeRenderer({
      content: content as unknown as HTMLElement,
      summary: summarySlot as unknown as HTMLElement,
      status: status as unknown as HTMLElement,
      locale: "zh_cn",
      getController: () => ({ navigate: vi.fn() }),
    }).render({
      signal: new AbortController().signal,
      modules: [{ kind: "champions", load: async () => ({ kind: "champions", items: [] }) }],
    });
    await Promise.resolve();
    expect(summarySlot.textContent).toContain("新增实体总数: 0");
    expect(status.textContent).toBe("");
    expect(content.querySelector("dl")).toBeNull();
  });

  it("keeps PBE section icons after a category finishes loading", async () => {
    vi.stubGlobal("document", new TestDocument());
    const content = new TestElement("div");
    const summarySlot = new TestElement("div");
    const status = new TestElement("p");
    createRuntimePbeRenderer({
      content: content as unknown as HTMLElement,
      summary: summarySlot as unknown as HTMLElement,
      status: status as unknown as HTMLElement,
      locale: "default",
      getController: () => ({ navigate: vi.fn() }),
    }).render({
      signal: new AbortController().signal,
      modules: [
        { kind: "champions", load: async () => ({ kind: "champions", items: [] }) },
        { kind: "skins", load: async () => { throw new Error("unavailable"); } },
      ],
    });

    await Promise.resolve();
    const summary = summarySlot.querySelector(".runtime-pbe-summary");
    expect(content.querySelector(".runtime-pbe-summary")).toBeNull();
    expect(summary?.getAttribute("aria-label")).toBe("PBE additions summary");
    expect(summary?.querySelectorAll("a").map((link) => link.href)).toEqual([
      "#runtime-pbe-skins", "#runtime-pbe-champions",
    ]);
    expect(content.querySelectorAll(".runtime-pbe-section").map((section) => section.id)).toEqual([
      "runtime-pbe-skins", "runtime-pbe-champions",
    ]);
    expect(summary?.textContent).toContain("Champions: 0");
    expect(summary?.textContent).toContain("Skins: failed");
    const heading = content.querySelectorAll(".runtime-pbe-section")
      .find((section) => section.id === "runtime-pbe-champions")
      ?.querySelector(".runtime-section-heading");
    expect(heading?.textContent).toBe("New champions (0)");
    expect(heading?.children[0]?.getAttribute("aria-hidden")).toBe("true");
  });

  it("collapses PBE sections after one row and keeps the toggle state in sync", async () => {
    vi.stubGlobal("document", new TestDocument());
    vi.stubGlobal("window", { location: { origin: "https://chromaart.lol" } });
    const content = new TestElement("div");
    const summary = new TestElement("div");
    const status = new TestElement("p");
    createRuntimePbeRenderer({
      content: content as unknown as HTMLElement,
      summary: summary as unknown as HTMLElement,
      status: status as unknown as HTMLElement,
      locale: "zh_cn",
      getController: () => ({ navigate: vi.fn() }),
    }).render({
      signal: new AbortController().signal,
      modules: [{
        kind: "skinlines",
        load: async () => ({
          kind: "skinlines",
          items: Array.from({ length: 10 }, (_, id) => ({
            kind: "skinline" as const,
            id,
            name: `Skinline ${id}`,
            universeIds: [],
          })),
        }),
      }],
    });
    const grid = content.querySelector(".runtime-pbe-grid")!;
    Object.defineProperty(grid, "scrollHeight", { value: 500 });
    await Promise.resolve();

    const toggle = content.querySelector(".runtime-pbe-expand");
    expect(toggle?.getAttribute("aria-expanded")).toBe("false");
    expect(grid.dataset.expanded).toBe("false");
    toggle?.click();
    expect(toggle?.getAttribute("aria-expanded")).toBe("true");
    expect(grid.dataset.expanded).toBe("true");
  });

  it("measures the full second PBE row for the collapsed preview", async () => {
    vi.stubGlobal("document", new TestDocument());
    let resize: (() => void) | undefined;
    class TestResizeObserver {
      constructor(callback: () => void) { resize = callback; }
      observe(): void {}
    }
    vi.stubGlobal("ResizeObserver", TestResizeObserver);
    vi.stubGlobal("window", {
      location: { origin: "https://chromaart.lol" },
      ResizeObserver: TestResizeObserver,
    });
    const content = new TestElement("div");
    createRuntimePbeRenderer({
      content: content as unknown as HTMLElement,
      summary: new TestElement("div") as unknown as HTMLElement,
      status: new TestElement("p") as unknown as HTMLElement,
      locale: "zh_cn",
      getController: () => ({ navigate: vi.fn() }),
    }).render({
      signal: new AbortController().signal,
      modules: [{
        kind: "skinlines",
        load: async () => ({
          kind: "skinlines",
          items: Array.from({ length: 12 }, (_, id) => ({
            kind: "skinline" as const,
            id,
            name: `Skinline ${id}`,
            universeIds: [],
          })),
        }),
      }],
    });
    const grid = content.querySelector(".runtime-pbe-grid")!;
    const styles = new Map<string, string>();
    Object.defineProperty(grid, "style", {
      value: { setProperty: (name: string, value: string) => styles.set(name, value) },
    });
    Object.defineProperty(grid, "scrollHeight", { value: 1200 });
    Object.defineProperty(grid, "getBoundingClientRect", {
      value: () => ({ top: 100 }),
    });
    await Promise.resolve();
    grid.querySelectorAll(".runtime-pbe-card").forEach((card, index) => {
      const top = index < 6 ? 100 : 340;
      const height = index < 6 ? 120 : 160;
      Object.defineProperty(card, "getBoundingClientRect", {
        value: () => ({ top, bottom: top + height }),
      });
    });
    resize?.();

    expect(styles.get("--pbe-two-row-height")).toBe("400px");
  });

  it("shows populated sections first and keeps skins beside chromas", async () => {
    vi.stubGlobal("document", new TestDocument());
    vi.stubGlobal("window", { location: { origin: "https://chromaart.lol" } });
    const content = new TestElement("div");
    const summary = new TestElement("div");
    const status = new TestElement("p");
    createRuntimePbeRenderer({
      content: content as unknown as HTMLElement,
      summary: summary as unknown as HTMLElement,
      status: status as unknown as HTMLElement,
      locale: "zh_cn",
      getController: () => ({ navigate: vi.fn() }),
    }).render({
      signal: new AbortController().signal,
      modules: [
        { kind: "chromas", load: async () => ({ kind: "chromas", items: [] }) },
        { kind: "champions", load: async () => ({ kind: "champions", items: [] }) },
        { kind: "skins", load: async () => ({ kind: "skins", items: [] }) },
        {
          kind: "skinlines",
          load: async () => ({
            kind: "skinlines",
            items: [{ kind: "skinline", id: 1, name: "New skinline", universeIds: [] }],
          }),
        },
      ],
    });
    await Promise.resolve();

    expect(content.querySelectorAll(".runtime-pbe-section").map((section) => section.id)).toEqual([
      "runtime-pbe-skinlines", "runtime-pbe-champions", "runtime-pbe-skins", "runtime-pbe-chromas",
    ]);
  });

  it("omits parent labels on new PBE skins and chromas, linking chromas to the skin chroma section", () => {
    vi.stubGlobal("document", new TestDocument());
    vi.stubGlobal("window", { location: { origin: "https://chromaart.lol" } });
    const parent = new TestElement("div");
    const skin: RuntimeSkinReferenceItem = {
      kind: "skin",
      id: 1,
      championId: 2,
      skinId: 1,
      target: { championId: 2, skinId: 1 },
      stableKey: "skin:1",
      name: "New skin",
      championName: "Champion",
      isBase: false,
      skinlineIds: [],
      universeIds: [],
      media: {},
      historicalArt: [],
      chromas: [],
    };
    appendPbeSkinCard(parent as unknown as HTMLElement, skin, "zh_cn", { navigate: vi.fn() });
    appendPbeChromaCard(parent as unknown as HTMLElement, {
      kind: "chroma",
      id: 3,
      name: "New chroma",
      skinId: 1,
      championId: 2,
      skinName: "Parent skin",
    }, "zh_cn", { navigate: vi.fn() });

    expect(parent.querySelector(".runtime-skin-reference-card")).not.toBeNull();
    expect(parent.querySelector(".runtime-skin-reference-link")).not.toBeNull();
    expect(parent.querySelector(".runtime-skin-reference-champion")).toBeNull();
    expect(parent.querySelector(".runtime-pbe-card-owner")).toBeNull();
    expect(parent.querySelector(".runtime-chroma-owner")).toBeNull();
    const chromaHref = parent.querySelectorAll("a").map((link) => link.href)
      .find((href) => href.includes("#runtime-skin-chromas"));
    expect(chromaHref).toContain("/skins/detail/?");
    expect(chromaHref).toContain("id=1");
    expect(chromaHref).toContain("champion=2");
    expect(chromaHref).toContain("channel=pbe");
  });

  it("keeps the loaded detail visible while confirming a channel switch", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const skinCount = new TestElement("span");
    skinCount.dataset.runtimeEntitySkinCount = "";
    skinCount.textContent = "12 skins";
    document.head.append(skinCount);
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    const detail = new TestElement("article");
    detail.textContent = "Loaded skin";
    content.append(detail);
    root.append(status, content);
    const originalQuery = root.querySelector.bind(root);
    vi.spyOn(root, "querySelector").mockImplementation((selector: string) =>
      selector === '[data-runtime-skeleton-template="detail"]'
        ? { content: { cloneNode: () => new TestElement("div") } } as never
        : originalQuery(selector),
    );
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: new TestElement("div") as unknown as HTMLElement,
      locale: "default",
      page: "skins",
      getController: () => ({ navigate: vi.fn() }),
      history: history("https://chromaart.lol/skins/detail/?id=103001&champion=103"),
    });
    view.loading(true, { target: { mode: "detail", kind: "skin" }, channel: "latest" });
    expect(content.children).toEqual([detail]);
    expect(skinCount.textContent).toBe("12 skins");
    expect(status.getAttribute("aria-live")).toBe("polite");
  });

  it.each([
    ["default", "This champion is unavailable", "/champions/?channel=latest&fallback=champion"],
    ["zh_cn", "目标通道没有该英雄", "/zh-cn/champions/?channel=latest&fallback=champion"],
  ] as const)("shows a persistent accessible fallback notice in %s", (locale, message, path) => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", { location: { origin: "https://chromaart.lol", pathname: path.split("?")[0] } });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: new TestElement("div") as unknown as HTMLElement,
      locale,
      page: "champions",
      getController: () => ({ navigate: vi.fn() }),
      history: history(`https://chromaart.lol${path}`),
    });
    view.render({
      context: {
        channel: "latest", target: { mode: "list", page: "champions", channel: "latest" },
        url: new URL(`https://chromaart.lol${path}`), signal: new AbortController().signal,
        isCurrent: () => true,
      },
      core: { status: "ready", value: { mode: "list", items: [] } },
      slots: {},
    });
    const notice = root.querySelector("[data-runtime-fallback-notice]");
    expect(notice?.textContent).toContain(message);
    expect(notice?.getAttribute("role")).toBe("status");
  });

  it("binds source controls outside the content root and uses player-facing channel labels", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const channelLabel = new TestElement("span");
    channelLabel.dataset.runtimeChannelLabel = "";
    const channelIcon = new TestElement("svg");
    channelIcon.className = "domain-icon domain-icon--reference";
    channelIcon.setAttribute("data-domain-icon-name", "reference");
    channelIcon.setAttribute("data-domain-icon-tooltip-locale", "zh_cn");
    const channelTrigger = new TestElement("span");
    channelTrigger.append(channelIcon);
    const pbe = new TestElement("button");
    pbe.dataset.runtimeChannel = "pbe";
    const latest = new TestElement("button");
    latest.dataset.runtimeChannel = "latest";
    source.append(channelLabel, channelTrigger, pbe, latest);

    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "zh_cn",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });
    view.loading(false, "latest");
    expect(channelTrigger.querySelector(".ant-tooltip-trigger")?.querySelector(".ant-tooltip")?.textContent)
      .toBe("资料版本：正式服");
    view.renderList([], { mode: "list", page: "champions", channel: "latest" });

    expect(channelLabel.textContent).toBe("正式服");
    expect(pbe.textContent).toBe("PBE");
    expect(latest.textContent).toBe("正式服");
    expect(pbe.getAttribute("aria-pressed")).toBe("false");
    expect(latest.getAttribute("aria-pressed")).toBe("true");
    expect(source.querySelector("[data-runtime-source-link]")).toBeNull();
    expect(root.querySelector("[data-runtime-source]")).toBeNull();
  });

  it("keeps the valid channel visible when an entity link is invalid", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const channelLabel = new TestElement("span");
    channelLabel.dataset.runtimeChannelLabel = "";
    const pbe = new TestElement("button");
    pbe.dataset.runtimeChannel = "pbe";
    const latest = new TestElement("button");
    latest.dataset.runtimeChannel = "latest";
    source.append(channelLabel, pbe, latest);

    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "universes",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(
        "https://chromaart.lol/universes/detail/?id=0&channel=latest",
      ),
    });

    view.invalid("This link is invalid.", "latest");

    expect(channelLabel.textContent).toBe("Live");
    expect(pbe.getAttribute("aria-pressed")).toBe("false");
    expect(latest.getAttribute("aria-pressed")).toBe("true");
  });

  it("uses the reference role filter and compact champion cards", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: { origin: "https://chromaart.lol", pathname: "/champions/" },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");

    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });
    view.renderList(
      [
        {
          kind: "champion",
          id: 103,
          name: "Ahri",
          roles: ["mage", "assassin"],
          portraitUrl: "https://example.test/ahri.png",
        },
        {
          kind: "champion",
          id: 1,
          name: "Annie",
          roles: ["mage"],
          portraitUrl: "https://example.test/annie.png",
        },
        {
          kind: "champion",
          id: 201,
          name: "Braum",
          roles: ["support", "tank"],
          portraitUrl: "https://example.test/braum.png",
        },
      ],
      { mode: "list", page: "champions", channel: "pbe" },
    );

    const role = content.querySelector("select");
    expect(
      role?.querySelectorAll("option").map((option) => option.textContent),
    ).toEqual([
      "All",
      "Assassin",
      "Fighter",
      "Mage",
      "Marksman",
      "Support",
      "Tank",
    ]);
    expect(content.querySelector("input")).not.toBeNull();
    expect(content.querySelectorAll("select")).toHaveLength(2);
    expect(content.querySelector(".runtime-pagination")).toBeNull();
    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(3);
    expect(content.querySelector(".runtime-champion-link")?.href).toBe(
      "/champions/detail/?id=103",
    );
    expect(
      content
        .querySelectorAll(".runtime-champion-card")[0]
        ?.querySelector(".runtime-champion-roles")?.textContent,
    ).toBe("Mage, Assassin");

    role!.value = "mage";
    role!.listeners.get("change")?.[0]?.();

    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(2);
    expect(content.querySelector(".runtime-champion-link")?.children).toHaveLength(
      2,
    );
  });

  it("searches and sorts the champion list", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: { origin: "https://chromaart.lol", pathname: "/champions/" },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });

    view.renderList(
      Array.from({ length: 25 }, (_, index) => ({
        kind: "champion" as const,
        id: index + 1,
        name: `Champion ${String(25 - index).padStart(2, "0")}`,
        roles: [],
        portraitUrl: `https://example.test/${index + 1}.png`,
      })),
      { mode: "list", page: "champions", channel: "pbe" },
    );

    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(25);

    const search = content.querySelector("input")!;
    search.value = "Champion 25";
    search.listeners.get("input")?.[0]?.();

    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(1);
    expect(content.querySelector(".runtime-champion-link")?.href).toBe(
      "/champions/detail/?id=1",
    );
  });

  it("localizes role labels and preserves locale and latest in champion links", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: { origin: "https://chromaart.lol", pathname: "/zh-cn/champions/" },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "zh_cn",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });

    view.renderList(
      [
        {
          kind: "champion",
          id: 103,
          name: "阿狸",
          roles: ["mage", "assassin"],
          portraitUrl: "https://example.test/ahri.png",
        },
      ],
      { mode: "list", page: "champions", channel: "latest" },
    );

    expect(
      content
        .querySelectorAll("select")[0]
        ?.querySelectorAll("option")
        .map((option) => option.textContent),
    ).toEqual(["全部", "刺客", "战士", "法师", "射手", "辅助", "坦克"]);
    expect(content.querySelector(".runtime-champion-link")?.href).toBe(
      "/zh-cn/champions/detail/?id=103&channel=latest",
    );
  });

  it("links skinline list cards to independent detail paths", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: {
        origin: "https://chromaart.lol",
        pathname: "/skinlines/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "skinlines",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history("https://chromaart.lol/skinlines/?channel=pbe"),
    });

    view.renderList(
      [
        {
          kind: "skinline",
          id: 7,
          name: "Star Guardian",
          universeIds: [200],
        },
      ],
      { mode: "list", page: "skinlines", channel: "latest" },
    );

    expect(content.querySelector("a")?.href).toBe(
      "/skinlines/detail/?id=7&channel=latest",
    );
    expect(content.querySelector("img")).toBeNull();

    const navigation = history("https://chromaart.lol/skinlines/?channel=pbe");
    navigation.push(new URL("https://chromaart.lol/skinlines/?channel=pbe"));
    view.renderList(
      [
        {
          kind: "skinline",
          id: 7,
          name: "Star Guardian",
          universeIds: [200],
        },
      ],
      { mode: "list", page: "skinlines", channel: "pbe" },
    );
    expect(content.querySelector("a")?.href).toBe(
      "/skinlines/detail/?id=7&channel=pbe",
    );
  });

  it("renders universe list cards with skinline names resolved by ID", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: {
        origin: "https://chromaart.lol",
        pathname: "/universes/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "universes",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history("https://chromaart.lol/universes/"),
    });

    view.renderList(
      [{ kind: "universe", id: 200, name: "Star Guardian", skinlineIds: [7] }],
      { mode: "list", page: "universes", channel: "pbe" },
    );
    view.renderListRelations!(
      [{ kind: "skinline", id: 7, name: "Star Guardian", universeIds: [200] }],
      { mode: "list", page: "universes", channel: "pbe" },
    );

    expect(content.querySelector(".ant-tree-child-tree")?.querySelector("a")?.textContent).toBe("Star Guardian");
    expect(content.querySelector(".runtime-universe-title")?.href).toBe("/universes/detail/?id=200");
  });

  it.each([
    ["zh_cn", "https://voice.buguoguo.cn/#/voice/103", "https://101.qq.com/#/hero-detail?heroId=103"],
    ["default", undefined, undefined],
  ] as const)("shows Chinese champion actions only in %s", (locale, voiceUrl, battleDataUrl) => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", { addEventListener: vi.fn(), location: { origin: "https://chromaart.lol", pathname: "/champions/detail/" } });
    const summary = new TestElement("div");
    summary.dataset.runtimeEntityActionsSummary = "";
    const menu = new TestElement("ul");
    menu.className = "ant-dropdown-menu";
    summary.append(menu);
    document.head.append(summary);
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: new TestElement("div") as unknown as HTMLElement,
      locale,
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });

    view.renderDetail(
      { kind: "champion", id: 103, name: "Ahri", skins: [] },
      { mode: "detail", page: "champions", kind: "champion", id: 103, channel: "latest" },
    );

    const voice = [...menu.querySelectorAll("a")].find((link) => link.textContent === "布锅锅语音站");
    expect(voice?.href).toBe(voiceUrl);
    const battleData = [...menu.querySelectorAll("a")].find((link) => link.textContent === "对战数据");
    expect(battleData?.href).toBe(battleDataUrl);
    expect(summary.hidden).toBe(false);
  });

  it("renders deduplicated square-thumbnail skin cards, sorting, and rarity", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      location: {
        origin: "https://chromaart.lol",
        pathname: "/champions/detail/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const skinCount = new TestElement("span");
    skinCount.dataset.runtimeEntitySkinCount = "";
    const skinStat = new TestElement("span");
    skinStat.className = "runtime-universe-stat";
    const skinIcon = new TestElement("svg");
    skinIcon.className = "domain-icon domain-icon--skins";
    skinIcon.setAttribute("data-domain-icon-name", "skins");
    skinIcon.setAttribute("data-domain-icon-tooltip-locale", "default");
    skinStat.append(skinIcon);
    skinStat.append(skinCount);
    document.head.append(skinStat);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });

    view.renderDetail(
      {
        kind: "champion",
        id: 103,
        name: "Ahri",
        skins: [
          {
            id: 103000,
            name: "Ahri",
            isBase: true,
            skinlineIds: [],
            media: {
              focusedSplashUrl: "https://example.test/ahri-base.jpg",
              tileUrl: "https://example.test/ahri-base-tile.jpg",
            },
            stages: [],
          },
          {
            id: 103001,
            name: "Dynasty Ahri",
            isBase: false,
            skinlineIds: [],
            rarity: { label: "Legendary", key: "kLegendary" },
            media: { tileUrl: "https://example.test/dynasty-tile.jpg" },
            stages: [
              {
                id: 103002,
                name: "Dynasty Ahri · Stage 2",
                stageIndex: 2,
                media: {
                  tileUrl: "https://example.test/dynasty-stage-tile.jpg",
                },
                chromas: [],
              },
            ],
          },
        ],
      },
      {
        mode: "detail",
        page: "champions",
        kind: "champion",
        id: 103,
        channel: "latest",
      },
    );

    expect(content.querySelector("h1")?.textContent).toBe("Ahri");
    expect(content.querySelector(".eyebrow")).toBeNull();
    expect(content.querySelector(".runtime-lede")).toBeNull();
    expect(content.querySelector(".runtime-champion-base")).toBeNull();
    expect(status.textContent).toBe("");
    expect(content.querySelectorAll(".runtime-skin-reference-card")).toHaveLength(3);
    expect(skinStat.querySelector(".ant-tooltip-trigger")?.querySelector(".ant-tooltip")?.textContent)
      .toBe("Skin: 2 skins");
    expect(
      [...content.querySelectorAll(".runtime-skin-reference-card")].map(
        (card) => card.querySelector("img")?.src,
      ),
    ).toEqual([
      "https://example.test/ahri-base-tile.jpg",
      "https://example.test/dynasty-tile.jpg",
      "https://example.test/dynasty-stage-tile.jpg",
    ]);
    const skinSort = content.querySelector("select");
    expect(skinSort?.value).toBe("release");
    if (!skinSort) throw new Error("Expected champion skin sort control");
    skinSort.value = "rarity";
    skinSort.listeners.get("change")?.forEach((listener) => listener());
    expect(
      [...content.querySelectorAll(".runtime-skin-reference-card")].map(
        (card) =>
          card
            .querySelector(".runtime-skin-reference-name")?.textContent,
      ),
    ).toEqual(["Dynasty Ahri", "Dynasty Ahri · Stage 2", "Ahri"]);
    skinSort.value = "release";
    skinSort.listeners.get("change")?.forEach((listener) => listener());
    expect(content.querySelectorAll(".runtime-skin-reference-card")[0]?.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103000&champion=103&channel=latest",
    );
    expect(content.querySelectorAll(".runtime-skin-reference-card")[1]?.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&channel=latest",
    );
    expect(content.querySelectorAll(".runtime-skin-reference-card")[2]?.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103002&champion=103&channel=latest",
    );
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("renders a skin detail with release-ordered skin navigation", async () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const championSlot = new TestElement("span");
    championSlot.dataset.runtimeSkinChampion = "";
    const championStat = new TestElement("span");
    championStat.className = "runtime-universe-stat";
    const championIcon = new TestElement("svg");
    championIcon.className = "domain-icon domain-icon--champions";
    championIcon.setAttribute("data-domain-icon-name", "champions");
    championIcon.setAttribute("data-domain-icon-tooltip-locale", "default");
    championStat.append(championIcon);
    championStat.append(championSlot);
    document.head.append(championStat);
    const navigationGroup = new TestElement("nav");
    navigationGroup.dataset.runtimeSkinNavigation = "";
    navigationGroup.hidden = true;
    const previousButton = new TestElement("button");
    previousButton.dataset.runtimeSkinNavigationPrevious = "";
    const previousName = new TestElement("span");
    previousName.dataset.runtimeSkinNavigationPreviousName = "";
    const nextName = new TestElement("span");
    nextName.dataset.runtimeSkinNavigationNextName = "";
    const nextButton = new TestElement("button");
    nextButton.dataset.runtimeSkinNavigationNext = "";
    navigationGroup.append(previousButton, previousName, nextName, nextButton);
    document.head.append(navigationGroup);
    vi.stubGlobal("window", {
      location: {
        origin: "https://chromaart.lol",
        pathname: "/skins/detail/",
      },
      scrollY: 720,
      scrollTo: vi.fn(),
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const navigate = vi.fn().mockResolvedValue(undefined);
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "skins",
      getController: () => ({ navigate }) as never,
      history: history(
        "https://chromaart.lol/skins/detail/?id=103001&champion=103&channel=latest",
      ),
    });

    view.renderDetail(
      {
        kind: "skin",
        id: 103001,
        championId: 103,
        championName: "Ahri",
        championTitle: "the Nine-Tailed Fox",
        championSkinReleaseOrder: [
          { id: 103000, name: "Classic Ahri" },
          { id: 103001, name: "Dynasty Ahri" },
          { id: 103002, name: "Dynasty Ahri · Stage 2" },
        ],
        name: "Dynasty Ahri",
        description: "A dynasty-inspired skin.",
        isBase: false,
        skinlineIds: [],
        media: {
          focusedSplashUrl: "https://example.test/dynasty.jpg",
        },
        stages: [
          {
            id: 103002,
            name: "Dynasty Ahri · Stage 2",
            stageIndex: 2,
            media: {},
            chromas: [],
          },
        ],
        chromas: [],
      },
      {
        mode: "detail",
        page: "skins",
        kind: "skin",
        id: 103001,
        championId: 103,
        channel: "latest",
      },
    );

    expect(content.querySelector("h1")?.textContent).toBe("Dynasty Ahri");
    expect(content.querySelector("img")?.src).toBe(
      "https://example.test/dynasty.jpg",
    );
    expect(championSlot.querySelector("a")?.href).toBe("/champions/detail/?id=103&channel=latest");
    expect(championSlot.querySelector("a")?.textContent).toBe("the Nine-Tailed Fox Ahri");
    expect(content.querySelector(".runtime-skin-stages")).toBeNull();
    expect(content.querySelector(".runtime-lede")?.querySelector(".ant-typography-paragraph-text")?.textContent).toBe(
      "A dynasty-inspired skin.",
    );
    expect(championStat.querySelector(".ant-tooltip-trigger")?.querySelector(".ant-tooltip")?.textContent)
      .toBe("Champion: the Nine-Tailed Fox Ahri");
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();

    const next = document.dispatch("keydown", { key: "ArrowRight" });
    expect((navigate.mock.calls[0]?.[0] as URL).searchParams.get("id")).toBe("103002");
    expect(next.preventDefault).toHaveBeenCalledOnce();
    const previous = document.dispatch("keydown", { key: "ArrowLeft" });
    expect((navigate.mock.calls[1]?.[0] as URL).searchParams.get("id")).toBe("103000");
    expect(previous.preventDefault).toHaveBeenCalledOnce();
    document.dispatch("keydown", { key: "ArrowRight", target: new TestElement("button") });
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigationGroup.hidden).toBe(false);
    expect(previousName.textContent).toBe("Classic Ahri");
    expect(nextName.textContent).toBe("Dynasty Ahri · Stage 2");
    nextButton.click();
    expect((navigate.mock.calls[2]?.[0] as URL).searchParams.get("id")).toBe("103002");
    previousButton.click();
    expect((navigate.mock.calls[3]?.[0] as URL).searchParams.get("id")).toBe("103000");
    await Promise.resolve();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 720);
  });

  it("renders skin media and historical artwork", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const championSlot = new TestElement("span");
    championSlot.dataset.runtimeSkinChampion = "";
    document.head.append(championSlot);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      location: {
        origin: "https://chromaart.lol",
        pathname: "/skins/detail/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "skins",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(
        "https://chromaart.lol/skins/detail/?id=103002&champion=103&channel=latest",
      ),
    });

    view.renderDetail(
      {
        kind: "skin",
        id: 103001,
        championId: 103,
        championName: "Ahri",
        stageId: 103002,
        name: "Dynasty Ahri · Ascended",
        description: "Inherited description.",
        rarity: { label: "Legendary", key: "kLegendary" },
        isBase: false,
        skinlineIds: [7],
        universeIds: [200],
        media: {
          focusedSplashUrl: "https://example.test/focused.jpg",
          unfocusedSplashUrl: "https://example.test/uncentered.jpg",
          tileUrl: "https://example.test/tile.jpg",
          loadScreenUrl: "https://example.test/load.jpg",
          animatedSplashUrl: "https://example.test/animated.webm",
          loadScreenBorders: [
            { layer: 0, priority: 0, contentId: "border-a", url: "https://example.test/border-base.png" },
            { layer: 0, priority: 1, contentId: "border-b", url: "https://example.test/border-top.png" },
            { layer: 1, priority: 0, contentId: "border-s", url: "https://example.test/border-signature.png" },
          ],
        },
        historicalArt: [
          {
            version: "14.1",
            media: { focusedSplashUrl: "https://example.test/history.jpg" },
          },
        ],
        stages: [
          {
            id: 103002,
            name: "Dynasty Ahri · Ascended",
            stageIndex: 2,
            media: { focusedSplashUrl: "https://example.test/stage.jpg" },
            chromas: [],
          },
        ],
        chromas: [],
      },
      {
        mode: "detail",
        page: "skins",
        kind: "skin",
        id: 103001,
        championId: 103,
        stageId: 103002,
        channel: "latest",
      },
    );

    const mediaSection = content.querySelector(".runtime-skin-media");
    expect(mediaSection?.querySelectorAll(".runtime-media-item")).toHaveLength(4);
    expect(mediaSection?.querySelectorAll("[data-media-preview-trigger]")).toHaveLength(5);
    expect(mediaSection?.querySelector(".runtime-loadscreen-frame")).not.toBeNull();
    expect(
      [...(mediaSection?.querySelectorAll(".runtime-media-item") ?? [])].some(
        (item) => item.querySelector(".runtime-media-preview-trigger")?.querySelector("img")?.src === "https://example.test/load.jpg",
      ),
    ).toBe(true);

    const borderSection = content.querySelector(".runtime-skin-borders");
    const borderLayers = borderSection?.querySelectorAll(".runtime-loadscreen-border");
    expect(borderSection?.querySelector(".runtime-loadscreen-art")?.src).toBe(
      "https://example.test/load.jpg",
    );
    expect(borderLayers?.map((image) => image.src)).toEqual([
      "https://example.test/border-top.png",
      "https://example.test/border-signature.png",
    ]);
    expect(
      borderLayers?.every((image) => image.getAttribute("aria-hidden") === "true"),
    ).toBe(true);
    const choices = borderSection?.querySelectorAll(".runtime-border-choice");
    expect(choices).toHaveLength(2);
    expect(borderSection?.querySelector("[data-download-kind]")).toBeNull();
    expect(borderSection?.querySelector(".runtime-border-composite-download")).toBeNull();
    const carouselControls = mediaSection?.querySelector(".runtime-media-carousel-controls");
    const carousel = mediaSection?.querySelector(".runtime-media-carousel");
    expect(
      carouselControls?.querySelector(".runtime-media-carousel-download")?.getAttribute("aria-label"),
    ).toBe("Download displayed media");
    expect(carouselControls?.querySelector(".runtime-media-carousel-download.ant-btn-icon-only")).not.toBeNull();
    expect(carouselControls?.querySelector(".runtime-media-carousel-download.ant-btn-sm")).toBeNull();
    expect(carouselControls?.querySelector(".ant-radio-group-middle")).not.toBeNull();
    const carouselOptions = carouselControls?.querySelectorAll<HTMLInputElement>(".ant-radio-button-input") ?? [];
    const carouselSlides = carousel?.querySelectorAll<HTMLElement>(".ant-carousel-slide") ?? [];
    expect(carouselOptions.map((option) => option.value)).toEqual([
      "artwork-video",
      "artwork-image",
      "other-media-0",
      "other-media-1",
      "borders",
    ]);
    expect(carouselOptions.map((option) => option.getAttribute("aria-controls"))).toEqual(
      carouselSlides.map((slide) => slide.id),
    );
    const lastViewedTrigger = [
      ...(carouselSlides[1]?.querySelectorAll<HTMLElement>("[data-media-preview-trigger]") ?? []),
    ].find((trigger) => trigger.dataset.previewKey === "unfocusedSplashUrl");
    carousel?.dispatchEvent(new CustomEvent("media-preview-close", { detail: lastViewedTrigger }));
    const syncedCarouselOptions = carouselControls?.querySelectorAll<HTMLInputElement>(".ant-radio-button-input") ?? [];
    expect(syncedCarouselOptions[0]?.checked).toBe(false);
    expect(syncedCarouselOptions[1]?.checked).toBe(true);
    expect(carouselControls?.querySelectorAll(".ant-radio-button-wrapper")[1]?.textContent)
      .toBe("Static artwork · Unfocused");
    expect(carouselSlides[1]?.querySelector(".runtime-media-preview-trigger")?.querySelector("img")?.src)
      .toBe("https://example.test/uncentered.jpg");
    expect(
      carouselControls?.querySelector(".runtime-media-carousel-divider")?.getAttribute("aria-orientation"),
    ).toBe("vertical");
    const borderFrame = borderSection?.querySelector<HTMLElement>(".runtime-loadscreen-frame");
    const borderMode = borderSection?.querySelector<HTMLInputElement>('input[value="border"]');
    expect(borderFrame?.dataset.borderMode).toBe("loadscreen");
    expect(
      borderSection?.querySelector<HTMLInputElement>('input[value="loadscreen"]')?.checked,
    ).toBe(true);
    expect(borderMode?.checked).toBe(false);
    borderMode?.click();
    expect(borderFrame?.dataset.borderMode).toBe("border");
    expect(borderFrame?.querySelector<HTMLImageElement>(".runtime-loadscreen-art")?.hidden).toBe(true);
    borderSection?.querySelector<HTMLInputElement>('input[value="loadscreen"]')?.click();
    expect(borderFrame?.dataset.borderMode).toBe("loadscreen");
    expect(choices?.[1]?.getAttribute("aria-pressed")).toBe("true");
    choices?.[0]?.click();
    expect(
      [...(borderLayers ?? [])].find((image) => image.dataset.layer === "0")?.src,
    ).toBe("https://example.test/border-base.png");
    expect(choices?.[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(choices?.[1]?.getAttribute("aria-pressed")).toBe("false");
    expect(mediaSection?.querySelector("video")?.src).toBe(
      "https://example.test/animated.webm",
    );
    expect(content.querySelector(".runtime-skin-history")?.querySelector("h3")?.textContent).toBe(
      "14.1",
    );
    expect(content.querySelector(".runtime-stage-media")).toBeNull();
    expect(document.head.querySelector("[data-runtime-skin-champion]")?.querySelector("a")?.href).toBe(
      "/champions/detail/?id=103&channel=latest",
    );

  });

  it("renders the skin self item, true chromas, colors, and locale-specific external actions", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const prestigeChromaLinks = new TestElement("div");
    prestigeChromaLinks.dataset.runtimePrestigeChromaLinks = JSON.stringify({
      "103051": {
        href: "/chromas/prestige-ruby/",
        imageUrl: "https://example.test/prestige-ruby-card.png",
        fallbackUrl: "https://example.test/prestige-ruby-card-fallback.png",
        previewUrl: "https://example.test/prestige-ruby.png",
        previewFallbackUrl: "https://example.test/prestige-ruby-fallback.png",
        colors: ["#DAA520"],
      },
    });
    document.head.append(prestigeChromaLinks);
    const summary = new TestElement("span");
    summary.dataset.runtimeSkinChromaSummary = "";
    const chromaLink = new TestElement("a");
    chromaLink.className = "runtime-entity-relation-link";
    chromaLink.href = "#runtime-skin-chromas";
    const summaryCount = new TestElement("span");
    summaryCount.dataset.runtimeSkinChromaCount = "";
    chromaLink.append(summaryCount);
    summary.append(chromaLink);
    document.head.append(summary);
    const actionsSummary = new TestElement("span");
    actionsSummary.dataset.runtimeSkinActionsSummary = "";
    const actionsMenu = new TestElement("ul");
    actionsMenu.className = "ant-dropdown-menu";
    actionsSummary.append(actionsMenu);
    document.head.append(actionsSummary);
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      location: {
        origin: "https://chromaart.lol",
        pathname: "/skins/detail/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "skins",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(
        "https://chromaart.lol/skins/detail/?id=103002&champion=103",
      ),
    });

    view.renderDetail(
      {
        kind: "skin",
        id: 103001,
        championId: 103,
        championAlias: "Ahri",
        stageId: 103002,
        chromaImageUrl: "https://example.test/base-chroma.png",
        name: "Dynasty Ahri · Ascended",
        isBase: false,
        skinlineIds: [],
        media: { tileUrl: "https://example.test/stage-tile.jpg" },
        stages: [
          {
            id: 103002,
            name: "Dynasty Ahri · Ascended",
            stageIndex: 2,
            media: { tileUrl: "https://example.test/stage-tile.jpg" },
            chromas: [],
          },
        ],
        chromas: [
          {
            id: 103051,
            name: "Dynasty Ahri · Ruby",
            imageUrl: "https://example.test/ruby.png",
            colors: ["#FF0000", "#00FF00"],
          },
          {
            id: 103052,
            name: "Dynasty Ahri · Pearl",
            imageUrl: "https://example.test/pearl.png",
            colors: [],
          },
        ],
      },
      {
        mode: "detail",
        page: "skins",
        kind: "skin",
        id: 103001,
        championId: 103,
        stageId: 103002,
        channel: "pbe",
      },
    );

    expect(content.querySelector(".runtime-chroma-count")?.textContent).toBe("(2)");
    expect(content.querySelector(".runtime-skin-stages")).toBeNull();
    expect(content.querySelector(".runtime-skin-chromas")?.id).toBe("runtime-skin-chromas");
    const chromaSection = content.querySelector<HTMLElement>(".runtime-skin-chromas");
    expect(chromaSection?.dataset.mediaPreviewGroup).toBe("");
    expect(chromaLink.href).toBe("#runtime-skin-chromas");
    expect(summaryCount.textContent).toBe("2 chromas");
    expect(content.querySelectorAll(".runtime-chroma-card")).toHaveLength(3);
    const chromaCards = content.querySelectorAll<HTMLElement>(".runtime-chroma-card");
    const prestigeCard = chromaCards[1];
    expect(chromaCards[0]?.querySelector(".runtime-chroma-info-button")).toBeNull();
    expect(prestigeCard?.querySelector(".runtime-chroma-info-button")?.getAttribute("aria-label")).toBe("Chroma Details");
    expect(prestigeCard?.querySelector(".runtime-chroma-info-button")?.getAttribute("aria-haspopup")).toBe("dialog");
    expect(prestigeCard?.querySelector(".runtime-chroma-image-toggle")?.className).toContain("ant-btn-sm ant-btn-icon-only");
    const prestigeTriggers = prestigeCard?.querySelectorAll<HTMLElement>("[data-media-preview-trigger]");
    expect(prestigeCard?.querySelector("img")?.src).toBe(
      "https://example.test/prestige-ruby-card.png",
    );
    expect(prestigeTriggers).toHaveLength(2);
    const visiblePrestigeTrigger = prestigeTriggers?.[0];
    const hiddenChromaTrigger = prestigeTriggers?.[1];
    expect(visiblePrestigeTrigger?.dataset.previewSrc).toBe(
      "https://example.test/prestige-ruby.png",
    );
    expect(visiblePrestigeTrigger?.dataset.previewVariant).toBe("prestige");
    expect(hiddenChromaTrigger?.hidden).toBe(true);
    expect(hiddenChromaTrigger?.dataset.previewSrc).toBe("https://example.test/ruby.png");
    expect(hiddenChromaTrigger?.dataset.previewVariant).toBe("chroma");
    chromaSection?.dispatchEvent(
      new CustomEvent("media-preview-close", { detail: hiddenChromaTrigger }),
    );
    expect(prestigeCard?.querySelector<HTMLButtonElement>(".runtime-chroma-image-toggle")?.dataset.showingOriginal).toBe(
      "true",
    );
    expect(prestigeCard?.querySelector("img")?.src).toBe("https://example.test/ruby.png");
    expect(visiblePrestigeTrigger?.dataset.previewVariant).toBe("chroma");
    expect(hiddenChromaTrigger?.dataset.previewVariant).toBe("prestige");
    chromaSection?.dispatchEvent(
      new CustomEvent("media-preview-close", { detail: hiddenChromaTrigger }),
    );
    expect(prestigeCard?.querySelector<HTMLButtonElement>(".runtime-chroma-image-toggle")?.dataset.showingOriginal).toBe(
      "false",
    );
    expect(prestigeCard?.querySelector("img")?.src).toBe(
      "https://example.test/prestige-ruby-card.png",
    );
    const base = content.querySelector(".runtime-chroma-base");
    expect(base?.querySelector<HTMLElement>("[data-media-preview-trigger]")?.dataset.previewVariant).toBe("chroma");
    expect(base?.querySelector(".runtime-chroma-name")?.textContent).toBe(
      "Dynasty Ahri · Ascended",
    );
    expect(base?.querySelector(".runtime-chroma-note")).toBeNull();
    expect(base?.querySelector(".color-circle")?.className).toContain("non-chroma");
    expect(base?.querySelector(".color-circle")?.className).toContain(
      "color-circle-empty",
    );
    expect(base?.querySelector(".color-circle")?.className).not.toContain(
      " empty",
    );
    expect(base?.querySelector(".color-wrap")?.getAttribute("aria-label")).toBe(
      "Not a chroma",
    );
    expect(base?.querySelector(".color-tooltip")).toBeNull();
    expect(content.querySelector(".runtime-chroma-media")?.querySelector("img")?.src).toBe(
      "https://example.test/base-chroma.png",
    );
    expect(content.querySelectorAll(".color-row")).toHaveLength(2);

    const externalLinks = document.head.querySelectorAll(".runtime-external-link");
    expect(externalLinks).toHaveLength(3);
    expect(actionsSummary.hidden).toBe(false);
    expect(externalLinks.map((link) => link.getAttribute("role"))).toEqual([
      "menuitem",
      "menuitem",
    ]);
    expect(externalLinks.map((link) => link.textContent)).toEqual([
      "Watch on SkinSpotlights",
      "View 3D model on KHADA",
      "Wiki",
    ]);
    expect(externalLinks.every((link) => link.querySelectorAll(".runtime-summary-action-icon").length === 2)).toBe(true);
    expect(externalLinks[0]?.getAttribute("target")).toBe("_blank");
    expect(externalLinks[0]?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(externalLinks[1]?.href).toBe("https://modelviewer.lol/model-viewer?id=103002&lang=en-US");
    expect(externalLinks[2]?.href).toBe("https://wiki.leagueoflegends.com/en-us/Ahri");
  });

  it("links skinline relations to independent universe detail paths", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const universeSummary = new TestElement("span");
    universeSummary.dataset.runtimeSkinlineUniverseSummary = "";
    const universeSlot = new TestElement("span");
    universeSlot.dataset.runtimeSkinlineUniverses = "";
    universeSummary.append(universeSlot);
    document.head.append(universeSummary);
    vi.stubGlobal("window", {
      location: {
        origin: "https://chromaart.lol",
        pathname: "/skinlines/detail/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "skinlines",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });

    view.renderDetail(
      {
        kind: "skinline",
        id: 7,
        name: "Star Guardian",
        universeIds: [200],
      },
      {
        mode: "detail",
        page: "skinlines",
        kind: "skinline",
        id: 7,
        channel: "latest",
      },
    );
    view.renderRelations!(
      [
        {
          kind: "universe",
          id: 200,
          name: "Star Guardian",
          skinlineIds: [7],
        },
      ],
      {
        mode: "detail",
        page: "skinlines",
        kind: "skinline",
        id: 7,
        channel: "latest",
      },
    );
    view.renderSkinlineSkins!(
      [
        {
          kind: "stage",
          id: 103002,
          skinId: 103001,
          championId: 103,
          stageId: 103002,
          target: { championId: 103, skinId: 103001, stageId: 103002 },
          stableKey: "103:103001:stage:103002",
          name: "Dynasty Ahri · Stage 2",
          isBase: false,
          skinlineIds: [7],
          universeIds: [],
          media: { tileUrl: "https://example.test/stage-tile.jpg" },
          historicalArt: [],
          chromas: [],
          thumbnailUrl: "https://example.test/stage-tile.jpg",
        },
      ],
      {
        mode: "detail",
        page: "skinlines",
        kind: "skinline",
        id: 7,
        channel: "latest",
      },
    );

    expect(universeSlot.querySelector("a")?.href).toBe("/universes/detail/?id=200&channel=latest");
    expect(content.querySelector(".runtime-skin-reference-link")?.href).toBe(
      "/skins/detail/?id=103002&champion=103&channel=latest",
    );
  });

  it("renders universe descriptions, skinline links, and grouped skins", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
      location: {
        origin: "https://chromaart.lol",
        pathname: "/universes/detail/",
      },
    });
    const root = new TestElement("div");
    const status = new TestElement("p");
    status.dataset.runtimeStatus = "";
    const content = new TestElement("div");
    content.dataset.runtimeContent = "";
    root.append(status, content);
    const source = new TestElement("div");
    const view = createDomRuntimeView({
      root: root as unknown as HTMLElement,
      source: source as unknown as HTMLElement,
      locale: "default",
      page: "universes",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(
        "https://chromaart.lol/universes/detail/?id=200&channel=latest",
      ),
    });

    view.renderDetail(
      {
        kind: "universe",
        id: 200,
        name: "Star Guardian universe",
        description: "A bright parallel world.",
        imageUrl: "https://example.test/universe.png",
        skinlineIds: [7],
      },
      {
        mode: "detail",
        page: "universes",
        kind: "universe",
        id: 200,
        channel: "latest",
      },
    );
    view.renderRelations!(
      [
        {
          kind: "skinline",
          id: 7,
          name: "Star Guardian",
          universeIds: [200],
        },
      ],
      {
        mode: "detail",
        page: "universes",
        kind: "universe",
        id: 200,
        channel: "latest",
      },
    );

    expect(content.querySelector("h1")?.textContent).toBe(
      "Star Guardian universe",
    );
    expect(content.querySelector("img")).toBeNull();
    expect(content.querySelector("a")?.href).toBe(
      "/skinlines/detail/?id=7&channel=latest",
    );
    view.renderUniverseSkins!(
      [
        {
          skinlineId: 7,
          items: [
            {
              kind: "skin",
              id: 103001,
              skinId: 103001,
              championId: 103,
              target: { championId: 103, skinId: 103001 },
              stableKey: "103:103001",
              name: "Dynasty Ahri",
              isBase: false,
              skinlineIds: [7],
              universeIds: [200],
              media: { tileUrl: "https://example.test/skin-tile.jpg" },
              historicalArt: [],
              chromas: [],
              thumbnailUrl: "https://example.test/skin-tile.jpg",
            },
          ],
        },
      ],
      {
        mode: "detail",
        page: "universes",
        kind: "universe",
        id: 200,
        channel: "latest",
      },
    );
    expect(content.querySelector(".runtime-universe-skin-group")?.querySelector("h2")?.textContent).toBe(
      "Star Guardian",
    );
    expect(content.querySelector(".runtime-skin-reference-link")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&channel=latest",
    );
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("leaves cross-page runtime links to normal browser navigation", () => {
    expect(
      shouldHandleRuntimeNavigation(
        new URL(
          "https://chromaart.lol/skins/detail/?id=103001&champion=103",
        ),
        "/champions/",
      ),
    ).toBe(false);
    expect(
      shouldHandleRuntimeNavigation(
        new URL("https://chromaart.lol/champions/detail/?id=103"),
        "/champions/",
      ),
    ).toBe(false);
  });
});
