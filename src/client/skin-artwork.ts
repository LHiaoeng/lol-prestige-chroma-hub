export type ArtworkKind = 'static' | 'animated';
export type ArtworkFocus = 'focused' | 'unfocused';

export interface ArtworkOption {
  kind: ArtworkKind;
  focus: ArtworkFocus;
}

interface ArtworkDownloadFilenameInput extends ArtworkOption {
  nameEn: string;
  nameZh?: string;
  locale?: string;
  url: string;
}

const artworkPriority: readonly ArtworkOption[] = [
  { kind: 'animated', focus: 'focused' },
  { kind: 'animated', focus: 'unfocused' },
  { kind: 'static', focus: 'focused' },
  { kind: 'static', focus: 'unfocused' },
];

const sameArtwork = (left: ArtworkOption, right: ArtworkOption): boolean => left.kind === right.kind && left.focus === right.focus;
const includesArtwork = (options: readonly ArtworkOption[], candidate: ArtworkOption): boolean => options.some((option) => sameArtwork(option, candidate));

export function choosePreferredArtwork(options: readonly ArtworkOption[]): ArtworkOption | null {
  return artworkPriority.find((candidate) => includesArtwork(options, candidate)) ?? null;
}

export function chooseArtworkOnKindClick(
  options: readonly ArtworkOption[],
  current: ArtworkOption,
  requestedKind: ArtworkKind,
): ArtworkOption | null {
  const requested = options.filter((option) => option.kind === requestedKind);
  if (requested.length === 0) return includesArtwork(options, current) ? current : choosePreferredArtwork(options);

  if (current.kind === requestedKind && requested.length > 1) {
    const currentIndex = Math.max(0, requested.findIndex((option) => option.focus === current.focus));
    return requested[(currentIndex + 1) % requested.length] ?? requested[0] ?? null;
  }

  return requested.find((option) => option.focus === current.focus)
    ?? requested.find((option) => option.focus === 'focused')
    ?? requested[0]
    ?? null;
}

export function chooseArtworkAfterRemoval(
  options: readonly ArtworkOption[],
  current: ArtworkOption,
): ArtworkOption | null {
  return includesArtwork(options, current) ? current : choosePreferredArtwork(options);
}

const optionFromElement = (element: HTMLElement): ArtworkOption | null => {
  const { kind, focus } = element.dataset;
  if ((kind !== 'static' && kind !== 'animated') || (focus !== 'focused' && focus !== 'unfocused')) return null;
  return { kind, focus };
};

const labelsFor = (locale: string) => locale === 'zh-cn'
  ? {
      kinds: { static: '静态原画', animated: '动态原画' },
      focuses: { focused: '聚焦', unfocused: '非聚焦' },
      current: '当前',
      show: '显示',
      toggle: '再次点击切换至',
    }
  : {
      kinds: { static: 'Static artwork', animated: 'Animated artwork' },
      focuses: { focused: 'Focused', unfocused: 'Unfocused' },
      current: 'Current',
      show: 'Show',
      toggle: 'Click again to switch to',
    };

export function artworkDisplayLabel(option: ArtworkOption, locale: string): string {
  const labels = labelsFor(locale);
  return `${labels.focuses[option.focus]} · ${labels.kinds[option.kind]}`;
}

export function isArtworkMediaElement(tagName: string): boolean {
  return tagName === 'IMG' || tagName === 'VIDEO';
}

export function artworkFileExtension(url: string, kind: ArtworkKind): string {
  const extension = new URL(url, 'https://lolchroma.art').pathname.match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase();
  return extension ?? (kind === 'animated' ? 'webm' : 'jpg');
}

const safeFilenamePart = (value: string): string => value
  .normalize('NFKC')
  .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-')
  .replace(/\s+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^[.\s-]+|[.\s-]+$/g, '');

export function artworkDownloadFilename(input: ArtworkDownloadFilenameInput): string {
  const extension = artworkFileExtension(input.url, input.kind);
  const isZh = input.locale === 'zh-cn';
  const name = isZh ? input.nameZh?.trim() || input.nameEn : input.nameEn;
  const parts = isZh
    ? [name, input.focus === 'focused' ? '聚焦' : '非聚焦', input.kind === 'animated' ? '动态原画' : '静态原画']
    : [name, input.focus, input.kind, 'splash'];
  const basename = parts.map(safeFilenamePart).filter(Boolean).join('-');
  return `${basename || 'league-of-legends-artwork'}.${extension}`;
}

