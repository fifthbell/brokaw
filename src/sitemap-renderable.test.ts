import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { addContractFormats } from './json-schema-formats.js';

// The `sitemap` and `sitemap-index` renderables (fifthbell/cronkite#155), against
// the pinned inputs: `entries: [{ loc, lastmod, changefreq?, priority? }]` and
// `sitemaps: [{ loc, lastmod }]`.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const renderables = cronkiteManifest.templateRendering.renderables;
const readJson = (file: string) => JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'schemas', file), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validateSitemap = ajv.compile(readJson('sitemap-input.schema.json'));
const validateIndex = ajv.compile(readJson('sitemap-index-input.schema.json'));

/** A template rendered by plain Handlebars: neither declares a helper of its own. */
function render(name: 'sitemap' | 'sitemap-index', input: unknown): string {
  const source = fs.readFileSync(path.join(projectRoot, renderables[name].template.entry), 'utf8');
  return Handlebars.create().compile(source)(input);
}

const base = { id: 'sitemap', slug: 'sitemaps/2026-11.xml', status: 'published', language: 'en', contentVersion: '1' };
const sitemap = (entries: unknown[]) => ({ ...base, layout: 'sitemap', entries });
const index = (sitemaps: unknown[]) => ({ ...base, layout: 'sitemap-index', sitemaps });

