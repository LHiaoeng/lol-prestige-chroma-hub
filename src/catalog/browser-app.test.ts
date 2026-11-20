import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserCatalogItem } from './browser-catalog';

const dataName = (attribute: string) => attribute.slice(5).replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

class TestElement {
  attributes = new Map<string, string>();
  children: TestElement[] = [];
  className = '';
  classList = { add: (...names: string[]) => { this.className = [this.className, ...names].filter(Boolean).join(' '); } };
  dataset: Record<string, string> = {};
  style = { fill: '', stroke: '' };
  innerHTML = '';
  hidden = false;
  parentElement: TestElement | null = null;
  textContent = '';
  value = '';
  name = '';
  href = '';
  src = '';
  alt = '';
  type = '';
  listeners = new Map<string, EventListener[]>();
  bottom = 2000;
  getBoundingClientRect() { return { bottom: this.bottom }; }

  constructor(readonly tagName: string, readonly ownerDocument: TestDocument) {}

  get firstElementChild(): TestElement | null { return this.children[0] ?? null; }

  addEventListener(type: string, listener: EventListener): void {
    this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener]);
  }

  dispatch(type: string, bubbles = false): void {
    const event = { type, target: this, preventDefault() {} } as unknown as Event;
    let element: TestElement | null = this;
    do {
      element.listeners.get(type)?.forEach((listener) => listener(event));
      element = bubbles ? element.parentElement : null;
    } while (element);
  }

  append(...children: TestElement[]): void {
    children.forEach((child) => { child.parentElement = this; });
    this.children.push(...children);
  }

  replaceChildren(...children: TestElement[]): void {
    this.children.forEach((child) => { child.parentElement = null; });
    this.children = [];
    this.append(...children);
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
    if (name === 'class') this.className = value;
  }

  getAttribute(name: string): string | null { return this.attributes.get(name) ?? null; }

  matches(selector: string): boolean {
    const tagWithData = selector.match(/^([a-z]+)\[data-([a-z-]+)\]$/);
    if (tagWithData) return this.tagName === tagWithData[1] && dataName(`data-${tagWithData[2]}`) in this.dataset;
    const data = selector.match(/^\[data-([a-z-]+)\]$/);
    if (data) return dataName(`data-${data[1]}`) in this.dataset;
    const attribute = selector.match(/^\[([^=]+)="([^"]+)"\]$/);
    if (attribute) return this.getAttribute(attribute[1]) === attribute[2];
    if (selector.startsWith('.')) return this.className.split(' ').includes(selector.slice(1));
    if (selector.startsWith('#')) return this.getAttribute('id') === selector.slice(1);
    return this.tagName === selector;
  }

  querySelectorAll<T extends TestElement>(selector: string): T[] {
    return this.children.flatMap((child) => [
      ...(child.matches(selector) ? [child as T] : []),
      ...child.querySelectorAll<T>(selector),
    ]);
  }

  querySelector<T extends TestElement>(selector: string): T | null {
    return this.querySelectorAll<T>(selector)[0] ?? null;
  }

  closest<T extends TestElement>(selector: string): T | null {
    if (this.matches(selector)) return this as unknown as T;
    return this.parentElement?.closest<T>(selector) ?? null;
  }

  cloneNode(deep = false): TestElement {
    const clone = new TestElement(this.tagName, this.ownerDocument);
    clone.className = this.className;
    clone.dataset = { ...this.dataset };
    clone.hidden = this.hidden;
    clone.textContent = this.textContent;
    clone.attributes = new Map(this.attributes);
    if (deep) clone.append(...this.children.map((child) => child.cloneNode(true)));
    return clone;
  }

  focus(): void { this.ownerDocument.activeElement = this; }
}

class TestForm extends TestElement {
  controls = new Map<string, TestElement>();
  elements = { namedItem: (name: string) => this.controls.get(name) ?? null };
}

class TestTemplate extends TestElement {
  content: TestElement;
  constructor(ownerDocument: TestDocument) {
    super('template', ownerDocument);
    this.content = new TestElement('fragment', ownerDocument);
  }
}

class TestDocument {
  activeElement: TestElement | null = null;
  roots: TestElement[] = [];
  documentElement = { dataset: { language: 'zh' } };

  addEventListener(): void {}

  createElement(tagName: string): TestElement { return new TestElement(tagName, this); }
  createElementNS(_namespace: string, tagName: string): TestElement { return this.createElement(tagName); }

