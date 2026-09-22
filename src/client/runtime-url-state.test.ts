import { describe, expect, it, vi } from 'vitest';
import {
  formatRuntimeUrl,
  readRuntimeUrlState,
} from '../domain/runtime-url-state';
import {
  bindRuntimeChannelLinks,
  bindRuntimeLanguageToggle,
} from './runtime-url-state-dom';

function anchor(href: string): HTMLAnchorElement & { setHref: ReturnType<typeof vi.fn> } {
  const setHref = vi.fn();
  return {
    getAttribute: (name: string) => name === 'href' ? href : null,
    setAttribute: (name: string, value: string) => {
      if (name === 'href') setHref(value);
    },
    setHref,
  } as unknown as HTMLAnchorElement & { setHref: ReturnType<typeof vi.fn> };
}

function documentWith(
  languageToggle: HTMLAnchorElement | null,
  channelLinks: readonly HTMLAnchorElement[] = [],
): Document {
  return {
    querySelector: vi.fn().mockReturnValue(languageToggle),
    querySelectorAll: vi.fn().mockReturnValue(channelLinks),
  } as unknown as Document;
}

describe('runtime URL state binding', () => {
  it('keeps only valid id, champion, stage, and channel values on the language link', () => {
    const toggle = anchor('/zh-cn/skins/detail/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL('https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002&channel=latest&tracking=drop'),
    );

    expect(toggle.setHref).toHaveBeenCalledWith(
      '/zh-cn/skins/detail/?id=103001&champion=103&stage=103002&channel=latest',
    );
  });

  it('drops invalid and unrelated query values instead of copying them', () => {
    const toggle = anchor('/zh-cn/champions/detail/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL('https://chromaart.lol/champions/detail/?id=oops&champion=0&channel=staging&tracking=drop'),
    );

    expect(toggle.setHref).toHaveBeenCalledWith('/zh-cn/champions/detail/');
  });

  it('filters skin-only locator parameters when the language target is a champion detail page', () => {
    const toggle = anchor('/zh-cn/champions/detail/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL(
        'https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002&channel=latest',
      ),
    );

    expect(toggle.setHref).toHaveBeenCalledWith(
      '/zh-cn/champions/detail/?id=103001&channel=latest',
    );
  });

  it('keeps latest on static chroma champion runtime links', () => {
    const championLink = anchor('/champions/detail/?id=103');
    const sourceSkinLink = anchor('/skins/detail/?id=103001&champion=103');
    const skinlineLink = anchor('/skinlines/detail/?id=7');
    const universeLink = anchor('/universes/detail/?id=200');
    bindRuntimeChannelLinks(
      documentWith(null, [championLink, sourceSkinLink, skinlineLink, universeLink]),
      new URL('https://chromaart.lol/chromas/example/?channel=latest&tracking=drop'),
    );

    expect(championLink.setHref).toHaveBeenCalledWith(
      '/champions/detail/?id=103&channel=latest',
    );
    expect(sourceSkinLink.setHref).toHaveBeenCalledWith(
      '/skins/detail/?id=103001&champion=103&channel=latest',
    );
    expect(skinlineLink.setHref).toHaveBeenCalledWith(
      '/skinlines/detail/?id=7&channel=latest',
    );
    expect(universeLink.setHref).toHaveBeenCalledWith(
      '/universes/detail/?id=200&channel=latest',
    );
  });
});

describe('runtime URL state', () => {
  it('normalizes valid values, defaults missing channel to pbe, and tracks explicit intent', () => {
    expect(
      readRuntimeUrlState(
        new URL(
          'https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002',
        ),
      ),
    ).toEqual({
      id: 103001,
      champion: 103,
      stage: 103002,
      channel: 'pbe',
      channelExplicit: false,
      invalid: [],
    });

    expect(
      readRuntimeUrlState(
        new URL('https://chromaart.lol/champions/detail/?id=103&channel=pbe'),
      ),
    ).toMatchObject({ channel: 'pbe', channelExplicit: true, invalid: [] });
    expect(
      readRuntimeUrlState(
        new URL('https://chromaart.lol/champions/detail/?id=103&channel=latest'),
      ),
    ).toMatchObject({ channel: 'latest', channelExplicit: true, invalid: [] });
  });

  it('marks invalid channel and entity values without guessing replacements', () => {
    const state = readRuntimeUrlState(
      new URL(
        'https://chromaart.lol/champions/detail/?id=0&champion=-1&stage=1.5&channel=PBE',
      ),
    );

    expect(state).toMatchObject({
      channelExplicit: false,
      invalid: ['id', 'champion', 'stage', 'channel'],
    });
    expect(state).toHaveProperty('channel', undefined);
    expect(state).not.toHaveProperty('id');
    expect(state).not.toHaveProperty('champion');
    expect(state).not.toHaveProperty('stage');
    expect(
      formatRuntimeUrl(
        new URL('https://chromaart.lol/champions/detail/'),
        state,
        ['channel'],
      ).search,
    ).toBe('');
  });

  it('accepts the largest safe integer and rejects values above it', () => {
    const state = readRuntimeUrlState(
      new URL(
        'https://chromaart.lol/skins/detail/?id=9007199254740991&champion=9007199254740992&stage=1e3',
      ),
    );

    expect(state.id).toBe(Number.MAX_SAFE_INTEGER);
    expect(state).not.toHaveProperty('champion');
    expect(state).not.toHaveProperty('stage');
    expect(state.invalid).toEqual(['champion', 'stage']);
  });

  it('uses the first value for duplicates and emits one stable canonical query', () => {
    const state = readRuntimeUrlState(
      new URL(
        'https://chromaart.lol/skins/detail/?stage=103002&stage=103003&id=103001&id=103004&champion=103&channel=latest&channel=pbe',
      ),
    );

    expect(
      formatRuntimeUrl(
        new URL('https://chromaart.lol/skins/detail/?tracking=drop'),
        state,
        ['id', 'champion', 'stage', 'channel'],
      ).search,
    ).toBe('?id=103001&champion=103&stage=103002&channel=latest');
  });

  it('filters parameters by the target page and preserves explicit pbe only when requested by state', () => {
    const explicitPbe = readRuntimeUrlState(
      new URL(
        'https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002&channel=pbe',
      ),
    );
    expect(
      formatRuntimeUrl(
        new URL('https://chromaart.lol/champions/detail/?stale=1'),
        explicitPbe,
        ['id', 'channel'],
      ).search,
    ).toBe('?id=103001&channel=pbe');

    const defaultPbe = readRuntimeUrlState(
      new URL('https://chromaart.lol/skins/detail/?id=103001&champion=103'),
    );
    expect(
      formatRuntimeUrl(
        new URL('https://chromaart.lol/skins/detail/'),
        defaultPbe,
        ['id', 'champion', 'stage', 'channel'],
      ).search,
    ).toBe('?id=103001&champion=103');
  });
});
