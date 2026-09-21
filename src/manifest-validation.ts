import type { CronkiteDeclarativeTemplateManifest } from './types/cronkite-manifest.generated.js';

export type ManifestAlignmentSources = {
  layouts: readonly string[];
  languages: readonly string[];
  defaultLanguage: string;
  packageName: string;
  packageVersion: string;
  exportedVersion: string;
};

function assertSameOrderedValues(label: string, manifestValues: readonly string[], sourceValues: readonly string[]) {
  if (manifestValues.length !== sourceValues.length || manifestValues.some((value, index) => value !== sourceValues[index])) {
    throw new Error(`${label} drift: manifest=${JSON.stringify(manifestValues)} source=${JSON.stringify(sourceValues)}`);
  }
}

export function assertManifestAlignment(manifest: CronkiteDeclarativeTemplateManifest, sources: ManifestAlignmentSources) {
  const rendering = manifest.templateRendering;
  const declaredLayouts = Object.keys(rendering.renderables).filter((name) => name !== 'social-image');
  assertSameOrderedValues('layout', declaredLayouts, sources.layouts);
  assertSameOrderedValues('language', rendering.helperConfig.supportedLanguages, sources.languages);

  if (manifest.package !== sources.packageName || manifest.version !== sources.packageVersion || manifest.version !== sources.exportedVersion) {
    throw new Error(`package identity drift: manifest=${manifest.package}@${manifest.version} package=${sources.packageName}@${sources.packageVersion} export=${sources.exportedVersion}`);
  }

  if (rendering.helperConfig.defaultLanguage !== sources.defaultLanguage) {
    throw new Error('default language drift');
  }

  for (const page of rendering.systemPages) {
    if (!rendering.renderables[page.renderable]) {
      throw new Error(`system page uses undeclared renderable: ${page.renderable}`);
    }
    assertSameOrderedValues(
      `system page ${page.renderable} languages`,
      page.variants.map((variant) => String(variant.document.language)).sort(),
      [...sources.languages].sort(),
    );
  }
}
