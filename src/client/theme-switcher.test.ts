import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindThemeSwitcher } from './theme-switcher';

class ThemeOption {
  readonly dataset;
  checked = false;

  constructor(themeOption: string) {
    this.dataset = { themeOption };
  }

  closest() {
    return this;
  }

  setAttribute(name: string, value: string) {
    if (name === 'aria-checked') this.checked = value === 'true';
  }
}

function setup() {
  const options = {
    light: new ThemeOption('light'),
    dark: new ThemeOption('dark'),
    system: new ThemeOption('system'),
  };
  const themeColor = { content: '' };
  const root = {
    dataset: { theme: '', themePreference: '' },
    style: { colorScheme: '' },
    ownerDocument: { querySelector: () => themeColor },
    animate: vi.fn(),
  };
  const transitions: { update: () => void; skipTransition: () => void }[] = [];
  const document = Object.assign(new EventTarget(), {
    documentElement: root,
    querySelectorAll: () => Object.values(options),
    startViewTransition(update: () => void) {
      const transition = {
        update,
        skipTransition: vi.fn(),
        ready: new Promise<void>(() => {}),
        finished: new Promise<void>(() => {}),
      };
      transitions.push(transition);
      return transition;
    },
  });
  const system = Object.assign(new EventTarget(), { matches: false });
  const storage = new Map<string, string>();
  const window = Object.assign(new EventTarget(), {
    innerWidth: 1024,
    innerHeight: 768,
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
    matchMedia: (query: string) => query === '(prefers-color-scheme: dark)' ? system : { matches: false },
  });
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  vi.stubGlobal('Element', ThemeOption);
  bindThemeSwitcher();

  return {
    root,
    themeColor,
    options,
    storage,
    transitions,
    system,
    click(mode: keyof typeof options, detail = 1) {
      const click = Object.assign(new Event('click'), { detail, clientX: 20, clientY: 20 });
      Object.defineProperty(click, 'target', { value: options[mode] });
      document.dispatchEvent(click);
    },
    syncFromStorage(value: string) {
      window.dispatchEvent(Object.assign(new Event('storage'), { key: 'theme-mode', newValue: value }));
    },
  };
}

afterEach(() => vi.unstubAllGlobals());

describe('Header theme menu', () => {
  it('applies the current pointer transition and switches directly on keyboard activation', () => {
    const page = setup();
    page.click('light');
    page.transitions[0].update();

    expect(page.root.dataset.theme).toBe('light');
    expect(page.themeColor.content).toBe('#ffffff');
    expect(page.options.light.checked).toBe(true);

    page.click('dark', 0);
    expect(page.root.dataset.theme).toBe('dark');
    expect(page.options.dark.checked).toBe(true);
    expect(page.themeColor.content).toBe('#141414');
    expect(page.transitions).toHaveLength(1);
  });

  it('keeps the last selection when an earlier transition callback arrives late', () => {
    const page = setup();
    page.click('light');
    page.click('dark');
    page.transitions[0].update();

    expect(page.root.dataset.theme).toBe('dark');
    expect(page.root.style.colorScheme).toBe('dark');
    expect(page.options.dark.checked).toBe(true);
    expect(page.themeColor.content).toBe('#141414');
    expect(page.options.light.checked).toBe(false);
    expect(page.storage.get('theme-mode')).toBe('dark');
    expect(page.transitions[0].skipTransition).toHaveBeenCalledOnce();
  });

  it('applies cross-tab and system changes immediately during a pending transition', () => {
    const page = setup();
    page.click('light');
    page.system.matches = true;
    page.syncFromStorage('system');
    page.transitions[0].update();

    expect(page.root.dataset.theme).toBe('dark');
    expect(page.options.system.checked).toBe(true);

    page.system.matches = false;
    page.system.dispatchEvent(new Event('change'));
    expect(page.root.dataset.theme).toBe('light');
    expect(page.themeColor.content).toBe('#ffffff');
    expect(page.options.system.checked).toBe(true);
    expect(page.transitions).toHaveLength(1);
  });
});
