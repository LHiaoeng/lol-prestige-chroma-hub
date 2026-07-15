import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserCatalogItem } from './browser-catalog';

const dataName = (attribute: string) => attribute.slice(5).replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase());

class TestElement {
  attributes = new Map<string, string>();
  children: TestElement[] = [];
  className = '';
  dataset: Record<string, string> = {};
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

  createElement(tagName: string): TestElement { return new TestElement(tagName, this); }

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
    rank: 4 - index, imageMedium: `https://img.example/${index}.jpg`,
  };
}

function fixture(search = '') {
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
  const status = new TestElement('div', document); status.dataset.status = ''; status.hidden = true;
  const count = new TestElement('p', document); count.dataset.resultCount = '';
  const pagination = new TestElement('nav', document); pagination.dataset.pagination = '';
  const data = new TestElement('script', document); data.setAttribute('id', 'catalog-data');
  data.textContent = JSON.stringify([catalogItem(1), catalogItem(2), catalogItem(3)]);
  const template = new TestTemplate(document); template.dataset.chromaCardTemplate = '';
  const card = new TestElement('article', document); card.className = 'chroma-card';
  const link = new TestElement('a', document);
  const imageWrap = new TestElement('div', document);
  const image = new TestElement('img', document); image.dataset.fallback = ''; image.dataset.placeholder = '';
  const badge = new TestElement('span', document); badge.className = 'new-badge';
  imageWrap.append(image, badge);
  const body = new TestElement('div', document);
  const eyebrow = new TestElement('p', document); eyebrow.className = 'eyebrow';
  const heading = new TestElement('h2', document);
  const english = new TestElement('p', document); english.dataset.nameEn = '';
  const category = new TestElement('span', document); category.className = 'category';
  body.append(eyebrow, heading, english, category);
  link.append(imageWrap, body); card.append(link); template.content.append(card);
  document.roots.push(form, list, status, count, pagination, template, data);

  const location = { search };
  const pushCalls: string[] = [];
  const replaceCalls: string[] = [];
  const updateLocation = (url: string) => { location.search = url.includes('?') ? url.slice(url.indexOf('?')) : ''; };
  const history = {
    pushState: (_state: unknown, _unused: string, url: string) => { pushCalls.push(url); updateLocation(url); },
    replaceState: (_state: unknown, _unused: string, url: string) => { replaceCalls.push(url); updateLocation(url); },
  };
  const listeners = new Map<string, EventListener>();
  const environment = {
    document: document as unknown as Document,
    history: history as unknown as History,
    location: location as unknown as Location,
    addEventListener: ((type: string, listener: EventListener) => listeners.set(type, listener)) as typeof globalThis.addEventListener,
    setTimeout: ((callback: () => void) => { callback(); return 0; }) as unknown as typeof globalThis.setTimeout,
  };
  return { document, form, list, status, count, pagination, location, pushCalls, replaceCalls, listeners, environment };
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

  it('normalizes a clamped initial page and keeps a visible page announcement', async () => {
    const page = fixture('?page=99&pageSize=1');
    const { initializeCatalogBrowser } = await import('./browser-app');

    initializeCatalogBrowser(page.environment);

    expect(page.replaceCalls).toEqual(['/?page=3&pageSize=1']);
    expect(page.location.search).toBe('?page=3&pageSize=1');
    expect(page.list.children[0].querySelector('h2')?.textContent).toBe('名称 3');
    expect(page.status.hidden).toBe(false);
    expect(page.status.textContent).toContain('3 件藏品');
    expect(page.status.textContent).toContain('3 / 3');
  });

  it('pushes submit/reset changes and normalizes a clamped popstate URL', async () => {
    const page = fixture('?pageSize=1');
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    page.form.controls.get('q')!.value = 'Name 2';

    page.form.dispatch('submit');
    page.form.dispatch('reset');
    page.location.search = '?page=99&pageSize=1&q=Name+2';
    page.listeners.get('popstate')!(new Event('popstate'));

    expect(page.pushCalls).toEqual(['/?pageSize=1&q=Name+2&sort=rank_desc', '/']);
    expect(page.replaceCalls.at(-1)).toBe('/?page=1&pageSize=1&q=Name+2');
    expect(page.form.controls.get('q')?.value).toBe('Name 2');
  });

  it('focuses the new current-page button and announces the page after pagination', async () => {
    const page = fixture('?pageSize=1');
    const { initializeCatalogBrowser } = await import('./browser-app');
    initializeCatalogBrowser(page.environment);
    const pageTwo = page.pagination.children.find((button) => button.dataset.page === '2')!;

    pageTwo.dispatch('click', true);

    expect(page.pushCalls).toEqual(['/?pageSize=1&page=2']);
    expect(page.document.activeElement?.dataset.page).toBe('2');
    expect(page.document.activeElement?.getAttribute('aria-current')).toBe('page');
    expect(page.status.hidden).toBe(false);
    expect(page.status.textContent).toContain('2 / 3');
  });
});
