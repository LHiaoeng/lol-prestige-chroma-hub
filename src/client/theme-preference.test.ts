import { describe, expect, it } from 'vitest';
import { parseThemePreference, resolveTheme } from './theme-preference';

describe('theme preference', () => {
  it('defaults to dark when storage is empty or invalid', () => {
    expect(parseThemePreference(null)).toBe('dark');
    expect(parseThemePreference('sepia')).toBe('dark');
  });

  it('accepts each persisted preference', () => {
    expect(parseThemePreference('system')).toBe('system');
    expect(parseThemePreference('light')).toBe('light');
    expect(parseThemePreference('dark')).toBe('dark');
  });

  it('resolves system preference from the current operating-system theme', () => {
    expect(resolveTheme('system', false)).toBe('light');
    expect(resolveTheme('system', true)).toBe('dark');
  });

  it('keeps explicit preferences independent of the operating-system theme', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});
