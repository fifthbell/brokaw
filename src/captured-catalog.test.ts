import { createHash } from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CapturedCatalogError, resolveCapturedCatalog, type CapturedResourceKind } from './captured-catalog.js';
import { ignoredInputCounts, type IgnoredInputReason } from './ignored-input.js';

const bytes = new TextEncoder().encode('{"data":[]}');
const sha256 = createHash('sha256').update(bytes).digest('hex');
const kinds: CapturedResourceKind[] = ['navigation', 'homepage', 'category', 'assignment', 'media', 'search', 'weather', 'system'];

function fixture() {
  const context = { rendererVersion: '0.1.72', templateVersion: '1', tenant: 'fifthbell', origin: 'https://fifthbell.com', build: 'build-1' };
  const selection = { selectionId: 'selection-1', catalogUrl: 'https://cdn.fifthbell.com/releases/build-1/catalog.json', context, locale: 'en' };
  const catalog = {
    contractVersion: 1, selectionId: selection.selectionId, context: { ...context }, locale: 'en', state: 'selected',
    resources: kinds.map(kind => ({ key: kind, kind, url: `https://cdn.fifthbell.com/releases/build-1/${kind}.json?v=1`, sha256 })),
  };
  return { selection, catalog };
}

function expectCode(task: () => unknown, code: string) {
  try { task(); } catch (error) {
    expect(error).toBeInstanceOf(CapturedCatalogError);
    expect((error as CapturedCatalogError).code).toBe(code);
    expect((error as Error).message).toBe(`Captured catalog: ${code}`);
    return;
  }
  throw new Error('Expected rejection');
}

afterEach(() => vi.unstubAllGlobals());

// How many inputs `task` ignored under `reason` (gaulatti/ariston#217).
function ignoredBy<T>(reason: IgnoredInputReason, task: () => T): [T, number] {
  const before = ignoredInputCounts()[reason];
  const result = task();
  return [result, ignoredInputCounts()[reason] - before];
}

