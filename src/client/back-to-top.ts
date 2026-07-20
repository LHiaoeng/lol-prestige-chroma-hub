export const BACK_TO_TOP_THRESHOLD = 480;

export function isBackToTopVisible(scrollY: number, threshold = BACK_TO_TOP_THRESHOLD): boolean {
  return scrollY > threshold;
}

export function backToTopBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? 'auto' : 'smooth';
}

export function bindBackToTop(root: ParentNode = document, view: Window = window): void {
  const button = root.querySelector<HTMLButtonElement>('[data-back-to-top]');
  if (!button || button.dataset.bound) return;
  button.dataset.bound = '1';

  const update = () => {
    const visible = isBackToTopVisible(view.scrollY);
    button.toggleAttribute('data-visible', visible);
    button.tabIndex = visible ? 0 : -1;
    button.setAttribute('aria-hidden', String(!visible));
  };

  button.addEventListener('click', () => {
    const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)').matches;
    view.scrollTo({ top: 0, behavior: backToTopBehavior(reducedMotion) });
  });
  view.addEventListener('scroll', update, { passive: true });
  update();
}
