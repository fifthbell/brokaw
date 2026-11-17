import type { Meta, StoryObj } from '@storybook/html';
import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { expect, waitFor, within } from 'storybook/test';
import { usePlaylistEngine } from '../../src/components/live-program/segments/usePlaylistEngine';
import type { PlaylistConfig, PlaylistState, Segment } from '../../src/components/live-program/segments/types';
import { createEarthquakeSegment, fetchEarthquakes } from '../../src/components/live-program/segments/EarthquakeSegment';
import { createWeatherSegment, fetchWeatherData, type WeatherRegionData } from '../../src/components/live-program/segments/WeatherSegment';
import { createArticlesSegment, fetchArticles, type NewsItem } from '../../src/components/live-program/segments/ArticlesSegment';
import { createMarketsSegment, fetchMarketData, type MarketData } from '../../src/components/live-program/segments/MarketsSegment';
import { createLiveEventSegment } from '../../src/components/live-program/segments/LiveEventSegment';
import { CallsignSlide } from '../../src/components/live-program/components/slides/CallsignSlide';
import { WorldClocks } from '../../src/components/live-program/components/WorldClocks';
import { FastAverageColor } from 'fast-average-color';

const meta: Meta = {
  title: 'React/PlaylistAcceptance',
  parameters: { layout: 'fullscreen' },
  render: () => document.createElement('div')
};
export default meta;

// These stories run the real React hook and public segment factories. Only the
// external data boundary is replaced; every response is fictional and bounded.
function mount(canvas: HTMLElement) {
  const host = document.createElement('div');
  host.style.cssText = 'position:relative;width:1280px;height:720px';
  canvas.append(host);
  const root = createRoot(host);
  return {
    host,
    render(node: React.ReactNode) { flushSync(() => root.render(node)); },
    close() { flushSync(() => root.unmount()); host.remove(); }
  };
}


/**
 * Loads every image in host with the colour reader first succeeding, then failing,
 * and returns the backdrop markup after each. The reader is restored afterwards.
 */
async function backdropAfterImageLoads(host: HTMLElement) {
  const original = FastAverageColor.prototype.getColor;
  const load = () => { for (const img of host.querySelectorAll('img')) img.dispatchEvent(new Event('load')); };
  try {
    FastAverageColor.prototype.getColor = function() { return { hex: '#123456' } as any; };
    load();
    await waitFor(() => expect(host.innerHTML).toContain('rgb(18, 52, 86)'));
    FastAverageColor.prototype.getColor = function() { throw new Error('fixture colour failure'); };
    load();
    await new Promise((resolve) => setTimeout(resolve, 50));
    return host.innerHTML;
  } finally {
    FastAverageColor.prototype.getColor = original;
  }
}

function Playlist({ config }: { config: PlaylistConfig }) {
  const engine = usePlaylistEngine(config);
  return <div>
    <output aria-label='playlist state'>{JSON.stringify(engine.state)}</output>
    <button onClick={engine.pause}>Pause</button>
    <button onClick={engine.resume}>Resume</button>
    <button onClick={engine.reset}>Reset</button>
    <button onClick={engine.advanceToNext}>Next</button>
    <div aria-label='current item'>{engine.currentSegment?.render(engine.state.currentItemIndex, engine.state.progress) ?? 'No segments'}</div>
  </div>;
}

function state(host: HTMLElement): PlaylistState {
  return JSON.parse(within(host).getByLabelText('playlist state').textContent!);
}
function click(host: HTMLElement, name: string) {
  flushSync(() => within(host).getByRole('button', { name }).click());
}
const delay = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function recordingFetch(reply: (url: string, init?: RequestInit) => Promise<Response>) {
  const original = globalThis.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    calls.push({ url, init });
    return reply(url, init);
  };
  return { calls, restore() { globalThis.fetch = original; } };
}
function recordingErrors() {
  const original = console.error;
  const calls: unknown[][] = [];
  console.error = (...args: unknown[]) => { calls.push(args); };
  return { calls, restore() { console.error = original; } };
}

