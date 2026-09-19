import { describe, expect, it } from 'vitest';
import {
  artworkDisplayLabel,
  chooseArtworkAfterRemoval,
  chooseArtworkOnKindClick,
  choosePreferredArtwork,
  isArtworkMediaElement,
  type ArtworkOption,
} from './skin-artwork';

const allOptions: ArtworkOption[] = [
  { kind: 'animated', focus: 'focused' },
  { kind: 'animated', focus: 'unfocused' },
  { kind: 'static', focus: 'focused' },
  { kind: 'static', focus: 'unfocused' },
];

describe('skin artwork selection', () => {
  it('prefers animated focused artwork and skips missing variants', () => {
    expect(choosePreferredArtwork(allOptions)).toEqual({ kind: 'animated', focus: 'focused' });
    expect(choosePreferredArtwork([
      { kind: 'animated', focus: 'unfocused' },
      { kind: 'static', focus: 'focused' },
    ])).toEqual({ kind: 'animated', focus: 'unfocused' });
    expect(choosePreferredArtwork([])).toBeNull();
  });

  it('cycles available focus variants when the active kind is clicked repeatedly', () => {
    expect(chooseArtworkOnKindClick(allOptions, { kind: 'animated', focus: 'focused' }, 'animated'))
      .toEqual({ kind: 'animated', focus: 'unfocused' });
    expect(chooseArtworkOnKindClick(allOptions, { kind: 'animated', focus: 'unfocused' }, 'animated'))
      .toEqual({ kind: 'animated', focus: 'focused' });
    expect(chooseArtworkOnKindClick(
      [{ kind: 'static', focus: 'unfocused' }],
      { kind: 'static', focus: 'unfocused' },
      'static',
    )).toEqual({ kind: 'static', focus: 'unfocused' });
  });

  it('preserves focus when changing kind and otherwise chooses the available focused view', () => {
    expect(chooseArtworkOnKindClick(allOptions, { kind: 'animated', focus: 'unfocused' }, 'static'))
      .toEqual({ kind: 'static', focus: 'unfocused' });
    expect(chooseArtworkOnKindClick(
      [
        { kind: 'animated', focus: 'unfocused' },
        { kind: 'static', focus: 'focused' },
      ],
      { kind: 'animated', focus: 'unfocused' },
      'static',
    )).toEqual({ kind: 'static', focus: 'focused' });
  });

  it('falls back by media priority after the active resource is removed', () => {
    expect(chooseArtworkAfterRemoval(
      allOptions.filter((option) => !(option.kind === 'animated' && option.focus === 'focused')),
      { kind: 'animated', focus: 'focused' },
    )).toEqual({ kind: 'animated', focus: 'unfocused' });
    expect(chooseArtworkAfterRemoval(
      allOptions.filter((option) => option.kind === 'static'),
      { kind: 'animated', focus: 'focused' },
    )).toEqual({ kind: 'static', focus: 'focused' });
  });

  it('shares localized state labels between server and client rendering', () => {
    expect(artworkDisplayLabel({ kind: 'animated', focus: 'focused' }, 'zh-cn')).toBe('聚焦 · 动态原画');
    expect(artworkDisplayLabel({ kind: 'static', focus: 'unfocused' }, 'en')).toBe('Unfocused · Static artwork');
  });

  it('treats failed artwork images and videos as removable resources', () => {
    expect(isArtworkMediaElement('IMG')).toBe(true);
    expect(isArtworkMediaElement('VIDEO')).toBe(true);
    expect(isArtworkMediaElement('SOURCE')).toBe(false);
  });
});
