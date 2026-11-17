import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { layoutFiles, type LayoutName } from './layouts.js';
import { render } from './renderer.node.js';
import { searchCopyByLanguage } from './search-copy.js';
import { canonicalArticleSchema, type CanonicalDocument } from './types/canonical-article.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const templatesRoot = path.join(projectRoot, 'src/templates');
const CATALOG_URL = 'https://cdn.fifthbell.com/generations/g-7/catalog.json';
const ORIGIN = 'https://fifthbell.com';
type Language = 'en' | 'es' | 'it';

// ---------------------------------------------------------------------------
// Documents

function page(layout: LayoutName, language: Language, slug: string, extra: Record<string, unknown> = {}): CanonicalDocument {
  const prefix = language === 'en' ? '' : `/${language}`;
  return {
    id: `captured-${layout}-${language}`,
    slug,
    layout,
    canonicalUrl: `${ORIGIN}${prefix}${slug === '/' ? '' : slug}` || ORIGIN,
    contentVersion: '2026-11-17T00:00:00.000Z',
    publishedAt: '2026-11-17T00:00:00.000Z',
    updatedAt: '2026-11-17T00:00:00.000Z',
    status: 'published',
    title: 'Fictional captured page',
    excerpt: 'Fictional captured page.',
    language,
    featured: false,
    authors: [{ name: 'Fictional Newsroom', slug: 'fictional-newsroom' }],
    categories: [],
    navigation: { categories: [] },
    logoLink: language === 'en' ? '/' : `/${language}`,
    seo: { metaTitle: 'Fictional captured page', metaDescription: 'Fictional captured page.' },
    body: [],
    ...(layout === 'search-page' ? { searchCopy: searchCopyByLanguage[language] } : {}),
    ...(layout === 'media-page' ? { assignmentMediaBaseUrl: 'https://cdn.fifthbell.com/contents/assignments/' } : {}),
    ...extra,
  } as CanonicalDocument;
}

function selectionFor(language: Language, overrides: Record<string, unknown> = {}) {
  return {
    selectionId: 'g-7',
    catalogUrl: CATALOG_URL,
    context: { rendererVersion: 'r-7', templateVersion: 't-7', tenant: 'fifthbell', origin: ORIGIN, build: 'b-7' },
    locale: language,
    ...overrides,
  };
}

// Every page renderable and system variant, with no selection.
function legacyDocuments(): Array<[string, CanonicalDocument]> {
  const documents: Array<[string, CanonicalDocument]> = [];
  for (const layout of Object.keys(layoutFiles) as LayoutName[]) {
    for (const language of ['en', 'es', 'it'] as const) documents.push([`${layout}:${language}`, page(layout, language, '/story')]);
  }
  for (const systemPage of cronkiteManifest.templateRendering.systemPages) {
    for (const variant of systemPage.variants) documents.push([`system:${variant.key}`, variant.document as CanonicalDocument]);
  }
  return documents;
}

// ---------------------------------------------------------------------------
// The captured-selection branches contribute no bytes without a selection.

const CAPTURED_BLOCK = /\{\{#if capturedSelection\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;

function readTemplates(directory: string, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const name = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) Object.assign(result, readTemplates(path.join(directory, entry.name), name));
    else if (entry.name.endsWith('.hbs')) result[name.replace(/\.hbs$/, '')] = fs.readFileSync(path.join(directory, entry.name), 'utf8');
  }
  return result;
}

function strippedRenderer() {
  render(page('homepage', 'en', '/'));
  const environment = Handlebars.create();
  environment.registerHelper(Handlebars.helpers);
  const strip = (source: string) => source.replace(CAPTURED_BLOCK, (_block, _captured, legacy = '') => legacy);
  const partials = readTemplates(path.join(templatesRoot, 'partials'));
  for (const [name, source] of Object.entries(partials)) {
    if (name !== 'shell/captured-catalog') environment.registerPartial(name, strip(source));
  }
  const layouts = new Map(Object.entries(layoutFiles).map(([layout, file]) => [
    layout,
    environment.compile(strip(fs.readFileSync(path.join(templatesRoot, 'layouts', file), 'utf8'))),
  ]));
  return (document: CanonicalDocument) => layouts.get(document.layout)!(canonicalArticleSchema.parse(document));
}

