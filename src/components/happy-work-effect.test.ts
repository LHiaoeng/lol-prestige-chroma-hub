import { afterEach, expect, it, vi } from 'vitest';
import { bindHappyWorkEffect } from './happy-work-effect';

class Control extends EventTarget {
  dataset: Record<string, string> = {};
  style = { setProperty: vi.fn() };
  classList = { toggle: vi.fn() };
  setAttribute = vi.fn();
  remove = vi.fn();
  append = vi.fn();
  cancel = vi.fn();
  animate = vi.fn(() => ({ cancel: this.cancel }));
  getBoundingClientRect = vi.fn(() => ({ left: 20, top: 20, width: 32, height: 24 }));
  closest = vi.fn<(selector: string) => Control | null>();
  matches = vi.fn(() => false);
}

function setup(initial?: string, blocked = false) {
  vi.useFakeTimers();
  vi.stubGlobal('Element', Control);
  const menu = new Control();
  const body = new Control();
  const control = new Control();
  const reducedMotion = Object.assign(new EventTarget(), { matches: false });
  const storage = {
    getItem: vi.fn(() => {
      if (blocked) throw new Error('Storage blocked');
      return initial;
    }),
    setItem: vi.fn(() => {
      if (blocked) throw new Error('Storage blocked');
    }),
  };
  const view = Object.assign(new EventTarget(), {
    localStorage: storage,
    matchMedia: () => reducedMotion,
    getComputedStyle: () => ({ visibility: 'visible' }),
    setTimeout,
    clearTimeout,
  });
  const burst = new Control();
  const createElement = vi.fn(() => new Control()).mockReturnValueOnce(burst);
  const document = {
    defaultView: view,
    body,
    querySelector: () => menu,
    createElement,
    addEventListener: vi.fn<(type: string, handleClick: (event: { isTrusted: boolean; target: Control }) => void) => void>(),
  };
  const button = Object.assign(control, { ownerDocument: document });
  button.closest.mockImplementation((selector) => selector.startsWith('button') ? button : null);
  // The test environment uses a DOM fixture so it can model browser-trusted activation.
  vi.stubGlobal('document', document);
  bindHappyWorkEffect();

  return {
    menu, button, burst, body, storage, reducedMotion, createElement,
    activate: (target = button, isTrusted = true) => document.addEventListener.mock.calls[0][1]({ isTrusted, target }),
    sync(key: string | null, newValue: string | null, storageArea: object = storage) {
      view.dispatchEvent(Object.assign(new Event('storage'), { key, newValue, storageArea }));
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('defaults to off and persists its own preference independently of the theme', () => {
  const page = setup();
  expect(page.menu.setAttribute).toHaveBeenLastCalledWith('aria-checked', 'false');
  page.activate();
  expect(page.createElement).not.toHaveBeenCalled();
  page.menu.dispatchEvent(new Event('click'));
  expect(page.storage.setItem).toHaveBeenCalledWith('happy-mode', 'true');
  page.sync('theme-mode', 'light');
  page.sync('happy-mode', 'false', {});
  expect(page.menu.setAttribute).toHaveBeenLastCalledWith('aria-checked', 'true');
  page.sync(null, null);
  expect(page.menu.setAttribute).toHaveBeenLastCalledWith('aria-checked', 'false');
});

it('allows an in-page choice when storage is unavailable', () => {
  const page = setup(undefined, true);
  page.menu.dispatchEvent(new Event('click'));
  expect(page.menu.setAttribute).toHaveBeenLastCalledWith('aria-checked', 'true');
});

it.each([[16, 7], [24, 10]])('plays one burst with %i pixel controls and cleans it up', (height, dots) => {
  const page = setup('true');
  page.button.getBoundingClientRect.mockReturnValue({ left: 20, top: 20, width: 32, height });
  page.activate(page.button, false);
  expect(page.createElement).not.toHaveBeenCalled();
  page.activate();
  expect(page.burst.setAttribute).toHaveBeenCalledWith('aria-hidden', 'true');
  expect(page.burst.append).toHaveBeenCalledTimes(dots);
  expect(page.button.animate).toHaveBeenCalledWith(
    expect.arrayContaining([expect.objectContaining({ offset: 0.1, scale: '1.1', easing: 'ease-in-out' })]),
    { duration: 450, delay: 50 },
  );
  vi.advanceTimersByTime(600);
  expect(page.button.cancel).toHaveBeenCalledOnce();
  expect(page.burst.remove).toHaveBeenCalledOnce();
});

it('avoids unavailable controls and cancels motion without clearing the choice', () => {
  const page = setup('true');
  page.button.closest.mockReturnValue(page.button);
  page.activate();
  expect(page.body.append).not.toHaveBeenCalled();
  page.button.closest.mockImplementation((selector) => selector.startsWith('button') ? page.button : null);
  page.activate();
  page.reducedMotion.matches = true;
  page.reducedMotion.dispatchEvent(new Event('change'));
  expect(page.burst.remove).toHaveBeenCalledOnce();
  page.activate();
  expect(page.body.append).toHaveBeenCalledOnce();
  expect(page.menu.setAttribute).toHaveBeenLastCalledWith('aria-checked', 'true');
  page.reducedMotion.matches = false;
  page.activate();
  expect(page.body.append).toHaveBeenCalledTimes(2);
});
