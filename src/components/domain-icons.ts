export const DOMAIN_ICONS = {
  "prestige-chromas": '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>',
  "pbe-additions": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  champions: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  skinlines: '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.8 1.8 0 0 1 1-3.3H17a4 4 0 0 0 4-4c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".7"/><circle cx="11" cy="7" r=".7"/><circle cx="16" cy="8" r=".7"/>',
  universes: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
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
