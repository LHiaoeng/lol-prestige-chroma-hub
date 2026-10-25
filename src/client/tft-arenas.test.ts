import { afterEach, describe, expect, it, vi } from "vitest";
import type { TftArena } from "../domain/tft-arenas";
import type { CommunityDragonRuntime } from "./communitydragon-runtime";
import type { RuntimeChannelHistory } from "./runtime-channel-lifecycle";
import { initTftArenas } from "./tft-arenas";

class ElementStub {
  children: ElementStub[] = [];
  parentElement: ElementStub | null = null;
  dataset: Record<string, string> = {};
  attributes = new Map<string, string>();
  listeners = new Map<string, (() => void)[]>();
  className = "";
  classList = {
    add: (...names: string[]) => { this.className = [...new Set([...this.className.split(" ").filter(Boolean), ...names])].join(" "); },
    remove: (...names: string[]) => { this.className = this.className.split(" ").filter((name) => !names.includes(name)).join(" "); },
    toggle: (name: string, force?: boolean) => {
      const enabled = force ?? !this.classList.contains(name);
      if (enabled) this.classList.add(name); else this.classList.remove(name);
      return enabled;
    },
    contains: (name: string) => this.className.split(" ").includes(name),
  };
  style: Record<string, unknown> = {};
  text = "";
  value = "";
  src = "";
  alt = "";
  type = "";
  loading = "";
  decoding = "";
  innerHTML = "";
  content?: { cloneNode: () => ElementStub };
  hidden = false;
  disabled = false;
  checked = false;
  onclick: (() => void) | null = null;
  constructor(readonly tagName: string, readonly ownerDocument: DocumentStub) {}
  get textContent(): string { return this.text + this.children.map((child) => child.textContent).join(""); }
  set textContent(value: string) { this.replaceChildren(); this.text = value; }
  get firstElementChild() { return this.children[0] ?? null; }
  get isConnected() { return this.ownerDocument.body.contains(this); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  removeAttribute(name: string) { this.attributes.delete(name); }
  addEventListener(type: string, listener: () => void) { this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]); }
  removeEventListener(type: string, listener: () => void) { this.listeners.set(type, (this.listeners.get(type) ?? []).filter((current) => current !== listener)); }
  fire(type: string) { for (const listener of this.listeners.get(type) ?? []) listener(); if (type === "click") this.onclick?.(); }
  click() { this.fire("click"); }
  append(...children: ElementStub[]) { for (const child of children) { child.remove(); child.parentElement = this; this.children.push(child); } }
  replaceChildren(...children: ElementStub[]) { this.children.forEach((child) => { child.parentElement = null; }); this.children = []; this.text = ""; this.append(...children); }
  remove() { if (this.parentElement) { this.parentElement.children.splice(this.parentElement.children.indexOf(this), 1); this.parentElement = null; } }
  before(node: ElementStub) { if (!this.parentElement) return; node.remove(); const at = this.parentElement.children.indexOf(this); this.parentElement.children.splice(at, 0, node); node.parentElement = this.parentElement; }
  cloneNode(deep = false) { const node = this.ownerDocument.createElement(this.tagName); node.className = this.className; node.text = this.text; node.dataset = { ...this.dataset }; if (deep) node.append(...this.children.map((child) => child.cloneNode(true))); return node; }
  contains(node: ElementStub | null): boolean { return !!node && (node === this || this.children.some((child) => child.contains(node))); }
  matches(selector: string): boolean {
    const data = selector.match(/^\[data-([\w-]+)\]$/);
    if (data) return data[1].replace(/-([a-z])/g, (_, char: string) => char.toUpperCase()) in this.dataset;
    if (selector.startsWith(".")) return selector.slice(1).split(".").every((name) => this.classList.contains(name));
    return this.tagName === selector;
  }
  querySelectorAll(selector: string): ElementStub[] { return this.children.flatMap((child) => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector: string): ElementStub | null { return this.querySelectorAll(selector)[0] ?? null; }
  getBoundingClientRect() { return { top: 0, bottom: 24, left: 0, right: 24, width: 24, height: 24 }; }
}

class DocumentStub {
  body = new ElementStub("body", this);
  defaultView = null;
  activeElement: ElementStub | null = null;
  createElement(tag: string) { return new ElementStub(tag, this); }
  createElementNS(_namespace: string, tag: string) { return this.createElement(tag); }
  querySelector(selector: string) { return this.body.querySelector(selector); }
  addEventListener() {}
  removeEventListener() {}
}

