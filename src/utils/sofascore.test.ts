import { describe, expect, it } from 'vitest';
import {
  buildSofascoreAttackMomentumUrl,
  buildSofascoreMatchUrl,
  normalizeSofascoreId,
} from './sofascore.js';

describe('sofascore helpers', () => {
  it('normalizes valid numeric ids', () => {
    expect(normalizeSofascoreId(15388428)).toBe('15388428');
    expect(normalizeSofascoreId('15388428')).toBe('15388428');
  });

  it('rejects invalid ids', () => {
    expect(normalizeSofascoreId(0)).toBeNull();
    expect(normalizeSofascoreId(-5)).toBeNull();
    expect(normalizeSofascoreId('abc')).toBeNull();
    expect(normalizeSofascoreId('12abc')).toBeNull();
  });

  it('rejects non-integral and unbounded ids before constructing an embed URL', () => {
    for (const value of [1.5, Number.NaN, Number.POSITIVE_INFINITY, '9'.repeat(400), '000']) {
      expect(normalizeSofascoreId(value)).toBeNull();
      expect(buildSofascoreAttackMomentumUrl(value)).toBe('');
      expect(buildSofascoreMatchUrl(value)).toBe('');
    }
  });

  it('normalizes whitespace and leading zeros and keeps the requested embed theme', () => {
    expect(normalizeSofascoreId(' 00012 ')).toBe('12');
    expect(buildSofascoreAttackMomentumUrl(' 00012 ', 'dark')).toBe(
      'https://widgets.sofascore.com/embed/attackMomentum?id=12&widgetTheme=dark',
    );
  });

  it('builds attack momentum url for valid ids', () => {
    expect(buildSofascoreAttackMomentumUrl(15388428)).toBe(
      'https://widgets.sofascore.com/embed/attackMomentum?id=15388428&widgetTheme=light',
    );
  });

  it('builds match url for valid ids', () => {
    expect(buildSofascoreMatchUrl(15388428)).toBe(
      'https://www.sofascore.com/football/match#id:15388428',
    );
  });

  it('returns empty string for invalid ids', () => {
    expect(buildSofascoreAttackMomentumUrl('')).toBe('');
    expect(buildSofascoreAttackMomentumUrl(undefined)).toBe('');
    expect(buildSofascoreMatchUrl('')).toBe('');
    expect(buildSofascoreMatchUrl(undefined)).toBe('');
  });
});
