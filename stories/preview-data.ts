import type { CanonicalArticle, SelfReference } from '../src/types/canonical-article';
import { homepageFixture } from './fixtures/homepage.fixture';
import { liveStoryFixture } from './fixtures/live-story.fixture';

const HOMEPAGE_JSON_URL = 'https://cdn.fifthbell.com/content/homepage-current-en.json';
const EVENTS_JSON_URL = 'https://cdn.fifthbell.com/content/events-current-en.json';
const PREVIEW_CACHE_TTL_MS = 30_000;

interface HomepagePreviewPayload {
  generatedAt?: string;
  page?: Record<string, unknown>;
  categories?: Array<{ name?: string; slug?: string }>;
  articles?: unknown[];
  breakingNews?: Record<string, unknown>;
}

interface EventsPreviewDoc {
  id?: string;
  slug?: string;
  url?: string;
  canonicalUrl?: string;
  jsonUrl?: string;
  title?: string;
  excerpt?: string;
  language?: string;
  eventDate?: string;
  updatedAt?: string;
  sofascore_id?: number | string;
  updates?: unknown[];
  categories?: Array<{ name?: string; slug?: string }>;
  featuredImage?: { url?: string; alt?: string };
}

interface EventsPreviewPayload {
  docs?: EventsPreviewDoc[];
}

interface BreakingNewsStoryData {
  displayClass?: string;
  sidebarFeature?: Record<string, unknown>;
  sidebarSub?: Record<string, unknown>;
  main?: Record<string, unknown>;
  updates?: Array<{ timestamp?: string; time?: string; text?: string; html?: string }>;
  snacks?: Array<Record<string, unknown>>;
}

const breakingNewsFixture: BreakingNewsStoryData = homepageFixture.breakingNews ?? {};

let homepagePayloadPromise: Promise<HomepagePreviewPayload | null> | null = null;
let eventsPayloadPromise: Promise<EventsPreviewPayload | null> | null = null;
let homepagePayloadFetchedAt = 0;
let eventsPayloadFetchedAt = 0;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache'
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function resolveHref(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) return '#';
  return value;
}

function buildLiveEventPath(pathInput: unknown): string | undefined {
  if (typeof pathInput !== 'string' || pathInput.trim().length === 0) return undefined;
  const path = pathInput.trim();
  if (!path.startsWith('/')) return undefined;
  if (path === '/live' || path.startsWith('/live/')) return path;
  if (path === '/es' || path.startsWith('/es/')) {
    const rest = path.replace(/^\/es/, '');
    if (!rest || rest === '/' || rest === '/live' || rest.startsWith('/live/')) return undefined;
    return `/es/live${rest}`;
  }
  if (path === '/it' || path.startsWith('/it/')) {
    const rest = path.replace(/^\/it/, '');
    if (!rest || rest === '/' || rest === '/live' || rest.startsWith('/live/')) return undefined;
    return `/it/live${rest}`;
  }
  return `/live${path}`;
}

function normalizeBreakingNewsCard(card: unknown): Record<string, unknown> | undefined {
  if (!card || typeof card !== 'object') return undefined;

  const record = card as Record<string, unknown>;
  const resolvedUrl = resolveHref(record.url ?? record.slug);
  const liveCandidate = record.liveUrl ?? buildLiveEventPath(resolvedUrl);
  const resolvedLiveUrl =
    typeof liveCandidate === 'string' && liveCandidate.trim().length > 0
      ? liveCandidate
      : undefined;
  return {
    ...record,
    url: resolvedUrl,
    ...(resolvedLiveUrl ? { liveUrl: resolvedLiveUrl } : {})
  };
}

function getHomepagePayload(): Promise<HomepagePreviewPayload | null> {
  const now = Date.now();
  if (!homepagePayloadPromise || now - homepagePayloadFetchedAt > PREVIEW_CACHE_TTL_MS) {
    homepagePayloadFetchedAt = now;
    const cacheBuster = Math.floor(now / PREVIEW_CACHE_TTL_MS);
    homepagePayloadPromise = fetchJson<HomepagePreviewPayload>(`${HOMEPAGE_JSON_URL}?v=${cacheBuster}`).catch((error) => {
      console.warn('[storybook] Failed to fetch homepage preview JSON:', error);
      return null;
    });
  }

  return homepagePayloadPromise;
}

