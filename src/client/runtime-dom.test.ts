import { afterEach, describe, expect, it, vi } from "vitest";
import { CommunityDragonRuntimeError } from "../domain/communitydragon-runtime";
import {
  channelFromLocation,
  createDomView,
} from "./chroma-runtime";
import {
  createDomRuntimeView,
  shouldHandleRuntimeNavigation,
  type RuntimeHistory,
} from "./runtime-reference";

function dataProperty(attribute: string): string {
  return attribute.slice(5).replace(/-([a-z])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
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
    this.children.forEach((child) => { child.parentElement = null; });
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
      return this.tagName === "meta" &&
        dataProperty(`data-${metaData[1]}`) in this.dataset;
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

  createElement(tagName: string): TestElement {
    return new TestElement(tagName);
  }

  createTextNode(text: string): TestElement {
    const node = new TestElement("text");
    node.textContent = text;
    return node;
  }
}

function history(): RuntimeHistory {
  return {
    url: new URL("https://chromaart.lol/champions/"),
    push() {},
    replace() {},
    onPopState() { return () => {}; },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe("runtime DOM boundaries", () => {
  it("binds source controls outside the content root and localizes channel labels", () => {
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
      getController: () => ({ navigate: vi.fn() } as never),
      history: history(),
    });
    view.renderList([], { mode: "list", page: "champions", channel: "latest" });

    expect(channelLabel.textContent).toBe("正式服");
    expect(pbe.getAttribute("aria-pressed")).toBe("false");
    expect(latest.getAttribute("aria-pressed")).toBe("true");
    expect(root.querySelector("[data-runtime-source]")).toBeNull();
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

  it("rejects an unsupported channel without normalizing it to PBE", () => {
    const document = new TestDocument();
    document.defaultView = {
      location: {
        href: "https://chromaart.lol/chromas/ahri/?channel=staging",
        search: "?channel=staging",
      },
    };
    expect(channelFromLocation(document as unknown as Document)).toBeUndefined();
  });

  it("leaves cross-page runtime links to normal browser navigation", () => {
    expect(
      shouldHandleRuntimeNavigation(
        new URL("https://chromaart.lol/skins/?id=103001&champion=103"),
        "/champions/",
      ),
    ).toBe(false);
    expect(
      shouldHandleRuntimeNavigation(
        new URL("https://chromaart.lol/champions/?id=103"),
        "/champions/",
      ),
    ).toBe(true);
  });
});
