export const DOMAIN_ICONS = {
  "prestige-chromas": '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.8 1.8 0 0 1 1-3.3H17a4 4 0 0 0 4-4c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".7"/><circle cx="11" cy="7" r=".7"/><circle cx="16" cy="8" r=".7"/>',
  "pbe-additions": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  champions: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  skins: '<path d="m8 4 4 2 4-2 5 3-2 5-3-2v10H8V10l-3 2-2-5 5-3Z"/>',
  skinlines: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  universes: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  reference: '<path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M9 2h8l4 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M17 2v5h5M11 11h6M11 14h6"/>',
} as const;

export type DomainIconName = keyof typeof DOMAIN_ICONS;

export function createDomainIcon(name: DomainIconName): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("domain-icon", `domain-icon--${name}`);
  icon.innerHTML = DOMAIN_ICONS[name];
  return icon;
}