describe('dormant captured catalog contract', () => {
  it('leaves only an absent selection to the legacy adapter, without inspecting a catalog', () => {
    expect(resolveCapturedCatalog(undefined, null)).toBeNull();
    expect(resolveCapturedCatalog(undefined, new Proxy({}, { ownKeys: () => { throw new Error('must not inspect'); } }))).toBeNull();
  });

  it.each(['en', 'es', 'it'])('binds supported locale %s and preserves every issued URL', language => {
    const { selection, catalog } = fixture();
    selection.locale = catalog.locale = language;
    const resolved = resolveCapturedCatalog(selection, catalog)!;
    expect(resolved.selectionId).toBe(selection.selectionId);
    expect(resolved.catalogUrl).toBe(selection.catalogUrl);
    expect(resolved.context).toEqual(selection.context);
    expect(resolved.locale).toBe(language);
    for (const kind of kinds) expect(resolved.resource(kind, kind)).toEqual(catalog.resources.find(item => item.kind === kind));
  });

  it('copies and freezes validated metadata rather than retaining mutable input', () => {
    const { selection, catalog } = fixture();
    const resolved = resolveCapturedCatalog(selection, catalog)!;
    selection.context.tenant = 'changed';
    selection.catalogUrl = 'https://cdn.fifthbell.com/changed.json';
    catalog.resources[0].url = 'https://cdn.fifthbell.com/changed.json';
    catalog.resources.length = 0;
    expect(resolved.context.tenant).toBe('fifthbell');
    expect(resolved.catalogUrl).toContain('/releases/build-1/');
    expect(resolved.resource('navigation', 'navigation').url).toContain('/navigation.json?v=1');
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.context)).toBe(true);
    expect(Object.isFrozen(resolved.resource('navigation', 'navigation'))).toBe(true);
  });

  it.each([null, [], false, 1, 'selection', {}])('rejects present non-selection input %#', input => {
    expectCode(() => resolveCapturedCatalog(input, fixture().catalog), 'invalid_selection');
  });

  it('rejects missing keys even when the property count matches', () => {
    const { selection, catalog } = fixture();
    const { locale: ignored, ...rest } = selection;
    expectCode(() => resolveCapturedCatalog({ ...rest, language: ignored }, catalog), 'invalid_selection');
    const { state: omitted, ...other } = catalog;
    expectCode(() => resolveCapturedCatalog(selection, { ...other, status: omitted }), 'invalid_catalog');
  });

  it('ignores and counts members it does not know, and never reads them', () => {
    const { selection, catalog } = fixture();
    const [fromSelection, selectionFields] = ignoredBy('captured_selection_field', () =>
      resolveCapturedCatalog({ ...selection, extra: true, context: { ...selection.context, region: 'eu' } }, catalog)!);
    expect(selectionFields).toBe(2);
    expect(fromSelection.context).toEqual(selection.context);
    expect(Object.keys(fromSelection.context)).not.toContain('region');

    const resources = catalog.resources.map(resource => ({ ...resource, size: 11 }));
    const [fromCatalog, catalogFields] = ignoredBy('captured_catalog_field', () =>
      resolveCapturedCatalog(selection, { ...catalog, issuedAt: 'now', context: { ...catalog.context, region: 'eu' }, resources })!);
    expect(catalogFields).toBe(2 + resources.length);
    expect(fromCatalog.resource('navigation', 'navigation')).toEqual(catalog.resources[0]);
  });

  it('reads a catalog state it does not know as withdrawn, and counts it', () => {
    const { selection, catalog } = fixture();
    const [, unknownStates] = ignoredBy('captured_catalog_state', () =>
      expectCode(() => resolveCapturedCatalog(selection, { ...catalog, state: 'archived' }), 'withdrawn'));
    expect(unknownStates).toBe(1);
    const [, withdrawn] = ignoredBy('captured_catalog_state', () =>
      expectCode(() => resolveCapturedCatalog(selection, { ...catalog, state: 'withdrawn' }), 'withdrawn'));
    expect(withdrawn).toBe(0);
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, state: 1 }), 'invalid_catalog');
  });

  it('skips and counts a resource of a kind it does not read, and keeps the rest', () => {
    const { selection, catalog } = fixture();
    const descriptor = catalog.resources[0];
    const podcast = { ...descriptor, key: 'navigation', kind: 'podcast', url: 'https://elsewhere.example/podcast.json', sha256: 'unchecked' };
    const [resolved, skipped] = ignoredBy('captured_resource_kind', () =>
      resolveCapturedCatalog(selection, { ...catalog, resources: [podcast, ...catalog.resources] })!);
    expect(skipped).toBe(1);
    // The skipped resource neither takes its key nor gets checked.
    expect(resolved.resource('navigation', 'navigation')).toEqual(descriptor);
    expectCode(() => resolved.resource('navigation', 'podcast' as CapturedResourceKind), 'unknown_resource');
  });

  it.each([undefined, null, 1, '', ' ', 'x'.repeat(201), 'a\u0000b'])('rejects invalid opaque identity %#', value => {
    const { selection, catalog } = fixture();
    expectCode(() => resolveCapturedCatalog({ ...selection, selectionId: value }, catalog), 'invalid_selection');
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, selectionId: value }), 'invalid_catalog');
  });

  const invalidUrls = [
    'not-a-url', 'http://cdn.fifthbell.com/catalog.json', 'https://reader@cdn.fifthbell.com/catalog.json',
    'https://:fixture@cdn.fifthbell.com/catalog.json', 'https://cdn.fifthbell.com/catalog.json#part',
    'https://cdn.fifthbell.com/catalog.json#',
    'https://CDN.fifthbell.com/catalog.json', 'https://cdn.fifthbell.com:443/catalog.json',
    'https://cdn.fifthbell.com/a/../catalog.json', 'https://cdn.fifthbell.com',
  ];
  it.each(invalidUrls)('rejects unsafe or normalized catalog location %#', value => {
    const { selection, catalog } = fixture();
    expectCode(() => resolveCapturedCatalog({ ...selection, catalogUrl: value }, catalog), 'invalid_selection');
    catalog.resources[0].url = value;
    expectCode(() => resolveCapturedCatalog(selection, catalog), 'invalid_catalog');
  });

  it('requires exact context fields and a bare canonical public origin', () => {
    const { selection, catalog } = fixture();
    for (const invalid of [null, {}, { ...selection.context, origin: 'https://fifthbell.com/path' }, { ...selection.context, build: '' }]) {
      expectCode(() => resolveCapturedCatalog({ ...selection, context: invalid }, catalog), 'invalid_selection');
      expectCode(() => resolveCapturedCatalog(selection, { ...catalog, context: invalid }), 'invalid_catalog');
    }
  });

  it.each(['rendererVersion', 'templateVersion', 'tenant', 'origin', 'build'] as const)('rejects changed %s', key => {
    const { selection, catalog } = fixture();
    catalog.context[key] = key === 'origin' ? 'https://modoitaliano.fm' : 'another-value';
    expectCode(() => resolveCapturedCatalog(selection, catalog), 'context_mismatch');
  });

  it('rejects stale selection, mismatched or unsupported locale and withdrawn selections', () => {
    const { selection, catalog } = fixture();
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, selectionId: 'old-selection' }), 'context_mismatch');
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, locale: 'es' }), 'context_mismatch');
    expectCode(() => resolveCapturedCatalog({ ...selection, locale: 'xx' }, catalog), 'invalid_selection');
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, locale: 'xx' }), 'invalid_catalog');
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, state: 'withdrawn', resources: [] }), 'withdrawn');
    expectCode(() => resolveCapturedCatalog(selection, { ...catalog, contractVersion: 2 }), 'invalid_catalog');
    expectCode(() => resolveCapturedCatalog(selection, null), 'invalid_catalog');
  });

  it('bounds resource count and rejects ambiguous or malformed descriptors', () => {
    const { selection, catalog } = fixture();
    const descriptor = catalog.resources[0];
    for (const resources of [null, [], Array(513).fill(descriptor), [null], [[descriptor]], [{ ...descriptor, key: '' }], [{ ...descriptor, kind: 1 }], [descriptor, descriptor], [{ ...descriptor, sha256: 1 }], [{ ...descriptor, sha256: 'not-a-hash' }]]) {
      expectCode(() => resolveCapturedCatalog(selection, { ...catalog, resources }), 'invalid_catalog');
    }
    const maximum = Array.from({ length: 512 }, (_, index) => ({ ...descriptor, key: `item-${index}` }));
    expect(resolveCapturedCatalog(selection, { ...catalog, resources: maximum })!.resource('item-511', 'navigation').key).toBe('item-511');
    catalog.resources[0].url = 'https://fifthbell.com/other-tenant.json';
    expectCode(() => resolveCapturedCatalog(selection, catalog), 'context_mismatch');
  });

  it('never substitutes another resource or kind', async () => {
    const { selection, catalog } = fixture();
    const resolved = resolveCapturedCatalog(selection, catalog)!;
    expectCode(() => resolved.resource('missing', 'navigation'), 'unknown_resource');
    expectCode(() => resolved.resource('navigation', 'media'), 'unknown_resource');
    await expect(resolved.verifyBytes('missing', 'navigation', bytes)).rejects.toMatchObject({ code: 'unknown_resource' });
  });

  it('verifies exact bytes and rejects corruption or oversized/untyped data', async () => {
    const { selection, catalog } = fixture();
    const resolved = resolveCapturedCatalog(selection, catalog)!;
    await expect(resolved.verifyBytes('navigation', 'navigation', bytes)).resolves.toBeUndefined();
    await expect(resolved.verifyBytes('navigation', 'navigation', new TextEncoder().encode('changed'))).rejects.toMatchObject({ code: 'integrity_mismatch' });
    await expect(resolved.verifyBytes('navigation', 'navigation', null as unknown as Uint8Array)).rejects.toMatchObject({ code: 'invalid_bytes' });
    await expect(resolved.verifyBytes('navigation', 'navigation', new Uint8Array(8 * 1024 * 1024 + 1))).rejects.toMatchObject({ code: 'resource_too_large' });
    const maximum = new Uint8Array(8 * 1024 * 1024);
    catalog.resources[0].sha256 = createHash('sha256').update(maximum).digest('hex');
    await expect(resolveCapturedCatalog(selection, catalog)!.verifyBytes('navigation', 'navigation', maximum)).resolves.toBeUndefined();
  });

  it('keeps crypto failures bounded and never exposes provider details', async () => {
    const { selection, catalog } = fixture();
    const resolved = resolveCapturedCatalog(selection, catalog)!;
    vi.stubGlobal('crypto', undefined);
    await expect(resolved.verifyBytes('navigation', 'navigation', bytes)).rejects.toMatchObject({ code: 'integrity_unavailable', message: 'Captured catalog: integrity_unavailable' });
    vi.stubGlobal('crypto', { subtle: { digest: () => Promise.reject(new Error('provider detail')) } });
    await expect(resolved.verifyBytes('navigation', 'navigation', bytes)).rejects.toMatchObject({ code: 'integrity_unavailable', message: 'Captured catalog: integrity_unavailable' });
  });
});
