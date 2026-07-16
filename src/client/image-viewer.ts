export function bindImageViewers(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-image-viewer]').forEach((viewer) => {
    if (viewer.dataset.viewerBound) return;
    const open = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-open]');
    const close = viewer.querySelector<HTMLButtonElement>('[data-image-viewer-close]');
    const dialog = viewer.querySelector<HTMLDialogElement>('[data-image-viewer-dialog]');
    if (!open || !close || !dialog) return;

    viewer.dataset.viewerBound = '1';
    open.addEventListener('click', () => dialog.showModal());
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}
