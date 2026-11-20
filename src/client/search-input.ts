export function bindDebouncedSearch(
  input: HTMLInputElement,
  search: () => void,
): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => clearTimeout(timer);
  const apply = () => {
    cancel();
    if (!input.disabled) search();
  };
  const schedule = () => {
    cancel();
    timer = setTimeout(apply, 200);
  };
  input.addEventListener("input", (event) => {
    if (!(event as InputEvent | undefined)?.isComposing) schedule();
  });
  input.addEventListener("compositionstart", cancel);
  input.addEventListener("compositionend", schedule);
  input.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    apply();
  });
  return cancel;
}
