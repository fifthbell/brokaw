import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchLiveEvent } from './fetchLiveEvents.js';

describe('fetchLiveEvents', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('successfully fetches and normalizes live event data from CDN', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      updatedAt: '2026-11-15T01:00:00Z',
      breakingNews: {
        main: {
          category: 'FOOTBALL',
          title: 'Cup Final Live',
          excerpt: 'Live coverage from the stadium',
          image: 'https://cdn.example.com/cup.jpg',
          alt: 'Cup trophy',
          url: '/football/cup-final',
          liveUrl: 'https://live.example.com/cup',
          sofascore_id: 12345,
        },
        updates: [{ timestamp: '12:00', text: 'Kickoff!' }],
      },
    }), { status: 200 }));

    const data = await fetchLiveEvent('en');
    expect(data).toEqual({
      category: 'FOOTBALL',
      title: 'Cup Final Live',
      excerpt: 'Live coverage from the stadium',
      image: 'https://cdn.example.com/cup.jpg',
      alt: 'Cup trophy',
      url: '/football/cup-final',
      liveUrl: 'https://live.example.com/cup',
      sofascore_id: 12345,
      updatedAt: '2026-11-15T01:00:00Z',
      updates: [{ timestamp: '12:00', text: 'Kickoff!' }],
    });
  });

  it('uses fallbacks when CDN breaking news contains partial fields', async () => {
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      breakingNews: {
        main: {
          title: 'Minimal Event',
        },
      },
    }), { status: 200 }));

    const data = await fetchLiveEvent('es');
    expect(data).toMatchObject({
      category: 'LIVE',
      title: 'Minimal Event',
      image: '',
      alt: 'Minimal Event',
      url: '/',
      updates: [],
    });
    expect(data?.updatedAt).toBeDefined();
  });

  it('falls back to Auburnale when CDN response is not ok', async () => {
    // CDN failure
    fetchMock.mockResolvedValueOnce(new Response('Not found', { status: 404 }));
    // Auburnale success
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      data: [{
        id: 'aub-1',
        title: 'Auburnale Derby',
        slug: 'auburnale-derby',
        sofascore_id: 54321,
        featuredImage: { url: 'https://img.test/derby.png', alt: 'Derby' },
        categories: [{ name: 'SPORTS' }],
        eventDate: '2026-11-15T02:00:00Z',
        updates: [
          {
            timestamp: '01:05',
            content: JSON.stringify({
              root: { children: [{ children: [{ text: 'Lexical update text' }] }] },
            }),
          },
          {
            timestamp: '01:10',
            content: {
              root: { children: [{ children: [{ text: 'Object update text' }] }] },
            },
          },
          {
            timestamp: '01:15',
            content: 'invalid-json-content',
          },
          {
            timestamp: '01:18',
            content: '',
          },
          {
            timestamp: '01:20',
            content: JSON.stringify({ root: { children: [] } }),
          },
        ],
      }],
    }), { status: 200 }));

    const data = await fetchLiveEvent('it');
    expect(data).toEqual({
      category: 'SPORTS',
      title: 'Auburnale Derby',
      excerpt: '',
      image: 'https://img.test/derby.png',
      alt: 'Derby',
      url: '/auburnale-derby',
      sofascore_id: 54321,
      updatedAt: '2026-11-15T02:00:00Z',
      updates: [
        { timestamp: '01:05', text: 'Lexical update text' },
        { timestamp: '01:10', text: 'Object update text' },
        { timestamp: '01:15', text: 'invalid-json-content' },
        { timestamp: '01:18', text: 'Update available' },
        { timestamp: '01:20', text: 'Update available' },
      ],
    });
  });

  it('falls back to Auburnale when CDN main event or title is missing', async () => {
    // CDN response with no breaking news
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    // Auburnale with window object and minimal event
    const origWindow = (globalThis as any).window;
    (globalThis as any).window = { location: { hostname: 'brokaw.local' } };

    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      data: [{
        id: 'aub-2',
        title: 'Auburnale Minimal',
        slug: 'auburnale-min',
        sofascore_id: 999,
      }],
    }), { status: 200 }));

    try {
      const data = await fetchLiveEvent('en');
      expect(data).toMatchObject({
        category: 'EVENT',
        title: 'Auburnale Minimal',
        image: '',
        alt: 'Auburnale Minimal',
        url: '/auburnale-min',
        sofascore_id: 999,
        updates: [],
      });
    } finally {
      if (origWindow === undefined) {
        delete (globalThis as any).window;
      } else {
        (globalThis as any).window = origWindow;
      }
    }
  });

  it('handles Auburnale empty data, missing event, and network failures', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    // CDN throws
    fetchMock.mockRejectedValueOnce(new Error('CDN offline'));
    // Auburnale returns 500
    fetchMock.mockResolvedValueOnce(new Response('Error', { status: 500 }));

    const res1 = await fetchLiveEvent('en');
    expect(res1).toBeNull();

    // CDN missing title
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ breakingNews: { main: {} } }), { status: 200 }));
    // Auburnale returns data without sofascore_id
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({
      data: [{ id: 'aub-3', title: 'No Sofascore', slug: 'no-sofascore' }],
    }), { status: 200 }));

    const res2 = await fetchLiveEvent('en');
    expect(res2).toBeNull();

    // Auburnale returns body without data array
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ breakingNews: { main: {} } }), { status: 200 }));
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));
    const resNoData = await fetchLiveEvent('en');
    expect(resNoData).toBeNull();

    // CDN throws, Auburnale throws
    fetchMock.mockRejectedValueOnce(new Error('CDN fail'));
    fetchMock.mockRejectedValueOnce(new Error('Auburnale fail'));

    const res3 = await fetchLiveEvent('en');
    expect(res3).toBeNull();

    errSpy.mockRestore();
  });
});
