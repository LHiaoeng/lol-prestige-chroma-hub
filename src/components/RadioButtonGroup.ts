export interface RadioButtonOption {
  readonly label: string;
  readonly value: string;
  readonly controls?: string;
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
    label.textContent = option.label;

    input.addEventListener("change", () => {
      if (!input.checked) return;
      group.querySelectorAll(".ant-radio-button-wrapper-checked").forEach((selected) => {
        selected.classList.remove("ant-radio-button-wrapper-checked");
      });
      wrapper.classList.add("ant-radio-button-wrapper-checked");
      options.onChange(option.value);
    });
    if (input.checked) wrapper.classList.add("ant-radio-button-wrapper-checked");
    wrapper.append(input, label);
    group.appendChild(wrapper);
  });

  return group;
}
