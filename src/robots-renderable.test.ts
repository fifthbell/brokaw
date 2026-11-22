import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { addContractFormats } from './json-schema-formats.js';

// The `robots` renderable (fifthbell/cronkite#156), against the pinned input: a
// document with `rules: [{ userAgent, allow[], disallow[] }]` and `sitemaps: [url]`.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const definition = cronkiteManifest.templateRendering.renderables.robots;
const schema = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'schemas', 'robots-input.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validate = ajv.compile(schema);

/** The template rendered by plain Handlebars: it declares no helper of its own. */
function render(input: unknown): string {
  const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8');
  return Handlebars.create().compile(source)(input);
}

const base = { id: 'robots', slug: 'robots.txt', layout: 'robots', status: 'published', language: 'en', contentVersion: '1' };

// fifthbell.com's robots.txt of 2026-11-22 (S3, last modified 2026-02-09), as the
// CMS would send it. Crawl-delay is not part of the contract and is dropped.
const fifthbell = {
  ...base,
  rules: [
    {
      userAgent: '*',
      allow: ['/', '/_astro/*.css', '/_astro/*.js'],
      disallow: ['/admin/', '/api/', '/_astro/', '/cdn/', '/*?', '/*.php$', '/*.asp$', '/*.jsp$'],
    },
  ],
  sitemaps: ['https://fifthbell.com/sitemap.xml'],
};

describe('robots renderable', () => {
  it('is declared as plain text with its own input schema and no partial', () => {
    expect(definition).toEqual({
      template: { entry: 'src/templates/layouts/robots.hbs', partials: [] },
      inputSchema: 'dist/schemas/robots-input.schema.json',
      contentType: 'text/plain; charset=utf-8',
    });
  });

  it("carries fifthbell.com's current rules, semantically equal and without Crawl-delay", () => {
    expect(validate(fifthbell), JSON.stringify(validate.errors)).toBe(true);
    expect(render(fifthbell)).toBe(
      [
        'User-agent: *',
        'Allow: /',
        'Allow: /_astro/*.css',
        'Allow: /_astro/*.js',
        'Disallow: /admin/',
        'Disallow: /api/',
        'Disallow: /_astro/',
        'Disallow: /cdn/',
        'Disallow: /*?',
        'Disallow: /*.php$',
        'Disallow: /*.asp$',
        'Disallow: /*.jsp$',
        '',
        'Sitemap: https://fifthbell.com/sitemap.xml',
        '',
      ].join('\n'),
    );
  });

  it('keeps the rules in the given order, one group per user agent, with a blank line between groups', () => {
    const document = {
      ...base,
      rules: [
        { userAgent: 'Googlebot', allow: ['/news/'], disallow: ['/private/'] },
        { userAgent: 'BadBot', disallow: ['/'] },
        { userAgent: '*', allow: ['/'] },
      ],
      sitemaps: [],
    };
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    expect(render(document)).toBe(
      [
        'User-agent: Googlebot',
        'Allow: /news/',
        'Disallow: /private/',
        '',
        'User-agent: BadBot',
        'Disallow: /',
        '',
        'User-agent: *',
        'Allow: /',
        '',
        '',
      ].join('\n'),
    );
  });

  it('renders a rule with empty or missing allow and disallow as its user-agent line alone', () => {
    const document = { ...base, rules: [{ userAgent: 'A', allow: [], disallow: [] }, { userAgent: 'B' }], sitemaps: [] };
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    expect(render(document)).toBe(['User-agent: A', '', 'User-agent: B', '', ''].join('\n'));
  });

  it('writes one Sitemap line per URL, in order', () => {
    const document = {
      ...base,
      rules: [{ userAgent: '*', allow: ['/'] }],
      sitemaps: ['https://fifthbell.com/sitemap.xml', 'https://fifthbell.com/es/sitemap.xml'],
    };
    expect(validate(document)).toBe(true);
    expect(render(document).split('\n').filter((line) => line.startsWith('Sitemap:'))).toEqual([
      'Sitemap: https://fifthbell.com/sitemap.xml',
      'Sitemap: https://fifthbell.com/es/sitemap.xml',
    ]);
  });

  it('writes characters as they are: no HTML escaping of a path with & or quotes', () => {
    const document = { ...base, rules: [{ userAgent: '*', disallow: ['/a&b/', "/it's/", '/x<y>/'] }], sitemaps: [] };
    expect(validate(document)).toBe(true);
    expect(render(document)).toContain("Disallow: /a&b/\nDisallow: /it's/\nDisallow: /x<y>/\n");
  });

  it('refuses a document with no rules, so a missing rule set is never allow-all', () => {
    for (const rules of [undefined, [], null]) {
      const document: Record<string, unknown> = { ...base, sitemaps: [] };
      if (rules !== undefined) document.rules = rules;
      expect(validate(document)).toBe(false);
    }
  });

  it('refuses a value that could add a directive: a line break or another control character', () => {
    for (const bad of ['/ok/\nDisallow: /', '/ok/\rAllow: /', 'a b', 'tab\there', '\u0000']) {
      expect(validate({ ...base, rules: [{ userAgent: '*', disallow: [bad] }], sitemaps: [] }), JSON.stringify(bad)).toBe(false);
      expect(validate({ ...base, rules: [{ userAgent: bad }], sitemaps: [] }), JSON.stringify(bad)).toBe(false);
    }
    expect(validate({ ...base, rules: [{ userAgent: '*' }], sitemaps: ['https://fifthbell.com/s.xml\nDisallow: /'] })).toBe(false);
    expect(validate({ ...base, rules: [{ userAgent: '' }], sitemaps: [] })).toBe(false);
    expect(validate({ ...base, rules: [{ userAgent: '*', allow: [''] }], sitemaps: [] })).toBe(false);
  });

  it('accepts only absolute https sitemap URLs', () => {
    for (const bad of ['http://fifthbell.com/sitemap.xml', '/sitemap.xml', 'ftp://x/y', 'https://a b/c', 'javascript:alert(1)']) {
      expect(validate({ ...base, rules: [{ userAgent: '*' }], sitemaps: [bad] }), bad).toBe(false);
    }
  });

  it('is for a published robots document only, and ignores keys it does not know', () => {
    expect(validate({ ...base, status: 'draft', rules: [{ userAgent: '*' }], sitemaps: [] })).toBe(false);
    expect(validate({ ...base, layout: 'sitemap', rules: [{ userAgent: '*' }], sitemaps: [] })).toBe(false);
    const withExtras = { ...base, rules: [{ userAgent: '*', allow: ['/'], crawlDelay: 5, note: 'x' }], sitemaps: [], future: { a: 1 } };
    expect(validate(withExtras)).toBe(true);
    expect(render(withExtras)).not.toContain('Crawl');
  });

  it('uses only built-in Handlebars constructs: no custom helper and no partial', () => {
    const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8').replace(/\{\{!--[\s\S]*?--\}\}/g, '');
    const names = [...source.matchAll(/\{\{\{?\s*[#/^]?\s*([a-zA-Z@][\w.@]*)/g)].map((match) => match[1]);
    const allowed = new Set(['each', 'userAgent', 'allow', 'disallow', 'sitemaps', 'rules', 'this']);
    expect([...new Set(names)].filter((name) => !allowed.has(name))).toEqual([]);
    expect(source).not.toContain('{{>');
  });
});