function history(initial: string) {
  let url = new URL(initial);
  const listeners = new Set<() => void>();
  return {
    get url() { return new URL(url); },
    push(next: URL) { url = new URL(next); },
    replace(next: URL) { url = new URL(next); },
    onPopState(listener: () => void) { listeners.add(listener); return () => listeners.delete(listener); },
    pop(next: string) { url = new URL(next); listeners.forEach((listener) => listener()); },
  } satisfies RuntimeChannelHistory & { pop(next: string): void };
}

const arena = (id: number, name = `Arena ${id}`): TftArena => ({
  itemId: id, groupId: 0, groupName: "Base", name, TFTRarity: "kStandard", imageUrl: `https://example.test/${id}.png`,
});

function fixture(
  list: (options: { locale: string; channel: string }) => Promise<readonly TftArena[]>,
  initial = "https://chromaart.lol/tft/arenas/",
  columns = 2,
) {
  const document = new DocumentStub();
  const root = document.createElement("section");
  root.dataset.arenasLocale = "default";
  document.body.append(root);
  const add = (tag: string, key: string, parent = root) => {
    const node = document.createElement(tag);
    node.dataset[key] = "";
    parent.append(node);
    return node;
  };
  const filters = add("div", "arenasFilters");
  const filterSkeleton = add("div", "arenasFilterSkeleton");
  const search = add("input", "arenasSearch", filters);
  const group = add("select", "arenasGroup", filters);
  const rarity = add("select", "arenasRarity", filters);
  const sort = add("select", "arenasSort", filters);
  for (const select of [group, rarity, sort]) select.append(document.createElement("option"));
  const pbeSetting = add("label", "arenasPbeSetting", filters);
  const pbeOnly = add("input", "arenasPbeOnly", pbeSetting);
  const status = add("p", "arenasStatus");
  const aliasNotice = add("div", "arenasAliasNotice");
  const aliasRetry = add("button", "arenasAliasRetry", aliasNotice);
  const compareNotice = add("div", "arenasCompareNotice");
  const compareRetry = add("button", "arenasCompareRetry", compareNotice);
  const spinner = add("div", "runtimeSpin");
  const content = add("div", "arenasContent");
  content.append(document.createElement("div"));
  const results = add("div", "arenasResults");
  const resultCount = add("p", "arenasResultCount", results);
  const grid = add("div", "arenasGrid", results);
  const loadMoreFooter = add("div", "arenasLoadMoreFooter", results);
  const loadMore = add("button", "arenasLoadMore", loadMoreFooter);
  const empty = add("template", "arenasEmptyTemplate");
  const emptyRoot = document.createElement("div");
  const emptyNode = document.createElement("div");
  emptyNode.className = "ant-empty-description";
  emptyRoot.append(emptyNode);
  empty.content = { cloneNode: () => emptyRoot.cloneNode(true) };
  const error = add("template", "arenasErrorTemplate");
  const errorRoot = document.createElement("div");
  const errorWrapper = document.createElement("div");
  errorWrapper.className = "tft-arenas-error";
  const errorMessage = document.createElement("span"); errorMessage.dataset.arenasErrorMessage = "";
  const errorButton = document.createElement("button"); errorButton.dataset.arenasRetry = "";
  errorWrapper.append(errorMessage, errorButton);
  errorRoot.append(errorWrapper);
  error.content = { cloneNode: () => errorRoot.cloneNode(true) };
  const count = add("span", "arenasCount");
  add("span", "runtimeChannelLabel");
  const pbe = add("button", "runtimeChannel"); pbe.dataset.runtimeChannel = "pbe";
  const latest = add("button", "runtimeChannel"); latest.dataset.runtimeChannel = "latest";
  const h = history(initial);
  vi.stubGlobal("document", document);
  vi.stubGlobal("Node", ElementStub);
  vi.stubGlobal("window", { innerHeight: 800, innerWidth: 1200, scrollX: 0, scrollY: 0, setTimeout, clearTimeout, addEventListener() {}, removeEventListener() {} });
  vi.stubGlobal("getComputedStyle", () => ({ gridTemplateColumns: Array(columns).fill("180px").join(" ") }));
  const runtime = { listTftArenas: list } as CommunityDragonRuntime;
  const lifecycle = initTftArenas(root as unknown as HTMLElement, runtime, h);
  return { root, h, lifecycle, search, pbe, latest, status, grid, count, resultCount, loadMore, loadMoreFooter, pbeOnly, pbeSetting, aliasNotice, aliasRetry, compareNotice, compareRetry, filters, filterSkeleton, rarity };
}

