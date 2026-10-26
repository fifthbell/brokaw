import { spawn } from 'node:child_process';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { collectConfigCoverage } from './collect-config-coverage.mjs';
import { mergeNativeCoverage } from './merge-native-coverage.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

export function runCommand(command, args, cwd = root) {
  return new Promise((accept, reject) => {
    const child = spawn(command, args, { cwd, stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) accept();
      else reject(new Error(`${command} failed (${signal ?? code}).`));
    });
  });
}

/** Failed tests stay failed even when their native measurement is available. */
export async function retainMeasurementAfterTests(tests, measure) {
  let failed = false;
  let failure;
  try { await tests(); } catch (error) { failed = true; failure = error; }
  try { await measure(); } catch (error) {
    if (failed) throw new AggregateError([failure, error], 'Tests and native measurement both failed.');
    throw error;
  }
  if (failed) throw failure;
}

export async function runCoverage() {
  const output = join(root, 'coverage');
  await mkdir(output, { recursive: true });
  await rm(join(output, 'coverage-final.json'), { force: true });
  const run = await mkdtemp(join(output, 'run-'));
  await writeFile(join(run, 'scope.json'), `${JSON.stringify({
    sourceDirectory: '.',
    applicationProducer: 'Vitest native V8/AST Istanbul',
    supplementalProducer: 'Actual Node config contexts / official AST Istanbul',
    meaning: 'Native measurement; exact-100% acceptance is a separate shared Clouseau gate.',
  }, null, 2)}\n`);

  const include = ['src', 'stories', 'scripts', '.storybook'].map((directory) =>
    `${directory}/**/*.{ts,tsx,js,jsx,cjs,mjs}`);
  include.push('*.{ts,tsx,js,jsx,cjs,mjs}');
  const vitest = [join(root, 'node_modules/vitest/vitest.mjs'), 'run',
    '--project', 'unit', '--project', 'storybook', '--coverage.enabled=true',
    '--coverage.provider=v8', '--coverage.reportOnFailure=true',
    '--coverage.reporter=json', '--coverage.reporter=text-summary',
    `--coverage.reportsDirectory=${join(run, 'vitest')}`,
    ...include.flatMap((pattern) => ['--coverage.include', pattern]),
  ];

  try {
    await runCommand('npm', ['run', 'prepare:storybook']);
    await retainMeasurementAfterTests(
      () => runCommand(process.execPath, vitest),
      async () => {
        const config = join(run, 'config');
        await collectConfigCoverage(config);
        const report = join(run, 'coverage-final.json');
        await mergeNativeCoverage({ applicationReport: join(run, 'vitest/coverage-final.json'),
          configurationDirectory: config, output: report });
        await copyFile(report, join(output, 'coverage-final.json'));
      },
    );
  } finally {
    // Remove generated package/site JavaScript before the shared reader checks
    // the complete source inventory. Every measured source file stays intact.
    await rm(join(root, 'dist'), { recursive: true, force: true });
    await rm(join(root, 'storybook-static'), { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await runCoverage();
}
