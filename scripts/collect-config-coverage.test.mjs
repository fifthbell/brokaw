import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { aggregateContexts, collectConfigCoverage, verifyRuntimeSource } from './collect-config-coverage.mjs';

const execute = promisify(execFile);
const script = fileURLToPath(new URL('./collect-config-coverage.mjs', import.meta.url));
let directory;
let output;
let records;
const readJSON = async (file) => JSON.parse(await readFile(file, 'utf8'));

beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'brokaw-native-config-'));
  output = path.join(directory, 'measurement');
  await collectConfigCoverage(output);
  records = await Promise.all(['absent', 'provided'].map(async (mode) => ({
    context: await readJSON(path.join(output, mode, 'context.json')),
    coverage: await readJSON(path.join(output, mode, 'coverage-final.json')),
  })));
}, 30_000);

afterAll(async () => { if (directory) await rm(directory, { recursive: true, force: true }); });

describe('actual config native coverage producer', () => {
  it('observes both real binding states with identical configuration and source identity', async () => {
    const [absent, provided] = records;
    expect(absent.context.mode).toBe('absent');
    expect(provided.context.mode).toBe('provided');
    expect(provided.context.context).toContain('not genuine CJS-loader acceptance');
    expect(absent.context.output).toEqual(provided.context.output);
    expect(absent.context.output.names).toEqual(['storybook', 'unit']);
    expect(absent.context.output.storybookConfigDir).toBe(path.join(path.dirname(absent.context.file), '.storybook'));
    expect(absent.context.identity).toEqual(provided.context.identity);
    expect(absent.context.identity.sourceSHA256).toMatch(/^[a-f0-9]{64}$/);
    for (const record of records) {
      const mode = record.context.mode;
      const source = await readFile(record.context.file, 'utf8');
      const runtime = await readFile(path.join(output, mode, 'runtime-source.txt'), 'utf8');
      const precise = await readJSON(path.join(output, mode, 'precise-raw.json'));
      expect(precise.result).toContainEqual(record.context.native);
      expect(runtime).toBe(source + record.context.identity.suffix);
      expect(record.context.native.functions[0].ranges[0].endOffset).toBe(runtime.length);
    }
  });

  it('retains complementary native branch outcomes and unchanged maps through official aggregation', async () => {
    const [absent, provided] = records;
    const file = absent.context.file;
    expect(absent.coverage[file].b).toEqual({ 0: [0, 1] });
    expect(provided.coverage[file].b).toEqual({ 0: [1, 0] });
    const merged = await readJSON(path.join(output, 'coverage-final.json'));
    expect(Object.keys(merged)).toEqual([file]);
    for (const key of ['statementMap', 'fnMap', 'branchMap']) {
      expect(merged[file][key]).toEqual(absent.coverage[file][key]);
      expect(merged[file][key]).toEqual(provided.coverage[file][key]);
    }
    const collection = await readJSON(path.join(output, 'summary.json'));
    expect(collection.mapsIdentical).toBe(true);
    expect(collection.scope).toContain('Config file only');
    expect(collection.actualSource).toBe(file);
    expect(collection.nativeAPIversions.astV8ToIstanbul).toBe('1.0.0');
    expect(collection.nativeAPIversions.istanbulLibCoverage).toBe('3.2.2');
    expect(collection.mapIdentitySHA256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('does not overwrite retained evidence or accept an implicit destination', async () => {
    await expect(collectConfigCoverage()).rejects.toThrow('explicit new output directory');
    await expect(collectConfigCoverage(output)).rejects.toMatchObject({ code: 'EEXIST' });
    expect((await readJSON(path.join(output, 'summary.json'))).mapsIdentical).toBe(true);
  });

  it.each([
    ['source hash', (record) => { record.context.identity.sourceSHA256 = 'changed'; }],
    ['runtime hash', (record) => { record.context.identity.runtimeSHA256 = 'changed'; }],
    ['source path', (record) => { record.context.file += '.different'; }],
    ['actual config output', (record) => { record.context.output.directory += '/wrong'; }],
    ['native map', (record) => { record.coverage[record.context.file].branchMap = {}; }],
  ])('rejects %s corruption instead of combining incompatible records', (_name, corrupt) => {
    // Corrupt metadata/maps of real producer records, never invent passing counters.
    const [absent, provided] = structuredClone(records);
    corrupt(provided);
    expect(() => aggregateContexts(absent, provided)).toThrow();
  });

  it('rejects unproved runtime transformations, external mappings and mismatched script identity', async () => {
    const context = records[0].context;
    const source = await readFile(context.file, 'utf8');
    const runtime = await readFile(path.join(output, 'absent', 'runtime-source.txt'), 'utf8');
    const actual = { source, runtime, url: context.native.url, native: context.native,
      parsed: { url: context.native.url, scriptId: context.native.scriptId } };
    expect(verifyRuntimeSource(actual)).toEqual(context.identity);
    expect(() => verifyRuntimeSource({ ...actual, runtime: `${runtime}\nchanged` })).toThrow('exact source');
    expect(() => verifyRuntimeSource({ ...actual, parsed: { ...actual.parsed, sourceMapURL: 'unproved.map' } })).toThrow('qualified source map');
    expect(() => verifyRuntimeSource({ ...actual, parsed: { ...actual.parsed, scriptId: 'wrong-script' } })).toThrow('script IDs differ');
    assert.equal(context.identity.sourceChars, source.length);
  });

  it('fails unknown CLI arguments and private binding modes without producing a final report', async () => {
    await expect(execute(process.execPath, [script, '--unknown'])).rejects.toMatchObject({
      stderr: expect.stringContaining('Usage:'),
    });
    await expect(execute(process.execPath, [script, '--context', 'invalid', '--output', directory])).rejects.toMatchObject({
      stderr: expect.stringContaining('Unknown config binding context'),
    });
  });
});