  querySelectorAll<T extends TestElement>(selector: string): T[] {
    return this.roots.flatMap((root) => [
      ...(root.matches(selector) ? [root as T] : []),
      ...root.querySelectorAll<T>(selector),
    ]);
  }

  querySelector<T extends TestElement>(selector: string): T | null {
    return this.querySelectorAll<T>(selector)[0] ?? null;
  }
}

function catalogItem(index: number): BrowserCatalogItem {
  return {
    slug: `item-${index}`, skinId: index, instanceId: `instance-${index}`,
    nameZh: `名称 ${index}`, nameEn: `Name ${index}`, heroId: 'hero', heroNameZh: '英雄', heroNameEn: 'Champion',
    categoryId: 'category', categoryName: '分类', categoryNameEn: 'Category', gameVer: '26.13', isNew: index === 1,
    rank: 4 - index, imageMedium: `https://img.example/${index}.jpg`, imageTag: `https://img.example/tag-${index}.png`,
  };
}

function fixture(search = '', pathname = '/prestige-chromas/', columns = 5, total = 53) {
  const document = new TestDocument();
  const form = new TestForm('form', document);
  form.dataset.filters = '';
  for (const name of ['q', 'hero', 'version', 'category', 'isNew', 'sort']) {
    const control = new TestElement(name === 'q' ? 'input' : 'select', document);
    control.name = name;
    control.value = name === 'sort' ? 'rank_desc' : '';
    form.controls.set(name, control);
    form.append(control);
  }
  const list = new TestElement('div', document); list.dataset.chromaList = '';
  list.dataset.staticBatch = '';
  const status = new TestElement('div', document); status.dataset.status = ''; status.hidden = true;
  const count = new TestElement('p', document); count.dataset.resultCount = '';
  const toggle = new TestElement('a', document); toggle.className = 'language-toggle';
  const pagination = new TestElement('nav', document); pagination.dataset.pagination = '';
  const data = new TestElement('script', document); data.setAttribute('id', 'catalog-data');
  data.textContent = JSON.stringify(Array.from({ length: total }, (_, index) => catalogItem(index + 1)));
  const template = new TestTemplate(document); template.dataset.chromaCardTemplate = '';
  const card = new TestElement('article', document); card.className = 'chroma-card';
  const link = new TestElement('a', document);
  const imageWrap = new TestElement('div', document);
  const image = new TestElement('img', document); image.dataset.fallback = ''; image.dataset.placeholder = '';
  const categoryIcon = new TestElement('img', document); categoryIcon.className = 'category-icon';
  const badge = new TestElement('span', document); badge.className = 'new-badge';
  imageWrap.append(image, categoryIcon, badge);
  const body = new TestElement('div', document);
  const versionTag = new TestElement('span', document); versionTag.className = 'version-tag';
  const heading = new TestElement('h2', document);
  const english = new TestElement('p', document); english.dataset.nameEn = '';
  body.append(versionTag, heading, english);
  link.append(imageWrap, body); card.append(link); template.content.append(card);
  document.roots.push(form, list, status, count, toggle, pagination, template, data);

  const location = { search, pathname };
  const pushCalls: string[] = [];
  const replaceCalls: string[] = [];
  const updateLocation = (url: string) => { location.search = url.includes('?') ? url.slice(url.indexOf('?')) : ''; };
  const history = {
    pushState: (_state: unknown, _unused: string, url: string) => { pushCalls.push(url); updateLocation(url); },
    replaceState: (_state: unknown, _unused: string, url: string) => { replaceCalls.push(url); updateLocation(url); },
  };
  const listeners = new Map<string, EventListener>();
  const frames: FrameRequestCallback[] = [];
  const viewport = { columns };
  const environment = {
    innerHeight: 800,
    getComputedStyle: (() => ({ gridTemplateColumns: Array(viewport.columns).fill('180px').join(' ') })) as unknown as typeof globalThis.getComputedStyle,
    requestAnimationFrame: ((callback: FrameRequestCallback) => { frames.push(callback); return frames.length; }) as typeof globalThis.requestAnimationFrame,
    document: document as unknown as Document,
    history: history as unknown as History,
    location: location as unknown as Location,
    addEventListener: ((type: string, listener: EventListener) => listeners.set(type, listener)) as typeof globalThis.addEventListener,
    setTimeout: ((callback: () => void) => { callback(); return 0; }) as unknown as typeof globalThis.setTimeout,
  };
  return { frames, viewport, document, form, list, status, count, toggle, pagination, location, pushCalls, replaceCalls, listeners, environment };
}

