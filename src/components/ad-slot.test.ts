import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AD_SCRIPT_URLS } from '../domain/ad-policy';

function adPage(provider: 'adsterra' | 'adsense') {
  const children: object[] = [];
  const scripts: Array<{ onload?: () => void; onerror?: () => void }> = [];
  const queue: Record<string, never>[] = [];
  const createNode = () => ({});
  const slot = {
    dataset: { adProvider: provider, adScript: AD_SCRIPT_URLS[provider] } as DOMStringMap,
    querySelector: (selector: string) => selector === '[data-adsense-template]'
      ? { content: { cloneNode: createNode } }
      : children[0],
    append: (node: object) => { children.push(node); },
  };
  const documentRef = {
    defaultView: { adsbygoogle: queue },
    head: { append: (script: typeof scripts[number]) => { scripts.push(script); } },
    createElement: vi.fn(createNode),
    querySelectorAll: (selector: string) => selector === '[data-ad-provider="adsense"]' && provider !== 'adsense' ? [] : [slot],
  } as unknown as Document;
  return { documentRef, slot, children, scripts, queue };
}

describe('advertising lifecycle', () => {
  let bindAdSlots: typeof import('./ad-slot').bindAdSlots;

  beforeEach(async () => {
    vi.resetModules();
    ({ bindAdSlots } = await import('./ad-slot'));
  });

  it('does not wrap or repeat the Adsterra code already inserted by the HTML parser', () => {
    const page = adPage('adsterra');
    bindAdSlots(page.documentRef);
    bindAdSlots(page.documentRef);
    expect(page.children).toHaveLength(0);
    expect(page.documentRef.createElement).not.toHaveBeenCalled();
    expect(page.scripts).toHaveLength(0);
  });

  it('initializes one AdSense unit on page load without repeating it when bound again', async () => {
    const page = adPage('adsense');
    expect(page.scripts).toHaveLength(0);
    bindAdSlots(page.documentRef);
    bindAdSlots(page.documentRef);
    expect(page.children).toHaveLength(1);
    expect(page.scripts).toHaveLength(1);
    expect(page.queue).toHaveLength(0);
    page.scripts[0].onload?.();
    await vi.waitFor(() => expect(page.queue).toEqual([{}]));
    expect(page.documentRef.createElement).toHaveBeenCalledExactlyOnceWith('script');
  });

  it('handles an AdSense request failure without retrying or switching platforms', async () => {
    const page = adPage('adsense');
    bindAdSlots(page.documentRef);
    page.scripts[0].onerror?.();
    await vi.waitFor(() => expect(page.slot.dataset.adFailed).toBe('true'));
    bindAdSlots(page.documentRef);
    expect(page.scripts).toHaveLength(1);
    expect(page.children).toHaveLength(1);
    expect(page.queue).toHaveLength(0);
    expect(page.documentRef.createElement).toHaveBeenCalledExactlyOnceWith('script');
  });
});
