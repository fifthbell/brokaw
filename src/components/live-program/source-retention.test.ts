// fifthbell/brokaw#35: the live program never waits on one source. A source that
// fails keeps its last good data on air for up to 30 minutes, then drops it.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearCachedEvents, fetchEventsRetained, type Event } from './events.js';
import { fetchArticles } from './segments/ArticlesSegment.js';
import { fetchEarthquakes } from './segments/EarthquakeSegment.js';
import { fetchLiveEvent } from './segments/fetchLiveEvents.js';
import { fetchMarketData } from './segments/MarketsSegment.js';
import { fetchWeatherData } from './segments/WeatherSegment.js';
import { loadProgramData, SOURCE_RETENTION_MS } from './program-data.js';

const START = new Date('2026-11-17T06:00:00.000Z');
const MINUTE = 60_000;

const event: Event = {
  id: 1, uuid: 'event-1', title: 'Fictional harbour story', summary: 'Fixture', status: 'open',
  created_at: '2026-11-17T05:00:00Z', updated_at: '2026-11-17T05:00:00Z', posts_count: 1,
  posts: [{ id: 1, uuid: 'post-1', content: 'c', source: 's', uri: 'https://fixture.invalid/p', hash: 'h', author: 'a', createdAt: '2026-11-17T05:00:00Z', relevance: 9, match_score: 1 }],
};

