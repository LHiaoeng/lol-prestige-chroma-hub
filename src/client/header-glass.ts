export const HEADER_CONDENSE_THRESHOLD = 24;

/** 首屏内保持通透玻璃，开始滚动后收紧为高对比玻璃。 */
export function isHeaderCondensed(scrollY: number, threshold = HEADER_CONDENSE_THRESHOLD): boolean {
  return scrollY > threshold;
}

export function bindHeaderGlass(root: ParentNode = document, view: Window = window): void {
  const header = root.querySelector<HTMLElement>('.site-header');
  if (!header || header.dataset.glassBound) return;
  header.dataset.glassBound = '1';

  const update = () => {
    header.toggleAttribute('data-condensed', isHeaderCondensed(view.scrollY));
  };

  view.addEventListener('scroll', update, { passive: true });
  update();
}
