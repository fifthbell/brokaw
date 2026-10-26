import type { CronkiteDeclarativeTemplateManifest } from '../src/types/cronkite-manifest.generated';

type OutletMetadata = {
  package: string;
  version: string;
  outletConfig: Record<string, unknown>;
};

async function readMetadata(filename: string): Promise<unknown> {
  const response = await fetch(`./package-metadata/${filename}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Built package metadata ${filename} returned HTTP ${response.status}.`);
  return response.json();
}

export async function loadStorybookPackageMetadata() {
  const [manifest, outlet] = await Promise.all([
    readMetadata('cronkite-manifest.json'),
    readMetadata('outlet-config.json'),
  ]) as [CronkiteDeclarativeTemplateManifest, OutletMetadata];

  if (
    !manifest || !outlet ||
    typeof manifest.package !== 'string' || !manifest.package ||
    typeof manifest.version !== 'string' || !manifest.version ||
    manifest.package !== outlet.package || manifest.version !== outlet.version ||
    !manifest.templateRendering ||
    !outlet.outletConfig || typeof outlet.outletConfig !== 'object' || Array.isArray(outlet.outletConfig)
  ) {
    throw new Error('Built Storybook metadata is missing or belongs to different package artifacts.');
  }

  return { manifest, outlet };
}