// ---------------------------------------------------------------------------
// A fictional captured generation.

function digest(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

function historicalIndex(language: Language, count: number) {
  return {
    articles: Array.from({ length: count }, (_, index) => ({
      title: `${index % 3 === 0 ? 'Harbor' : 'Valley'} archive ${language} ${index + 1}`,
      slug: `/${language}/archive/${index + 1}`,
      excerpt: `Fictional historical coverage number ${index + 1}.`,
      photoUrl: `https://cdn.fifthbell.com/generations/g-7/photos/${index + 1}.avif`,
      publishedAt: new Date(Date.UTC(2020, 0, 1) + index * 86_400_000).toISOString(),
    })),
  };
}

function gallery(count: number) {
  return {
    generatedAt: '2026-11-17T00:00:00.000Z',
    assignment: { id: 'harbor-desk', name: 'Fictional harbor desk' },
    photos: Array.from({ length: count }, (_, index) => ({
      url: `https://cdn.fifthbell.com/generations/g-7/assignments/${index + 1}.avif`,
      alt: `Fictional photo ${index + 1}`,
      caption: `Fictional caption ${index + 1}`,
    })),
  };
}

function generation(language: Language, options: { catalog?: Record<string, unknown> } = {}) {
  const payloads: Record<string, [string, unknown]> = {
    homepage: ['homepage', {
      categories: [{ slug: 'politics', name: 'Politics' }, { slug: 'world', name: 'World' }],
      docs: [{ title: 'Captured homepage lead', slug: 'captured-lead', categories: [{ slug: 'politics', name: 'Politics' }] }],
    }],
    'category:politics': ['category', {
      category: { name: 'Politics' },
      docs: Array.from({ length: 28 }, (_, index) => ({ title: `Captured politics ${index + 1}`, slug: `politics-${index + 1}` })),
    }],
    weather: ['weather', { cities: [{ name: 'Rome', country: 'Italy', temp: 68, condition: 'sunny' }] }],
    search: ['search', historicalIndex(language, 2000)],
    'assignment:harbor-desk': ['assignment', gallery(1044)],
  };
  const bodies = new Map<string, Uint8Array>();
  const resources = Object.entries(payloads).map(([key, [kind, payload]]) => {
    const url = `https://cdn.fifthbell.com/generations/g-7/${encodeURIComponent(key)}.json`;
    const bytes = new TextEncoder().encode(JSON.stringify(payload));
    bodies.set(url, bytes);
    return { key, kind, url, sha256: digest(bytes) };
  });
  const catalog = {
    contractVersion: 1,
    selectionId: 'g-7',
    context: selectionFor(language).context,
    locale: language,
    state: 'selected',
    resources,
    ...options.catalog,
  };
  bodies.set(CATALOG_URL, new TextEncoder().encode(JSON.stringify(catalog)));
  return bodies;
}

// ---------------------------------------------------------------------------
// The shipped reader scripts, in a minimal DOM. Parsing, layout and focus stay
// Storybook/browser acceptance; this checks which data each reader shows.

type Listener = (event: Record<string, unknown>) => unknown;

class FakeElement {
  textContent = '';
  innerHTML = '';
  hidden = true;
  value = '';
  href = '';
  dateTime = '';
  offsetWidth = 0;
  readonly dataset: Record<string, string> = {};
  readonly style: Record<string, string> = {};
  readonly listeners = new Map<string, Listener>();
  readonly attributes = new Map<string, string>();
  readonly classes = new Set<string>();
  children: FakeElement[] = [];
  readonly classList = {
    add: (...tokens: string[]) => tokens.forEach((token) => this.classes.add(token)),
    remove: (...tokens: string[]) => tokens.forEach((token) => this.classes.delete(token)),
    contains: (token: string) => this.classes.has(token),
    toggle: (token: string, force?: boolean) => ((force ?? !this.classes.has(token)) ? this.classes.add(token) : this.classes.delete(token)),
  };
  addEventListener(type: string, listener: Listener) { this.listeners.set(type, listener); }
  setAttribute(name: string, value: string) { this.attributes.set(name, value); }
  getAttribute(name: string) { return this.attributes.get(name) ?? null; }
  querySelector() { return null; }
  querySelectorAll() { return this.children; }
  closest() { return null; }
  contains() { return false; }
}

function runPage(html: string, url: string, bodies: Map<string, Uint8Array>) {
  const requests: string[] = [];
  const elements = new Map<string, FakeElement>();
  const element = (key: string) => {
    if (!elements.has(key)) elements.set(key, new FakeElement());
    return elements.get(key)!;
  };
  const jsonElements = new Map([...html.matchAll(/<script type='application\/json' id='([^']+)'>([\s\S]*?)<\/script>/g)]
    .map((match) => [match[1], match[2]]));
  const canonical = html.match(/<link rel='canonical' href='([^']*)'/)![1];
  const lang = html.match(/<html lang='([^']*)'/)![1];
  const listeners = new Map<string, Listener[]>();
  const location = new URL(url);
  const link = Object.assign(new FakeElement(), {});
  link.setAttribute('data-category-slug', 'politics');
  element('#sections-links').children = [link];
  const window: Record<string, unknown> = {
    location,
    history: {
      pushState: (_state: unknown, _title: string, next: string) => { location.href = new URL(next, location).href; },
      replaceState: (_state: unknown, _title: string, next: string) => { location.href = new URL(next, location).href; },
    },
    addEventListener: (type: string, listener: Listener) => listeners.set(type, [...(listeners.get(type) ?? []), listener]),
    dispatchEvent: (event: { type: string }) => (listeners.get(event.type) ?? []).forEach((listener) => listener(event)),
    setInterval: () => 0,
    clearInterval: () => undefined,
    matchMedia: () => ({ matches: false, addEventListener: () => undefined }),
    localStorage: { getItem: () => null, setItem: () => undefined },
    CustomEvent: class { constructor(readonly type: string, init: { detail?: unknown } = {}) { Object.assign(this, init); } },
    HTMLElement: FakeElement,
    HTMLAnchorElement: FakeElement,
    Element: FakeElement,
    Node: FakeElement,
    console: { error: () => undefined, log: () => undefined },
    crypto: globalThis.crypto,
    TextDecoder,
    TextEncoder,
    URL,
    URLSearchParams,
    fetch: async (requested: string) => {
      requests.push(requested);
      const body = bodies.get(requested);
      return body ? new Response(body.slice()) : new Response('', { status: 404 });
    },
    document: {
      documentElement: { lang, classList: new FakeElement().classList },
      body: { style: {} },
      getElementById: (id: string) => {
        const json = jsonElements.get(id);
        if (json !== undefined) return { textContent: json, getAttribute: () => null };
        return id === 'brokaw-captured-selection' ? null : element(`#${id}`);
      },
      querySelector: (selector: string) => (selector === "link[rel='canonical']"
        ? { textContent: null, getAttribute: (name: string) => (name === 'href' ? canonical : null) }
        : element(selector)),
      querySelectorAll: () => [],
      addEventListener: () => undefined,
    },
  };
  window.window = window;
  const context = vm.createContext(window);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
  const readers = scripts.filter((script) => /installCapturedCatalog|brokaw-captured-selection|WEATHER_URL|menu-button|search-page-form|data-media-page/.test(script)
    || script.includes('brokawCapturedCatalog'));
  for (const script of readers) vm.runInContext(script, context);
  return { requests, element, window };
}

