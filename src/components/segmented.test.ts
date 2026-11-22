import { expect, it, vi } from "vitest";
import { createSegmented } from "./Segmented";

class TestElement extends EventTarget {
  className = "";
  checked = false;
  offsetWidth = 0;
  offsetLeft = 0;
  parent?: TestElement;
  children: TestElement[] = [];
  style = { setProperty: vi.fn() };

  setAttribute() {}

  append(...children: TestElement[]) {
    for (const child of children) child.parent = this;
    this.children.push(...children);
  }

  prepend(child: TestElement) {
    child.parent = this;
    this.children.unshift(child);
  }

  remove() {
    if (this.parent) this.parent.children = this.parent.children.filter((child) => child !== this);
  }
}

it("uses a temporary thumb and preserves the latest motion on rapid selection changes", () => {
  vi.stubGlobal("document", { createElement: () => new TestElement() });
  try {
    const onChange = vi.fn();
    const group = createSegmented({
      name: "view",
      value: "cards",
      ariaLabel: "View",
      options: [{ value: "cards", label: "Cards" }, { value: "groups", label: "By species" }],
      onChange,
    }) as unknown as TestElement;
    const [track] = group.children;
    const [cards, groups] = track.children;
    cards.offsetWidth = 56;
    groups.offsetWidth = 84;
    groups.offsetLeft = 56;
    expect(track.children).toEqual([cards, groups]);

    cards.children[0].checked = false;
    groups.children[0].checked = true;
    groups.children[0].dispatchEvent(new Event("change"));
    const firstThumb = track.children[0];
    expect(firstThumb.className).toBe("ant-segmented-thumb");
    expect(firstThumb.style.setProperty).toHaveBeenCalledWith("--thumb-to-width", "84px");

    groups.children[0].checked = false;
    cards.children[0].checked = true;
    cards.children[0].dispatchEvent(new Event("change"));
    const latestThumb = track.children[0];
    firstThumb.dispatchEvent(new Event("animationcancel"));
    expect(track.children).toEqual([latestThumb, cards, groups]);
    latestThumb.dispatchEvent(new Event("animationend"));
    expect(track.children).toEqual([cards, groups]);
    expect(onChange.mock.calls).toEqual([["groups"], ["cards"]]);
  } finally {
    vi.unstubAllGlobals();
  }
});
