import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import inspector from 'node:inspector';
import { mkdir, readFile, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import convert from 'ast-v8-to-istanbul';
import coverage from 'istanbul-lib-coverage';
import { parseAstAsync } from 'vitest/node';

const execute = promisify(execFile);
const script = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(script), '..');
const hash = (value) => createHash('sha256').update(value).digest('hex');
const json = (file, value) => writeFile(file, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });

/** Bind native offsets to the actual source; unsupported transformations fail closed. */
export function verifyRuntimeSource({ source, runtime, url, native, parsed }) {
  assert.equal(native.url, url, 'Native coverage URL differs from the actual config');
  assert.equal(parsed.url, url, 'Debugger URL differs from the actual config');
  assert.equal(native.scriptId, parsed.scriptId, 'Native coverage and debugger script IDs differ');
  assert.ok(!parsed.sourceMapURL, 'A transformed config needs a separately qualified source map');
  assert.ok(runtime === source || runtime === `${source}\n\n//# sourceURL=${url}`,
    'Runtime is not the exact source with an optional Node sourceURL comment');
  const body = native.functions[0]?.ranges[0];
  assert.equal(body?.startOffset, 0, 'Native module range must start at zero');
  assert.equal(body?.endOffset, runtime.length, 'Native module range must bind the exact runtime text');
  return { sourceSHA256: hash(source), runtimeSHA256: hash(runtime), sourceChars: source.length,
    runtimeChars: runtime.length, suffix: runtime.slice(source.length) };
}

function projectOutput(config, observedDirectory, directory) {
  assert.equal(observedDirectory, directory, 'Config resolved the wrong dirname');
  assert.deepEqual(config?.test?.projects?.map((project) => project.test?.name), ['storybook', 'unit'],
    'Expected the actual Storybook and unit projects');
  const [storybook, unit] = config.test.projects;
  assert.equal(storybook.extends, true);
  assert.equal(storybook.test.browser.enabled, true);
  assert.equal(storybook.test.browser.headless, true);
  assert.deepEqual(storybook.test.browser.instances, [{ browser: 'chromium' }]);
  assert.deepEqual(storybook.test.setupFiles, ['.storybook/vitest.setup.ts']);
  assert.equal(storybook.plugins.length, 1);
  assert.equal(unit.extends, true);
  assert.equal(unit.test.environment, 'node');
  assert.ok(Array.isArray(unit.test.include) && unit.test.include.every((entry) => typeof entry === 'string'));
  return { names: config.test.projects.map((project) => project.test.name),
    browser: { enabled: storybook.test.browser.enabled, headless: storybook.test.browser.headless,
      instances: storybook.test.browser.instances }, setupFiles: storybook.test.setupFiles,
    unitEnvironment: unit.test.environment, unitInclude: unit.test.include,
    directory: observedDirectory, storybookConfigDir: path.join(observedDirectory, '.storybook') };
}

