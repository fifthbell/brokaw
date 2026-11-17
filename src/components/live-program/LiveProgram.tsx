import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BellRing } from 'lucide-react';
import { useSSE } from './hooks/useSSE.js';
import {
  isProgramStateEvent,
  parseProgramEvent,
  reconcileProgramEvent,
  reconcileProgramSnapshot,
  resolveProgramEndpoint,
  type ProgramDiagnostic,
  type ProgramState,
} from './program-contract.js';

import { FIFTHBELL_ASSETS } from './assets.js';
import { MarqueeCurtain } from './components/MarqueeCurtain.js';
import Marquee from './components/Marquee.js';
import { WorldClocks } from './components/WorldClocks.js';
import { CallsignSlide } from './components/slides/CallsignSlide.js';
import { slideStyles } from './components/slides/slideStyles.js';
import { fetchEventsRetained, hasEventChanges, type Event } from './events.js';
import { loadProgramData } from './program-data.js';
import { clearCachesAndReload } from './program-reload.js';
import { type SupportedLanguage } from './i18n.js';
import {
  createArticlesSegment,
  createEarthquakeSegment,
  createLiveEventSegment,
  createMarketsSegment,
  createWeatherSegment,
  type EarthquakeData,
  type LiveEventData,
  type MarketData,
  type NewsItem,
  type WeatherRegionData,
  usePlaylistEngine
} from './segments/index.js';

import {
  normalizeCityKey,
  toRecord,
  parseSceneMetadata,
  resolveFifthBellLayerAvailability,
  extractConfigFromMetadata,
  normalizeLaunchDate,
} from './live-program-config.js';

interface LiveProgramProps {
  programId?: string;
  embedded?: boolean;
  sceneMetadata?: Record<string, unknown> | null;
  activeComponents?: string[];
  apiBaseUrl?: string;
}

