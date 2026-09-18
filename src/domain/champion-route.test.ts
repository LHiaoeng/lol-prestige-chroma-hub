import { describe, expect, it } from 'vitest';
import { championSlug } from './champion-route';

describe('champion routes', () => {
  it('normalizes punctuation and whitespace into stable slugs', () => {
    expect(championSlug('Ahri')).toBe('ahri');
    expect(championSlug('Dr. Mundo')).toBe('dr-mundo');
    expect(championSlug("Kai'Sa")).toBe('kai-sa');
    expect(championSlug('Renata Glasc')).toBe('renata-glasc');
    expect(championSlug("K'Sante")).toBe('k-sante');
  });

  it('rejects names that cannot produce a URL slug', () => {
    expect(() => championSlug('  ---  ')).toThrow(/Cannot create champion slug/);
  });
});
