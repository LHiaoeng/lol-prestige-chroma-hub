let tooltipId = 0;

export function createTooltip(trigger: HTMLElement, content: string | HTMLElement): HTMLElement {
  const wrapper = document.createElement("span");
  const tooltip = document.createElement("span");
  wrapper.className = "ant-tooltip-trigger";
  wrapper.tabIndex = 0;
  tooltip.id = `ant-tooltip-${++tooltipId}`;
  tooltip.className = "ant-tooltip";
  tooltip.setAttribute("role", "tooltip");
  if (typeof content === "string") tooltip.textContent = content;
  else tooltip.appendChild(content);
  wrapper.setAttribute("aria-describedby", tooltip.id);
  wrapper.append(trigger, tooltip);
  let closeTimer: number | undefined;

  const positionTooltip = () => {
    const triggerRect = wrapper.getBoundingClientRect();
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
    if (!wrapper.isConnected || tooltip.classList.contains("is-open")) return;
    document.body.appendChild(tooltip);
    tooltip.classList.add("is-open");
    positionTooltip();
    window.addEventListener("resize", positionTooltip);
    window.addEventListener("scroll", positionTooltip, true);
  };
  const closeSoon = () => {
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (document.activeElement !== wrapper) close();
    }, 100);
  };

  wrapper.addEventListener("pointerenter", open);
  wrapper.addEventListener("pointerleave", closeSoon);
  tooltip.addEventListener("pointerenter", () => {
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
  });
  tooltip.addEventListener("pointerleave", closeSoon);
  wrapper.addEventListener("focusin", open);
  wrapper.addEventListener("focusout", (event) => {
    if (
      !(event.relatedTarget instanceof Node && wrapper.contains(event.relatedTarget)) &&
      !wrapper.matches(":hover") &&
      !tooltip.matches(":hover")
    )
      close();
  });
  wrapper.addEventListener("click", close);
  return wrapper;
}
