import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { CapturedCatalogError } from './captured-catalog.js';
import {
  CAPTURED_SELECTION_ELEMENT_ID,
  installCapturedCatalog,
  type CapturedCatalogHost,
} from './captured-catalog-browser.js';
import { CapturedReaderError, createCapturedCatalogReader, type CapturedFetch } from './captured-catalog-reader.js';

const CATALOG_URL = 'https://cdn.fifthbell.com/generations/g-1/catalog.json';
const page = { origin: 'https://fifthbell.com', locale: 'en' };

function sha256(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}

function fixture(overrides: { state?: string; payload?: string } = {}) {
  const context = { rendererVersion: 'r-1', templateVersion: 't-1', tenant: 'fifthbell', origin: page.origin, build: 'b-1' };
  const selection = { selectionId: 'g-1', catalogUrl: CATALOG_URL, context, locale: 'en' };
  const body = new TextEncoder().encode(overrides.payload ?? '{"cities":[]}');
  const resourceUrl = 'https://cdn.fifthbell.com/generations/g-1/weather.json?v=1';
  const catalog = {
    contractVersion: 1, selectionId: 'g-1', context: { ...context }, locale: 'en', state: overrides.state ?? 'selected',
    resources: [{ key: 'weather', kind: 'weather', url: resourceUrl, sha256: sha256(body) }],
  };
  const responses = new Map<string, () => Response>([
    [CATALOG_URL, () => new Response(JSON.stringify(catalog))],
    [resourceUrl, () => new Response(body)],
  ]);
  const fetchImpl = vi.fn<CapturedFetch>(async (url) => {
    const respond = responses.get(url);
    if (!respond) throw new TypeError('network');
    return respond();
  });
  return { selection, catalog, responses, fetchImpl, resourceUrl, body };
}

async function rejection(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (error) {
    return error as Error & { code: string };
  }
  throw new Error('Expected rejection');
}

