import { bindImageFallbacks } from '../client/image-fallback';
import { sourceImageUrl } from '../domain/chroma';
import { currentLanguage } from '../client/language';
import { localized } from '../i18n';
import { chromaImageAlt } from '../seo/chroma-seo';
import { buildPages } from '../components/pagination/pagination';
import {
  parseCatalogQuery,
  queryCatalog,
  type BrowserCatalogItem,
  type CatalogResult,
} from './browser-catalog';

const PAGINATION_CHEVRON_LEFT = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>';
const PAGINATION_CHEVRON_RIGHT = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

export interface CatalogBrowserEnvironment {
  document: Document;
  history: History;
  location: Location;
  addEventListener: typeof globalThis.addEventListener;
  setTimeout: typeof globalThis.setTimeout;
}

export function initializeCatalogBrowser(environment: CatalogBrowserEnvironment): void {
  const { document, history, location } = environment;
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const list = document.querySelector<HTMLElement>('[data-chroma-list]');
  const status = document.querySelector<HTMLElement>('[data-status]');
  const count = document.querySelector<HTMLElement>('[data-result-count]');
  const pagination = document.querySelector<HTMLElement>('[data-pagination]');
  const template = document.querySelector<HTMLTemplateElement>('[data-chroma-card-template]');
  const catalogData = document.querySelector<HTMLScriptElement>('#catalog-data');
  const pagePath = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;

  function createCard(item: BrowserCatalogItem): HTMLElement {
    if (!template) throw new Error('Missing catalog card template');
    const card = template.content.firstElementChild?.cloneNode(true);
    if (!(card instanceof HTMLElement)) throw new Error('Invalid catalog card template');

    const link = card.querySelector<HTMLAnchorElement>('a');
    const image = card.querySelector<HTMLImageElement>('img');
    const categoryIcon = card.querySelector<HTMLImageElement>('.category-icon');
    const badge = card.querySelector<HTMLElement>('.new-badge');
    const versionTag = card.querySelector<HTMLElement>('.version-tag');
    const name = card.querySelector<HTMLElement>('h2');
    if (!link || !image || !categoryIcon || !badge || !versionTag || !name) {
      throw new Error('Invalid catalog card template');
    }

    link.href = `${pagePath}chromas/${encodeURIComponent(item.slug)}/`;
    const language = currentLanguage(document);
    const itemName = localized(language, { en: item.nameEn, zh: item.nameZh });
    const heroName = localized(language, { en: item.heroNameEn, zh: item.heroNameZh });
    link.setAttribute('aria-label', localized(language, { en: `View ${itemName} details`, zh: `查看 ${itemName} 详情` }));
    image.src = item.imageMedium;
    image.dataset.fallback = sourceImageUrl('medium', item.instanceId);
    image.dataset.placeholder = '/placeholder.svg';
    image.alt = localized(language, { en: chromaImageAlt(item.nameEn), zh: `${heroName} ${itemName} 臻彩皮肤` });
    categoryIcon.src = item.imageTag;
    badge.hidden = !item.isNew;
    versionTag.textContent = item.gameVer;
    name.textContent = itemName;
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

  function renderPagination(result: CatalogResult, focusCurrent: boolean): void {
    if (!pagination) return;
    const { page, pages } = result.pagination;
    if (pages <= 1) {
      pagination.replaceChildren();
      return;
    }
    const language = currentLanguage(document);
    const prevText = language === 'zh' ? '上一页' : 'Previous';
    const nextText = language === 'zh' ? '下一页' : 'Next';
    const list = document.createElement('ul');
    list.className = 'cn-pagination-list';
    let currentButton: HTMLButtonElement | null = null;

    const addItem = (child: HTMLElement): void => {
      const li = document.createElement('li');
      li.className = 'cn-pagination-item';
      li.append(child);
      list.append(li);
    };

    if (page > 1) {
      const prev = document.createElement('button');
      prev.type = 'button';
      prev.className = 'cn-pagination-link cn-pagination-previous';
      prev.dataset.page = String(page - 1);
      prev.setAttribute('aria-label', prevText);
      prev.innerHTML = `${PAGINATION_CHEVRON_LEFT}<span class="cn-pagination-text">${prevText}</span>`;
      addItem(prev);
    }

    for (const entry of buildPages(page, pages)) {
      if (entry === '...') {
        const ellipsis = document.createElement('span');
        ellipsis.className = 'cn-pagination-ellipsis';
        ellipsis.setAttribute('aria-hidden', 'true');
        ellipsis.textContent = '…';
        addItem(ellipsis);
        continue;
      }
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.page = String(entry);
      btn.textContent = String(entry);
      btn.setAttribute('aria-label', `Page ${entry}`);
      btn.className = `cn-pagination-link${entry === page ? ' is-active' : ''}`;
      if (entry === page) {
        btn.setAttribute('aria-current', 'page');
        currentButton = btn;
      }
      addItem(btn);
    }

    if (page < pages) {
      const next = document.createElement('button');
      next.type = 'button';
      next.className = 'cn-pagination-link cn-pagination-next';
      next.dataset.page = String(page + 1);
      next.setAttribute('aria-label', nextText);
      next.innerHTML = `<span class="cn-pagination-text">${nextText}</span>${PAGINATION_CHEVRON_RIGHT}`;
      addItem(next);
    }

    pagination.replaceChildren(list);
    if (focusCurrent) currentButton?.focus();
  }

  function render(
    items: BrowserCatalogItem[],
    params: URLSearchParams,
    historyMode: 'push' | 'replace' | null,
    focusPagination = false,
  ): void {
    if (!list || !status) throw new Error('Missing catalog page elements');
    const result = queryCatalog(items, parseCatalogQuery(params));
    list.replaceChildren(...result.items.map(createCard));
    bindImageFallbacks(document);
    const language = currentLanguage(document);
    if (count) count.textContent = localized(language, { en: `${result.pagination.total} prestige chromas`, zh: `共 ${result.pagination.total} 款臻彩` });
    status.className = 'status';
    status.hidden = false;
    const announcement = localized(language, {
      en: `${result.pagination.total} prestige chromas, page ${result.pagination.page} of ${Math.max(result.pagination.pages, 1)}`,
      zh: `共 ${result.pagination.total} 款臻彩，第 ${result.pagination.page} / ${Math.max(result.pagination.pages, 1)} 页`,
    });
    status.textContent = result.items.length > 0 ? announcement : localized(language, {
      en: `No prestige chromas match these filters. Clear the filters and try again. ${announcement}`,
      zh: `没有符合条件的臻彩。请清除筛选后重试。${announcement}`,
    });
    renderPagination(result, focusPagination);

    const normalized = new URLSearchParams(params);
    if (normalized.has('page')) normalized.set('page', String(result.pagination.page));
    if (historyMode && (historyMode === 'push' || normalized.toString() !== params.toString())) {
      const query = normalized.toString();
      history[`${historyMode}State`]({}, '', query ? `${pagePath}?${query}` : pagePath);
    }
  }

  function showError(): void {
    if (!status) return;
    status.hidden = false;
    status.className = 'status error';
    status.textContent = localized(currentLanguage(document), { en: 'Unable to load. Please try again later.', zh: '加载失败，请稍后重试。' });
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
    bindImageFallbacks(document);
    if (!form || !list || !status || !pagination || !template || !catalogData) {
      showError();
      return;
    }

    try {
      const items = JSON.parse(catalogData.textContent ?? '') as BrowserCatalogItem[];
      if (!Array.isArray(items)) throw new Error('Invalid embedded catalog');
      const initial = new URLSearchParams(location.search);
      syncForm(initial);
      render(items, initial, 'replace');

      form.addEventListener('submit', (event) => {
        event.preventDefault();
        try { render(items, formQuery(), 'push'); } catch { showError(); }
      });
      form.addEventListener('reset', () => {
        environment.setTimeout(() => {
          try { render(items, new URLSearchParams(), 'push'); } catch { showError(); }
        });
      });
      pagination.addEventListener('click', (event) => {
        const target = event.target;
        const button = target instanceof HTMLElement ? target.closest<HTMLElement>('[data-page]') : null;
        if (!button?.dataset.page) return;
        const params = new URLSearchParams(location.search);
        params.set('page', button.dataset.page);
        try { render(items, params, 'push', true); } catch { showError(); }
      });
      environment.addEventListener('popstate', () => {
        const params = new URLSearchParams(location.search);
        syncForm(params);
        try { render(items, params, 'replace'); } catch { showError(); }
      });
    } catch {
      showError();
    }
  }

  start();
}

if (typeof document !== 'undefined') {
  initializeCatalogBrowser({
    document,
    history,
    location,
    addEventListener: globalThis.addEventListener.bind(globalThis),
    setTimeout: globalThis.setTimeout.bind(globalThis),
  });
}
