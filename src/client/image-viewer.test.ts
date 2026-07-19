import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { bindImageViewers } from './image-viewer';

type Listener = (event: Record<string, unknown>) => void;

class TestStyle {
  values = new Map<string, string>();
  setProperty(name: string, value: string): void { this.values.set(name, value); }
  removeProperty(name: string): void { this.values.delete(name); }
  getPropertyValue(name: string): string { return this.values.get(name) ?? ''; }
}

class TestControl {
  listeners = new Map<string, Listener[]>();
  dataset: Record<string, string> = {};
  style = new TestStyle();
  disabled = false;
  addEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  removeEventListener(type: string, listener: Listener): void {
    this.listeners.set(type, (this.listeners.get(type) ?? []).filter((item) => item !== listener));
  }
  dispatch(type: string, event: Record<string, unknown> = {}): void {
    this.listeners.get(type)?.forEach((listener) => listener({ target: this, preventDefault: () => undefined, ...event }));
  }
  click(target: unknown = this): void { this.dispatch('click', { target }); }
  setPointerCapture(): void {}
  getBoundingClientRect(): DOMRect {
    return { left: 0, top: 0, right: 400, bottom: 200, width: 400, height: 200, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  }
}

class TestDialog extends TestControl {
  opened = 0;
  closed = 0;
  showModal(): void { this.opened += 1; }
  close(): void { this.closed += 1; this.dispatch('close'); }
}

class TestViewer {
  dataset: Record<string, string> = {};
  open = new TestControl();
  close = new TestControl();
  zoomIn = new TestControl();
  zoomOut = new TestControl();
  dialog = new TestDialog();
  fullImage = new TestControl();
  querySelector(selector: string): TestControl | TestDialog | null {
    if (selector === '[data-image-viewer-open]') return this.open;
    if (selector === '[data-image-viewer-close]') return this.close;
    if (selector === '[data-image-viewer-zoom-in]') return this.zoomIn;
    if (selector === '[data-image-viewer-zoom-out]') return this.zoomOut;
    if (selector === '[data-image-viewer-dialog]') return this.dialog;
    if (selector === '.viewer-full') return this.fullImage;
    return null;
  }
}

class TestRoot {
  constructor(private readonly viewers: TestViewer[]) {}
  querySelectorAll(): TestViewer[] { return this.viewers; }
}

beforeEach(() => {
  vi.stubGlobal('document', {
    documentElement: { style: new TestStyle() },
    body: { style: new TestStyle() },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe('image viewer', () => {
  it('binds once and supports open, close, and backdrop close', () => {
    const viewer = new TestViewer();
    const root = new TestRoot([viewer]);

    bindImageViewers(root as unknown as ParentNode);
    bindImageViewers(root as unknown as ParentNode);
    viewer.open.click();
    viewer.close.click();
    viewer.dialog.click(viewer.dialog);
    viewer.dialog.click(viewer.open);

    expect(viewer.dataset.viewerBound).toBe('1');
    expect(viewer.dialog.opened).toBe(1);
    expect(viewer.dialog.closed).toBe(2);
  });

  it('pinches around the two-pointer midpoint and continues with one-pointer pan', () => {
    const viewer = new TestViewer();
    bindImageViewers(new TestRoot([viewer]) as unknown as ParentNode);
    viewer.open.click();

    viewer.fullImage.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, pointerType: 'touch' });
    viewer.fullImage.dispatch('pointerdown', { pointerId: 2, clientX: 200, clientY: 100, pointerType: 'touch' });
    viewer.fullImage.dispatch('pointermove', { pointerId: 2, clientX: 300, clientY: 100, pointerType: 'touch' });

    expect(viewer.fullImage.style.getPropertyValue('--viewer-scale')).toBe('2');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-x')).toBe('100px');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-y')).toBe('0px');
    expect(viewer.fullImage.dataset.pinching).toBe('true');

    viewer.fullImage.dispatch('pointerup', { pointerId: 2, clientX: 300, clientY: 100, pointerType: 'touch' });
    viewer.fullImage.dispatch('pointermove', { pointerId: 1, clientX: 120, clientY: 100, pointerType: 'touch' });

    expect(viewer.fullImage.style.getPropertyValue('--viewer-x')).toBe('120px');
    expect(viewer.fullImage.dataset.pinching).toBeUndefined();
  });

  it('clamps every zoom path to 1–4x and recenters at 1x', () => {
    const viewer = new TestViewer();
    bindImageViewers(new TestRoot([viewer]) as unknown as ParentNode);
    viewer.open.click();

    expect(viewer.zoomOut.disabled).toBe(true);
    viewer.zoomOut.click();
    expect(viewer.fullImage.style.getPropertyValue('--viewer-scale')).toBe('1');

    for (let index = 0; index < 20; index += 1) viewer.zoomIn.click();
    expect(viewer.fullImage.style.getPropertyValue('--viewer-scale')).toBe('4');
    expect(viewer.zoomIn.disabled).toBe(true);

    viewer.fullImage.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, pointerType: 'touch' });
    viewer.fullImage.dispatch('pointermove', { pointerId: 1, clientX: 150, clientY: 120, pointerType: 'touch' });
    for (let index = 0; index < 20; index += 1) viewer.zoomOut.click();

    expect(viewer.fullImage.style.getPropertyValue('--viewer-scale')).toBe('1');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-x')).toBe('0px');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-y')).toBe('0px');
  });

  it('clears pinch state on pointer cancellation and dialog reset', () => {
    const viewer = new TestViewer();
    bindImageViewers(new TestRoot([viewer]) as unknown as ParentNode);
    viewer.open.click();
    viewer.fullImage.dispatch('pointerdown', { pointerId: 1, clientX: 100, clientY: 100, pointerType: 'touch' });
    viewer.fullImage.dispatch('pointerdown', { pointerId: 2, clientX: 200, clientY: 100, pointerType: 'touch' });

    expect(viewer.fullImage.dataset.pinching).toBe('true');
    viewer.fullImage.dispatch('pointercancel', { pointerId: 2, clientX: 200, clientY: 100, pointerType: 'touch' });
    expect(viewer.fullImage.dataset.pinching).toBeUndefined();

    viewer.dialog.close();
    viewer.open.click();
    expect(viewer.fullImage.style.getPropertyValue('--viewer-scale')).toBe('1');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-x')).toBe('0px');
    expect(viewer.fullImage.style.getPropertyValue('--viewer-y')).toBe('0px');
  });
});