export const LifecycleAndRejectedPrefetch: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const events: string[] = [];
    const rejection = new Error('fictional prefetch unavailable');
    const errors = recordingErrors();
    const segment = (id: string, count: number): Segment => ({
      id, label: id, itemCount: count, durationMsPerItem: 10000,
      render: (item) => <span>{id} item {item}</span>,
      onEnter: () => { events.push(`${id}:enter`); },
      onExit: () => { events.push(`${id}:exit`); },
      prefetch: async () => {
        events.push(`${id}:prefetch`);
        if (id === 'third') throw rejection;
      }
    });
    let loops = 0;
    try {
      mounted.render(<Playlist config={{ segments: [segment('first', 2), segment('second', 1), segment('third', 1)], onPlaylistLoop: () => { loops++; } }} />);
      click(mounted.host, 'Pause');
      const initialEvents = [...events];
      click(mounted.host, 'Next');
      await expect(state(mounted.host).currentItemIndex).toBe(1);
      await expect(within(mounted.host).getByLabelText('current item')).toHaveTextContent('first item 1');
      await expect(events).toEqual(initialEvents);
      click(mounted.host, 'Next');
      await expect(state(mounted.host)).toMatchObject({ currentSegmentIndex: 1, currentItemIndex: 0, progress: 0 });
      await waitFor(() => expect(errors.calls).toEqual([['[Playlist] Failed to prefetch third:', rejection]]));
      await expect(events.slice(initialEvents.length)).toEqual(['first:exit', 'second:enter', 'third:prefetch']);
      click(mounted.host, 'Next');
      await expect(within(mounted.host).getByLabelText('current item')).toHaveTextContent('third item 0');
      click(mounted.host, 'Next');
      await expect(state(mounted.host)).toMatchObject({ currentSegmentIndex: 0, currentItemIndex: 0 });
      await expect(events.slice(initialEvents.length)).toEqual([
        'first:exit', 'second:enter', 'third:prefetch',
        'second:exit', 'third:enter', 'first:prefetch',
        'third:exit', 'first:enter', 'second:prefetch'
      ]);
      await expect(loops).toBe(1);
      await expect(errors.calls[0][1]).toBe(rejection);
    } finally { mounted.close(); errors.restore(); }
  }
};

export const PauseResumeResetAndTimerCleanup: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const nativeSet = window.setInterval.bind(window);
    const nativeClear = window.clearInterval.bind(window);
    const active = new Set<number>();
    const originalSet = window.setInterval;
    const originalClear = window.clearInterval;
    // Record actual native intervals instead of substituting a fake clock.
    window.setInterval = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) => {
      const id = nativeSet(handler, timeout, ...args);
      if (timeout === 20) active.add(id);
      return id;
    }) as typeof window.setInterval;
    window.clearInterval = ((id?: number) => { if (id !== undefined) active.delete(id); nativeClear(id); }) as typeof window.clearInterval;
    const segments: Segment[] = ['first', 'second'].map((id) => ({
      id, label: id, itemCount: 2, durationMsPerItem: 200,
      render: (item) => <span>{id} item {item}</span>
    }));
    try {
      mounted.render(<Playlist config={{ segments, updateIntervalMs: 20 }} />);
      await waitFor(() => expect(state(mounted.host).progress).toBeGreaterThan(0));
      click(mounted.host, 'Pause');
      const paused = state(mounted.host);
      await expect(paused.isPaused).toBe(true);
      await expect(active.size).toBe(0);
      await delay(100);
      await expect(state(mounted.host)).toEqual(paused);
      click(mounted.host, 'Resume');
      await waitFor(() => {
        const resumed = state(mounted.host);
        expect(resumed.progress !== paused.progress || resumed.currentItemIndex !== paused.currentItemIndex || resumed.currentSegmentIndex !== paused.currentSegmentIndex).toBe(true);
      });
      await expect(state(mounted.host).isPaused).toBe(false);
      click(mounted.host, 'Reset');
      click(mounted.host, 'Pause');
      click(mounted.host, 'Next');
      await expect(state(mounted.host).currentItemIndex).toBe(1);
      click(mounted.host, 'Reset');
      await expect(state(mounted.host)).toEqual({ currentSegmentIndex: 0, currentItemIndex: 0, progress: 0, isPaused: false });
      // Assert observable timed advancement without declaring an extra boundary
      // tick (or a particular floating-point overshoot) the desired contract.
      await waitFor(() => expect(state(mounted.host).currentSegmentIndex).toBe(1), { timeout: 1500 });
      await expect(within(mounted.host).getByLabelText('current item')).toHaveTextContent('second item 0');
    } finally {
      mounted.close();
      const remaining = active.size;
      window.setInterval = originalSet;
      window.clearInterval = originalClear;
      await expect(remaining).toBe(0);
    }
  }
};

