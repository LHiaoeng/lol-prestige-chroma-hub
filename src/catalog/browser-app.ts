import { sourceImageUrl } from '../domain/chroma';
import {
  parseCatalogQuery,
  queryCatalog,
  type BrowserCatalogItem,
  type CatalogResult,
} from './browser-catalog';

const form = document.querySelector<HTMLFormElement>('[data-filters]');
const list = document.querySelector<HTMLElement>('[data-chroma-list]');
const status = document.querySelector<HTMLElement>('[data-status]');
const count = document.querySelector<HTMLElement>('[data-result-count]');
const pagination = document.querySelector<HTMLElement>('[data-pagination]');
const template = document.querySelector<HTMLTemplateElement>('[data-chroma-card-template]');
const catalogData = document.querySelector<HTMLScriptElement>('#catalog-data');

function bindImageFallback(image: HTMLImageElement): void {
  if (image.dataset.fallbackBound) return;
  image.dataset.fallbackBound = 'true';
  image.addEventListener('error', () => {
    if (image.dataset.fallbackStage === 'placeholder') return;
    if (image.dataset.fallbackStage !== 'fallback') {
      image.dataset.fallbackStage = 'fallback';
      image.src = image.dataset.fallback ?? image.dataset.placeholder ?? '/placeholder.svg';
      return;
    }
    image.dataset.fallbackStage = 'placeholder';
    image.src = image.dataset.placeholder ?? '/placeholder.svg';
  });
}

function createCard(item: BrowserCatalogItem): HTMLElement {
  if (!template) throw new Error('Missing catalog card template');
  const card = template.content.firstElementChild?.cloneNode(true);
  if (!(card instanceof HTMLElement)) throw new Error('Invalid catalog card template');

  const link = card.querySelector<HTMLAnchorElement>('a');
  const image = card.querySelector<HTMLImageElement>('img');
  const badge = card.querySelector<HTMLElement>('.new-badge');
  const eyebrow = card.querySelector<HTMLElement>('.eyebrow');
  const nameZh = card.querySelector<HTMLElement>('h2');
  const nameEn = card.querySelector<HTMLElement>('[data-name-en]');
  const category = card.querySelector<HTMLElement>('.category');
  if (!link || !image || !badge || !eyebrow || !nameZh || !nameEn || !category) {
    throw new Error('Invalid catalog card template');
  }

  link.href = `/chromas/${encodeURIComponent(item.slug)}/`;
  link.setAttribute('aria-label', `查看 ${item.nameZh} 详情`);
  image.src = item.imageMedium;
  image.dataset.fallback = sourceImageUrl('medium', item.instanceId);
  image.dataset.placeholder = '/placeholder.svg';
  image.alt = `${item.heroNameZh} ${item.nameZh} 臻彩皮肤`;
  badge.hidden = !item.isNew;
  eyebrow.textContent = `${item.heroNameZh} · ${item.gameVer}`;
  nameZh.textContent = item.nameZh;
  nameEn.textContent = item.nameEn;
  category.textContent = item.categoryName;
  bindImageFallback(image);

  return card;
}

function syncForm(params: URLSearchParams): void {
  if (!form) return;
  const query = parseCatalogQuery(params);
  const values: Record<string, string> = {
    q: query.q ?? '',
    hero: query.hero ?? '',
    version: query.version ?? '',
    category: query.category ?? '',
    isNew: query.isNew === undefined ? '' : String(query.isNew),
    sort: query.sort,
  };
  for (const [name, value] of Object.entries(values)) {
    const control = form.elements.namedItem(name);
    if (control instanceof HTMLInputElement || control instanceof HTMLSelectElement) control.value = value;
  }
}

function renderPagination(result: CatalogResult): void {
  if (!pagination) return;
  const { page, pages } = result.pagination;
  const firstPage = Math.max(1, page - 2);
  const lastPage = Math.min(pages, page + 2);
  const buttons: HTMLButtonElement[] = [];
  for (let pageNumber = firstPage; pageNumber <= lastPage; pageNumber += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.page = String(pageNumber);
    button.textContent = String(pageNumber);
    if (pageNumber === page) button.setAttribute('aria-current', 'page');
    buttons.push(button);
  }
  pagination.replaceChildren(...buttons);
}

function render(items: BrowserCatalogItem[], params: URLSearchParams, push: boolean): void {
  if (!list || !status || !count) throw new Error('Missing catalog page elements');
  const result = queryCatalog(items, parseCatalogQuery(params));
  list.replaceChildren(...result.items.map(createCard));
  count.textContent = `${result.pagination.total} 件藏品`;
  status.className = 'status';
  status.hidden = result.items.length > 0;
  status.textContent = result.items.length > 0 ? '' : '没有符合条件的臻彩。请清除筛选后重试。';
  renderPagination(result);
  if (push) {
    const query = params.toString();
    history.pushState({}, '', query ? `/?${query}` : '/');
  }
}

function showError(): void {
  if (!status) return;
  status.hidden = false;
  status.className = 'status error';
  status.textContent = '加载失败，请稍后重试。';
}

function formQuery(): URLSearchParams {
  if (!form) return new URLSearchParams();
  const params = new URLSearchParams(location.search);
  for (const name of ['q', 'hero', 'version', 'category', 'isNew', 'sort']) {
    const control = form.elements.namedItem(name);
    if (!(control instanceof HTMLInputElement || control instanceof HTMLSelectElement)) continue;
    if (control.value) params.set(name, control.value);
    else params.delete(name);
  }
  params.delete('page');
  return params;
}

function start(): void {
  document.querySelectorAll<HTMLImageElement>('img[data-fallback]').forEach(bindImageFallback);
  if (!form || !list || !status || !count || !pagination || !template || !catalogData) {
    showError();
    return;
  }

  try {
    const items = JSON.parse(catalogData.textContent ?? '') as BrowserCatalogItem[];
    if (!Array.isArray(items)) throw new Error('Invalid embedded catalog');
    const initial = new URLSearchParams(location.search);
    syncForm(initial);
    render(items, initial, false);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      try { render(items, formQuery(), true); } catch { showError(); }
    });
    form.addEventListener('reset', () => {
      setTimeout(() => {
        try { render(items, new URLSearchParams(), true); } catch { showError(); }
      });
    });
    pagination.addEventListener('click', (event) => {
      const target = event.target;
      const button = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-page]') : null;
      if (!button?.dataset.page) return;
      const params = new URLSearchParams(location.search);
      params.set('page', button.dataset.page);
      try { render(items, params, true); } catch { showError(); }
    });
    addEventListener('popstate', () => {
      const params = new URLSearchParams(location.search);
      syncForm(params);
      try { render(items, params, false); } catch { showError(); }
    });
  } catch {
    showError();
  }
}

start();
