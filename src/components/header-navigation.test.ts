import { describe, expect, it } from 'vitest';
import { headerNavigationState } from './header-navigation';

describe('headerNavigationState', () => {
  it('marks the matching nested route in both locales', () => {
    expect(headerNavigationState('/skins/ahri/').browsePath).toBe('/skins/');
    expect(headerNavigationState('/zh-cn/champions/ahri/').browsePath).toBe('/champions/');
    expect(headerNavigationState('/zh-cn/champions/ahri/').current('/champions/')).toBe('location');
    expect(headerNavigationState('/zh-cn/blog/guide/').current('/blog/')).toBe('location');
    expect(headerNavigationState('/tft/companions/').current('/tft/companions/', '/tft/')).toBe('page');
    expect(headerNavigationState('/zh-cn/champions/').current('/champions/')).toBe('page');
  });

  it('does not select unrelated or similarly prefixed routes', () => {
    expect(headerNavigationState('/skinlines-extra/').browsePath).toBeUndefined();
    expect(headerNavigationState('/').current('/blog/')).toBeUndefined();
    expect(headerNavigationState('/about/').current('/tft/companions/', '/tft/')).toBeUndefined();
  });
});
