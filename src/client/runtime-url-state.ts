const positiveInteger = /^[1-9]\d*$/;

export interface RuntimeUrlState {
  readonly id?: string;
  readonly champion?: string;
  readonly channel?: 'pbe' | 'latest';
}

function readPositiveInteger(value: string | null): string | undefined {
  if (!value || !positiveInteger.test(value)) return undefined;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? String(parsed) : undefined;
}

export function readRuntimeUrlState(url: URL): RuntimeUrlState {
  const id = readPositiveInteger(url.searchParams.get('id'));
  const champion = readPositiveInteger(url.searchParams.get('champion'));
  const rawChannel = url.searchParams.get('channel');
  const channel = rawChannel === 'pbe' || rawChannel === 'latest' ? rawChannel : undefined;
  return { id, champion, channel };
}

function queryFor(state: RuntimeUrlState, include: readonly ('id' | 'champion' | 'channel')[]): string {
  const params = new URLSearchParams();
  for (const key of include) {
    const value = state[key];
    if (value !== undefined) params.set(key, value);
  }
  return params.toString();
}

function browserUrl(document: Document): URL | undefined {
  const href = document.defaultView?.location.href;
  return href ? new URL(href) : undefined;
}

function targetUrl(anchor: HTMLAnchorElement, currentUrl: URL): URL | undefined {
  const href = anchor.getAttribute('href');
  return href ? new URL(href, currentUrl) : undefined;
}

function updateAnchor(anchor: HTMLAnchorElement, target: URL): void {
  anchor.setAttribute('href', `${target.pathname}${target.search}${target.hash}`);
}

export function bindRuntimeLanguageToggle(document: Document, currentUrl = browserUrl(document)): void {
  if (!currentUrl) return;
  const toggle = document.querySelector<HTMLAnchorElement>('.language-toggle');
  if (!toggle) return;
  const target = targetUrl(toggle, currentUrl);
  if (!target) return;
  target.search = queryFor(readRuntimeUrlState(currentUrl), ['id', 'champion', 'channel']);
  updateAnchor(toggle, target);
}

export function bindRuntimeChannelLinks(document: Document, currentUrl = browserUrl(document)): void {
  if (!currentUrl) return;
  const state = readRuntimeUrlState(currentUrl);
  document.querySelectorAll<HTMLAnchorElement>('[data-runtime-channel-link]').forEach((anchor) => {
    const target = targetUrl(anchor, currentUrl);
    if (!target) return;
    target.searchParams.delete('channel');
    if (state.channel) target.searchParams.set('channel', state.channel);
    updateAnchor(anchor, target);
  });
}
