export function bindImageFallbacks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach((image) => {
    if (image.dataset.bound) return;
    image.dataset.bound = '1';
    image.addEventListener('error', () => {
      const responsiveSource = Array.from(image.parentElement?.querySelectorAll<HTMLSourceElement>('source[data-fallback]') ?? [])
        .find((source) => !source.media || (typeof matchMedia === 'function' && matchMedia(source.media).matches));
      if (responsiveSource) {
        if (responsiveSource.dataset.fallbackStage === 'placeholder') return;
        if (responsiveSource.dataset.fallbackStage !== 'fallback' && responsiveSource.dataset.fallback) {
          responsiveSource.dataset.fallbackStage = 'fallback';
          responsiveSource.srcset = responsiveSource.dataset.fallback;
          return;
        }
        responsiveSource.dataset.fallbackStage = 'placeholder';
        if (image.dataset.placeholder) responsiveSource.srcset = image.dataset.placeholder;
        return;
      }
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