afterEach(() => vi.unstubAllGlobals());

describe("TFT Arenas browser behavior", () => {
  it("loads the URL channel, keeps the first 50 cards, and extends the list on demand", async () => {
    const rows = Array.from({ length: 55 }, (_, index) => arena(index + 1));
    const page = fixture(async () => rows, "https://chromaart.lol/tft/arenas/?channel=latest", 2);
    await vi.waitFor(() => expect(page.count.textContent).toBe("55 Arenas in this data channel"));
    expect(page.rarity.children.map((option) => option.textContent)).toContain("Standard");
    expect(page.grid.children).toHaveLength(50);
    expect(page.loadMoreFooter.hidden).toBe(false);
    page.loadMore.click();
    expect(page.grid.children).toHaveLength(55);
    expect(page.loadMoreFooter.hidden).toBe(true);
    expect(page.h.url.searchParams.get("channel")).toBe("latest");
    page.lifecycle.dispose();
  });

  it("keeps URL search in sync and adds opposite-language names when they arrive", async () => {
    let resolveAliases!: (rows: readonly TftArena[]) => void;
    const aliases = new Promise<readonly TftArena[]>((resolve) => { resolveAliases = resolve; });
    const page = fixture(({ locale }) => locale === "default" ? Promise.resolve([arena(7, "English Arena")]) : aliases);
    await vi.waitFor(() => expect(page.grid.children).toHaveLength(1));
    page.search.value = "中文棋盘";
    page.search.fire("input");
    expect(page.h.url.searchParams.get("q")).toBe("中文棋盘");
    expect(page.grid.children[0]?.className).not.toContain("tft-arenas-card");
    resolveAliases([arena(7, "中文棋盘")]);
    await vi.waitFor(() => expect(page.grid.children[0]?.className).toContain("tft-arenas-card"));
    page.lifecycle.dispose();
  });

  it("preserves visible data when a channel request fails", async () => {
    const page = fixture(({ channel, locale }) => channel === "latest" && locale === "default"
      ? Promise.reject(new Error("offline")) : Promise.resolve([arena(1)]));
    await vi.waitFor(() => expect(page.grid.children).toHaveLength(1));
    page.latest.click();
    await vi.waitFor(() => expect(page.root.querySelector(".tft-arenas-error")).not.toBeNull());
    expect(page.h.url.searchParams.get("channel")).toBe(null);
    expect(page.grid.children[0]?.className).toContain("tft-arenas-card");
    page.lifecycle.dispose();
  });

  it("ignores an old channel's late translation after switching channels", async () => {
    let finishOldAlias!: (rows: readonly TftArena[]) => void;
    const oldAlias = new Promise<readonly TftArena[]>((resolve) => { finishOldAlias = resolve; });
    const page = fixture(({ locale, channel }) => {
      if (locale === "zh_cn") return channel === "pbe" ? oldAlias : Promise.resolve([arena(2, "新棋盘")]);
      return Promise.resolve(channel === "pbe" ? [arena(1, "Old Arena")] : [arena(2, "New Arena")]);
    });
    await vi.waitFor(() => expect(page.grid.textContent).toContain("Old Arena"));
    page.latest.click();
    await vi.waitFor(() => expect(page.grid.textContent).toContain("New Arena"));
    finishOldAlias([arena(1, "旧棋盘")]);
    page.search.value = "旧棋盘";
    page.search.fire("input");
    expect(page.grid.textContent).not.toContain("Old Arena");
    expect(page.h.url.searchParams.get("channel")).toBe("latest");
    page.lifecycle.dispose();
  });

  it("retries translation failure without losing the live PBE comparison", async () => {
    let attempts = 0;
    const page = fixture(({ locale, channel }) => {
      if (locale === "zh_cn") return ++attempts === 1
        ? Promise.reject(new Error("translation offline")) : Promise.resolve([arena(2, "中文棋盘")]);
      return Promise.resolve(channel === "pbe" ? [arena(2, "English Arena")] : [arena(1)]);
    });
    await vi.waitFor(() => expect(page.aliasNotice.hidden).toBe(false));
    await vi.waitFor(() => expect(page.grid.textContent).toContain("PBE addition"));
    expect(page.compareNotice.hidden).toBe(true);
    page.aliasRetry.click();
    await vi.waitFor(() => expect(page.aliasNotice.hidden).toBe(true));
    page.search.value = "中文棋盘";
    page.search.fire("input");
    expect(page.grid.textContent).toContain("English Arena");
    page.lifecycle.dispose();
  });
});
