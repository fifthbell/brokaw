import { outletConfig } from './outlet-config.js';

const CONTEXT_KEYS = ['rendererVersion', 'templateVersion', 'tenant', 'origin', 'build'] as const;
const RESOURCE_KINDS = ['navigation', 'homepage', 'category', 'assignment', 'media', 'search', 'weather', 'system'] as const;
const TOKEN = /^[^\s\p{Cc}]{1,200}$/u;
const HASH = /^[a-f0-9]{64}$/;
const MAX_RESOURCES = 512;
const MAX_BYTES = 8 * 1024 * 1024;

export type CapturedContext = Readonly<Record<typeof CONTEXT_KEYS[number], string>>;
export type CapturedResourceKind = typeof RESOURCE_KINDS[number];
export type CapturedLocale = typeof outletConfig.supportedLanguages[number];
export type CapturedCatalogErrorCode =
  | 'invalid_selection' | 'invalid_catalog' | 'context_mismatch' | 'withdrawn'
  | 'unknown_resource' | 'invalid_bytes' | 'resource_too_large'
  | 'integrity_unavailable' | 'integrity_mismatch';

export class CapturedCatalogError extends Error {
  constructor(readonly code: CapturedCatalogErrorCode) {
    super(`Captured catalog: ${code}`);
    this.name = 'CapturedCatalogError';
  }
}

export interface CapturedResource {
  readonly key: string;
  readonly kind: CapturedResourceKind;
  readonly url: string;
  readonly sha256: string;
}

export interface ResolvedCapturedCatalog {
  readonly selectionId: string;
  readonly catalogUrl: string;
  readonly context: CapturedContext;
  readonly locale: CapturedLocale;
  resource(key: string, kind: CapturedResourceKind): CapturedResource;
  verifyBytes(key: string, kind: CapturedResourceKind, bytes: Uint8Array): Promise<void>;
}

function fail(code: CapturedCatalogErrorCode): never {
  throw new CapturedCatalogError(code);
}

function record(raw: unknown, keys: readonly string[], code: 'invalid_selection' | 'invalid_catalog'): Record<string, unknown> {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail(code);
  const actual = Object.keys(raw);
  if (actual.length !== keys.length || keys.some(key => !Object.hasOwn(raw, key))) fail(code);
  return raw as Record<string, unknown>;
}

function token(raw: unknown, code: 'invalid_selection' | 'invalid_catalog'): string {
  if (typeof raw !== 'string' || !TOKEN.test(raw)) fail(code);
  return raw;
}

function url(raw: unknown, code: 'invalid_selection' | 'invalid_catalog', originOnly = false): URL {
  const value = token(raw, code);
  let parsed: URL;
  try { parsed = new URL(value); } catch { return fail(code); }
  if (parsed.protocol !== 'https:' || parsed.username || parsed.password || value.includes('#')) fail(code);
  // Reject normalization instead of silently repairing an issued location.
  if ((originOnly ? parsed.origin : parsed.href) !== value) fail(code);
  return parsed;
}

function context(raw: unknown, code: 'invalid_selection' | 'invalid_catalog'): CapturedContext {
  const fields = record(raw, CONTEXT_KEYS, code);
  const result = {} as Record<typeof CONTEXT_KEYS[number], string>;
  for (const key of CONTEXT_KEYS) result[key] = token(fields[key], code);
  url(result.origin, code, true);
  return Object.freeze(result);
}

function locale(raw: unknown, code: 'invalid_selection' | 'invalid_catalog'): CapturedLocale {
  if (!(outletConfig.supportedLanguages as readonly unknown[]).includes(raw)) fail(code);
  return raw as CapturedLocale;
}

/** Dormant internal contract. No renderer, browser script or root export calls it. */
export function resolveCapturedCatalog(selection: unknown, rawCatalog: unknown): ResolvedCapturedCatalog | null {
  if (selection === undefined) return null;
  const expected = record(selection, ['selectionId', 'catalogUrl', 'context', 'locale'], 'invalid_selection');
  const selectionId = token(expected.selectionId, 'invalid_selection');
  const catalogOrigin = url(expected.catalogUrl, 'invalid_selection').origin;
  const expectedContext = context(expected.context, 'invalid_selection');
  const expectedLocale = locale(expected.locale, 'invalid_selection');
  const catalog = record(rawCatalog, ['contractVersion', 'selectionId', 'context', 'locale', 'state', 'resources'], 'invalid_catalog');
  if (catalog.contractVersion !== 1 || (catalog.state !== 'selected' && catalog.state !== 'withdrawn')) fail('invalid_catalog');
  const catalogId = token(catalog.selectionId, 'invalid_catalog');
  const actualContext = context(catalog.context, 'invalid_catalog');
  const actualLocale = locale(catalog.locale, 'invalid_catalog');
  if (catalogId !== selectionId || actualLocale !== expectedLocale || CONTEXT_KEYS.some(key => actualContext[key] !== expectedContext[key])) fail('context_mismatch');
  if (catalog.state === 'withdrawn') fail('withdrawn');
  if (!Array.isArray(catalog.resources) || catalog.resources.length === 0 || catalog.resources.length > MAX_RESOURCES) fail('invalid_catalog');

  const resources = new Map<string, CapturedResource>();
  for (const raw of catalog.resources) {
    const fields = record(raw, ['key', 'kind', 'url', 'sha256'], 'invalid_catalog');
    const key = token(fields.key, 'invalid_catalog');
    if (!(RESOURCE_KINDS as readonly unknown[]).includes(fields.kind) || resources.has(key)) fail('invalid_catalog');
    if (url(fields.url, 'invalid_catalog').origin !== catalogOrigin) fail('context_mismatch');
    if (typeof fields.sha256 !== 'string' || !HASH.test(fields.sha256)) fail('invalid_catalog');
    resources.set(key, Object.freeze({ key, kind: fields.kind as CapturedResourceKind, url: fields.url as string, sha256: fields.sha256 }));
  }

  const resource = (key: string, kind: CapturedResourceKind): CapturedResource => {
    const found = resources.get(key);
    if (!found || found.kind !== kind) fail('unknown_resource');
    return found;
  };
  return Object.freeze({
    selectionId,
    catalogUrl: expected.catalogUrl as string,
    context: expectedContext,
    locale: expectedLocale,
    resource,
    async verifyBytes(key: string, kind: CapturedResourceKind, bytes: Uint8Array): Promise<void> {
      const expectedHash = resource(key, kind).sha256;
      if (!(bytes instanceof Uint8Array)) fail('invalid_bytes');
      if (bytes.byteLength > MAX_BYTES) fail('resource_too_large');
      let digest: ArrayBuffer;
      try { digest = await globalThis.crypto.subtle.digest('SHA-256', new Uint8Array(bytes).buffer); }
      catch { return fail('integrity_unavailable'); }
      const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (actual !== expectedHash) fail('integrity_mismatch');
    },
  });
}
