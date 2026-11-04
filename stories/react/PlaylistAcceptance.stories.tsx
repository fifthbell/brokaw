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
