import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { render } from './renderer.node.js';
import type { CanonicalDocument } from './types/canonical-article.js';

const defaultBase = 'https://cdn.fifthbell.com/contents/assignments/';
const customBase = 'http://127.0.0.1:14571/fictional-bucket/contents/assignments/';
const readerOrigin = 'https://reader.example.test';

function mediaDocument(assignmentMediaBaseUrl: string): CanonicalDocument {
  return {
    id: 'fictional-media-page',
    slug: '/mediathek',
    layout: 'media-page',
    canonicalUrl: 'https://fifthbell.com/mediathek',
    contentVersion: '2026-10-19T00:00:00.000Z',
    publishedAt: '2026-10-19T00:00:00.000Z',
    updatedAt: '2026-10-19T00:00:00.000Z',
    status: 'published',
    title: 'Fictional Mediathek',
    excerpt: 'Fictional assignment photos.',
    language: 'en',
    featured: false,
    authors: [{ name: 'Fictional Newsroom', slug: 'fictional-newsroom' }],
    categories: [],
    navigation: { categories: [] },
    logoLink: '/',
    seo: { metaTitle: 'Fictional Mediathek', metaDescription: 'Fictional assignment photos.' },
    body: [],
    assignmentMediaBaseUrl,
  };
}

type ClickEvent = { target: FixtureElement; preventDefault: () => void };

// Minimal DOM boundaries for the shipped script, without a second gallery
// implementation. innerHTML is written only by that script. Native parsing,
// geometry, focus and image loading remain browser/Storybook acceptance.
class FixtureElement {
  private content = '';
  private readonly classes: Set<string>;
  readonly listeners = new Map<string, (event: ClickEvent) => void>();
  onTerminal?: () => void;
  innerHTML = '';
  href = '';

  constructor(readonly id: string, classes = '') {
    this.classes = new Set(classes.split(/\s+/).filter(Boolean));
  }

  get textContent() { return this.content; }
  set textContent(value: string) {
    this.content = value;
    if (this.id === 'media-status') this.onTerminal?.();
  }

  readonly classList = {
    add: (...tokens: string[]) => {
      for (const token of tokens) this.classes.add(token);
      if (this.id === 'media-status' && tokens.includes('hidden')) this.onTerminal?.();
    },
    remove: (...tokens: string[]) => {
      for (const token of tokens) this.classes.delete(token);
    },
    contains: (token: string) => this.classes.has(token),
  };

  addEventListener(type: string, listener: (event: ClickEvent) => void) {
    this.listeners.set(type, listener);
  }

  closest(_selector: string): FixtureElement | null { return null; }
}

class FixtureAnchor extends FixtureElement {
  constructor(href: string) {
    super('pagination-link');
    this.href = href;
  }

  override closest(selector: string) { return selector === 'a[href]' ? this : null; }
  getAttribute(name: string) { return name === 'href' ? this.href : null; }
}

type PublicResponse = { ok: boolean; status: number; json: () => Promise<unknown> };

