let adsenseLoad: Promise<void> | undefined;

type AdsByGoogleQueue = Array<Record<string, never>> & { loaded?: boolean };

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleQueue;
  }
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

export function bindAdSlots(documentRef: Document): void {
  for (const slot of documentRef.querySelectorAll<HTMLElement>('[data-ad-provider="adsense"]')) {
    if (slot.dataset.adAttempted === 'true') continue;
    const scriptUrl = slot.dataset.adScript;
    const template = slot.querySelector<HTMLTemplateElement>('[data-adsense-template]');
    if (!scriptUrl || !template) continue;
    slot.dataset.adAttempted = 'true';
    slot.append(template.content.cloneNode(true));
    void loadAdsense(documentRef, scriptUrl).then(() => {
      documentRef.defaultView?.adsbygoogle?.push({});
    }).catch(() => {
      slot.dataset.adFailed = 'true';
    });
  }
}
