import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeSkin, RuntimeChampionSummary, RuntimeRarity } from "../domain/communitydragon-runtime";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";
import type { RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { initSkinCatalog } from "./skin-catalog";

class ElementStub {
  children: ElementStub[] = [];
  parentElement: ElementStub | null = null;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, ((event: any) => void)[]>();
  style: { [key: string]: unknown; setProperty(name: string, value: string): void; removeProperty(name: string): void } = {
    setProperty: (name, value) => { this.style[name] = value; },
    removeProperty: (name) => { delete this.style[name]; },
  };
  className = "";
  classList = {
    add: (...names: string[]) => {
      this.className = [...new Set([...this.className.split(" ").filter(Boolean), ...names])].join(" ");
    },
  };
  id = "";
  text = "";
  value = "";
  href = "";
  src = "";
  alt = "";
  title = "";
  type = "";
  loading = "";
  hidden = false;
  disabled = false;
  checked = false;
  indeterminate = false;
  tabIndex = -1;
  constructor(readonly tagName: string, readonly ownerDocument: DocumentStub) {}
  get textContent(): string { return this.text + this.children.map((child) => child.textContent).join(""); }
  set textContent(value: string) { this.replaceChildren(); this.text = value; }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, x: string) => x.toUpperCase())] = value;
  }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  toggleAttribute(name: string, force?: boolean) {
    const enabled = force ?? !this.attributes.has(name);
    if (enabled) this.attributes.set(name, ""); else this.attributes.delete(name);
    return enabled;
  }
  addEventListener(type: string, listener: (event: any) => void) {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  fire(type: string, extra: Record<string, unknown> = {}) {
    const event = { type, target: this, shiftKey: false, key: "", preventDefault: vi.fn(), ...extra };
    for (let node: ElementStub | null = this; node; node = node.parentElement)
      node.listeners.get(type)?.forEach((listener) => listener(event));
    return event;
  }
  click() { this.fire("click"); }
  focus() { this.ownerDocument.activeElement = this; }
  append(...children: ElementStub[]) {
    for (const child of children) { child.remove(); child.parentElement = this; this.children.push(child); }
  }
  appendChild(child: ElementStub) { child.remove(); this.append(child); return child; }
  replaceChildren(...children: ElementStub[]) {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    this.text = "";
    this.append(...children);
  }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1);
    this.parentElement = null;
  }
  contains(child: ElementStub): boolean {
    return child === this || this.children.some((item) => item.contains(child));
  }
  matches(selector: string): boolean {
    const dataValue = selector.match(/^\[data-([\w-]+)="([^"]+)"\]$/);
    if (dataValue) return this.dataset[dataValue[1].replace(/-([a-z])/g, (_, x: string) => x.toUpperCase())] === dataValue[2];
    const data = selector.match(/^\[data-([\w-]+)\]$/);
    if (data) return data[1].replace(/-([a-z])/g, (_, x: string) => x.toUpperCase()) in this.dataset;
    return selector.startsWith(".")
      ? selector.slice(1).split(".").every((name) => this.className.split(" ").includes(name))
      : this.tagName === selector;
  }
  closest(selector: string): ElementStub | null {
    for (let node: ElementStub | null = this; node; node = node.parentElement)
      if (node.matches(selector)) return node;
    return null;
  }
  querySelectorAll(selector: string): ElementStub[] {
    const selectors = selector.split(",").map((part) => part.trim());
    return this.children.flatMap((child) => [
      ...(selectors.some((part) => child.matches(part)) ? [child] : []),
      ...child.querySelectorAll(selector),
    ]);
  }
  querySelector(selector: string): ElementStub | null { return this.querySelectorAll(selector)[0] ?? null; }
}

class DocumentStub {
  root = new ElementStub("body", this);
  activeElement: ElementStub | null = null;
  createElement(tag: string) { return new ElementStub(tag, this); }
  createTextNode(text: string) {
    const node = this.createElement("text");
    node.textContent = text;
    return node;
  }
  querySelector(selector: string) { return this.root.querySelector(selector); }
}

