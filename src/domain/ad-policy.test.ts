import { describe, expect, it } from 'vitest';
import { resolveAdProvider, resolveAdSenseSlot, shouldInitializeAd } from './ad-policy';

describe('advertising configuration', () => {
  it('defaults to Adsterra and only accepts a single known provider', () => {
    expect(resolveAdProvider(undefined)).toBe('adsterra');
    expect(resolveAdProvider('adsense')).toBe('adsense');
    expect(resolveAdProvider('none')).toBe('none');
    expect(() => resolveAdProvider('both')).toThrow(/Invalid AD_PROVIDER/);
  });

  it('requires a real numeric AdSense unit ID only when that provider is selected', () => {
    expect(resolveAdSenseSlot('1234567890')).toBe('1234567890');
    expect(() => resolveAdSenseSlot(undefined)).toThrow(/ADSENSE_AD_SLOT/);
    expect(() => resolveAdSenseSlot('publisher-id')).toThrow(/ADSENSE_AD_SLOT/);
  });

  it('initializes deferred ads once runtime detail content is ready', () => {
    expect(shouldInitializeAd('adsterra', true, false, false)).toBe(false);
    expect(shouldInitializeAd('adsterra', true, true, false)).toBe(true);
    expect(shouldInitializeAd('adsense', false, false, false)).toBe(true);
    expect(shouldInitializeAd('none', false, true, false)).toBe(false);
    expect(shouldInitializeAd('adsterra', false, true, true)).toBe(false);
  });
});
