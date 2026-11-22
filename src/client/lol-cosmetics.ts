import { enhanceSelect, refreshSelect } from '../components/select';
import { createDomainIcon, setDomainIconTooltip } from '../components/domain-icons';
import { createIcon } from '../components/icons/create-icon';
import { createPopover } from '../components/popover';
import { createSegmented } from '../components/Segmented';
import { cosmeticFilterValues, cosmeticLanguageUrl, cosmeticName, cosmeticRarity, filterLolCosmetics, orderSummonerIconTimeline, readLolCosmeticFilters, summonerIconTimelineKey, type LolCosmetic, type LolCosmeticCatalog } from '../domain/lol-cosmetics';
import { projectPbeIdDiff } from '../domain/pbe-additions';
import { communityDragonChannelLabel } from '../domain/communitydragon-url';
import type { RuntimeChannel } from '../domain/communitydragon-runtime';
import { hrefFor } from './runtime-reference-view-shared';
import { createCommunityDragonRuntime } from './communitydragon-runtime';

export function initLolCosmetics(root: HTMLElement) {
  const doc = root.ownerDocument;
  const find = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector)!;
  const isZh = root.dataset.locale === 'zh-cn';
  const language = isZh ? 'zh-CN' : 'en';
  const locale = isZh ? 'zh_cn' : 'default';
  const kind = root.dataset.lolCosmetics as LolCosmeticCatalog['slug'];
  const runtime = createCommunityDragonRuntime();
  const loadItems = {
    'summoner-icons': runtime.listSummonerIconCollection,
    emotes: runtime.listEmoteCollection,
    'ward-skins': runtime.listWardSkinCollection,
    'nexus-finishers': runtime.listNexusFinisherCollection,
  }[kind];
  const search = find<HTMLInputElement>('[data-query]');
  const pbe = find<HTMLInputElement>('[data-pbe]');
  const select = root.querySelector<HTMLSelectElement>('[data-category]');
  const raritySelect = root.querySelector<HTMLSelectElement>('[data-rarity-filter]');
  const sort = find<HTMLSelectElement>('[data-sort]');
  const viewSwitcher = root.querySelector<HTMLElement>('[data-cosmetic-view]');
  let view = 'cards';
  if (select) enhanceSelect(select);
  if (raritySelect) enhanceSelect(raritySelect);
  if (viewSwitcher) {
    new ResizeObserver(([entry]) => {
      if (entry) root.style.setProperty('--cosmetic-filter-height', `${entry.target.getBoundingClientRect().height}px`);
    }).observe(find('.tft-filterbar'));
  }
  enhanceSelect(sort);
  const total = find('[data-runtime-list-count]');
  const count = find('[data-tft-filter-count]');
  const grid = find('[data-grid]');
  let shown = 0;
  let timeline: HTMLOListElement | undefined;
  let yearGrid: HTMLElement | undefined;
  let yearKey: ReturnType<typeof summonerIconTimelineKey> | undefined;
  let loadObserver: IntersectionObserver | undefined;
  const more = find('[data-more-footer]');
  const skeleton = find('[data-skeleton]');
  const error = find('[data-error]');
  const compareNotice = find('[data-compare-notice]');
  const empty = find('[data-empty]');
  const reset = find<HTMLButtonElement>('[data-reset]');
  const channelButtons = root.querySelectorAll<HTMLButtonElement>('[data-runtime-channel]');
  const channelIcon = root.querySelector<SVGSVGElement>('.domain-icon--reference');
  const toggle = doc.querySelector<HTMLAnchorElement>('.language-toggle');
  const toggleHref = toggle?.href;
  let items: readonly LolCosmetic[] = [];
  let filtered: readonly LolCosmetic[] = [];
  let championNames = new Map<number, string>();
  let addedIds = new Set<number>();
  let category = '';
  let rarityFilter = '';
  let channel: RuntimeChannel = 'pbe';
  let request: AbortController | undefined;
  let ready = false;
  let composing = false;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  const cardCleanups: (() => void)[] = [];

  const label = (n: number) => isZh ? `${n} 项` : `${n} ${n === 1 ? 'item' : 'items'}`;
  const updateLanguage = () => {
    if (toggle && toggleHref) toggle.href = cosmeticLanguageUrl(toggleHref, new URL(location.href)).href;
  };

  function clearCards() {
    for (const cleanup of cardCleanups.splice(0)) cleanup();
    grid.replaceChildren();
    shown = 0;
    timeline = yearGrid = yearKey = undefined;
  }

  function card(item: LolCosmetic) {
    const name = cosmeticName(item, language);
    const article = doc.createElement('article');
    article.className = 'runtime-card tft-cosmetic-card';
    const media = doc.createElement('div');
    media.className = 'tft-cosmetic-card-media';
    const preview = doc.createElement('button');
    const finisher = item.kind === 'finisher' ? item : undefined;
    const largeImage = finisher?.splashUrl ?? item.iconUrl;
    preview.className = 'runtime-media-preview-trigger tft-cosmetic-card-preview';
    preview.type = 'button';
    preview.dataset.mediaPreviewTrigger = '';
    preview.dataset.previewKind = finisher?.videoUrl ? 'video' : 'image';
    preview.dataset.previewSrc = finisher?.videoUrl ?? largeImage ?? '';
    if (finisher?.videoUrl) {
      preview.dataset.previewAutoplay = '';
      if (largeImage) preview.dataset.previewPoster = largeImage;
      if (finisher.splashUrl) {
        preview.dataset.previewImage = finisher.splashUrl;
        if (item.iconUrl) preview.dataset.previewFallback = item.iconUrl;
      }
    } else if (finisher?.splashUrl && item.iconUrl) {
      preview.dataset.previewFallback = item.iconUrl;
    }
    preview.dataset.previewFilename = name;
    preview.setAttribute('aria-label', finisher?.videoUrl
      ? (isZh ? `预览终结特效：${name}` : `Preview finisher: ${name}`)
      : (isZh ? `查看大图：${name}` : `View image: ${name}`));
    const icon = doc.createElement('img');
    icon.loading = 'lazy';
    icon.decoding = 'async';
    icon.alt = name;
    const fallbackImage = doc.createElement('img');
    fallbackImage.className = 'cosmetic-missing-image';
    fallbackImage.src = '/placeholder.svg';
    fallbackImage.alt = '';
    fallbackImage.loading = 'lazy';
    fallbackImage.hidden = Boolean(item.iconUrl);
    preview.hidden = preview.disabled = !preview.dataset.previewSrc;
    if (item.iconUrl) {
      icon.addEventListener('error', () => {
        if (!finisher?.videoUrl && !finisher?.splashUrl) preview.hidden = preview.disabled = true;
        icon.hidden = true;
        fallbackImage.hidden = false;
      }, { once: true });
      icon.src = item.iconUrl;
    }
    const cover = doc.createElement('span');
    cover.className = 'tft-cosmetic-preview-cover';
    cover.setAttribute('aria-hidden', 'true');
    cover.append(createIcon('EyeOutlined'));
    preview.append(icon, cover);
    media.append(preview, fallbackImage);
    if (item.kind === 'finisher' && item.videoUrl) {
      const url = item.videoUrl;
      let hoverVideo: HTMLVideoElement | undefined;
      const stop = () => {
        const video = hoverVideo;
        if (!video) return;
        hoverVideo = undefined;
        video.pause();
        video.removeAttribute('src');
        video.load();
        video.remove();
      };
      article.addEventListener('pointerenter', (event) => {
        if (event.pointerType !== 'mouse' || hoverVideo || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const video = doc.createElement('video');
        hoverVideo = video;
        video.className = 'cosmetic-hover-video';
        video.hidden = true;
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.loop = true;
        video.setAttribute('aria-hidden', 'true');
        video.addEventListener('playing', () => { if (hoverVideo === video) video.hidden = false; });
        const failed = () => { if (hoverVideo === video) stop(); };
        video.addEventListener('error', failed, { once: true });
        media.append(video);
        video.src = url;
        void video.play().catch(failed);
      });
      article.addEventListener('pointerleave', stop);
      preview.addEventListener('click', stop);
      cardCleanups.push(stop);
    }
    const isAddition = addedIds.has(item.id);
    if (isAddition) {
      const marker = doc.createElement('span');
      marker.className = 'tft-arenas-pbe-marker';
      marker.textContent = 'PBE';
      media.append(marker);
    }
    const title = doc.createElement('div');
    title.className = 'tft-cosmetic-card-details';
    const heading = doc.createElement(timeline ? 'h3' : 'h2');
    const nameText = doc.createElement('span');
    nameText.className = 'tft-cosmetic-card-title-text';
    nameText.textContent = name;
    heading.append(nameText);
    title.append(heading);
    article.append(media, title);
    const rarity = cosmeticRarity(item);
    const rarityLabel = rarity?.label;
    if (rarityLabel) {
      const fallback = doc.createElement('span');
      fallback.className = 'cosmetic-rarity-label';
      fallback.textContent = rarityLabel;
      title.append(fallback);
      if (rarity.iconUrl) {
        const gem = doc.createElement('img');
        gem.className = 'cosmetic-rarity-gem';
        gem.alt = rarityLabel;
        gem.title = rarityLabel;
        gem.loading = 'lazy';
        fallback.hidden = true;
        gem.addEventListener('error', () => { gem.remove(); fallback.hidden = false; }, { once: true });
        gem.src = rarity.iconUrl;
        article.append(gem);
      }
    }
    const actions = doc.createElement('div');
    actions.className = 'tft-cosmetic-card-actions';
    const info = doc.createElement('button');
    info.className = 'ant-btn ant-btn-sm ant-btn-icon-only tft-cosmetic-info-button';
    info.type = 'button';
    const detailsLabel = isZh ? '外观详情' : 'Cosmetic details';
    info.setAttribute('aria-label', `${detailsLabel} · ${name}`);
    info.append(createIcon('InfoCircleOutlined'));
    actions.append(info);
    media.append(actions);
    const details = doc.createElement('dl');
    details.className = 'tft-cosmetic-card-popover';
    const detail = (label: string, value: string | HTMLElement | undefined, tagged = false) => {
      if (!value || (typeof value === 'string' && !value.trim())) return;
      const row = doc.createElement('div');
      row.className = 'tft-cosmetic-card-detail';
      const term = doc.createElement('dt');
      term.textContent = label;
      const description = doc.createElement('dd');
      if (typeof value !== 'string') {
        description.append(value);
      } else if (tagged) {
        const mark = doc.createElement('span');
        mark.className = 'cosmetic-detail-pbe';
        mark.textContent = value;
        description.append(mark);
      } else {
        description.textContent = value;
      }
      row.append(term, description);
      details.append(row);
    };
    detail(isZh ? '名称' : 'Name', name);
    if (isAddition) detail(isZh ? '版本' : 'Version', 'PBE', true);
    detail(isZh ? '品质' : 'Rarity', rarityLabel);
    if (item.kind === 'icon' && item.yearReleased) detail(isZh ? '发行年份' : 'Release year', String(item.yearReleased));
    if (item.kind === 'emote' && item.taggedChampionIds.length) {
      const links = doc.createElement('span');
      links.className = 'cosmetic-related-champions';
      for (const id of item.taggedChampionIds) {
        const link = doc.createElement('a');
        link.href = hrefFor(locale, 'champions', { id, channel }, 'detail').href;
        link.append(createDomainIcon('champions'), championNames.get(id) ?? (isZh ? `英雄 #${id}` : `Champion #${id}`));
        links.append(link);
      }
      detail(isZh ? '关联英雄' : 'Associated champions', links);
    }
    if ('description' in item) detail(isZh ? '描述' : 'Description', item.description);
    cardCleanups.push(createPopover(info, detailsLabel, details));
    return article;
  }

  function timelineGroup(item: LolCosmetic): HTMLElement {
    const key = summonerIconTimelineKey(item, addedIds);
    if (yearGrid && key === yearKey) return yearGrid;
    const node = doc.createElement('li');
    node.className = 'skin-catalog-timeline-node';
    const header = doc.createElement('div');
    header.className = 'skin-catalog-timeline-heading';
    const heading = doc.createElement('h2');
    heading.className = 'skin-catalog-timeline-date-heading';
    if (typeof key === 'number') {
      const time = doc.createElement('time');
      time.dateTime = String(key);
      time.textContent = isZh ? `${key} 年` : String(key);
      heading.append(time);
    } else {
      heading.textContent = key === 'pbe' ? (isZh ? 'PBE 新增' : 'PBE additions') : (isZh ? '发行年份未标注' : 'Release year unavailable');
    }
    header.append(heading);
    yearGrid = doc.createElement('div');
    yearGrid.className = 'tft-cosmetic-grid';
    node.append(header, yearGrid);
    timeline!.append(node);
    yearKey = key;
    return yearGrid;
  }

  function appendBatch() {
    const next = filtered[shown];
    if (!next) { more.hidden = true; return; }
    const target = timeline ? timelineGroup(next) : grid;
    const columns = Math.max(1, getComputedStyle(target).gridTemplateColumns.split(' ').length);
    const limit = Math.max(columns, Math.floor(48 / columns) * columns);
    const batch = filtered.slice(shown, shown + limit - (target.childElementCount % columns));
    for (const item of batch) (timeline ? timelineGroup(item) : grid).append(card(item));
    shown += batch.length;
    more.hidden = shown >= filtered.length;
    if (timeline) {
      timeline.classList.toggle('cosmetic-timeline--has-more', !more.hidden);
    }
    loadObserver?.unobserve(more);
    if (!more.hidden) loadObserver?.observe(more);
  }

  function render() {
    if (!ready) return;
    const direction = sort.value === 'oldest' ? 'oldest' : 'newest';
    filtered = filterLolCosmetics(items, search.value, category, language, direction, addedIds, rarityFilter);
    clearCards();
    const showTimeline = view === 'timeline';
    grid.classList.toggle('tft-cosmetic-grid', !showTimeline);
    grid.classList.toggle('skin-catalog-timeline', showTimeline);
    if (showTimeline && filtered.length) {
      filtered = orderSummonerIconTimeline(filtered, addedIds, direction);
      timeline = doc.createElement('ol');
      timeline.className = 'skin-catalog-timeline-list';
      grid.append(timeline);
    }
    count.textContent = label(filtered.length);
    empty.hidden = filtered.length !== 0;
    if (!empty.hidden) {
      const noAdditions = pbe.checked && items.length === 0;
      find('.ant-empty-description').textContent = noAdditions
        ? (isZh ? '本期暂无新增' : 'No PBE additions')
        : (isZh ? '当前筛选无匹配' : 'No matching items');
      reset.textContent = noAdditions ? (isZh ? '查看全部 PBE' : 'Show all PBE items') : (isZh ? '清除筛选' : 'Clear filters');
    }
    appendBatch();
  }

  function readUrl() {
    const state = readLolCosmeticFilters(new URL(location.href), Boolean(select), Boolean(raritySelect));
    search.value = state.query;
    channel = state.channel;
    pbe.checked = state.onlyPbeAdditions;
    category = state.category;
    rarityFilter = state.rarity;
    sort.value = state.sort;
    refreshSelect(sort);
    if (viewSwitcher) {
      const next = new URLSearchParams(location.search).get('view') === 'timeline' ? 'timeline' : 'cards';
      if (next !== view || !viewSwitcher.firstChild) {
        view = next;
        viewSwitcher.replaceChildren(createSegmented({
          name: 'summoner-icon-view',
          controls: 'cosmetic-grid',
          value: view,
          ariaLabel: isZh ? '展示方式' : 'View',
          options: [
            { value: 'cards', label: isZh ? '卡片' : 'Cards' },
            { value: 'timeline', label: isZh ? '时间轴' : 'Timeline' },
          ],
          onChange(value) {
            view = value;
            applySearch();
          },
        }));
      }
    }
    if (select) {
      select.value = category;
      refreshSelect(select);
    }
    if (raritySelect) {
      raritySelect.value = rarityFilter;
      refreshSelect(raritySelect);
    }
    updateLanguage();
  }

  function writeUrl() {
    const url = new URL(location.href);
    const params = {
      q: search.value.trim(),
      channel: channel === 'latest' ? 'latest' : '',
      pbe: channel === 'pbe' && pbe.checked ? '1' : '',
      category,
      rarity: rarityFilter,
      sort: sort.value === 'oldest' ? 'oldest' : '',
      view: view === 'timeline' ? 'timeline' : '',
    };
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== location.href) history.pushState(null, '', url);
    updateLanguage();
  }

  async function load() {
    request?.abort();
    const current = new AbortController();
    request = current;
    const { signal } = current;
    const selectedChannel = channel;
    const additionsOnly = selectedChannel === 'pbe' && pbe.checked;
    pbe.closest('label')!.hidden = selectedChannel === 'latest';
    const channelLabel = communityDragonChannelLabel(selectedChannel, locale);
    find('[data-runtime-channel-label]').textContent = channelLabel;
    channelButtons.forEach((button) => button.setAttribute('aria-checked', String(button.dataset.runtimeChannel === channel)));
    if (channelIcon) setDomainIconTooltip(channelIcon, 'reference', channelLabel, isZh ? 'zh-cn' : 'en');
    root.setAttribute('data-runtime-loading', '');
    ready = false;
    skeleton.hidden = false;
    error.hidden = empty.hidden = more.hidden = compareNotice.hidden = true;
    count.textContent = total.textContent = '';
    total.hidden = true;
    for (const control of [select, raritySelect]) {
      if (!control) continue;
      control.disabled = true;
      refreshSelect(control);
    }
    clearCards();
    try {
      const [selected, live, champions] = await Promise.all([
        loadItems({ locale, channel: selectedChannel, signal }),
        selectedChannel === 'pbe' ? loadItems({ locale, channel: 'latest', signal }).catch((failure: unknown) => {
          if (additionsOnly) throw failure;
          return undefined;
        }) : undefined,
        kind === 'emotes' ? runtime.list('champions', { locale, channel: selectedChannel, signal }) : [],
      ]);
      if (signal.aborted) return;
      const added = live ? projectPbeIdDiff<LolCosmetic>(selected, live) : [];
      addedIds = new Set(added.map(({ id }) => id));
      items = additionsOnly ? added : selected;
      compareNotice.hidden = selectedChannel !== 'pbe' || live !== undefined;
      championNames = new Map(champions.flatMap((entry) => entry.kind === 'champion' ? [[entry.id, entry.name] as const] : []));
      if (select) {
        const values = new Set(items.flatMap(cosmeticFilterValues));
        if (category) values.add(Number(category));
        const options = [...values].filter(Number.isSafeInteger).map((id) => [id, championNames.get(id) ?? String(id)] as const);
        options.sort((a, b) => kind === 'emotes' ? a[1].localeCompare(b[1], language) : b[0] - a[0]);
        select.replaceChildren(select.options[0]!, ...options.map(([id, name]) => new Option(name, String(id))));
        select.value = category;
        select.disabled = false;
        refreshSelect(select);
      }
      if (raritySelect) {
        const rarities = new Map<number, { label: string; iconUrl?: string }>();
        for (const item of selected) {
          const rarity = cosmeticRarity(item);
          if (rarity?.id && rarity.label) rarities.set(rarity.id, { label: rarity.label, iconUrl: rarity.iconUrl });
        }
        if (rarityFilter && !rarities.has(Number(rarityFilter))) {
          rarities.set(Number(rarityFilter), { label: isZh ? `品质 ${rarityFilter}` : `Rarity ${rarityFilter}` });
        }
        const options = [...rarities].sort(([a], [b]) => b - a);
        raritySelect.replaceChildren(raritySelect.options[0]!, ...options.map(([id, rarity]) => {
          const option = new Option(rarity.label, String(id));
          if (rarity.iconUrl) option.dataset.selectIconSrc = rarity.iconUrl;
          return option;
        }));
        raritySelect.value = rarityFilter;
        raritySelect.disabled = false;
        refreshSelect(raritySelect);
      }
      total.textContent = label(items.length);
      total.hidden = false;
      ready = true;
      render();
    } catch {
      if (!signal.aborted) error.hidden = false;
    } finally {
      if (!signal.aborted) {
        skeleton.hidden = true;
        root.removeAttribute('data-runtime-loading');
      }
    }
  }

  function applySearch() {
    clearTimeout(debounce);
    writeUrl();
    render();
  }

  search.addEventListener('compositionstart', () => { clearTimeout(debounce); composing = true; });
  search.addEventListener('compositionend', () => { composing = false; debounce = setTimeout(applySearch, 200); });
  search.addEventListener('input', () => {
    clearTimeout(debounce);
    if (!composing) debounce = setTimeout(applySearch, 200);
  });
  search.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !composing && !event.isComposing) applySearch();
  });
  select?.addEventListener('change', () => { category = select.value; applySearch(); });
  raritySelect?.addEventListener('change', () => { rarityFilter = raritySelect.value; applySearch(); });
  sort.addEventListener('change', applySearch);
  pbe.addEventListener('change', () => { clearTimeout(debounce); writeUrl(); void load(); });
  channelButtons.forEach((button) => button.addEventListener('click', () => {
    const selected = button.dataset.runtimeChannel === 'latest' ? 'latest' : 'pbe';
    if (channel === selected) return;
    channel = selected;
    if (channel === 'latest') pbe.checked = false;
    pbe.dispatchEvent(new Event('change'));
  }));
  find('[data-retry]').addEventListener('click', load);
  find('[data-compare-retry]').addEventListener('click', load);
  reset.addEventListener('click', () => {
    if (pbe.checked && items.length === 0) {
      pbe.checked = false;
      writeUrl();
      void load();
    } else {
      search.value = category = rarityFilter = '';
      for (const control of [select, raritySelect]) {
        if (!control) continue;
        control.value = '';
        refreshSelect(control);
      }
      applySearch();
    }
    search.focus();
  });
  find('[data-more]').addEventListener('click', appendBatch);
  if ('IntersectionObserver' in window) {
    loadObserver = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !more.hidden) appendBatch();
    }, { rootMargin: '200px' });
  }
  window.addEventListener('popstate', () => {
    clearTimeout(debounce);
    const previousChannel = channel;
    const wasPbe = pbe.checked;
    readUrl();
    if (previousChannel !== channel || wasPbe !== pbe.checked) void load();
    else render();
  });
  readUrl();
  void load();
}