export const EmptyPlaylistRemainsIdle: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    try {
      mounted.render(<Playlist config={{ segments: [], updateIntervalMs: 20 }} />);
      click(mounted.host, 'Next');
      await delay(60);
      await expect(within(mounted.host).getByLabelText('current item')).toHaveTextContent('No segments');
      await expect(state(mounted.host)).toEqual({ currentSegmentIndex: 0, currentItemIndex: 0, progress: 0, isPaused: false });
    } finally { mounted.close(); }
  }
};

export const EarthquakeDataflowAndRendering: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const now = Date.now();
    const originalNow = Date.now;
    const minute = 60000;
    const quake = (id: number, age: number, magnitude: number) => ({
      id, magnitude, depth: 12.6, timestamp: new Date(now - age).toISOString(), latitude: 12.345, longitude: -45.678,
      datapoints: [{ source: 'Fixture Survey', additionalData: { localPlace: `Fictional Coast ${id}` } }, { source: 'Fixture Survey' }]
    });
    const input = [quake(6, 24 * 60 * minute, 7.2), quake(4, 60 * minute, 5), quake(2, minute, 4.56),
      quake(1, 0, 4.5), quake(5, 3 * 60 * minute, 6), quake(3, 5 * minute, 5.5),
      quake(7, 24 * 60 * minute + 1, 8), quake(8, 0, 4.4)];
    input[0].datapoints = [{ source: 'Fixture Survey' }];
    const network = recordingFetch(async () => Response.json(input));
    try {
      Date.now = () => now;
      let received: Awaited<ReturnType<typeof fetchEarthquakes>> | undefined;
      await createEarthquakeSegment([], (items) => { received = items; }).prefetch!();
      Date.now = originalNow;
      await expect(received?.map((item) => item.id)).toEqual([1, 2, 3, 4, 5, 6]);
      await expect(received?.[1]).toMatchObject({ magnitude: 4.6, depth: 13, location: 'Fictional Coast 2', sources: ['Fixture Survey'] });
      await expect(received?.[5].location).toBe('12.35°, -45.68°');
      await expect(network.calls).toHaveLength(1);
      await expect(network.calls[0].url).toBe(`https://api.monitor.gaulatti.com/earthquakes?_=${now}`);
      const segment = createEarthquakeSegment(received!);
      await expect(segment.itemCount).toBe(1);
      await expect(segment.durationMsPerItem).toBe(10000);
      mounted.render(segment.render(0, 35));
      await expect(mounted.host).toHaveTextContent('M4.5');
      await expect(mounted.host).toHaveTextContent('M7.2');
      await expect(mounted.host).toHaveTextContent('Fictional Coast 2');
      await expect(mounted.host).toHaveTextContent('1 day ago');
      await segment.prefetch!();
      await expect(network.calls).toHaveLength(1);
      mounted.render(createEarthquakeSegment([]).render(0, 0));
      await expect(mounted.host).toHaveTextContent('Loading');
    } finally { Date.now = originalNow; network.restore(); mounted.close(); }
  }
};

