import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

export function metadataDirectory(root) {
  return join(root, '.cache/storybook-package-metadata');
}

export async function prepareStorybookMetadata(root = process.cwd()) {
  const destination = metadataDirectory(root);
  // This directory contains only these generated public metadata files. A failed
  // preparation must not leave a previous package's metadata available to serve.
  await rm(destination, { recursive: true, force: true });

  const packageJson = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const manifestPath = join(root, 'dist/cronkite-manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const artifact = await import(pathToFileURL(join(root, 'dist/renderer.js')).href);

  if (
    typeof manifest.package !== 'string' || !manifest.package ||
    typeof manifest.version !== 'string' || !manifest.version ||
    manifest.package !== packageJson.name ||
    manifest.version !== packageJson.version ||
    artifact.version !== manifest.version ||
    !isDeepStrictEqual(artifact.cronkiteManifest, manifest) ||
    !artifact.outletConfig || typeof artifact.outletConfig !== 'object' || Array.isArray(artifact.outletConfig)
  ) {
    throw new Error('Built package metadata is inconsistent; run npm run build before starting Storybook.');
  }

  await mkdir(destination, { recursive: true });
  await copyFile(manifestPath, join(destination, 'cronkite-manifest.json'));
  await writeFile(join(destination, 'outlet-config.json'), `${JSON.stringify({
    package: manifest.package,
    version: artifact.version,
    outletConfig: artifact.outletConfig,
  }, null, 2)}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await prepareStorybookMetadata();
}
