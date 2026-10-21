const UI_ICONS = {
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6"/><circle cx="12" cy="7.5" r=".75"/>',
  "image-switch": '<path d="m16 3 4 4-4 4M20 7H4"/><path d="m8 21-4-4 4-4M4 17h16"/>',
} as const;

export type UiIconName = keyof typeof UI_ICONS;

export function createUiIcon(name: UiIconName): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.classList.add("ui-icon", `ui-icon--${name}`);
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.innerHTML = UI_ICONS[name];
  return icon;
}