/** One fetch stub for every source; each source's status is set per test. */
function stubSources(
  status: Partial<Record<'events' | 'weather' | 'markets' | 'earthquakes' | 'homepage' | 'auburnale', number>> = {},
  auburnaleEvents: unknown[] = [],
  unreachablePaths: string[] = [],
) {
  const fetchMock = vi.fn(async (input: string | URL | Request) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (unreachablePaths.includes(url.pathname)) throw new TypeError('Failed to fetch');
    const fail = (key: keyof typeof status) => (status[key] ?? 200) >= 400 ? new Response('down', { status: status[key] }) : null;
    if (url.hostname === 'api.monitor.gaulatti.com') {
      if (url.pathname === '/events') return fail('events') ?? Response.json({ events: [event], total: 1 });
      if (url.pathname === '/broadcast/weather') return fail('weather') ?? Response.json([{ region: 'North America', cities: [{ name: 'New York', temp: 70, condition: 'sunny', high: 75, low: 60 }] }]);
      if (url.pathname === '/broadcast/markets') return fail('markets') ?? Response.json([{ symbol: 'FIX', name: 'Fixture', price: 1, change: 0, changePercent: 0 }]);
      if (url.pathname === '/earthquakes') return fail('earthquakes') ?? Response.json([{
        id: 7, magnitude: 5.2, depth: 10, latitude: 1, longitude: 2, timestamp: new Date(Date.now() - MINUTE).toISOString(),
        datapoints: [{ source: 'Fixture', additionalData: { place: 'Fictional Ridge' } }],
      }]);
    }
    if (url.hostname === 'cdn.fifthbell.com') {
      return fail('homepage') ?? Response.json({
        articles: [{ id: 5, title: 'Fictional homepage story', excerpt: 'Fixture', slug: 'story', featuredImage: { url: 'https://fixture.invalid/i.jpg' }, publishedAt: new Date().toISOString() }],
        breakingNews: { main: { title: 'Fictional live coverage', image: '', url: '/live' }, updates: [] },
      });
    }
    if (url.port === '3000' && url.pathname === '/events') {
      return fail('auburnale') ?? Response.json({ data: auburnaleEvents });
    }
    return new Response('unexpected', { status: 404 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(START);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  // The article feed preloads images through the browser's Image.
  vi.stubGlobal('Image', class { crossOrigin = ''; src = ''; });
  clearCachedEvents();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('program data sources', () => {
  it('keeps the program running when events return 500 at first load', async () => {
    stubSources({ events: 500 });
    const data = await loadProgramData('en');
    expect(data.events).toEqual([]);
    expect(data.weather[0].cities[0].name).toBe('New York');
    expect(console.warn).toHaveBeenCalledWith('[live-program] events unavailable', expect.any(Error));
  });

  it('keeps the last good events for 30 minutes after a failure, then drops them', async () => {
    expect(SOURCE_RETENTION_MS).toBe(30 * MINUTE);
    stubSources();
    expect((await fetchEventsRetained({ language: 'en' })).map((e) => e.uuid)).toEqual(['event-1']);
    stubSources({ events: 503 });
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE));
    expect((await fetchEventsRetained({ language: 'en' })).map((e) => e.uuid)).toEqual(['event-1']);
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE + 1));
    expect(await fetchEventsRetained({ language: 'en' })).toEqual([]);
    // Once dropped they do not come back while the service stays down.
    expect(await fetchEventsRetained({ language: 'en' })).toEqual([]);
  });

  it('brings events back on the next refresh after the service recovers', async () => {
    stubSources({ events: 500 });
    expect(await fetchEventsRetained({ language: 'en' })).toEqual([]);
    stubSources();
    expect((await fetchEventsRetained({ language: 'en' })).map((e) => e.uuid)).toEqual(['event-1']);
  });

  it.each(['weather', 'markets', 'earthquakes', 'homepage'] as const)('does not let %s failing alone block the other sources', async (source) => {
    stubSources({ [source]: 500 });
    const data = await loadProgramData('en');
    expect(data.events.map((e) => e.uuid)).toEqual(['event-1']);
    if (source !== 'weather') expect(data.weather).toHaveLength(1);
    if (source !== 'markets') expect(data.markets).toHaveLength(1);
  });

  it('drops stale weather and market data 30 minutes after their last good fetch', async () => {
    stubSources();
    expect(await fetchWeatherData()).toHaveLength(1);
    expect(await fetchMarketData()).toHaveLength(1);
    stubSources({ weather: 500, markets: 500 });
    // Markets refetch after their 15-minute cache; at 20 minutes the last good data stays.
    vi.setSystemTime(new Date(START.getTime() + 20 * MINUTE));
    expect(await fetchMarketData()).toHaveLength(1);
    // Past 30 minutes the failing markets drop.
    vi.setSystemTime(new Date(START.getTime() + 31 * MINUTE));
    expect(await fetchMarketData()).toEqual([]);
    // Weather is still inside its own one-hour cache, so it is not refetched yet.
    expect(await fetchWeatherData()).toHaveLength(1);
    // When it is refetched and fails, its last good data is over 30 minutes old and drops.
    vi.setSystemTime(new Date(START.getTime() + 61 * MINUTE));
    expect(await fetchWeatherData()).toEqual([]);
  });

  it('keeps the last good articles for 30 minutes, then shows the sample stories', async () => {
    stubSources();
    expect((await fetchArticles('es')).map((a) => a.headline)).toEqual(['Fictional homepage story']);
    stubSources({ homepage: 500 });
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE));
    expect((await fetchArticles('es')).map((a) => a.headline)).toEqual(['Fictional homepage story']);
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE + 1));
    const dropped = (await fetchArticles('es')).map((a) => a.headline);
    expect(dropped).not.toContain('Fictional homepage story');
    expect(dropped).toContain('Global Climate Summit Reaches Historic Agreement');
  });

  it('shows the sample stories when the feed has never answered', async () => {
    stubSources({ homepage: 500 });
    expect((await fetchArticles('it')).map((a) => a.headline)).toContain('Global Climate Summit Reaches Historic Agreement');
  });

  it('keeps the last good earthquakes for 30 minutes, then drops them', async () => {
    stubSources();
    expect((await fetchEarthquakes('es')).map((q) => q.location)).toEqual(['Fictional Ridge']);
    stubSources({ earthquakes: 503 });
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE));
    expect((await fetchEarthquakes('es')).map((q) => q.location)).toEqual(['Fictional Ridge']);
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE + 1));
    expect(await fetchEarthquakes('es')).toEqual([]);
  });

  it('keeps the last live event for 30 minutes when both of its sources fail, then drops it', async () => {
    stubSources();
    expect((await fetchLiveEvent('es'))?.title).toBe('Fictional live coverage');
    stubSources({ homepage: 500, auburnale: 500 });
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE));
    expect((await fetchLiveEvent('es'))?.title).toBe('Fictional live coverage');
    expect(console.warn).toHaveBeenCalledWith('[live-program] live event unavailable');
    vi.setSystemTime(new Date(START.getTime() + 30 * MINUTE + 1));
    expect(await fetchLiveEvent('es')).toBeNull();
  });

  it('shows no live event at once when a source answers that there is none', async () => {
    stubSources();
    expect((await fetchLiveEvent('it'))?.title).toBe('Fictional live coverage');
    // The feed fails, but Auburnale answers with no live event: that answer is shown, not the old one.
    stubSources({ homepage: 500 });
    expect(await fetchLiveEvent('it')).toBeNull();
  });

  it('keeps the last good markets when the request itself fails', async () => {
    stubSources();
    vi.setSystemTime(new Date(START.getTime() + 2 * 60 * MINUTE));
    expect(await fetchMarketData()).toHaveLength(1);
    stubSources({}, [], ['/broadcast/markets']);
    vi.setSystemTime(new Date(START.getTime() + 2 * 60 * MINUTE + 16 * MINUTE));
    expect(await fetchMarketData()).toHaveLength(1);
    expect(console.error).toHaveBeenCalledWith('[MarketsSegment] Failed to fetch market data:', expect.any(TypeError));
  });

  it('takes the live event from Auburnale when the homepage feed fails', async () => {
    stubSources({ homepage: 500 }, [{
      title: 'Fictional match', slug: 'fictional-match', sofascore_id: 42, eventDate: '2026-11-17T05:30:00Z',
      categories: [{ name: 'FOOTBALL' }], featuredImage: { url: 'https://fixture.invalid/m.jpg', alt: 'Match' }, updates: [],
    }]);
    expect(await fetchLiveEvent('en')).toMatchObject({ title: 'Fictional match', category: 'FOOTBALL', url: '/fictional-match', sofascore_id: 42 });
  });
});