beforeEach(() => {
  vi.stubGlobal('HTMLElement', TestElement);
  vi.stubGlobal('HTMLInputElement', TestElement);
  vi.stubGlobal('HTMLSelectElement', TestElement);
});

afterEach(() => vi.unstubAllGlobals());

describe('catalog browser adapter', () => {
  it('exports an initializer without requiring browser globals during import', async () => {
    const module = await import('./browser-app');
    expect(module.initializeCatalogBrowser).toBeTypeOf('function');
  });

  it('renders whole rows and appends on scroll without replacing existing cards', async () => {
    const page = fixture();
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);

    expect(page.list.children).toHaveLength(20);
    expect(page.list.dataset.staticBatch).toBeUndefined();
    expect(page.count.textContent).toBe('共 53 款臻彩');
    const first = page.list.children[0];
    page.list.bottom = 900;
    page.listeners.get('scroll')!(new Event('scroll'));
    page.frames.shift()!(0);
    expect(page.list.children).toHaveLength(40);
    expect(page.list.children[0]).toBe(first);
    page.frames.shift()!(0);
    expect(page.list.children).toHaveLength(53);
    expect(new Set(page.list.children.map(card => card.querySelector('a')?.href)).size).toBe(53);
    expect(page.pushCalls).toEqual([]);
  });

  it('keeps visible cards across a column change and completes the new row', async () => {
    const page = fixture('', '/prestige-chromas/', 5, 70);
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    const first = page.list.children[0];
    page.frames.shift()!(0);
    page.viewport.columns = 7;
    page.listeners.get('resize')!(new Event('resize'));
    page.frames.shift()!(0);
    expect(page.list.children).toHaveLength(20);
    page.list.bottom = 900;
    page.listeners.get('scroll')!(new Event('scroll'));
    page.frames.shift()!(0);
    expect(page.list.children).toHaveLength(42);
    expect(page.list.children[0]).toBe(first);
  });

  it('resets the visible batch and form state when filters are cleared', async () => {
    const page = fixture('?isNew=true', '/zh-cn/prestige-chromas/', 2);
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    expect(page.list.children).toHaveLength(1);
    expect(page.list.children[0].querySelector('a')?.href).toBe('/zh-cn/chromas/item-1/');
    page.form.dispatch('reset');
    expect(page.form.controls.get('isNew')?.value).toBe('');
    expect(page.list.children).toHaveLength(24);
    expect(page.count.textContent).toBe('共 53 款臻彩');
    expect(page.pushCalls).toEqual(['/zh-cn/prestige-chromas/']);
  });

  it('fills a short viewport and stops scheduling after the final partial row', async () => {
    const page = fixture('', '/prestige-chromas/', 2, 27);
    page.list.bottom = 400;
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    expect(page.list.children).toHaveLength(24);
    page.frames.shift()!(0);
    expect(page.list.children).toHaveLength(27);
    expect(page.frames).toHaveLength(0);
    expect(page.status.textContent).toBe('已显示 27 / 27 款臻彩。');
  });

  it('restores filters from history and reports empty results', async () => {
    const page = fixture('?page=9&pageSize=1', '/prestige-chromas/');
    page.document.documentElement.dataset.language = 'en';
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    expect(page.replaceCalls).toEqual(['/prestige-chromas/']);
    expect(page.list.children).toHaveLength(20);
    page.form.controls.get('q')!.value = 'missing';
    page.form.dispatch('submit');
    expect(page.list.children).toHaveLength(0);
    expect(page.status.textContent).toContain('No prestige chromas match');
    page.location.search = '?q=Name+53';
    page.listeners.get('popstate')!(new Event('popstate'));
    expect(page.form.controls.get('q')?.value).toBe('Name 53');
    expect(page.list.children).toHaveLength(1);
    expect(page.list.children[0].querySelector('h2')?.textContent).toBe('Name 53');
    expect(page.list.children[0].querySelector('img')?.alt).toBe('League of Legends Name 53 China-Server Chroma Splash Art');
    expect(page.toggle.href).toBe('/zh-cn/prestige-chromas/?q=Name+53');
  });
});