async function run(path: string, options: { base?: string; response?: PublicResponse } = {}) {
  const html = render(mediaDocument(options.base ?? defaultBase));
  const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .map((match) => match[1])
    .filter((source) => source.includes("document.querySelector('[data-media-page]')"));
  expect(scripts).toHaveLength(1);
  const script = scripts[0];
  const elements = new Map<string, FixtureElement>();
  for (const id of ['media-title', 'media-meta', 'media-status', 'media-grid', 'media-pagination', 'media-refresh']) {
    const tag = html.match(new RegExp(`<[^>]*\\bid=['"]${id}['"][^>]*>`))?.[0];
    expect(tag, `The actual rendered page supplies ${id}`).toBeDefined();
    const classes = tag!.match(/\bclass=['"]([^'"]*)['"]/)?.[1] ?? '';
    elements.set(id, new FixtureElement(id, classes));
  }
  const element = (id: string) => elements.get(id)!;
  let complete!: () => void;
  const completed = new Promise<void>((resolve) => { complete = resolve; });
  element('media-status').onTerminal = complete;
  const history = [new URL(path, readerOrigin).href];
  let historyIndex = 0;
  const windowListeners = new Map<string, Array<() => void>>();
  const window = {
    location: {
      get pathname() { return new URL(history[historyIndex]).pathname; },
      get href() { return history[historyIndex]; },
    },
    history: {
      pushState(_state: unknown, _title: string, href: string) {
        history.splice(historyIndex + 1);
        history.push(new URL(href, history[historyIndex]).href);
        historyIndex++;
      },
    },
    addEventListener(type: string, listener: () => void) {
      windowListeners.set(type, [...(windowListeners.get(type) ?? []), listener]);
    },
  };
  const document = {
    querySelector: (selector: string) => selector === '[data-media-page]' && html.includes('data-media-page') ? new FixtureElement('main-content') : null,
    getElementById: (id: string) => elements.get(id) ?? null,
  };
  const fetch = vi.fn(async (_url: string, _options: unknown) => options.response ?? {
    ok: true, status: 200, json: async () => ({ photos: [] }),
  });
  vm.runInNewContext(script, { URL, document, window, fetch, Element: FixtureElement, HTMLAnchorElement: FixtureAnchor });
  await completed;
  await Promise.resolve();

  function moveHistory(delta: number) {
    const next = historyIndex + delta;
    if (next < 0 || next >= history.length) throw new Error('Fixture history entry does not exist');
    historyIndex = next;
    for (const listener of windowListeners.get('popstate') ?? []) listener();
  }

  return {
    html, script, fetch, element,
    href: () => window.location.href,
    back: () => moveHistory(-1),
    forward: () => moveHistory(1),
    clickPagination(label: 'Next page' | 'Previous page') {
      const tag = element('media-pagination').innerHTML.match(new RegExp(`<a\\b[^>]*aria-label="${label}"[^>]*>`))?.[0];
      expect(tag, `The actual script renders ${label}`).toBeDefined();
      const href = tag!.match(/\bhref="([^"]+)"/)![1].replaceAll('&amp;', '&');
      const preventDefault = vi.fn();
      element('media-pagination').listeners.get('click')!({ target: new FixtureAnchor(href), preventDefault });
      expect(preventDefault).toHaveBeenCalledOnce();
    },
  };
}

const response = (data: unknown): PublicResponse => ({ ok: true, status: 200, json: async () => data });
const figureCount = (html: string) => [...html.matchAll(/<figure\b/g)].length;