export const EarthquakeFailuresRetainCause: StoryObj = {
  play: async () => {
    const errors = recordingErrors();
    const unavailable = new Error('fictional earthquake endpoint unavailable');
    let shouldReject = false;
    const network = recordingFetch(async () => {
      if (shouldReject) throw unavailable;
      return new Response('', { status: 503 });
    });
    try {
      await expect(await fetchEarthquakes()).toEqual([]);
      shouldReject = true;
      await expect(await fetchEarthquakes()).toEqual([]);
      await expect(network.calls).toHaveLength(2);
      await expect(errors.calls).toEqual([['Failed to fetch earthquake data:', unavailable]]);
      await expect(errors.calls[0][1]).toBe(unavailable);
    } finally { network.restore(); errors.restore(); }
  }
};

export const WeatherUnitsCacheAndDegradedRefresh: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const weather: WeatherRegionData[] = ['North America', 'Europe', 'South America', 'Asia'].map((region, index) => ({
      region, cities: [{ name: `Fictional City ${index}`, temp: 68, high: 86, low: 50, condition: (['sunny', 'cloudy', 'rainy', 'windy'] as const)[index] }]
    }));
    const originalNow = Date.now;
    const errors = recordingErrors();
    const unavailable = new Error('fictional weather endpoint unavailable');
    let mode: 'healthy' | 'http-error' | 'rejected' = 'healthy';
    const network = recordingFetch(async () => {
      if (mode === 'rejected') throw unavailable;
      return mode === 'http-error' ? new Response('', { status: 503 }) : Response.json(weather);
    });
    try {
      mounted.render(createWeatherSegment([]).render(0, 0));
      await expect(mounted.host).toHaveTextContent('Loading');
      let received: WeatherRegionData[] | undefined;
      await createWeatherSegment([], (items) => { received = items; }).prefetch!();
      await expect(received).toEqual(weather);
      await expect(network.calls).toEqual([{ url: 'https://api.monitor.gaulatti.com/broadcast/weather', init: undefined }]);
      await expect(await fetchWeatherData()).toBe(received);
      await expect(network.calls).toHaveLength(1);
      const segment = createWeatherSegment(received!);
      await expect(segment.itemCount).toBe(8);
      await expect(segment.durationMsPerItem).toBe(5000);
      mounted.render(segment.render(0, 25));
      await expect(mounted.host).toHaveTextContent('68°F');
      mounted.render(segment.render(1, 35));
      await waitFor(() => expect(mounted.host).toHaveTextContent('20°C'));
      await expect(mounted.host).toHaveTextContent('30°C');
      await expect(mounted.host).toHaveTextContent('10°C');
      for (let index = 1; index < weather.length; index++) {
        mounted.render(segment.render(index * 2, 50));
        await expect(mounted.host).toHaveTextContent(`Fictional City ${index}`);
      }
      await segment.prefetch!();
      await expect(network.calls).toHaveLength(1);
      // Advance only the data-cache observation clock. Failed refreshes do not
      // write a future timestamp, so restoration leaves no future cache behind.
      const expired = originalNow() + 2 * 60 * 60 * 1000;
      Date.now = () => expired;
      mode = 'http-error';
      await expect(await fetchWeatherData()).toBe(received);
      mode = 'rejected';
      await expect(await fetchWeatherData()).toBe(received);
      await expect(network.calls).toHaveLength(3);
      await expect(errors.calls).toEqual([['Failed to fetch weather data:', unavailable]]);
      await expect(errors.calls[0][1]).toBe(unavailable);
    } finally { Date.now = originalNow; network.restore(); errors.restore(); mounted.close(); }
  }
};

const image = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="2" height="2"%3E%3Crect width="2" height="2" fill="%23445566"/%3E%3C/svg%3E';

