const BACK_TO_TOP_THRESHOLD = 400;
const BACK_TO_TOP_DURATION = 450;

export function isBackToTopVisible(scrollY: number): boolean {
  return scrollY >= BACK_TO_TOP_THRESHOLD;
}

export function backToTopPosition(startY: number, elapsed: number): number {
  const progress = Math.min(elapsed / BACK_TO_TOP_DURATION, 1);
  const eased = progress < 0.5 ? 4 * progress ** 3 : 1 - 4 * (1 - progress) ** 3;
  return startY * (1 - eased);
}

export function bindBackToTop(root: ParentNode = document, view: Window = window): void {
  const button = root.querySelector<HTMLButtonElement>('[data-back-to-top]');
  if (!button || button.dataset.bound) return;
  button.dataset.bound = '1';

  const update = () => {
    button.inert = !isBackToTopVisible(view.scrollY);
  };

  let frame = 0;
  button.addEventListener('click', () => {
    view.cancelAnimationFrame(frame);
    const scroll = (top: number) => view.scrollTo({ top, behavior: 'instant' });
    if (view.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scroll(0);
      return;
    }

    const startY = view.scrollY;
    const startTime = view.performance.now();
    const step = (now: number) => {
      const elapsed = now - startTime;
      scroll(backToTopPosition(startY, elapsed));
      if (elapsed < BACK_TO_TOP_DURATION) frame = view.requestAnimationFrame(step);
    };
    frame = view.requestAnimationFrame(step);
  });
  view.addEventListener('scroll', update, { passive: true });
  update();
}
