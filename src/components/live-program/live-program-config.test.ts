import { describe, it, expect } from 'vitest';
import {
  clampNumber,
  normalizeBoolean,
  normalizeStringArray,
  normalizeLanguageRotation,
  normalizeWorldClockCities,
  normalizeCityKey,
  toRecord,
  parseSceneMetadata,
  resolveFifthBellLayerAvailability,
  extractConfigFromMetadata,
  normalizeLaunchDate,
} from './live-program-config.js';
import { DEFAULT_WORLD_CLOCK_CITIES } from './components/WorldClocks.js';

describe('LiveProgram config and normalization', () => {
  it('clamps numeric values within range and falls back on non-numeric', () => {
    expect(clampNumber(50, 10, 0, 100)).toBe(50);
    expect(clampNumber(-10, 10, 0, 100)).toBe(0);
    expect(clampNumber(150, 10, 0, 100)).toBe(100);
    expect(clampNumber('75', 10, 0, 100)).toBe(75);
    expect(clampNumber('invalid', 10, 0, 100)).toBe(10);
    expect(clampNumber(undefined, 10, 0, 100)).toBe(10);
    expect(clampNumber(NaN, 10, 0, 100)).toBe(10);
  });

  it('normalizes boolean inputs from booleans, numbers, and strings', () => {
    expect(normalizeBoolean(true, false)).toBe(true);
    expect(normalizeBoolean(false, true)).toBe(false);

    expect(normalizeBoolean(1, false)).toBe(true);
    expect(normalizeBoolean(0, true)).toBe(false);

    for (const val of ['true', '1', 'yes', 'on', ' TRUE ']) {
      expect(normalizeBoolean(val, false)).toBe(true);
    }
    for (const val of ['false', '0', 'no', 'off', '']) {
      expect(normalizeBoolean(val, true)).toBe(false);
    }

    expect(normalizeBoolean('unrecognized', true)).toBe(true);
    expect(normalizeBoolean({}, false)).toBe(false);
  });

  it('normalizes string arrays by trimming and removing empty or duplicate values', () => {
    expect(normalizeStringArray(null)).toEqual([]);
    expect(normalizeStringArray(['  New York  ', 'London', '', 'London', 123 as any])).toEqual(['New York', 'London']);
  });

  it('normalizes language rotations and world clock cities', () => {
    expect(normalizeLanguageRotation(null)).toEqual(['en', 'es', 'en', 'it']);
    expect(normalizeLanguageRotation(['es', 'it', 'fr', 'en', 123])).toEqual(['es', 'it', 'en']);
    expect(normalizeLanguageRotation(['fr', 'de'])).toEqual(['en', 'es', 'en', 'it']);

    expect(normalizeWorldClockCities(null)).toEqual(DEFAULT_WORLD_CLOCK_CITIES);
    expect(normalizeWorldClockCities([])).toEqual(DEFAULT_WORLD_CLOCK_CITIES);
    expect(normalizeWorldClockCities([{}])).toEqual(normalizeWorldClockCities(null));
    expect(normalizeWorldClockCities([
      null,
      {},
      { city: 'ROME' },
      { timezone: 'Europe/Rome' },
      { city: '  ROME  ', timezone: '  Europe/Rome  ' },
    ])).toEqual([{ city: 'ROME', timezone: 'Europe/Rome' }]);

    expect(normalizeCityKey('  SÃO PAULO  ')).toBe('sao paulo');
  });

  it('parses scene metadata and resolves layer availability', () => {
    expect(toRecord(null)).toEqual({});
    expect(toRecord([])).toEqual({});
    expect(toRecord({ a: 1 })).toEqual({ a: 1 });

    expect(parseSceneMetadata(null)).toEqual({});
    expect(parseSceneMetadata({ id: 1, name: 'S1', layoutId: 1, layout: {} as any, chyronText: null, metadata: null })).toEqual({});
    expect(parseSceneMetadata({ id: 1, name: 'S1', layoutId: 1, layout: {} as any, chyronText: null, metadata: 'invalid json' })).toEqual({});
    expect(parseSceneMetadata({ id: 1, name: 'S1', layoutId: 1, layout: {} as any, chyronText: null, metadata: '{"showArticles":true}' })).toEqual({ showArticles: true });

    expect(resolveFifthBellLayerAvailability(undefined)).toEqual({ content: true, marquee: true });
    expect(resolveFifthBellLayerAvailability([])).toEqual({ content: true, marquee: true });
    expect(resolveFifthBellLayerAvailability(['fifthbell'])).toEqual({ content: true, marquee: true });
    expect(resolveFifthBellLayerAvailability(['fifthbell-content'])).toEqual({ content: true, marquee: false });
    expect(resolveFifthBellLayerAvailability(['fifthbell-marquee'])).toEqual({ content: false, marquee: true });
  });

  it('extracts config from metadata and resets legacy trio', () => {
    const defaultCfg = extractConfigFromMetadata(null);
    expect(defaultCfg.showArticles).toBe(true);

    // Compatibility reset: 4, 5, 7 trio resets to 0, 0
    const legacyTrio = extractConfigFromMetadata({
      'fifthbell-marquee': {
        marqueeMinPostsCount: 4,
        marqueeMinAverageRelevance: 5,
        marqueeMinMedianRelevance: 7,
      },
      'fifthbell-content': {
        callsignPrelaunchUntilNyc: '  2026-12-01T00:00:00  ',
      },
    });
    expect(legacyTrio.marqueeMinAverageRelevance).toBe(0);
    expect(legacyTrio.marqueeMinMedianRelevance).toBe(0);
    expect(legacyTrio.callsignPrelaunchUntilNyc).toBe('2026-12-01T00:00:00');

    expect(normalizeLaunchDate('2026-05-01').getTime()).toBe(new Date('2026-05-01').getTime());
    expect(normalizeLaunchDate('invalid date').getTime()).toBe(new Date('2026-01-02T21:30:00').getTime());
  });
});
