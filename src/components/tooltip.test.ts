import { afterEach, describe, expect, it, vi } from "vitest";
import { bindTooltip } from "./tooltip";

describe("bindTooltip", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("updates the tooltip and removes its description when destroyed", () => {
    const attributes = new Map<string, string>();
    const trigger = {
      addEventListener: vi.fn(),
      contains: vi.fn(() => false),
      getAttribute: (name: string) => attributes.get(name) ?? null,
      isConnected: true,
      matches: vi.fn(() => false),
      removeAttribute: (name: string) => attributes.delete(name),
      removeEventListener: vi.fn(),
      setAttribute: (name: string, value: string) => attributes.set(name, value),
    };
    const tooltip = {
      addEventListener: vi.fn(),
      classList: { contains: vi.fn(() => false), remove: vi.fn() },
      id: "ant-tooltip-1",
      remove: vi.fn(),
      setAttribute: vi.fn(),
      style: { setProperty: vi.fn() },
      textContent: "",
    };
    vi.stubGlobal("document", { createElement: () => tooltip });
    vi.stubGlobal("window", { clearTimeout: vi.fn(), removeEventListener: vi.fn() });

    const binding = bindTooltip(trigger as unknown as HTMLElement, "Full title");
    binding.update("Updated title");

    expect(tooltip.textContent).toBe("Updated title");
    expect(attributes.get("aria-describedby")).toBe("ant-tooltip-1");

    binding.destroy();

    expect(attributes.has("aria-describedby")).toBe(false);
    expect(tooltip.remove).toHaveBeenCalledOnce();
  });
});
