import type { SupportedLanguage } from '../i18n.js';
import { createLastGood } from '../source-retention.js';

export interface LiveEventUpdate {
  timestamp?: string;
  time?: string;
  text?: string;
  html?: string;
}

export interface LiveEventData {
  category: string;
  title: string;
  excerpt?: string;
  image: string;
  alt?: string;
  url: string;
  liveUrl?: string;
  sofascore_id?: number;
  updatedAt: string;
  updates: LiveEventUpdate[];
}

interface BreakingNewsMain {
  category?: string;
  title?: string;
  excerpt?: string;
  image?: string;
  alt?: string;
  url?: string;
  liveUrl?: string;
  sofascore_id?: number;
}

interface BreakingNewsBlock {
  main?: BreakingNewsMain;
  updates?: LiveEventUpdate[];
}

interface HomepageFeed {
  breakingNews?: BreakingNewsBlock;
  updatedAt?: string;
}

interface AuburnaleEvent {
  id: string;
  title: string;
  slug: string;
  sofascore_id?: number;
  featuredImage?: { url: string; alt?: string };
  categories?: { name: string }[];
  eventDate: string;
  description?: any;
  updates?: { timestamp: string; content: any; updateType?: string; isPinned?: boolean }[];
}

interface AuburnaleListResponse {
  data: AuburnaleEvent[];
}

function extractUpdatesFromAuburnaleEvent(updates?: AuburnaleEvent['updates']): LiveEventUpdate[] {
  if (!updates || updates.length === 0) return [];
  return updates.map((u) => {
    let text = '';
    try {
      const parsed = typeof u.content === 'string' ? JSON.parse(u.content) : u.content;
      text = parsed?.root?.children?.[0]?.children?.[0]?.text || '';
    } catch {
      text = String(u.content || '');
    }
    return {
      timestamp: u.timestamp,
      text: text || 'Update available',
    };
  });
}

/** What a live-event source said: its event (or none), or nothing because it failed. */
type LiveEventAnswer = { answered: true; event: LiveEventData | null } | { answered: false };

async function fetchFromAuburnale(language: SupportedLanguage): Promise<LiveEventAnswer> {
  const baseUrl = typeof window !== 'undefined' ? `http://${window.location.hostname}:3000` : 'http://127.0.0.1:3000';
  try {
    const res = await fetch(`${baseUrl}/events?status=published&limit=1&sort=-eventDate&language=${language}`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return { answered: false };
    const body: AuburnaleListResponse = await res.json();
    const items = body.data || [];
    const event = items.find((e) => typeof e.sofascore_id === 'number' && e.sofascore_id > 0);
    if (!event) return { answered: true, event: null };

    return { answered: true, event: {
      category: event.categories?.[0]?.name || 'EVENT',
      title: event.title,
      excerpt: '',
      image: event.featuredImage?.url || '',
      alt: event.featuredImage?.alt || event.title,
      url: `/${event.slug}`,
      sofascore_id: event.sofascore_id,
      updatedAt: event.eventDate || new Date().toISOString(),
      updates: extractUpdatesFromAuburnaleEvent(event.updates),
    } };
  } catch {
    return { answered: false };
  }
}

async function fetchLiveEventAnswer(language: SupportedLanguage): Promise<LiveEventAnswer> {
  try {
    const response = await fetch(
      `https://cdn.fifthbell.com/content/homepage-current-${language}.json?_=${Date.now()}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return fetchFromAuburnale(language);
    }

    const data: HomepageFeed = await response.json();
    const main = data.breakingNews?.main;
    if (!main || !main.title) {
      return fetchFromAuburnale(language);
    }

    return { answered: true, event: {
      category: main.category || 'LIVE',
      title: main.title,
      excerpt: main.excerpt,
      image: main.image || '',
      alt: main.alt || main.title,
      url: main.url || '/',
      liveUrl: main.liveUrl,
      sofascore_id: main.sofascore_id,
      updatedAt: data.updatedAt || new Date().toISOString(),
      updates: data.breakingNews?.updates || [],
    } };
  } catch (error) {
    console.error('Error fetching live event:', error);
    return fetchFromAuburnale(language);
  }
}

const lastGoodLiveEvents = createLastGood<LiveEventData | null>();

/**
 * The live event from the homepage feed, or from Auburnale when the feed has
 * none. An answer of "no live event" is shown at once; when both sources
 * fail, the last answer for the language stays for up to 30 minutes
 * (fifthbell/brokaw#35), then the live event drops.
 */
export async function fetchLiveEvent(language: SupportedLanguage = 'en'): Promise<LiveEventData | null> {
  const answer = await fetchLiveEventAnswer(language);
  if (answer.answered) return lastGoodLiveEvents.keep(language, answer.event);
  console.warn('[live-program] live event unavailable');
  return lastGoodLiveEvents.recall(language) ?? null;
}
