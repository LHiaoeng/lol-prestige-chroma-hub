import { createTooltip } from "./tooltip";

export interface RadioButtonOption {
  readonly label: string;
  readonly value: string;
  readonly controls?: string;
  readonly tooltip?: () => string;
  readonly onSelect?: () => string | undefined;
  readonly onReselect?: () => string | undefined;
}

export type RadioButtonGroupSize = "small" | "middle" | "large";

export interface RadioButtonGroupOptions {
  readonly options: readonly RadioButtonOption[];
  readonly size?: RadioButtonGroupSize;
  readonly name: string;
  readonly idPrefix: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly onChange: (value: string) => void;
}

/**
 * Local DOM adaptation of Antdv Next's Radio.Group button variant.
 * @see https://github.com/antdv-next/antdv-next/blob/main/packages/antdv-next/src/radio/radioButton.tsx
 */
export function createRadioButtonGroup(
  options: RadioButtonGroupOptions,
): HTMLFieldSetElement {
  const group = document.createElement("fieldset");
  group.className = "ant-radio-group ant-radio-group-solid ant-radio-group-button";
  group.classList.add(`ant-radio-group-${options.size ?? "middle"}`);
  group.setAttribute("aria-label", options.ariaLabel);
  let selectedValue = options.value;

  options.options.forEach((option) => {
    const wrapper = document.createElement("span");
    wrapper.className = "ant-radio-button-wrapper";

    const input = document.createElement("input");
    input.className = "ant-radio-button-input";
    input.type = "radio";
    input.name = options.name;
    input.id = `${options.idPrefix}-${option.value}`;
    input.value = option.value;
    input.checked = option.value === options.value;
    if (option.controls) input.setAttribute("aria-controls", option.controls);

    const label = document.createElement("label");
    label.className = "ant-radio-button-label";
    label.htmlFor = input.id;
    const labelText = document.createElement("span");
    labelText.textContent = option.label;
    label.appendChild(labelText);
    if (option.onReselect) {
      const toggleIcon = document.createElement("span");
      toggleIcon.className = "ant-radio-button-toggle-icon";
      toggleIcon.setAttribute("aria-hidden", "true");
      toggleIcon.innerHTML = '<svg viewBox="0 0 16 16"><path d="M3 5h9l-2-2m2 2-2 2M13 11H4l2 2m-2-2 2-2" /></svg>';
      label.appendChild(toggleIcon);
    }

    const tooltipContent = option.tooltip ? document.createElement("span") : undefined;
    const tooltipTrigger = tooltipContent ? createTooltip(wrapper, tooltipContent) : undefined;
    if (tooltipTrigger) {
      tooltipTrigger.classList.add("ant-radio-button-tooltip");
      tooltipTrigger.tabIndex = -1;
      const tooltipId = tooltipTrigger.getAttribute("aria-describedby");
      if (tooltipId) input.setAttribute("aria-describedby", tooltipId);
    }

    const updateLabel = (nextLabel: string | undefined): void => {
      if (nextLabel !== undefined) labelText.textContent = nextLabel;
      const tooltip = option.tooltip?.();
      if (tooltip) {
        if (tooltipContent) tooltipContent.textContent = tooltip;
        input.setAttribute("aria-label", tooltip);
      } else {
        input.removeAttribute("aria-label");
      }
    };
    updateLabel(option.label);

    input.addEventListener("click", () => {
      if (selectedValue === option.value && option.onReselect) {
        updateLabel(option.onReselect());
      }
    });

    input.addEventListener("change", () => {
      if (!input.checked) return;
      selectedValue = option.value;
      updateLabel(option.onSelect?.() ?? option.label);
      group.querySelectorAll(".ant-radio-button-wrapper-checked").forEach((selected) => {
        selected.classList.remove("ant-radio-button-wrapper-checked");
      });
      wrapper.classList.add("ant-radio-button-wrapper-checked");
      options.onChange(option.value);
    });
    if (input.checked) wrapper.classList.add("ant-radio-button-wrapper-checked");
    wrapper.append(input, label);
    if (tooltipTrigger) group.appendChild(tooltipTrigger);
    else group.appendChild(wrapper);
  });

  return group;
}
