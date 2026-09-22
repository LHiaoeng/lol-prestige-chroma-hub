import { describe, expect, it, vi } from 'vitest';
import {
  bindRuntimeChannelLinks,
  bindRuntimeLanguageToggle,
} from './runtime-url-state';

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
    const toggle = anchor('/zh-cn/champions/detail/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL('https://chromaart.lol/skins/detail/?id=103001&champion=103&stage=103002&channel=latest&tracking=drop'),
    );

    expect(toggle.setHref).toHaveBeenCalledWith(
      '/zh-cn/champions/detail/?id=103001&champion=103&stage=103002&channel=latest',
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
