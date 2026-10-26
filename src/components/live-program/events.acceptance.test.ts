import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  clearCachedEvents,
  fetchEvents,
  getCachedEvents,
  getLastFetchTime,
  hasEventChanges,
  type Event as ProgramEvent,
  type EventPost,
} from './events.js';

type LanguageMetadata = { language?: string; lang?: string; locale?: string };

function post(id: number, overrides: Partial<EventPost> & LanguageMetadata = {}): EventPost & LanguageMetadata {
  return {
    id,
    uuid: `20000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    content: `Confirmed report ${id}`,
    source: 'rss',
    uri: `https://news.example.test/reports/${id}`,
    hash: 'a'.repeat(64),
    author: 'News desk',
    createdAt: '2026-10-01T09:00:00.000Z',
    relevance: 5,
    match_score: 0.9,
    ...overrides,
  };
}

function event(id: number, overrides: Partial<ProgramEvent> & LanguageMetadata = {}): ProgramEvent & LanguageMetadata {
  return {
    id,
    uuid: `10000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    title: `Developing event ${id}`,
    summary: `Confirmed summary ${id}`,
    status: 'open',
    created_at: '2026-10-01T09:00:00.000Z',
    updated_at: '2026-10-01T09:00:00.000Z',
    posts_count: 1,
    posts: [post(id)],
    ...overrides,
  };
}

function response(events: ProgramEvent[]): Response {
  return new Response(JSON.stringify({ events, total: events.length }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fetchMock = vi.fn<typeof fetch>();
const initialTime = new Date('2026-10-25T10:00:00.000Z');

beforeEach(() => {
  clearCachedEvents();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.useFakeTimers();
  vi.setSystemTime(initialTime);
});

afterEach(() => {
  clearCachedEvents();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('language-aware event requests', () => {
  it('requests the declared endpoint without a language when no preference is supplied', async () => {
    const records = [event(1), event(2)];
    fetchMock.mockResolvedValueOnce(response(records));

    expect(getCachedEvents()).toBeNull();
    expect(getLastFetchTime()).toBeNull();
    const result = await fetchEvents();

    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('https://api.monitor.gaulatti.com/events');
    expect(result).toEqual(records);
    expect(getCachedEvents()).toBe(result);
    expect(getLastFetchTime()).toEqual(initialTime);
  });

  it.each([
    { metadata: { language: ' ES-cl ' }, allowed: 'es' as const },
    { metadata: { lang: 'IT-it' }, allowed: 'it' as const },
    { metadata: { locale: 'en-GB' }, allowed: 'en' as const },
  ])('normalizes declared event metadata $metadata to the allowed language', async ({ metadata, allowed }) => {
    const selected = event(1, metadata);
    const other = event(2, { language: allowed === 'en' ? 'es' : 'en' });
    fetchMock.mockResolvedValueOnce(response([selected, other]));

    const result = await fetchEvents({ language: allowed, allowedLanguages: [allowed] });

    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get('language')).toBe(allowed);
    expect(result).toEqual([selected]);
    expect(getCachedEvents()).toEqual([selected]);
  });

  it.each([
    { language: 'en-US' },
    { lang: 'EN-gb' },
    { locale: 'en-CA' },
  ])('uses supported post metadata %j when the event has none', async (metadata) => {
    const selected = event(1, { posts: [post(10), post(11, metadata)], posts_count: 2 });
    const other = event(2, { posts: [post(20, { language: 'it' })] });
    const legacy = event(3); // The declared Event interface permits no language metadata.
    fetchMock.mockResolvedValueOnce(response([selected, other, legacy]));

    expect(await fetchEvents({ allowedLanguages: ['en'] })).toEqual([selected, legacy]);
  });

  it('prefers explicit event metadata over conflicting posts and later metadata aliases', async () => {
    const english = event(1, {
      language: 'en', lang: 'es', locale: 'it', posts: [post(1, { language: 'it' })],
    });
    const spanish = event(2, { lang: 'es', locale: 'en', posts: [post(2, { language: 'en' })] });
    const italian = event(3, { locale: 'it', posts: [post(3, { language: 'en' })] });
    fetchMock.mockResolvedValueOnce(response([english, spanish, italian]));

    expect(await fetchEvents({ allowedLanguages: ['en'] })).toEqual([english]);
  });

  it('treats an explicitly empty allowed-language list as unrestricted', async () => {
    const records = [event(1, { language: 'es' }), event(2, { language: 'it' })];
    fetchMock.mockResolvedValueOnce(response(records));

    expect(await fetchEvents({ language: 'en', allowedLanguages: [] })).toEqual(records);
  });
});

describe('cache identity and successful refresh', () => {
  it('keeps language/filter caches separate and normalizes duplicate filter ordering', async () => {
    const english = event(1, { title: 'English initial', language: 'en' });
    const spanish = event(1, { title: 'Spanish initial', language: 'es' });
    const englishUpdate = event(1, {
      title: 'English updated', language: 'en', posts_count: 2,
      posts: [post(1, { relevance: 4 }), post(2, { relevance: 8 })],
    });
    fetchMock
      .mockResolvedValueOnce(response([english]))
      .mockResolvedValueOnce(response([spanish]))
      .mockResolvedValueOnce(response([englishUpdate]));

    await fetchEvents({ language: 'en', allowedLanguages: ['it', 'en', 'it'] });
    await fetchEvents({ language: 'es', allowedLanguages: ['es'] });
    expect(getCachedEvents()).toEqual([spanish]);

    vi.setSystemTime(new Date('2026-10-25T10:02:00.000Z'));
    const refreshed = await fetchEvents({ language: 'en', allowedLanguages: ['en', 'it'] });
    expect(refreshed).toEqual([
      { ...englishUpdate, posts: [englishUpdate.posts[1], englishUpdate.posts[0]] },
    ]);
    expect(getCachedEvents()).toBe(refreshed);
    expect(getLastFetchTime()?.toISOString()).toBe('2026-10-25T10:02:00.000Z');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('accepts an empty successful response and subsequently populates that cache', async () => {
    fetchMock.mockResolvedValueOnce(response([])).mockResolvedValueOnce(response([event(1)]));

    expect(await fetchEvents({ language: 'it' })).toEqual([]);
    expect(getCachedEvents()).toEqual([]);
    expect(getLastFetchTime()).toEqual(initialTime);
    expect(await fetchEvents({ language: 'it' })).toEqual([event(1)]);
  });

  it('updates known event/post identities and adds new posts/events without mutating the prior snapshot', async () => {
    const first = event(1, { posts: [post(1, { relevance: 2 })] });
    const third = event(3, { created_at: '2026-10-03T09:00:00.000Z' });
    const changed = event(1, {
      title: 'Confirmed event update', summary: 'New confirmed summary', status: 'closed',
      updated_at: '2026-10-25T10:01:00.000Z', posts_count: 2,
      posts: [
        post(1, { content: 'Corrected report', relevance: 8, hash: 'b'.repeat(64) }),
        post(2, { relevance: 9 }),
      ],
    });
    const second = event(2, { created_at: '2026-10-02T09:00:00.000Z' });
    fetchMock
      .mockResolvedValueOnce(response([first, third]))
      .mockResolvedValueOnce(response([third, second, changed]));

    const before = await fetchEvents();
    const result = await fetchEvents();

    expect(result.map(({ uuid }) => uuid)).toEqual([first.uuid, second.uuid, third.uuid]);
    expect(result[0]).toEqual({ ...changed, posts: [changed.posts[1], changed.posts[0]] });
    expect(result[0].posts.map(({ uuid }) => uuid)).toEqual([post(2).uuid, post(1).uuid]);
    expect(result[0].posts).toHaveLength(2);
    expect(before).toEqual([first, third]);
    expect(result[0]).not.toBe(before[0]);
    expect(getCachedEvents()).toBe(result);
  });

  it('clears every language cache and its timestamp before later fetches', async () => {
    fetchMock
      .mockResolvedValueOnce(response([event(1)]))
      .mockResolvedValueOnce(response([event(2)]))
      .mockResolvedValueOnce(response([event(3)]));
    await fetchEvents({ language: 'en' });
    await fetchEvents({ language: 'es' });

    clearCachedEvents();

    expect(getCachedEvents()).toBeNull();
    expect(getLastFetchTime()).toBeNull();
    expect(await fetchEvents({ language: 'en' })).toEqual([event(3)]);
  });
});

describe('failed refresh', () => {
  it.each(['network', 'http', 'json'] as const)('preserves the previous active cache/time on a %s failure', async (kind) => {
    fetchMock.mockResolvedValueOnce(response([event(1, { language: 'en' })]));
    const before = await fetchEvents({ language: 'en' });
    vi.setSystemTime(new Date('2026-10-25T11:00:00.000Z'));
    const networkCause = new TypeError('bounded network failure');
    if (kind === 'network') fetchMock.mockRejectedValueOnce(networkCause);
    if (kind === 'http') fetchMock.mockResolvedValueOnce(new Response('Unavailable', { status: 503 }));
    if (kind === 'json') fetchMock.mockResolvedValueOnce(new Response('{', { status: 200 }));

    const refresh = fetchEvents({ language: 'es' });
    if (kind === 'network') await expect(refresh).rejects.toBe(networkCause);
    if (kind === 'http') await expect(refresh).rejects.toThrow('Failed to fetch events: 503');
    if (kind === 'json') await expect(refresh).rejects.toBeInstanceOf(SyntaxError);

    expect(getCachedEvents()).toBe(before);
    expect(getLastFetchTime()).toEqual(initialTime);
  });

  it('does not manufacture cached data or a successful timestamp for an initial HTTP failure', async () => {
    fetchMock.mockResolvedValueOnce(new Response('Too many requests', { status: 429 }));

    await expect(fetchEvents()).rejects.toThrow('Failed to fetch events: 429');

    expect(getCachedEvents()).toBeNull();
    expect(getLastFetchTime()).toBeNull();
  });
});

describe('event change notifications', () => {
  it('detects an added event or a replacement event identity at equal length', () => {
    expect(hasEventChanges([event(1)], [event(1), event(2)])).toBe(true);
    expect(hasEventChanges([event(1)], [event(2)])).toBe(true);
  });

  it.each([
    { title: 'New confirmed title' },
    { status: 'closed' as const },
    { posts_count: 2 },
  ])('detects the event presentation change %j', (change) => {
    expect(hasEventChanges([event(1)], [event(1, change)])).toBe(true);
  });

  it('detects another loaded post while the authoritative total count is unchanged', () => {
    const partial = event(1, { posts_count: 2, posts: [post(1)] });
    const loaded = event(1, { posts_count: 2, posts: [post(1), post(2)] });

    expect(hasEventChanges([partial], [loaded])).toBe(true);
  });

  it('detects a different post identity even when the event and post counts are unchanged', () => {
    expect(hasEventChanges([event(1)], [event(1, { posts: [post(2)] })])).toBe(true);
  });

  it('does not schedule another update for an unchanged snapshot or reordered identities', () => {
    const first = event(1, { posts: [post(1), post(2)], posts_count: 2 });
    const second = event(2);
    const sameContent = [event(2), { ...first, posts: [...first.posts].reverse() }];

    expect(hasEventChanges([], [])).toBe(false);
    expect(hasEventChanges([first, second], [first, second])).toBe(false);
    expect(hasEventChanges([first, second], sameContent)).toBe(false);
  });
});