export default function LiveProgram({ programId = 'fifthbell', embedded = false, sceneMetadata, activeComponents, apiBaseUrl }: LiveProgramProps) {
  const [state, setState] = useState<ProgramState | null>(null);
  const stateRef = useRef<ProgramState | null>(null);
  const snapshotRequestRef = useRef(0);
  const [showLogoSlide, setShowLogoSlide] = useState(false);
  const [callsignTime, setCallsignTime] = useState(new Date());
  const audioRef = useRef<HTMLAudioElement>(null);

  const [languageIndex, setLanguageIndex] = useState(0);

  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [weatherData, setWeatherData] = useState<WeatherRegionData[]>([]);
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [liveEvent, setLiveEvent] = useState<LiveEventData | null>(null);

  const [stageEvents, setStageEvents] = useState<Event[]>([]);
  const [programEvents, setProgramEvents] = useState<Event[]>([]);
  const [showCurtain, setShowCurtain] = useState(false);
  const [updatePending, setUpdatePending] = useState(false);
  const updatePendingRef = useRef(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const lastFetchedItemRef = useRef<number>(-1);
  const activeInstantAudioRef = useRef<HTMLAudioElement | null>(null);
  const sceneInstantBaseVolumeRef = useRef(1);
  const activeInstantAudiosRef = useRef<Map<HTMLAudioElement, number>>(new Map());
  const sceneInstantTakeSequenceRef = useRef(0);
  const sceneInstantAudiosRef = useRef(new Set<HTMLAudioElement>());
  const sceneInstantFadeFramesRef = useRef(new Set<number>());
  const sceneInstantPlayTimersRef = useRef(new Set<number>());
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
  // The rotation is never empty; the index can briefly exceed a shortened rotation.
  const currentLanguage: SupportedLanguage = languageRotation[languageIndex] ?? languageRotation[0];
  const normalizedProgramId = programId.trim() || 'fifthbell';
  const programEndpoint = resolveProgramEndpoint(apiBaseUrl, normalizedProgramId);

  const reportProgramDiagnostic = useCallback((diagnostic: ProgramDiagnostic | string, payload?: unknown) => {
    if (typeof diagnostic === 'string') {
      console.warn(`[live-program] ${diagnostic}`, payload);
      return;
    }
    console.warn(`[live-program:${diagnostic.code}] ${diagnostic.message}`, diagnostic.payload);
  }, []);

  const refreshProgramState = useCallback(async () => {
    const requestId = ++snapshotRequestRef.current;
    try {
      const response = await fetch(`${programEndpoint}/state`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Program snapshot failed: ${response.status}`);
      const payload = await response.json();
      if (requestId !== snapshotRequestRef.current) return;
      const result = reconcileProgramSnapshot(stateRef.current, payload, normalizedProgramId);
      if (result.accepted && result.state) {
        stateRef.current = result.state;
        setState(result.state);
      } else {
        // Every rejected snapshot carries its diagnostic.
        reportProgramDiagnostic(result.diagnostic!);
      }
    } catch (error) {
      console.error('[live-program] Failed to fetch program snapshot:', error);
    }
  }, [normalizedProgramId, programEndpoint, reportProgramDiagnostic]);

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

    void refreshProgramState();
  }, [controlledBySceneRenderer, refreshProgramState]);

  const refreshAllData = useCallback(async () => {
    // No source holds the program back: each answers with its own fallback (fifthbell/brokaw#35).
    const data = await loadProgramData(currentLanguage);

    setArticles(data.articles);
    setWeatherData(data.weather);
    setEarthquakes(data.earthquakes);
    setMarkets(data.markets);
    setLiveEvent(data.liveEvent);
    setStageEvents(data.events);
    setProgramEvents(data.events);

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
      const queueFadeStep = () => {
        const frame = requestAnimationFrame((timestamp) => {
          sceneInstantFadeFramesRef.current.delete(frame);
          fadeStep(timestamp);
        });
        sceneInstantFadeFramesRef.current.add(frame);
      };
      const fadeStep = (timestamp: number) => {
        const elapsed = timestamp - startTime;
        if (elapsed >= fadeMs) {
          audio.volume = 0;
          audio.pause();
          try { audio.currentTime = 0; } catch { /* no-op */ }
          audio.onended = null;
          audio.onerror = null;
          sceneInstantAudiosRef.current.delete(audio);
          if (activeInstantAudioRef.current === audio) {
            activeInstantAudioRef.current = null;
          }
          return;
        }
        // A queued frame's timestamp can precede the time the fade was requested.
        audio.volume = initialVolume * (1 - Math.min(1, Math.max(0, elapsed / fadeMs)));
        queueFadeStep();
      };
      queueFadeStep();
      return;
    }

    audio.pause();
    try { audio.currentTime = 0; } catch { /* no-op */ }
    audio.onended = null;
    audio.onerror = null;
    sceneInstantAudiosRef.current.delete(audio);
    activeInstantAudioRef.current = null;
  }, []);

  useEffect(() => () => {
    sceneInstantTakeSequenceRef.current += 1;
    for (const frame of sceneInstantFadeFramesRef.current) cancelAnimationFrame(frame);
    sceneInstantFadeFramesRef.current.clear();
    for (const timer of sceneInstantPlayTimersRef.current) window.clearTimeout(timer);
    sceneInstantPlayTimersRef.current.clear();
    const stopOwnedAudio = (audio: HTMLAudioElement) => {
      audio.pause();
      try { audio.currentTime = 0; } catch { /* no-op */ }
      audio.onended = null;
      audio.onerror = null;
    };
    for (const audio of sceneInstantAudiosRef.current) stopOwnedAudio(audio);
    sceneInstantAudiosRef.current.clear();
    for (const audio of activeInstantAudiosRef.current.keys()) stopOwnedAudio(audio);
    activeInstantAudiosRef.current.clear();
    if (songAudioRef.current) stopOwnedAudio(songAudioRef.current);
    activeInstantAudioRef.current = null;
    songAudioRef.current = null;
  }, []);

  useSSE({
    url: `${programEndpoint}/events`,
    enabled: !controlledBySceneRenderer,
    onOpen: refreshProgramState,
    onDiagnostic: reportProgramDiagnostic,
    onMessage: (payload: unknown) => {
      const parsed = parseProgramEvent(payload, normalizedProgramId);
      if (!parsed.event) {
        // An event the contract refuses always carries its diagnostic.
        reportProgramDiagnostic(parsed.diagnostic!);
        return;
      }
      const data = parsed.event as any;
      const stateResult = reconcileProgramEvent(stateRef.current, parsed.event);
      if (stateResult.accepted && stateResult.state !== stateRef.current) {
        stateRef.current = stateResult.state;
        setState(stateResult.state);
      } else if (stateResult.diagnostic) {
        reportProgramDiagnostic(stateResult.diagnostic);
      }
      if (isProgramStateEvent(parsed.event)) return;

      if (data.type === 'broadcast_settings_update') {
        // broadcast settings stored for overlay display
      } else if (data.type === 'scene_instant_take' && data.instant?.audioUrl) {
        console.log('[scene_instant_take]', data.instant.name, data.instant.audioUrl);
        sceneInstantTakeSequenceRef.current += 1;
        const takeSequence = sceneInstantTakeSequenceRef.current;
        const ms = mixerSettingsRef.current as any;
        const masterVol = ms.sceneInstantMasterVolume ?? 1;
        const muted = ms.sceneInstantMuted === true;
        const baseVol = typeof data.instant.volume === 'number' ? Math.max(0, Math.min(1, data.instant.volume)) : 1;
        const finalVol = muted ? 0 : Math.max(0, Math.min(1, baseVol * masterVol));

        const playAudio = () => {
          const audio = new Audio(data.instant.audioUrl);
          audio.preload = 'auto';
          audio.loop = data.loop !== false;
          audio.volume = finalVol;
          sceneInstantBaseVolumeRef.current = baseVol;
          sceneInstantAudiosRef.current.add(audio);
          audio.onended = () => { sceneInstantAudiosRef.current.delete(audio); if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null; };
          audio.onerror = () => { console.error('[scene_instant] audio error'); sceneInstantAudiosRef.current.delete(audio); if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null; };
          activeInstantAudioRef.current = audio;
          audio.play().catch((err) => {
            console.error('[scene_instant] play failed:', err);
            sceneInstantAudiosRef.current.delete(audio);
            if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null;
          });
        };

        const currentlyPlaying = activeInstantAudioRef.current;
        if (currentlyPlaying && !currentlyPlaying.paused && !currentlyPlaying.ended) {
          const switchFadeMs = 1500;
          stopSceneInstantAudio(switchFadeMs);
          const timer = window.setTimeout(() => {
            sceneInstantPlayTimersRef.current.delete(timer);
            if (sceneInstantTakeSequenceRef.current !== takeSequence) return;
            playAudio();
          }, switchFadeMs);
          sceneInstantPlayTimersRef.current.add(timer);
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
          const timer = window.setTimeout(() => {
            sceneInstantPlayTimersRef.current.delete(timer);
            const audio = new Audio(playback.instant.audioUrl);
            audio.preload = 'auto';
            audio.loop = true;
            audio.volume = typeof playback.instant.volume === 'number' ? Math.max(0, Math.min(1, playback.instant.volume)) : 1;
            sceneInstantBaseVolumeRef.current = audio.volume;
            sceneInstantAudiosRef.current.add(audio);
            audio.onended = () => { sceneInstantAudiosRef.current.delete(audio); if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null; };
            audio.onerror = () => { console.error('[scene_instant] audio error'); sceneInstantAudiosRef.current.delete(audio); if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null; };
            activeInstantAudioRef.current = audio;
            audio.play().catch((err) => {
              console.error('[scene_instant] play failed:', err);
              sceneInstantAudiosRef.current.delete(audio);
              if (activeInstantAudioRef.current === audio) activeInstantAudioRef.current = null;
            });
          }, 1500);
          sceneInstantPlayTimersRef.current.add(timer);
        } else {
          stopSceneInstantAudio();
        }
      } else if (data.type === 'instant_play' && data.instant?.audioUrl) {
        console.log('[instant_play]', data.instant.name, data.instant.audioUrl);
        const ms = mixerSettingsRef.current as any;
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
        activeInstantAudiosRef.current.set(audio, baseVol);
        audio.play().catch((err) => { console.error('[instant_play] play failed:', err); cleanup(); });
      } else if (data.type === 'instant_stop_all') {
        stopSceneInstantAudio();
        for (const audio of activeInstantAudiosRef.current.keys()) {
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
          current.volume = muted ? 0 : Math.max(0, Math.min(1, sceneInstantBaseVolumeRef.current * vol));
        }
        // Update instant play volumes
        const ms = mixerSettingsRef.current as any;
        const instantVol = ms.instantMasterVolume ?? 1;
        const instantMuted = ms.instantMuted === true;
        for (const [audio, baseVol] of activeInstantAudiosRef.current) {
          audio.volume = instantMuted ? 0 : Math.max(0, Math.min(1, baseVol * instantVol));
        }
        // Handle song sequence playback
        const songSeq = settings.songSequence;
        const currentSong = songAudioRef.current;
        const hasActiveSong = songSeq && songSeq.items && songSeq.items.length > 0 && songSeq.items.some((item: any) => item.audioUrl);
        if (hasActiveSong) {
          const activeItem = songSeq.items.find((item: any) => item.id === songSeq.activeItemId) || songSeq.items[0];
          const songUrl = activeItem?.audioUrl;
          if (songUrl) {
            const songMuted = ms.songMuted === true;
            const songVol = ms.songMasterVolume ?? 1;
            const finalSongVolume = songMuted ? 0 : Math.max(0, Math.min(1, songVol));
            if (!currentSong || currentSong.src !== songUrl) {
              if (currentSong) {
                currentSong.pause();
                currentSong.onended = null;
                currentSong.onerror = null;
              }
              const audio = new Audio(songUrl);
              audio.preload = 'auto';
              audio.loop = songSeq.loop !== false;
              audio.volume = finalSongVolume;
              audio.onerror = () => { console.error('[song] playback error'); };
              songAudioRef.current = audio;
              audio.play().catch((err) => { console.error('[song] play failed:', err); });
            } else {
              currentSong.volume = finalSongVolume;
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
        clearCachesAndReload(window);
      }
    }
  });

  const refreshEvents = useCallback(async () => {
    const events = await fetchEventsRetained({
      language: currentLanguage,
      allowedLanguages: [currentLanguage]
    });

    setStageEvents((prevStage) => {
      const prevJson = JSON.stringify(prevStage);
      const nextJson = JSON.stringify(events);
      return prevJson === nextJson ? prevStage : events;
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

  const liveEventSegment = useMemo(() => {
    const segment = createLiveEventSegment(liveEvent, setLiveEvent, currentLanguage);
    segment.durationMsPerItem = 15000;
    return segment;
  }, [liveEvent, setLiveEvent, currentLanguage]);

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
    if (config.showLiveEvents) nextSegments.push(liveEventSegment);
    if (config.showArticles) nextSegments.push(articlesSegment);
    if (config.showWeather) nextSegments.push(weatherSegment);
    if (config.showEarthquakes) nextSegments.push(earthquakeSegment);
    if (config.showMarkets) nextSegments.push(marketsSegment);
    return nextSegments;
  }, [liveEventSegment, articlesSegment, weatherSegment, earthquakeSegment, marketsSegment, config.showLiveEvents, config.showArticles, config.showWeather, config.showEarthquakes, config.showMarkets]);

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