function getEventsPayload(): Promise<EventsPreviewPayload | null> {
  const now = Date.now();
  if (!eventsPayloadPromise || now - eventsPayloadFetchedAt > PREVIEW_CACHE_TTL_MS) {
    eventsPayloadFetchedAt = now;
    const cacheBuster = Math.floor(now / PREVIEW_CACHE_TTL_MS);
    eventsPayloadPromise = fetchJson<EventsPreviewPayload>(`${EVENTS_JSON_URL}?v=${cacheBuster}`).catch((error) => {
      console.warn('[storybook] Failed to fetch aggregate events preview JSON:', error);
      return null;
    });
  }

  return eventsPayloadPromise;
}

function normalizeBreakingNewsData(payload: HomepagePreviewPayload | null): BreakingNewsStoryData {
  const record = payload?.breakingNews;
  if (!record || typeof record !== 'object') {
    return {
      ...breakingNewsFixture,
      main: undefined,
      updates: []
    };
  }

  const updates = Array.isArray(record.updates)
    ? record.updates
        .map((update) => {
          if (!update || typeof update !== 'object') return null;
          const mapped = update as Record<string, unknown>;
          const text = typeof mapped.text === 'string' ? mapped.text.trim() : '';
          const html = typeof mapped.html === 'string' ? mapped.html.trim() : '';
          const time = typeof mapped.time === 'string' ? mapped.time.trim() : '';
          const timestamp =
            typeof mapped.timestamp === 'string' ? mapped.timestamp.trim() : '';
          if (!text && !html) return null;
          if (!time && !timestamp) return null;
          return {
            ...(timestamp ? { timestamp } : {}),
            ...(time ? { time } : {}),
            ...(text ? { text } : {}),
            ...(html ? { html } : {})
          };
        })
        .filter(
          (
            update
          ): update is { timestamp?: string; time?: string; text?: string; html?: string } =>
            Boolean(update)
        )
    : [];

  return {
    ...record,
    sidebarFeature: normalizeBreakingNewsCard(record.sidebarFeature) ?? breakingNewsFixture.sidebarFeature,
    sidebarSub: normalizeBreakingNewsCard(record.sidebarSub) ?? breakingNewsFixture.sidebarSub,
    main: normalizeBreakingNewsCard(record.main) ?? breakingNewsFixture.main,
    updates,
    snacks: Array.isArray(record.snacks)
      ? record.snacks.map((snack) => normalizeBreakingNewsCard(snack)).filter((snack): snack is Record<string, unknown> => Boolean(snack))
      : breakingNewsFixture.snacks
  };
}

function toIsoDateTime(value: unknown, fallback: string): string {
  if (typeof value === 'string' || value instanceof Date) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return fallback;
}

function extractLexicalText(node: unknown): string {
  if (!node) return '';

  if (typeof node === 'string') {
    return node;
  }

  if (Array.isArray(node)) {
    return node
      .map((item) => extractLexicalText(item))
      .filter(Boolean)
      .join(' ')
      .trim();
  }

  if (typeof node === 'object') {
    const record = node as Record<string, unknown>;
    const text = typeof record.text === 'string' ? record.text : '';
    const children = Array.isArray(record.children) ? extractLexicalText(record.children) : '';
    return [text, children].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  return '';
}

function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function formatLiveStoryTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const datePart = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York'
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York'
  });

  return `${datePart} at ${timePart} ET`;
}