/** Each child evaluates the unchanged actual module in a declared host binding context. */
async function captureContext(mode, output) {
  assert.ok(mode === 'absent' || mode === 'provided', 'Unknown config binding context');
  const file = await realpath(path.join(root, 'vitest.config.ts'));
  const directory = path.dirname(file);
  const url = pathToFileURL(file).href;
  const source = await readFile(file, 'utf8');
  const probeLine = source.split('\n').findIndex((line) => line.includes('storybookTest({ configDir:'));
  assert.ok(probeLine >= 0, 'The actual Storybook config-directory observation site changed');
  if (mode === 'provided') globalThis.__dirname = directory;
  else assert.equal(typeof globalThis.__dirname, 'undefined', 'Absent context already has a dirname binding');

  const session = new inspector.Session();
  session.connect();
  const post = (method, parameters = {}) => new Promise((resolve, reject) =>
    session.post(method, parameters, (error, result) => error ? reject(error) : resolve(result)));
  const scripts = [];
  const observations = [];
  const pauseErrors = [];
  session.on('Debugger.scriptParsed', ({ params }) => { if (params.url === url) scripts.push(params); });
  session.on('Debugger.paused', ({ params }) => {
    const frame = params.callFrames[0];
    session.post('Debugger.evaluateOnCallFrame', { callFrameId: frame.callFrameId,
      expression: 'dirname', returnByValue: true }, (error, result) => {
      if (error || result.exceptionDetails) pauseErrors.push(String(error || result.exceptionDetails));
      else observations.push({ location: frame.location, value: result.result.value });
      session.post('Debugger.resume');
    });
  });
  try {
    await post('Debugger.enable');
    await post('Debugger.setBreakpointByUrl', { url, lineNumber: probeLine, columnNumber: 0 });
    await post('Profiler.enable');
    await post('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
    const imported = await import(url);
    assert.deepEqual(pauseErrors, [], 'Could not observe the actual config binding');
    assert.equal(observations.length, 1, 'Expected one actual config-directory observation');
    const outputConfig = projectOutput(imported.default, observations[0].value, directory);
    assert.equal(await realpath(outputConfig.storybookConfigDir), path.join(directory, '.storybook'));
    const precise = await post('Profiler.takePreciseCoverage');
    await json(path.join(output, 'precise-raw.json'), precise);
    const matches = precise.result.filter((entry) => entry.url === url);
    assert.equal(matches.length, 1, 'Expected exactly one actual config coverage record');
    assert.equal(scripts.length, 1, 'Expected exactly one actual config debugger script');
    const native = matches[0];
    const { scriptSource: runtime } = await post('Debugger.getScriptSource', { scriptId: native.scriptId });
    assert.equal(await readFile(file, 'utf8'), source, 'Config source changed during collection');
    const identity = verifyRuntimeSource({ source, runtime, url, native, parsed: scripts[0] });
    await writeFile(path.join(output, 'runtime-source.txt'), runtime, { flag: 'wx' });
    const nativeCoverage = await convert({ code: runtime, ast: await parseAstAsync(runtime), coverage: native });
    const map = coverage.createCoverageMap(nativeCoverage);
    assert.deepEqual(map.files(), [file], 'Native remapping changed the source inventory');
    await json(path.join(output, 'coverage-final.json'), map.toJSON());
    const nativeAPIversions = { node: process.version, v8: process.versions.v8,
      astV8ToIstanbul: JSON.parse(await readFile(new URL('../package.json', import.meta.resolve('ast-v8-to-istanbul')), 'utf8')).version,
      vitest: JSON.parse(await readFile(new URL('../package.json', import.meta.resolve('vitest/node')), 'utf8')).version,
      istanbulLibCoverage: JSON.parse(await readFile(new URL('./package.json', import.meta.resolve('istanbul-lib-coverage')), 'utf8')).version };
    await json(path.join(output, 'context.json'), { schemaVersion: 1, mode, file, identity, output: outputConfig,
      observations, native, nativeAPIversions,
      context: mode === 'provided' ? 'Provided host/CJS-style dirname binding; not genuine CJS-loader acceptance'
        : 'Plain Node ESM with dirname binding absent',
      integration: 'Direct config evaluation; VITEST and VITEST_STORYBOOK flags cleared; no browser run' });
    await post('Profiler.stopPreciseCoverage');
  } finally {
    session.disconnect();
  }
}

/** Merge only identity-bound records with unchanged native maps. Never invent counters. */
export function aggregateContexts(absent, provided) {
  assert.equal(absent.context.mode, 'absent');
  assert.equal(provided.context.mode, 'provided');
  assert.equal(absent.context.file, provided.context.file, 'Config source paths differ');
  assert.deepEqual(absent.context.identity, provided.context.identity, 'Config source/runtime identities differ');
  assert.deepEqual(absent.context.output, provided.context.output, 'Binding contexts produced different config output');
  assert.deepEqual(absent.context.nativeAPIversions, provided.context.nativeAPIversions, 'Native producer versions differ');
  const file = absent.context.file;
  for (const record of [absent, provided]) assert.deepEqual(Object.keys(record.coverage), [file], 'Unexpected coverage source');
  for (const key of ['statementMap', 'fnMap', 'branchMap']) {
    assert.deepEqual(absent.coverage[file][key], provided.coverage[file][key], `Native ${key} differs`);
  }
  const result = coverage.createCoverageMap({});
  result.merge(absent.coverage);
  result.merge(provided.coverage);
  const merged = result.fileCoverageFor(file);
  for (const key of ['statementMap', 'fnMap', 'branchMap']) {
    assert.deepEqual(merged[key], absent.coverage[file][key], `Upstream aggregation changed ${key}`);
  }
  return result.toJSON();
}

export async function collectConfigCoverage(outputDirectory) {
  assert.ok(outputDirectory, 'An explicit new output directory is required');
  const output = path.resolve(outputDirectory);
  // Never overwrite an earlier measurement or remove someone else's evidence.
  await mkdir(output);
  const records = [];
  for (const mode of ['absent', 'provided']) {
    const destination = path.join(output, mode);
    await mkdir(destination);
    await execute(process.execPath, ['--enable-source-maps', '--experimental-strip-types', script,
      '--context', mode, '--output', destination], { cwd: root, timeout: 30_000,
      env: { ...process.env, VITEST: '', VITEST_STORYBOOK: '' } });
    records.push({ context: JSON.parse(await readFile(path.join(destination, 'context.json'), 'utf8')),
      coverage: JSON.parse(await readFile(path.join(destination, 'coverage-final.json'), 'utf8')) });
  }
  const merged = aggregateContexts(...records);
  await json(path.join(output, 'coverage-final.json'), merged);
  const context = records[0].context;
  const nativeMaps = Object.fromEntries(['statementMap', 'fnMap', 'branchMap'].map((key) => [key, merged[context.file][key]]));
  await json(path.join(output, 'summary.json'), { schemaVersion: 1, actualSource: context.file,
    sourceSHA256: context.identity.sourceSHA256, runtimeSHA256: context.identity.runtimeSHA256,
    identity: context.identity, nativeAPIversions: context.nativeAPIversions, observedConfig: context.output,
    mapIdentitySHA256: hash(JSON.stringify(nativeMaps)),
    contexts: records.map(({ context: item }) => ({ mode: item.mode, label: item.context,
      context: `${item.mode}/context.json`, precise: `${item.mode}/precise-raw.json`,
      runtime: `${item.mode}/runtime-source.txt`, coverage: `${item.mode}/coverage-final.json` })),
    mapsIdentical: true, producer: 'Node inspector precise coverage + ast-v8-to-istanbul',
    aggregation: 'istanbul-lib-coverage', scope: 'Config file only; not full-source or CJS-loader acceptance' });
  return { outputDirectory: output, coverageFile: path.join(output, 'coverage-final.json') };
}

if (process.argv[1] && await realpath(process.argv[1]) === script) {
  try {
    const args = process.argv.slice(2);
    if (args.length === 2 && args[0] === '--output') await collectConfigCoverage(args[1]);
    else if (args.length === 4 && args[0] === '--context' && args[2] === '--output') await captureContext(args[1], args[3]);
    else throw new Error('Usage: node scripts/collect-config-coverage.mjs --output NEW_DIRECTORY');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