async function settle(condition: () => boolean) {
  for (let attempt = 0; attempt < 200 && !condition(); attempt += 1) await new Promise((resolve) => setTimeout(resolve, 5));
  expect(condition()).toBe(true);
}

function capturedOnly(requests: string[]) {
  expect(requests.length).toBeGreaterThan(0);
  for (const request of requests) expect(request.startsWith('https://cdn.fifthbell.com/generations/g-7/')).toBe(true);
}

// ---------------------------------------------------------------------------

describe('public readers and the captured catalog', () => {
  it('renders every page and system variant without a selection exactly as the current sources', () => {
    const legacy = strippedRenderer();
    const documents = legacyDocuments();
    expect(documents.length).toBe(9 * 3 + 7);
    for (const [, document] of documents) {
      const html = render(document);
      expect(html).toBe(legacy(document));
      expect(html).not.toContain('brokaw-captured-selection');
      expect(html).not.toContain('brokawCapturedCatalog');
    }
  });

  it('keeps every reader on its current source when no selection is present', async () => {
    const { requests } = runPage(render(page('media-page', 'en', '/mediathek')), 'https://fifthbell.com/mediathek/harbor-desk', new Map());
    await settle(() => requests.length >= 2);
    expect(requests).toContain('https://cdn.fifthbell.com/contents/assignments/harbor-desk.json');
    expect(requests.some((request) => request.startsWith('https://cdn.fifthbell.com/content/weather-current.json?v='))).toBe(true);
  });

  it('places one selection and one adapter before the first reader and drops every current-source request', () => {
    for (const layout of ['homepage', 'category-page', 'article-page', 'search-page', 'media-page', 'live-story', 'standalone-page'] as const) {
      const html = render(page(layout, 'en', '/story', { capturedSelection: selectionFor('en') }));
      expect(html.split("id='brokaw-captured-selection'").length).toBe(2);
      expect(html.indexOf('brokaw-captured-selection')).toBeLessThan(html.indexOf('WEATHER_URL'));
      for (const legacy of ['fetch(`${WEATHER_URL}', 'fetch(getCdnUrl(', 'search-manifest-', 'fetch(assignmentMediaBaseUrl']) {
        expect(html).not.toContain(legacy);
      }
    }
  });

  it('rejects a null or malformed selection at the document boundary', () => {
    expect(() => render(page('homepage', 'en', '/', { capturedSelection: null }))).toThrow('Canonical document validation failed');
    expect(() => render(page('homepage', 'en', '/', { capturedSelection: { ...selectionFor('en'), extra: true } }))).toThrow('Canonical document validation failed');
  });

  it('shows the captured weather, navigation, homepage and category resources', async () => {
    const html = render(page('homepage', 'en', '/', { capturedSelection: selectionFor('en') }));
    const { requests, element } = runPage(html, 'https://fifthbell.com/', generation('en'));
    await settle(() => element('[data-weather-city]').textContent === 'Rome');

    element('#menu-button').listeners.get('click')!({ stopPropagation: () => undefined });
    await settle(() => element('#mini-featured').innerHTML.includes('Captured homepage lead'));
    expect(element('#category-links-container').innerHTML).toContain('POLITICS');
    expect(element('#category-links-container').innerHTML).toContain('WORLD');

    element('#sections-links').children[0].listeners.get('mouseenter')!({});
    await settle(() => element('#mini-featured').innerHTML.includes('Captured politics 1<'));
    capturedOnly(requests);
    expect(requests.filter((request) => request !== CATALOG_URL)).toEqual([
      'https://cdn.fifthbell.com/generations/g-7/weather.json',
      'https://cdn.fifthbell.com/generations/g-7/homepage.json',
      'https://cdn.fifthbell.com/generations/g-7/category%3Apolitics.json',
    ]);
  });

  it.each(['en', 'es', 'it'] as const)('agrees on search counts and the final page over 2000 historical %s articles', async (language) => {
    const prefix = language === 'en' ? '' : `/${language}`;
    const html = render(page('search-page', language, '/search', { capturedSelection: selectionFor(language) }));
    const copy = searchCopyByLanguage[language];

    // "harbor" matches every third article: 667 results, 34 pages, 7 on the last.
    const last = runPage(html, `https://fifthbell.com${prefix}/search?q=harbor&page=34`, generation(language));
    await settle(() => last.element('#search-results-meta').textContent.includes(`${copy.page} 34`));
    expect(last.element('#search-results-meta').textContent).toBe(`667 ${copy.resultPlural} ${copy.forQuery} "harbor" • ${copy.page} 34 ${copy.of} 34`);
    expect(last.element('#search-results-list').innerHTML.split('<article ').length - 1).toBe(7);
    capturedOnly(last.requests);

    // Every article matches "archive": 2000 results, exactly 100 full pages.
    const all = runPage(html, `https://fifthbell.com${prefix}/search?q=archive&page=999`, generation(language));
    await settle(() => all.element('#search-results-meta').textContent.includes(`${copy.of} 100`));
    expect(all.element('#search-results-meta').textContent).toBe(`2000 ${copy.resultPlural} ${copy.forQuery} "archive" • ${copy.page} 100 ${copy.of} 100`);
    expect(all.element('#search-results-list').innerHTML.split('<article ').length - 1).toBe(20);
  });

  it('agrees on gallery counts and the final page over 1044 captured photos', async () => {
    const html = render(page('media-page', 'en', '/mediathek', { capturedSelection: selectionFor('en') }));
    const { requests, element } = runPage(html, 'https://fifthbell.com/mediathek/harbor-desk?page=22', generation('en'));
    await settle(() => element('#media-title').textContent === 'Fictional harbor desk');
    expect(element('#media-meta').textContent).toMatch(/^1044 photos - Page 22 of 22 updated /);
    expect(element('#media-grid').innerHTML.split('<figure ').length - 1).toBe(1044 - 21 * 48);
    expect(element('#media-pagination').innerHTML).toContain('aria-current="page"');
    capturedOnly(requests);
  });

  it.each([
    ['withdrawn', { state: 'withdrawn' }],
    ['stale', { selectionId: 'g-6' }],
    ['mixed-context', { context: { ...selectionFor('en').context, build: 'b-8' } }],
    ['mixed-locale', { locale: 'es' }],
  ])('fails every reader closed on a %s catalog without touching a current source', async (_case, catalog) => {
    const bodies = generation('en', { catalog });
    const media = runPage(render(page('media-page', 'en', '/mediathek', { capturedSelection: selectionFor('en') })), 'https://fifthbell.com/mediathek/harbor-desk', bodies);
    await settle(() => media.element('#media-status').textContent === 'We could not load this assignment right now.');
    media.element('#menu-button').listeners.get('click')!({ stopPropagation: () => undefined });
    await settle(() => media.element('#category-links-container').innerHTML.includes('Failed to load sections'));
    expect(media.element('[data-weather-city]').textContent).toBe('');

    const search = runPage(render(page('search-page', 'en', '/search', { capturedSelection: selectionFor('en') })), 'https://fifthbell.com/search?q=harbor', bodies);
    await settle(() => search.element('#search-results-meta').textContent === searchCopyByLanguage.en.unavailable);
    for (const requests of [media.requests, search.requests]) {
      expect(new Set(requests)).toEqual(new Set([CATALOG_URL]));
    }
  });

  it('fails closed when the selection names another page locale, before any request', async () => {
    const html = render(page('media-page', 'es', '/mediathek', { capturedSelection: selectionFor('en') }));
    const { requests, element } = runPage(html, 'https://fifthbell.com/mediathek/harbor-desk', generation('en'));
    await settle(() => element('#media-status').textContent === 'We could not load this assignment right now.');
    expect(requests).toEqual([]);
  });

  it('fails a reader closed when its captured bytes do not match the issued checksum', async () => {
    const bodies = generation('en');
    bodies.set('https://cdn.fifthbell.com/generations/g-7/assignment%3Aharbor-desk.json', new TextEncoder().encode('{"photos":[]}'));
    const html = render(page('media-page', 'en', '/mediathek', { capturedSelection: selectionFor('en') }));
    const { element } = runPage(html, 'https://fifthbell.com/mediathek/harbor-desk', bodies);
    await settle(() => element('#media-status').textContent === 'We could not load this assignment right now.');
    expect(element('#media-title').textContent).toBe('');
  });
});
