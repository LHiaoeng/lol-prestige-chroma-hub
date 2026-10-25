import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { matchesSelectSearch, nextEnabledIndex } from "./select";

const selectComponent = readFileSync(new URL("./Select.astro", import.meta.url), "utf8");
const filterComponent = readFileSync(new URL("./Filters.astro", import.meta.url), "utf8");
const skinCatalogComponent = readFileSync(new URL("./SkinCatalogRoot.astro", import.meta.url), "utf8");
const littleLegendsComponent = readFileSync(new URL("./TftLittleLegendsRoot.astro", import.meta.url), "utf8");
const selectStyles = readFileSync(new URL("../styles/global.css", import.meta.url), "utf8");
const selectLogic = readFileSync(new URL("./select.ts", import.meta.url), "utf8");

describe("Select component contract", () => {
  it("enables clearing by default and preserves the explicit opt-out", () => {
    expect(selectComponent).toMatch(/allowClear = true,/);
    expect(selectComponent).toContain('data-select-allow-clear={allowClear ? "" : undefined}');
  });

  it("keeps required sort selects non-clearable", () => {
    expect(filterComponent).toContain('<Select name="sort" allowClear={false}');
    expect(skinCatalogComponent).toMatch(/data-catalog-sort=""[\s\S]*?allowClear=\{false\}/);
    expect(littleLegendsComponent).toContain('data-little-legends-sort="" allowClear={false}');
  });

  it("maps the upstream clear affordance to the site tokens", () => {
    const clearStyle = selectStyles.match(/\.ant-select-clear\{([^}]*)\}/)?.[1] ?? "";
    expect(clearStyle).toContain("min-height:0");
    expect(clearStyle).toContain("inset-inline-start:auto");
    expect(clearStyle).toContain("color:var(--disabled)");
    expect(clearStyle).toContain("line-height:1");
    expect(clearStyle).toContain("transition:color var(--motion-mid) ease,opacity var(--motion-mid) ease");
    expect(selectStyles).toContain(".ant-select-clear:hover,.ant-select-clear:focus-visible{color:var(--tertiary)}");
    expect(selectStyles).toContain(".ant-select-clear:focus-visible{border-radius:var(--radius-tag);outline:2px solid var(--gold);outline-offset:-1px}");
    expect(selectStyles).toContain(".ant-select-clear[hidden]{display:none!important}");
    expect(selectStyles).toContain("@media(hover:none){.ant-select-allow-clear .ant-select-clear{opacity:1}}");
    expect(selectLogic).toContain("clearButton.hidden = !hasValue || source.disabled;");
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
