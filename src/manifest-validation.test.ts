import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { layoutFiles } from './layouts.js';
import { assertManifestAlignment } from './manifest-validation.js';
import type { ManifestAlignmentSources } from './manifest-validation.js';
import { outletConfig } from './outlet-config.js';
import type { CronkiteDeclarativeTemplateManifest } from './types/cronkite-manifest.generated.js';

function sources(): ManifestAlignmentSources {
  return {
    layouts: Object.keys(layoutFiles),
    languages: [...outletConfig.supportedLanguages],
    defaultLanguage: outletConfig.defaultLanguage,
    packageName: cronkiteManifest.package,
    packageVersion: cronkiteManifest.version,
    exportedVersion: cronkiteManifest.version,
  };
}

function manifestFixture(): CronkiteDeclarativeTemplateManifest {
  return structuredClone(cronkiteManifest);
}

describe('manifest release alignment', () => {
  it.each(['layouts', 'languages'] as const)(
    'rejects missing and reordered %s before a mismatched package can ship',
    (field) => {
      const missing = sources();
      missing[field] = missing[field].slice(1);
      expect(() => assertManifestAlignment(cronkiteManifest, missing)).toThrow(/drift/);

      const reordered = sources();
      reordered[field] = [...reordered[field]].reverse();
      expect(() => assertManifestAlignment(cronkiteManifest, reordered)).toThrow(/drift/);
    },
  );

  it.each(['packageName', 'packageVersion', 'exportedVersion'] as const)(
    'rejects an inconsistent %s instead of advertising another artifact identity',
    (field) => {
      const mismatched = sources();
      mismatched[field] = 'different-artifact';
      expect(() => assertManifestAlignment(cronkiteManifest, mismatched)).toThrow(
        /package identity drift/,
      );
    },
  );

  it('rejects a different configured default language', () => {
    expect(() => assertManifestAlignment(cronkiteManifest, {
      ...sources(),
      defaultLanguage: 'different-language',
    })).toThrow('default language drift');
  });

  it('rejects a system page whose renderable is absent from the package', () => {
    const manifest = manifestFixture();
    manifest.templateRendering.systemPages[0].renderable = 'missing-page';
    expect(() => assertManifestAlignment(manifest, sources())).toThrow(
      'system page uses undeclared renderable: missing-page',
    );
  });

  it('rejects a package missing a declared system-page language', () => {
    const manifest = manifestFixture();
    manifest.templateRendering.systemPages[0].variants.pop();
    expect(() => assertManifestAlignment(manifest, sources())).toThrow(
      /system page .* languages drift/,
    );
  });

  it('accepts system-page variants in another order without changing the language set', () => {
    const manifest = manifestFixture();
    manifest.templateRendering.systemPages[0].variants.reverse();
    expect(() => assertManifestAlignment(manifest, sources())).not.toThrow();
  });
});
