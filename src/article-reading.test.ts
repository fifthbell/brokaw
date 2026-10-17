import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render } from './renderer.node.js';
import { canonicalArticleSchema, type CanonicalArticle } from './types/canonical-article.js';

const fixture = JSON.parse(fs.readFileSync(new URL('../stories/fixtures/article-reading.fixture.json', import.meta.url), 'utf8'));
const article = canonicalArticleSchema.parse(fixture.document);

function articleMarkup(overrides: Partial<CanonicalArticle> = {}) {
  const html = render(canonicalArticleSchema.parse({ ...article, ...overrides }))
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  const main = html.match(/<main\b([^>]*\bgrid-cols-1\b[^>]*)>([\s\S]*?)<\/main>/);
  expect(main, 'The actual article renderer must supply its reading grid').not.toBeNull();
  return { html, attributes: main![1], content: main![2] };
}

function rowClasses(content: string) {
  return [...content.matchAll(/<(?:header|aside|article)\b[^>]*class=['"]([^'"]+)['"][^>]*>/g)]
    .map(match => match[1].split(/\s+/));
}

describe('published article reading', () => {
  it('keeps the article rows within the explicit mobile grid and preserves the complete story', () => {
    const { html, attributes, content } = articleMarkup();
    expect(attributes).toContain('w-full min-w-0');
    const rows = rowClasses(content);
    expect(rows).toHaveLength(3);
    for (const classes of rows) {
      expect(classes).toContain('col-span-full');
      expect(classes).not.toContain('col-span-12');
    }
    expect(html).toContain(article.title);
    expect(html).toContain('The fictional newsroom welcomes readers');
    expect(html).toContain('Every word deserves room to be read.');
    expect(html).toContain('Fictional newsroom');
    expect(html).toContain('This closing paragraph remains visible');
    expect(html).toContain(`data-timestamp='${article.publishedAt}'`);
  });

  it('keeps the supplied updated-version notice in the same explicit grid', () => {
    const { html, content } = articleMarkup({ updatedVersion: fixture.update });
    const rows = rowClasses(content);
    expect(rows).toHaveLength(4);
    expect(rows.every(classes => classes.includes('col-span-full'))).toBe(true);
    expect(html).toContain(`href='${fixture.update.url}'`);
  });

  it('preserves the supplied lead image and its desktop-only inner span', () => {
    const { html, content } = articleMarkup({ featuredImage: fixture.photo });
    expect(html).toContain(`src='${fixture.photo.url}'`);
    expect(html).toContain(`alt='${fixture.photo.alt}'`);
    expect(content).toMatch(/class='[^']*lg:col-span-12[^']*'/);
    expect(rowClasses(content).every(classes => classes.includes('col-span-full'))).toBe(true);
  });

  it('retains desktop twelve-column share and body placement', () => {
    const { attributes, content } = articleMarkup();
    expect(attributes).toContain('lg:grid-cols-12');
    expect(content).toMatch(/<header class='[^']*lg:grid-cols-12/);
    expect(content).toMatch(/<aside class='[^']*lg:col-span-3/);
    expect(content).toMatch(/<article class='[^']*lg:col-span-7 lg:col-start-4 lg:mt-12 xl:col-span-6/);
  });

  it('allows long words to wrap without truncating or changing the supplied text', () => {
    const title = 'FictionalSupercalifragilisticexpialidociousNewsroomInvestigation';
    const excerpt = 'FictionalUnbrokenExcerptRemainsReadableWithoutChangingItsSavedWords';
    const { html, attributes } = articleMarkup({ title, excerpt });
    expect(attributes.split(/\s+/)).toContain('wrap-anywhere');
    expect(html).toContain(title);
    expect(html).toContain(excerpt);
  });

  it('renders all canonical author names in supplied order before the existing publication date', () => {
    const { html } = articleMarkup({ authors: [
      { name: 'Elena Ortiz', slug: 'elena-ortiz' },
      { name: 'Marcus Chen', slug: 'marcus-chen' }
    ] });
    expect(html).toMatch(/data-article-byline><span>Elena Ortiz<\/span>, <span>Marcus Chen<\/span><\/p>/);
    expect(html.indexOf('data-article-byline')).toBeLessThan(html.indexOf('data-timestamp='));
  });

  it('escapes author names as text at the actual article boundary', () => {
    const { html } = articleMarkup({ authors: [{ name: 'Desk <script>fictional</script> & team', slug: 'desk' }] });
    expect(html).toContain('Desk &lt;script&gt;fictional&lt;/script&gt; &amp; team');
    expect(html).not.toContain('Desk <script>');
  });

  it('omits an empty byline while retaining the supplied published story and date', () => {
    const { html } = articleMarkup({ authors: [] });
    expect(html).not.toContain('data-article-byline');
    expect(html).toContain(article.title);
    expect(html).toContain(`data-timestamp='${article.publishedAt}'`);
  });
});
