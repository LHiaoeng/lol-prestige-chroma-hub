import { describe, expect, it } from 'vitest';
import { buildBreadcrumbEntries } from './breadcrumb';

describe('buildBreadcrumbEntries', () => {
  it('builds links from route paths and replaces route parameters', () => {
    expect(buildBreadcrumbEntries([
      { title: 'Users', path: '/users' },
      { title: ':id', path: ':id' },
    ], '/', { id: 42 })).toEqual([
      { type: 'route', title: 'Users', href: '/users', class: undefined, menu: undefined, attributes: {}, separator: '/' },
      { type: 'separator', separator: '/' },
      { type: 'route', title: '42', href: '/users/42', class: undefined, menu: undefined, attributes: {}, separator: '' },
    ]);
  });

  it('supports component-wide and item-specific separators, including explicit separators', () => {
    expect(buildBreadcrumbEntries([
      { title: 'Home', href: '/' },
      { type: 'separator', separator: '>' },
      { title: 'Current' },
    ], '')).toEqual([
      { type: 'route', title: 'Home', href: '/', class: undefined, menu: undefined, attributes: {}, separator: '' },
      { type: 'separator', separator: '>' },
      { type: 'route', title: 'Current', href: undefined, class: undefined, menu: undefined, attributes: {}, separator: '' },
    ]);
  });

  it('preserves a domain icon on its breadcrumb entry', () => {
    expect(buildBreadcrumbEntries([
      { title: 'Teamfight Tactics', icon: 'teamfight-tactics' },
      { title: 'Little Legends' },
    ])[0]).toMatchObject({ title: 'Teamfight Tactics', icon: 'teamfight-tactics' });
  });
});
