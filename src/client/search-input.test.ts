import { afterEach, expect, it, vi } from "vitest";
import { bindDebouncedSearch } from "./search-input";

afterEach(() => vi.useRealTimers());

it("applies confirmed composition and flushes pending typing on Enter", () => {
  vi.useFakeTimers();
  const input = Object.assign(new EventTarget(), { disabled: false });
  const search = vi.fn();
  bindDebouncedSearch(input as HTMLInputElement, search);

  input.dispatchEvent(new Event("input"));
  input.dispatchEvent(new Event("compositionstart"));
  input.dispatchEvent(Object.assign(new Event("input"), { isComposing: true }));
  input.dispatchEvent(Object.assign(new Event("keydown"), { key: "Enter", isComposing: true }));
  vi.advanceTimersByTime(200);
  expect(search).not.toHaveBeenCalled();

  input.dispatchEvent(new Event("compositionend"));
  vi.advanceTimersByTime(200);
  expect(search).toHaveBeenCalledTimes(1);

  input.dispatchEvent(new Event("input"));
  input.dispatchEvent(Object.assign(new Event("keydown"), { key: "Enter", isComposing: false }));
  expect(search).toHaveBeenCalledTimes(2);
  vi.advanceTimersByTime(200);
  expect(search).toHaveBeenCalledTimes(2);
});
