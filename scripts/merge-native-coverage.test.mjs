import { execFile } from 'node:child_process';
import { copyFile, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { collectConfigCoverage } from './collect-config-coverage.mjs';
import { coverageArguments, mergeNativeCoverage } from './merge-native-coverage.mjs';

const execute = promisify(execFile);
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));
let directory;
let applicationReport;
let configurationDirectory;

beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'brokaw-native-merge-'));
  configurationDirectory = join(directory, 'config');
  await collectConfigCoverage(configurationDirectory);
  const applicationDirectory = join(directory, 'application');
  // Obtain the other native input by executing a real existing boundary test.
  // These temporary native reports are test inputs, never acceptance evidence.
  await execute(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run',
    '--project', 'unit', 'src/utils/sofascore.test.ts', '--coverage.enabled=true',
    '--coverage.provider=v8', '--coverage.include=src/utils/sofascore.ts',
    '--coverage.reporter=json', `--coverage.reportsDirectory=${applicationDirectory}`,
  ], { cwd: root, timeout: 30_000 });
  applicationReport = join(applicationDirectory, 'coverage-final.json');
}, 45_000);

afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

const options = (output) => ({ applicationReport, configurationDirectory, output });

describe('disjoint native coverage aggregation', () => {
  it('preserves both real producers maps and counters without rewriting either input', async () => {
    const supplementalReport = join(configurationDirectory, 'coverage-final.json');
    const applicationBefore = await readFile(applicationReport, 'utf8');
    const supplementalBefore = await readFile(supplementalReport, 'utf8');
    const output = join(directory, 'merged', 'coverage-final.json');
    await mergeNativeCoverage(options(output));
    const merged = await readJson(output);
    const application = JSON.parse(applicationBefore);
    const supplemental = JSON.parse(supplementalBefore);
    expect(Object.keys(merged).sort()).toEqual([...Object.keys(application), ...Object.keys(supplemental)].sort());
    for (const [filename, native] of Object.entries({ ...application, ...supplemental })) {
      expect(merged[filename]).toEqual(native);
    }
    expect(await readFile(applicationReport, 'utf8')).toBe(applicationBefore);
    expect(await readFile(supplementalReport, 'utf8')).toBe(supplementalBefore);
  });

  it('refuses overlapping measurements instead of silently adding competing counters', async () => {
    const output = join(directory, 'overlap.json');
    await writeFile(output, 'old report');
    await expect(mergeNativeCoverage({ ...options(output),
      applicationReport: join(configurationDirectory, 'coverage-final.json'),
    })).rejects.toThrow('inputs overlap');
    await expect(readFile(output)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('rejects a supplemental native artifact for another actual source', async () => {
    const wrong = join(directory, 'wrong-source');
    await mkdir(wrong);
    await copyFile(join(configurationDirectory, 'summary.json'), join(wrong, 'summary.json'));
    await copyFile(applicationReport, join(wrong, 'coverage-final.json'));
    await expect(mergeNativeCoverage({ ...options(join(directory, 'wrong.json')),
      configurationDirectory: wrong,
    })).rejects.toThrow('only the actual configuration file');
  });

  it('rejects a mismatched source hash before exposing a combined artifact', async () => {
    const corrupt = join(directory, 'corrupt-source');
    await mkdir(corrupt);
    const summary = await readJson(join(configurationDirectory, 'summary.json'));
    await writeFile(join(corrupt, 'summary.json'), JSON.stringify({ ...summary, sourceSHA256: 'changed' }));
    await copyFile(join(configurationDirectory, 'coverage-final.json'), join(corrupt, 'coverage-final.json'));
    await expect(mergeNativeCoverage({ ...options(join(directory, 'corrupt.json')),
      configurationDirectory: corrupt,
    })).rejects.toThrow('actual configuration source');
  });

  it('refuses an empty application report and never overwrites an input', async () => {
    const empty = join(directory, 'empty.json');
    await writeFile(empty, '{}');
    await expect(mergeNativeCoverage({ ...options(join(directory, 'empty-output.json')),
      applicationReport: empty,
    })).rejects.toThrow('must not be empty');
    await expect(mergeNativeCoverage(options(applicationReport))).rejects.toThrow('must not replace an input');
    expect(Object.keys(await readJson(applicationReport))).not.toEqual([]);
  });

  it('requires all three explicit distinct CLI options', () => {
    expect(coverageArguments(['--output', 'out', '--application', 'app', '--configuration', 'cfg'])).toEqual({
      applicationReport: 'app', configurationDirectory: 'cfg', output: 'out',
    });
    for (const args of [[], ['--unknown', 'x', '--application', 'a', '--output', 'b'],
      ['--output', 'x', '--output', 'y', '--application', 'z'],
      ['--output', '--application', '--application', 'x', '--configuration', 'y']]) {
      expect(() => coverageArguments(args)).toThrow();
    }
  });
});
