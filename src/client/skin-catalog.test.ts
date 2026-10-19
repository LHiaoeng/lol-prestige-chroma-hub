import { afterEach, describe, expect, it, vi } from "vitest";
import type { RuntimeSkin, RuntimeChampionSummary } from "../domain/communitydragon-runtime";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";
import type { RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { initSkinCatalog } from "./skin-catalog";

class ElementStub {
  children: ElementStub[] = [];
  parentElement: ElementStub | null = null;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, ((event: any) => void)[]>();
  style: Record<string, string> = {};
  className = "";
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
  scrollTop = 0;
  clientHeight = 380;
  constructor(readonly tagName: string, readonly ownerDocument: DocumentStub) {}
  get textContent(): string { return this.text + this.children.map((child) => child.textContent).join(""); }
  set textContent(value: string) { this.replaceChildren(); this.text = value; }
  getBoundingClientRect() { return { height: 180 }; }
  setAttribute(name: string, value: string) {
    this.attributes.set(name, value);
    if (name.startsWith("data-")) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, x: string) => x.toUpperCase())] = value;
  }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
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
    for (const child of children) { child.parentElement = this; this.children.push(child); }
  }
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

function skin(id: number, championId: number, rarity?: { key?: string; label?: string; iconUrl?: string }): RuntimeSkin {
  return {
    kind: "skin", id, championId, name: `Skin ${id}`, isBase: false,
    skinlineIds: [], media: { loadScreenUrl: "https://example.com/skin.jpg" },
    stages: [], chromas: [], rarity,
  };
}
const champions: RuntimeChampionSummary[] = [
  { kind: "champion", id: 1, name: "Ahri" },
  { kind: "champion", id: 2, name: "Zed" },
];
const skins = [
  skin(101, 1, { key: "kEpic", label: "Epic", iconUrl: "https://example.com/epic.png" }),
  skin(102, 1, { key: "kMythic", label: "Mythic" }),
  skin(201, 2),
];
function fixture(initial?: string, list = vi.fn(async () => ({ skins, champions }))) {
  const document = new DocumentStub();
  const root = document.createElement("section");
  root.dataset.catalogLocale = "default";
  document.root.append(root);
  const add = (tag: string, data: string, parent = root) => {
    const node = document.createElement(tag);
    node.dataset[data] = "";
    parent.append(node);
    return node;
  };
  const searchRow = document.createElement("div");
  searchRow.className = "skin-catalog-search";
  root.append(searchRow);
  const search = add("input", "catalogSearch", searchRow);
  const rarityRow = document.createElement("fieldset");
  rarityRow.className = "skin-catalog-rarities";
  root.append(rarityRow);
  const rarities = add("div", "catalogRarities", rarityRow);
  const toolbar = document.createElement("div");
  toolbar.className = "skin-catalog-toolbar";
  root.append(toolbar);
  const sort = add("select", "catalogSort", toolbar);
  const count = add("p", "catalogCount", toolbar);
  const pbe = add("button", "catalogChannel");
  pbe.dataset.catalogChannel = "pbe";
  const latest = add("button", "catalogChannel");
  latest.dataset.catalogChannel = "latest";
  const status = add("p", "catalogStatus");
  const content = add("div", "catalogContent");
  const viewport = add("div", "catalogViewport");
  viewport.hidden = true;
  const h = history(initial);
  vi.stubGlobal("document", document);
  vi.stubGlobal("window", { location: { origin: "https://chromaart.lol" } });
  vi.stubGlobal("getComputedStyle", (node: ElementStub) => ({
    getPropertyValue: () => node.dataset.columns ?? "2",
    rowGap: "8px",
  }));
  vi.stubGlobal("ResizeObserver", class { observe() {} });
  const runtime = { listSkinCatalog: list } as unknown as CommunityDragonRuntime;
  const controller = initSkinCatalog(root as unknown as HTMLElement, runtime, h);
  return { document, root, search, rarities, sort, count, pbe, latest, status, content, viewport, h, list, controller };
}

afterEach(() => vi.unstubAllGlobals());

describe("skin catalog browser behavior", () => {
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
    expect(page.viewport.querySelectorAll(".skin-catalog-card")).toHaveLength(1);
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
    expect(page.viewport.querySelectorAll(".skin-catalog-card")).toHaveLength(3);
    page.content.querySelector("button")!.click();
    await vi.waitFor(() => expect(page.count.textContent).toContain("1 / 1"));
    expect(page.h.url.searchParams.get("channel")).toBe("latest");
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

  it("renders a bounded window and reaches later links by keyboard", async () => {
    const many = Array.from({ length: 80 }, (_, i) => skin(1000 + i, i % 2 ? 1 : 2));
    const page = fixture(undefined, vi.fn(async () => ({ skins: many, champions })));
    await vi.waitFor(() => expect(page.count.textContent).toContain("80 / 80"));
    expect(page.viewport.querySelectorAll(".skin-catalog-card").length).toBeLessThan(20);
    page.viewport.scrollTop = 180 * 20;
    page.viewport.fire("scroll");
    const first = page.viewport.querySelector("[data-catalog-index]");
    expect(Number(first?.dataset.catalogIndex)).toBeGreaterThan(0);
    first!.fire("keydown", { key: "End" });
    expect(page.document.activeElement?.dataset.catalogIndex).toBe("79");
    expect(page.document.activeElement?.href).toContain("/skins/detail/?id=");
    page.viewport.dataset.columns = "3";
    page.viewport.fire("scroll");
    expect(page.viewport.querySelectorAll(".skin-catalog-card").length).toBeLessThan(20);
  });
});