export const ArticlesFeedToVisibleSegment: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const now = Date.now();
    const article = (id: number, age: number, featured: boolean) => ({
      id, title: `Fictional headline ${id}`, excerpt: `Fictional summary ${id}`, slug: `fixture-${id}`,
      featured, featuredImage: { url: image }, categories: [{ name: 'Science', slug: 'science' }],
      publishedAt: new Date(now - age).toISOString()
    });
    const preferred = { ...article(1, 60 * 60 * 1000, true), url: '/science/authoritative-fixture' };
    const input = [article(2, 0, false), article(3, 24 * 60 * 60 * 1000, true), preferred,
      ...Array.from({ length: 9 }, (_, index) => article(index + 4, (index + 1) * 60000, false)),
      { ...article(99, 0, true), featuredImage: { url: '' } }];
    const network = recordingFetch(async () => Response.json({ articles: input }));
    try {
      let received: NewsItem[] | undefined;
      await createArticlesSegment([], (items) => { received = items; }, 'it').prefetch!();
      await expect(received).toHaveLength(10);
      await expect(received?.map((item) => item.id)).toEqual(['1', '2', '4', '5', '6', '7', '8', '9', '10', '11']);
      await expect(received?.[0]).toEqual({ id: '1', headline: 'Fictional headline 1', summary: 'Fictional summary 1', imageUrl: image, category: 'Science', url: 'https://fifthbell.com/science/authoritative-fixture' });
      await expect(received?.[1].url).toBe('https://fifthbell.com/it/science/fixture-2');
      await expect(network.calls[0].url).toMatch(/^https:\/\/cdn\.fifthbell\.com\/content\/homepage-current-it\.json\?_=/);
      await expect(network.calls[0].init).toEqual({ cache: 'no-store' });
      const segment = createArticlesSegment(received!);
      await expect(segment.itemCount).toBe(10);
      await expect(segment.durationMsPerItem).toBe(10000);
      mounted.render(segment.render(0, 40));
      await expect(within(mounted.host).getByRole('heading', { name: 'Fictional headline 1' })).toBeVisible();
      await expect(mounted.host).toHaveTextContent('Fictional summary 1');
      await expect(within(mounted.host).getByRole('img', { name: 'Article QR code' })).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'));
      mounted.render(segment.render(1, 60));
      await expect(within(mounted.host).getByRole('heading', { name: 'Fictional headline 2' })).toBeVisible();
      await segment.prefetch!();
      await expect(network.calls).toHaveLength(1);
    } finally { network.restore(); mounted.close(); }
  }
};

