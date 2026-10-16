export interface DividerOptions {
  readonly type?: "horizontal" | "vertical";
  readonly className?: string;
}

/** Local DOM adaptation of the shared Antdv Next Divider component. */
export function createDivider(options: DividerOptions = {}): HTMLDivElement {
  const type = options.type ?? "horizontal";
  const divider = document.createElement("div");
  divider.className = `ant-divider ant-divider-${type}`;
  if (options.className) divider.classList.add(options.className);
  divider.setAttribute("role", "separator");
  if (type === "vertical") divider.setAttribute("aria-orientation", "vertical");
  return divider;
}
