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
  it('keeps only valid id, champion, and channel values on the language link', () => {
    const toggle = anchor('/zh-cn/champions/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL('https://chromaart.lol/champions/?id=103&champion=103&channel=latest&tracking=drop'),
    );

    expect(toggle.setHref).toHaveBeenCalledWith(
      '/zh-cn/champions/?id=103&champion=103&channel=latest',
    );
  });

  it('drops invalid and unrelated query values instead of copying them', () => {
    const toggle = anchor('/zh-cn/champions/?stale=1');
    bindRuntimeLanguageToggle(
      documentWith(toggle),
      new URL('https://chromaart.lol/champions/?id=oops&champion=0&channel=staging&tracking=drop'),
    );

    expect(toggle.setHref).toHaveBeenCalledWith('/zh-cn/champions/');
  });

  it('keeps latest on static chroma champion runtime links', () => {
    const championLink = anchor('/champions/?id=103');
    bindRuntimeChannelLinks(
      documentWith(null, [championLink]),
      new URL('https://chromaart.lol/chromas/example/?channel=latest&tracking=drop'),
    );

    expect(championLink.setHref).toHaveBeenCalledWith(
      '/champions/?id=103&channel=latest',
    );
  });
});
