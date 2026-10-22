const sourceSelector = "select.ant-select-source";
const controllers = new WeakMap<HTMLSelectElement, SelectController>();
const openSelects = new WeakMap<Document, SelectController>();
const boundDocuments = new WeakSet<Document>();
let selectId = 0;

interface SelectController {
  readonly source: HTMLSelectElement;
  readonly root: HTMLDivElement;
  readonly trigger: HTMLDivElement;
  readonly input: HTMLInputElement;
  readonly popup: HTMLDivElement;
  readonly list: HTMLDivElement;
  readonly label: HTMLSpanElement;
  readonly search?: HTMLInputElement;
  activeIndex: number;
  close: () => void;
  open: () => void;
  refresh: () => void;
  moveActive: (index: number) => void;
  choose: (index: number) => void;
}

export function nextEnabledIndex(
  options: readonly { disabled: boolean; hidden?: boolean }[],
  currentIndex: number,
  direction: -1 | 1,
): number {
  if (!options.length) return -1;
  for (let step = 1; step <= options.length; step += 1) {
    const index = (currentIndex + direction * step + options.length) % options.length;
    if (!options[index]?.disabled && !options[index]?.hidden) return index;
  }
  return -1;
}

export function matchesSelectSearch(
  query: string,
  option: { label: string; value: string },
  filterProp: "label" | "value" = "label",
): boolean {
  return option[filterProp].toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

function optionLabel(option: HTMLOptionElement): string {
  return option.label || option.textContent?.trim() || option.value;
}

function optionDisabled(option: HTMLOptionElement): boolean {
  return option.disabled || (option.parentElement?.tagName === "OPTGROUP" && (option.parentElement as HTMLOptGroupElement).disabled);
}

function makeIcon(document: Document, pathData: string, filled = false): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", filled ? "0 0 1024 1024" : "0 0 16 16");
  svg.setAttribute("width", "12");
  svg.setAttribute("height", "12");
  svg.setAttribute("aria-hidden", "true");
  if (filled) svg.classList.add("ant-select-icon-filled");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", pathData);
  svg.appendChild(path);
  return svg;
}

function selectLabel(source: HTMLSelectElement): string {
  const ariaLabel = source.getAttribute("aria-label");
  if (ariaLabel) return ariaLabel;
  const labels = Array.from(source.labels ?? []);
  return labels.map((label) =>
    label.querySelector<HTMLElement>(":scope > span")?.textContent?.trim()
      ?? label.textContent?.trim()
      ?? "",
  ).filter(Boolean).join(" ");
}

function bindDocument(document: Document): void {
  if (boundDocuments.has(document)) return;
  boundDocuments.add(document);
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (!(target instanceof Node)) return;
    const open = openSelects.get(document);
    if (open && !open.root.contains(target) && !open.popup.contains(target)) open.close();
  });
}

