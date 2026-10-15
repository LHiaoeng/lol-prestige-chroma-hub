export interface BreadcrumbMenuItem {
  title?: string;
  label?: string;
  href?: string;
  path?: string;
}

export interface BreadcrumbRouteItem {
  type?: undefined;
  title?: string;
  href?: string;
  path?: string;
  separator?: string;
  class?: string;
  menu?: { items: BreadcrumbMenuItem[] };
  [attribute: `data-${string}`]: string | number | undefined;
  [attribute: `aria-${string}`]: string | number | undefined;
}

export interface BreadcrumbSeparatorItem {
  type: 'separator';
  separator?: string;
}

export type BreadcrumbItem = BreadcrumbRouteItem | BreadcrumbSeparatorItem;

export interface BreadcrumbEntry {
  type: 'route' | 'separator';
  title?: string;
  href?: string;
  class?: string;
  menu?: BreadcrumbRouteItem['menu'];
  attributes?: Record<string, string | number>;
  separator?: string;
}

export function buildBreadcrumbEntries(
  items: BreadcrumbItem[],
  separator = '/',
  params: Record<string, string | number> = {},
): BreadcrumbEntry[] {
  const entries: BreadcrumbEntry[] = [];
  const paths: string[] = [];
  const fillParams = (value: string) => value.replace(/:([\w-]+)/g, (match, key: string) => String(params[key] ?? match));

  items.forEach((item, index) => {
    if (item.type === 'separator') {
      entries.push({ type: 'separator', separator: item.separator ?? '/' });
      return;
    }

    if (item.path !== undefined) paths.push(fillParams(item.path).replace(/^\//, ''));
    const href = item.path !== undefined ? `/${paths.join('/')}` : item.href;
    const attributes = Object.fromEntries(Object.entries(item).filter(([key, value]) => /^(data|aria)-/.test(key) && value !== undefined)) as Record<string, string | number>;

    entries.push({
      type: 'route',
      title: item.title === undefined ? undefined : fillParams(item.title),
      href,
      class: item.class,
      menu: item.menu,
      attributes,
      separator: items[index + 1]?.type === 'separator' ? '' : item.separator ?? (index === items.length - 1 ? '' : separator),
    });

    if (entries.at(-1)?.separator) entries.push({ type: 'separator', separator: entries.at(-1)?.separator });
  });

  return entries;
}