export function bindSkinArtworks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-skin-artwork]').forEach((artwork) => {
    if (artwork.dataset.artworkBound) return;
    artwork.dataset.artworkBound = '1';

    const buttons = [...artwork.querySelectorAll<HTMLButtonElement>('[data-artwork-kind]')];
    let downloadLinks = [...artwork.querySelectorAll<HTMLAnchorElement>('[data-artwork-download]')];
    const downloadMenu = artwork.querySelector<HTMLDetailsElement>('[data-artwork-download-menu]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const labels = labelsFor(artwork.dataset.locale ?? 'en');
    let panels = [...artwork.querySelectorAll<HTMLElement>('[data-artwork-panel]')];
    let selection = panels.map(optionFromElement).find((option, index) => option && !panels[index]?.hidden) ?? choosePreferredArtwork(panels.map(optionFromElement).filter((option): option is ArtworkOption => option !== null));

    const options = (): ArtworkOption[] => panels.map(optionFromElement).filter((option): option is ArtworkOption => option !== null);
    const focusOptions = (kind: ArtworkKind): ArtworkFocus[] => options().filter((option) => option.kind === kind).map((option) => option.focus);

    const sync = () => {
      if (!selection) {
        artwork.hidden = true;
        return;
      }

      const activePanel = panels.find((panel) => {
        const option = optionFromElement(panel);
        return option ? sameArtwork(option, selection!) : false;
      });
      panels.forEach((panel) => {
        const active = panel === activePanel;
        panel.hidden = !active;
        const video = panel.querySelector('video');
        if (!video) return;
        if (active && !reducedMotion.matches) void video.play().catch(() => undefined);
        else video.pause();
      });

      buttons.forEach((button) => {
        const kind = button.dataset.artworkKind as ArtworkKind;
        const availableFocuses = focusOptions(kind);
        if (availableFocuses.length === 0) {
          button.remove();
          return;
        }

        const active = kind === selection!.kind;
        button.setAttribute('aria-pressed', String(active));
        if (active) button.dataset.currentFocus = selection!.focus;
        else delete button.dataset.currentFocus;

        const preview = chooseArtworkOnKindClick(options(), selection!, kind);
        const currentText = artworkDisplayLabel(selection!, artwork.dataset.locale ?? 'en');
        const nextText = preview && !sameArtwork(preview, selection!) ? labels.focuses[preview.focus] : null;
        const buttonText = active
          ? `${labels.current}：${currentText}${nextText ? `；${labels.toggle}${nextText}` : ''}`
          : `${labels.show}${labels.focuses[preview?.focus ?? availableFocuses[0] ?? 'focused']} · ${labels.kinds[kind]}`;
        button.setAttribute('aria-label', buttonText);
        button.title = buttonText;
      });

      downloadLinks.forEach((link) => {
        const option = optionFromElement(link);
        if (!option || !includesArtwork(options(), option)) {
          link.remove();
          return;
        }
        if (sameArtwork(option, selection!)) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
      downloadLinks = downloadLinks.filter((link) => link.isConnected);
      if (downloadLinks.length === 0) downloadMenu?.remove();

    };

    buttons.forEach((button) => button.addEventListener('click', () => {
      if (!selection) return;
      const kind = button.dataset.artworkKind;
      if (kind !== 'static' && kind !== 'animated') return;
      selection = chooseArtworkOnKindClick(options(), selection, kind);
      sync();
    }));

    downloadLinks.forEach((link) => link.addEventListener('click', async (event) => {
      event.preventDefault();
      if (link.getAttribute('aria-busy') === 'true') return;
      link.setAttribute('aria-busy', 'true');
      try {
        const response = await fetch(link.href);
        if (!response.ok) throw new Error(`Artwork download failed with ${response.status}`);
        const objectUrl = URL.createObjectURL(await response.blob());
        const download = document.createElement('a');
        download.href = objectUrl;
        download.download = link.download;
        download.hidden = true;
        document.body.append(download);
        download.click();
        download.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        if (downloadMenu) downloadMenu.open = false;
      } catch {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      } finally {
        link.removeAttribute('aria-busy');
      }
    }));

    document.addEventListener('click', (event) => {
      if (downloadMenu?.open && event.target instanceof Node && !downloadMenu.contains(event.target)) downloadMenu.open = false;
    });
    downloadMenu?.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        downloadMenu.open = false;
        downloadMenu.querySelector<HTMLElement>('summary')?.focus();
      }
    });
    downloadMenu?.addEventListener('toggle', () => {
      if (!downloadMenu.open) return;
      requestAnimationFrame(() => downloadMenu.querySelector<HTMLAnchorElement>('[data-artwork-download][aria-current="true"]')?.focus());
    });

    artwork.addEventListener('error', (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const panel = target.closest<HTMLElement>('[data-artwork-panel]');
      if (!panel) return;
      if (!isArtworkMediaElement(target.tagName)) return;

      panel.querySelector<HTMLDialogElement>('dialog[open]')?.close();
      panel.remove();
      panels = panels.filter((candidate) => candidate !== panel);
      if (selection) selection = chooseArtworkAfterRemoval(options(), selection);
      sync();
    }, true);

    reducedMotion.addEventListener('change', sync);
    sync();
  });
}
