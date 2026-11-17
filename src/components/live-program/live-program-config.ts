// FifthBell scene configuration: how a scene's metadata becomes LiveProgram's
// settings. Internal to the live program; not part of the package exports.
import { DEFAULT_WORLD_CLOCK_CITIES } from './components/WorldClocks.js';
import { type SupportedLanguage } from './i18n.js';

export interface Layout {
  id: number;
  name: string;
  componentType: string;
  settings: string;
}

export interface Scene {
  id: number;
  name: string;
  layoutId: number;
  layout: Layout;
  chyronText: string | null;
  metadata: string | null;
}

export interface FifthBellWorldClockCity {
  city: string;
  timezone: string;
}


export interface FifthBellConfig {
  showArticles: boolean;
  showWeather: boolean;
  showEarthquakes: boolean;
  showMarkets: boolean;
  showLiveEvents: boolean;
  showMarquee: boolean;
  showCallsignTake: boolean;
  weatherCities: string[];
  languageRotation: SupportedLanguage[];
  dataLoadTimeoutMs: number;
  playlistDefaultDurationMs: number;
  playlistUpdateIntervalMs: number;
  articlesDurationMs: number;
  weatherDurationMs: number;
  earthquakesDurationMs: number;
  marketsDurationMs: number;
  showWorldClocks: boolean;
  showBellIcon: boolean;
  worldClockRotateIntervalMs: number;
  worldClockTransitionMs: number;
  worldClockShuffle: boolean;
  worldClockWidthPx: number;
  worldClockCities: FifthBellWorldClockCity[];
  audioCueEnabled: boolean;
  audioCueMinute: number;
  audioCueSecond: number;
  callsignPrelaunchUntilNyc: string;
  callsignWindowStartSecond: number;
  callsignWindowEndSecond: number;
  marqueeMinPostsCount: number;
  marqueeMinAverageRelevance: number;
  marqueeMinMedianRelevance: number;
  marqueePixelsPerSecond: number;
  marqueeMinDurationSeconds: number;
  marqueeHeightPx: number;
}

const DEFAULT_LANGUAGE_ROTATION: SupportedLanguage[] = ['en', 'es', 'en', 'it'];
const DEFAULT_CALLSIGN_PRELAUNCH_UNTIL_NYC = '2026-01-02T21:30:00';
const FIFTHBELL_COMPONENT_TYPE_CONTENT = 'fifthbell-content';
const FIFTHBELL_COMPONENT_TYPE_MARQUEE = 'fifthbell-marquee';
const FIFTHBELL_COMPONENT_TYPE_TONI_CLOCK = 'toni-clock';
const FIFTHBELL_COMPONENT_TYPE_CORNER = 'fifthbell-corner';
const FIFTHBELL_COMPONENT_TYPE_LEGACY = 'fifthbell';

const DEFAULT_FIFTHBELL_CONFIG: FifthBellConfig = {
  showArticles: true,
  showWeather: true,
  showEarthquakes: true,
  showMarkets: true,
  showLiveEvents: true,
  showMarquee: false,
  showCallsignTake: true,
  weatherCities: [],
  languageRotation: DEFAULT_LANGUAGE_ROTATION,
  dataLoadTimeoutMs: 15000,
  playlistDefaultDurationMs: 10000,
  playlistUpdateIntervalMs: 100,
  articlesDurationMs: 10000,
  weatherDurationMs: 5000,
  earthquakesDurationMs: 10000,
  marketsDurationMs: 10000,
  showWorldClocks: true,
  showBellIcon: true,
  worldClockRotateIntervalMs: 7000,
  worldClockTransitionMs: 300,
  worldClockShuffle: true,
  worldClockWidthPx: 200,
  worldClockCities: [...DEFAULT_WORLD_CLOCK_CITIES],
  audioCueEnabled: true,
  audioCueMinute: 59,
  audioCueSecond: 55,
  callsignPrelaunchUntilNyc: DEFAULT_CALLSIGN_PRELAUNCH_UNTIL_NYC,
  callsignWindowStartSecond: 50,
  callsignWindowEndSecond: 3,
  marqueeMinPostsCount: 4,
  marqueeMinAverageRelevance: 0,
  marqueeMinMedianRelevance: 0,
  marqueePixelsPerSecond: 150,
  marqueeMinDurationSeconds: 10,
  marqueeHeightPx: 72
};

export function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

export function normalizeBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) {
      return true;
    }
    if (['false', '0', 'no', 'off', ''].includes(normalized)) {
      return false;
    }
  }

  return fallback;
}

export function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Set<string>();
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    if (!trimmed) {
      continue;
    }

    deduped.add(trimmed);
  }

  return [...deduped];
}

