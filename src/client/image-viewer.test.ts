import { describe, expect, it } from 'vitest';
import { bindImageViewers } from './image-viewer';

class TestControl {
  listeners = new Map<string, EventListener[]>();
  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }
  click(target: unknown = this): void {
    this.listeners.get('click')?.forEach((listener) => listener({ target } as Event));
  }
}

class TestDialog extends TestControl {
  opened = 0;
  closed = 0;
  showModal(): void { this.opened += 1; }
  close(): void { this.closed += 1; }
}

class TestViewer {
  dataset: Record<string, string> = {};
  open = new TestControl();
  close = new TestControl();
  dialog = new TestDialog();
  querySelector(selector: string): TestControl | TestDialog | null {
    if (selector === '[data-image-viewer-open]') return this.open;
    if (selector === '[data-image-viewer-close]') return this.close;
    if (selector === '[data-image-viewer-dialog]') return this.dialog;
    return null;
  }
}

class TestRoot {
  constructor(private readonly viewers: TestViewer[]) {}
  querySelectorAll(): TestViewer[] { return this.viewers; }
}

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
});
