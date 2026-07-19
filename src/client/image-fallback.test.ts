import { afterEach, describe, expect, it, vi } from 'vitest';
import { bindImageFallbacks } from './image-fallback';

class TestSource {
  dataset: Record<string, string> = {};
  media = '(max-width: 767px)';
  srcset = 'medium-primary.jpg';
}

class TestPicture {
  constructor(private readonly sources: TestSource[]) {}
  querySelectorAll(): TestSource[] { return this.sources; }
}

class TestImage {
  dataset: Record<string, string> = {};
  src = 'primary.jpg';
  parentElement: TestPicture | null = null;
  private listeners: EventListener[] = [];

  addEventListener(type: string, listener: EventListener): void {
    if (type === 'error') this.listeners.push(listener);
  }

  fail(): void {
    this.listeners.forEach((listener) => listener(new Event('error')));
  }

  get listenerCount(): number { return this.listeners.length; }
}

afterEach(() => vi.unstubAllGlobals());

class TestRoot {
  constructor(private readonly images: TestImage[]) {}

  querySelectorAll(): TestImage[] { return this.images; }
}

describe('image fallbacks', () => {
  it('binds each image once and stops after fallback then placeholder', () => {
    const image = new TestImage();
    image.dataset.fallback = 'fallback.jpg';
    image.dataset.placeholder = 'placeholder.svg';
    const root = new TestRoot([image]);

    bindImageFallbacks(root as unknown as ParentNode);
    bindImageFallbacks(root as unknown as ParentNode);

    expect(image.dataset.bound).toBe('1');
    expect(image.listenerCount).toBe(1);
    image.fail();
    expect(image.src).toBe('fallback.jpg');
    image.fail();
    expect(image.src).toBe('placeholder.svg');
    image.fail();
    expect(image.src).toBe('placeholder.svg');
  });

  it('falls back the active responsive source before using the placeholder', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    const source = new TestSource();
    source.dataset.fallback = 'medium-fallback.jpg';
    const image = new TestImage();
    image.dataset.fallback = 'large-fallback.jpg';
    image.dataset.placeholder = 'placeholder.svg';
    image.parentElement = new TestPicture([source]);

    bindImageFallbacks(new TestRoot([image]) as unknown as ParentNode);
    image.fail();
    expect(source.srcset).toBe('medium-fallback.jpg');
    expect(image.src).toBe('primary.jpg');
    image.fail();
    expect(source.srcset).toBe('placeholder.svg');
    image.fail();
    expect(source.srcset).toBe('placeholder.svg');
  });
});
