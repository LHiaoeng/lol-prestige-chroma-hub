export type ButtonSize = "small" | "medium" | "large";

export interface ButtonOptions {
  readonly size?: ButtonSize;
  readonly icon?: SVGElement;
  readonly ariaLabel?: string;
  readonly title?: string;
  readonly block?: boolean;
  readonly className?: string;
}

/** Local DOM adaptation of Antdv Next Button sizing and icon-only behavior. */
export function createButton(options: ButtonOptions = {}): HTMLButtonElement {
  const button = document.createElement("button");
  const size = options.size ?? "medium";
  button.type = "button";
  button.className = "ant-btn ant-btn-default";
  if (size === "small") button.classList.add("ant-btn-sm");
  if (size === "large") button.classList.add("ant-btn-lg");
  if (options.icon) button.classList.add("ant-btn-icon-only");
  if (options.block) button.classList.add("ant-btn-block");
  if (options.className) button.classList.add(options.className);
  if (options.ariaLabel) button.setAttribute("aria-label", options.ariaLabel);
  if (options.title) button.title = options.title;
  if (options.icon) button.appendChild(options.icon);
  return button;
}
