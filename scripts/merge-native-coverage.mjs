import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import coverage from 'istanbul-lib-coverage';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = async (filename) => JSON.parse(await readFile(filename, 'utf8'));

export async function mergeNativeCoverage({ applicationReport, configurationDirectory, output }) {
  const destination = resolve(output);
  const supplementalReport = join(configurationDirectory, 'coverage-final.json');
  const summaryPath = join(configurationDirectory, 'summary.json');
  const configSource = await realpath(join(root, 'vitest.config.ts'));
  if ([applicationReport, supplementalReport, summaryPath, configSource].some((path) => resolve(path) === destination)) {
    throw new Error('Native coverage output must not replace an input or the measured configuration.');
  }
  await rm(destination, { force: true });

  const [application, supplemental, summary, source] = await Promise.all([
    readJson(applicationReport), readJson(supplementalReport), readJson(summaryPath), readFile(configSource),
  ]);
  if (summary.actualSource !== configSource || summary.sourceSHA256 !== createHash('sha256').update(source).digest('hex')) {
    throw new Error('Supplemental native coverage does not match the actual configuration source.');
  }

  const applicationMap = coverage.createCoverageMap(application);
  const supplementalMap = coverage.createCoverageMap(supplemental);
  if (!applicationMap.files().length) throw new Error('Application native coverage must not be empty.');
  if (supplementalMap.files().length !== 1 || supplementalMap.files()[0] !== configSource) {
    throw new Error('Supplemental native coverage must contain only the actual configuration file.');
  }
  if (applicationMap.files().some((filename) => supplementalMap.files().includes(filename))) {
    throw new Error('Native coverage inputs overlap; supplemental counters cannot replace application measurements.');
  }

  // Upstream aggregation joins genuinely disjoint native file records. Preserve
  // each producer's maps and counters exactly; do not reinterpret either format.
  const merged = coverage.createCoverageMap(structuredClone(application));
  merged.merge(structuredClone(supplemental));
  for (const [filename, record] of Object.entries({ ...application, ...supplemental })) {
    if (!isDeepStrictEqual(merged.fileCoverageFor(filename).toJSON(), record)) {
      throw new Error(`Upstream aggregation changed the native record for ${filename}.`);
    }
  }

  await mkdir(dirname(destination), { recursive: true });
  const temporary = `${destination}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(merged.toJSON())}\n`);
  await rename(temporary, destination);
}

export function coverageArguments(args) {
  const names = ['--application', '--configuration', '--output'];
  if (args.length !== 6 || args.some((value, index) => index % 2 === 0 && !names.includes(value))) {
    throw new Error('Usage: merge-native-coverage.mjs --application REPORT --configuration DIRECTORY --output REPORT');
  }
  const values = new Map([0, 2, 4].map((index) => [args[index], args[index + 1]]));
  if (values.size !== 3 || [...values.values()].some((value) => !value || value.startsWith('--'))) {
    throw new Error('Three distinct native coverage paths are required.');
  }
  return {
    applicationReport: values.get('--application'),
    configurationDirectory: values.get('--configuration'),
    output: values.get('--output'),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await mergeNativeCoverage(coverageArguments(process.argv.slice(2)));
}
