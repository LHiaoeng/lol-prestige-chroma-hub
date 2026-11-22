import { bindTooltip, type BoundTooltip } from "./tooltip";

const titleSelector = [
  ".card__title",
  ".card-body h2",
  ".runtime-chroma-name",
  ".blog-chroma-card-name",
  ".runtime-skin-reference-name",
  ".skin-catalog-card-title-name",
  ".tft-cosmetic-card-title-text",
  ".runtime-pbe-card-name",
  ".runtime-champion-name",
  ".runtime-card-title",
  ".runtime-universe-title",
  ".guide-card h3",
  ".featured-post-copy h2",
  ".adjacent-card strong",
].join(", ");

export function bindCardTitleTooltips(root: ParentNode = document): void {
  const tooltips = new WeakMap<HTMLElement, BoundTooltip>();
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach(({ target }) => updateTitle(target as HTMLElement));
  });

  function updateTitle(element: HTMLElement): void {
    const currentTitle = element.getAttribute("title");
    const fullTitle = element.textContent?.trim() || currentTitle || "";
    if (currentTitle) element.removeAttribute("title");
    const overflowing = Boolean(fullTitle) && element.scrollWidth > element.clientWidth;
    const tooltipWrapper = element.closest<HTMLElement>("[data-overflow-only-tooltip]");
    tooltipWrapper?.classList.toggle("is-overflowing", overflowing);
    if (tooltipWrapper) tooltipWrapper.tabIndex = overflowing ? 0 : -1;
    if (tooltipWrapper) {
      tooltips.get(element)?.destroy();
      tooltips.delete(element);
    } else if (overflowing) {
      const tooltip = tooltips.get(element);
      if (tooltip) tooltip.update(fullTitle);
      else {
        const focusTarget = element.closest<HTMLElement | SVGElement>("a, button, summary") ?? element;
        tooltips.set(element, bindTooltip(element, fullTitle, focusTarget));
      }
      if (!element.closest("a, button, summary, [tabindex]")) {
        element.tabIndex = 0;
        element.dataset.cardTitleFocusable = "true";
      }
    } else {
      tooltips.get(element)?.destroy();
      tooltips.delete(element);
    }
    if (element.dataset.cardTitleFocusable && !overflowing) {
      element.removeAttribute("tabindex");
      delete element.dataset.cardTitleFocusable;
    }
    resizeObserver.observe(element);
  }

  function updateTitles(node: Node): void {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(titleSelector)) updateTitle(node);
    node.querySelectorAll<HTMLElement>(titleSelector).forEach(updateTitle);
  }

  function stopObservingTitles(node: Node): void {
    if (!(node instanceof HTMLElement)) return;
    if (node.matches(titleSelector)) stopObservingTitle(node);
    node.querySelectorAll<HTMLElement>(titleSelector).forEach(stopObservingTitle);
  }

  function stopObservingTitle(element: HTMLElement): void {
    resizeObserver.unobserve(element);
    tooltips.get(element)?.destroy();
    tooltips.delete(element);
  }

  function refreshTitle(node: Node): void {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    const title = element?.closest<HTMLElement>(titleSelector);
    if (title) updateTitle(title);
  }

  root.querySelectorAll<HTMLElement>(titleSelector).forEach(updateTitle);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type !== "childList") refreshTitle(record.target);
      else {
        refreshTitle(record.target);
        record.addedNodes.forEach(updateTitles);
        record.removedNodes.forEach(stopObservingTitles);
      }
    });
  });
  observer.observe(root, {
    attributes: true,
    attributeFilter: ["title"],
    characterData: true,
    childList: true,
    subtree: true,
  });
}
