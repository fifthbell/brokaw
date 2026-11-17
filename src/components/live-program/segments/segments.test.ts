import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  fetchMarketData,
  getLastUpdateTime,
  createMarketsSegment,
  type MarketData,
} from './MarketsSegment.js';
import {
  fetchEarthquakes,
  createEarthquakeSegment,
  type EarthquakeData,
} from './EarthquakeSegment.js';
import {
  fetchWeatherData,
  createWeatherSegment,
  type WeatherRegionData,
} from './WeatherSegment.js';
import {
  fetchArticles,
  createArticlesSegment,
} from './ArticlesSegment.js';
import { createLiveEventSegment } from './LiveEventSegment.js';

describe('segments suite', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    if (typeof (globalThis as any).Image === 'undefined') {
      (globalThis as any).Image = class {
        crossOrigin = '';
        src = '';
      };
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('MarketsSegment', () => {
    it('fetches, caches, and falls back for market data', async () => {
      // Initial getLastUpdateTime when marketCache is undefined
      expect(getLastUpdateTime()).toBe('--:--');

      // Initial fetch failures when marketCache is undefined
      const initialErrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
      expect(await fetchMarketData()).toEqual([]);

      fetchMock.mockRejectedValueOnce(new Error('initial fail'));
      expect(await fetchMarketData()).toEqual([]);
      initialErrSpy.mockRestore();
      fetchMock.mockClear();

      const mockStocks: MarketData[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 230.5, change: 2.5, changePercent: 1.1 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 210.0, change: -4.0, changePercent: -1.87 },
      ];

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockStocks), { status: 200 }));
      const data1 = await fetchMarketData();
      expect(data1).toEqual(mockStocks);
      expect(getLastUpdateTime()).not.toBe('--:--');

      // Second fetch within cache window returns cached data
      const data2 = await fetchMarketData();
      expect(data2).toBe(data1);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Cache duration expiration / network error fallback
      const origNow = Date.now;
      try {
        Date.now = () => origNow() + 16 * 60 * 1000;
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchMock.mockRejectedValueOnce(new Error('Network failure'));
        const data3 = await fetchMarketData();
        expect(data3).toEqual(mockStocks);

        // An HTTP error 32 minutes after the last good fetch: past the
        // 30-minute retention (fifthbell/brokaw#35), the markets drop.
        Date.now = () => origNow() + 32 * 60 * 1000;
        fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
        const data4 = await fetchMarketData();
        expect(data4).toEqual([]);
        errSpy.mockRestore();
      } finally {
        Date.now = origNow;
      }
    });

    it('renders market segment slide and runs prefetch', async () => {
      const mockStocks: MarketData[] = [
        { symbol: 'AAPL', name: 'Apple Inc.', price: 230.5, change: 2.5, changePercent: 1.1 },
        { symbol: 'TSLA', name: 'Tesla Inc.', price: 210.0, change: -4.0, changePercent: -1.87 },
      ];

      const onUpdate = vi.fn();
      const segment = createMarketsSegment(mockStocks, onUpdate, 'en');
      expect(segment.id).toBe('markets');
      expect(segment.itemCount).toBe(1);

      // Render slide with data
      const rendered = segment.render(0, 50);
      expect(React.isValidElement(rendered)).toBe(true);
      const html = renderToStaticMarkup(rendered);
      expect(html).toContain('AAPL');
      expect(html).toContain('TSLA');

      // Render slide with empty data (loading view)
      const emptySegment = createMarketsSegment([], undefined, 'es');
      const renderedEmpty = emptySegment.render(0, 0);
      expect(React.isValidElement(renderedEmpty)).toBe(true);
      const emptyHtml = renderToStaticMarkup(renderedEmpty);
      expect(emptyHtml).toContain('Cargando datos del mercado...');
      expect(emptyHtml).not.toContain('AAPL');

      // Prefetch with onDataUpdate
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockStocks), { status: 200 }));
      await segment.prefetch?.();
      expect(onUpdate).toHaveBeenCalledWith(mockStocks);

      // Prefetch without onDataUpdate
      await emptySegment.prefetch?.();
    });
  });

  describe('EarthquakeSegment', () => {
    it('fetches, parses, and filters earthquakes with detailed places and fallbacks', async () => {
      const now = Date.now();
      const mockApiQuakes = [
        {
          id: 1,
          magnitude: 6.8,
          depth: 12.4,
          timestamp: new Date(now - 30 * 60 * 1000).toISOString(), // 30 mins ago
          latitude: 35.12,
          longitude: -120.45,
          datapoints: [
            { source: 'USGS', additionalData: { place: 'Southern California' } },
          ],
        },
        {
          id: 2,
          magnitude: 7.2,
          depth: 25.1,
          timestamp: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          latitude: 40.5,
          longitude: 14.2,
          datapoints: [
            { source: 'INGV', additionalData: { localPlace: 'Napoli, Italy' } },
          ],
        },
        {
          id: 3,
          magnitude: 5.1,
          depth: 5.0,
          timestamp: new Date(now - 25 * 60 * 60 * 1000).toISOString(), // 25 hours ago -> filtered out
          latitude: 10.0,
          longitude: 20.0,
          datapoints: [{ source: 'USGS' }],
        },
        {
          id: 4,
          magnitude: 3.2, // Below 4.5 -> filtered out
          depth: 10.0,
          timestamp: new Date(now - 10 * 60 * 1000).toISOString(),
          latitude: 0.0,
          longitude: 0.0,
          datapoints: [],
        },
        {
          id: 5,
          magnitude: 4.8,
          depth: 8.0,
          timestamp: new Date(now - 24 * 60 * 60 * 1000 + 60000).toISOString(), // ~23.9 hrs ago -> 23 hours ago
          latitude: 50.12,
          longitude: 10.34,
          datapoints: [{ source: 'EMSC' }], // No place -> falls back to lat/lng
        },
        {
          id: 6,
          magnitude: 5.5,
          depth: 15.0,
          timestamp: new Date(now - 60 * 1000).toISOString(), // 1 min ago
          latitude: 12.0,
          longitude: 15.0,
          datapoints: [{ source: 'USGS' }],
        },
        {
          id: 7,
          magnitude: 5.0,
          depth: 10.0,
          timestamp: new Date(now - 60 * 60 * 1000).toISOString(), // 1 hour ago
          latitude: 22.0,
          longitude: 25.0,
          datapoints: [{ source: 'USGS' }],
        },
        {
          id: 8,
          magnitude: 4.9,
          depth: 9.0,
          timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          latitude: 32.0,
          longitude: 35.0,
          datapoints: [{ source: 'USGS' }],
        },
      ];

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockApiQuakes), { status: 200 }));
      const quakes = await fetchEarthquakes('en');
      expect(quakes.length).toBeGreaterThan(0);
      expect(quakes.find((q) => q.id === 1)?.location).toBe('Southern California');
      expect(quakes.find((q) => q.id === 2)?.location).toBe('Napoli, Italy');
      expect(quakes.find((q) => q.id === 5)?.location).toBe('50.12°, 10.34°');

      // Test formatTimeAgo with multiple days ago by shifting Date.now after filtering
      let count = 0;
      const realNow = Date.now;
      const dateSpy = vi.spyOn(Date, 'now').mockImplementation(() => {
        count++;
        if (count > 2) return realNow() + 4 * 24 * 60 * 60 * 1000;
        return realNow();
      });
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([mockApiQuakes[0]]), { status: 200 }));
      const quakesDaysAgo = await fetchEarthquakes('en');
      expect(quakesDaysAgo[0].time).toContain('days ago');
      dateSpy.mockRestore();

      // An HTTP error or a network error keeps the last good list while it is
      // at most 30 minutes old, then drops it (fifthbell/brokaw#35).
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
      expect(await fetchEarthquakes('en')).toEqual(quakesDaysAgo);
      // The last good list was stored on the shifted clock above (4 days on); a day after that it is long past 30 minutes.
      const later = Date.now() + 5 * 24 * 60 * 60 * 1000;
      const laterSpy = vi.spyOn(Date, 'now').mockReturnValue(later);
      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      expect(await fetchEarthquakes('en')).toEqual([]);
      laterSpy.mockRestore();
      errSpy.mockRestore();
    });

    it('renders earthquake segment slide and prefetch', async () => {
      const mockQuakes: EarthquakeData[] = [
        {
          id: 1,
          magnitude: 7.5,
          location: 'Test Location',
          depth: 10,
          time: 'Just now',
          timestamp: Date.now(),
          lat: 10,
          lng: 20,
          sources: ['USGS'],
        },
      ];

      const onUpdate = vi.fn();
      const segment = createEarthquakeSegment(mockQuakes, onUpdate, 'en');
      expect(segment.id).toBe('earthquakes');
      expect(segment.itemCount).toBe(1);

      const rendered = segment.render(0, 20);
      expect(React.isValidElement(rendered)).toBe(true);
      expect(renderToStaticMarkup(rendered)).toContain('Test Location');

      // A magnitude 7.5 quake takes the red #dc2626 (220, 38, 38) scale.
      expect(renderToStaticMarkup(rendered)).toContain('220, 38, 38');

      // Without data the segment shows its loading slide, not an empty list.
      const emptySegment = createEarthquakeSegment([], undefined, 'es');
      expect(renderToStaticMarkup(emptySegment.render(0, 0))).toContain('Cargando datos de terremotos...');

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify([]), { status: 200 }));
      await segment.prefetch?.();
      expect(onUpdate).toHaveBeenCalled();

      await emptySegment.prefetch?.();
    });
  });

  describe('WeatherSegment', () => {
    it('fetches, caches, and handles weather errors', async () => {
      // Initial fetch failures when weatherCache is undefined
      const initWeatherErr = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
      expect(await fetchWeatherData()).toEqual([]);

      fetchMock.mockRejectedValueOnce(new Error('initial weather fail'));
      expect(await fetchWeatherData()).toEqual([]);
      initWeatherErr.mockRestore();

      const mockWeather: WeatherRegionData[] = [
        {
          region: 'North America',
          cities: [
            { name: 'New York', temp: 68, condition: 'sunny', high: 72, low: 58 },
            { name: 'Seattle', temp: 55, condition: 'rainy', high: 60, low: 50 },
            { name: 'Chicago', temp: 62, condition: 'windy', high: 65, low: 52 },
            { name: 'Denver', temp: 60, condition: 'cloudy', high: 64, low: 48 },
          ],
        },
        {
          region: 'Europe',
          cities: [{ name: 'Berlin', temp: 58, condition: 'sunny', high: 62, low: 50 }],
        },
        {
          region: 'South America',
          cities: [{ name: 'Santiago', temp: 72, condition: 'sunny', high: 78, low: 60 }],
        },
        {
          region: 'Asia',
          cities: [{ name: 'Tokyo', temp: 65, condition: 'sunny', high: 70, low: 55 }],
        },
        {
          region: 'Unknown Region',
          cities: [{ name: 'Nowhere', temp: 50, condition: 'cloudy', high: 55, low: 45 }],
        },
      ];

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockWeather), { status: 200 }));
      const data1 = await fetchWeatherData();
      expect(data1).toEqual(mockWeather);

      // Cached within 60 mins
      const data2 = await fetchWeatherData();
      expect(data2).toBe(data1);

      // HTTP error and exception
      const origNow = Date.now;
      try {
        // Weather refetches only after its one-hour cache, so a failed refetch
        // finds its data past the 30-minute retention and drops it (fifthbell/brokaw#35).
        Date.now = () => origNow() + 65 * 60 * 1000;
        fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
        expect(await fetchWeatherData()).toEqual([]);

        Date.now = () => origNow() + 130 * 60 * 1000;
        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        fetchMock.mockRejectedValueOnce(new Error('Network fail'));
        expect(await fetchWeatherData()).toEqual([]);
        errSpy.mockRestore();
      } finally {
        Date.now = origNow;
      }
    });

    it('renders weather slides across regions and units', async () => {
      const mockWeather: WeatherRegionData[] = [
        {
          region: 'North America',
          cities: [
            { name: 'New York', temp: 68, condition: 'sunny', high: 72, low: 58 },
            { name: 'Seattle', temp: 55, condition: 'rainy', high: 60, low: 50 },
            { name: 'Chicago', temp: 62, condition: 'windy', high: 65, low: 52 },
            { name: 'Denver', temp: 60, condition: 'cloudy', high: 64, low: 48 },
          ],
        },
        {
          region: 'Unknown Region',
          cities: [{ name: 'Unknown City', temp: 50, condition: 'cloudy', high: 55, low: 45 }],
        },
      ];

      const onUpdate = vi.fn();
      const segmentFahrenheit = createWeatherSegment(mockWeather, onUpdate, 'en');
      expect(segmentFahrenheit.id).toBe('weather');
      expect(segmentFahrenheit.itemCount).toBe(4);

      const slide0 = segmentFahrenheit.render(0, 10);
      expect(React.isValidElement(slide0)).toBe(true);
      expect(renderToStaticMarkup(slide0)).toContain('New York');

      const slide1 = segmentFahrenheit.render(1, 10);
      expect(React.isValidElement(slide1)).toBe(true);
      expect(renderToStaticMarkup(slide1)).toContain('Seattle');

      const slide2 = segmentFahrenheit.render(2, 10);
      expect(React.isValidElement(slide2)).toBe(true);
      expect(renderToStaticMarkup(slide2)).toContain('Unknown City');

      const emptyWeatherSegment = createWeatherSegment([], undefined, 'es');
      expect(emptyWeatherSegment.itemCount).toBe(8);
      expect(renderToStaticMarkup(emptyWeatherSegment.render(0, 0))).toContain('Cargando datos del clima...');

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(mockWeather), { status: 200 }));
      await segmentFahrenheit.prefetch?.();
      expect(onUpdate).toHaveBeenCalled();

      await emptyWeatherSegment.prefetch?.();
    });
  });

  describe('ArticlesSegment', () => {
    it('fetches, filters, and formats news articles with path building', async () => {
      const now = new Date();
      const mockArticles = [
        {
          id: 101,
          title: 'Recent Featured Article',
          excerpt: 'Excerpt 1',
          slug: 'recent-featured',
          url: '/custom/path/article',
          featured: true,
          featuredImage: { url: 'https://img.test/art1.jpg' },
          categories: [{ name: 'News', slug: 'news' }],
          publishedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 102,
          title: 'Older Article with Category',
          excerpt: 'Excerpt 2',
          slug: '/older-article',
          featured: false,
          featuredImage: { url: 'https://img.test/art2.jpg' },
          categories: [{ name: 'Tech', slug: 'tech' }],
          publishedAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 103,
          title: 'Article without Category or Slug',
          excerpt: 'Excerpt 3',
          slug: '',
          canonicalUrl: '/canonical/fallback',
          featured: false,
          featuredImage: { url: 'https://img.test/art3.jpg' },
          categories: [],
          publishedAt: new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 104,
          title: 'Article without Image',
          excerpt: 'Excerpt 4',
          slug: 'no-image',
          featured: false,
          categories: [],
          publishedAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: 105,
          title: 'Article with whitespace url and no slug',
          excerpt: 'Excerpt 5',
          url: '   ',
          slug: undefined,
          canonicalUrl: undefined,
          featured: false,
          featuredImage: { url: 'https://img.test/art5.jpg' },
          categories: undefined,
          publishedAt: new Date(now.getTime() - 96 * 60 * 60 * 1000).toISOString(),
        },
      ];

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ articles: mockArticles }), { status: 200 }));
      const articlesEn = await fetchArticles('en');
      expect(articlesEn.length).toBe(4);
      expect(articlesEn[0].url).toBe('https://fifthbell.com/custom/path/article');
      expect(articlesEn[1].url).toBe('https://fifthbell.com/tech/older-article');
      expect(articlesEn.some((a) => a.url === 'https://fifthbell.com/')).toBe(true);

      // Localized language path formatting
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ articles: [mockArticles[1]] }), { status: 200 }));
      const articlesEs = await fetchArticles('es');
      expect(articlesEs[0].url).toBe('https://fifthbell.com/es/tech/older-article');

      // Fallback to MOCK_ARTICLES when articles array is missing or empty
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
      const mockResult = await fetchArticles('en');
      expect(mockResult.length).toBeGreaterThan(0);

      // Fallback to MOCK_ARTICLES on HTTP failure and network error
      const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));
      expect((await fetchArticles('en')).length).toBeGreaterThan(0);

      fetchMock.mockRejectedValueOnce(new Error('Network error'));
      expect((await fetchArticles('en')).length).toBeGreaterThan(0);
      errSpy.mockRestore();
    });

    it('normalizes an explicit article url into one clean site path', async () => {
      const base = {
        excerpt: 'Excerpt', featured: false, featuredImage: { url: 'https://img.test/a.jpg' },
        categories: [{ name: 'News', slug: 'news' }], publishedAt: new Date().toISOString(),
      };
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ articles: [
        { ...base, id: 201, title: 'Query only', url: '?ref=feed' },
        { ...base, id: 202, title: 'Repeated slashes', url: '//world///news/' },
      ] }), { status: 200 }));
      const urls = (await fetchArticles('en')).map((article) => article.url);
      expect(urls).toEqual(expect.arrayContaining(['https://fifthbell.com/', 'https://fifthbell.com/world/news']));
    });

    it('renders articles segment slides and prefetch', async () => {
      const items = [
        {
          id: '1',
          headline: 'Headline 1',
          summary: 'Summary 1',
          imageUrl: 'https://img.test/1.jpg',
          category: 'World',
          url: 'https://fifthbell.com/world/1',
        },
      ];

      const onUpdate = vi.fn();
      const segment = createArticlesSegment(items, onUpdate, 'en');
      expect(segment.id).toBe('articles');
      expect(segment.itemCount).toBe(1);

      const slide = segment.render(0, 15);
      expect(React.isValidElement(slide)).toBe(true);
      expect(renderToStaticMarkup(slide)).toContain('Headline 1');

      const emptySegment = createArticlesSegment([], undefined, 'es');
      expect(emptySegment.itemCount).toBe(5);
      // Without articles the segment shows its built-in sample stories.
      expect(renderToStaticMarkup(emptySegment.render(0, 0))).toContain('Global Climate Summit Reaches Historic Agreement');

      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ articles: [] }), { status: 200 }));
      await segment.prefetch?.();
      expect(onUpdate).toHaveBeenCalled();

      await emptySegment.prefetch?.();
    });
  });

  describe('LiveEventSegment', () => {
    it('creates and renders live event segment with and without event data', async () => {
      const eventData = {
        category: 'FOOTBALL',
        title: 'Final',
        image: 'https://img.test/cup.jpg',
        url: '/final',
        updatedAt: '2026-11-15T00:00:00Z',
        updates: [],
      };

      const onUpdate = vi.fn();
      const segmentWithEvent = createLiveEventSegment(eventData, onUpdate, 'en');
      expect(segmentWithEvent.id).toBe('live-event');
      expect(segmentWithEvent.itemCount).toBe(1);

      const renderedEvent = segmentWithEvent.render(0, 40);
      expect(React.isValidElement(renderedEvent)).toBe(true);
      expect(renderToStaticMarkup(renderedEvent)).toContain('Final');

      const segmentWithoutEvent = createLiveEventSegment(null, undefined, 'it');
      expect(segmentWithoutEvent.itemCount).toBe(0);

      const renderedFallback = segmentWithoutEvent.render(0, 0);
      expect(renderToStaticMarkup(renderedFallback)).toContain('Nessun evento in diretta');

      // Prefetch with onDataUpdate
      fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
        breakingNews: { main: { title: 'Updated Final' } },
      }), { status: 200 }));
      await segmentWithEvent.prefetch?.();
      expect(onUpdate).toHaveBeenCalled();

      // Prefetch without onDataUpdate returns immediately
      await segmentWithoutEvent.prefetch?.();
    });
  });
});
