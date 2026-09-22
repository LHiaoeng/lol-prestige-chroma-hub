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
    expect(content.querySelector(".runtime-pagination")).not.toBeNull();
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

    expect(content.querySelector(".runtime-universe-skinlines")?.textContent).toBe(
      "Star Guardian",
    );
    const link = content.querySelector("a");
    expect(link?.textContent).toBe("");
    expect(link?.querySelector(".runtime-universe-meta")?.querySelector("span")?.textContent).toBe(
      "Star Guardian",
    );
    expect(link?.href).toBe(
      "/universes/detail/?id=200",
    );
  });

  it("renders deduplicated square-thumbnail skin cards, sorting, and rarity", () => {
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
    expect(content.querySelectorAll(".runtime-skin-reference-card")).toHaveLength(
      2,
    );
    expect(content.querySelectorAll(".runtime-rarity")).toHaveLength(2);
    expect(content.querySelector(".runtime-rarity")?.querySelector("span")?.textContent).toBe(
      "Legendary",
    );
    expect(
      [...content.querySelectorAll(".runtime-skin-reference-card")].map(
        (card) => card.querySelector("img")?.src,
      ),
    ).toEqual([
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
            .querySelector(".runtime-skin-reference-meta")
            ?.querySelector("span")?.textContent,
      ),
    ).toEqual(["Dynasty Ahri", "Dynasty Ahri · Stage 2"]);
    skinSort.value = "release";
    skinSort.listeners.get("change")?.forEach((listener) => listener());
    expect(content.querySelectorAll(".runtime-skin-reference-card")[0]?.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&channel=latest",
    );
    expect(content.querySelectorAll(".runtime-skin-reference-card")[1]?.querySelector("a")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&stage=103002&channel=latest",
    );
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("renders a skin detail with a link back to the champion detail", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
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
        "https://chromaart.lol/skins/detail/?id=103001&champion=103&channel=latest",
      ),
    });

    view.renderDetail(
      {
        kind: "skin",
        id: 103001,
        championId: 103,
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
    expect(content.querySelector("a")?.href).toBe(
      "/champions/detail/?id=103&channel=latest",
    );
    expect(content.querySelectorAll("a")[1]?.href).toBe(
      "/skins/detail/?id=103001&champion=103&stage=103002&channel=latest",
    );
    expect(content.querySelector(".runtime-lede")?.textContent).toBe(
      "A dynasty-inspired skin.",
    );
    expect(document.head.querySelector("meta[data-runtime-noindex]")).not.toBeNull();
  });

  it("renders localized rarity, all core media, historical artwork, and relations", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
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
        "https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002&channel=latest",
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
    expect(mediaSection?.querySelectorAll(".runtime-media-item")).toHaveLength(5);
    expect(mediaSection?.querySelector("video")?.src).toBe(
      "https://example.test/animated.webm",
    );
    expect(content.querySelector(".runtime-rarity")?.querySelector("span")?.textContent).toBe(
      "Legendary",
    );
    expect(content.querySelector(".runtime-skin-history")?.querySelector("h3")?.textContent).toBe(
      "14.1",
    );
    expect(content.querySelector(".runtime-stage-media")?.querySelector("img")?.src).toBe(
      "https://example.test/stage.jpg",
    );
    expect(content.querySelector("a")?.href).toBe(
      "/champions/detail/?id=103&channel=latest",
    );

    view.renderRelations!(
      [
        { kind: "skinline", id: 7, name: "Star Guardian", universeIds: [200] },
        { kind: "universe", id: 200, name: "Star Guardian", skinlineIds: [7] },
      ],
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

    expect(
      content.querySelectorAll("a").find((link) => link.href.includes("/skinlines/detail/"))?.href,
    ).toBe(
      "/skinlines/detail/?id=7&channel=latest",
    );
    expect(
      content.querySelectorAll("a").find((link) => link.href.includes("/universes/detail/"))?.href,
    ).toBe(
      "/universes/detail/?id=200&channel=latest",
    );
  });

  it("renders the skin self item, true chromas, colors, and locale-specific external actions", () => {
    const document = new TestDocument();
    vi.stubGlobal("document", document);
    vi.stubGlobal("window", {
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
        "https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002",
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
        stages: [],
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

    expect(content.querySelector(".runtime-chroma-count")?.textContent).toBe("2");
    expect(content.querySelectorAll(".runtime-chroma-card")).toHaveLength(3);
    const base = content.querySelector(".runtime-chroma-base");
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

    const externalLinks = content.querySelectorAll(".runtime-external-link");
    expect(externalLinks).toHaveLength(2);
    expect(externalLinks.map((link) => link.textContent)).toEqual([
      "SkinSpotlights",
      "Teemo.GG",
    ]);
    expect(externalLinks[0]?.getAttribute("target")).toBe("_blank");
    expect(externalLinks[0]?.getAttribute("rel")).toBe("noopener noreferrer");
    expect(externalLinks[1]?.href).toContain("skinid=ahri-1");
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
    view.renderSkinlineSkins!(
      [
        {
          kind: "stage",
          id: 103001,
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

    expect(content.querySelector("a")?.href).toBe(
      "/universes/detail/?id=200&channel=latest",
    );
    expect(content.querySelector(".runtime-skin-reference-link")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&stage=103002&channel=latest",
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
    expect(content.querySelector(".runtime-universe-skin-group")?.querySelector("h3")?.textContent).toBe(
      "Star Guardian",
    );
    expect(content.querySelector(".runtime-skin-reference-link")?.href).toBe(
      "/skins/detail/?id=103001&champion=103&channel=latest",
    );
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

  it("preserves an explicit pbe channel in static chroma detail links", () => {
    const document = new TestDocument();
    document.defaultView = {
      location: {
        href: "https://chromaart.lol/chromas/ahri/?channel=pbe",
        search: "?channel=pbe",
      },
    };
    vi.stubGlobal("document", document);
    const root = new TestElement("div");
    const content = new TestElement("span");
    content.dataset.chromaRuntimeContent = "";
    root.append(content);

    const view = createDomView(root as unknown as HTMLElement, "default", () => "pbe");
    view.render({
      champion: {
        kind: "champion",
        id: 103,
        name: "Ahri",
        skins: [],
      },
      baseSkin: {
        id: 103001,
        name: "Dynasty Ahri",
        isBase: true,
        skinlineIds: [],
        media: {},
        stages: [],
      },
    });

    expect(content.querySelectorAll("a").map((link) => link.href)).toContain(
      "/skins/detail/?id=103001&champion=103&channel=pbe",
    );
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
