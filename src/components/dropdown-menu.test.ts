import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dropdownPopupLayout } from "./dropdown-menu";

it("uses the caller's trigger element", () => {
  const component = readFileSync(new URL("./Dropdown.astro", import.meta.url), "utf8");
  expect(component).toContain('<slot name="trigger" />');
  expect(component).not.toContain("triggerVariant");
});

it("renders both header menus with icon-bearing menu items", () => {
  const layout = readFileSync(new URL("../layouts/BaseLayout.astro", import.meta.url), "utf8");
  for (const id of ["browse-nav", "tft-browse-nav"]) {
    const menu = layout.split(`<Dropdown id="${id}">`)[1]?.split("</Dropdown>")[0];
    expect(menu).toBeDefined();
    expect(menu?.match(/<li role="none">/g)?.length).toBe(menu?.match(/class="ant-dropdown-menu-item-icon"/g)?.length);
  }
  const tftMenu = layout.split('<Dropdown id="tft-browse-nav">')[1]?.split("</Dropdown>")[0];
  expect(tftMenu).not.toContain("', '/tft/')");
  expect(tftMenu).toContain('<DomainIcon name="tft-companions" class="ant-dropdown-menu-item-icon" />');
  expect(tftMenu).toContain('<DomainIcon name="tft-arenas" class="ant-dropdown-menu-item-icon" />');
});

describe("dropdownPopupLayout", () => {
  it("keeps a left-aligned menu inside a narrow viewport and opens upward when needed", () => {
    expect(dropdownPopupLayout(
      { left: 280, right: 312, top: 190, bottom: 222 },
      { width: 160, height: 180 },
      { width: 320, height: 300 },
      false,
    )).toEqual({ edge: 152, openUp: true, maxHeight: 178 });
  });

  it("keeps a right-aligned menu inside the viewport and caps a long menu", () => {
    expect(dropdownPopupLayout(
      { left: 18, right: 50, top: 12, bottom: 44 },
      { width: 160, height: 400 },
      { width: 320, height: 300 },
      true,
    )).toEqual({ edge: 168, openUp: false, maxHeight: 200 });
  });
});
