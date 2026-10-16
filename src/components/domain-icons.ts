import { createTooltip } from "./tooltip";

export const DOMAIN_ICONS = {
  "prestige-chromas": '<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.8 1.8 0 0 1 1-3.3H17a4 4 0 0 0 4-4c0-4-4-7-9-7Z"/><circle cx="7.5" cy="10" r=".7"/><circle cx="11" cy="7" r=".7"/><circle cx="16" cy="8" r=".7"/>',
  "game-version": '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h4M8 2v4M16 2v4M8 18v4M16 18v4"/>',
  "pbe-additions": '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  champions: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  skins: '<path d="m8 4 4 2 4-2 5 3-2 5-3-2v10H8V10l-3 2-2-5 5-3Z"/>',
  media: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 8 6 4-6 4V8Z"/><path d="m3 17 4-4 3 3 2-2 3 3"/>',
  skinlines: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  universes: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
  reference: '<path d="M8 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M9 2h8l4 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M17 2v5h5M11 11h6M11 14h6"/>',
} as const;

export type DomainIconName = keyof typeof DOMAIN_ICONS;

const DOMAIN_ICON_LABELS: Record<DomainIconName, { readonly zh: string; readonly en: string }> = {
  "prestige-chromas": { zh: "臻彩", en: "Chromas" },
  "game-version": { zh: "游戏版本", en: "Patch" },
  "pbe-additions": { zh: "PBE 新增内容", en: "PBE additions" },
  champions: { zh: "英雄", en: "Champion" },
  skins: { zh: "皮肤", en: "Skin" },
  media: { zh: "多媒体", en: "Media" },
  skinlines: { zh: "皮肤系列", en: "Skinline" },
  universes: { zh: "皮肤宇宙", en: "Universe" },
  reference: { zh: "资料版本", en: "Reference data" },
};

export function domainIconTooltipLabel(
  name: DomainIconName,
  detail: string,
  locale: string,
): string {
  const isChinese = locale === "zh-cn" || locale === "zh_cn";
  const label = DOMAIN_ICON_LABELS[name][isChinese ? "zh" : "en"];
  return detail ? `${label}${isChinese ? "：" : ": "}${detail}` : label;
}

export function setDomainIconTooltip(
  icon: SVGSVGElement,
  name: DomainIconName,
  detail: string,
  locale: string,
): HTMLElement {
  const previousTrigger = icon.closest<HTMLElement>("[data-domain-icon-tooltip-trigger]");
  const parent = previousTrigger?.parentElement ?? icon.parentElement;
  const nextSibling = previousTrigger?.nextSibling ?? icon.nextSibling;
  const label = domainIconTooltipLabel(name, detail, locale);
  const trigger = createTooltip(icon, label);
  trigger.setAttribute("aria-label", label);
  trigger.classList.add("domain-icon-tooltip-trigger");
  trigger.dataset.domainIconTooltipTrigger = name;
  if (previousTrigger) previousTrigger.replaceWith(trigger);
  else if (parent) parent.insertBefore(trigger, nextSibling);
  return trigger;
}

export function createDomainIcon(name: DomainIconName): SVGSVGElement {
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  icon.classList.add("domain-icon", `domain-icon--${name}`);
  icon.innerHTML = DOMAIN_ICONS[name];
  return icon;
}

export function createDomainHeading(
  name: DomainIconName,
  label: string | Node,
): HTMLHeadingElement {
  const heading = document.createElement("h2");
  heading.className = "runtime-section-heading";
  heading.append(
    createDomainIcon(name),
    typeof label === "string" ? document.createTextNode(label) : label,
  );
  return heading;
}
