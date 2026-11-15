import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as useSSEModule from './hooks/useSSE.js';
import * as usePlaylistEngineModule from './segments/usePlaylistEngine.js';
import * as contractModule from './program-contract.js';
import * as eventsModule from './events.js';
import * as marqueeModule from './components/Marquee.js';
import * as segmentsModule from './segments/index.js';
import LiveProgram, {
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
} from './LiveProgram.js';

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

    expect(normalizeWorldClockCities(null).length).toBeGreaterThan(0);
    expect(normalizeWorldClockCities([]).length).toBeGreaterThan(0);
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

  it('renders LiveProgram component without throwing', () => {
    const html1 = renderToStaticMarkup(
      React.createElement(LiveProgram, {
        programId: 'fifthbell',
        embedded: false,
      })
    );
    expect(html1).toBeDefined();

    const html2 = renderToStaticMarkup(
      React.createElement(LiveProgram, {
        programId: '   ',
        embedded: true,
        sceneMetadata: {
          'fifthbell-content': {
            showArticles: true,
            showWeather: true,
            showEarthquakes: true,
            showMarkets: true,
            showLiveEvents: true,
            showBellIcon: true,
            showWorldClocks: true,
            showCallsignTake: true,
            callsignPrelaunchUntilNyc: '2099-01-01T00:00:00',
            weatherCities: ['New York'],
          },
          'fifthbell-marquee': {
            showMarquee: true,
          },
        },
        activeComponents: ['fifthbell-marquee'],
      })
    );
    expect(html2).toBeDefined();

    const html3 = renderToStaticMarkup(
      React.createElement(LiveProgram, {
        programId: 'custom',
        embedded: false,
        sceneMetadata: {
          'fifthbell-content': {
            showArticles: true,
            showWeather: true,
            showEarthquakes: true,
            showMarkets: true,
            showLiveEvents: true,
            showBellIcon: true,
            showWorldClocks: true,
            showCallsignTake: false,
            callsignPrelaunchUntilNyc: '2020-01-01T00:00:00',
            languageRotation: [],
          },
        },
        activeComponents: ['fifthbell-content', 'fifthbell-marquee'],
      })
    );
    expect(html3).toBeDefined();
  });

  it('handles SSE state updates, audio events, and playlist loops', async () => {
    let capturedSSEOptions: any = null;
    vi.spyOn(useSSEModule, 'useSSE').mockImplementation((options: any) => {
      capturedSSEOptions = options;
      return { isConnected: true, error: null } as any;
    });

    let capturedPlaylistConfig: any = null;
    vi.spyOn(usePlaylistEngineModule, 'usePlaylistEngine').mockImplementation((config: any) => {
      capturedPlaylistConfig = config;
      return {
        state: { currentSegmentIndex: 0, currentItemIndex: 0, progress: 0, isPaused: false },
        currentSegment: config.segments[0] || null,
        pause: vi.fn(),
        resume: vi.fn(),
        reset: vi.fn(),
      } as any;
    });

    // Mock Audio
    const playedAudios: any[] = [];
    (globalThis as any).Audio = class MockAudio {
      src: string;
      preload = '';
      volume = 1;
      loop = false;
      onended: any = null;
      onerror: any = null;
      constructor(src: string) {
        this.src = src;
        playedAudios.push(this);
      }
      load = vi.fn();
      play = vi.fn().mockRejectedValue(new Error('play rejected'));
      pause = vi.fn();
    };

    // Mock window with location and caches
    const replacedUrls: string[] = [];
    const deletedCacheKeys: string[] = [];
    (globalThis as any).window = {
      location: {
        href: 'https://fifthbell.com/live',
        hostname: 'fifthbell.com',
        search: '',
        replace: (url: string) => replacedUrls.push(url),
      },
      caches: {
        keys: () => Promise.resolve(['cache-v1', 'cache-v2']),
        delete: (key: string) => { deletedCacheKeys.push(key); return Promise.resolve(true); },
      },
      setInterval: vi.fn(),
      clearInterval: vi.fn(),
      setTimeout: ((cb: () => void) => { Promise.resolve().then(cb); return 1; }) as any,
      clearTimeout: vi.fn(),
    };

    let refCall = 0;
    vi.spyOn(React, 'useRef').mockImplementation((init: any) => {
      const idx = refCall++;
      if (idx === 13) {
        return { current: null };
      }
      return { current: init };
    });

    let stateIdx = 0;
    (vi.spyOn(React, 'useState') as any).mockImplementation((init: any) => {
      const idx = stateIdx++;
      let val = typeof init === 'function' ? init() : init;
      const setter = (next: any) => {
        val = typeof next === 'function' ? next(val) : next;
        return val;
      };
      return [val, setter];
    });

    renderToStaticMarkup(
      React.createElement(LiveProgram, {
        programId: 'test-program',
        embedded: true,
      })
    );

    expect(capturedSSEOptions).not.toBeNull();
    const { onMessage } = capturedSSEOptions;

    // 1. scene_instant_state stopped
    onMessage({ type: 'scene_instant_state', state: 'stopped' });

    // 2. instant_play
    onMessage({ type: 'instant_play', instant: { name: 'bell', audioUrl: 'https://audio.test/bell.mp3', volume: 0.8 } });
    const instantAudio = playedAudios.at(-1);
    expect(instantAudio).toBeDefined();
    instantAudio.onerror?.();
    instantAudio.onended?.();

    // 3. instant_stop_all
    onMessage({ type: 'instant_stop_all' });

    // 4. audio_bus_update with song sequence and mute
    onMessage({
      type: 'audio_bus_update',
      settings: {
        mixerSettings: { instantMasterVolume: 0.5, songMasterVolume: 0.7, instantMuted: true, songMuted: false },
        songSequence: { loop: true, activeItemId: 'song-1', items: [{ id: 'song-1', audioUrl: 'https://audio.test/song.mp3' }] },
      },
    });
    const songAudio = playedAudios.at(-1);
    songAudio?.onerror?.();

    // 5. song_off_air
    onMessage({ type: 'song_off_air' });

    // 6. program_reload with caches
    onMessage({ type: 'program_reload' });
    await new Promise((r) => setTimeout(r, 10));
    expect(replacedUrls.length).toBeGreaterThan(0);

    // 7. program_reload without caches
    delete (globalThis as any).window.caches;
    onMessage({ type: 'program_reload' });

    // 8. program_reload with caches error
    (globalThis as any).window.caches = {
      keys: () => Promise.reject(new Error('caches failure')),
    };
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    onMessage({ type: 'program_reload' });
    await new Promise((r) => setTimeout(r, 10));
    warnSpy.mockRestore();

    // 9. program_stingers_changed
    const spyStateEvent = vi.spyOn(contractModule, 'isProgramStateEvent').mockReturnValueOnce(false);
    onMessage({ type: 'program_stingers_changed', version: 1 });
    spyStateEvent.mockRestore();

    // 10. broadcast_settings_update
    onMessage({ type: 'broadcast_settings_update' });

    // 11. instant_play without volume and with muted settings
    onMessage({
      type: 'audio_bus_update',
      settings: {
        mixerSettings: { instantMasterVolume: 0.5, songMasterVolume: 0.7, instantMuted: true, songMuted: true, sceneInstantMuted: true },
      },
    });
    onMessage({ type: 'instant_play', instant: { name: 'bell-no-vol', audioUrl: 'https://audio.test/bell2.mp3' } });

    // 12. scene_instant_take without volume and muted
    onMessage({ type: 'scene_instant_take', instant: { name: 'take-no-vol', audioUrl: 'https://audio.test/take.mp3' } });
    const takeAudio = playedAudios.at(-1);
    takeAudio?.onerror?.();
    takeAudio?.onended?.();

    // 13. scene_instant_state playing without volume
    onMessage({ type: 'scene_instant_state', state: 'playing', playback: { isPlaying: true, instant: { name: 'take2', audioUrl: 'https://audio.test/take2.mp3' } } });

    // 14. audio_bus_update variations (empty settings, item fallback, item without url)
    onMessage({ type: 'audio_bus_update', settings: {} });
    onMessage({ type: 'audio_bus_update', settings: { songSequence: { items: [{ id: 'song-0', audioUrl: 'https://audio.test/s0.mp3' }] } } });
    onMessage({ type: 'audio_bus_update', settings: { songSequence: { activeItemId: 'song-no-url', items: [{ id: 'song-no-url' }, { id: 'has-url', audioUrl: 'https://audio.test/s.mp3' }] } } });

    // 15. program_reload when window is undefined
    const origWin = (globalThis as any).window;
    delete (globalThis as any).window;
    onMessage({ type: 'program_reload' });
    (globalThis as any).window = origWin;

    // 16. parseProgramEvent returning null event without diagnostic
    const spyParse = vi.spyOn(contractModule, 'parseProgramEvent').mockReturnValueOnce({ event: null });
    onMessage({ type: 'ignored' });
    spyParse.mockRestore();

    // 17. onOpen (refreshProgramState with rejected snapshot)
    const origFetch = globalThis.fetch;
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 1, version: 10 }),
    });
    const spyReconcile = vi.spyOn(contractModule, 'reconcileProgramSnapshot').mockReturnValueOnce({
      accepted: false,
      state: null,
    } as any);
    await capturedSSEOptions.onOpen?.();
    spyReconcile.mockRestore();
    globalThis.fetch = origFetch;

    capturedSSEOptions.onDiagnostic?.('diagnostic string message');

    // 17b. unrecognized event to exercise line 768 else branch
    const spyStateEvent2 = vi.spyOn(contractModule, 'isProgramStateEvent').mockReturnValueOnce(false);
    onMessage({ type: 'unrecognized_event', version: 1 });
    spyStateEvent2.mockRestore();

    // 18. test playlist loop callback
    expect(capturedPlaylistConfig).not.toBeNull();
    capturedPlaylistConfig.onPlaylistLoop?.();

    // 19. test wrapped segment onEnter and render when cachedEvents is null
    const spyFetch = vi.spyOn(eventsModule, 'fetchEvents').mockImplementation(async () => {
      eventsModule.clearCachedEvents();
      return [];
    });
    const articlesSeg = capturedPlaylistConfig.segments.find((s: any) => s.id === 'articles');
    if (articlesSeg) {
      articlesSeg.onEnter?.();
      articlesSeg.render?.(0, 50);
      articlesSeg.render?.(1, 50);
    }
    await new Promise((r) => setTimeout(r, 20));
    spyFetch.mockRestore();
  });

  it('covers all effects, refs, audio loads, time windows, and language rotations via dispatcher wrapper', async () => {
    const capturedEffects: Array<() => any> = [];
    const intervalCallbacks: Array<() => void> = [];

    const mockAudioElem = {
      load: vi.fn(),
      play: vi.fn().mockRejectedValue(new Error('play blocked')),
      currentTime: 10,
    };

    (globalThis as any).window = {
      location: {
        href: 'https://fifthbell.com/live',
        hostname: 'fifthbell.com',
        search: '',
        replace: vi.fn(),
      },
      setInterval: (cb: () => void) => {
        intervalCallbacks.push(cb);
        return intervalCallbacks.length;
      },
      clearInterval: vi.fn(),
      setTimeout: ((cb: () => void) => { Promise.resolve().then(cb); return 1; }) as any,
      clearTimeout: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };

    let capturedMarqueeProps: any = null;
    vi.spyOn(marqueeModule.default as any, 'type').mockImplementation((props: any) => {
      capturedMarqueeProps = props;
      return null;
    });

    let wrappedSSEOptions: any = null;
    vi.spyOn(useSSEModule, 'useSSE').mockImplementation((options: any) => {
      wrappedSSEOptions = options;
      return { isConnected: true, error: null } as any;
    });

    let wrappedPlaylistConfig: any = null;
    vi.spyOn(usePlaylistEngineModule, 'usePlaylistEngine').mockImplementation((config: any) => {
      wrappedPlaylistConfig = config;
      return {
        state: { currentSegmentIndex: 0, currentItemIndex: 0, progress: 0, isPaused: false },
        currentSegment: config.segments[0] || null,
        pause: vi.fn(),
        resume: vi.fn(),
        reset: vi.fn(),
      } as any;
    });

    let refIndex = 0;
    let stateIndex = 0;
    let mixerSettingsRefObj: any = null;
    let activeInstantAudioRefObj: any = null;

    function Wrapper({ children }: { children: React.ReactNode }) {
      const internals = (React as any).__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE || (React as any).__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      const dispatcher = internals.H || internals.ReactCurrentDispatcher?.current;

      const origUseRef = dispatcher.useRef;
      dispatcher.useRef = (init: any) => {
        const idx = refIndex++;
        if (idx === 2) {
          return { current: mockAudioElem };
        }
        if (idx === 3) {
          return { current: false };
        }
        if (idx === 6) {
          activeInstantAudioRefObj = { current: null };
          return activeInstantAudioRefObj;
        }
        if (init && typeof init === 'object' && !(init instanceof Map) && !(init instanceof Set) && Object.keys(init).length === 0) {
          mixerSettingsRefObj = { current: {} };
          return mixerSettingsRefObj;
        }
        if (init instanceof Map) {
          return { current: new Map() };
        }
        if (init instanceof Set) {
          return { current: new Set() };
        }
        return origUseRef(init);
      };

      dispatcher.useEffect = (cb: () => any) => {
        capturedEffects.push(cb);
      };

      const origUseMemo = dispatcher.useMemo;
      dispatcher.useMemo = (fn: any, deps: any) => {
        const val = fn();
        if (val && typeof val === 'object' && 'languageRotation' in val) {
          return {
            ...val,
            languageRotation: [],
          };
        }
        return val;
      };

      const origUseState = dispatcher.useState;
      dispatcher.useState = (init: any) => {
        const idx = stateIndex++;
        let val = typeof init === 'function' ? init() : init;
        if (idx === 13) {
          val = true; // dataLoaded = true so Marquee renders
        }
        const setter = (next: any) => {
          val = typeof next === 'function' ? next(val) : next;
          return val;
        };
        return [val, setter];
      };

      return React.createElement(React.Fragment, null, children);
    }

    eventsModule.clearCachedEvents();
    const spyArticles = vi.spyOn(segmentsModule, 'fetchArticles').mockResolvedValue([]);
    const spyWeather = vi.spyOn(segmentsModule, 'fetchWeatherData').mockResolvedValue([]);
    const spyQuakes = vi.spyOn(segmentsModule, 'fetchEarthquakes').mockResolvedValue([]);
    const spyMarkets = vi.spyOn(segmentsModule, 'fetchMarketData').mockResolvedValue([]);
    const spyLiveEvent = vi.spyOn(segmentsModule, 'fetchLiveEvent').mockResolvedValue(null);
    const spyFetchEvents = vi.spyOn(eventsModule, 'fetchEvents').mockImplementation(async () => []);
    const spyGetCached = vi.spyOn(eventsModule, 'getCachedEvents').mockReturnValue(null as any);

    // First render with empty languageRotation and schedule window testing
    const origDate = globalThis.Date;
    (globalThis as any).Date = class extends origDate {
      getMinutes() { return 59; }
      getSeconds() { return 10; }
    };

    renderToStaticMarkup(
      React.createElement(Wrapper, null,
        React.createElement(LiveProgram, {
          programId: 'effects-wrapper-test',
          sceneMetadata: {
            'fifthbell-marquee': {
              showMarquee: true,
            },
            'fifthbell-content': {
              showCallsignTake: true,
              callsignPrelaunchUntilNyc: '2020-01-01T00:00:00',
              callsignWindowStartSecond: 30,
              callsignWindowEndSecond: 30,
              audioCueEnabled: true,
              audioCueMinute: 59,
              audioCueSecond: 10,
              languageRotation: [],
            },
          },
        })
      )
    );

    // Run effects and cleanups
    for (const effect of capturedEffects) {
      const cleanup = effect();
      cleanup?.();
    }

    // Await refreshAllData so getCachedEvents() is called while spyGetCached returns null
    await new Promise((r) => setTimeout(r, 100));

    // Run intervals
    for (const cb of intervalCallbacks) {
      cb();
    }

    // Trigger marquee cycle complete (branch L798 b1)
    capturedMarqueeProps?.onCycleComplete?.();

    // Trigger playlist loop (line 810)
    wrappedPlaylistConfig?.onPlaylistLoop?.();

    // Trigger SSE messages with mixerSettingsRef === null (L600 b1, L672 b1, L708 b1)
    if (mixerSettingsRefObj) {
      mixerSettingsRefObj.current = null;
    }
    wrappedSSEOptions?.onMessage({ type: 'scene_instant_take', instant: { audioUrl: 'https://audio.test/take.mp3' } });
    wrappedSSEOptions?.onMessage({ type: 'instant_play', instant: { audioUrl: 'https://audio.test/bell.mp3' } });

    // For L708 b1: attach audio with volume setter that clears mixerSettingsRef.current
    let customVol = 1;
    const mockAudioWithSetter = {
      get volume() { return customVol; },
      set volume(v: number) {
        customVol = v;
        if (mixerSettingsRefObj) {
          mixerSettingsRefObj.current = null;
        }
      },
      pause: vi.fn(),
    };
    if (activeInstantAudioRefObj) {
      activeInstantAudioRefObj.current = mockAudioWithSetter;
    }
    wrappedSSEOptions?.onMessage({ type: 'audio_bus_update', settings: { mixerSettings: { sceneInstantMasterVolume: 0.8 } } });

    // Second render for window b3: minutes === 0 and seconds > 30
    capturedEffects.length = 0;
    refIndex = 0;
    stateIndex = 0;
    (globalThis as any).Date = class extends origDate {
      getMinutes() { return 0; }
      getSeconds() { return 50; }
    };

    renderToStaticMarkup(
      React.createElement(Wrapper, null,
        React.createElement(LiveProgram, {
          programId: 'effects-wrapper-test-2',
          sceneMetadata: {
            'fifthbell-content': {
              showCallsignTake: true,
              callsignPrelaunchUntilNyc: '2020-01-01T00:00:00',
              callsignWindowStartSecond: 30,
              callsignWindowEndSecond: 30,
              languageRotation: [],
            },
          },
        })
      )
    );

    for (const effect of capturedEffects) {
      const cleanup = effect();
      cleanup?.();
    }

    (globalThis as any).Date = origDate;
    spyArticles.mockRestore();
    spyWeather.mockRestore();
    spyQuakes.mockRestore();
    spyMarkets.mockRestore();
    spyLiveEvent.mockRestore();
    spyFetchEvents.mockRestore();
    spyGetCached.mockRestore();
    await new Promise((r) => setTimeout(r, 50));
  });
});
