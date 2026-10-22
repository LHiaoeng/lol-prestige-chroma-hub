import { createTooltip } from "./tooltip";

import { createIcon } from "./icons/create-icon";
import { DOMAIN_ICONS, type DomainIconName } from "./icons/domain-icon-glyphs";
export { DOMAIN_ICONS };
export type { DomainIconName };

const DOMAIN_ICON_LABELS: Record<DomainIconName, { readonly zh: string; readonly en: string }> = {
  "prestige-chromas": { zh: "臻彩", en: "Chromas" },
  "game-version": { zh: "游戏版本", en: "Patch" },
  "pbe-additions": { zh: "PBE 新增内容", en: "PBE additions" },
  "teamfight-tactics": { zh: "云顶之弈", en: "Teamfight Tactics" },
  champions: { zh: "英雄", en: "Champion" },
  skins: { zh: "皮肤", en: "Skin" },
  rarity: { zh: "稀有度", en: "Rarity" },
  "release-date": { zh: "上线时间", en: "Release date" },
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
  const icon = createIcon(name);
  icon.classList.add("domain-icon", `domain-icon--${name}`);
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