export function enhanceSelect(source: HTMLSelectElement): void {
  const document = source.ownerDocument;
  const view = document.defaultView;
  if (controllers.has(source) || !view) return;
  bindDocument(document);
  selectId += 1;

  const root = document.createElement("div");
  root.className = "ant-select ant-select-single ant-select-outlined ant-select-show-arrow";
  source.classList.forEach((name) => {
    if (name !== "ant-select-source") root.classList.add(name);
  });
  root.classList.toggle("ant-select-disabled", source.disabled);
  root.classList.toggle("ant-select-allow-clear", source.hasAttribute("data-select-allow-clear"));
  root.classList.toggle("ant-select-show-search", source.hasAttribute("data-select-show-search"));
  root.classList.toggle("ant-select-sm", source.dataset.selectSize === "small");
  root.classList.toggle("ant-select-lg", source.dataset.selectSize === "large");
  root.dataset.selectRoot = "";

  const trigger = document.createElement("div");
  trigger.className = "ant-select-content";
  let prefix: HTMLSpanElement | undefined;
  if (source.dataset.selectPrefix) {
    prefix = document.createElement("span");
    prefix.className = "ant-select-prefix";
    prefix.textContent = source.dataset.selectPrefix;
  }
  const label = document.createElement("span");
  label.className = "ant-select-content-value";
  const placeholderNode = document.createElement("div");
  placeholderNode.className = "ant-select-placeholder";
  const placeholder = source.dataset.selectPlaceholder;
  placeholderNode.textContent = placeholder ?? "";
  const input = document.createElement("input");
  input.className = "ant-select-input";
  input.type = "text";
  input.autocomplete = "new-password";
  input.readOnly = !source.hasAttribute("data-select-show-search");
  input.tabIndex = source.disabled ? -1 : 0;
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-haspopup", "listbox");
  input.setAttribute("aria-expanded", "false");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", `ant-select-list-${selectId}`);
  input.setAttribute("aria-label", selectLabel(source));
  trigger.append(placeholderNode, label, input);
  const search = source.hasAttribute("data-select-show-search") ? input : undefined;
  const filterOption = source.dataset.selectFilterOption !== "false";
  const optionFilterProp = source.dataset.selectOptionFilterProp === "value" ? "value" : "label";

  let clearButton: HTMLButtonElement | undefined;
  if (source.hasAttribute("data-select-allow-clear")) {
    const clear = document.createElement("button");
    clear.className = "ant-select-clear";
    clear.type = "button";
    clear.setAttribute("aria-label", source.dataset.selectClearLabel ?? (document.documentElement.lang.startsWith("zh") ? "清除" : "Clear"));
    clear.appendChild(makeIcon(document, "M4 4l8 8M12 4l-8 8"));
    clear.addEventListener("click", (event) => {
      event.stopPropagation();
      if (source.disabled) return;
      source.selectedIndex = -1;
      source.dispatchEvent(new Event("change", { bubbles: true }));
      input.focus();
    });
    clearButton = clear;
  }

  const arrow = document.createElement("span");
  arrow.className = "ant-select-suffix";
  arrow.appendChild(makeIcon(document, "M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352 486.1c12.8 17.7 39.2 17.7 52 0l352-486.1c3.8-5.3 0-12.7-6.5-12.7z", true));

  const popup = document.createElement("div");
  popup.className = "ant-select-dropdown";
  const matchPopupWidth = source.dataset.selectPopupMatchWidth !== "false";
  popup.classList.toggle("ant-select-dropdown-content-width", !matchPopupWidth);
  popup.hidden = true;
  const list = document.createElement("div");
  list.className = "ant-select-dropdown-list";
  list.id = `ant-select-list-${selectId}`;
  list.setAttribute("role", "listbox");
  popup.appendChild(list);
  const empty = document.createElement("div");
  empty.className = "ant-select-item ant-select-item-empty";
  empty.setAttribute("role", "status");
  empty.textContent = source.dataset.selectNotFound
    ?? (document.documentElement.lang.startsWith("zh") ? "无匹配项" : "Not Found");
  empty.hidden = true;
  list.appendChild(empty);
  root.append(...(prefix ? [prefix] : []), trigger, arrow);
  if (clearButton) root.appendChild(clearButton);
  source.hidden = true;
  source.insertAdjacentElement("afterend", root);
  document.body.appendChild(popup);

  const controller: SelectController = {
    source,
    root,
    trigger,
    input,
    popup,
    list,
    label,
    search,
    activeIndex: -1,
    close: () => undefined,
    open: () => undefined,
    refresh: () => undefined,
    moveActive: () => undefined,
    choose: () => undefined,
  };
  controllers.set(source, controller);

  const allOptions = (): HTMLOptionElement[] => Array.from(source.options);
  const nextOptionIndex = (index: number, direction: -1 | 1): number =>
    nextEnabledIndex(allOptions().map((option, optionIndex) => ({
      disabled: optionDisabled(option),
      hidden: Boolean(list.querySelector<HTMLElement>(`[data-select-index="${optionIndex}"]`)?.hidden),
    })), index, direction);
  const enabledIndices = (): number[] => allOptions()
    .map((option, index) => optionDisabled(option) ? -1 : index)
    .filter((index) => index >= 0 && !list.querySelector<HTMLElement>(`[data-select-index="${index}"]`)?.hidden);

  const reposition = (): void => {
    if (popup.hidden || !root.isConnected) return;
    const rect = root.getBoundingClientRect();
    const view = document.defaultView;
    if (!view) return;
    const maxHeight = Math.min(264, view.innerHeight - 16);
    popup.style.position = "fixed";
    popup.style.width = matchPopupWidth ? `${rect.width}px` : "max-content";
    popup.style.minWidth = `${rect.width}px`;
    popup.style.maxWidth = `${Math.max(0, view.innerWidth - 16)}px`;
    popup.style.maxHeight = `${maxHeight}px`;
    const below = view.innerHeight - rect.bottom - 8;
    const above = rect.top - 8;
    const openAbove = below < Math.min(120, popup.scrollHeight) && above > below;
    const popupWidth = matchPopupWidth ? rect.width : popup.getBoundingClientRect().width;
    popup.style.left = `${Math.max(8, Math.min(rect.left, view.innerWidth - popupWidth - 8))}px`;
    popup.style.top = openAbove ? "auto" : `${rect.bottom + 4}px`;
    popup.style.bottom = openAbove ? `${view.innerHeight - rect.top + 4}px` : "auto";
    popup.classList.toggle("ant-select-dropdown-placement-topLeft", openAbove);
    popup.classList.toggle("ant-select-dropdown-placement-bottomLeft", !openAbove);
  };

  controller.moveActive = (index) => {
    controller.activeIndex = index;
    input.removeAttribute("aria-activedescendant");
    list.querySelectorAll<HTMLElement>("[role=option]").forEach((option) => {
      const active = Number(option.dataset.selectIndex) === index;
      option.classList.toggle("ant-select-item-option-active", active);
      if (active) {
        input.setAttribute("aria-activedescendant", option.id);
        option.scrollIntoView({ block: "nearest" });
      }
    });
  };

  controller.refresh = () => {
    const selected = source.selectedOptions[0];
    const hasValue = !!selected && selected.value !== "";
    const hasLabel = !!selected && (hasValue || !placeholder);
    label.replaceChildren();
    if (hasLabel) label.textContent = optionLabel(selected);
    placeholderNode.hidden = hasLabel;
    trigger.classList.toggle("ant-select-content-has-value", hasLabel);
    root.classList.toggle("ant-select-has-value", hasValue);
    root.classList.toggle("ant-select-disabled", source.disabled);
    input.tabIndex = source.disabled ? -1 : 0;
    input.disabled = source.disabled;
    if (source.disabled) controller.close();
    if (clearButton) clearButton.tabIndex = selected && selected.value !== "" && !source.disabled ? 0 : -1;
    if (source.disabled) input.setAttribute("aria-disabled", "true");
    else input.removeAttribute("aria-disabled");
    input.setAttribute("aria-label", selectLabel(source));

    const optionIndex = new Map(allOptions().map((option, index) => [option, index]));
    list.replaceChildren();
    const appendOption = (option: HTMLOptionElement, parent: HTMLElement, grouped = false) => {
      const index = optionIndex.get(option) ?? -1;
      const item = document.createElement("div");
      item.className = "ant-select-item ant-select-item-option";
      item.id = `ant-select-option-${selectId}-${index}`;
      item.dataset.selectIndex = String(index);
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.selected));
      if (grouped) item.classList.add("ant-select-item-option-grouped");
      if (optionDisabled(option)) {
        item.classList.add("ant-select-item-option-disabled");
        item.setAttribute("aria-disabled", "true");
      }
      if (option.selected) item.classList.add("ant-select-item-option-selected");
      const content = document.createElement("span");
      content.className = "ant-select-item-option-content";
      content.textContent = optionLabel(option);
      const state = document.createElement("span");
      state.className = "ant-select-item-option-state";
      state.appendChild(makeIcon(document, "m3 8 3 3 7-7"));
      item.append(content, state);
      parent.appendChild(item);
    };
    Array.from(source.children).forEach((child) => {
      if (child.tagName === "OPTGROUP") {
        const group = child as HTMLOptGroupElement;
        const heading = document.createElement("div");
        heading.className = "ant-select-item ant-select-item-group";
        heading.dataset.selectGroup = "";
        heading.setAttribute("role", "presentation");
        heading.textContent = group.label;
        list.appendChild(heading);
        Array.from(group.children).forEach((option) => appendOption(option as HTMLOptionElement, list, true));
      } else if (child.tagName === "OPTION") appendOption(child as HTMLOptionElement, list);
    });
    list.appendChild(empty);
    controller.moveActive(source.selectedIndex);
  };

  controller.choose = (index) => {
    const option = source.options[index];
    if (!option || optionDisabled(option) || source.disabled) return;
    source.selectedIndex = index;
    source.dispatchEvent(new Event("change", { bubbles: true }));
    controller.close();
    input.focus();
  };

  controller.close = () => {
    popup.hidden = true;
    root.classList.remove("ant-select-open");
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    if (openSelects.get(document) === controller) openSelects.delete(document);
    if (search) {
      search.value = "";
      trigger.classList.remove("ant-select-content-has-search-value");
      list.querySelectorAll<HTMLElement>("[role=option]").forEach((option) => { option.hidden = false; });
      list.querySelectorAll<HTMLElement>("[data-select-group]").forEach((group) => { group.hidden = false; });
      empty.hidden = true;
    }
  };

  controller.open = () => {
    if (source.disabled) return;
    openSelects.get(document)?.close();
    openSelects.set(document, controller);
    popup.hidden = false;
    root.classList.add("ant-select-open");
    input.setAttribute("aria-expanded", "true");
    reposition();
    const active = source.selectedIndex >= 0 && !optionDisabled(source.options[source.selectedIndex]!)
      ? source.selectedIndex
      : nextOptionIndex(-1, 1);
    controller.moveActive(active);
    input.focus();
  };

  source.addEventListener("change", controller.refresh);
  root.addEventListener("click", (event) => {
    if (event.target === clearButton) return;
    if (popup.hidden) controller.open();
    else if (!(search && event.target === input)) controller.close();
  });
  root.addEventListener("keydown", (event) => {
    if (event.target === clearButton) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (popup.hidden) {
        controller.open();
        if (event.key === "ArrowUp") {
          const enabled = enabledIndices();
          controller.moveActive(enabled.at(-1) ?? -1);
        }
      }
      else {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        const active = nextOptionIndex(controller.activeIndex, direction);
        controller.moveActive(active);
      }
    } else if (event.key === "Home" || event.key === "End") {
      if (!popup.hidden) {
        event.preventDefault();
        const enabled = enabledIndices();
        controller.moveActive(event.key === "Home" ? enabled[0] ?? -1 : enabled.at(-1) ?? -1);
      }
    } else if (event.key === "Enter" || (event.key === " " && event.target !== search)) {
      event.preventDefault();
      if (popup.hidden) controller.open();
      else controller.choose(controller.activeIndex);
    } else if (event.key === "Escape" && !popup.hidden) {
      event.preventDefault();
      controller.close();
    }
  });
  list.addEventListener("pointermove", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>("[role=option]");
    if (item && !item.hasAttribute("aria-disabled")) controller.moveActive(Number(item.dataset.selectIndex));
  });
  list.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const item = target.closest<HTMLElement>("[role=option]");
    if (item && !item.hasAttribute("aria-disabled")) controller.choose(Number(item.dataset.selectIndex));
  });
  search?.addEventListener("input", () => {
    trigger.classList.toggle("ant-select-content-has-search-value", !!search.value);
    if (search.value && popup.hidden) controller.open();
    source.dispatchEvent(new view.CustomEvent("search", {
      bubbles: true,
      detail: search.value,
    }));
    list.querySelectorAll<HTMLElement>("[role=option]").forEach((item) => {
      const option = source.options[Number(item.dataset.selectIndex)];
      item.hidden = filterOption && (!option || !matchesSelectSearch(
        search.value,
        { label: optionLabel(option), value: option.value },
        optionFilterProp,
      ));
    });
    list.querySelectorAll<HTMLElement>("[data-select-group]").forEach((group) => {
      let next = group.nextElementSibling;
      let hasVisibleOption = false;
      while (next && !next.hasAttribute("data-select-group")) {
        if (next.matches("[role=option]:not([hidden])")) hasVisibleOption = true;
        next = next.nextElementSibling;
      }
      group.hidden = !hasVisibleOption;
    });
    const enabled = enabledIndices();
    empty.hidden = enabled.length > 0;
    controller.moveActive(enabled[0] ?? -1);
  });
  list.addEventListener("pointerdown", (event) => event.preventDefault());
  root.addEventListener("focusin", () => root.classList.add("ant-select-focused"));
  root.addEventListener("focusout", (event) => {
    if (!(event.relatedTarget instanceof Node) || !root.contains(event.relatedTarget)) {
      root.classList.remove("ant-select-focused");
      controller.close();
    }
  });

  document.defaultView?.addEventListener("resize", reposition);
  document.addEventListener("scroll", reposition, true);
  const Observer = document.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(controller.refresh) : undefined;
  observer?.observe(source, { childList: true, subtree: true, attributes: true });
  controller.refresh();
}

export function refreshSelect(source: HTMLSelectElement): void {
  controllers.get(source)?.refresh();
}

export function enhanceSelects(root: ParentNode): void {
  root.querySelectorAll<HTMLSelectElement>(sourceSelector).forEach(enhanceSelect);
}
