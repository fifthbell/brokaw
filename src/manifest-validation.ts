import type { CronkiteCLSManifest } from "./types/cronkite-manifest.generated.js";

export type ManifestAlignmentSources = {
  layouts: readonly string[];
  languages: readonly string[];
  defaultLanguage: string;
  packageName: string;
  packageVersion: string;
  exportedVersion: string;
};

function assertSameOrderedValues(
  label: string,
  manifestValues: readonly string[],
  sourceValues: readonly string[],
) {
  if (
    manifestValues.length !== sourceValues.length ||
    manifestValues.some((value, index) => value !== sourceValues[index])
  ) {
    throw new Error(
      `${label} drift: manifest=${JSON.stringify(manifestValues)} source=${JSON.stringify(sourceValues)}`,
    );
  }
}

export function assertManifestAlignment(
  manifest: CronkiteCLSManifest,
  sources: ManifestAlignmentSources,
) {
  assertSameOrderedValues("layout", manifest.layouts, sources.layouts);
  assertSameOrderedValues("language", manifest.languages, sources.languages);

  if (
    manifest.package !== sources.packageName ||
    manifest.version !== sources.packageVersion ||
    manifest.version !== sources.exportedVersion
  ) {
    throw new Error(
      `package identity drift: manifest=${manifest.package}@${manifest.version} package=${sources.packageName}@${sources.packageVersion} export=${sources.exportedVersion}`,
    );
  }

  if (!manifest.languages.includes(sources.defaultLanguage)) {
    throw new Error(
      "outletConfig.defaultLanguage is not declared by the manifest",
    );
  }

  for (const page of manifest.systemPages ?? []) {
    if (!manifest.layouts.includes(page.layout)) {
      throw new Error(`system page uses undeclared layout: ${page.layout}`);
    }

    const expectedLanguages = page.perLanguage
      ? manifest.languages
      : [sources.defaultLanguage];
    assertSameOrderedValues(
      `system page ${page.layout} copy`,
      Object.keys(page.copy).sort(),
      [...expectedLanguages].sort(),
    );
  }
}