function formatRelativeTimestamp(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const absMinutes = Math.abs(diffMinutes);
  const rtf = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' });

  if (absMinutes < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  const absHours = Math.abs(diffHours);
  if (absHours < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

function normalizeAuthors(event: Record<string, unknown>): CanonicalArticle['authors'] {
  const updateAuthors = Array.isArray(event.updates)
    ? event.updates.map((update) => (update && typeof update === 'object' ? (update as Record<string, unknown>).author : null)).filter(Boolean)
    : [];

  const authors = updateAuthors
    .map((author, index) => {
      if (author && typeof author === 'object') {
        const record = author as Record<string, unknown>;
        const name =
          typeof record.name === 'string' && record.name.trim().length > 0
            ? record.name
            : typeof record.email === 'string' && record.email.trim().length > 0
              ? record.email
              : `Reporter ${index + 1}`;
        const slug =
          typeof record.slug === 'string' && record.slug.trim().length > 0
            ? record.slug
            : name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        return { name, slug: slug || `reporter-${index + 1}` };
      }

      return null;
    })
    .filter((author): author is CanonicalArticle['authors'][number] => Boolean(author));

  return authors.length > 0 ? authors : liveStoryFixture.authors;
}

function normalizeCategories(categoriesInput: unknown, payload: HomepagePreviewPayload | null): CanonicalArticle['categories'] {
  const categories = Array.isArray(categoriesInput)
    ? categoriesInput
        .map((category) => {
          if (!category || typeof category !== 'object') return null;
          const record = category as Record<string, unknown>;
          const name = typeof record.name === 'string' ? record.name : '';
          const slug = typeof record.slug === 'string' ? record.slug : '';
          if (!name || !slug) return null;
          return { name, slug };
        })
        .filter((category): category is CanonicalArticle['categories'][number] => Boolean(category))
    : [];

  if (categories.length > 0) return categories;

  const navCategory = Array.isArray(payload?.categories) ? payload.categories[0] : null;
  if (navCategory?.name && navCategory.slug) {
    return [{ name: navCategory.name, slug: navCategory.slug }];
  }

  return liveStoryFixture.categories;
}

function normalizeEventCategories(categoriesInput: unknown): CanonicalArticle['categories'] {
  if (!Array.isArray(categoriesInput)) return [];

  return categoriesInput
    .map((category) => {
      if (!category || typeof category !== 'object') return null;
      const record = category as Record<string, unknown>;
      const name = typeof record.name === 'string' ? record.name : '';
      const slug = typeof record.slug === 'string' ? record.slug : '';
      if (!name || !slug) return null;
      return { name, slug };
    })
    .filter((category): category is CanonicalArticle['categories'][number] => Boolean(category));
}

function getTimestamp(value: unknown): number {
  if (typeof value !== 'string') return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function getMostRecentEventDoc(payload: EventsPreviewPayload | null): EventsPreviewDoc | null {
  const docs = Array.isArray(payload?.docs) ? payload.docs : [];
  if (docs.length === 0) return null;

  return docs.reduce<EventsPreviewDoc>((latest, current) => {
    const latestUpdatedAt = getTimestamp(latest.updatedAt);
    const currentUpdatedAt = getTimestamp(current.updatedAt);

    if (currentUpdatedAt !== latestUpdatedAt) {
      return currentUpdatedAt > latestUpdatedAt ? current : latest;
    }

    const latestEventDate = getTimestamp(latest.eventDate);
    const currentEventDate = getTimestamp(current.eventDate);
    return currentEventDate > latestEventDate ? current : latest;
  }, docs[0]);
}

function normalizeLanguage(language: unknown): CanonicalArticle['language'] {
  if (language === 'es' || language === 'it') return language;
  return 'en';
}

function toPseudoUuid(value: unknown, index: number): string {
  const raw = String(value ?? index + 1);
  const digits = raw.replace(/\D/g, '') || String(index + 1);
  return `20000000-0000-4000-8000-${digits.slice(-12).padStart(12, '0')}`;
}

function normalizeEventLiveUpdates(eventDoc: EventsPreviewDoc): Extract<CanonicalArticle['body'][number], { type: 'liveUpdate' }>[] {
  if (!Array.isArray(eventDoc.updates)) return [];

  const updates: Extract<CanonicalArticle['body'][number], { type: 'liveUpdate' }>[] = [];

  eventDoc.updates.forEach((update) => {
    if (!update || typeof update !== 'object') return;
    const record = update as Record<string, unknown>;

    const html = typeof record.html === 'string' && record.html.trim().length > 0 ? record.html : undefined;
    const plainTextFromHtml = html ? stripTags(html) : '';
    const plainText =
      plainTextFromHtml ||
      (typeof record.text === 'string' ? record.text.trim() : '') ||
      extractLexicalText(record.content);
    const headline =
      typeof record.headline === 'string' && record.headline.trim().length > 0
        ? record.headline.trim()
        : '';
    const media = Array.isArray(record.media)
      ? record.media
          .map((item) => {
            if (!item || typeof item !== 'object') return null;
            const mediaRecord = item as Record<string, unknown>;
            const url = typeof mediaRecord.url === 'string' ? mediaRecord.url.trim() : '';
            if (!url) return null;
            const alt = typeof mediaRecord.alt === 'string' && mediaRecord.alt.trim().length > 0
              ? mediaRecord.alt
              : 'Live update image';
            const caption =
              typeof mediaRecord.caption === 'string' && mediaRecord.caption.trim().length > 0
                ? mediaRecord.caption
                : undefined;
            return { url, alt, ...(caption ? { caption } : {}) };
          })
          .filter(
            (
              item
            ): item is { url: string; alt: string; caption?: string } => Boolean(item)
          )
      : [];

    if (!headline && !html && !plainText && media.length === 0) return;

    updates.push({
      type: 'liveUpdate',
      timestamp: toIsoDateTime(record.timestamp ?? eventDoc.updatedAt ?? eventDoc.eventDate, liveStoryFixture.updatedAt),
      headline,
      html: html ?? (plainText ? `<p>${escapeHtml(plainText)}</p>` : undefined),
      ...(media.length > 0 ? { media } : {})
    });
  });

  updates.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  return updates;
}

function buildBreakingNewsMainFromEvent(eventDoc: EventsPreviewDoc): Record<string, unknown> {
  const category =
    typeof eventDoc.categories?.[0]?.name === 'string' && eventDoc.categories[0].name.trim().length > 0
      ? eventDoc.categories[0].name
      : 'Live Updates';
  const sofascoreId =
    typeof eventDoc.sofascore_id === 'number'
      ? eventDoc.sofascore_id
      : typeof eventDoc.sofascore_id === 'string' && /^\d+$/.test(eventDoc.sofascore_id.trim())
        ? Number.parseInt(eventDoc.sofascore_id, 10)
        : undefined;

  return {
    category,
    title: typeof eventDoc.title === 'string' && eventDoc.title.trim().length > 0 ? eventDoc.title : liveStoryFixture.title,
    url: resolveHref(eventDoc.url ?? eventDoc.slug ?? liveStoryFixture.slug),
    liveUrl: buildLiveEventPath(
      resolveHref(eventDoc.url ?? eventDoc.slug ?? liveStoryFixture.slug),
    ),
    sofascore_id: sofascoreId,
    image:
      typeof eventDoc.featuredImage?.url === 'string' && eventDoc.featuredImage.url.trim().length > 0
        ? eventDoc.featuredImage.url
        : liveStoryFixture.featuredImage?.url,
    alt:
      typeof eventDoc.featuredImage?.alt === 'string' && eventDoc.featuredImage.alt.trim().length > 0
        ? eventDoc.featuredImage.alt
        : typeof eventDoc.title === 'string' && eventDoc.title.trim().length > 0
          ? eventDoc.title
          : liveStoryFixture.featuredImage?.alt,
    excerpt: typeof eventDoc.excerpt === 'string' && eventDoc.excerpt.trim().length > 0 ? eventDoc.excerpt : liveStoryFixture.excerpt
  };
}

function buildBreakingNewsUpdatesFromEvent(eventDoc: EventsPreviewDoc): Array<{ timestamp?: string; time?: string; text?: string; html?: string }> {
  const updates = normalizeEventLiveUpdates(eventDoc);
  return updates.slice(0, 10).map((update) => {
    const text = stripTags(update.html || '').trim() || update.headline || '';
    const time = formatRelativeTimestamp(update.timestamp) || formatLiveStoryTimestamp(update.timestamp);
    return {
      timestamp: update.timestamp,
      time,
      ...(text ? { text } : {}),
      ...(update.html ? { html: update.html } : {})
    };
  });
}

function deriveSyntheticTimestamp(baseIso: string, relativeLabel: string | undefined, index: number): string {
  const base = new Date(baseIso);
  if (Number.isNaN(base.getTime())) {
    return liveStoryFixture.updatedAt;
  }

  const label = relativeLabel?.toLowerCase().trim() || '';
  const match = label.match(/(\d+)\s*(min|mins|minute|minutes|hr|hrs|hour|hours|day|days)/i);
  if (!match) {
    return new Date(base.getTime() - index * 5 * 60 * 1000).toISOString();
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const minutes = unit.startsWith('day') ? amount * 24 * 60 : unit.startsWith('hr') || unit.startsWith('hour') ? amount * 60 : amount;

  return new Date(base.getTime() - minutes * 60 * 1000).toISOString();
}

function buildRelatedArticles(payload: HomepagePreviewPayload | null): SelfReference[] {
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];

  const related: SelfReference[] = [];

  articles.slice(0, 6).forEach((article, index) => {
    if (!article || typeof article !== 'object') return;

    const record = article as Record<string, unknown>;
    const title = typeof record.title === 'string' ? record.title : '';
    const url = resolveHref(record.url ?? record.slug);
    if (!title || !url || url === '#') return;

    const categories: SelfReference['categories'] = Array.isArray(record.categories)
      ? record.categories.reduce<SelfReference['categories']>((acc, category) => {
          if (!category || typeof category !== 'object') return acc;
          const categoryRecord = category as Record<string, unknown>;
          const name = typeof categoryRecord.name === 'string' ? categoryRecord.name : '';
          const slug = typeof categoryRecord.slug === 'string' ? categoryRecord.slug : '';
          if (name && slug) {
            acc.push({ name, slug });
          }
          return acc;
        }, [])
      : [];

    const featuredImage =
      record.featuredImage && typeof record.featuredImage === 'object'
        ? {
            url:
              typeof (record.featuredImage as Record<string, unknown>).url === 'string'
                ? ((record.featuredImage as Record<string, unknown>).url as string)
                : liveStoryFixture.articles?.[0]?.featuredImage?.url || '',
            alt:
              typeof (record.featuredImage as Record<string, unknown>).alt === 'string'
                ? ((record.featuredImage as Record<string, unknown>).alt as string)
                : title
          }
        : undefined;

    related.push({
      id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      url,
      title,
      excerpt: typeof record.excerpt === 'string' ? record.excerpt : undefined,
      categories,
      featuredImage,
      publishedAt: typeof record.publishedAt === 'string' ? toIsoDateTime(record.publishedAt, liveStoryFixture.publishedAt) : liveStoryFixture.publishedAt,
      updatedAt: typeof record.updatedAt === 'string' ? toIsoDateTime(record.updatedAt, liveStoryFixture.updatedAt) : liveStoryFixture.updatedAt,
      time: typeof record.time === 'string' ? record.time : undefined
    });
  });

  return related.length > 0 ? related : liveStoryFixture.articles || [];
}

function buildHomepageCategories(payload: HomepagePreviewPayload | null): CanonicalArticle['navigation']['categories'] {
  if (!Array.isArray(payload?.categories)) {
    return homepageFixture.navigation?.categories || [];
  }

  const categories = payload.categories
    .map((category) => {
      const name = typeof category?.name === 'string' ? category.name : '';
      const slug = typeof category?.slug === 'string' ? category.slug : '';
      if (!name || !slug) return null;
      return { name, slug };
    })
    .filter((category): category is NonNullable<CanonicalArticle['navigation']>['categories'][number] => Boolean(category));

  return categories.length > 0 ? categories : homepageFixture.navigation?.categories || [];
}

function buildHomepageArticles(payload: HomepagePreviewPayload | null): SelfReference[] {
  const articles = Array.isArray(payload?.articles) ? payload.articles : [];
  if (articles.length === 0) {
    return homepageFixture.articles || [];
  }

  const mapped: SelfReference[] = [];
  articles.forEach((article, index) => {
    if (!article || typeof article !== 'object') return;
    const record = article as Record<string, unknown>;

    const title = typeof record.title === 'string' ? record.title.trim() : '';
    const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
    const url = resolveHref(record.url ?? slug);
    if (!title || url === '#') return;

    const categories = Array.isArray(record.categories)
      ? record.categories
          .map((category) => {
            if (!category || typeof category !== 'object') return null;
            const categoryRecord = category as Record<string, unknown>;
            const name = typeof categoryRecord.name === 'string' ? categoryRecord.name : '';
            const categorySlug = typeof categoryRecord.slug === 'string' ? categoryRecord.slug : '';
            if (!name || !categorySlug) return null;
            return { name, slug: categorySlug };
          })
          .filter((category): category is SelfReference['categories'][number] => Boolean(category))
      : [];

    const featuredImage =
      record.featuredImage && typeof record.featuredImage === 'object'
        ? {
            url:
              typeof (record.featuredImage as Record<string, unknown>).url === 'string'
                ? ((record.featuredImage as Record<string, unknown>).url as string)
                : homepageFixture.articles?.[0]?.featuredImage?.url || '',
            alt:
              typeof (record.featuredImage as Record<string, unknown>).alt === 'string'
                ? ((record.featuredImage as Record<string, unknown>).alt as string)
                : title
          }
        : undefined;

    mapped.push({
      id: toPseudoUuid(record.id, index),
      url,
      title,
      excerpt: typeof record.excerpt === 'string' ? record.excerpt : undefined,
      categories,
      featuredImage,
      publishedAt: toIsoDateTime(record.publishedAt, homepageFixture.publishedAt),
      updatedAt: toIsoDateTime(record.updatedAt, homepageFixture.updatedAt),
      featured: record.featured === true
    });
  });

  return mapped.length > 0 ? mapped : homepageFixture.articles || [];
}

function buildHomepagePreviewDocument(payload: HomepagePreviewPayload | null, breakingNews: BreakingNewsStoryData): CanonicalArticle {
  const generatedAt = toIsoDateTime(payload?.generatedAt, homepageFixture.updatedAt);
  const articles = buildHomepageArticles(payload);
  const navigationCategories = buildHomepageCategories(payload);
  const firstArticle = articles[0];
  const homepageTitle = firstArticle?.title || homepageFixture.title;
  const homepageExcerpt = firstArticle?.excerpt || homepageFixture.excerpt;
  const heroImage = firstArticle?.featuredImage?.url || homepageFixture.hero?.url;
  const heroAlt = firstArticle?.featuredImage?.alt || homepageFixture.hero?.alt || homepageTitle;
  const heroSlides = articles
    .filter((article) => typeof article.featuredImage?.url === 'string' && article.featuredImage.url.length > 0)
    .slice(0, 3)
    .map((article) => ({
      image: article.featuredImage?.url || '',
      alt: article.featuredImage?.alt || article.title
    }));

  return {
    ...homepageFixture,
    id: String(payload?.page?.id || homepageFixture.id),
    slug: '/',
    layout: 'homepage',
    canonicalUrl: homepageFixture.canonicalUrl,
    contentVersion: generatedAt,
    publishedAt: toIsoDateTime(payload?.page?.publishedAt ?? payload?.generatedAt, homepageFixture.publishedAt),
    updatedAt: generatedAt,
    status: 'published',
    title: homepageTitle,
    excerpt: homepageExcerpt,
    language: 'en',
    categories:
      firstArticle?.categories && firstArticle.categories.length > 0
        ? [firstArticle.categories[0]]
        : homepageFixture.categories,
    hero: heroImage
      ? {
          url: heroImage,
          alt: heroAlt
        }
      : homepageFixture.hero,
    navigation: {
      categories: navigationCategories
    },
    articles,
    heroSlides: heroSlides.length > 0 ? heroSlides : homepageFixture.heroSlides,
    breakingNews: breakingNews as CanonicalArticle['breakingNews'],
    seo: {
      metaTitle: homepageFixture.seo?.metaTitle,
      metaDescription: homepageExcerpt || homepageFixture.seo?.metaDescription
    }
  };
}

function buildLiveStoryDocument(payload: HomepagePreviewPayload | null, breakingNews: BreakingNewsStoryData): CanonicalArticle {
  const mainCard = (breakingNews.main || {}) as Record<string, unknown>;
  const slug = resolveHref(mainCard.url ?? mainCard.slug ?? liveStoryFixture.slug);
  const canonicalUrl = slug.startsWith('http') ? slug : `https://fifthbell.com${slug.startsWith('/') ? slug : `/${slug}`}`;
  const descriptionText = typeof mainCard.excerpt === 'string' ? mainCard.excerpt : liveStoryFixture.excerpt;
  const defaultTimestamp = toIsoDateTime(payload?.generatedAt ?? payload?.page?.updatedAt ?? payload?.page?.publishedAt, liveStoryFixture.updatedAt);

  const updates: Extract<CanonicalArticle['body'][number], { type: 'liveUpdate' }>[] = [];

  if (Array.isArray(breakingNews.updates)) {
    breakingNews.updates.forEach((update, index) => {
      const text = typeof update?.text === 'string' ? update.text.trim() : '';
      const html = typeof update?.html === 'string' ? update.html.trim() : '';
      const timestamp =
        typeof update?.timestamp === 'string'
          ? toIsoDateTime(update.timestamp, defaultTimestamp)
          : deriveSyntheticTimestamp(defaultTimestamp, update?.time, index);
      if (!text && !html) return;

      updates.push({
        type: 'liveUpdate',
        timestamp,
        headline: '',
        html: html || (text ? `<p>${escapeHtml(text)}</p>` : undefined)
      });
    });

    updates.sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  }

  const body = updates.length > 0 ? updates : liveStoryFixture.body;
  const lastUpdated = updates[0]?.timestamp || defaultTimestamp;
  const keyPoints = updates
    .map((update) => stripTags(update.html || ''))
    .filter(Boolean)
    .slice(0, 6);

  const featuredImage =
    typeof mainCard.image === 'string' && mainCard.image.trim().length > 0
      ? {
          url: mainCard.image,
          alt:
            typeof mainCard.alt === 'string' && mainCard.alt.trim().length > 0
              ? mainCard.alt
              : typeof mainCard.title === 'string'
                ? mainCard.title
                : liveStoryFixture.featuredImage?.alt || 'Live event image'
        }
      : liveStoryFixture.featuredImage;

  const fallbackCategories = normalizeCategories(payload?.page?.categories, payload);
  const authors = normalizeAuthors({ updates: [] });

  return {
    id: String(payload?.page?.id || liveStoryFixture.id),
    slug,
    layout: 'live-story',
    canonicalUrl,
    contentVersion: defaultTimestamp,
    publishedAt: toIsoDateTime(payload?.page?.publishedAt ?? payload?.generatedAt, liveStoryFixture.publishedAt),
    updatedAt: defaultTimestamp,
    status: 'published',
    title: typeof mainCard.title === 'string' && mainCard.title.trim().length > 0 ? mainCard.title : liveStoryFixture.title,
    dek: liveStoryFixture.dek,
    excerpt: descriptionText || liveStoryFixture.excerpt,
    language: 'en',
    featured: true,
    authors,
    categories: fallbackCategories,
    featuredImage,
    navigation: {
      categories: Array.isArray(payload?.categories)
        ? payload.categories
            .map((category) => {
              if (!category?.name || !category.slug) return null;
              return { name: category.name, slug: category.slug };
            })
            .filter((category): category is NonNullable<CanonicalArticle['navigation']>['categories'][number] => Boolean(category))
        : liveStoryFixture.navigation?.categories || []
    },
    seo: {
      metaTitle: typeof mainCard.title === 'string' && mainCard.title.trim().length > 0 ? `${mainCard.title} | fifthbell` : liveStoryFixture.seo?.metaTitle,
      metaDescription: descriptionText || liveStoryFixture.seo?.metaDescription
    },
    liveStory: {
      lastUpdated: formatLiveStoryTimestamp(lastUpdated),
      keyPoints: keyPoints.length > 0 ? keyPoints : liveStoryFixture.liveStory?.keyPoints
    },
    body,
    articles: buildRelatedArticles(payload)
  };
}

function buildLiveStoryDocumentFromEvent(eventDoc: EventsPreviewDoc, payload: HomepagePreviewPayload | null): CanonicalArticle {
  const slug = resolveHref(eventDoc.url ?? eventDoc.slug ?? liveStoryFixture.slug);
  const canonicalUrl = typeof eventDoc.canonicalUrl === 'string' && eventDoc.canonicalUrl.trim().length > 0
    ? eventDoc.canonicalUrl
    : slug.startsWith('http')
      ? slug
      : `https://fifthbell.com${slug.startsWith('/') ? slug : `/${slug}`}`;
  const updatedAt = toIsoDateTime(eventDoc.updatedAt ?? eventDoc.eventDate, liveStoryFixture.updatedAt);
  const publishedAt = toIsoDateTime(eventDoc.eventDate ?? eventDoc.updatedAt, liveStoryFixture.publishedAt);
  const excerpt = typeof eventDoc.excerpt === 'string' && eventDoc.excerpt.trim().length > 0 ? eventDoc.excerpt : liveStoryFixture.excerpt;
  const title = typeof eventDoc.title === 'string' && eventDoc.title.trim().length > 0 ? eventDoc.title : liveStoryFixture.title;
  const featuredImage =
    eventDoc.featuredImage && typeof eventDoc.featuredImage.url === 'string' && eventDoc.featuredImage.url.trim().length > 0
      ? {
          url: eventDoc.featuredImage.url,
          alt: typeof eventDoc.featuredImage.alt === 'string' && eventDoc.featuredImage.alt.trim().length > 0 ? eventDoc.featuredImage.alt : title
        }
      : liveStoryFixture.featuredImage;
  const eventCategories = normalizeEventCategories(eventDoc.categories);
  const categories = eventCategories.length > 0 ? eventCategories : normalizeCategories(payload?.page?.categories, payload);
  const eventBody = normalizeEventLiveUpdates(eventDoc);
  const summaryBody: Extract<CanonicalArticle['body'][number], { type: 'liveUpdate' }>[] = excerpt
    ? [
        {
          type: 'liveUpdate',
          timestamp: updatedAt,
          headline: title,
          html: `<p>${escapeHtml(excerpt)}</p>`
        }
      ]
    : [];
  const body = eventBody.length > 0 ? eventBody : summaryBody.length > 0 ? summaryBody : liveStoryFixture.body;
  const lastUpdated = eventBody[0]?.timestamp || updatedAt;
  const keyPoints = eventBody
    .map((update) => stripTags(update.html || ''))
    .filter(Boolean)
    .slice(0, 6);

  return {
    id: String(eventDoc.id || liveStoryFixture.id),
    slug,
    layout: 'live-story',
    canonicalUrl,
    contentVersion: updatedAt,
    publishedAt,
    updatedAt,
    status: 'published',
    title,
    dek: liveStoryFixture.dek,
    excerpt,
    language: normalizeLanguage(eventDoc.language),
    sofascore_id:
      typeof eventDoc.sofascore_id === 'number'
        ? eventDoc.sofascore_id
        : typeof eventDoc.sofascore_id === 'string' &&
            /^\d+$/.test(eventDoc.sofascore_id.trim())
          ? Number.parseInt(eventDoc.sofascore_id, 10)
          : undefined,
    featured: true,
    authors: liveStoryFixture.authors,
    categories,
    featuredImage,
    navigation: {
      categories: Array.isArray(payload?.categories)
        ? payload.categories
            .map((category) => {
              if (!category?.name || !category.slug) return null;
              return { name: category.name, slug: category.slug };
            })
            .filter((category): category is NonNullable<CanonicalArticle['navigation']>['categories'][number] => Boolean(category))
        : liveStoryFixture.navigation?.categories || []
    },
    seo: {
      metaTitle: `${title} | fifthbell`,
      metaDescription: excerpt
    },
    liveStory: {
      lastUpdated: formatLiveStoryTimestamp(lastUpdated),
      keyPoints: keyPoints.length > 0 ? keyPoints : excerpt ? [excerpt] : liveStoryFixture.liveStory?.keyPoints
    },
    body,
    articles: buildRelatedArticles(payload)
  };
}

export async function loadBreakingNewsPreviewData(): Promise<BreakingNewsStoryData> {
  const payload = await getHomepagePayload();
  const homepageBreakingNews = normalizeBreakingNewsData(payload);
  const eventsPayload = await getEventsPayload();
  const mostRecentEvent = getMostRecentEventDoc(eventsPayload);

  if (!mostRecentEvent) {
    return homepageBreakingNews;
  }

  const updates = buildBreakingNewsUpdatesFromEvent(mostRecentEvent);
  return {
    ...homepageBreakingNews,
    main: buildBreakingNewsMainFromEvent(mostRecentEvent),
    updates: updates.length > 0 ? updates : []
  };
}

export async function loadHomepagePreviewData(): Promise<CanonicalArticle> {
  const payload = await getHomepagePayload();
  const breakingNews = await loadBreakingNewsPreviewData();
  return buildHomepagePreviewDocument(payload, breakingNews);
}

export async function loadLiveStoryPreviewData(): Promise<CanonicalArticle> {
  const payload = await getHomepagePayload();
  const eventsPayload = await getEventsPayload();
  const mostRecentEvent = getMostRecentEventDoc(eventsPayload);
  if (mostRecentEvent) {
    const jsonUrl = typeof mostRecentEvent.jsonUrl === 'string' ? mostRecentEvent.jsonUrl : '';
    if (jsonUrl) {
      try {
        return await fetchJson<CanonicalArticle>(jsonUrl);
      } catch (error) {
        console.warn('[storybook] Failed to fetch live story from latest events feed jsonUrl; falling back to event summary payload:', error);
      }
    }

    return buildLiveStoryDocumentFromEvent(mostRecentEvent, payload);
  }

  const breakingNews = normalizeBreakingNewsData(payload);
  if (!breakingNews.main) {
    console.warn('[storybook] Events feed did not include docs and homepage JSON did not include breakingNews.main; falling back to fixture.');
    return liveStoryFixture;
  }

  const mainCard = breakingNews.main as Record<string, unknown>;
  const jsonUrl = typeof mainCard.jsonUrl === 'string' ? mainCard.jsonUrl : '';
  if (jsonUrl) {
    try {
      return await fetchJson<CanonicalArticle>(jsonUrl);
    } catch (error) {
      console.warn('[storybook] Failed to fetch CDN live story JSON; falling back to reconstructed homepage payload:', error);
    }
  }

  return buildLiveStoryDocument(payload, breakingNews);
}
