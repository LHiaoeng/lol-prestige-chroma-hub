let tooltipId = 0;

type TooltipTrigger = HTMLElement | SVGElement;

function createTooltipElement(content: string | HTMLElement): HTMLSpanElement {
  const tooltip = document.createElement("span");
  tooltip.id = `ant-tooltip-${++tooltipId}`;
  tooltip.className = "ant-tooltip";
  tooltip.setAttribute("role", "tooltip");
  if (typeof content === "string") tooltip.textContent = content;
  else tooltip.appendChild(content);
  return tooltip;
}

function bindTooltipEvents(
  trigger: TooltipTrigger,
  focusTarget: TooltipTrigger,
  tooltip: HTMLElement,
  shouldOpen: () => boolean = () => true,
  closeOnClick = true,
): () => void {
  let closeTimer: number | undefined;

  const positionTooltip = () => {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const center = triggerRect.left + triggerRect.width / 2;
    const left = Math.max(
      8,
      Math.min(center - tooltipRect.width / 2, window.innerWidth - tooltipRect.width - 8),
    );
    const above =
      triggerRect.top - tooltipRect.height - 8 >= 8 ||
      triggerRect.bottom + tooltipRect.height + 8 > window.innerHeight;
    const desiredTop = above
      ? triggerRect.top - tooltipRect.height - 8
      : triggerRect.bottom + 8;
    tooltip.dataset.placement = above ? "top" : "bottom";
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(8, Math.min(desiredTop, window.innerHeight - tooltipRect.height - 8))}px`;
    tooltip.style.setProperty(
      "--tooltip-arrow-x",
      `${Math.max(8, Math.min(center - left, tooltipRect.width - 8))}px`,
    );
  };
  const close = () => {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
    tooltip.classList.remove("is-open");
    tooltip.remove();
    window.removeEventListener("resize", positionTooltip);
    window.removeEventListener("scroll", positionTooltip, true);
  };
  const open = () => {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
    if (!shouldOpen() || !trigger.isConnected || tooltip.classList.contains("is-open")) return;
    document.body.appendChild(tooltip);
    tooltip.classList.add("is-open");
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
  };
  const closeSoon = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (document.activeElement !== focusTarget) close();
    }, 100);
  };
  const focusout: EventListener = (event) => {
    const focusEvent = event as FocusEvent;
    if (
      !(focusEvent.relatedTarget instanceof Node && focusTarget.contains(focusEvent.relatedTarget)) &&
      !focusTarget.matches(":hover") &&
      !tooltip.matches(":hover")
    )
      close();
  };
  const click = () => close();

  trigger.addEventListener("pointerenter", open);
  trigger.addEventListener("pointerleave", closeSoon);
  focusTarget.addEventListener("focusin", open);
  focusTarget.addEventListener("focusout", focusout);
  tooltip.addEventListener("pointerenter", () => {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
  });
  tooltip.addEventListener("pointerleave", closeSoon);
  if (closeOnClick) focusTarget.addEventListener("click", click);

  return () => {
    trigger.removeEventListener("pointerenter", open);
    trigger.removeEventListener("pointerleave", closeSoon);
    focusTarget.removeEventListener("focusin", open);
    focusTarget.removeEventListener("focusout", focusout);
    if (closeOnClick) focusTarget.removeEventListener("click", click);
    close();
  };
}

export interface BoundTooltip {
  update(content: string): void;
  destroy(): void;
}

export function bindTooltip(
  trigger: TooltipTrigger,
  content: string,
  focusTarget: TooltipTrigger = trigger,
): BoundTooltip {
  const tooltip = createTooltipElement(content);
  const originalDescription = focusTarget.getAttribute("aria-describedby");
  focusTarget.setAttribute(
    "aria-describedby",
    [...new Set([...(originalDescription?.split(/\s+/) ?? []), tooltip.id].filter(Boolean))].join(" "),
  );
  const unbind = bindTooltipEvents(trigger, focusTarget, tooltip, () => true, false);

  return {
    update(nextContent) {
      tooltip.textContent = nextContent;
    },
    destroy() {
      unbind();
      const remaining = (focusTarget.getAttribute("aria-describedby") ?? "")
        .split(/\s+/)
        .filter((id) => id && id !== tooltip.id);
      if (remaining.length) focusTarget.setAttribute("aria-describedby", remaining.join(" "));
      else focusTarget.removeAttribute("aria-describedby");
    },
  };
}

export function createTooltip(trigger: TooltipTrigger, content: string | HTMLElement): HTMLElement {
  const wrapper = document.createElement("span");
  const tooltip = createTooltipElement(content);
  wrapper.className = "ant-tooltip-trigger";
  wrapper.tabIndex = 0;
  wrapper.setAttribute("aria-describedby", tooltip.id);
  wrapper.append(trigger, tooltip);
  bindTooltipEvents(
    wrapper,
    wrapper,
    tooltip,
    () => wrapper.dataset.overflowOnly !== "true" || wrapper.classList.contains("is-overflowing"),
  );
  return wrapper;
}
