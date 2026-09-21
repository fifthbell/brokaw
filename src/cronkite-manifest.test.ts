import { createRequire } from 'node:module';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { addContractFormats } from './json-schema-formats.js';
import { layoutFiles } from './layouts.js';
import { assertManifestAlignment } from './manifest-validation.js';
import { outletConfig } from './outlet-config.js';
import { version } from './version.js';

const require = createRequire(import.meta.url);
const schema = require('./schemas/cronkite-manifest.schema.json') as object;
const packageJson = require('../package.json') as { name: string; version: string };

function sources() {
  return {
    layouts: Object.keys(layoutFiles),
    languages: outletConfig.supportedLanguages,
    defaultLanguage: outletConfig.defaultLanguage,
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    exportedVersion: version,
  };
}

describe('Cronkite declarative template manifest', () => {
  it('validates against the pinned template contract schema', () => {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addContractFormats(ajv);
    const validate = ajv.compile(schema);

    expect(validate(cronkiteManifest), JSON.stringify(validate.errors)).toBe(true);
    expect(() => assertManifestAlignment(cronkiteManifest, sources())).not.toThrow();
  });

  it('contains only data needed to compile templates and copy static assets', () => {
    expect(Object.keys(cronkiteManifest)).toEqual(['package', 'version', 'templateRendering']);
    expect(cronkiteManifest.templateRendering).toMatchObject({
      contract: 'cronkite.templates',
      contractVersion: 1,
    });

    const serialized = JSON.stringify(cronkiteManifest);
    expect(serialized).not.toContain('dist/renderer.js');
    expect(serialized).not.toContain('"engine"');
    expect(serialized).not.toContain('"export"');
    expect(serialized).not.toContain('short-video');
    expect(serialized).not.toContain('live-program');
  });

  it('declares every page layout plus the retained social-card raster', () => {
    expect(Object.keys(cronkiteManifest.templateRendering.renderables)).toEqual([
      ...Object.keys(layoutFiles),
      'social-image',
    ]);
    expect(cronkiteManifest.templateRendering.renderables['social-image']).toMatchObject({
      contentType: 'image/jpeg',
      raster: { format: 'jpeg', width: 1080, height: 1350 },
    });
  });

  it('uses explicit unprefixed default-language system variants', () => {
    const systemPages = Object.fromEntries(
      cronkiteManifest.templateRendering.systemPages.map((page) => [page.renderable, page]),
    );

    expect(systemPages['404']?.variants.map((variant) => ({
      language: variant.document.language,
      key: variant.key,
      route: variant.document.slug,
    }))).toEqual([
      { language: 'en', key: 'html/404/index.html', route: '/404' },
      { language: 'es', key: 'html/es/404/index.html', route: '/es/404' },
      { language: 'it', key: 'html/it/404/index.html', route: '/it/404' },
    ]);

    expect(systemPages['search-page']?.variants.map((variant) => ({
      language: variant.document.language,
      key: variant.key,
      route: variant.document.slug,
    }))).toEqual([
      { language: 'en', key: 'html/search/index.html', route: '/search' },
      { language: 'es', key: 'html/es/search/index.html', route: '/es/search' },
      { language: 'it', key: 'html/it/search/index.html', route: '/it/search' },
    ]);
  });

  it('declares an exact, acyclic partial graph and packaged static assets', () => {
    const rendering = cronkiteManifest.templateRendering;
    expect(rendering.partials['components/body-block'].partials).toContain('blocks/x');
    expect(rendering.partials['components/snack'].partials).toEqual([
      'components/snack-meta-image-row',
      'components/snack-meta-inline',
    ]);
    expect(rendering.staticAssets['content/styles/brokaw.css']).toEqual({
      source: 'src/styles/compiled.css',
      contentType: 'text/css; charset=utf-8',
      cacheControl: 'public, max-age=31536000, immutable',
    });
    expect(Object.keys(rendering.staticAssets).filter((key) => key.startsWith('content/fonts/')).length).toBeGreaterThan(1);
  });

  it('models vendor URL construction as embed data', () => {
    expect(cronkiteManifest.templateRendering.embedRegistry).toHaveProperty('x-embed');
    expect(cronkiteManifest.templateRendering.embedRegistry).toHaveProperty('tiktok');
    expect(cronkiteManifest.templateRendering.embedRegistry).toHaveProperty('sofascore-widget');
    expect(cronkiteManifest.templateRendering.embedRegistry).toHaveProperty('sofascore-match');
  });
});
