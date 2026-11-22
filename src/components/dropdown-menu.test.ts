import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { dropdownPopupLayout } from "./dropdown-menu";

const textTrigger = '<a slot="trigger" role="button" tabindex="0" class="ant-dropdown-text-trigger"';

it("uses the caller's trigger element", () => {
  const component = readFileSync(new URL("./Dropdown.astro", import.meta.url), "utf8");
  expect(component).toContain('<slot name="trigger" />');
  expect(component).not.toContain("triggerVariant");
  expect(component).toContain("trigger = 'hover'");
  expect(component).toContain("data-ant-dropdown={trigger}");
});

it("renders both header menus with icon-bearing menu items", () => {
  const layout = readFileSync(new URL("../layouts/BaseLayout.astro", import.meta.url), "utf8");
  for (const id of ["browse-nav", "tft-browse-nav"]) {
    const menu = layout.split(`<Dropdown id="${id}">`)[1]?.split("</Dropdown>")[0];
    expect(menu).toBeDefined();
    expect(menu).toContain('<a slot="trigger" role="button" tabindex="0" class="ant-btn ant-btn-variant-text"');
    expect(menu?.match(/<li role="none">/g)?.length).toBe(menu?.match(/class="ant-dropdown-menu-item-icon"/g)?.length);
  }
  const tftMenu = layout.split('<Dropdown id="tft-browse-nav">')[1]?.split("</Dropdown>")[0];
  expect(tftMenu).not.toContain("', '/tft/')");
  expect(tftMenu).toContain('<DomainIcon name="tft-companions" class="ant-dropdown-menu-item-icon" />');
  expect(tftMenu).toContain('<DomainIcon name="tft-arenas" class="ant-dropdown-menu-item-icon" />');
});

it('offers a right-aligned bilingual theme menu with the three saved preferences', () => {
  const layout = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const menu = layout.split('<Dropdown id="theme-preference" placement="bottomRight">')[1]?.split('</Dropdown>')[0];
  expect(menu).toBeDefined();
  expect(menu).toContain('aria-label={isZh ? \'主题\' : \'Theme\'}');
  expect(menu).toContain('name="theme-switch"');
  expect(menu?.match(/role="menuitemradio"/g)).toHaveLength(3);
  expect(menu?.match(/data-theme-option="(system|light|dark)"/g)).toEqual([
    'data-theme-option="system"',
    'data-theme-option="light"',
    'data-theme-option="dark"',
  ]);
  expect(menu).toContain('data-theme-option="dark" aria-checked="true"');
  expect(menu).toMatch(/暗黑主题[\s\S]*?role="separator"[\s\S]*?role="menuitemcheckbox" data-ant-dropdown-item data-happy-work-toggle aria-checked="false"/);
  expect(menu).toContain("isZh ? '快乐工作特效' : 'Happy Work Effect'");
  expect(layout.indexOf('data-theme-option="dark" aria-checked="true"'))
    .toBeLessThan(layout.indexOf('bindThemeSwitcher();'));
  expect(layout).toContain("localStorage.getItem('theme-mode')");
  expect(layout).toContain("preference !== 'system' && preference !== 'light' && preference !== 'dark'");
  expect(layout).toContain('document.documentElement.dataset.theme = theme');
});

it("uses default activation with the text trigger for version and detail action menus", () => {
  for (const [path, menuCount] of [
    ["./RuntimeChannelSwitcher.astro", 1],
    ["./RuntimeDetailSummary.astro", 2],
    ["../pages/chromas/[slug].astro", 1],
  ] as const) {
    const source = readFileSync(new URL(path, import.meta.url), "utf8");
    const menus = source.match(/<Dropdown\b[^>]*>/g) ?? [];
    expect(menus).toHaveLength(menuCount);
    for (const menu of menus) expect(menu).not.toMatch(/\btrigger\s*=/);
    expect(source.split(textTrigger)).toHaveLength(menuCount + 1);
  }
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