describe('shared Mediathek browser route through the actual rendered script', () => {
  it.each(['gotham.angel.20261004', 'photo.jpg', '%E2%9C%93'])('loads assignment JSON for opaque key %s', async (key) => {
    for (const suffix of ['', '/']) {
      const result = await run(`/mediathek/${key}${suffix}`);
      expect(result.fetch).toHaveBeenCalledOnce();
      expect(result.fetch).toHaveBeenCalledWith(`${defaultBase}${encodeURIComponent(decodeURIComponent(key))}.json`, { cache: 'no-store' });
    }
  });

  it('does not treat the media category as an assignment page', async () => {
    const result = await run('/media/news');
    expect(result.fetch).not.toHaveBeenCalled();
    expect(result.element('media-status').textContent).toBe('Missing assignment id.');
    expect(result.element('media-grid').classList.contains('hidden')).toBe(true);
  });

  it('fetches the supplied loopback bucket directory and renders producer photo URLs for an encoded opaque key', async () => {
    const key = 'folder/key ?#%✓';
    const path = `/mediathek/${encodeURIComponent(key)}?view=full#photos`;
    const producerUrl = 'https://photos.example.test/owned/derivative.avif?fit=cover&width=800';
    const result = await run(path, {
      base: customBase,
      response: response({ assignment: { name: 'Fictional assignment' }, photos: [{ url: producerUrl, alt: 'Fictional photo', caption: 'A <fictional> caption' }] }),
    });
    expect(result.fetch).toHaveBeenCalledOnce();
    expect(result.fetch).toHaveBeenCalledWith(`${customBase}${encodeURIComponent(key)}.json`, { cache: 'no-store' });
    expect(result.element('media-title').textContent).toBe('Fictional assignment');
    expect(result.element('media-meta').textContent).toBe('1 photo');
    expect(result.element('media-grid').innerHTML).toContain('src="https://photos.example.test/owned/derivative.avif?fit=cover&amp;width=800"');
    expect(result.element('media-grid').innerHTML).toContain('href="https://photos.example.test/owned/derivative.avif?fit=cover&amp;width=800"');
    expect(result.element('media-grid').innerHTML).toContain('A &lt;fictional&gt; caption');
    expect(result.element('media-status').classList.contains('hidden')).toBe(true);
    expect(result.element('media-grid').classList.contains('hidden')).toBe(false);
    expect(result.element('media-refresh').href).toBe(`${readerOrigin}${path}`);
  });

  it('preserves script-sensitive supplied directory bytes through the actual JSON helper without a closing-script breakout', async () => {
    const base = 'https://cdn.example.test/tenant"</script>/&/contents/assignments/';
    const result = await run('/mediathek/opaque.key', { base });
    expect(result.fetch).toHaveBeenCalledWith(`${base}opaque.key.json`, { cache: 'no-store' });
    expect(result.script).not.toContain('</script>');
    expect(result.html).not.toContain(base);
  });

  it('shows the normal load error after an HTTP failure without reading its body or exposing a gallery', async () => {
    const json = vi.fn(async () => ({ photos: [{ url: 'https://photos.example.test/should-not-render.avif' }] }));
    const result = await run('/mediathek/failure', { base: customBase, response: { ok: false, status: 503, json } });
    expect(json).not.toHaveBeenCalled();
    expect(result.element('media-status').textContent).toBe('We could not load this assignment right now.');
    expect(result.element('media-status').classList.contains('hidden')).toBe(false);
    expect(result.element('media-grid').classList.contains('hidden')).toBe(true);
    expect(result.element('media-grid').innerHTML).toBe('');
    expect(result.element('media-refresh').href).toBe(`${readerOrigin}/mediathek/failure`);
  });

  it('shows the same explicit load error when the response is not valid JSON', async () => {
    const json = vi.fn(async () => { throw new SyntaxError('Fictional invalid JSON'); });
    const result = await run('/mediathek/invalid-json', { response: { ok: true, status: 200, json } });
    expect(json).toHaveBeenCalledOnce();
    expect(result.element('media-status').textContent).toBe('We could not load this assignment right now.');
    expect(result.element('media-grid').classList.contains('hidden')).toBe(true);
    expect(result.element('media-pagination').classList.contains('hidden')).toBe(true);
  });

  it('shows the assignment empty state without inventing photo URLs', async () => {
    const result = await run('/mediathek/empty/', { response: response({ assignment: { name: 'Fictional empty assignment' }, photos: [] }) });
    expect(result.element('media-title').textContent).toBe('Fictional empty assignment');
    expect(result.element('media-meta').textContent).toBe('0 photos');
    expect(result.element('media-status').textContent).toBe('No photos have been published for this assignment yet.');
    expect(result.element('media-status').classList.contains('hidden')).toBe(false);
    expect(result.element('media-grid').innerHTML).toBe('');
    expect(result.element('media-pagination').classList.contains('hidden')).toBe(true);
  });

  it('retains 48-photo pagination, refresh links and back/forward rendering without another fetch', async () => {
    const photos = Array.from({ length: 97 }, (_, index) => ({ url: `https://photos.example.test/producer/photo-${index}.avif`, alt: `Fictional photo ${index}` }));
    const result = await run('/mediathek/paged?view=full#photos', { base: customBase, response: response({ assignment: { name: 'Fictional paged assignment' }, photos }) });
    expect(figureCount(result.element('media-grid').innerHTML)).toBe(48);
    expect(result.element('media-grid').innerHTML).toContain('/photo-0.avif');
    expect(result.element('media-grid').innerHTML).not.toContain('/photo-48.avif');
    expect(result.element('media-pagination').classList.contains('hidden')).toBe(false);

    result.clickPagination('Next page');
    expect(result.href()).toBe(`${readerOrigin}/mediathek/paged?view=full&page=2#photos`);
    expect(figureCount(result.element('media-grid').innerHTML)).toBe(48);
    expect(result.element('media-grid').innerHTML).toContain('/photo-48.avif');
    expect(result.element('media-grid').innerHTML).not.toContain('/photo-96.avif');
    expect(result.element('media-refresh').href).toBe(result.href());

    result.clickPagination('Next page');
    expect(result.element('media-meta').textContent).toBe('97 photos - Page 3 of 3');
    expect(figureCount(result.element('media-grid').innerHTML)).toBe(1);
    expect(result.element('media-grid').innerHTML).toContain('/photo-96.avif');
    expect(result.element('media-pagination').innerHTML).not.toContain('aria-label="Next page"');

    result.back();
    expect(result.href()).toBe(`${readerOrigin}/mediathek/paged?view=full&page=2#photos`);
    expect(figureCount(result.element('media-grid').innerHTML)).toBe(48);
    expect(result.element('media-grid').innerHTML).toContain('/photo-48.avif');
    expect(result.element('media-refresh').href).toBe(result.href());
    result.forward();
    expect(result.element('media-meta').textContent).toBe('97 photos - Page 3 of 3');
    expect(result.element('media-grid').innerHTML).toContain('/photo-96.avif');
    expect(result.element('media-refresh').href).toBe(result.href());
    expect(result.fetch).toHaveBeenCalledOnce();
  });
});
