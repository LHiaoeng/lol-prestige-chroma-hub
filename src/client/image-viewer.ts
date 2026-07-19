interface Point {
  x: number;
  y: number;
}

interface PinchBaseline {
  center: Point;
  distance: number;
  midpoint: Point;
  panX: number;
  panY: number;
  scale: number;
}

const clampScale = (scale: number): number => Math.min(4, Math.max(1, scale));
const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.y - a.y);

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
    let pinch: PinchBaseline | null = null;
    let drag: { pointerId: number; start: Point; panX: number; panY: number } | null = null;
    const pointers = new Map<number, Point>();

    const applyTransform = (nextScale: number, nextPanX = panX, nextPanY = panY) => {
      const clampedScale = clampScale(nextScale);
      if (![clampedScale, nextPanX, nextPanY].every(Number.isFinite)) return;
      scale = clampedScale;
      panX = scale <= 1 ? 0 : nextPanX;
      panY = scale <= 1 ? 0 : nextPanY;
      fullImage.style.setProperty('--viewer-scale', String(scale));
      fullImage.style.setProperty('--viewer-x', `${panX}px`);
      fullImage.style.setProperty('--viewer-y', `${panY}px`);
      fullImage.dataset.zoomed = String(scale > 1);
      zoomOut.disabled = scale <= 1;
      zoomIn.disabled = scale >= 4;
    };

    const clearGestureFlags = () => {
      delete fullImage.dataset.dragging;
      delete fullImage.dataset.pinching;
    };

    const startPinch = () => {
      const [a, b] = [...pointers.values()];
      if (!a || !b) return;
      const initialDistance = distance(a, b);
      if (!Number.isFinite(initialDistance) || initialDistance <= 0) return;
      const bounds = fullImage.getBoundingClientRect();
      pinch = {
        center: {
          x: bounds.left + bounds.width / 2 - panX,
          y: bounds.top + bounds.height / 2 - panY,
        },
        distance: initialDistance,
        midpoint: midpoint(a, b),
        panX,
        panY,
        scale,
      };
      drag = null;
      delete fullImage.dataset.dragging;
      fullImage.dataset.pinching = 'true';
    };

    const rebaseGesture = () => {
      clearGestureFlags();
      pinch = null;
      drag = null;
      if (pointers.size === 2) {
        startPinch();
      } else if (pointers.size === 1 && scale > 1) {
        const [pointerId, point] = [...pointers.entries()][0];
        if (point) {
          drag = { pointerId, start: point, panX, panY };
          fullImage.dataset.dragging = 'true';
        }
      }
    };

    const resetViewer = () => {
      pointers.clear();
      clearGestureFlags();
      pinch = null;
      drag = null;
      applyTransform(1, 0, 0);
    };

    const unlockPage = () => {
      document.documentElement.style.removeProperty('overflow');
      document.body.style.removeProperty('overflow');
    };

    open.addEventListener('click', () => {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      resetViewer();
      dialog.showModal();
    });
    zoomIn.addEventListener('click', () => {
      applyTransform(scale + .25);
      rebaseGesture();
    });
    zoomOut.addEventListener('click', () => {
      applyTransform(scale - .25);
      rebaseGesture();
    });
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => {
      resetViewer();
      unlockPage();
    });
    dialog.addEventListener('wheel', (event) => {
      event.preventDefault();
      applyTransform(scale + (event.deltaY < 0 ? .25 : -.25));
      rebaseGesture();
    }, { passive: false });

    fullImage.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      fullImage.setPointerCapture(event.pointerId);
      rebaseGesture();
    });
    fullImage.addEventListener('pointermove', (event) => {
      if (!pointers.has(event.pointerId)) return;
      event.preventDefault();
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (pointers.size === 2 && pinch) {
        const [a, b] = [...pointers.values()];
        if (!a || !b) return;
        const currentDistance = distance(a, b);
        if (!Number.isFinite(currentDistance) || currentDistance <= 0) return;
        const currentMidpoint = midpoint(a, b);
        const nextScale = clampScale(pinch.scale * currentDistance / pinch.distance);
        const ratio = nextScale / pinch.scale;
        applyTransform(
          nextScale,
          currentMidpoint.x - pinch.center.x - ratio * (pinch.midpoint.x - pinch.center.x - pinch.panX),
          currentMidpoint.y - pinch.center.y - ratio * (pinch.midpoint.y - pinch.center.y - pinch.panY),
        );
      } else if (pointers.size === 1 && drag?.pointerId === event.pointerId) {
        applyTransform(
          scale,
          drag.panX + event.clientX - drag.start.x,
          drag.panY + event.clientY - drag.start.y,
        );
      }
    });

    const endPointer = (event: PointerEvent) => {
      pointers.delete(event.pointerId);
      rebaseGesture();
    };
    fullImage.addEventListener('pointerup', endPointer);
    fullImage.addEventListener('pointercancel', endPointer);

    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}