export function normalizeLanguageRotation(value: unknown): SupportedLanguage[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_LANGUAGE_ROTATION];
  }

  const allowed = new Set<SupportedLanguage>(['en', 'es', 'it']);
  const filtered = value.filter((item): item is SupportedLanguage => typeof item === 'string' && allowed.has(item as SupportedLanguage));

  return filtered.length > 0 ? filtered : [...DEFAULT_LANGUAGE_ROTATION];
}

export function normalizeWorldClockCities(value: unknown): FifthBellWorldClockCity[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_WORLD_CLOCK_CITIES];
  }

  const normalized = value
    .map((item) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null;
      }

      const city = typeof item.city === 'string' ? item.city.trim() : '';
      const timezone = typeof item.timezone === 'string' ? item.timezone.trim() : '';
      if (!city || !timezone) {
        return null;
      }

      return { city, timezone };
    })
    .filter((item): item is FifthBellWorldClockCity => item !== null);

  return normalized.length > 0 ? normalized : [...DEFAULT_WORLD_CLOCK_CITIES];
}

export function normalizeCityKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function parseSceneMetadata(scene: Scene | null): Record<string, unknown> {
  if (!scene || !scene.metadata) {
    return {};
  }

  try {
    const parsed = JSON.parse(scene.metadata);
    return toRecord(parsed);
  } catch {
    return {};
  }
}

export function resolveFifthBellLayerAvailability(activeComponents?: string[]) {
  const defaultAvailability = {
    content: true,
    marquee: true
  };

  if (!activeComponents || activeComponents.length === 0) {
    return defaultAvailability;
  }

  if (activeComponents.includes(FIFTHBELL_COMPONENT_TYPE_LEGACY)) {
    return defaultAvailability;
  }

  return {
    content: activeComponents.includes(FIFTHBELL_COMPONENT_TYPE_CONTENT),
    marquee: activeComponents.includes(FIFTHBELL_COMPONENT_TYPE_MARQUEE)
  };
}