describe('captured catalog reader', () => {
  it('reads an issued resource after verifying its bytes, with exact request options', async () => {
    const { selection, fetchImpl, resourceUrl } = fixture();
    const reader = createCapturedCatalogReader(selection, page, fetchImpl);
    await expect(reader.read('weather', 'weather')).resolves.toEqual({ cities: [] });
    const init = { cache: 'no-store', credentials: 'omit', redirect: 'error' };
    expect(fetchImpl.mock.calls).toEqual([[CATALOG_URL, init], [resourceUrl, init]]);
  });

  it('resolves the catalog on every read, so a later withdrawal reaches the reader', async () => {
    const { selection, catalog, responses, fetchImpl } = fixture();
    const reader = createCapturedCatalogReader(selection, page, fetchImpl);
    await reader.read('weather', 'weather');
    responses.set(CATALOG_URL, () => new Response(JSON.stringify({ ...catalog, state: 'withdrawn' })));
    expect((await rejection(reader.read('weather', 'weather'))).code).toBe('withdrawn');
  });

  it('recovers on a later read once the catalog is available again', async () => {
    const { selection, catalog, responses, fetchImpl } = fixture();
    responses.set(CATALOG_URL, () => new Response('', { status: 503 }));
    const reader = createCapturedCatalogReader(selection, page, fetchImpl);
    expect((await rejection(reader.read('weather', 'weather'))).code).toBe('unavailable');
    responses.set(CATALOG_URL, () => new Response(JSON.stringify(catalog)));
    await expect(reader.read('weather', 'weather')).resolves.toEqual({ cities: [] });
  });

  type Selection = ReturnType<typeof fixture>['selection'];
  it.each([
    ['a malformed selection', () => ({ selectionId: 'g-1' }), page, 'invalid_selection'],
    ['an absent selection', () => undefined, page, 'invalid_selection'],
    ['another public origin', (selection: Selection) => selection, { ...page, origin: 'https://example.com' }, 'page_mismatch'],
    ['another page locale', (selection: Selection) => selection, { ...page, locale: 'es' }, 'page_mismatch'],
  ])('rejects %s before any request', async (_case, candidate, pageOverride, code) => {
    const { selection, fetchImpl } = fixture();
    const reader = createCapturedCatalogReader(candidate(selection), pageOverride, fetchImpl);
    expect((await rejection(reader.read('weather', 'weather'))).code).toBe(code);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps the contract error for a selection whose shape it rejects', async () => {
    const { selection, fetchImpl } = fixture();
    const { locale: _missing, ...incomplete } = selection;
    const error = await rejection(createCapturedCatalogReader(incomplete, page, fetchImpl).read('weather', 'weather'));
    expect(error).toBeInstanceOf(CapturedCatalogError);
  });

  it.each([
    ['a network failure', () => { throw new TypeError('network'); }, 'unavailable'],
    ['an error status', () => new Response('{}', { status: 404 }), 'unavailable'],
    ['a body-less response', () => new Response(null, { status: 200 }), 'unavailable'],
    ['invalid JSON', () => new Response('{'), 'invalid_json'],
    ['invalid UTF-8', () => new Response(new Uint8Array([0xff])), 'invalid_json'],
    ['a declared oversize body', () => new Response('{}', { headers: { 'content-length': String(8 * 1024 * 1024 + 1) } }), 'resource_too_large'],
    ['a mismatched catalog', () => new Response(JSON.stringify({ ...fixture().catalog, selectionId: 'g-2' })), 'context_mismatch'],
  ])('fails closed on %s from the catalog', async (_case, respond, code) => {
    const { selection, responses, fetchImpl } = fixture();
    responses.set(CATALOG_URL, respond as () => Response);
    expect((await rejection(createCapturedCatalogReader(selection, page, fetchImpl).read('weather', 'weather'))).code).toBe(code);
  });

  it('stops reading a streamed body at the byte limit', async () => {
    const { selection, responses, fetchImpl } = fixture();
    const cancel = vi.fn();
    const chunk = new Uint8Array(4 * 1024 * 1024);
    let sent = 0;
    responses.set(CATALOG_URL, () => new Response(new ReadableStream({
      pull(controller) { sent += 1; controller.enqueue(chunk); },
      cancel,
    })));
    expect((await rejection(createCapturedCatalogReader(selection, page, fetchImpl).read('weather', 'weather'))).code).toBe('resource_too_large');
    expect(sent).toBeLessThanOrEqual(4);
    expect(cancel).toHaveBeenCalled();
  });

  it.each([
    ['tampered bytes', (f: ReturnType<typeof fixture>) => f.responses.set(f.resourceUrl, () => new Response('{"cities":[1]}')), 'integrity_mismatch'],
    ['an unavailable resource', (f: ReturnType<typeof fixture>) => f.responses.set(f.resourceUrl, () => new Response('', { status: 500 })), 'unavailable'],
  ])('fails closed on %s', async (_case, tamper, code) => {
    const f = fixture();
    tamper(f);
    expect((await rejection(createCapturedCatalogReader(f.selection, page, f.fetchImpl).read('weather', 'weather'))).code).toBe(code);
  });

  it('rejects a key or kind the catalog did not issue without requesting it', async () => {
    const { selection, fetchImpl } = fixture();
    const reader = createCapturedCatalogReader(selection, page, fetchImpl);
    expect((await rejection(reader.read('search', 'weather'))).code).toBe('unknown_resource');
    expect((await rejection(reader.read('weather', 'search'))).code).toBe('unknown_resource');
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('rejects verified bytes that are not JSON', async () => {
    const f = fixture({ payload: 'not json' });
    expect((await rejection(createCapturedCatalogReader(f.selection, page, f.fetchImpl).read('weather', 'weather'))).code).toBe('invalid_json');
  });

  it('bounds its own error text to the code', () => {
    expect(new CapturedReaderError('unavailable').message).toBe('Captured catalog reader: unavailable');
  });
});

function host(options: { selection?: string | null; canonical?: string | null; lang?: string } = {}) {
  const { selection, fetchImpl } = fixture();
  const text = options.selection === undefined ? JSON.stringify(selection) : options.selection;
  const canonical = options.canonical === undefined ? 'https://fifthbell.com/politics' : options.canonical;
  const target: CapturedCatalogHost = {
    document: {
      documentElement: { lang: options.lang ?? 'en' },
      getElementById: (id) => (id === CAPTURED_SELECTION_ELEMENT_ID && text !== null
        ? { textContent: text, getAttribute: () => null } : null),
      querySelector: (selector) => (selector === "link[rel='canonical']" && canonical !== null
        ? { textContent: null, getAttribute: (name) => (name === 'href' ? canonical : null) } : null),
    },
    fetch: fetchImpl,
  };
  return { target, fetchImpl };
}

describe('captured catalog browser installer', () => {
  it('binds the reader to the page canonical origin and language and the window fetch', async () => {
    const { target, fetchImpl } = host();
    installCapturedCatalog(target);
    await expect(target.brokawCapturedCatalog!.read('weather', 'weather')).resolves.toEqual({ cities: [] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['a missing selection element', { selection: null }, 'invalid_selection'],
    ['unparsable selection JSON', { selection: '{' }, 'invalid_selection'],
    ['a missing canonical link', { canonical: null }, 'page_mismatch'],
    ['a relative canonical link', { canonical: '/politics' }, 'page_mismatch'],
    ['another canonical origin', { canonical: 'https://example.com/politics' }, 'page_mismatch'],
    ['another document language', { lang: 'it' }, 'page_mismatch'],
  ])('installs a reader that always rejects for %s', async (_case, options, code) => {
    const { target, fetchImpl } = host(options);
    installCapturedCatalog(target);
    expect((await rejection(target.brokawCapturedCatalog!.read('weather', 'weather'))).code).toBe(code);
    expect((await rejection(target.brokawCapturedCatalog!.read('homepage', 'homepage'))).code).toBe(code);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
