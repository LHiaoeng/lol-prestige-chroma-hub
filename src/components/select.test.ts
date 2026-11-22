import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { matchesSelectSearch, nextEnabledIndex } from "./select";

const selectComponent = readFileSync(new URL("./Select.astro", import.meta.url), "utf8");
const filterComponent = readFileSync(new URL("./Filters.astro", import.meta.url), "utf8");
const skinCatalogComponent = readFileSync(new URL("./SkinCatalogRoot.astro", import.meta.url), "utf8");
const companionsComponent = readFileSync(new URL("./TftCompanionsRoot.astro", import.meta.url), "utf8");
const selectStyles = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const adSlotComponent = readFileSync(new URL("./AdSlot.astro", import.meta.url), "utf8");
const selectLogic = readFileSync(new URL("./select.ts", import.meta.url), "utf8");

describe("Select component contract", () => {
  it("renders the shared trigger appearance before browser enhancement", () => {
    expect(selectComponent).toContain("data-select-preview");
    expect(selectComponent).toContain("<DownOutlined />");
    expect(selectLogic).toContain("preview?.remove()");
  });

  it("requires an explicit opt-in to clearing", () => {
    expect(selectComponent).toMatch(/allowClear = false,/);
    expect(selectComponent).toContain('data-select-allow-clear={allowClear ? "" : undefined}');
    expect(filterComponent).toContain('<Select allowClear name="hero"');
  });

  it("keeps required sort selects non-clearable", () => {
    expect(filterComponent).toContain('<Select name="sort" allowClear={false}');
    expect(skinCatalogComponent).toMatch(/data-catalog-sort=""[\s\S]*?allowClear=\{false\}/);
    expect(companionsComponent).toContain('data-tft-companions-sort="" allowClear={false}');
  });

  it("maps the upstream clear affordance to the site tokens", () => {
    const clearStyle = selectStyles.match(/\.ant-select-clear\{([^}]*)\}/)?.[1] ?? "";
    expect(clearStyle).toContain("min-height:0");
    expect(clearStyle).toContain("inset-inline-start:auto");
    expect(clearStyle).toContain("color:var(--disabled)");
    expect(clearStyle).toContain("line-height:1");
    expect(clearStyle).toContain("transition:color var(--motion-mid) ease,opacity var(--motion-mid) ease");
    expect(selectStyles).toContain(".ant-select-clear:hover,.ant-select-clear:focus-visible{color:var(--tertiary)}");
    expect(selectStyles).toContain(".ant-select-clear:focus-visible{border-radius:var(--radius-tag);outline:2px solid var(--gold-text);outline-offset:-1px}");
    expect(selectStyles).toContain(".ant-select-clear[hidden]{display:none!important}");
    const touchStyle = selectStyles.match(/@media \(hover: none\) \{([\s\S]*?)@media\(prefers-reduced-motion/)?.[1] ?? "";
    expect(touchStyle).toContain("position: static");
    expect(touchStyle).toContain("width: var(--control-height-sm)");
    expect(touchStyle).toContain(":has(> .ant-select-clear:not([hidden])) > .ant-select-suffix { display: none; }");
    expect(selectLogic).toContain("clearButton.hidden = !hasValue || source.disabled;");
  });

  it("keeps active placeholder and option-group text readable", () => {
    expect(selectStyles).toContain(".cn-input::placeholder{color:var(--muted);opacity:1}");
    expect(selectStyles).toMatch(/\.ant-select-placeholder\{[^}]*color:var\(--muted\)/);
    expect(selectStyles).toContain(".ant-select-item-group{color:var(--muted);");
    expect(adSlotComponent).toContain(".ad-label { display: block; margin-bottom: var(--space-2); color: var(--muted);");
  });
});

describe("nextEnabledIndex", () => {
  const options = [{ disabled: false }, { disabled: true }, { disabled: false }];

  it("skips disabled options and wraps around", () => {
    expect(nextEnabledIndex(options, 0, 1)).toBe(2);
    expect(nextEnabledIndex(options, 2, 1)).toBe(0);
    expect(nextEnabledIndex(options, 0, -1)).toBe(2);
  });

  it("returns -1 when there are no enabled options", () => {
    expect(nextEnabledIndex([{ disabled: true }], 0, 1)).toBe(-1);
    expect(nextEnabledIndex([], -1, 1)).toBe(-1);
  });

  it("skips options hidden by search", () => {
    expect(nextEnabledIndex([
      { disabled: false },
      { disabled: false, hidden: true },
      { disabled: false },
    ], 0, 1)).toBe(2);
  });
});

describe("matchesSelectSearch", () => {
  const option = { label: "Little Legend", value: "little-legend" };

  it("searches labels by default without case sensitivity", () => {
    expect(matchesSelectSearch("legend", option)).toBe(true);
    expect(matchesSelectSearch("little legend", option)).toBe(true);
    expect(matchesSelectSearch("MISSING", option)).toBe(false);
  });

  it("can search option values", () => {
    expect(matchesSelectSearch("little-", option, "value")).toBe(true);
    expect(matchesSelectSearch("special", option, "value")).toBe(false);
  });
});
