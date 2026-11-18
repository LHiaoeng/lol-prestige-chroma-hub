import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { headerNavigationState } from './header-navigation';

it('renders four text buttons in the right-hand header controls', () => {
  const layout = readFileSync(new URL('../layouts/BaseLayout.astro', import.meta.url), 'utf8');
  const controls = layout.split('<div class="header-controls">')[1]?.split('</header>')[0];
  expect(controls?.match(/class="ant-btn ant-btn-variant-text\b/g)).toHaveLength(4);
});

describe('headerNavigationState', () => {
  it('marks the matching nested route in both locales', () => {
    expect(headerNavigationState('/skins/ahri/').browsePath).toBe('/skins/');
    expect(headerNavigationState('/zh-cn/champions/ahri/').browsePath).toBe('/champions/');
    expect(headerNavigationState('/zh-cn/champions/ahri/').current('/champions/')).toBe('location');
    expect(headerNavigationState('/zh-cn/blog/guide/').current('/blog/')).toBe('location');
    expect(headerNavigationState('/tft/companions/').current('/tft/companions/')).toBe('page');
    expect(headerNavigationState('/zh-cn/champions/').current('/champions/')).toBe('page');
  });

  it('does not select unrelated or similarly prefixed routes', () => {
    expect(headerNavigationState('/skinlines-extra/').browsePath).toBeUndefined();
    expect(headerNavigationState('/').current('/blog/')).toBeUndefined();
    expect(headerNavigationState('/about/').current('/tft/companions/')).toBeUndefined();
  });

  it('highlights only the matching Teamfight Tactics option', () => {
    for (const pathname of ['/tft/companions/', '/zh-cn/tft/companions/']) {
      const navigation = headerNavigationState(pathname);
      expect(navigation.current('/tft/companions/')).toBe('page');
      expect(navigation.current('/tft/arenas/')).toBeUndefined();
    }
    for (const pathname of ['/tft/arenas/', '/zh-cn/tft/arenas/']) {
      const navigation = headerNavigationState(pathname);
      expect(navigation.current('/tft/arenas/')).toBe('page');
      expect(navigation.current('/tft/companions/')).toBeUndefined();
    }
  });
});