/** The XML elements' text, decoded the way an XML parser reads it. */
function textsOf(xml: string, tag: string): string[] {
  const entities: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#x60;': '`', '&#x3D;': '=' };
  return [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))].map((match) =>
    match[1].replace(/&(?:amp|lt|gt|quot|#x27|#x60|#x3D);/g, (entity) => entities[entity]),
  );
}

describe('sitemap renderables', () => {
  it('are declared as XML with their own input schemas and no partial', () => {
    expect(renderables.sitemap).toEqual({
      template: { entry: 'src/templates/layouts/sitemap.hbs', partials: [] },
      inputSchema: 'dist/schemas/sitemap-input.schema.json',
      contentType: 'text/xml; charset=utf-8',
    });
    expect(renderables['sitemap-index']).toEqual({
      template: { entry: 'src/templates/layouts/sitemap-index.hbs', partials: [] },
      inputSchema: 'dist/schemas/sitemap-index-input.schema.json',
      contentType: 'text/xml; charset=utf-8',
    });
  });

  it('writes one url per entry, in order, with the story\'s real lastmod', () => {
    const document = sitemap([
      { loc: 'https://fifthbell.com/world/story-one', lastmod: '2026-11-22T12:42:18.286Z' },
      { loc: 'https://fifthbell.com/sports/story-two', lastmod: '2026-11-21T03:29:59+00:00', changefreq: 'daily', priority: 0.8 },
      { loc: 'https://fifthbell.com/', lastmod: '2026-11-22' },
    ]);
    expect(validateSitemap(document), JSON.stringify(validateSitemap.errors)).toBe(true);
    expect(render('sitemap', document)).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <url>',
        '    <loc>https://fifthbell.com/world/story-one</loc>',
        '    <lastmod>2026-11-22T12:42:18.286Z</lastmod>',
        '  </url>',
        '  <url>',
        '    <loc>https://fifthbell.com/sports/story-two</loc>',
        '    <lastmod>2026-11-21T03:29:59+00:00</lastmod>',
        '    <changefreq>daily</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
        '  <url>',
        '    <loc>https://fifthbell.com/</loc>',
        '    <lastmod>2026-11-22</lastmod>',
        '  </url>',
        '</urlset>',
        '',
      ].join('\n'),
    );
  });

  it('escapes & < > and quotes in a URL so the file stays valid XML and reads back as the same URL', () => {
    const loc = "https://fifthbell.com/search?q=a&b=<c>&d='e'&f=\"g\"";
    const document = sitemap([{ loc, lastmod: '2026-11-22' }]);
    expect(validateSitemap(document)).toBe(true);
    const xml = render('sitemap', document);
    expect(xml).not.toMatch(/<loc>[^<]*[&](?!amp;|lt;|gt;|quot;|#x27;|#x60;|#x3D;)/);
    expect(xml).toContain('&amp;');
    expect(textsOf(xml, 'loc')).toEqual([loc]);
    expect((xml.match(/<url>/g) ?? []).length).toBe(1);
  });

  it('writes the index files in order with their lastmod', () => {
    const document = index([
      { loc: 'https://fifthbell.com/sitemaps/pages.xml', lastmod: '2026-11-22' },
      { loc: 'https://fifthbell.com/sitemaps/2026-11.xml', lastmod: '2026-11-22T12:42:18Z' },
      { loc: 'https://fifthbell.com/sitemaps/2026-10.xml', lastmod: '2026-10-31T23:59:59Z' },
    ]);
    expect(validateIndex(document), JSON.stringify(validateIndex.errors)).toBe(true);
    expect(render('sitemap-index', document)).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        '  <sitemap>',
        '    <loc>https://fifthbell.com/sitemaps/pages.xml</loc>',
        '    <lastmod>2026-11-22</lastmod>',
        '  </sitemap>',
        '  <sitemap>',
        '    <loc>https://fifthbell.com/sitemaps/2026-11.xml</loc>',
        '    <lastmod>2026-11-22T12:42:18Z</lastmod>',
        '  </sitemap>',
        '  <sitemap>',
        '    <loc>https://fifthbell.com/sitemaps/2026-10.xml</loc>',
        '    <lastmod>2026-10-31T23:59:59Z</lastmod>',
        '  </sitemap>',
        '</sitemapindex>',
        '',
      ].join('\n'),
    );
  });

  it('caps a file at 4,000 entries, none is not a file', () => {
    const entry = { loc: 'https://fifthbell.com/a', lastmod: '2026-11-22' };
    expect(validateSitemap(sitemap(Array.from({ length: 4000 }, () => entry)))).toBe(true);
    expect(validateSitemap(sitemap(Array.from({ length: 4001 }, () => entry)))).toBe(false);
    expect(validateSitemap(sitemap([]))).toBe(false);
    expect(validateIndex(index(Array.from({ length: 4000 }, () => entry)))).toBe(true);
    expect(validateIndex(index(Array.from({ length: 4001 }, () => entry)))).toBe(false);
    expect(validateIndex(index([]))).toBe(false);
  });

  it('can never render past the 50 MB uncompressed limit: a full file of the worst-case entries stays under 50,000,000 bytes', () => {
    // The longest loc the schema admits, made of the characters Handlebars escapes to the most bytes (6 each),
    // with every optional field present at its longest.
    const loc = `https://${'"'.repeat(2048 - 'https://'.length)}`;
    const lastmod = `2026-11-22T10:20:30.${'1'.repeat(19)}Z`;
    expect(lastmod).toHaveLength(40);
    const entry = { loc, lastmod, changefreq: 'monthly', priority: 0.30000000000000004 };
    const sitemapDocument = sitemap(Array.from({ length: 4000 }, () => entry));
    expect(validateSitemap(sitemapDocument), JSON.stringify(validateSitemap.errors?.slice(0, 2))).toBe(true);
    const sitemapBytes = Buffer.byteLength(render('sitemap', sitemapDocument));
    expect(sitemapBytes).toBeLessThan(50_000_000);
    expect(sitemapBytes).toBeGreaterThan(49_000_000);
    const indexDocument = index(Array.from({ length: 4000 }, () => ({ loc, lastmod })));
    expect(validateIndex(indexDocument), JSON.stringify(validateIndex.errors?.slice(0, 2))).toBe(true);
    expect(Buffer.byteLength(render('sitemap-index', indexDocument))).toBeLessThan(50_000_000);
  });

  it('refuses a loc that is not an absolute https URL without whitespace or control characters, or is longer than 2,048', () => {
    const lastmod = '2026-11-22';
    for (const loc of ['http://fifthbell.com/a', '/a', 'ftp://x/y', 'https://a b/c', 'https://a/\nb', 'https://a/\tb', 'javascript:alert(1)', `https://fifthbell.com/${'a'.repeat(2048)}`]) {
      expect(validateSitemap(sitemap([{ loc, lastmod }])), loc).toBe(false);
      expect(validateIndex(index([{ loc, lastmod }])), loc).toBe(false);
    }
    expect(validateSitemap(sitemap([{ loc: `https://fifthbell.com/${'a'.repeat(2000)}`, lastmod }]))).toBe(true);
  });

  it('requires a real lastmod: a W3C date or date-time with a zone, never free text', () => {
    const loc = 'https://fifthbell.com/a';
    for (const lastmod of ['', 'yesterday', '2026-11-22 12:00:00', '2026-11-22T12:00:00', '22/11/2026', '2026-11-22T12:00:00Z\n']) {
      expect(validateSitemap(sitemap([{ loc, lastmod }])), lastmod).toBe(false);
    }
    expect(validateSitemap(sitemap([{ loc }]))).toBe(false);
    expect(validateIndex(index([{ loc }]))).toBe(false);
    expect(validateSitemap(sitemap([{ loc, lastmod: '2026-11-22T12:00:00.5-05:00' }]))).toBe(true);
  });

  it('accepts only the protocol values of changefreq and priority', () => {
    const entry = { loc: 'https://fifthbell.com/a', lastmod: '2026-11-22' };
    expect(validateSitemap(sitemap([{ ...entry, changefreq: 'sometimes' }]))).toBe(false);
    expect(validateSitemap(sitemap([{ ...entry, priority: 1.5 }]))).toBe(false);
    expect(validateSitemap(sitemap([{ ...entry, priority: -0.1 }]))).toBe(false);
    expect(validateSitemap(sitemap([{ ...entry, changefreq: 'never', priority: 0 }]))).toBe(true);
    const xml = render('sitemap', sitemap([{ ...entry, changefreq: 'never', priority: 0 }]));
    expect(xml).toContain('<changefreq>never</changefreq>');
    // a priority of 0 is a value, not an absence
    expect(textsOf(xml, 'priority')).toEqual(['0']);
  });

  it('does not need a layout, and refuses another renderable\'s name when one is sent', () => {
    const entry = { loc: 'https://fifthbell.com/a', lastmod: '2026-11-22' };
    const { layout: _a, ...sitemapWithout } = sitemap([entry]);
    const { layout: _b, ...indexWithout } = index([entry]);
    expect(validateSitemap(sitemapWithout), JSON.stringify(validateSitemap.errors)).toBe(true);
    expect(validateIndex(indexWithout), JSON.stringify(validateIndex.errors)).toBe(true);
    expect(render('sitemap', sitemapWithout)).toBe(render('sitemap', sitemap([entry])));
    expect(render('sitemap-index', indexWithout)).toBe(render('sitemap-index', index([entry])));
  });

  it('is for a published document of its own layout only, and ignores keys it does not know', () => {
    const entry = { loc: 'https://fifthbell.com/a', lastmod: '2026-11-22' };
    expect(validateSitemap({ ...sitemap([entry]), status: 'draft' })).toBe(false);
    expect(validateSitemap({ ...sitemap([entry]), layout: 'feed' })).toBe(false);
    expect(validateIndex({ ...index([entry]), layout: 'sitemap' })).toBe(false);
    expect(validateSitemap({ ...sitemap([{ ...entry, images: [1] }]), future: { a: 1 } })).toBe(true);
    expect(render('sitemap', { ...sitemap([{ ...entry, images: ['x'] }]) })).not.toContain('images');
  });

  it('uses only built-in Handlebars constructs and no partial', () => {
    for (const name of ['sitemap', 'sitemap-index'] as const) {
      const source = fs.readFileSync(path.join(projectRoot, renderables[name].template.entry), 'utf8').replace(/\{\{!--[\s\S]*?--\}\}/g, '');
      const names = [...source.matchAll(/\{\{\{?\s*[#/^]?\s*([a-zA-Z@][\w.@]*)/g)].map((match) => match[1]);
      const allowed = new Set(['each', 'if', 'entries', 'sitemaps', 'loc', 'lastmod', 'changefreq', 'priority']);
      expect([...new Set(names)].filter((item) => !allowed.has(item)), name).toEqual([]);
      expect(source).not.toContain('{{>');
    }
  });
});
