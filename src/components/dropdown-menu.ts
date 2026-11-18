const dropdownSelector = "[data-ant-dropdown]";
const dropdownTriggerSelector = "[data-ant-dropdown-trigger]";
const menuItemSelector = "[data-ant-dropdown-item]";
const boundDocuments = new WeakSet<Document>();

export function dropdownPopupLayout(
  trigger: Pick<DOMRect, "left" | "right" | "top" | "bottom">,
  popup: Pick<DOMRect, "width" | "height">,
  viewport: { width: number; height: number },
  alignRight: boolean,
): { edge: number; openUp: boolean; maxHeight: number } {
  const edge = alignRight
    ? Math.max(popup.width + 8, Math.min(trigger.right, viewport.width - 8))
    : Math.max(8, Math.min(trigger.left, viewport.width - popup.width - 8));
  const below = viewport.height - trigger.bottom - 12;
  const above = trigger.top - 12;
  const openUp = popup.height > below && above > below;
  return { edge, openUp, maxHeight: Math.max(0, Math.min(viewport.height - 100, openUp ? above : below)) };
}

/** DOM counterpart of Dropdown.astro for controls rendered after page load. */
export function createDropdown(id: string, trigger: HTMLButtonElement, items: readonly HTMLLIElement[]): HTMLDivElement {
  const dropdown = document.createElement("div");
  dropdown.className = "ant-dropdown ant-dropdown-placement-bottomLeft";
  dropdown.dataset.antDropdown = "";
  trigger.classList.add("ant-dropdown-trigger");
  trigger.type = "button";
  trigger.dataset.antDropdownTrigger = "";
  trigger.setAttribute("aria-haspopup", "menu");
  trigger.setAttribute("aria-expanded", "false");
  trigger.setAttribute("aria-controls", id);
  const popup = document.createElement("div");
  popup.className = "ant-dropdown-popup";
  popup.dataset.antDropdownPopup = "";
  popup.hidden = true;
  const menu = document.createElement("ul");
  menu.className = "ant-dropdown-menu";
  menu.id = id;
  menu.setAttribute("role", "menu");
  menu.append(...items);
  popup.append(menu);
  dropdown.append(trigger, popup);
  bindDropdownInteractions();
  return dropdown;
}

function menuItems(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>(menuItemSelector)]
    .filter((item) => item.closest("ul") === menu && !item.matches(':disabled, [aria-disabled="true"]'));
}

function close(dropdown: HTMLElement, restoreFocus = false): void {
  const trigger = dropdown.querySelector<HTMLButtonElement>(dropdownTriggerSelector);
  const popup = dropdown.querySelector<HTMLElement>("[data-ant-dropdown-popup]");
  if (!trigger || !popup) return;
  popup.hidden = true;
  trigger.setAttribute("aria-expanded", "false");
  dropdown.classList.remove("ant-dropdown-open");
  popup.classList.remove("ant-dropdown-popup-above");
  if (restoreFocus) trigger.focus();
}

function open(dropdown: HTMLElement): void {
  const trigger = dropdown.querySelector<HTMLButtonElement>(dropdownTriggerSelector);
  const popup = dropdown.querySelector<HTMLElement>("[data-ant-dropdown-popup]");
  if (!trigger || !popup) return;
  document.querySelectorAll<HTMLElement>(dropdownSelector).forEach((other) => {
    if (other !== dropdown && other.classList.contains("ant-dropdown-open")) close(other);
  });
  popup.hidden = false;
  trigger.setAttribute("aria-expanded", "true");
  dropdown.classList.add("ant-dropdown-open");
  positionPopup(dropdown);
}

function positionPopup(dropdown: HTMLElement): void {
  const trigger = dropdown.querySelector<HTMLButtonElement>(dropdownTriggerSelector);
  const popup = dropdown.querySelector<HTMLElement>("[data-ant-dropdown-popup]");
  const menu = popup?.querySelector<HTMLElement>(".ant-dropdown-menu");
  if (!trigger || !popup || !menu) return;
  menu.style.maxHeight = "";
  const triggerRect = trigger.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  const dropdownRect = dropdown.getBoundingClientRect();
  const alignRight = dropdown.classList.contains("ant-dropdown-placement-bottomRight");
  const { edge, openUp, maxHeight } = dropdownPopupLayout(triggerRect, popupRect, {
    width: window.innerWidth,
    height: window.innerHeight,
  }, alignRight);
  if (alignRight) {
    popup.style.left = "auto";
    popup.style.right = `${dropdownRect.right - edge}px`;
  } else {
    popup.style.left = `${edge - dropdownRect.left}px`;
    popup.style.right = "auto";
  }
  menu.style.maxHeight = `${maxHeight}px`;
  popup.classList.toggle("ant-dropdown-popup-above", openUp);
  popup.style.top = openUp ? "auto" : "calc(100% + 4px)";
  popup.style.bottom = openUp ? "calc(100% + 4px)" : "auto";
}

