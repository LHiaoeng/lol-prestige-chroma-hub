import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdsterraDocument } from './ad-slot';
import { AD_SCRIPT_URLS } from '../domain/ad-policy';

function adPage(provider: 'adsterra' | 'adsense', deferred = false) {
  const events = new EventTarget();
  const children: Array<{ remove: () => void }> = [];
  const scripts: Array<{ onload?: () => void; onerror?: () => void }> = [];
  const queue: Record<string, never>[] = [];
  const createNode = () => {
    const node = {
      dataset: {},
      setAttribute: vi.fn(),
      remove: () => { children.splice(children.indexOf(node), 1); },
    };
    return node;
  };
  const slot = {
    dataset: { adProvider: provider, adScript: AD_SCRIPT_URLS[provider] } as DOMStringMap,
    hidden: deferred,
    get ownerDocument() { return documentRef; },
    hasAttribute: (name: string) => name === 'data-ad-deferred' && deferred,
    getAttribute: () => 'Advertisement',
    querySelector: (selector: string) => selector === '[data-adsense-template]'
      ? { content: { cloneNode: createNode } }
      : children[0],
    append: (node: { remove: () => void }) => { children.push(node); },
  };
  const documentRef = {
    defaultView: { adsbygoogle: queue },
    head: { append: (script: typeof scripts[number]) => { scripts.push(script); } },
    createElement: vi.fn(createNode),
    querySelectorAll: () => [slot],
    addEventListener: events.addEventListener.bind(events),
  } as unknown as Document;
  return { documentRef, slot, children, scripts, queue, emit: (name: string) => events.dispatchEvent(new Event(name)) };
}

describe('Adsterra banner document', () => {
  it('renders the supplied 300x250 iframe ad code inside its own document', () => {
    const html = createAdsterraDocument(AD_SCRIPT_URLS.adsterra);
    expect(html).toContain('"key":"77357bee0c4371d3773095ac4d08de0b"');
    expect(html).toContain('"format":"iframe"');
    expect(html).toContain('"height":250');
    expect(html).toContain('"width":300');
    expect(html).toContain(AD_SCRIPT_URLS.adsterra);
    expect(html).toContain('</script>');
  });
});

describe('advertising lifecycle', () => {
  let bindAdSlots: typeof import('./ad-slot').bindAdSlots;

  beforeEach(async () => {
    vi.resetModules();
    ({ bindAdSlots } = await import('./ad-slot'));
  });

  it('loads one Adsterra frame immediately on a static page and binds only once', () => {
    const page = adPage('adsterra');
    bindAdSlots(page.documentRef);
    bindAdSlots(page.documentRef);
    expect(page.children).toHaveLength(1);
    expect(page.documentRef.createElement).toHaveBeenCalledExactlyOnceWith('iframe');
    expect(page.slot.hidden).toBe(false);
    expect(page.scripts).toHaveLength(0);
  });

  it('waits for runtime content and ignores repeated ready events', () => {
    const page = adPage('adsterra', true);
    bindAdSlots(page.documentRef);
    expect(page.children).toHaveLength(0);
    expect(page.slot.hidden).toBe(true);
    page.emit('runtime-reference-ad-ready');
    page.emit('runtime-reference-ad-ready');
    expect(page.children).toHaveLength(1);
    expect(page.slot.hidden).toBe(false);
  });

  it('removes a runtime ad when content disappears without refreshing it on later events', () => {
    const page = adPage('adsterra', true);
    bindAdSlots(page.documentRef);
    page.emit('runtime-reference-ad-unavailable');
    expect(page.children).toHaveLength(0);
    page.emit('runtime-reference-ad-ready');
    expect(page.children).toHaveLength(1);
    page.emit('runtime-reference-ad-unavailable');
    page.emit('runtime-reference-ad-ready');
    expect(page.children).toHaveLength(0);
    expect(page.slot.hidden).toBe(true);
    expect(page.documentRef.createElement).toHaveBeenCalledTimes(1);
  });

  it('initializes one AdSense unit only after its script has loaded', async () => {
    const page = adPage('adsense', true);
    bindAdSlots(page.documentRef);
    expect(page.scripts).toHaveLength(0);
    page.emit('runtime-reference-ad-ready');
    page.emit('runtime-reference-ad-ready');
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
    expect(page.slot.hidden).toBe(false);
    expect(page.queue).toHaveLength(0);
    expect(page.documentRef.createElement).toHaveBeenCalledExactlyOnceWith('script');
  });
});
