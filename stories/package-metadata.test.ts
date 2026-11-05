import { afterEach, describe, expect, it, vi } from 'vitest';
import { cronkiteManifest } from '../src/cronkite-manifest';
import { outletConfig } from '../src/outlet-config';
import { loadStorybookPackageMetadata } from './package-metadata';

const outlet = {
  package: cronkiteManifest.package,
  version: cronkiteManifest.version,
  outletConfig,
};

function serve(manifest: unknown = cronkiteManifest, config: unknown = outlet) {
  const fetch = vi.fn(async (url: string) => new Response(JSON.stringify(
    url.endsWith('cronkite-manifest.json') ? manifest : config,
  )));
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

afterEach(() => vi.unstubAllGlobals());

describe('built package metadata in browser stories', () => {
  it('loads matching public artifacts without reusing a cached package identity', async () => {
    const fetch = serve();
    await expect(loadStorybookPackageMetadata()).resolves.toEqual({ manifest: cronkiteManifest, outlet });
    expect(fetch.mock.calls).toEqual([
      ['./package-metadata/cronkite-manifest.json', { cache: 'no-store' }],
      ['./package-metadata/outlet-config.json', { cache: 'no-store' }],
    ]);
  });

  it('surfaces a missing build artifact rather than displaying source metadata as a fallback', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 404 })));
    await expect(loadStorybookPackageMetadata()).rejects.toThrow('returned HTTP 404');
  });

  it('keeps corrupt metadata visible as a parse failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{')));
    await expect(loadStorybookPackageMetadata()).rejects.toBeInstanceOf(SyntaxError);
  });

  it.each([
    { ...outlet, package: '@example/another-package' },
    { ...outlet, version: 'different-version' },
    { ...outlet, outletConfig: null },
    { ...outlet, outletConfig: [] },
    null,
  ])('rejects missing or mixed package metadata %j', async (config) => {
    serve(cronkiteManifest, config);
    await expect(loadStorybookPackageMetadata()).rejects.toThrow('different package artifacts');
  });

  it.each([
    null,
    { ...cronkiteManifest, package: '' },
    { ...cronkiteManifest, version: '' },
    { ...cronkiteManifest, templateRendering: null },
  ])('rejects incomplete declaration metadata %j', async (manifest) => {
    serve(manifest);
    await expect(loadStorybookPackageMetadata()).rejects.toThrow('different package artifacts');
  });
});
