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
  const thumb = document.createElement("span");
  thumb.className = "ant-segmented-thumb";
  thumb.setAttribute("aria-hidden", "true");
  track.append(thumb);

  const syncThumb = () => {
    const selected = track.querySelector<HTMLElement>(".ant-segmented-item:has(input:checked)");
    if (!selected?.offsetWidth) return;
    thumb.style.width = selected.offsetWidth + "px";
    thumb.style.transform = "translateX(" + selected.offsetLeft + "px)";
    group.classList.add("ant-segmented-ready");
  };
  const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(syncThumb);

  for (const option of config.options) {
    const item = document.createElement("label");
    item.className = "ant-segmented-item";
    const input = document.createElement("input");
    input.type = "radio";
    input.className = "sr-only";
    input.name = config.name;
    input.value = option.value;
    input.checked = option.value === config.value;
    if (config.controls) input.setAttribute("aria-controls", config.controls);
    input.addEventListener("change", () => {
      if (!input.checked) return;
      syncThumb();
      config.onChange(input.value);
    });
    const label = document.createElement("span");
    label.className = "ant-segmented-item-label";
    label.textContent = option.label;
    item.append(input, label);
    track.append(item);
    observer?.observe(item);
  }
  return group;
}