export const MarketsAndLiveEventsInPlaylist: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const mockStocks: MarketData[] = [
      { symbol: 'AAPL', name: 'Apple Inc.', price: 230.5, change: 2.5, changePercent: 1.1 },
      { symbol: 'TSLA', name: 'Tesla Inc.', price: 210.0, change: -4.0, changePercent: -1.87 },
    ];
    const network = recordingFetch(async () => Response.json(mockStocks));
    try {
      let received: MarketData[] | undefined;
      await createMarketsSegment([], (items) => { received = items; }, 'it').prefetch!();
      await expect(received).toHaveLength(2);
      const segment = createMarketsSegment(received!);
      mounted.render(segment.render(0, 50));
      await expect(mounted.host).toHaveTextContent('AAPL');
      await expect(mounted.host).toHaveTextContent('TSLA');

      // A failed colour read puts back the markets green.
      await expect(await backdropAfterImageLoads(mounted.host)).toContain('rgb(6, 95, 70)');

      // Live event segment
      const liveSegment = createLiveEventSegment({
        category: 'FOOTBALL',
        title: 'Championship Match',
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E',
        url: '/championship',
        updatedAt: new Date().toISOString(),
        updates: [{ timestamp: new Date().toISOString(), text: 'Kickoff!' }],
      }, undefined, 'en');
      mounted.render(liveSegment.render(0, 30));
      await expect(mounted.host).toHaveTextContent('Championship Match');
      // A failed colour read puts back the brand red.
      await expect(await backdropAfterImageLoads(mounted.host)).toContain('rgb(178, 17, 0)');

      // Earthquake segment image load (success and catch)
      const mockQuakes = [{
        id: 1,
        magnitude: 6.5,
        location: 'Test Place',
        depth: 10,
        time: '10m',
        timestamp: Date.now(),
        lat: 35.0,
        lng: -120.0,
        sources: ['USGS']
      }];
      const earthquakeSeg = createEarthquakeSegment(mockQuakes, undefined, 'en');
      mounted.render(earthquakeSeg.render(0, 50));
      await expect(mounted.host).toHaveTextContent('Test Place');
      // A failed colour read puts back the earthquake brown.
      await expect(await backdropAfterImageLoads(mounted.host)).toContain('rgb(124, 45, 18)');

      // Non-sports event with scrolling timeline (>4 updates)
      const scrollingEvent = {
        category: 'NEWS',
        title: 'Long Timeline Event',
        image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E',
        url: '/timeline',
        updatedAt: new Date().toISOString(),
        updates: [
          { text: 'Update 1' },
          { text: 'Update 2' },
          { text: 'Update 3' },
          { text: 'Update 4' },
          { text: 'Update 5' },
        ],
      };
      const scrollSeg = createLiveEventSegment(scrollingEvent, undefined, 'en');
      mounted.render(scrollSeg.render(0, 10));
      await delay(5100);

    } finally { network.restore(); mounted.close(); }
  }
};

export const WorldClocksAndCallsignSlide: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const fixedTime = new Date('2026-11-15T12:00:00Z');
    const origGetColor = FastAverageColor.prototype.getColor;
    try {
      // Test WorldClocks with rotation, wrap-around, and shuffle
      mounted.render(
        <WorldClocks
          currentTime={undefined}
          language='en'
          cities={[
            { city: 'New York', timezone: 'America/New_York' },
            { city: 'London', timezone: 'Europe/London' },
          ]}
          rotateIntervalMs={500}
          transitionDurationMs={50}
          shuffleCities={true}
        />
      );
      // Shuffled, the clock still only ever shows the configured cities.
      for (let tick = 0; tick < 2; tick += 1) {
        await delay(600);
        await expect(mounted.host.textContent).toMatch(/New York|London/);
      }

      // Test WorldClocks wrap-around with shuffleCities={false} and activeCities fallback
      mounted.render(
        <WorldClocks
          currentTime={undefined}
          language='en'
          cities={[
            { city: 'New York', timezone: 'America/New_York' },
            { city: 'London', timezone: 'Europe/London' },
          ]}
          rotateIntervalMs={500}
          transitionDurationMs={50}
          shuffleCities={false}
        />
      );
      // Unshuffled, the clock restarts at the first city, moves on, then wraps back to it.
      await waitFor(() => expect(mounted.host).toHaveTextContent('New York'), { timeout: 1500 });
      await waitFor(() => expect(mounted.host).toHaveTextContent('London'), { timeout: 1500 });
      await waitFor(() => expect(mounted.host).toHaveTextContent('New York'), { timeout: 1500 });

      mounted.render(
        <WorldClocks
          currentTime={undefined}
          language='en'
          cities={[{ city: 'Tokyo', timezone: 'Asia/Tokyo' }]}
          rotateIntervalMs={500}
          transitionDurationMs={50}
          shuffleCities={false}
        />
      );
      await waitFor(() => expect(mounted.host).toHaveTextContent('Tokyo'));

      // Test WorldClocks with time override
      mounted.render(
        <WorldClocks
          currentTime={fixedTime}
          language='en'
          rotateIntervalMs={500}
          transitionDurationMs={50}
          shuffleCities={false}
          timeOverride={{ startTime: '10:00', startedAt: '2026-11-15T12:00:00Z' }}
        />
      );
      // The clock takes the new currentTime in an effect, then shows the override.
      await waitFor(() => expect(mounted.host).toHaveTextContent('10:00'));

      // Test CallsignSlide and wait for transition timers to reveal showTime
      const audioRef = { current: null };
      mounted.render(<CallsignSlide currentTime={fixedTime} audioRef={audioRef} />);
      await delay(2600);
      const callsignText = within(mounted.host).getByText(/This is fifth/i).closest('div');
      await expect(callsignText?.style.opacity).toBe('1');

      // The backdrop takes the image's average colour, and keeps the brand red when that fails.
      const gradient = () => [...mounted.host.querySelectorAll<HTMLElement>('div')]
        .map((element) => element.style.background).find((value) => value.includes('linear-gradient')) ?? '';
      const loadImages = () => { for (const img of mounted.host.querySelectorAll('img')) img.dispatchEvent(new Event('load')); };
      FastAverageColor.prototype.getColor = function() {
        return { hex: '#123456' } as any;
      };
      loadImages();
      await waitFor(() => expect(gradient()).toContain('rgb(18, 52, 86)'));
      FastAverageColor.prototype.getColor = function() {
        throw new Error('fac test failure');
      };
      loadImages();
      await waitFor(() => expect(gradient()).toContain('rgb(178, 17, 0)'));

      // The weather slide keeps its blue backdrop when the colour cannot be read.
      const weatherSeg = createWeatherSegment([
        {
          region: 'North America',
          cities: [{ name: 'New York', temp: 68, condition: 'sunny', high: 72, low: 58 }],
        },
      ]);
      mounted.render(weatherSeg.render(0, 0));
      loadImages();
      await waitFor(() => expect(gradient()).toContain('rgb(30, 64, 175)'));
      await expect(mounted.host).toHaveTextContent('New York');
    } finally {
      FastAverageColor.prototype.getColor = origGetColor;
      mounted.close();
    }
  }
};