function history(initial = "https://chromaart.lol/skins/") {
  let url = new URL(initial);
  const listeners = new Set<() => void>();
  const changes: string[] = [];
  return {
    get url() { return new URL(url); },
    push(next: URL) { url = new URL(next); changes.push(next.href); },
    replace(next: URL) { url = new URL(next); changes.push(next.href); },
    onPopState(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    pop(next: string) { url = new URL(next); listeners.forEach((listener) => listener()); },
    changes,
  } satisfies RuntimeChannelHistory & { pop(next: string): void; changes: string[] };
}

function skin(id: number, championId: number, rarity?: RuntimeRarity): RuntimeSkin {
  return {
    kind: "skin", id, championId, name: `Skin ${id}`, isBase: false,
    skinlineIds: [], media: { loadScreenUrl: "https://example.com/skin.jpg" },
    stages: [], chromas: [], rarity,
  };
}
function borderedSkin(id: number): RuntimeSkin {
  return { ...skin(id, 1), media: { loadScreenUrl: "https://example.com/skin.jpg", loadScreenBorders: [{ layer: 0, priority: 1, url: "https://example.com/border.png" }] } };
}
function vintageBorderedSkin(id: number): RuntimeSkin {
  return { ...skin(id, 1), media: { loadScreenUrl: "https://example.com/plain.jpg", loadScreenVintageUrl: "https://example.com/framed.jpg" } };
}
const champions: RuntimeChampionSummary[] = [
  { kind: "champion", id: 1, name: "Ahri" },
  { kind: "champion", id: 2, name: "Zed" },
];
const skins = [
  skin(101, 1, { key: "kEpic", label: "Epic" }),
  skin(102, 1, { key: "kMythic", label: "Mythic" }),
  skin(201, 2),
];
function fixture(initial?: string, list = vi.fn(async () => ({ skins, champions })), columns = 6, locale = "default") {
  const document = new DocumentStub();
  const root = document.createElement("section");
  root.dataset.catalogLocale = locale;
  document.root.append(root);
  const add = (tag: string, data: string, parent = root) => {
    const node = document.createElement(tag);
    node.dataset[data] = "";
    parent.append(node);
    return node;
  };
  const summarySkeleton = add("div", "catalogSummarySkeleton");
  const summary = add("div", "catalogSummary");
  summary.hidden = true;
  const trigger = add("button", "antDropdownTrigger", summary);
  const channelLabel = add("span", "runtimeChannelLabel", trigger);
  const count = add("p", "catalogCount", summary);
  count.hidden = true;
  const pbe = add("button", "runtimeChannel", summary);
  pbe.dataset.runtimeChannel = "pbe";
  const latest = add("button", "runtimeChannel", summary);
  latest.dataset.runtimeChannel = "latest";
  const filterSkeleton = add("div", "catalogFilterSkeleton");
  const searchRow = document.createElement("div");
  searchRow.className = "skin-catalog-search";
  searchRow.hidden = true;
  root.append(searchRow);
  const search = add("input", "catalogSearch", searchRow);
  const rarityRow = document.createElement("fieldset");
  rarityRow.className = "skin-catalog-rarities";
  rarityRow.hidden = true;
  root.append(rarityRow);
  const rarities = add("div", "catalogRarities", rarityRow);
  const toolbar = document.createElement("div");
  toolbar.className = "skin-catalog-toolbar";
  toolbar.hidden = true;
  root.append(toolbar);
  const includeClassic = add("input", "catalogClassic", toolbar);
  const sort = add("select", "catalogSort", toolbar);
  const borderSetting = document.createElement("label");
  borderSetting.className = "skin-catalog-framed-setting";
  toolbar.append(borderSetting);
  const framedTooltipTrigger = add("span", "catalogFramedTooltipTrigger", borderSetting);
  const showFramedScreens = add("input", "catalogFramedAll", framedTooltipTrigger);
  const framedLabel = document.createElement("span");
  framedLabel.textContent = "Borders";
  framedTooltipTrigger.append(framedLabel);
  const framedCount = add("span", "catalogFramedCount", borderSetting);
  const showEmblems = add("input", "catalogEmblemsAll", toolbar);
  showEmblems.checked = true;
  const status = add("p", "catalogStatus");
  status.className = "sr-only skin-catalog-status";
  const content = add("div", "catalogContent");
  const loadingSkeleton = document.createElement("div");
  loadingSkeleton.className = "skin-catalog-skeleton";
  content.append(loadingSkeleton);
  const results = add("div", "catalogResults");
  results.hidden = true;
  const grid = add("div", "catalogGrid", results);
  const loadMoreFooter = add("div", "catalogLoadMoreFooter", results);
  loadMoreFooter.hidden = true;
  const loadMore = add("button", "catalogLoadMore", loadMoreFooter);
  const h = history(initial);
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", { location: { origin: "https://chromaart.lol" } });
  vi.stubGlobal("getComputedStyle", () => ({ getPropertyValue: () => String(columns) }));
  const runtime = { listSkinCatalog: list } as unknown as CommunityDragonRuntime;
  const controller = initSkinCatalog(root as unknown as HTMLElement, runtime, h);
  return { document, root, summary, summarySkeleton, filterSkeleton, trigger, channelLabel, search, rarities, includeClassic, sort, showFramedScreens, framedCount, showEmblems, count, pbe, latest, status, content, results, grid, loadMoreFooter, loadMore, h, list, controller };
}

afterEach(() => vi.unstubAllGlobals());

describe("skin catalog browser behavior", () => {
  it("replaces aligned loading placeholders with the shared channel summary and filters", async () => {
    let resolve!: (value: { skins: RuntimeSkin[]; champions: RuntimeChampionSummary[] }) => void;
    const page = fixture(undefined, vi.fn(() => new Promise((done) => { resolve = done; })));
    expect(page.summary.hidden).toBe(true);
    expect(page.summarySkeleton.hidden).toBe(false);
    expect(page.filterSkeleton.hidden).toBe(false);
    expect(page.search.closest(".skin-catalog-search")?.hidden).toBe(true);
    resolve({ skins, champions });
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    expect(page.summary.hidden).toBe(false);
    expect(page.summarySkeleton.hidden).toBe(true);
    expect(page.filterSkeleton.hidden).toBe(true);
    expect(page.search.closest(".skin-catalog-search")?.hidden).toBe(false);
    expect(page.channelLabel.textContent).toBe("PBE");
  });

  it("combines search and multiple rarities, then restores the URL on popstate", async () => {
    const page = fixture();
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    page.search.value = "ahri";
    page.search.fire("input");
    expect(page.count.textContent).toContain("2 / 3");
    page.rarities.querySelector('[data-catalog-rarity="key:kEpic"]')!.click();
    page.rarities.querySelector('[data-catalog-rarity="key:kMythic"]')!.click();
    expect(page.count.textContent).toContain("2 / 3");
    expect(page.h.url.searchParams.getAll("rarity")).toEqual(["key:kEpic", "key:kMythic"]);
    page.h.pop("https://chromaart.lol/skins/?q=Zed");
    await vi.waitFor(() => expect(page.count.textContent).toContain("1 / 3"));
    expect(page.search.value).toBe("Zed");
    expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(1);
  });

  it("includes classic names by default and restores the exclusion setting", async () => {
    const classicSkins = [
      ...skins,
      { ...skin(301, 1), name: "经典阿狸" },
      { ...skin(302, 1), name: "Classic Ahri" },
    ];
    const page = fixture(undefined, vi.fn(async () => ({ skins: classicSkins, champions })));
    await vi.waitFor(() => expect(page.count.textContent).toContain("5 / 5"));
    expect(page.includeClassic.checked).toBe(true);

    page.includeClassic.checked = false;
    page.includeClassic.fire("change");
    expect(page.count.textContent).toContain("3 / 5");
    expect(page.h.url.searchParams.get("excludeClassic")).toBe("1");

    page.h.pop("https://chromaart.lol/skins/?excludeClassic=1");
    await vi.waitFor(() => expect(page.includeClassic.checked).toBe(false));
    page.h.pop("https://chromaart.lol/skins/");
    await vi.waitFor(() => expect(page.includeClassic.checked).toBe(true));
    expect(page.count.textContent).toContain("5 / 5");
  });

  it("orders rarity options by descending rarity and labels missing rarity as Other", async () => {
    const raritySkins = Array.from({ length: 11 }, (_, index) => {
      const id = index + 1;
      return skin(500 + id, 1, { id, label: `Rarity ${id}` });
    });
    const page = fixture(undefined, vi.fn(async () => ({
      skins: [...raritySkins, skin(599, 1)], champions,
    })), 6, "zh_cn");
    await vi.waitFor(() => expect(page.count.textContent).toContain("12 / 12"));
    expect(page.rarities.querySelectorAll("[data-catalog-rarity]").slice(1).map((button) => button.dataset.catalogRarity)).toEqual([
      "id:11", "id:10", "id:9", "id:8", "id:7", "id:5", "id:4", "id:3", "id:2", "id:1", "id:6", "unmarked",
    ]);
    expect(page.rarities.querySelector('[data-catalog-rarity="unmarked"]')?.textContent).toBe("其他");
  });

  it("keeps old cards and URL after a failed channel switch, then retries", async () => {
    let reject!: (error: Error) => void;
    const list = vi.fn()
      .mockResolvedValueOnce({ skins, champions })
      .mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValueOnce({ skins: [skin(301, 2)], champions });
    const page = fixture(undefined, list);
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    page.latest.click();
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    reject(new Error("offline"));
    await vi.waitFor(() => expect(page.content.textContent).toContain("could not be reached"));
    expect(page.h.url.searchParams.has("channel")).toBe(false);
    expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(3);
    page.content.querySelector("button")!.click();
    await vi.waitFor(() => expect(page.count.textContent).toContain("1 / 1"));
    expect(page.h.url.searchParams.get("channel")).toBe("latest");
    expect(page.channelLabel.textContent).toBe("Live");
    expect(page.latest.getAttribute("aria-checked")).toBe("true");
  });

  it("uses the aligned skeleton instead of visible loading copy, including on retry", async () => {
    let reject!: (error: Error) => void;
    const list = vi.fn()
      .mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }))
      .mockResolvedValueOnce({ skins, champions });
    const page = fixture(undefined, list);
    expect(page.status.textContent).toBe("Loading the full skin catalog…");
    expect(page.status.className).toContain("sr-only");
    expect(page.content.querySelector(".skin-catalog-skeleton")).not.toBeNull();
    expect(page.content.textContent).not.toContain("Loading the full skin catalog");

    reject(new Error("offline"));
    await vi.waitFor(() => expect(page.content.textContent).toContain("could not be reached"));
    expect(page.content.querySelector(".skin-catalog-skeleton")).toBeNull();
    page.content.querySelector("button")!.click();
    expect(page.content.querySelector(".skin-catalog-skeleton")).not.toBeNull();
    expect(page.content.textContent).not.toContain("Loading the full skin catalog");
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    expect(page.content.hidden).toBe(true);
  });

  it("ignores a late channel response and hides filters when the loaded catalog is empty", async () => {
    let resolveLate!: (value: { skins: RuntimeSkin[]; champions: RuntimeChampionSummary[] }) => void;
    const list = vi.fn()
      .mockResolvedValueOnce({ skins, champions })
      .mockImplementationOnce(() => new Promise((resolve) => { resolveLate = resolve; }))
      .mockResolvedValueOnce({ skins: [], champions });
    const page = fixture(undefined, list);
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    page.latest.click();
    await vi.waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    page.h.pop("https://chromaart.lol/skins/");
    await vi.waitFor(() => expect(page.content.textContent).toContain("No skins"));
    expect(page.search.closest(".skin-catalog-search")?.hidden).toBe(true);
    expect(page.rarities.closest(".skin-catalog-rarities")?.hidden).toBe(true);
    resolveLate({ skins: [skin(999, 1)], champions });
    await Promise.resolve();
    expect(page.h.url.searchParams.has("channel")).toBe(false);
    expect(page.content.textContent).toContain("No skins");
  });

  it("appends the next page and hides the load-more control when all results are shown", async () => {
    const many = Array.from({ length: 80 }, (_, i) => skin(1000 + i, i % 2 ? 1 : 2));
    const page = fixture(undefined, vi.fn(async () => ({ skins: many, champions })));
    await vi.waitFor(() => expect(page.count.textContent).toContain("80 / 80"));
    expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(54);
    expect(page.loadMoreFooter.hidden).toBe(false);
    expect(page.loadMore.textContent).toBe("Load more");
    page.loadMore.fire("click", { detail: 0 });
    expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(80);
    expect(page.grid.querySelector("a")?.href).toContain("/skins/detail/?id=");
    expect(page.loadMoreFooter.hidden).toBe(true);
    expect(page.document.activeElement?.tagName).toBe("a");
  });

  it.each([2, 3, 4, 6])("loads complete rows at %i columns", async (columns) => {
    const page = fixture(undefined, vi.fn(async () => ({ skins: Array.from({ length: 80 }, (_, i) => skin(1000 + i, i % 2 ? 1 : 2)), champions })), columns);
    await vi.waitFor(() => expect(page.count.textContent).toContain("80 / 80"));
    const initialCount = page.grid.querySelectorAll(".skin-catalog-card").length;
    expect(initialCount).toBe(Math.ceil(50 / columns) * columns);
    expect(initialCount % columns).toBe(0);
  });

  it("shows CommunityDragon skin emblems above names and toggles them globally", async () => {
    const emblemUrl = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/zh_cn/v1/emblem-images/28.png";
    const chineseSkins = Array.from({ length: 80 }, (_, i) => ({
      ...skin(1000 + i, i % 2 ? 1 : 2, {
        id: 5, label: "传说", iconUrl: "https://example.com/cn-gem-5.png",
      }),
      emblems: [{ name: "Wisdom of Pioneer", imageUrl: emblemUrl }],
    }));
    const page = fixture(undefined, vi.fn(async () => ({ skins: chineseSkins, champions })), 6, "zh_cn");
    await vi.waitFor(() => expect(page.count.textContent).toContain("80 / 80"));

    const title = page.grid.querySelector(".skin-catalog-card-title")!;
    const group = title.querySelector("[data-catalog-emblems]")!;
    const badge = group.querySelector("img")!;
    expect(page.showEmblems.checked).toBe(true);
    expect(group.hidden).toBe(false);
    expect(badge.src).toBe(emblemUrl);
    expect(badge.alt).toBe("Wisdom of Pioneer");
    expect(title.children[0]).toBe(group);
    expect(title.children[1].textContent).toBe("Skin 1001");
    expect(page.grid.querySelector(".skin-catalog-card-rarity")?.src).toBe("https://example.com/cn-gem-5.png");

    page.showEmblems.checked = false;
    page.showEmblems.fire("change");
    expect(page.grid.querySelectorAll("[data-catalog-emblems]").every((emblems) => emblems.hidden)).toBe(true);
    page.loadMore.click();
    expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(80);
    expect(page.grid.querySelectorAll("[data-catalog-emblems]").every((emblems) => emblems.hidden)).toBe(true);
  });

  it("does not show Chinese emblems in the default locale", async () => {
    const page = fixture(undefined, vi.fn(async () => ({
      skins: [{
        ...skin(101, 1),
        emblems: [{ name: "Epic", imageUrl: "https://example.com/emblem.png" }],
      }],
      champions,
    })));
    await vi.waitFor(() => expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(1));
    expect(page.grid.querySelector("[data-catalog-emblems]")).toBeNull();
  });

  it("does not reserve title space when a Chinese skin has no emblems", async () => {
    const page = fixture(undefined, vi.fn(async () => ({ skins: [skin(101, 1)], champions })), 6, "zh_cn");
    await vi.waitFor(() => expect(page.grid.querySelectorAll(".skin-catalog-card")).toHaveLength(1));
    expect(page.grid.querySelector("[data-catalog-emblems]")).toBeNull();
  });

  it("switches complete loading-screen modes per skin and in bulk", async () => {
    const page = fixture(undefined, vi.fn(async () => ({ skins: [borderedSkin(901), vintageBorderedSkin(902), skin(903, 1)], champions })));
    await vi.waitFor(() => expect(page.count.textContent).toContain("3 / 3"));
    expect(page.framedCount.textContent).toBe("2 / 2 framed");
    const framedTooltip = page.root.querySelector(".skin-catalog-framed-tooltip")!;
    expect(framedTooltip.tabIndex).toBe(-1);
    expect(page.showFramedScreens.getAttribute("aria-describedby")).toBe(framedTooltip.getAttribute("aria-describedby"));
    expect(page.framedCount.closest(".ant-tooltip")).toBe(framedTooltip.querySelector(".ant-tooltip"));
    const [first, second] = page.grid.querySelectorAll(".skin-catalog-artwork-toggle");
    const framed = page.grid.querySelectorAll(".skin-catalog-card-artwork--framed");
    const plain = page.grid.querySelectorAll(".skin-catalog-card-artwork--plain");
    expect(framed.every((artwork) => !artwork.hidden)).toBe(true);
    expect(plain.every((artwork) => artwork.hidden)).toBe(true);
    expect(page.showFramedScreens.checked).toBe(true);
    expect(plain[1].querySelector("img")?.src).toBe("https://example.com/plain.jpg");
    expect(framed[1].querySelector("img")?.src).toBe("https://example.com/framed.jpg");
    expect(framed[1].querySelector(".skin-catalog-card-border")).toBeNull();

    first.click();
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(page.showFramedScreens.indeterminate).toBe(true);
    expect(page.framedCount.textContent).toBe("1 / 2 framed");

    page.showFramedScreens.checked = false;
    page.showFramedScreens.fire("change");
    expect(plain.every((artwork) => !artwork.hidden)).toBe(true);
    expect(framed.every((artwork) => artwork.hidden)).toBe(true);
    expect(second.getAttribute("aria-pressed")).toBe("false");
    expect(page.showFramedScreens.checked).toBe(false);
    expect(page.showFramedScreens.indeterminate).toBe(false);

    page.showFramedScreens.checked = true;
    page.showFramedScreens.fire("change");
    expect(framed.every((artwork) => !artwork.hidden)).toBe(true);
    expect(plain.every((artwork) => artwork.hidden)).toBe(true);
    expect(first.getAttribute("aria-pressed")).toBe("true");
  });
});
