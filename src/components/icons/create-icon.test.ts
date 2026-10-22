import { describe, expect, it } from 'vitest';
import { createIcon } from './create-icon';

function iconFixture() {
  const attributes = new Map<string, string>();
  const classes: string[] = [];
  const icon = {
    classList: { add: (...names: string[]) => classes.push(...names) },
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    style: { fill: '', stroke: '' },
    innerHTML: '',
  } as unknown as SVGSVGElement;
  const document = {
    createElementNS: (namespace: string, tag: string) => {
      expect([namespace, tag]).toEqual(['http://www.w3.org/2000/svg', 'svg']);
      return icon;
    },
  } as unknown as Document;
  return { icon, document, attributes, classes };
}

describe('createIcon', () => {
  it('creates a decorative upstream SVG with its official viewBox', () => {
    const { icon, document, attributes, classes } = iconFixture();
    expect(createIcon('HomeOutlined', document)).toBe(icon);
    expect(classes).toEqual(['project-icon', 'project-icon--ant']);
    expect(attributes.get('viewBox')).toBe('64 64 896 896');
    expect(attributes.get('aria-hidden')).toBe('true');
    expect(attributes.get('focusable')).toBe('false');
    expect(icon.style.fill).toBe('currentColor');
    expect(icon.innerHTML).toContain('<path');
  });

  it('keeps project glyphs as strokes in the same SVG entry point', () => {
    const { icon, document, attributes, classes } = iconFixture();
    createIcon('summary-actions', document);
    expect(classes).toEqual(['project-icon', 'project-icon--custom']);
    expect(attributes.get('viewBox')).toBe('0 0 24 24');
    expect(icon.style.fill).toBe('none');
    expect(icon.style.stroke).toBe('currentColor');
  });
});