export const ArticlesSlideTransitions: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    const articles = [
      { id: '1', headline: 'Article One', summary: 'Summary 1', imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E', url: '/art1' },
      { id: '2', headline: 'Article Two', summary: 'Summary 2', imageUrl: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/%3E', url: '/art2' },
    ];
    try {
      const seg = createArticlesSegment(articles, undefined, 'en');
      mounted.render(<Playlist config={{ segments: [seg], updateIntervalMs: 50 }} />);
      await expect(mounted.host).toHaveTextContent('Article One');

      // A failed colour read keeps the colour already read; the slide stays up.
      await expect(await backdropAfterImageLoads(mounted.host)).toContain('rgb(18, 52, 86)');
      await expect(mounted.host).toHaveTextContent('Article One');

      click(mounted.host, 'Next');
      await delay(900);
      await expect(mounted.host).toHaveTextContent('Article Two');

      // Each item index is its own slide: rendering index 1 shows the second article at once.
      mounted.render(seg.render(1, 0));
      await expect(mounted.host).toHaveTextContent('Article Two');
      await expect(mounted.host).not.toHaveTextContent('Article One');
    } finally {
      mounted.close();
    }
  }
};

export const PlaylistEdgeCases: StoryObj = {
  play: async ({ canvasElement }) => {
    const mounted = mount(canvasElement);
    try {
      // Missing segment at index (empty array item) and durationMsPerItem: 0
      const segWithZeroDuration: Segment = {
        id: 'zero',
        label: 'Zero',
        itemCount: 1,
        durationMsPerItem: 0,
        render: () => <span>zero duration item</span>,
      };
      mounted.render(<Playlist config={{ segments: [segWithZeroDuration, undefined as any], defaultDurationMs: 200, updateIntervalMs: 20 }} />);
      await delay(100);
      click(mounted.host, 'Next');
      await delay(100);
    } finally { mounted.close(); }
  }
};
