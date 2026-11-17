import { describe, expect, it } from 'vitest';
import { createAdsterraDocument } from './ad-slot';
import { AD_SCRIPT_URLS } from '../domain/ad-policy';

describe('Adsterra banner document', () => {
  it('renders the supplied 300x250 iframe ad code inside its own document', () => {
    const html = createAdsterraDocument(AD_SCRIPT_URLS.adsterra);
    expect(html).toContain('"key":"77357bee0c4371d3773095ac4d08de0b"');
    expect(html).toContain('"format":"iframe"');
    expect(html).toContain('"height":250');
    expect(html).toContain('"width":300');
    expect(html).toContain(AD_SCRIPT_URLS.adsterra);
    expect(html).toContain('</script>');
  });
});
