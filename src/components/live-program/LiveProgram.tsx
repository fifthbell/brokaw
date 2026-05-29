import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useSSE } from './hooks/useSSE.js';

import { FIFTHBELL_ASSETS } from './assets.js';
import { MarqueeCurtain } from './components/MarqueeCurtain.js';
import Marquee from './components/Marquee.js';
import { WorldClocks, DEFAULT_WORLD_CLOCK_CITIES } from './components/WorldClocks.js';
import { CallsignSlide } from './components/slides/CallsignSlide.js';
import { slideStyles } from './components/slides/slideStyles.js';
import { fetchEvents, getCachedEvents, hasEventChanges, type Event } from './events.js';
import { type SupportedLanguage } from './i18n.js';
import {
  createArticlesSegment,
  createEarthquakeSegment,
  createMarketsSegment,
  createWeatherSegment,
  fetchArticles,
  fetchEarthquakes,
  fetchMarketData,
  fetchWeatherData,
  type EarthquakeData,
  type MarketData,
  type NewsItem,
  type WeatherRegionData,
  usePlaylistEngine
} from './segments/index.js';

interface Layout {
  id: number;
  name: string;
  componentType: string;
  settings: string;
}

interface Scene {
  id: number;
  name: string;
  layoutId: number;
  layout: Layout;
  chyronText: string | null;
  metadata: string | null;
}

interface ProgramState {
  id: number;
  activeSceneId: number | null;
  activeScene: Scene | null;
  stagedSceneId?: number | null;
  stagedScene?: Scene | null;
  updatedAt: string;
}

interface FifthBellWorldClockCity {
  city: string;
  timezone: string;
}

interface LiveProgramProps {
  programId?: string;
  embedded?: boolean;
  sceneMetadata?: Record<string, unknown> | null;
  activeComponents?: string[];
  apiBaseUrl?: string;
}

interface FifthBellConfig {
  showArticles: boolean;
  showWeather: boolean;
  showEarthquakes: boolean;
  showMarkets: boolean;
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

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numeric));
}

