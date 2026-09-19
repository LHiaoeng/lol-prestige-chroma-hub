import { describe, expect, it } from 'vitest';
import { filterItems, paginate, sortItems } from './listing';
import type { ListingItem } from '../domain/listing-payload';

const items: ListingItem[] = [
  { id: 3, name: 'Ahri', meta: 'Fox', href: '/champions/ahri/' },
  { id: 1, name: 'Zed', meta: 'Ninja', href: '/champions/zed/' },
  { id: 2, name: 'Akali', meta: 'Rogue', href: '/champions/akali/' },
  { id: 4, name: 'Yasuo', meta: 'Sword', href: '/champions/yasuo/' },
];

describe('filterItems', () => {
  it('returns all items when query is blank', () => {
    expect(filterItems(items, '   ')).toHaveLength(4);
  });

  it('matches by name case-insensitively', () => {
    expect(filterItems(items, 'ahri')).toHaveLength(1);
    expect(filterItems(items, 'AHRI')[0].id).toBe(3);
  });

  it('matches by meta field', () => {
    expect(filterItems(items, 'ninja')[0].name).toBe('Zed');
  });

  it('requires every whitespace-separated term to match', () => {
    // "ninja" matches Zed; adding a non-matching term "zzz" must drop it to 0.
    expect(filterItems(items, 'ninja zzz')).toHaveLength(0);
    // Both terms present in the same record still match.
    expect(filterItems(items, 'ahri fox')).toHaveLength(1);
  });
});

describe('sortItems', () => {
  it('sorts by name ascending', () => {
    expect(sortItems(items, 'name').map((item) => item.name)).toEqual(['Ahri', 'Akali', 'Yasuo', 'Zed']);
  });

  it('sorts by id ascending', () => {
    expect(sortItems(items, 'id').map((item) => item.id)).toEqual([1, 2, 3, 4]);
  });

  it('does not mutate the input array', () => {
    const before = items.map((item) => item.id);
    sortItems(items, 'id');
    expect(items.map((item) => item.id)).toEqual(before);
  });
});

describe('paginate', () => {
  it('returns the requested slice', () => {
    expect(paginate([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });

  it('clamps the start index to zero', () => {
    expect(paginate([1, 2], 5, 2)).toEqual([]);
  });
});
