import { describe, it, expect, vi } from 'vitest';
import { t, getNextLanguageIndex, LANGUAGE_ROTATION } from './i18n.js';

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

  it('falls back to English for a language outside the supported set', () => {
    // Callers pass a SupportedLanguage; a value from untyped JavaScript still gets text.
    expect(t('segment.weather', 'fr' as never)).toBe('Weather');
  });

  it('cycles through language rotation correctly', () => {
    expect(LANGUAGE_ROTATION).toEqual(['en', 'es', 'en', 'it']);
    expect(getNextLanguageIndex(0)).toBe(1);
    expect(getNextLanguageIndex(1)).toBe(2);
    expect(getNextLanguageIndex(2)).toBe(3);
    expect(getNextLanguageIndex(3)).toBe(0);
  });
});
