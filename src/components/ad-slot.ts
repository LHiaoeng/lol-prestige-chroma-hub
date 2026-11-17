import type { AdProvider } from '../domain/ad-policy';
import { ADSTERRA_KEY, shouldInitializeAd } from '../domain/ad-policy';

const boundDocuments = new WeakSet<Document>();
let adsenseLoad: Promise<void> | undefined;

type AdsByGoogleQueue = Array<Record<string, never>> & { loaded?: boolean };

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
}

export function createAdsterraDocument(scriptUrl: string): string {
  const options = JSON.stringify({
    key: ADSTERRA_KEY,
    format: 'iframe',
    height: 250,
    width: 300,
    params: {},
  });
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;overflow:hidden"><script>var atOptions=${options};<\/script><script src="${scriptUrl}"><\/script></body></html>`;
}

function loadAdsense(documentRef: Document, scriptUrl: string): Promise<void> {
  if (!adsenseLoad) {
    const view = documentRef.defaultView;
    if (!view) return Promise.reject(new Error('AdSense requires a browser window'));
    view.adsbygoogle ??= [];
    adsenseLoad = new Promise((resolve, reject) => {
      const script = documentRef.createElement('script');
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = scriptUrl;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('AdSense script failed to load'));
      documentRef.head.append(script);
    });
  }
  return adsenseLoad;
}

function initialize(slot: HTMLElement, provider: Exclude<AdProvider, 'none'>): void {
  if (slot.dataset.adAttempted === 'true') return;
  const scriptUrl = slot.dataset.adScript;
  if (!scriptUrl) return;
  slot.dataset.adAttempted = 'true';
  slot.hidden = false;

  if (provider === 'adsterra') {
    const frame = slot.ownerDocument.createElement('iframe');
    frame.title = slot.getAttribute('aria-label') ?? 'Advertisement';
    frame.width = '300';
    frame.height = '250';
    frame.loading = 'eager';
    frame.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox');
    frame.dataset.adsterraFrame = '';
    frame.srcdoc = createAdsterraDocument(scriptUrl);
    slot.append(frame);
    return;
  }

  const template = slot.querySelector<HTMLTemplateElement>('[data-adsense-template]');
  const unit = template?.content.cloneNode(true);
  if (!unit) return;
  slot.append(unit);
  void loadAdsense(slot.ownerDocument, scriptUrl).then(() => {
    slot.ownerDocument.defaultView?.adsbygoogle?.push({});
  }).catch(() => {
    slot.dataset.adFailed = 'true';
  });
}

export function bindAdSlots(documentRef: Document): void {
  if (boundDocuments.has(documentRef)) return;
  boundDocuments.add(documentRef);

  const slots = [...documentRef.querySelectorAll<HTMLElement>('[data-ad-provider]')];
  const tryInitialize = (slot: HTMLElement, ready = false) => {
    const provider = slot.dataset.adProvider as Exclude<AdProvider, 'none'> | undefined;
    if (!provider || !['adsterra', 'adsense'].includes(provider)) return;
    if (shouldInitializeAd(provider, slot.hasAttribute('data-ad-deferred'), ready, slot.dataset.adAttempted === 'true')) {
      initialize(slot, provider);
    }
  };

  for (const slot of slots) {
    if (slot.hasAttribute('data-ad-deferred')) continue;
    tryInitialize(slot);
  }

  if (!slots.some((slot) => slot.hasAttribute('data-ad-deferred'))) return;
  documentRef.addEventListener('runtime-reference-ad-ready', () => {
    for (const slot of slots) tryInitialize(slot, true);
  });
  documentRef.addEventListener('runtime-reference-ad-unavailable', () => {
    for (const slot of slots) {
      if (!slot.hasAttribute('data-ad-deferred')) continue;
      slot.hidden = true;
      slot.querySelector('[data-adsterra-frame], [data-adsense-unit]')?.remove();
    }
  });
}