function closeOutside(target: EventTarget | null): void {
  document.querySelectorAll<HTMLElement>(dropdownSelector).forEach((dropdown) => {
    if (dropdown.classList.contains("ant-dropdown-open") && (!target || !dropdown.contains(target as Node))) close(dropdown);
  });
}

/** Bind the Antdv Next-style click, touch, and keyboard behavior once per document. */
export function bindDropdownInteractions(): void {
  document.querySelectorAll<HTMLElement>(dropdownSelector).forEach((dropdown) => {
    const trigger = dropdown.querySelector<HTMLButtonElement>(":scope > button");
    const menu = dropdown.querySelector<HTMLElement>(".ant-dropdown-menu");
    if (!trigger || !menu) return;
    trigger.classList.add("ant-dropdown-trigger");
    trigger.dataset.antDropdownTrigger = "";
    trigger.setAttribute("aria-haspopup", "menu");
    trigger.setAttribute("aria-controls", menu.id);
    if (!trigger.hasAttribute("aria-expanded")) trigger.setAttribute("aria-expanded", "false");
  });
  if (boundDocuments.has(document)) return;
  boundDocuments.add(document);

  document.addEventListener("click", (event) => {
    const target = event.target as Element | null;
    if (!target?.closest) return;
    const trigger = target.closest<HTMLButtonElement>(dropdownTriggerSelector);
    if (trigger) {
      const dropdown = trigger.closest<HTMLElement>(dropdownSelector);
      if (!dropdown) return;
      if (dropdown.classList.contains("ant-dropdown-open")) close(dropdown);
      else open(dropdown);
      return;
    }
    const item = target.closest<HTMLElement>(menuItemSelector);
    if (item) {
      if (item.matches(':disabled, [aria-disabled="true"]')) {
        event.preventDefault();
        return;
      }
      const dropdown = item.closest<HTMLElement>(dropdownSelector);
      if (dropdown) close(dropdown, true);
      return;
    }
    closeOutside(target);
  });

  document.addEventListener("pointerdown", (event) => closeOutside(event.target));
  document.addEventListener("focusin", (event) => closeOutside(event.target));
  const repositionOpenDropdowns = () => {
    document.querySelectorAll<HTMLElement>(`${dropdownSelector}.ant-dropdown-open`).forEach(positionPopup);
  };
  window.addEventListener("resize", repositionOpenDropdowns);
  document.addEventListener("scroll", (event) => {
    if (!(event.target instanceof Element) || !event.target.closest("[data-ant-dropdown-popup]")) repositionOpenDropdowns();
  }, true);
  document.addEventListener("keydown", (event) => {
    const target = event.target as Element | null;
    if (!target?.closest) return;
    const trigger = target.closest<HTMLButtonElement>(dropdownTriggerSelector);
    if (trigger && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      const dropdown = trigger.closest<HTMLElement>(dropdownSelector);
      if (!dropdown) return;
      event.preventDefault();
      if (!dropdown.classList.contains("ant-dropdown-open")) open(dropdown);
      const popup = dropdown.querySelector<HTMLElement>("[data-ant-dropdown-popup]");
      const menu = popup?.querySelector<HTMLElement>(".ant-dropdown-menu");
      const items = menu ? menuItems(menu) : [];
      (event.key === "ArrowUp" ? items.at(-1) : items[0])?.focus();
      return;
    }
    const dropdown = target.closest<HTMLElement>(dropdownSelector);
    if (!dropdown?.classList.contains("ant-dropdown-open")) return;

    if (event.key === "Escape") {
      event.preventDefault();
      close(dropdown, true);
      return;
    }

    const currentMenu = target.closest<HTMLElement>("ul");
    if (!currentMenu?.classList.contains("ant-dropdown-menu") || !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
    const items = menuItems(currentMenu);
    const activeIndex = items.indexOf(
      target.closest<HTMLElement>(menuItemSelector) as HTMLElement,
    );
    if (activeIndex < 0 || !items.length) return;
    event.preventDefault();
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? items.length - 1
        : (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
    items[nextIndex]?.focus();
  });
}
