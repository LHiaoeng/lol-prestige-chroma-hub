import { bindImageFallbacks } from '../client/image-fallback';
import { sourceImageUrl } from '../domain/chroma';
import { currentLanguage } from '../client/language';
import { localized } from '../i18n';
import { chromaImageAlt } from '../seo/chroma-seo';
import { localizedPath } from '../i18n/config';
import {
  parseCatalogQuery,
  queryCatalog,
  type BrowserCatalogItem,
} from './browser-catalog';

export interface CatalogBrowserEnvironment {
  document: Document;
  history: History;
  location: Location;
  addEventListener: typeof globalThis.addEventListener;
  setTimeout: typeof globalThis.setTimeout;
  requestAnimationFrame: typeof globalThis.requestAnimationFrame;
  getComputedStyle: typeof globalThis.getComputedStyle;
  innerHeight: number;
}

export function initializeCatalogBrowser(environment: CatalogBrowserEnvironment): void {
  const { document, history, location } = environment;
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const list = document.querySelector<HTMLElement>('[data-chroma-list]');
  const status = document.querySelector<HTMLElement>('[data-status]');
  const count = document.querySelector<HTMLElement>('[data-result-count]');
  const template = document.querySelector<HTMLTemplateElement>('[data-chroma-card-template]');
  const catalogData = document.querySelector<HTMLScriptElement>('#catalog-data');
  const locale = currentLanguage(document) === 'zh' ? 'zh-cn' : 'en';
  let matches: BrowserCatalogItem[] = [];
  let visible = 0;
  let scheduled = false;
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

    link.href = localizedPath(locale, `/chromas/${encodeURIComponent(item.slug)}/`);
    const language = currentLanguage(document);
    const itemName = localized(language, { en: item.nameEn, zh: item.nameZh });
    link.setAttribute('aria-label', localized(language, { en: `View ${itemName} details`, zh: `查看 ${itemName} 详情` }));
    image.src = item.imageMedium;
    image.dataset.fallback = sourceImageUrl('medium', item.instanceId);
    image.dataset.placeholder = '/placeholder.svg';
    image.alt = chromaImageAlt(itemName, locale);
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

  function appendBatch(): void {
    if (!list || visible >= matches.length) return;
    const tracks = environment.getComputedStyle(list).gridTemplateColumns;
    const columns = Math.max(1, tracks.split(' ').filter(Boolean).length);
    const end = Math.min(matches.length, Math.floor((visible + 24) / columns) * columns);
    list.append(...matches.slice(visible, end).map(createCard));
    visible = end;
    bindImageFallbacks(list);
    announce();
  }

  function announce(): void {
    if (!status) return;
    status.className = matches.length ? 'status sr-only' : 'status';
    status.hidden = false;
    status.textContent = matches.length
      ? localized(currentLanguage(document), {
          en: `Showing ${visible} of ${matches.length} prestige chromas.`,
          zh: `已显示 ${visible} / ${matches.length} 款臻彩。`,
        })
      : localized(currentLanguage(document), {
          en: 'No prestige chromas match these filters. Clear the filters and try again.',
          zh: '没有符合条件的臻彩。请清除筛选后重试。',
        });
  }

  function scheduleAppend(): void {
    if (scheduled || visible >= matches.length) return;
    scheduled = true;
    environment.requestAnimationFrame(() => {
      scheduled = false;
      try {
        if (list && list.getBoundingClientRect().bottom <= environment.innerHeight + 200) {
          appendBatch();
          scheduleAppend();
        }
      } catch { showError(); }
    });
  }

  function render(
    items: BrowserCatalogItem[],
    params: URLSearchParams,
    historyMode: 'push' | 'replace',
  ): void {
    if (!list || !status) throw new Error('Missing catalog page elements');
    const query = parseCatalogQuery(params);
    matches = queryCatalog(items, { ...query, page: 1, pageSize: Math.max(items.length, 1) }).items;
    list.replaceChildren();
    delete list.dataset.staticBatch;
    visible = 0;
    appendBatch();
    announce();
    if (count) count.textContent = localized(currentLanguage(document), {
      en: `${matches.length} prestige chromas`,
      zh: `共 ${matches.length} 款臻彩`,
    });

    const normalized = new URLSearchParams(params);
    normalized.delete('page');
    normalized.delete('pageSize');
    const search = normalized.toString();
    if (historyMode === 'push' || search !== params.toString()) {
      history[`${historyMode}State`]({}, '', search ? `${pagePath}?${search}` : pagePath);
    }
    const toggle = document.querySelector<HTMLAnchorElement>('.language-toggle');
    if (toggle) toggle.href = localizedPath(locale === 'en' ? 'zh-cn' : 'en', `${pagePath}${search ? `?${search}` : ''}`);
    scheduleAppend();
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
    if (!form || !list || !status || !template || !catalogData) {
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
          const params = new URLSearchParams();
          syncForm(params);
          try { render(items, params, 'push'); } catch { showError(); }
        });
      });
      environment.addEventListener('scroll', scheduleAppend, { passive: true });
      environment.addEventListener('resize', scheduleAppend);
      list.addEventListener('load', scheduleAppend, true);
      list.addEventListener('error', scheduleAppend, true);
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
    requestAnimationFrame: globalThis.requestAnimationFrame.bind(globalThis),
    getComputedStyle: globalThis.getComputedStyle.bind(globalThis),
    get innerHeight() { return globalThis.innerHeight; },
  });
}
