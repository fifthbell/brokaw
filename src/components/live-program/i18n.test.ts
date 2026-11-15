import { describe, it, expect, vi } from 'vitest';
import { t, getNextLanguageIndex, LANGUAGE_ROTATION, translations } from './i18n.js';

describe('i18n', () => {
  it('translates known keys for supported languages', () => {
    expect(t('segment.weather', 'en')).toBe('Weather');
    expect(t('segment.weather', 'es')).toBe('Clima');
    expect(t('segment.weather', 'it')).toBe('Meteo');
  });

  it('replaces placeholder parameters', () => {
    expect(t('earthquakes.timeAgo.minutesAgo', 'en', { count: 15 })).toBe('15 minutes ago');
    expect(t('earthquakes.timeAgo.minutesAgo', 'es', { count: 5 })).toBe('Hace 5 minutos');
  });

  it('warns and returns the raw key for unknown translation keys', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(t('nonexistent.key', 'en')).toBe('nonexistent.key');
    expect(warnSpy).toHaveBeenCalledWith('Translation missing for key: nonexistent.key');
    warnSpy.mockRestore();
  });

  it('falls back to en or raw key when target language is missing', () => {
    // Unsupported language code falls back to en
    expect(t('segment.weather', 'fr' as any)).toBe('Weather');
    // If a translation key had empty strings, fall back to key
    (translations as any)['empty.test'] = { en: '', es: '', it: '' };
    expect(t('empty.test', 'es')).toBe('empty.test');
    delete (translations as any)['empty.test'];
  });

  it('cycles through language rotation correctly', () => {
    expect(LANGUAGE_ROTATION).toEqual(['en', 'es', 'en', 'it']);
    expect(getNextLanguageIndex(0)).toBe(1);
    expect(getNextLanguageIndex(1)).toBe(2);
    expect(getNextLanguageIndex(2)).toBe(3);
    expect(getNextLanguageIndex(3)).toBe(0);
  });
});
