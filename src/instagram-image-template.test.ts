import { describe, expect, it } from 'vitest';
import { buildInstagramImageHtml } from './instagram-image-template.js';

describe('buildInstagramImageHtml', () => {
  it('renders title, category, image and qr code when url is provided', () => {
    const html = buildInstagramImageHtml({
      imageUrl: 'https://cdn.fifthbell.com/image.jpg',
      title: 'Breaking Story',
      category: 'World',
      url: 'https://fifthbell.com/world/breaking-story'
    });

    expect(html).toContain('Breaking Story');
    expect(html).toContain('WORLD');
    expect(html).toContain('https://cdn.fifthbell.com/image.jpg');
    expect(html).toContain('aria-label="QR Code"');
    expect(html).toContain('<svg');
  });

  it('falls back to slug and escapes html content', () => {
    const html = buildInstagramImageHtml({
      imageUrl: 'https://cdn.fifthbell.com/<img>.jpg',
      title: 'A <script>alert("x")</script>',
      slug: 'latest-news'
    });

    expect(html).toContain('LATEST NEWS');
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    expect(html).toContain('https://cdn.fifthbell.com/&lt;img&gt;.jpg');
    expect(html).not.toContain('<script>alert("x")</script>');
  });
});
