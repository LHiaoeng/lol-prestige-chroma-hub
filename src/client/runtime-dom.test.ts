import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityDragonRuntimeError } from "../domain/communitydragon-runtime";
import { channelFromLocation, createDomView } from "./chroma-runtime";
import {
  createDomRuntimeView,
  shouldHandleRuntimeNavigation,
  type RuntimeHistory,
} from "./runtime-reference";

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
  textContent = "";
  value = "";
  type = "";
  id = "";
  href = "";
  src = "";
  alt = "";
  loading = "";
  width = 0;
  height = 0;

  constructor(readonly tagName: string) {}

  addEventListener(type: string, listener: () => void): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  append(...children: TestElement[]): void {
    children.forEach((child) => {
      child.parentElement = this;
      this.children.push(child);
    });
  }

  appendChild(child: TestElement): TestElement {
    this.append(child);
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

  matches(selector: string): boolean {
    const data = selector.match(/^\[data-([a-z0-9-]+)\]$/);
    if (data) return dataProperty(`data-${data[1]}`) in this.dataset;
    const metaData = selector.match(/^meta\[data-([a-z0-9-]+)\]$/);
    if (metaData)
      return (
        this.tagName === "meta" &&
        dataProperty(`data-${metaData[1]}`) in this.dataset
      );
    return selector.startsWith(".")
      ? this.className.split(" ").includes(selector.slice(1))
      : this.tagName === selector;
  }

  querySelectorAll<T extends TestElement>(selector: string): T[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child as T] : []),
      ...child.querySelectorAll<T>(selector),
    ]);
  }

  querySelector<T extends TestElement>(selector: string): T | null {
    return this.querySelectorAll<T>(selector)[0] ?? null;
  }
}

class TestDocument {
  readonly head = new TestElement("head");
  defaultView: { location: { href: string; search: string } } | null = null;

  querySelector<T extends TestElement>(selector: string): T | null {
    return this.head.querySelector<T>(selector);
  }

  querySelectorAll<T extends TestElement>(selector: string): T[] {
    return this.head.querySelectorAll<T>(selector);
  }

  createElement(tagName: string): TestElement {
    return new TestElement(tagName);
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

afterEach(() => vi.unstubAllGlobals());

describe("runtime DOM boundaries", () => {
  it("binds source controls outside the content root and uses exact channel tokens", () => {
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
      locale: "zh_cn",
      page: "champions",
      getController: () => ({ navigate: vi.fn() }) as never,
      history: history(),
    });
    view.loading(false, "latest");
    view.renderList([], { mode: "list", page: "champions", channel: "latest" });

    expect(channelLabel.textContent).toBe("latest");
    expect(pbe.textContent).toBe("pbe");
    expect(latest.textContent).toBe("latest");
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

    expect(channelLabel.textContent).toBe("latest");
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
    expect(content.querySelector(".runtime-pagination")).not.toBeNull();
    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(3);
    expect(content.querySelector(".runtime-champion-link")?.href).toBe(
      "/champions/detail/?id=103",
    );

    role!.value = "mage";
    role!.listeners.get("change")?.[0]?.();

    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(2);
    expect(content.querySelector(".runtime-champion-link")?.children).toHaveLength(
      2,
    );
  });

  it("searches, sorts, and paginates the champion list", () => {
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

    expect(content.querySelectorAll(".runtime-champion-card")).toHaveLength(24);
    expect(content.querySelector(".runtime-pagination")?.children).toHaveLength(
      3,
    );

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

  it("renders a champion detail and links skins to independent detail paths", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
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
        title: "the Nine-Tailed Fox",
        shortBio: "A vastayan fox.",
        portraitUrl: "https://example.test/ahri.png",
        skins: [
          {
            id: 103001,
            name: "Dynasty Ahri",
            isBase: false,
            skinlineIds: [],
            media: {},
            stages: [],
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
    expect(content.querySelector(".eyebrow")?.textContent).toBe(
      "the Nine-Tailed Fox",
    );
    expect(content.querySelector(".runtime-lede")?.textContent).toBe(
      "A vastayan fox.",
    );
    expect(content.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&channel=latest",
    );
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("links skinline relations to independent universe detail paths", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
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

    expect(content.querySelector("a")?.href).toBe(
      "/universes/detail/?id=200&channel=latest",
    );
  });

  it("renders universe details with media and independent skinline links", () => {
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
    expect(content.querySelector("img")?.src).toBe(
      "https://example.test/universe.png",
    );
    expect(content.querySelector("a")?.href).toBe(
      "/skinlines/detail/?id=7&channel=latest",
    );
    expect(content.querySelectorAll("a")).toHaveLength(1);
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("keeps static chroma copy and channel controls when the supplement changes", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const root = new TestElement("div");
    const staticCopy = new TestElement("span");
    staticCopy.dataset.chromaStaticCopy = "";
    staticCopy.textContent = "Static archive text";
    const content = new TestElement("span");
    content.dataset.chromaRuntimeContent = "";
    const controls = new TestElement("span");
    const button = new TestElement("button");
    button.dataset.chromaRuntimeChannel = "latest";
    controls.append(button);
    root.append(staticCopy, content, controls);

    const view = createDomView(
      root as unknown as HTMLElement,
      "default",
      () => "latest",
    );
    view.loading();
    view.failure(
      new CommunityDragonRuntimeError("network", "offline"),
      () => {},
      true,
    );

    expect(root.querySelector("[data-chroma-static-copy]")?.textContent).toBe(
      "Static archive text",
    );
    expect(root.querySelector("[data-chroma-runtime-channel]")).toBe(button);
  });

  it("uses the exact channel token for optional supplement status", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    const root = new TestElement("div");
    const content = new TestElement("span");
    content.dataset.chromaRuntimeContent = "";
    root.append(content);

    const view = createDomView(
      root as unknown as HTMLElement,
      "zh_cn",
      () => "latest",
    );
    view.render({
      champion: {
        kind: "champion",
        id: 103,
        name: "阿狸",
        skins: [
          {
            id: 103001,
            name: "玉狐",
            isBase: true,
            skinlineIds: [],
            media: {},
            stages: [],
          },
        ],
      },
      baseSkin: {
        id: 103001,
        name: "玉狐",
        isBase: true,
        skinlineIds: [],
        media: {},
        stages: [],
      },
    });

    expect(content.children[0].textContent).toBe("latest");
    expect(content.querySelector(".chroma-runtime-meta")).toBeNull();
  });

  it("rejects an unsupported channel without normalizing it to pbe", () => {
    const document = new TestDocument();
    document.defaultView = {
      location: {
        href: "https://chromaart.lol/chromas/ahri/?channel=staging",
        search: "?channel=staging",
      },
    };
    expect(
      channelFromLocation(document as unknown as Document),
    ).toBeUndefined();
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
