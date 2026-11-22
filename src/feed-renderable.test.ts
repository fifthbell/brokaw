import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Ajv2020 } from 'ajv/dist/2020.js';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { addContractFormats } from './json-schema-formats.js';

// The `feed` renderable (fifthbell/cronkite#157), against the pinned input: one
// language's latest released stories as an Atom 1.0 document.

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const definition = cronkiteManifest.templateRendering.renderables.feed;
const schema = JSON.parse(fs.readFileSync(path.join(projectRoot, 'src', 'schemas', 'feed-input.schema.json'), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validate = ajv.compile(schema);

/** The template rendered by plain Handlebars: it declares no helper of its own. */
function render(input: unknown): string {
  const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8');
  return Handlebars.create().compile(source)(input);
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#x60;': '`', '&#x3D;': '=' };
const decode = (value: string) => value.replace(/&(?:amp|lt|gt|quot|#x27|#x60|#x3D);/g, (entity) => ENTITIES[entity]);
/** Texts of every `<tag>` element, decoded as an XML parser reads them. */
const texts = (xml: string, tag: string) => [...xml.matchAll(new RegExp(`<${tag}>([^<]*)</${tag}>`, 'g'))].map((match) => decode(match[1]));

const entry = (n: number, extra: Record<string, unknown> = {}) => ({
  id: `https://fifthbell.com/world/story-${n}`,
  title: `Story ${n}`,
  url: `https://fifthbell.com/world/story-${n}`,
  published: '2026-11-22T11:39:22.529Z',
  updated: '2026-11-22T12:07:01.310Z',
  summary: `Summary ${n}`,
  ...extra,
});
const feed = (entries: unknown[], extra: Record<string, unknown> = {}) => ({
  id: 'feed',
  slug: 'feed.xml',
  layout: 'feed',
  status: 'published',
  language: 'en',
  contentVersion: '1',
  title: 'fifthbell',
  homeUrl: 'https://fifthbell.com/',
  selfUrl: 'https://fifthbell.com/feed.xml',
  updated: '2026-11-22T12:07:01.310Z',
  entries,
  ...extra,
});

describe('feed renderable', () => {
  it('is declared as XML with its own input schema and no partial', () => {
    expect(definition).toEqual({
      template: { entry: 'src/templates/layouts/feed.hbs', partials: [] },
      inputSchema: 'dist/schemas/feed-input.schema.json',
      contentType: 'text/xml; charset=utf-8',
    });
  });

  it('writes an Atom 1.0 feed: its links, id and date, then one entry per story in the given order', () => {
    const document = feed([entry(1, { imageUrl: 'https://fifthbell.com/media/one.jpg' }), entry(2)], { subtitle: 'Breaking news' });
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    expect(render(document)).toBe(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en">',
        '  <title>fifthbell</title>',
        '  <subtitle>Breaking news</subtitle>',
        '  <link rel="alternate" type="text/html" href="https://fifthbell.com/"/>',
        '  <link rel="self" type="application/atom+xml" href="https://fifthbell.com/feed.xml"/>',
        '  <id>https://fifthbell.com/feed.xml</id>',
        '  <updated>2026-11-22T12:07:01.310Z</updated>',
        '  <entry>',
        '    <title>Story 1</title>',
        '    <link rel="alternate" type="text/html" href="https://fifthbell.com/world/story-1"/>',
        '    <id>https://fifthbell.com/world/story-1</id>',
        '    <published>2026-11-22T11:39:22.529Z</published>',
        '    <updated>2026-11-22T12:07:01.310Z</updated>',
        '    <summary>Summary 1</summary>',
        '    <link rel="enclosure" href="https://fifthbell.com/media/one.jpg"/>',
        '  </entry>',
        '  <entry>',
        '    <title>Story 2</title>',
        '    <link rel="alternate" type="text/html" href="https://fifthbell.com/world/story-2"/>',
        '    <id>https://fifthbell.com/world/story-2</id>',
        '    <published>2026-11-22T11:39:22.529Z</published>',
        '    <updated>2026-11-22T12:07:01.310Z</updated>',
        '    <summary>Summary 2</summary>',
        '  </entry>',
        '</feed>',
        '',
      ].join('\n'),
    );
  });

  it('puts the language of the document in xml:lang and omits an absent subtitle', () => {
    const xml = render(feed([entry(1)], { language: 'es' }));
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="es">');
    expect(xml).not.toContain('<subtitle>');
  });

  it('never invents an element: an entry without summary or image has neither', () => {
    const { summary: _summary, ...bare } = entry(1);
    const document = feed([bare]);
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    const xml = render(document);
    expect(xml).not.toContain('<summary>');
    expect(xml).not.toContain('enclosure');
    expect(texts(xml, 'title')).toEqual(['fifthbell', 'Story 1']);
  });

  it('escapes markup in titles, summaries and URLs so the XML stays valid and reads back unchanged', () => {
    const tricky = { title: 'Q&A: "5 < 6" & <b>more</b>', summary: "It's <i>fine</i> & ok", url: 'https://fifthbell.com/a?x=1&y=2' };
    const document = feed([entry(1, { ...tricky, id: tricky.url })]);
    expect(validate(document), JSON.stringify(validate.errors)).toBe(true);
    const xml = render(document);
    expect(xml).not.toContain('<b>');
    expect(xml).not.toContain('<i>');
    expect(texts(xml, 'summary')).toEqual([tricky.summary]);
    expect(texts(xml, 'title')[1]).toBe(tricky.title);
    expect(texts(xml, 'id')).toEqual(['https://fifthbell.com/feed.xml', tricky.url]);
    const hrefs = [...xml.matchAll(/href="([^"]*)"/g)].map((match) => decode(match[1]));
    expect(hrefs).toContain(tricky.url);
    expect(xml).not.toMatch(/href="[^"]*&(?!amp;|lt;|gt;|quot;|#x27;|#x60;|#x3D;)/);
  });

  it('holds at most 50 entries, and an empty feed is still a feed', () => {
    expect(validate(feed(Array.from({ length: 50 }, (_, index) => entry(index))))).toBe(true);
    expect(validate(feed(Array.from({ length: 51 }, (_, index) => entry(index))))).toBe(false);
    expect(validate(feed([]))).toBe(true);
    expect(render(feed([]))).not.toContain('<entry>');
  });

  it('requires absolute https URLs and RFC 3339 dates with a zone, and refuses control characters in text', () => {
    for (const bad of ['http://fifthbell.com/a', '/a', 'https://a b/c', 'https://a/\nb']) {
      expect(validate(feed([entry(1, { url: bad })])), bad).toBe(false);
      expect(validate(feed([entry(1, { id: bad })])), bad).toBe(false);
      expect(validate(feed([entry(1, { imageUrl: bad })])), bad).toBe(false);
      expect(validate(feed([entry(1)], { homeUrl: bad })), bad).toBe(false);
      expect(validate(feed([entry(1)], { selfUrl: bad })), bad).toBe(false);
    }
    for (const bad of ['2026-11-22', '2026-11-22T12:00:00', 'yesterday', '']) {
      expect(validate(feed([entry(1, { published: bad })])), bad).toBe(false);
      expect(validate(feed([entry(1, { updated: bad })])), bad).toBe(false);
      expect(validate(feed([entry(1)], { updated: bad })), bad).toBe(false);
    }
    expect(validate(feed([entry(1, { title: 'bad\u0001title' })]))).toBe(false);
    expect(validate(feed([entry(1, { title: '' })]))).toBe(false);
    expect(validate(feed([entry(1, { summary: 'bad\u0000' })]))).toBe(false);
    expect(validate(feed([entry(1)], { title: '' }))).toBe(false);
    expect(validate(feed([entry(1)], { language: 'English' }))).toBe(false);
  });

  it('does not need a layout, and refuses another renderable\'s name when one is sent', () => {
    const { layout: _layout, ...withoutLayout } = feed([entry(1)]);
    expect(validate(withoutLayout), JSON.stringify(validate.errors)).toBe(true);
    expect(render(withoutLayout)).toBe(render(feed([entry(1)])));
    expect(validate(feed([entry(1)], { layout: 'robots' }))).toBe(false);
  });

  it('is for a published feed document only, and ignores keys it does not know', () => {
    expect(validate(feed([entry(1)], { status: 'draft' }))).toBe(false);
    expect(validate(feed([entry(1)], { layout: 'sitemap' }))).toBe(false);
    const withExtras = feed([entry(1, { author: 'x', tags: ['a'] })], { future: { a: 1 } });
    expect(validate(withExtras)).toBe(true);
    expect(render(withExtras)).not.toContain('author');
  });

  it('uses only built-in Handlebars constructs and no partial', () => {
    const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8').replace(/\{\{!--[\s\S]*?--\}\}/g, '');
    const names = [...source.matchAll(/\{\{\{?\s*[#/^]?\s*([a-zA-Z@][\w.@]*)/g)].map((match) => match[1]);
    const allowed = new Set(['each', 'if', 'language', 'title', 'subtitle', 'homeUrl', 'selfUrl', 'updated', 'entries', 'url', 'id', 'published', 'summary', 'imageUrl']);
    expect([...new Set(names)].filter((item) => !allowed.has(item))).toEqual([]);
    expect(source).not.toContain('{{>');
  });
});