export function extractConfigFromMetadata(metadataInput: Record<string, unknown> | null | undefined): FifthBellConfig {
  const metadata = toRecord(metadataInput);
  const legacyProps = toRecord(metadata[FIFTHBELL_COMPONENT_TYPE_LEGACY]);
  const contentProps = {
    ...legacyProps,
    ...toRecord(metadata[FIFTHBELL_COMPONENT_TYPE_CONTENT])
  };
  const marqueeProps = {
    ...legacyProps,
    ...toRecord(metadata[FIFTHBELL_COMPONENT_TYPE_MARQUEE])
  };
  const cornerProps = {
    ...legacyProps,
    ...toRecord(metadata[FIFTHBELL_COMPONENT_TYPE_TONI_CLOCK]),
    ...toRecord(metadata[FIFTHBELL_COMPONENT_TYPE_CORNER])
  };

  const parsedMarqueeMinPostsCount = clampNumber(marqueeProps.marqueeMinPostsCount, DEFAULT_FIFTHBELL_CONFIG.marqueeMinPostsCount, 0, 50);
  let parsedMarqueeMinAverageRelevance = clampNumber(marqueeProps.marqueeMinAverageRelevance, DEFAULT_FIFTHBELL_CONFIG.marqueeMinAverageRelevance, 0, 100);
  let parsedMarqueeMinMedianRelevance = clampNumber(marqueeProps.marqueeMinMedianRelevance, DEFAULT_FIFTHBELL_CONFIG.marqueeMinMedianRelevance, 0, 100);

  // Compatibility: prior defaults were tuned for OR logic. Under threshold logic, treat that trio as legacy.
  if (parsedMarqueeMinPostsCount === 4 && parsedMarqueeMinAverageRelevance === 5 && parsedMarqueeMinMedianRelevance === 7) {
    parsedMarqueeMinAverageRelevance = 0;
    parsedMarqueeMinMedianRelevance = 0;
  }

  return {
    showArticles: normalizeBoolean(contentProps.showArticles, DEFAULT_FIFTHBELL_CONFIG.showArticles),
    showWeather: normalizeBoolean(contentProps.showWeather, DEFAULT_FIFTHBELL_CONFIG.showWeather),
    showEarthquakes: normalizeBoolean(contentProps.showEarthquakes, DEFAULT_FIFTHBELL_CONFIG.showEarthquakes),
    showMarkets: normalizeBoolean(contentProps.showMarkets, DEFAULT_FIFTHBELL_CONFIG.showMarkets),
    showLiveEvents: normalizeBoolean(contentProps.showLiveEvents, DEFAULT_FIFTHBELL_CONFIG.showLiveEvents),
    showMarquee: normalizeBoolean(marqueeProps.showMarquee, DEFAULT_FIFTHBELL_CONFIG.showMarquee),
    showCallsignTake: normalizeBoolean(contentProps.showCallsignTake, DEFAULT_FIFTHBELL_CONFIG.showCallsignTake),
    weatherCities: normalizeStringArray(contentProps.weatherCities),
    languageRotation: normalizeLanguageRotation(contentProps.languageRotation),
    dataLoadTimeoutMs: clampNumber(contentProps.dataLoadTimeoutMs, DEFAULT_FIFTHBELL_CONFIG.dataLoadTimeoutMs, 1000, 120000),
    playlistDefaultDurationMs: clampNumber(contentProps.playlistDefaultDurationMs, DEFAULT_FIFTHBELL_CONFIG.playlistDefaultDurationMs, 1000, 120000),
    playlistUpdateIntervalMs: clampNumber(contentProps.playlistUpdateIntervalMs, DEFAULT_FIFTHBELL_CONFIG.playlistUpdateIntervalMs, 16, 5000),
    articlesDurationMs: clampNumber(contentProps.articlesDurationMs, DEFAULT_FIFTHBELL_CONFIG.articlesDurationMs, 1000, 120000),
    weatherDurationMs: clampNumber(contentProps.weatherDurationMs, DEFAULT_FIFTHBELL_CONFIG.weatherDurationMs, 1000, 120000),
    earthquakesDurationMs: clampNumber(contentProps.earthquakesDurationMs, DEFAULT_FIFTHBELL_CONFIG.earthquakesDurationMs, 1000, 120000),
    marketsDurationMs: clampNumber(contentProps.marketsDurationMs, DEFAULT_FIFTHBELL_CONFIG.marketsDurationMs, 1000, 120000),
    showWorldClocks: normalizeBoolean(cornerProps.showWorldClocks, DEFAULT_FIFTHBELL_CONFIG.showWorldClocks),
    showBellIcon: true,
    worldClockRotateIntervalMs: clampNumber(cornerProps.worldClockRotateIntervalMs, DEFAULT_FIFTHBELL_CONFIG.worldClockRotateIntervalMs, 500, 120000),
    worldClockTransitionMs: clampNumber(cornerProps.worldClockTransitionMs, DEFAULT_FIFTHBELL_CONFIG.worldClockTransitionMs, 0, 10000),
    worldClockShuffle: normalizeBoolean(cornerProps.worldClockShuffle, DEFAULT_FIFTHBELL_CONFIG.worldClockShuffle),
    worldClockWidthPx: clampNumber(cornerProps.worldClockWidthPx, DEFAULT_FIFTHBELL_CONFIG.worldClockWidthPx, 120, 600),
    worldClockCities: normalizeWorldClockCities(cornerProps.worldClockCities),
    audioCueEnabled: normalizeBoolean(contentProps.audioCueEnabled, DEFAULT_FIFTHBELL_CONFIG.audioCueEnabled),
    audioCueMinute: clampNumber(contentProps.audioCueMinute, DEFAULT_FIFTHBELL_CONFIG.audioCueMinute, 0, 59),
    audioCueSecond: clampNumber(contentProps.audioCueSecond, DEFAULT_FIFTHBELL_CONFIG.audioCueSecond, 0, 59),
    callsignPrelaunchUntilNyc:
      typeof contentProps.callsignPrelaunchUntilNyc === 'string' && contentProps.callsignPrelaunchUntilNyc.trim()
        ? contentProps.callsignPrelaunchUntilNyc.trim()
        : DEFAULT_FIFTHBELL_CONFIG.callsignPrelaunchUntilNyc,
    callsignWindowStartSecond: clampNumber(contentProps.callsignWindowStartSecond, DEFAULT_FIFTHBELL_CONFIG.callsignWindowStartSecond, 0, 59),
    callsignWindowEndSecond: clampNumber(contentProps.callsignWindowEndSecond, DEFAULT_FIFTHBELL_CONFIG.callsignWindowEndSecond, 0, 59),
    marqueeMinPostsCount: parsedMarqueeMinPostsCount,
    marqueeMinAverageRelevance: parsedMarqueeMinAverageRelevance,
    marqueeMinMedianRelevance: parsedMarqueeMinMedianRelevance,
    marqueePixelsPerSecond: clampNumber(marqueeProps.marqueePixelsPerSecond, DEFAULT_FIFTHBELL_CONFIG.marqueePixelsPerSecond, 10, 1000),
    marqueeMinDurationSeconds: clampNumber(marqueeProps.marqueeMinDurationSeconds, DEFAULT_FIFTHBELL_CONFIG.marqueeMinDurationSeconds, 1, 120),
    marqueeHeightPx: clampNumber(marqueeProps.marqueeHeightPx, DEFAULT_FIFTHBELL_CONFIG.marqueeHeightPx, 72, 200)
  };
}

export function normalizeLaunchDate(rawDate: string): Date {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_CALLSIGN_PRELAUNCH_UNTIL_NYC);
  }

  return parsed;
}
