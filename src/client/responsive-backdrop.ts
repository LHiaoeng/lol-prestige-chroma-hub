interface BackdropBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function calculateBackdropOffset(
  clientX: number,
  clientY: number,
  bounds: BackdropBounds,
  rangeX = 36,
  rangeY = 24,
): { x: number; y: number } {
  const x = ((clientX - bounds.left) / bounds.width - .5) * -rangeX;
  const y = ((clientY - bounds.top) / bounds.height - .5) * -rangeY;
  return {
    x: x === 0 ? 0 : x,
    y: y === 0 ? 0 : y,
  };
}

export function bindResponsiveBackdrops(root: ParentNode = document, view: Window = window): void {
  const canParallax = view.matchMedia('(hover: hover) and (pointer: fine)').matches
    && !view.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!canParallax) return;

  root.querySelectorAll<HTMLElement>('[data-responsive-backdrop]').forEach((backdrop) => {
    if (backdrop.dataset.parallaxBound) return;
    const scope = backdrop.closest<HTMLElement>('[data-backdrop-scope]');
    const image = backdrop.querySelector<HTMLElement>('[data-backdrop-image]');
    if (!scope || !image) return;
    backdrop.dataset.parallaxBound = '1';

    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let frame = 0;

    const render = () => {
      currentX += (targetX - currentX) * .1;
      currentY += (targetY - currentY) * .1;
      image.style.setProperty('--backdrop-x', `${currentX.toFixed(2)}px`);
      image.style.setProperty('--backdrop-y', `${currentY.toFixed(2)}px`);
      if (Math.abs(targetX - currentX) > .05 || Math.abs(targetY - currentY) > .05) {
        frame = view.requestAnimationFrame(render);
      } else {
        frame = 0;
      }
    };
    const animate = () => {
      if (!frame) frame = view.requestAnimationFrame(render);
    };

    scope.addEventListener('pointermove', (event) => {
      const offset = calculateBackdropOffset(event.clientX, event.clientY, scope.getBoundingClientRect());
      targetX = offset.x;
      targetY = offset.y;
      animate();
    });
    scope.addEventListener('pointerleave', () => {
      targetX = 0;
      targetY = 0;
      animate();
    });
  });
}
