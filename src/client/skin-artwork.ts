export type ArtworkKind = 'static' | 'animated';
export type ArtworkFocus = 'focused' | 'unfocused';

export interface ArtworkOption {
  kind: ArtworkKind;
  focus: ArtworkFocus;
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

const optionFromPanel = (panel: HTMLElement): ArtworkOption | null => {
  const { kind, focus } = panel.dataset;
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
      staticHint: '点击查看大图',
      animatedHint: '使用播放控件',
    }
  : {
      kinds: { static: 'Static artwork', animated: 'Animated artwork' },
      focuses: { focused: 'Focused', unfocused: 'Unfocused' },
      current: 'Current',
      show: 'Show',
      toggle: 'Click again to switch to',
      staticHint: 'Open full-size art',
      animatedHint: 'Use playback controls',
    };

export function artworkDisplayLabel(option: ArtworkOption, locale: string): string {
  const labels = labelsFor(locale);
  return `${labels.focuses[option.focus]} · ${labels.kinds[option.kind]}`;
}

export function isArtworkMediaElement(tagName: string): boolean {
  return tagName === 'IMG' || tagName === 'VIDEO';
}

export function bindSkinArtworks(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-skin-artwork]').forEach((artwork) => {
    if (artwork.dataset.artworkBound) return;
    artwork.dataset.artworkBound = '1';

    const buttons = [...artwork.querySelectorAll<HTMLButtonElement>('[data-artwork-kind]')];
    const caption = artwork.querySelector<HTMLElement>('[data-artwork-caption]');
    const hint = artwork.querySelector<HTMLElement>('[data-artwork-hint]');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const labels = labelsFor(artwork.dataset.locale ?? 'en');
    let panels = [...artwork.querySelectorAll<HTMLElement>('[data-artwork-panel]')];
    let selection = panels.map(optionFromPanel).find((option, index) => option && !panels[index]?.hidden) ?? choosePreferredArtwork(panels.map(optionFromPanel).filter((option): option is ArtworkOption => option !== null));

    const options = (): ArtworkOption[] => panels.map(optionFromPanel).filter((option): option is ArtworkOption => option !== null);
    const focusOptions = (kind: ArtworkKind): ArtworkFocus[] => options().filter((option) => option.kind === kind).map((option) => option.focus);

    const sync = () => {
      if (!selection) {
        artwork.hidden = true;
        return;
      }

      const activePanel = panels.find((panel) => {
        const option = optionFromPanel(panel);
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

      const availableFocuses = focusOptions(selection.kind);
      const alternate = availableFocuses.find((focus) => focus !== selection!.focus);
      if (caption) caption.textContent = artworkDisplayLabel(selection, artwork.dataset.locale ?? 'en');
      if (hint) {
        const baseHint = selection.kind === 'animated' ? labels.animatedHint : labels.staticHint;
        hint.textContent = alternate ? `${baseHint} · ${labels.toggle}${labels.focuses[alternate]}` : baseHint;
      }
    };

    buttons.forEach((button) => button.addEventListener('click', () => {
      if (!selection) return;
      const kind = button.dataset.artworkKind;
      if (kind !== 'static' && kind !== 'animated') return;
      selection = chooseArtworkOnKindClick(options(), selection, kind);
      sync();
    }));

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
