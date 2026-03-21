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
