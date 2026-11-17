import {
  CapturedCatalogError,
  resolveCapturedCatalog,
  type CapturedResourceKind,
  type ResolvedCapturedCatalog,
} from './captured-catalog.js';

/**
 * Reader adapter for the captured-catalog contract (#29). A page whose
 * document carries `capturedSelection` reads every runtime resource through
 * this adapter; a page without one keeps its current sources untouched.
 */

// The catalog document has no issued checksum, so it gets the same ceiling
// the contract applies to resource bytes.
const MAX_CATALOG_BYTES = 8 * 1024 * 1024;
const MAX_RESOURCE_BYTES = 8 * 1024 * 1024;

export type CapturedReaderErrorCode = 'unavailable' | 'invalid_json' | 'page_mismatch' | 'resource_too_large';

export class CapturedReaderError extends Error {
  constructor(readonly code: CapturedReaderErrorCode) {
    super(`Captured catalog reader: ${code}`);
    this.name = 'CapturedReaderError';
  }
}

/** What the rendered page itself states, independently of the catalog. */
export interface CapturedPage {
  readonly origin: string;
  readonly locale: string;
}

export type CapturedFetch = (url: string, init: RequestInit) => Promise<Response>;

export interface CapturedCatalogReader {
  read(kind: CapturedResourceKind, key: string): Promise<unknown>;
}

// Issued locations are used exactly: no cookies, no cache and no redirect to
// a location the catalog did not issue.
const REQUEST: RequestInit = { cache: 'no-store', credentials: 'omit', redirect: 'error' };

/**
 * Validates the selection without a catalog. The contract checks the selection
 * before the catalog, so a well-formed selection fails only on the catalog.
 */
function assertSelection(selection: unknown): void {
  try {
    resolveCapturedCatalog(selection, null);
  } catch (error) {
    if (error instanceof CapturedCatalogError && error.code === 'invalid_catalog') return;
    throw error;
  }
  throw new CapturedCatalogError('invalid_selection');
}

async function readLimited(response: Response, limit: number): Promise<Uint8Array> {
  if (!response.ok || !response.body) throw new CapturedReaderError('unavailable');
  if (Number(response.headers.get('content-length')) > limit) throw new CapturedReaderError('resource_too_large');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new CapturedReaderError('resource_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function parseJson(bytes: Uint8Array): unknown {
  try {
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch {
    throw new CapturedReaderError('invalid_json');
  }
}

async function fetchBytes(fetchImpl: CapturedFetch, url: string, limit: number): Promise<Uint8Array> {
  let response: Response;
  try {
    response = await fetchImpl(url, REQUEST);
  } catch {
    throw new CapturedReaderError('unavailable');
  }
  return readLimited(response, limit);
}

export function createCapturedCatalogReader(
  selection: unknown,
  page: CapturedPage,
  fetchImpl: CapturedFetch,
): CapturedCatalogReader {
  type Expected = { catalogUrl: string; locale: string; context: { origin: string } };
  let expected: Expected | undefined;
  let setupError: unknown;
  try {
    assertSelection(selection);
    const candidate = selection as Expected;
    if (candidate.context.origin !== page.origin || candidate.locale !== page.locale) {
      throw new CapturedReaderError('page_mismatch');
    }
    expected = candidate;
  } catch (error) {
    setupError = error;
  }

  // Each read resolves the catalog again, so a withdrawal reaches the next
  // read instead of being masked by an earlier resolution.
  async function resolveCatalog(): Promise<ResolvedCapturedCatalog> {
    if (!expected) throw setupError;
    const raw = parseJson(await fetchBytes(fetchImpl, expected.catalogUrl, MAX_CATALOG_BYTES));
    return resolveCapturedCatalog(selection, raw) as ResolvedCapturedCatalog;
  }

  return Object.freeze({
    async read(kind: CapturedResourceKind, key: string): Promise<unknown> {
      const catalog = await resolveCatalog();
      const descriptor = catalog.resource(key, kind);
      const bytes = await fetchBytes(fetchImpl, descriptor.url, MAX_RESOURCE_BYTES);
      await catalog.verifyBytes(key, kind, bytes);
      return parseJson(bytes);
    },
  });
}
