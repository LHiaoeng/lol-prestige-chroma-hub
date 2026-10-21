let popoverId = 0;
let closeOpenPopover: (() => void) | undefined;

const animationDuration = 200;
const viewportPadding = 8;
const popupGap = 8;

export function createPopover(trigger: HTMLButtonElement, title: string, content: string | HTMLElement): () => void {
  const popover = document.createElement("div");
  const container = document.createElement("div");
  const titleElement = document.createElement("div");
  const contentElement = document.createElement("div");
  const arrow = document.createElement("span");
  const id = `ant-popover-${++popoverId}`;
  let isOpen = false;
  let closeTimer: number | undefined;
  let hoverTimer: number | undefined;
  let isPinned = false;

  popover.id = id;
  popover.className = "ant-popover ant-popover-placement-top";
  popover.setAttribute("role", typeof content === "string" ? "tooltip" : "dialog");
  if (typeof content !== "string") trigger.setAttribute("aria-haspopup", "dialog");
  popover.setAttribute("aria-hidden", "true");
  popover.style.visibility = "hidden";
  arrow.className = "ant-popover-arrow";
  arrow.setAttribute("aria-hidden", "true");
  container.className = "ant-popover-container";
  titleElement.className = "ant-popover-title";
  titleElement.textContent = title;
  titleElement.id = `${id}-title`;
  contentElement.className = "ant-popover-content";
  if (typeof content === "string") contentElement.textContent = content;
  else contentElement.append(content);
  popover.setAttribute("aria-labelledby", titleElement.id);
  container.append(titleElement, contentElement);
  popover.append(arrow, container);
  trigger.setAttribute("aria-expanded", "false");

  const position = () => {
    if (!trigger.isConnected) {
      close();
      return;
    }
    const triggerRect = trigger.getBoundingClientRect();
    const popupRect = popover.getBoundingClientRect();
    const above = triggerRect.top - viewportPadding;
    const below = window.innerHeight - triggerRect.bottom - viewportPadding;
    const placement = above >= popupRect.height + popupGap || above >= below ? "top" : "bottom";
    const left = Math.max(
      viewportPadding,
      Math.min(
        triggerRect.left + triggerRect.width / 2 - popupRect.width / 2,
        window.innerWidth - popupRect.width - viewportPadding,
      ),
    );
    const maxTop = Math.max(viewportPadding, window.innerHeight - popupRect.height - viewportPadding);
    const top = Math.max(
      viewportPadding,
      Math.min(placement === "top"
        ? triggerRect.top - popupRect.height - popupGap
        : triggerRect.bottom + popupGap, maxTop),
    );
    const arrowX = Math.max(8, Math.min(triggerRect.left + triggerRect.width / 2 - left, popupRect.width - 8));

    popover.classList.toggle("ant-popover-placement-top", placement === "top");
    popover.classList.toggle("ant-popover-placement-bottom", placement === "bottom");
    popover.dataset.placement = placement;
    popover.style.left = `${window.scrollX + left}px`;
    popover.style.top = `${window.scrollY + top}px`;
    popover.style.setProperty("--popover-arrow-x", `${arrowX}px`);
    popover.style.setProperty("--popover-arrow-y", placement === "top" ? "100%" : "0%");
  };

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target;
    if (target instanceof Node && !trigger.contains(target) && !popover.contains(target)) close();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab" && !event.shiftKey && document.activeElement === trigger) {
      const link = popover.querySelector<HTMLElement>("a[href]");
      if (link) {
        event.preventDefault();
        link.focus();
      }
    }
    if (event.key === "Escape") {
      event.preventDefault();
      close(true);
    }
  };

  const scheduleClose = () => {
    window.clearTimeout(hoverTimer);
    hoverTimer = window.setTimeout(() => {
      hoverTimer = undefined;
      if (
        !isPinned &&
        !trigger.matches(":hover, :focus") &&
        !popover.matches(":hover") &&
        !popover.contains(document.activeElement)
      ) close();
    }, 100);
  };

  const onPointerEnter = () => {
    window.clearTimeout(hoverTimer);
    hoverTimer = undefined;
    open();
  };
  const onPointerLeave = () => scheduleClose();
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node && (trigger.contains(next) || popover.contains(next)))) scheduleClose();
  };

  const close = (restoreFocus = false) => {
    if (!isOpen) return;
    isOpen = false;
    isPinned = false;
    window.clearTimeout(hoverTimer);
    hoverTimer = undefined;
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("aria-controls");
    trigger.setAttribute("aria-describedby", trigger.dataset.popoverDescription ?? "");
    if (!trigger.dataset.popoverDescription) trigger.removeAttribute("aria-describedby");
    popover.setAttribute("aria-hidden", "true");
    popover.classList.remove("is-open");
    popover.classList.add("is-closing");
    document.removeEventListener("pointerdown", onPointerDown, true);
    document.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("resize", position);
    window.removeEventListener("scroll", position, true);
    if (closeOpenPopover === close) closeOpenPopover = undefined;
    window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      popover.remove();
      popover.classList.remove("is-closing");
    }, animationDuration);
    if (restoreFocus && trigger.isConnected) trigger.focus();
  };

  const open = () => {
    if (isOpen) return;
    closeOpenPopover?.();
    window.clearTimeout(closeTimer);
    closeTimer = undefined;
    popover.classList.remove("is-closing");
    if (!popover.isConnected) document.body.append(popover);
    isOpen = true;
    trigger.setAttribute("aria-expanded", "true");
    trigger.setAttribute("aria-controls", id);
    const description = trigger.getAttribute("aria-describedby");
    trigger.dataset.popoverDescription = description ?? "";
    trigger.setAttribute("aria-describedby", [description, id].filter(Boolean).join(" "));
    popover.setAttribute("aria-hidden", "false");
    position();
    popover.style.visibility = "";
    popover.classList.add("is-open");
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    closeOpenPopover = close;
  };

  const onTriggerClick = () => {
    if (isPinned) close();
    else {
      isPinned = true;
      open();
    }
  };
  trigger.addEventListener("click", onTriggerClick);
  trigger.addEventListener("pointerenter", onPointerEnter);
  trigger.addEventListener("pointerleave", onPointerLeave);
  trigger.addEventListener("focusin", onPointerEnter);
  trigger.addEventListener("focusout", onFocusOut);
  popover.addEventListener("pointerenter", onPointerEnter);
  popover.addEventListener("pointerleave", onPointerLeave);

  return () => {
    trigger.removeEventListener("click", onTriggerClick);
    trigger.removeEventListener("pointerenter", onPointerEnter);
    trigger.removeEventListener("pointerleave", onPointerLeave);
    trigger.removeEventListener("focusin", onPointerEnter);
    trigger.removeEventListener("focusout", onFocusOut);
    popover.removeEventListener("pointerenter", onPointerEnter);
    popover.removeEventListener("pointerleave", onPointerLeave);
    close();
    window.clearTimeout(closeTimer);
    window.clearTimeout(hoverTimer);
    popover.remove();
    if (closeOpenPopover === close) closeOpenPopover = undefined;
    trigger.removeAttribute("aria-controls");
    trigger.setAttribute("aria-expanded", "false");
    trigger.removeAttribute("data-popover-description");
    if (typeof content !== "string") trigger.removeAttribute("aria-haspopup");
  };
}
