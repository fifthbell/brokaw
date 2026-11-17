import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearCachesAndReload, type ReloadWindow } from './program-reload.js';

function fakeWindow(caches?: ReloadWindow['caches']) {
  const replaced: string[] = [];
  const win: ReloadWindow = {
    location: { href: 'https://fifthbell.com/live?programId=fifthbell', replace: (url: string) => { replaced.push(url); } },
    ...(caches ? { caches } : {}),
  };
  return { win, replaced };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('program reload', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('clears every cache, then reloads with a cache-busting query that keeps the program', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-17T05:00:00.000Z'));
    const deleted: string[] = [];
    const { win, replaced } = fakeWindow({
      keys: async () => ['pages-v1', 'assets-v1'],
      delete: async (key: string) => { deleted.push(key); return true; },
    });
    clearCachesAndReload(win);
    expect(replaced).toEqual([]);
    await settle();
    expect(deleted).toEqual(['pages-v1', 'assets-v1']);
    expect(replaced).toEqual([`https://fifthbell.com/live?programId=fifthbell&_reload=${Date.parse('2026-11-17T05:00:00.000Z')}`]);
  });

  it('reloads at once when the browser has no Cache Storage', () => {
    const { win, replaced } = fakeWindow();
    clearCachesAndReload(win);
    expect(replaced).toHaveLength(1);
    expect(new URL(replaced[0]).searchParams.get('programId')).toBe('fifthbell');
  });

  it('reports a failed cache clear and still reloads', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const failure = new Error('quota');
    const { win, replaced } = fakeWindow({ keys: async () => { throw failure; }, delete: async () => true });
    clearCachesAndReload(win);
    await settle();
    expect(warn).toHaveBeenCalledWith('[program_reload] cache clear failed:', failure);
    expect(replaced).toHaveLength(1);
  });
});
