import { describe, expect, it } from 'vitest';
import { createSlug, parseCatalog, r2Key, safeJsonLd, sourceImageUrl } from './chroma';

const record = {
  id: 1,
  skinId: 101,
  instanceId: 'abc-123',
  nameZh: '至臻 月蚀骑士 赛娜',
  nameEn: 'Prestige Lunar Eclipse Senna',
  heroId: 'senna',
  heroNameZh: '赛娜',
  heroNameEn: 'Senna',
  skinNameZh: '月蚀骑士 赛娜',
  skinNameEn: 'Lunar Eclipse Senna',
  categoryId: 'prestige',
  categoryName: '至臻',
  tagId: 'mythic',
  gameVer: '26.13',
  isNew: true,
  rank: 10,
  images: {
    large: 'assets/chromas/abc-123/site3.jpg',
    small: 'assets/chromas/abc-123/site4.jpg',
    medium: 'assets/chromas/abc-123/site5.jpg',
    tag: 'assets/tags/mythic.png',
  },
};

describe('chroma catalog', () => {
  it('parses a valid record and creates a stable slug', () => {
    const [parsed] = parseCatalog([record]);
    expect(parsed.slug).toBe('senna-prestige-lunar-eclipse-senna-101');
    expect(createSlug(' Kai’Sa ', 'Prestige K/DA', 42)).toBe('kai-sa-prestige-k-da-42');
  });

  it('rejects duplicate instance IDs and duplicate slugs', () => {
    expect(() => parseCatalog([record, { ...record, id: 2, skinId: 102 }])).toThrow(/instanceId/i);
    const other = {
      ...record,
      id: 2,
      instanceId: 'other',
      images: {
        ...record.images,
        large: 'assets/chromas/other/site3.jpg',
        small: 'assets/chromas/other/site4.jpg',
        medium: 'assets/chromas/other/site5.jpg',
      },
    };
    expect(() => parseCatalog([record, other])).toThrow(/slug/i);
  });

  it('rejects unsafe and misplaced asset paths', () => {
    expect(() => parseCatalog([{ ...record, images: { ...record.images, large: '../secret.jpg' } }])).toThrow(/large/i);
    expect(() => parseCatalog([{ ...record, images: { ...record.images, tag: 'assets/chromas/tag.png' } }])).toThrow(/tag/i);
  });

  it('maps source and R2 image locations', () => {
    expect(sourceImageUrl('large', 'abc-123')).toContain('site3-abc-123.jpg');
    expect(sourceImageUrl('small', 'abc-123')).toContain('site4-abc-123.jpg');
    expect(sourceImageUrl('medium', 'abc-123')).toContain('site5-abc-123.jpg');
    expect(sourceImageUrl('tag', 'mythic')).toContain('x-mythic.png');
    expect(r2Key(record.images.large)).toBe('chromas/abc-123/site3.jpg');
  });

  it('escapes script-breaking characters in JSON-LD', () => {
    expect(safeJsonLd({ name: '</script><script>alert(1)</script>' })).not.toContain('</script>');
    expect(JSON.parse(safeJsonLd({ name: '<unsafe>' })).name).toBe('<unsafe>');
  });
});