function normalizeBoolean(value: unknown, fallback: boolean): boolean {
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

function normalizeStringArray(value: unknown): string[] {
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

function normalizeLanguageRotation(value: unknown): SupportedLanguage[] {
  if (!Array.isArray(value)) {
    return [...DEFAULT_LANGUAGE_ROTATION];
  }

  const allowed = new Set<SupportedLanguage>(['en', 'es', 'it']);
  const filtered = value.filter((item): item is SupportedLanguage => typeof item === 'string' && allowed.has(item as SupportedLanguage));

  return filtered.length > 0 ? filtered : [...DEFAULT_LANGUAGE_ROTATION];
}

function normalizeWorldClockCities(value: unknown): FifthBellWorldClockCity[] {
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

function normalizeCityKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function toRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseSceneMetadata(scene: Scene | null): Record<string, unknown> {
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

function resolveFifthBellLayerAvailability(activeComponents?: string[]) {
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

function extractConfigFromMetadata(metadataInput: Record<string, unknown> | null | undefined): FifthBellConfig {
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

function normalizeLaunchDate(rawDate: string): Date {
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return new Date(DEFAULT_CALLSIGN_PRELAUNCH_UNTIL_NYC);
  }

  return parsed;
}

export default function LiveProgram({ embedded = false, sceneMetadata, activeComponents, apiBaseUrl }: LiveProgramProps) {
  const [state, setState] = useState<ProgramState | null>(null);
  const [showLogoSlide, setShowLogoSlide] = useState(false);
  const [callsignTime, setCallsignTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);
  const audioInitialized = useRef(false);

  const [languageIndex, setLanguageIndex] = useState(0);

  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherRegionData[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [markets, setMarkets] = useState<MarketData[]>([]);

  const [stageEvents, setStageEvents] = useState<Event[]>([]);
  const [programEvents, setProgramEvents] = useState<Event[]>([]);
  const [showCurtain, setShowCurtain] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const updatePendingRef = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const lastFetchedItemRef = useRef<number>(-1);
  const activeInstantAudioRef = useRef<HTMLAudioElement | null>(null);
  const activeInstantAudiosRef = useRef<Set<HTMLAudioElement>>(new Set());
  const sceneInstantTakeSequenceRef = useRef(0);
  const mixerSettingsRef = useRef<Record<string, unknown>>({});
  const songAudioRef = useRef<HTMLAudioElement | null>(null);

  const controlledBySceneRenderer = sceneMetadata !== undefined;
  const effectiveSceneMetadata = useMemo(() => {
    if (sceneMetadata !== undefined) {
      return toRecord(sceneMetadata);
    }

    return parseSceneMetadata(state?.activeScene ?? null);
  }, [sceneMetadata, state?.activeScene]);
  const config = useMemo(() => extractConfigFromMetadata(effectiveSceneMetadata), [effectiveSceneMetadata]);
  const layerAvailability = useMemo(() => resolveFifthBellLayerAvailability(activeComponents), [activeComponents]);
  const languageRotation = config.languageRotation;
  const currentLanguage: SupportedLanguage = languageRotation[languageIndex] ?? languageRotation[0] ?? 'en';
  const resolvedApiBaseUrl =
    apiBaseUrl?.replace(/\/+$/, '') ||
    (() => {
      if (typeof window === 'undefined') return 'http://127.0.0.1:3000';
      const hostname = window.location.hostname;
      return `http://${hostname.includes(':') ? `[${hostname}]` : hostname}:3000`;
    })();

  useEffect(() => {
    if (languageIndex >= languageRotation.length) {
      setLanguageIndex(0);
    }
  }, [languageIndex, languageRotation.length]);

  useEffect(() => {
    updatePendingRef.current = updatePending;
  }, [updatePending]);

  useEffect(() => {
    if (controlledBySceneRenderer) {
      return;
    }

    fetch(`${resolvedApiBaseUrl}/state`)
      .then((res) => res.json())
      .then((data) => setState(data))
      .catch((err) => console.error('Failed to fetch FifthBell program state:', err));
  }, [controlledBySceneRenderer, resolvedApiBaseUrl]);

  const refreshAllData = useCallback(async () => {
    const [articlesData, weatherDataResult, earthquakesData, marketsData] = await Promise.all([
      fetchArticles(currentLanguage),
      fetchWeatherData(),
      fetchEarthquakes(currentLanguage),
      fetchMarketData(),
      fetchEvents({
        language: currentLanguage,
        allowedLanguages: [currentLanguage]
      })
    ]);

    setArticles(articlesData);
    setWeatherData(weatherDataResult);
    setEarthquakes(earthquakesData);
    setMarkets(marketsData);

    const cachedEvents = getCachedEvents();
    if (cachedEvents) {
      setStageEvents(cachedEvents);
      setProgramEvents(cachedEvents);
    }

    setDataLoaded(true);
  }, [currentLanguage]);

  useEffect(() => {
    void refreshAllData();
  }, [refreshAllData]);

  const stopSceneInstantAudio = useCallback((fadeMs = 0) => {
    const audio = activeInstantAudioRef.current;
    if (!audio) return;

    if (fadeMs > 0) {
      const initialVolume = audio.volume;
      const startTime = performance.now();
      const fadeStep = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        if (elapsed >= fadeMs) {
          audio.volume = 0;
          audio.pause();
          try { audio.currentTime = 0; } catch { /* no-op */ }
          audio.onended = null;
          audio.onerror = null;
          activeInstantAudioRef.current = null;
          return;
        }
        audio.volume = Math.max(0, initialVolume * (1 - elapsed / fadeMs));
        requestAnimationFrame(fadeStep);
      };
      requestAnimationFrame(fadeStep);
      return;
    }

    audio.pause();
    try { audio.currentTime = 0; } catch { /* no-op */ }
    audio.onended = null;
    audio.onerror = null;
    activeInstantAudioRef.current = null;
  }, []);

  useSSE({
    url: `${resolvedApiBaseUrl}/events`,
    enabled: !controlledBySceneRenderer,
    onMessage: (data: any) => {
      if (data.type === 'scene_staged') {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            stagedSceneId: typeof data.stagedSceneId === 'number' && Number.isFinite(data.stagedSceneId) ? data.stagedSceneId : null,
            stagedScene: data.scene && typeof data.scene === 'object' ? (data.scene as Scene) : null,
          };
        });
      } else if ((data.type === 'scene_change' || data.type === 'program_scenes_changed') && data.state) {
        setState(data.state);
      } else if (data.type === 'scene_update') {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activeScene: data.scene ?? prev.activeScene
          };
        });
      } else if (data.type === 'scene_cleared') {
        setState((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            activeSceneId: null,
            activeScene: null
          };
        });
      } else if (data.type === 'broadcast_settings_update') {
        // broadcast settings stored for overlay display
      } else if (data.type === 'scene_instant_take' && data.instant?.audioUrl) {
        console.log('[scene_instant_take]', data.instant.name, data.instant.audioUrl);
        sceneInstantTakeSequenceRef.current += 1;
        const takeSequence = sceneInstantTakeSequenceRef.current;
        const ms = (mixerSettingsRef.current || {}) as any;
        const masterVol = ms.sceneInstantMasterVolume ?? 1;
        const muted = ms.sceneInstantMuted === true;
        const baseVol = typeof data.instant.volume === 'number' ? Math.max(0, Math.min(1, data.instant.volume)) : 1;
        const finalVol = muted ? 0 : Math.max(0, Math.min(1, baseVol * masterVol));

        const playAudio = () => {
          const audio = new Audio(data.instant.audioUrl);
          audio.preload = 'auto';
          audio.loop = data.loop !== false;
          audio.volume = finalVol;
          audio.onended = () => { activeInstantAudioRef.current = null; };
          audio.onerror = () => { console.error('[scene_instant] audio error'); activeInstantAudioRef.current = null; };
          activeInstantAudioRef.current = audio;
          audio.play().catch((err) => { console.error('[scene_instant] play failed:', err); activeInstantAudioRef.current = null; });
        };

        const currentlyPlaying = activeInstantAudioRef.current;
        if (currentlyPlaying && !currentlyPlaying.paused && !currentlyPlaying.ended) {
          const switchFadeMs = 1500;
          stopSceneInstantAudio(switchFadeMs);
          window.setTimeout(() => {
            if (sceneInstantTakeSequenceRef.current !== takeSequence) return;
            playAudio();
          }, switchFadeMs);
          return;
        }

        stopSceneInstantAudio();
        playAudio();
      } else if (data.type === 'scene_instant_stop') {
        stopSceneInstantAudio(data.fadeMs || 0);
      } else if (data.type === 'scene_instant_state') {
        console.log('[scene_instant_state]', data.playback?.isPlaying ? 'playing' : 'stopped');
        const playback = data.playback;
        if (playback?.isPlaying && playback?.instant?.audioUrl) {
          const currentlyPlaying = activeInstantAudioRef.current;
          if (currentlyPlaying && !currentlyPlaying.paused && !currentlyPlaying.ended) {
            return;
          }
          stopSceneInstantAudio(1500);
          window.setTimeout(() => {
            const audio = new Audio(playback.instant.audioUrl);
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = typeof playback.instant.volume === 'number' ? Math.max(0, Math.min(1, playback.instant.volume)) : 1;
            audio.onended = () => { activeInstantAudioRef.current = null; };
            audio.onerror = () => { console.error('[scene_instant] audio error'); activeInstantAudioRef.current = null; };
            activeInstantAudioRef.current = audio;
            audio.play().catch((err) => { console.error('[scene_instant] play failed:', err); activeInstantAudioRef.current = null; });
          }, 1500);
        } else {
          stopSceneInstantAudio();
        }
      } else if (data.type === 'instant_play' && data.instant?.audioUrl) {
        console.log('[instant_play]', data.instant.name, data.instant.audioUrl);
        const ms = (mixerSettingsRef.current || {}) as any;
        const masterVol = ms.instantMasterVolume ?? 1;
        const muted = ms.instantMuted === true;
        const baseVol = typeof data.instant.volume === 'number' ? Math.max(0, Math.min(1, data.instant.volume)) : 1;
        const finalVol = muted ? 0 : Math.max(0, Math.min(1, baseVol * masterVol));
        const audio = new Audio(data.instant.audioUrl);
        audio.preload = 'auto';
        audio.volume = finalVol;
        const cleanup = () => {
          activeInstantAudiosRef.current.delete(audio);
        };
        audio.onended = cleanup;
        audio.onerror = () => { console.error('[instant_play] error'); cleanup(); };
        activeInstantAudiosRef.current.add(audio);
        audio.play().catch((err) => { console.error('[instant_play] play failed:', err); cleanup(); });
      } else if (data.type === 'instant_stop_all') {
        stopSceneInstantAudio();
        for (const audio of activeInstantAudiosRef.current) {
          audio.pause();
          try { audio.currentTime = 0; } catch { /* no-op */ }
          audio.onended = null;
          audio.onerror = null;
        }
        activeInstantAudiosRef.current.clear();
      } else if (data.type === 'audio_bus_update' && data.settings) {
        const settings = data.settings;
        mixerSettingsRef.current = settings.mixerSettings || {};
        // Update scene instant volume
        const current = activeInstantAudioRef.current;
        if (current) {
          const ms = mixerSettingsRef.current as any;
          const vol = ms.sceneInstantMasterVolume ?? 1;
          const muted = ms.sceneInstantMuted === true;
          current.volume = muted ? 0 : Math.max(0, Math.min(1, vol));
        }
        // Update instant play volumes
        const ms = (mixerSettingsRef.current || {}) as any;
        const instantVol = ms.instantMasterVolume ?? 1;
        const instantMuted = ms.instantMuted === true;
        for (const audio of activeInstantAudiosRef.current) {
          audio.volume = instantMuted ? 0 : Math.max(0, Math.min(1, instantVol));
        }
        // Handle song sequence playback
        const songSeq = settings.songSequence;
        const currentSong = songAudioRef.current;
        const hasActiveSong = songSeq && songSeq.items && songSeq.items.length > 0 && songSeq.items.some((item: any) => item.audioUrl);
        if (hasActiveSong) {
          const activeItem = songSeq.items.find((item: any) => item.id === songSeq.activeItemId) || songSeq.items[0];
          const songUrl = activeItem?.audioUrl;
          if (songUrl) {
            if (!currentSong || currentSong.src !== songUrl) {
              if (currentSong) {
                currentSong.pause();
                currentSong.onended = null;
                currentSong.onerror = null;
              }
              const audio = new Audio(songUrl);
              audio.preload = 'auto';
              audio.loop = songSeq.loop !== false;
              const ms2 = (mixerSettingsRef.current || {}) as any;
              const songMuted = ms2.songMuted === true;
              const songVol = ms2.songMasterVolume ?? 1;
              audio.volume = songMuted ? 0 : Math.max(0, Math.min(1, songVol));
              audio.onerror = () => { console.error('[song] playback error'); };
              songAudioRef.current = audio;
              audio.play().catch((err) => { console.error('[song] play failed:', err); });
            }
          }
        } else if (currentSong) {
          currentSong.pause();
          currentSong.onended = null;
          currentSong.onerror = null;
          songAudioRef.current = null;
        }
      } else if (data.type === 'song_off_air') {
        const song = songAudioRef.current;
        if (song) {
          song.pause();
          song.onended = null;
          song.onerror = null;
          songAudioRef.current = null;
        }
      } else if (data.type === 'program_reload') {
        if (typeof window === 'undefined') return;
        const reloadWithCacheBust = () => {
          const nextUrl = new URL(window.location.href);
          nextUrl.searchParams.set('_reload', Date.now().toString());
          window.location.replace(nextUrl.toString());
        };
        if (!('caches' in window)) { reloadWithCacheBust(); return; }
        void window.caches.keys()
          .then((keys) => Promise.all(keys.map((key) => window.caches.delete(key))))
          .catch((err) => { console.warn('[program_reload] cache clear failed:', err); })
          .finally(() => { reloadWithCacheBust(); });
      } else if (data.type === 'program_stingers_changed') {
        // stinger video URLs for scene transitions — stored for transition system
      }
    }
  });

  const refreshEvents = useCallback(async () => {
    await fetchEvents({
      language: currentLanguage,
      allowedLanguages: [currentLanguage]
    });
    const cachedEvents = getCachedEvents();
    if (!cachedEvents) {
      return;
    }

    setStageEvents((prevStage) => {
      const prevJson = JSON.stringify(prevStage);
      const nextJson = JSON.stringify(cachedEvents);
      return prevJson === nextJson ? prevStage : cachedEvents;
    });
  }, [currentLanguage]);

  useEffect(() => {
    if (stageEvents.length > 0 && programEvents.length > 0 && hasEventChanges(programEvents, stageEvents) && !showCurtain && !updatePending) {
      setUpdatePending(true);
    }
  }, [programEvents, showCurtain, stageEvents, updatePending]);

  const handleMarqueeCycleComplete = useCallback(() => {
    if (updatePendingRef.current) {
      setShowCurtain(true);
      setUpdatePending(false);
    }
  }, []);

  const handleCurtainComplete = useCallback(() => {
    setProgramEvents(stageEvents);
    setShowCurtain(false);
  }, [stageEvents]);

  const handlePlaylistLoop = useCallback(() => {
    setLanguageIndex((prev) => (prev + 1) % Math.max(1, languageRotation.length));
  }, [languageRotation.length]);

  const articlesSegment = useMemo(() => {
    const segment = createArticlesSegment(articles, setArticles, currentLanguage);
    segment.durationMsPerItem = config.articlesDurationMs;
    const originalRender = segment.render;
    const originalOnEnter = segment.onEnter;

    segment.onEnter = () => {
      originalOnEnter?.();
      lastFetchedItemRef.current = -1;
    };

    segment.render = (itemIndex: number, progress: number) => {
      if (lastFetchedItemRef.current !== itemIndex) {
        lastFetchedItemRef.current = itemIndex;
        void refreshEvents();
      }
      return originalRender(itemIndex, progress);
    };

    return segment;
  }, [articles, currentLanguage, refreshEvents, config.articlesDurationMs]);

  const filteredWeatherData = useMemo(() => {
    if (!config.weatherCities || config.weatherCities.length === 0) {
      return weatherData;
    }

    const allowed = new Set(config.weatherCities.map(normalizeCityKey));
    return weatherData
      .map((region) => ({
        ...region,
        cities: region.cities.filter((city: any) => allowed.has(normalizeCityKey(city.name)))
      }))
      .filter((region) => region.cities.length > 0);
  }, [config.weatherCities, weatherData]);

  const weatherSegment = useMemo(() => {
    const segment = createWeatherSegment(filteredWeatherData, setWeatherData, currentLanguage);
    segment.durationMsPerItem = config.weatherDurationMs;
    return segment;
  }, [filteredWeatherData, setWeatherData, currentLanguage, config.weatherDurationMs]);

  const earthquakeSegment = useMemo(() => {
    const segment = createEarthquakeSegment(earthquakes, setEarthquakes, currentLanguage);
    segment.durationMsPerItem = config.earthquakesDurationMs;
    return segment;
  }, [earthquakes, setEarthquakes, currentLanguage, config.earthquakesDurationMs]);

  const marketsSegment = useMemo(() => {
    const segment = createMarketsSegment(markets, setMarkets, currentLanguage);
    segment.durationMsPerItem = config.marketsDurationMs;
    return segment;
  }, [markets, setMarkets, currentLanguage, config.marketsDurationMs]);

  const segments = useMemo(() => {
    const nextSegments = [];
    if (config.showArticles) nextSegments.push(articlesSegment);
    if (config.showWeather) nextSegments.push(weatherSegment);
    if (config.showEarthquakes) nextSegments.push(earthquakeSegment);
    if (config.showMarkets) nextSegments.push(marketsSegment);
    return nextSegments;
  }, [articlesSegment, weatherSegment, earthquakeSegment, marketsSegment, config.showArticles, config.showWeather, config.showEarthquakes, config.showMarkets]);

  const {
    state: playlistState,
    currentSegment,
    pause,
    resume,
    reset
  } = usePlaylistEngine({
    segments,
    defaultDurationMs: config.playlistDefaultDurationMs,
    updateIntervalMs: config.playlistUpdateIntervalMs,
    onPlaylistLoop: handlePlaylistLoop
  });

  useEffect(() => {
    if (!audioRef.current || audioInitialized.current) {
      return;
    }

    audioRef.current.load();
    audioInitialized.current = true;
  }, []);

  useEffect(() => {
    if (!config.audioCueEnabled) {
      return;
    }

    const interval = window.setInterval(() => {
      const now = new Date();
      if (now.getMinutes() === config.audioCueMinute && now.getSeconds() === config.audioCueSecond && audioRef.current) {
        audioRef.current.currentTime = 0;
        void audioRef.current.play().catch((error) => {
          console.log('Audio playback prevented:', error);
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [config.audioCueEnabled, config.audioCueMinute, config.audioCueSecond]);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();

      const nycTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const launchDateNyc = new Date(normalizeLaunchDate(config.callsignPrelaunchUntilNyc).toLocaleString('en-US', { timeZone: 'America/New_York' }));
      const isBeforeLaunch = nycTime < launchDateNyc;
      const withinScheduleWindow =
        (minutes === 59 && seconds >= config.callsignWindowStartSecond) || (minutes === 0 && seconds <= config.callsignWindowEndSecond);

      const shouldShow = config.showCallsignTake && (isBeforeLaunch || withinScheduleWindow);
      if (shouldShow && !showLogoSlide) {
        reset();
      }

      setShowLogoSlide(shouldShow);
      if (shouldShow) {
        setCallsignTime(now);
      }
    };

    checkTime();
    const timer = window.setInterval(checkTime, 1000);
    return () => window.clearInterval(timer);
  }, [reset, config.showCallsignTake, config.callsignPrelaunchUntilNyc, config.callsignWindowStartSecond, config.callsignWindowEndSecond, showLogoSlide]);

  useEffect(() => {
    if (showLogoSlide) {
      pause();
    } else if (playlistState.isPaused) {
      resume();
    }
  }, [pause, resume, showLogoSlide, playlistState.isPaused]);

  const marqueeEnabled = layerAvailability.marquee && config.showMarquee;

  const isMarqueeVisible = useMemo(() => {
    if (!marqueeEnabled || showLogoSlide || segments.length === 0) {
      return false;
    }

    return true;
  }, [marqueeEnabled, showLogoSlide, segments.length]);

  const stageContainerStyle = embedded
    ? { width: '100%', height: '100%' }
    : { width: '1920px', height: '1080px', transform: 'scale(min(1, min(100vw / 1920, 100vh / 1080)))', transformOrigin: 'center center' };

  const stageContainerClass = embedded
    ? 'relative bg-black text-white overflow-hidden w-full h-full'
    : 'relative bg-black text-white overflow-hidden shadow-2xl';

  const loadingStage = (
    <div className={stageContainerClass} style={stageContainerStyle}>
      {layerAvailability.content ? <CallsignSlide currentTime={callsignTime} audioRef={audioRef} /> : <div className='absolute inset-0 bg-black' />}
    </div>
  );

  if (!dataLoaded) {
    return embedded ? (
      <div className='w-full h-full bg-black overflow-hidden'>{loadingStage}</div>
    ) : (
      <div className='min-h-screen bg-black flex items-center justify-center overflow-hidden'>{loadingStage}</div>
    );
  }

  const liveStage = (
    <div className={stageContainerClass} style={stageContainerStyle}>
      {layerAvailability.content ? (
        showLogoSlide ? (
          <CallsignSlide currentTime={callsignTime} audioRef={audioRef} />
        ) : currentSegment ? (
          currentSegment.render(playlistState.currentItemIndex, playlistState.progress)
        ) : (
          <div className='absolute inset-0 bg-black' />
        )
      ) : (
        <div className='absolute inset-0 bg-black' />
      )}

      {isMarqueeVisible && (
        <div className='absolute bottom-0 left-0 right-0 z-100 transition-transform duration-1000 ease-in-out translate-y-0'>
          {!showLogoSlide &&
            (showCurtain ? (
              <MarqueeCurtain onComplete={handleCurtainComplete} />
            ) : (
              <Marquee
                events={programEvents}
                onCycleComplete={handleMarqueeCycleComplete}
                minPostsCount={config.marqueeMinPostsCount}
                minAverageRelevance={config.marqueeMinAverageRelevance}
                minMedianRelevance={config.marqueeMinMedianRelevance}
                pixelsPerSecond={config.marqueePixelsPerSecond}
                minDurationSeconds={config.marqueeMinDurationSeconds}
                heightPx={config.marqueeHeightPx}
              />
            ))}
        </div>
      )}

      {(config.showWorldClocks || config.showBellIcon) && (
        <div className='absolute top-16 right-24 z-50 flex items-start gap-6'>
          {config.showWorldClocks && (
            <div className='flex items-start pt-1.5'>
              <WorldClocks
                currentTime={callsignTime}
                language={currentLanguage}
                cities={config.worldClockCities}
                rotateIntervalMs={config.worldClockRotateIntervalMs}
                transitionDurationMs={config.worldClockTransitionMs}
                shuffleCities={config.worldClockShuffle}
                widthPx={config.worldClockWidthPx}
              />
            </div>
          )}
          {config.showBellIcon && (
            <div className='bg-[#b21100] text-white p-6 shadow-2xl'>
              <BellRing size={64} strokeWidth={2} />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={embedded ? 'w-full h-full bg-black overflow-hidden' : 'min-h-screen bg-black flex items-center justify-center overflow-hidden'}>
      {liveStage}
      <audio ref={audioRef} preload='auto'>
        <source src={FIFTHBELL_ASSETS.audio.pipes} type='audio/ogg' />
      </audio>

      <style>{slideStyles}</style>
    </div>
  );
}
