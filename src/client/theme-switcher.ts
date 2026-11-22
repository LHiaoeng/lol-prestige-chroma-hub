import { parseThemePreference, resolveTheme, type ThemePreference } from './theme-preference';

const storageKey = 'theme-mode';
const controllers = new WeakSet<Document>();

function readPreference(root: HTMLElement): ThemePreference {
  if (root.dataset.themePreference) return parseThemePreference(root.dataset.themePreference);
  try {
    return parseThemePreference(window.localStorage.getItem(storageKey));
  } catch {
    return 'dark';
  }
}

function persistPreference(preference: ThemePreference): void {
  try {
    window.localStorage.setItem(storageKey, preference);
  } catch {
    // Theme selection remains available for the current page when storage is blocked.
  }
}

function applyResolvedTheme(root: HTMLElement, theme: 'light' | 'dark'): void {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const themeColor = root.ownerDocument.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (themeColor) themeColor.content = theme === 'light' ? '#ffffff' : '#141414';
}

function syncSelectedOption(document: Document, preference: ThemePreference): void {
  document.querySelectorAll<HTMLButtonElement>('[data-theme-option]').forEach((option) => {
    option.setAttribute('aria-checked', String(option.dataset.themeOption === preference));
  });
}

export function bindThemeSwitcher(document: Document = globalThis.document): void {
  if (controllers.has(document)) return;
  controllers.add(document);

  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = readPreference(root);
  let activeTransition: ViewTransition | undefined;

  const applyCurrentTheme = (event?: MouseEvent) => {
    // A skipped transition can still invoke its DOM update callback.
    const previousTransition = activeTransition;
    activeTransition = undefined;
    previousTransition?.skipTransition();

    const theme = resolveTheme(preference, systemTheme.matches);
    if (root.dataset.theme === theme) return;

    if (!event || event.detail === 0 || typeof document.startViewTransition !== 'function'
      || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      applyResolvedTheme(root, theme);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    try {
      const transition = document.startViewTransition(() => {
        if (activeTransition === transition) applyResolvedTheme(root, theme);
      });
      activeTransition = transition;
      transition.ready.then(() => {
        if (activeTransition !== transition) return;
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 400, easing: 'ease-out', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => {});
      const clearTransition = () => {
        if (activeTransition === transition) activeTransition = undefined;
      };
      transition.finished.then(clearTransition, clearTransition);
    } catch {
      applyResolvedTheme(root, theme);
    }
  };

  const applyPreference = (nextPreference: ThemePreference, event?: MouseEvent) => {
    preference = nextPreference;
    root.dataset.themePreference = preference;
    syncSelectedOption(document, preference);
    persistPreference(preference);
    applyCurrentTheme(event);
  };

  syncSelectedOption(document, preference);
  applyResolvedTheme(root, resolveTheme(preference, systemTheme.matches));

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const option = target.closest<HTMLButtonElement>('[data-theme-option]');
    if (!option || option.disabled) return;
    const nextPreference = option.dataset.themeOption;
    if (nextPreference !== 'system' && nextPreference !== 'light' && nextPreference !== 'dark') return;
    applyPreference(nextPreference, event);
  });

  systemTheme.addEventListener('change', () => {
    if (preference === 'system') applyCurrentTheme();
  });

  window.addEventListener('storage', (event) => {
    if (event.key !== storageKey && event.key !== null) return;
    preference = parseThemePreference(event.key === null ? null : event.newValue);
    root.dataset.themePreference = preference;
    syncSelectedOption(document, preference);
    applyCurrentTheme();
  });
}
