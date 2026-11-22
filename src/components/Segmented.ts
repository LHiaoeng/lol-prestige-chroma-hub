interface SegmentedOptions {
  readonly name: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly controls?: string;
  readonly options: readonly { readonly value: string; readonly label: string }[];
  readonly onChange: (value: string) => void;
}

export function createSegmented(config: SegmentedOptions) {
  const group = document.createElement("fieldset");
  group.className = "ant-segmented";
  group.setAttribute("role", "radiogroup");
  group.setAttribute("aria-label", config.ariaLabel);
  const track = document.createElement("div");
  track.className = "ant-segmented-group";
  group.append(track);
  let selected: HTMLLabelElement | undefined;
  let thumb: HTMLSpanElement | undefined;

  for (const option of config.options) {
    const item = document.createElement("label");
    item.className = "ant-segmented-item";
    const input = document.createElement("input");
    input.type = "radio";
    input.className = "ant-segmented-item-input";
    input.name = config.name;
    input.value = option.value;
    input.checked = option.value === config.value;
    if (input.checked) selected = item;
    if (config.controls) input.setAttribute("aria-controls", config.controls);
    input.addEventListener("change", () => {
      if (!input.checked) return;
      thumb?.remove();
      if (selected?.offsetWidth && item.offsetWidth) {
        const motionThumb = document.createElement("span");
        motionThumb.className = "ant-segmented-thumb";
        motionThumb.setAttribute("aria-hidden", "true");
        motionThumb.style.setProperty("--thumb-from-x", `${selected.offsetLeft}px`);
        motionThumb.style.setProperty("--thumb-from-width", `${selected.offsetWidth}px`);
        motionThumb.style.setProperty("--thumb-to-x", `${item.offsetLeft}px`);
        motionThumb.style.setProperty("--thumb-to-width", `${item.offsetWidth}px`);
        const removeThumb = () => motionThumb.remove();
        motionThumb.addEventListener("animationend", removeThumb, { once: true });
        motionThumb.addEventListener("animationcancel", removeThumb, { once: true });
        track.prepend(motionThumb);
        thumb = motionThumb;
      }
      selected = item;
      config.onChange(input.value);
    });
    const label = document.createElement("span");
    label.className = "ant-segmented-item-label";
    label.textContent = option.label;
    item.append(input, label);
    track.append(item);
  }
  return group;
}
