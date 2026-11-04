import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterEach, describe, expect, it } from 'vitest';
import storybook from '../.storybook/main';
import { metadataDirectory, prepareStorybookMetadata } from './prepare-storybook-metadata.mjs';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('./prepare-storybook-metadata.mjs', import.meta.url));
const directories = [];
const manifest = { package: '@example/storybook-fixture', version: '1.2.3', templateRendering: {} };
const outletConfig = { siteName: 'Fictional metadata fixture' };

async function fixture({ declaration = manifest, exportedManifest = declaration, version = declaration.version, config = outletConfig } = {}) {
  const root = await mkdtemp(join(tmpdir(), 'brokaw-metadata-'));
  directories.push(root);
  await mkdir(join(root, 'dist'));
  await writeFile(join(root, 'package.json'), JSON.stringify({ name: manifest.package, version: manifest.version, type: 'module' }));
  await writeFile(join(root, 'dist/cronkite-manifest.json'), `${JSON.stringify(declaration, null, 2)}\n`);
  await writeFile(join(root, 'dist/renderer.js'), [
    `export const version = ${JSON.stringify(version)};`,
    `export const cronkiteManifest = ${JSON.stringify(exportedManifest)};`,
    `export const outletConfig = ${JSON.stringify(config)};`,
  ].join('\n'));
  await writeFile(join(root, '.env'), 'FICTIONAL_PRIVATE_FILE=do-not-serve');
  return root;
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('Storybook public package metadata preparation', () => {
  it('serves the exact built declaration bytes and exported identity/configuration only', async () => {
    const root = await fixture();
    await prepareStorybookMetadata(root);
    const output = metadataDirectory(root);
    expect((await readdir(output)).sort()).toEqual(['cronkite-manifest.json', 'outlet-config.json']);
    expect(await readFile(join(output, 'cronkite-manifest.json'), 'utf8')).toBe(
      await readFile(join(root, 'dist/cronkite-manifest.json'), 'utf8'),
    );
    expect(JSON.parse(await readFile(join(output, 'outlet-config.json'), 'utf8'))).toEqual({
      package: manifest.package, version: manifest.version, outletConfig,
    });
  });

  it.each([
    { declaration: { ...manifest, version: 'previous-release' } },
    { version: 'different-export' },
    { exportedManifest: { ...manifest, templateRendering: { stale: true } } },
    { config: null },
    { config: [] },
  ])('refuses inconsistent build artifacts and removes previously served metadata %j', async (options) => {
    const root = await fixture(options);
    const output = join(root, '.cache/storybook-package-metadata');
    await mkdir(output, { recursive: true });
    await writeFile(join(output, 'cronkite-manifest.json'), 'previous artifact');
    await expect(prepareStorybookMetadata(root)).rejects.toThrow('Built package metadata is inconsistent');
    await expect(readdir(output)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('fails when the package was never built instead of serving source or old files', async () => {
    const root = await fixture();
    await rm(join(root, 'dist/cronkite-manifest.json'));
    await expect(prepareStorybookMetadata(root)).rejects.toThrow('cronkite-manifest.json');
  });

  it('runs as the package preparation command and refuses to serve an unbuilt package', async () => {
    const root = await fixture();
    await execute(process.execPath, [script], { cwd: root });
    expect((await readdir(metadataDirectory(root))).sort()).toEqual(['cronkite-manifest.json', 'outlet-config.json']);
    await rm(join(root, 'dist/cronkite-manifest.json'));
    await expect(execute(process.execPath, [script], { cwd: root })).rejects.toMatchObject({
      stderr: expect.stringContaining('cronkite-manifest.json'),
    });
    await expect(readdir(metadataDirectory(root))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('serves the prepared directory, and only it, at /package-metadata in Storybook', () => {
    const repository = fileURLToPath(new URL('..', import.meta.url));
    const served = storybook.staticDirs.filter((entry) => typeof entry === 'object' && entry.to === '/package-metadata');
    expect(served).toHaveLength(1);
    expect(join(repository, '.storybook', served[0].from)).toBe(metadataDirectory(repository));
  });
});
