export function bindImageViewers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-image-viewer]').forEach((viewer) => {
    if (viewer.dataset.viewerBound) return;
    const open = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-open]');
    const close = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-close]');
    const zoomIn = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-zoom-in]');
    const zoomOut = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-zoom-out]');
    const dialog = viewer.querySelector<HTMLDialogElement>('[data-image-viewer-dialog]');
    const fullImage = viewer.querySelector<HTMLImageElement>('.viewer-full');
    if (!open || !close || !zoomIn || !zoomOut || !dialog || !fullImage) return;

    viewer.dataset.viewerBound = '1';
    let scale = 1;
    let panX = 0;
    let panY = 0;
    const setPan = (x: number, y: number) => {
      panX = x;
      panY = y;
      fullImage.style.setProperty('--viewer-x', `${panX}px`);
      fullImage.style.setProperty('--viewer-y', `${panY}px`);
    };
    const setScale = (nextScale: number) => {
      scale = Math.min(4, Math.max(.5, nextScale));
      fullImage.style.setProperty('--viewer-scale', String(scale));
      fullImage.dataset.zoomed = String(scale > 1);
      if (scale <= 1) setPan(0, 0);
      zoomOut.disabled = scale <= .5;
      zoomIn.disabled = scale >= 4;
    };
    const unlockPage = () => {
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
    };
    open.addEventListener('click', () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      setScale(1);
      dialog.showModal();
    });
    zoomIn.addEventListener('click', () => setScale(scale + .25));
    zoomOut.addEventListener('click', () => setScale(scale - .25));
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', unlockPage);
    dialog.addEventListener('wheel', (event) => {
      event.preventDefault();
      setScale(scale + (event.deltaY < 0 ? .25 : -.25));
    }, { passive: false });
    fullImage.addEventListener('pointerdown', (event) => {
      if (scale <= 1) return;
      event.preventDefault();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = panX;
      const originY = panY;
      fullImage.dataset.dragging = 'true';
      fullImage.setPointerCapture(event.pointerId);

      const move = (moveEvent: PointerEvent) => {
        setPan(originX + moveEvent.clientX - startX, originY + moveEvent.clientY - startY);
      };
      const stop = () => {
        delete fullImage.dataset.dragging;
        fullImage.removeEventListener('pointermove', move);
        fullImage.removeEventListener('pointerup', stop);
        fullImage.removeEventListener('pointercancel', stop);
      };
      fullImage.addEventListener('pointermove', move);
      fullImage.addEventListener('pointerup', stop);
      fullImage.addEventListener('pointercancel', stop);
    });
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}
