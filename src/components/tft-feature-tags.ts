import type { TftCosmeticFeatureTag } from "../domain/tft-cosmetics";
import { createIcon } from "./icons/create-icon";
import { createPopover } from "./popover";

export type TftFeatureIndex = ReadonlyMap<string, readonly TftCosmeticFeatureTag[]>;

function appendTagContent(tag: HTMLElement, feature: TftCosmeticFeatureTag): void {
  const icon = tag.ownerDocument.createElement("img");
  icon.alt = "";
  icon.src = feature.iconUrl;
  icon.addEventListener("error", () => icon.remove(), { once: true });
  const name = tag.ownerDocument.createElement("span");
  name.textContent = feature.name;
  tag.append(icon, name);
}

export function appendTftFeatureDetail(list: HTMLElement, label: string, features: readonly TftCosmeticFeatureTag[]): void {
  if (!features.length) return;
  const doc = list.ownerDocument;
  const row = doc.createElement("div");
  row.className = "tft-cosmetic-card-detail";
  const term = doc.createElement("dt");
  term.textContent = label;
  const value = doc.createElement("dd");
  value.className = "tft-feature-tags";
  for (const feature of features) {
    const tag = doc.createElement("span");
    tag.className = "ant-tag ant-tag-default";
    appendTagContent(tag, feature);
    value.append(tag);
  }
  row.append(term, value);
  list.append(row);
}

export function bindTftCardDetails(media: HTMLElement, title: string, details: HTMLElement): () => void {
  const doc = media.ownerDocument;
  const actions = doc.createElement("div");
  actions.className = "tft-cosmetic-card-actions";
  const button = doc.createElement("button");
  button.type = "button";
  button.className = "ant-btn ant-btn-sm ant-btn-icon-only tft-cosmetic-info-button";
  button.setAttribute("aria-label", title);
  const icon = createIcon("InfoCircleOutlined");
  icon.setAttribute("width", "14");
  icon.setAttribute("height", "14");
  button.append(icon);
  actions.append(button);
  media.append(actions);
  return createPopover(button, title, details);
}

export function createTftFeatureFilter(root: HTMLElement, onChange: (selected: string[]) => void) {
  const field = root.querySelector<HTMLFieldSetElement>("[data-tft-feature-filter]");
  const options = field?.querySelector("[data-tft-feature-options]");
  const inputs = () => Array.from(options?.querySelectorAll<HTMLInputElement>("input") ?? []);
  const selected = () => inputs().filter((input) => input.checked).map((input) => input.value);
  options?.addEventListener("change", () => onChange(selected()));

  return {
    selected,
    sync(types: readonly string[] = []) {
      for (const input of inputs()) input.checked = types.includes(input.value);
    },
    disable(disabled: boolean) {
      if (field) field.disabled = disabled;
    },
    render(groups: Iterable<readonly TftCosmeticFeatureTag[]>, locale: string) {
      const tags = new Map<string, TftCosmeticFeatureTag>();
      for (const group of groups)
        for (const tag of group) tags.set(tag.featureType, tag);
      if (field && options) {
        field.hidden = !tags.size;
        options.replaceChildren();
        const sorted = [...tags.values()].sort((left, right) => left.name.localeCompare(right.name, locale));
        for (const tag of sorted) {
          const label = root.ownerDocument.createElement("label");
          label.className = "ant-tag ant-tag-checkable";
          const input = root.ownerDocument.createElement("input");
          input.className = "sr-only";
          input.type = "checkbox";
          input.value = tag.featureType;
          label.append(input);
          appendTagContent(label, tag);
          options.append(label);
        }
      }
      return tags;
    },
  };
}
