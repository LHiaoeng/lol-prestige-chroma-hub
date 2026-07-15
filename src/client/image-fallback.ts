export function bindImageFallbacks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach((image) => {
    if (image.dataset.bound) return;
    image.dataset.bound = '1';
    image.addEventListener('error', () => {
      if (image.dataset.fallbackStage === 'placeholder') return;
      if (image.dataset.fallbackStage !== 'fallback' && image.dataset.fallback) {
        image.dataset.fallbackStage = 'fallback';
        image.src = image.dataset.fallback;
        return;
      }
      image.dataset.fallbackStage = 'placeholder';
      if (image.dataset.placeholder) image.src = image.dataset.placeholder;
    });
  });
}
