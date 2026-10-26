import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { retainMeasurementAfterTests, runCommand } from './test-coverage.mjs';

const directories = [];
async function temporaryDirectory() {
  const directory = await mkdtemp(join(tmpdir(), 'brokaw-coverage-process-'));
  directories.push(directory);
  return directory;
}
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))); });

describe('coverage verification retains truthful process failures', () => {
  it('collects the diagnostic after an actual failing process and still rejects that failure', async () => {
    const directory = await temporaryDirectory();
    const marker = join(directory, 'measurement-attempted');
    await expect(retainMeasurementAfterTests(
      () => runCommand(process.execPath, ['-e', 'process.exit(7)'], directory),
      () => writeFile(marker, 'measurement was not suppressed'),
    )).rejects.toThrow('failed (7)');
    expect(await readFile(marker, 'utf8')).toBe('measurement was not suppressed');
  });

  it('does not treat a failed native producer as an available measurement', async () => {
    const directory = await temporaryDirectory();
    await expect(retainMeasurementAfterTests(
      () => runCommand(process.execPath, ['-e', 'process.exit(0)'], directory),
      () => runCommand(process.execPath, ['-e', 'process.exit(9)'], directory),
    )).rejects.toThrow('failed (9)');
  });

  it('retains both failures and never treats a falsy rejection as test success', async () => {
    const directory = await temporaryDirectory();
    await expect(retainMeasurementAfterTests(
      () => runCommand(process.execPath, ['-e', 'process.exit(7)'], directory),
      () => runCommand(process.execPath, ['-e', 'process.exit(9)'], directory),
    )).rejects.toMatchObject({
      message: 'Tests and native measurement both failed.',
      errors: [expect.objectContaining({ message: expect.stringContaining('(7)') }),
        expect.objectContaining({ message: expect.stringContaining('(9)') })],
    });
    await expect(retainMeasurementAfterTests(
      () => Promise.reject(null),
      () => Promise.resolve(),
    )).rejects.toBeNull();
  });

  it('rejects an unavailable executable instead of reporting empty success', async () => {
    const directory = await temporaryDirectory();
    await expect(runCommand(join(directory, 'missing-executable'), [], directory)).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('completes only after both real successful processes complete', async () => {
    const directory = await temporaryDirectory();
    await expect(retainMeasurementAfterTests(
      () => runCommand(process.execPath, ['-e', 'process.exit(0)'], directory),
      () => runCommand(process.execPath, ['-e', 'process.exit(0)'], directory),
    )).resolves.toBeUndefined();
  });
});
