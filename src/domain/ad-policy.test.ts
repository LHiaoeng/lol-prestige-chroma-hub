import { describe, expect, it } from 'vitest';
import { resolveAdProvider, resolveAdSenseSlot } from './ad-policy';

describe('advertising configuration', () => {
  it('defaults to disabled advertising and only accepts a single known provider', () => {
    expect(resolveAdProvider(undefined)).toBe('none');
    expect(resolveAdProvider('adsterra')).toBe('adsterra');
    expect(resolveAdProvider('adsense')).toBe('adsense');
    expect(resolveAdProvider('none')).toBe('none');
    expect(() => resolveAdProvider('both')).toThrow(/Invalid AD_PROVIDER/);
  });

  it('requires a real numeric AdSense unit ID only when that provider is selected', () => {
    expect(resolveAdSenseSlot('1234567890')).toBe('1234567890');
    expect(() => resolveAdSenseSlot(undefined)).toThrow(/ADSENSE_AD_SLOT/);
    expect(() => resolveAdSenseSlot('publisher-id')).toThrow(/ADSENSE_AD_SLOT/);
  });
});
