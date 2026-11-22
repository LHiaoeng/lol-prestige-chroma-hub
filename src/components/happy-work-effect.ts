const storageKey = 'happy-mode';
const boundMenus = new WeakSet<HTMLButtonElement>();
const buttonSelector = 'button.ant-btn:not(.ant-btn-text, .ant-btn-link, .ant-btn-variant-text, .ant-btn-variant-link)';
const inputSelector = 'input.ant-radio-button-input, input[type="checkbox"][data-happy-wave]';
const unavailableSelector = ':disabled, [aria-disabled="true"], [aria-busy="true"], .ant-btn-loading';
const scaleFrames = [
  { offset: 0, scale: '1' },
  { offset: 0.1, scale: '1.1' },
  { offset: 0.35, scale: '0.94' },
  { offset: 0.6, scale: '1.05' },
  { offset: 0.85, scale: '0.97' },
  { offset: 1, scale: '1' },
].map((frame) => ({ ...frame, easing: 'ease-in-out' }));

function waveTarget(origin: Element): HTMLElement | null {
  // Clicking a label forwards a second click to its input. Only the input participates.
  const control = origin.closest<HTMLElement>(`${buttonSelector}, ${inputSelector}, [data-happy-wave]`);
  if (!control || control.closest(unavailableSelector)) return null;
  if (control.matches('.ant-radio-button-input')) return control.closest('.ant-radio-button-wrapper');
  if (control.dataset.happyWave === 'label') return control.closest('label');
  return control;
}

function playBurst(target: HTMLElement, view: Window): (() => void) | undefined {
  if (typeof target.animate !== 'function' || target.matches('[class*="-dangerous"], [class*="-error"]')) return;
  const { left, top, width, height } = target.getBoundingClientRect();
  if (!width || !height || view.getComputedStyle(target).visibility !== 'visible') return;

  const document = target.ownerDocument;
  const burst = document.createElement('span');
  burst.className = 'happy-work-burst';
  burst.setAttribute('aria-hidden', 'true');
  burst.style.setProperty('--happy-x', `${left + width / 2}px`);
  burst.style.setProperty('--happy-y', `${top + height / 2}px`);
  const count = Math.min(width, height) >= 20 ? 10 : 7;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const halfMinSize = Math.min(halfWidth, halfHeight);
  const halfMaxSize = Math.max(halfWidth, halfHeight);
  const angleOffset = Math.random() * Math.PI * 2;
  const dots = Array.from({ length: count }, (_, index) => {
    const angle = angleOffset + index * Math.PI * 2 / count;
    const x = Math.cos(angle);
    const y = Math.sin(angle);
    const innerEdge = Math.min(halfMaxSize, halfWidth / Math.abs(x), halfHeight / Math.abs(y));
    const start = halfMinSize - 1 + Math.floor(innerEdge - (halfMinSize - 1));
    const outerEdge = Math.min(
      (halfWidth + 15 + Math.random() * 15) / Math.abs(x),
      (halfHeight + 15 + Math.random() * 15) / Math.abs(y),
    );
    const end = halfMinSize + Math.floor(outerEdge - halfMinSize) + 1;
    const dot = document.createElement('span');
    dot.className = 'happy-work-dot';
    dot.classList.toggle('happy-work-dot--outline', Math.random() > 0.6);
    dot.classList.toggle('happy-work-dot--alternate', Math.random() > 0.5);
    const size = height >= 20 ? 6 + Math.random() * 4 : 3 + Math.random() * 3;
    dot.style.width = dot.style.height = `${size}px`;
    burst.append(dot);

    const position = (distance: number) =>
      `translate(${x * distance}px, ${y * distance}px) translate(-50%, -50%)`;
    const endSize = Math.random() > 0.75 ? `${size}px` : '0px';
    return {
      dot,
      frames: [
        { offset: 0, transform: position(start), width: `${size}px`, height: `${size}px`, opacity: 0 },
        { offset: 0.25, opacity: 1 },
        { offset: 0.5, opacity: 0.8 },
        { offset: 1, transform: position(end), width: endSize, height: endSize, opacity: 0 },
      ],
    };
  });
  // A modal drawer sits in the browser's top layer.
  (target.closest('dialog:modal') ?? document.body).append(burst);
  const press = target.animate(scaleFrames, { duration: 450, delay: 50 });
  const particles = dots.map(({ dot, frames }) => dot.animate(frames, { duration: 300, delay: 50 }));
  return () => {
    press.cancel();
    particles.forEach((particle) => particle.cancel());
    burst.remove();
  };
}

export function bindHappyWorkEffect(document: Document = globalThis.document): void {
  const menu = document.querySelector<HTMLButtonElement>('[data-happy-work-toggle]');
  const view = document.defaultView;
  if (!menu || !view || boundMenus.has(menu)) return;
  boundMenus.add(menu);

  let storage: Storage | undefined;
  let enabled = false;
  try {
    storage = view.localStorage;
    enabled = storage.getItem(storageKey) === 'true';
  } catch {
    // The menu can still change the preference for this page.
  }

  const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map<HTMLElement, () => void>();
  const cancelBursts = () => active.forEach((cancel) => cancel());
  const apply = (next: boolean) => {
    enabled = next;
    menu.setAttribute('aria-checked', String(enabled));
    if (!enabled) cancelBursts();
  };

  apply(enabled);
  menu.addEventListener('click', () => {
    apply(!enabled);
    try {
      storage?.setItem(storageKey, String(enabled));
    } catch {
      // The in-page preference has already been applied.
    }
  });
  view.addEventListener('storage', (event) => {
    if (event.storageArea !== storage || (event.key !== storageKey && event.key !== null)) return;
    apply(event.key === storageKey && event.newValue === 'true');
  });
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) cancelBursts();
  });
  view.addEventListener('pagehide', cancelBursts);

  document.addEventListener('click', (event) => {
    if (!enabled || reducedMotion.matches || !event.isTrusted || !(event.target instanceof Element)) return;
    const target = waveTarget(event.target);
    if (!target) return;
    active.get(target)?.();
    const remove = playBurst(target, view);
    if (!remove) return;

    const cancel = () => {
      view.clearTimeout(timeout);
      remove();
      active.delete(target);
    };
    const timeout = view.setTimeout(cancel, 600);
    active.set(target, cancel);
  }, true);
}
