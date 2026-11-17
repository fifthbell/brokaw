import { createRequire } from 'node:module';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IGNORED_INPUT_REASONS, ignoredInputCounts, type IgnoredInputReason } from './ignored-input.js';
import { addContractFormats } from './json-schema-formats.js';
import { render } from './renderer.node.js';
import type { CanonicalDocument } from './types/canonical-article.js';

// gaulatti/ariston#217: "If we don't recognize it, we ignore it." Cronkite
// validates every publish request against these packaged input schemas, and
// Brokaw's renderer validates the document again; neither refuses a member or
// value it does not know. Each fallback here is the documented one.

const require = createRequire(import.meta.url);
const schema = (name: string) => require(`./schemas/${name}.schema.json`) as object;
const ajv = new Ajv2020({ allErrors: true, strict: false });
addContractFormats(ajv);
const validates = (name: string, input: unknown) => ajv.validate(schema(name), input);

function ignoredBy<T>(reason: IgnoredInputReason, task: () => T): [T, number] {
  const before = ignoredInputCounts()[reason];
  const result = task();
  return [result, ignoredInputCounts()[reason] - before];
}

const article = (extra: Record<string, unknown> = {}): CanonicalDocument => ({
  id: 'article-1',
  slug: '/news/article-1',
  layout: 'article-page',
  canonicalUrl: 'https://fifthbell.com/news/article-1',
  contentVersion: '2026-11-17T00:00:00.000Z',
  publishedAt: '2026-11-17T00:00:00.000Z',
  updatedAt: '2026-11-17T00:00:00.000Z',
  status: 'published',
  title: 'Article one',
  language: 'en',
  featured: false,
  authors: [],
  categories: [],
  body: [{ type: 'heading', level: 2, text: 'Known heading' }],
  ...extra,
}) as CanonicalDocument;

afterEach(() => vi.restoreAllMocks());

describe('packaged input schemas accept members they do not define', () => {
  it.each([
    ['feed-renderable-input', { document: {}, feed: {}, cursor: 'next' }],
    ['social-image-input', { imageUrl: 'https://cdn.fifthbell.com/a.jpg', categoryName: 'World', title: 'T', qrCodeHtml: '<svg/>', theme: 'dark' }],
    ['live-program-release-input', { programId: 'fifthbell', apiBaseUrl: 'https://api.example.test/p', channel: 'b' }],
  ])('%s', (name, input) => {
    expect(validates(name, input)).toBe(true);
  });

  it('still requires what each schema requires', () => {
    expect(validates('feed-renderable-input', { feed: {} })).toBe(false);
    expect(validates('social-image-input', { imageUrl: 'https://cdn.fifthbell.com/a.jpg', theme: 'dark' })).toBe(false);
  });

  it('canonical document: unknown block types, tones, hero layouts and selection members', () => {
    const selection = {
      selectionId: 's-1',
      catalogUrl: 'https://cdn.fifthbell.com/catalog.json',
      context: { rendererVersion: '1', templateVersion: '1', tenant: 'fifthbell', origin: 'https://fifthbell.com', build: 'b', region: 'eu' },
      locale: 'en',
      issuedBy: 'cms',
    };
    const document = article({
      heroLayout: 'mosaic',
      capturedSelection: selection,
      body: [{ type: 'poll', question: 'Q?' }, { type: 'infoBox', tone: 'critical', html: '<p>x</p>' }, { type: 'heading', level: 6, text: 'h' }],
    });
    expect(validates('canonical-document', document)).toBe(true);
  });

  it('canonical document KEEP rows stay strict: status, locale, known blocks', () => {
    expect(validates('canonical-document', article({ status: 'scheduled' }))).toBe(false);
    const selection = {
      selectionId: 's-1',
      catalogUrl: 'https://cdn.fifthbell.com/catalog.json',
      context: { rendererVersion: '1', templateVersion: '1', tenant: 'fifthbell', origin: 'https://fifthbell.com', build: 'b' },
      locale: 'xx',
    };
    expect(validates('canonical-document', article({ capturedSelection: selection }))).toBe(false);
    // A known block type keeps its own required members.
    expect(validates('canonical-document', article({ body: [{ type: 'heading', level: 2 }] }))).toBe(false);
    expect(validates('canonical-document', article({ body: [{ text: 'no type' }] }))).toBe(false);
  });
});

describe('the renderer applies the documented fallback and counts it', () => {
  it('drops a body block of a type it does not render', () => {
    const [html, dropped] = ignoredBy('document_body_block_type', () =>
      render(article({ body: [{ type: 'poll', question: 'Unrendered question' }, { type: 'heading', level: 2, text: 'Known heading' }] })));
    expect(dropped).toBe(1);
    expect(html).toContain('Known heading');
    expect(html).not.toContain('Unrendered question');
  });

  it('renders a heading with a level it does not know as level 2', () => {
    const level2 = render(article({ body: [{ type: 'heading', level: 2, text: 'Deep heading' }] }));
    const [html, levels] = ignoredBy('document_heading_level', () =>
      render(article({ body: [{ type: 'heading', level: 6, text: 'Deep heading' }] })));
    expect(levels).toBe(1);
    expect(html).toBe(level2);
  });

  it('renders an info box with a tone it does not know as neutral', () => {
    const neutral = render(article({ body: [{ type: 'infoBox', tone: 'neutral', html: '<p>Box text</p>' }] }));
    const [html, tones] = ignoredBy('document_info_box_tone', () =>
      render(article({ body: [{ type: 'infoBox', tone: 'critical', html: '<p>Box text</p>' }] })));
    expect(tones).toBe(1);
    expect(html).toBe(neutral);
  });

  it('treats a hero layout it does not know as absent', () => {
    const absent = render(article());
    const [html, layouts] = ignoredBy('document_hero_layout', () => render(article({ heroLayout: 'mosaic' })));
    expect(layouts).toBe(1);
    expect(html).toBe(absent);
    const [, known] = ignoredBy('document_hero_layout', () => render(article({ heroLayout: 'editorial' })));
    expect(known).toBe(0);
  });

  it('still refuses a body entry that is not a block at all', () => {
    for (const entry of [null, 'loose text', { text: 'no type' }]) {
      expect(() => render(article({ body: [entry] }))).toThrow('Canonical document validation failed');
    }
  });

  it('keeps retired block types silent: they are known and dropped, not unrecognized', () => {
    const [, dropped] = ignoredBy('document_body_block_type', () => render(article({ body: [{ type: 'truthSocial', post: 'x' }] })));
    expect(dropped).toBe(0);
  });
});

describe('ignored-input counters', () => {
  it('count every reason and write one log line per reason, naming only the reason', async () => {
    vi.resetModules();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const fresh = await import('./ignored-input.js');
    expect(Object.values(fresh.ignoredInputCounts())).toEqual(IGNORED_INPUT_REASONS.map(() => 0));
    fresh.recordIgnoredInput('rum_config_field');
    fresh.recordIgnoredInput('rum_config_field', 3);
    fresh.recordIgnoredInput('document_hero_layout', 0);
    fresh.recordUnknownMembers({ a: 1, b: 2, secret: 'value' }, ['a'], 'captured_catalog_field');
    expect(fresh.ignoredInputCounts()).toMatchObject({ rum_config_field: 4, document_hero_layout: 0, captured_catalog_field: 2 });
    expect(warn.mock.calls).toEqual([
      ['[brokaw] ignored unrecognized input: rum_config_field'],
      ['[brokaw] ignored unrecognized input: captured_catalog_field'],
    ]);
    expect(Object.isFrozen(fresh.ignoredInputCounts())).toBe(true);
  });
});
