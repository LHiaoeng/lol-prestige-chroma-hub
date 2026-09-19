import type { ListingItem } from '../domain/listing-payload';

export interface ListingStrings {
  search: string;
  nameAsc: string;
  idAsc: string;
  countDesc: string;
  empty: string;
  loading: string;
  showing: string;
  of: string;
  prev: string;
  next: string;
}

const STRINGS: Record<string, ListingStrings> = {
  en: {
    search: 'Search',
    nameAsc: 'Name A–Z',
    idAsc: 'ID ↑',
    countDesc: 'Most first',
    empty: 'No matches',
    loading: 'Loading…',
    showing: 'Showing',
    of: 'of',
    prev: 'Previous',
    next: 'Next',
  },
  'zh-cn': {
    search: '搜索',
    nameAsc: '名称 A–Z',
    idAsc: 'ID ↑',
    countDesc: '数量优先',
    empty: '没有匹配结果',
    loading: '加载中…',
    showing: '显示',
    of: '/',
    prev: '上一页',
    next: '下一页',
  },
};

export type SortKey = 'name' | 'id' | 'count';

export function filterItems(items: ListingItem[], query: string): ListingItem[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;
  return items.filter((item) => {
    const haystack = `${item.name} ${item.meta ?? ''}`.toLowerCase();
    return terms.every((term) => haystack.includes(term));
  });
}

export function sortItems(items: ListingItem[], sort: SortKey): ListingItem[] {
  const copy = [...items];
  switch (sort) {
    case 'name':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    case 'id':
      return copy.sort((a, b) => a.id - b.id);
    case 'count':
      return copy.sort((a, b) => (b.meta ?? '').localeCompare(a.meta ?? ''));
  }
}

export function paginate<T>(items: T[], page: number, perPage: number): T[] {
  const start = Math.max(0, (page - 1) * perPage);
  return items.slice(start, start + perPage);
}

const PAGE_SIZE = 60;

function createCard(item: ListingItem): HTMLElement {
  if (item.image) {
    const article = document.createElement('article');
    article.className = 'pbe-skin-card';
    const anchor = document.createElement('a');
    anchor.href = item.href;
    const image = document.createElement('div');
    image.className = 'pbe-skin-image';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    image.appendChild(img);
    const body = document.createElement('div');
    body.className = 'pbe-skin-body';
    const strong = document.createElement('strong');
    strong.textContent = item.name;
    const span = document.createElement('span');
    span.textContent = item.meta ?? '';
    body.append(strong, span);
    anchor.append(image, body);
    article.appendChild(anchor);
    return article;
  }
  const anchor = document.createElement('a');
  anchor.className = 'pbe-card';
  anchor.href = item.href;
  const eyebrow = document.createElement('p');
  eyebrow.className = 'eyebrow';
  eyebrow.textContent = String(item.id);
  const heading = document.createElement('h3');
  heading.textContent = item.name;
  anchor.append(eyebrow, heading);
  if (item.meta) {
    const meta = document.createElement('p');
    meta.textContent = item.meta;
    anchor.appendChild(meta);
  }
  return anchor;
}

export function initListing(root: HTMLElement): void {
  const url = root.dataset.url;
  const localeKey = root.dataset.locale ?? 'en';
  const t = STRINGS[localeKey] ?? STRINGS.en;

  const toolbar = document.createElement('div');
  toolbar.className = 'listing-toolbar';
  const search = document.createElement('input');
  search.type = 'search';
  search.className = 'listing-search';
  search.placeholder = t.search;
  search.setAttribute('aria-label', t.search);
  const sort = document.createElement('select');
  sort.className = 'listing-sort';
  sort.setAttribute('aria-label', t.search);
  for (const [value, label] of [
    ['name', t.nameAsc],
    ['id', t.idAsc],
    ['count', t.countDesc],
  ] as const) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    sort.appendChild(option);
  }
  toolbar.append(search, sort);

  const grid = document.createElement('div');
  grid.className = 'pbe-grid';

  const status = document.createElement('p');
  status.className = 'status';
  status.setAttribute('role', 'status');
  status.textContent = t.loading;

  const pager = document.createElement('div');
  pager.className = 'listing-pager';

  root.replaceChildren(toolbar, grid, status, pager);

  let all: ListingItem[] = [];
  let page = 1;

  const render = () => {
    const filtered = filterItems(all, search.value);
    const sorted = sortItems(filtered, sort.value as SortKey);
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    page = Math.min(page, totalPages);
    const slice = paginate(sorted, page, PAGE_SIZE);
    grid.replaceChildren(...slice.map(createCard));
    status.textContent = sorted.length
      ? `${t.showing} ${slice.length} ${t.of} ${sorted.length}`
      : t.empty;
    const prev = document.createElement('button');
    prev.type = 'button';
    prev.textContent = t.prev;
    prev.disabled = page <= 1;
    prev.addEventListener('click', () => {
      page -= 1;
      render();
    });
    const next = document.createElement('button');
    next.type = 'button';
    next.textContent = t.next;
    next.disabled = page >= totalPages;
    next.addEventListener('click', () => {
      page += 1;
      render();
    });
    pager.replaceChildren(prev, next);
  };

  search.addEventListener('input', () => {
    page = 1;
    render();
  });
  sort.addEventListener('change', render);

  fetch(url!)
    .then((response) => {
      if (!response.ok) throw new Error(`Listing request failed: ${response.status}`);
      return response.json();
    })
    .then((payload: { items: ListingItem[] }) => {
      all = payload.items ?? [];
      render();
    })
    .catch((error) => {
      status.textContent = String(error);
    });
}
