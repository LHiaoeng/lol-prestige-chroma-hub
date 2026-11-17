export const AD_PROVIDERS = ['adsterra', 'adsense', 'none'] as const;
export type AdProvider = typeof AD_PROVIDERS[number];

export const ADSTERRA_KEY = '77357bee0c4371d3773095ac4d08de0b';
export const ADSENSE_CLIENT_ID = 'ca-pub-1090619659930920';
export const AD_SCRIPT_URLS = {
  adsterra: `https://bauval.org/22/${ADSTERRA_KEY}`,
  adsense: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`,
} as const;

export const AD_PLACEMENTS = ['catalog-index', 'editorial-article', 'page'] as const;
export type AdPlacement = typeof AD_PLACEMENTS[number];

export function resolveAdProvider(value: string | undefined): AdProvider {
  const provider = value ?? 'none';
  if (!AD_PROVIDERS.includes(provider as AdProvider)) {
    throw new Error(`Invalid AD_PROVIDER: ${provider}`);
  }
  return provider as AdProvider;
}

export function resolveAdSenseSlot(value: string | undefined): string {
  if (!value || !/^\d+$/.test(value)) {
    throw new Error('ADSENSE_AD_SLOT must be set to a numeric AdSense ad unit ID when AD_PROVIDER=adsense');
  }
  return value;
}
