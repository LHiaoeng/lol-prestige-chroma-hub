import { afterEach, describe, expect, it, vi } from "vitest";
import { bindCardTitleTooltips } from "./card-title";

describe("bindCardTitleTooltips", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the existing tooltip without also showing a native tooltip", () => {
    const attributes = new Map([["title", "A very long card title"]]);
    const wrapper = {
      classList: { toggle: vi.fn() },
      dataset: { overflowOnly: "true" },
      tabIndex: 0,
    };
    const title = {
      clientWidth: 48,
      dataset: {} as Record<string, string>,
      getAttribute: (name: string) => attributes.get(name) ?? null,
      setAttribute: (name: string, value: string) => attributes.set(name, value),
      removeAttribute: (name: string) => attributes.delete(name),
      closest: () => wrapper,
      scrollWidth: 196,
      textContent: "A very long card title",
    };

    vi.stubGlobal("ResizeObserver", class { observe() {} });
    vi.stubGlobal("MutationObserver", class { observe() {} });

    bindCardTitleTooltips({ querySelectorAll: () => [title] } as unknown as ParentNode);

    expect(wrapper.classList.toggle).toHaveBeenCalledWith("is-overflowing", true);
    expect(wrapper.tabIndex).toBe(0);
    expect(attributes.has("title")).toBe(false);
  });
});
