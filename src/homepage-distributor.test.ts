import { describe, it, expect } from 'vitest';
import { distributeHomepageArticles } from './homepage-distributor.js';
import type { SelfReference } from './types/canonical-article.js';

// Fixed reference time for all tests.
const NOW = new Date('2026-03-11T12:00:00.000Z');

/** Build a minimal SelfReference for testing. */
function makeRef(
  id: number,
  opts: { featured?: boolean; publishedAt?: string } = {}
): SelfReference {
  return {
    id: `00000000-0000-4000-8000-${String(id).padStart(12, '0')}`,
    url: `/story-${id}`,
    title: `Article ${id}`,
    categories: [],
    featured: opts.featured,
    publishedAt: opts.publishedAt ?? `2026-03-${String((id % 9) + 1).padStart(2, '0')}T09:00:00.000Z`,
    updatedAt: opts.publishedAt ?? `2026-03-${String((id % 9) + 1).padStart(2, '0')}T09:00:00.000Z`
  };
}

/** Recent timestamp within 24 h of NOW */
const recent = (offsetH = 1) =>
  new Date(NOW.getTime() - offsetH * 3_600_000).toISOString();

/** Old timestamp clearly outside 24 h window */
const old = '2026-03-09T12:00:00.000Z';

/** Generate `n` non-featured articles with old timestamps */
function makeQueue(n: number, startId = 100): SelfReference[] {
  return Array.from({ length: n }, (_, i) => makeRef(startId + i, { publishedAt: old }));
}

describe('distributeHomepageArticles', () => {
  describe('featured slots', () => {
    it('fills the 6 featured slots with the most recent featured:true articles', () => {
      const featured = Array.from({ length: 6 }, (_, i) =>
        makeRef(i + 1, { featured: true, publishedAt: recent(i + 1) })
      );
      const queue = makeQueue(30);
      const slots = distributeHomepageArticles([...featured, ...queue], NOW);

      expect(slots.landing.headline1?.id).toBe(featured[0].id);   // newest
      expect(slots.landing.headline6?.id).toBe(featured[1].id);
      expect(slots.landing.topStories[0]?.id).toBe(featured[2].id);
      expect(slots.mustRead.headline16?.id).toBe(featured[3].id);
      expect(slots.mustRead.headline17?.id).toBe(featured[4].id);
      expect(slots.mustRead.sidebar[0]?.id).toBe(featured[5].id);  // oldest of the 6
    });

    it('falls back to queue when fewer than 6 featured articles are available', () => {
      const featured = [
        makeRef(1, { featured: true, publishedAt: recent(1) }),
        makeRef(2, { featured: true, publishedAt: recent(2) })
      ];
      const queue = makeQueue(30);
      const slots = distributeHomepageArticles([...featured, ...queue], NOW);

      // First two featured slots should be the featured articles.
      expect(slots.landing.headline1?.id).toBe(featured[0].id);
      expect(slots.landing.headline6?.id).toBe(featured[1].id);
      // Third featured slot (topStories[0]) and beyond should come from the queue.
      expect(queue.map((a) => a.id)).toContain(slots.landing.topStories[0]?.id);
    });

    it('falls back entirely to queue when no featured articles are within 24 h', () => {
      const outdated = [
        makeRef(1, { featured: true, publishedAt: old }),
        makeRef(2, { featured: true, publishedAt: old })
      ];
      const nonFeatured = makeQueue(30);
      const all = [...outdated, ...nonFeatured];
      const slots = distributeHomepageArticles(all, NOW);

      // Since there are no recent featured articles, featuredSlots is empty and
      // all 6 prominent slots are filled from the general queue (which includes
      // both the outdated featured articles and the non-featured articles, sorted
      // by date descending).
      const allIds = new Set(all.map((a) => a.id));
      expect(allIds.has(slots.landing.headline1?.id ?? '')).toBe(true);
      expect(allIds.has(slots.landing.headline6?.id ?? '')).toBe(true);
      expect(allIds.has(slots.landing.topStories[0]?.id ?? '')).toBe(true);
      expect(allIds.has(slots.mustRead.headline16?.id ?? '')).toBe(true);
      expect(allIds.has(slots.mustRead.headline17?.id ?? '')).toBe(true);
      expect(allIds.has(slots.mustRead.sidebar[0]?.id ?? '')).toBe(true);
    });
  });

  describe('featured overflow', () => {
    it('places overflow featured articles at the top of the queue', () => {
      // 8 recent featured articles — slots take 6, overflow takes 2.
      const featured = Array.from({ length: 8 }, (_, i) =>
        makeRef(i + 1, { featured: true, publishedAt: recent(i + 1) })
      );
      const nonFeatured = makeQueue(20, 100);
      const slots = distributeHomepageArticles([...featured, ...nonFeatured], NOW);

      // The 6 featured slots are taken by articles 1–6 (newest first).
      // Articles 7 & 8 (overflow) should appear early in the queue (sub1, etc.)
      // before the non-featured articles.
      const overflow7 = featured[6].id;
      const overflow8 = featured[7].id;
      const sub1Ids = slots.landing.sub1.map((a: SelfReference) => a.id);
      const card5Id = slots.landing.card5?.id;
      const earlyQueueIds = new Set([...sub1Ids, card5Id]);

      expect(earlyQueueIds.has(overflow7) || earlyQueueIds.has(overflow8)).toBe(true);
    });
  });

  describe('no duplicate articles', () => {
    it('does not place the same article in multiple slots', () => {
      const featured = Array.from({ length: 6 }, (_, i) =>
        makeRef(i + 1, { featured: true, publishedAt: recent(i + 1) })
      );
      const queue = makeQueue(40);
      const slots = distributeHomepageArticles([...featured, ...queue], NOW);

      const all: string[] = [
        slots.landing.headline1?.id,
        ...slots.landing.sub1.map((a: SelfReference) => a.id),
        slots.landing.card5?.id,
        slots.landing.headline6?.id,
        ...slots.landing.topStories.map((a: SelfReference) => a.id),
        slots.mustRead.lead?.id,
        slots.mustRead.headline16?.id,
        slots.mustRead.headline17?.id,
        ...slots.mustRead.sidebar.map((a: SelfReference) => a.id),
        ...slots.moreStories.map((a: SelfReference) => a.id)
      ].filter((id): id is string => id !== undefined);

      const unique = new Set(all);
      expect(unique.size).toBe(all.length);
    });

    it('places overflow featured articles in the queue only once', () => {
      const featured = Array.from({ length: 10 }, (_, i) =>
        makeRef(i + 1, { featured: true, publishedAt: recent(i + 1) })
      );
      const queue = makeQueue(40);
      const slots = distributeHomepageArticles([...featured, ...queue], NOW);

      const all = [
        slots.landing.headline1,
        ...slots.landing.sub1,
        slots.landing.card5,
        slots.landing.headline6,
        ...slots.landing.topStories,
        slots.mustRead.lead,
        slots.mustRead.headline16,
        slots.mustRead.headline17,
        ...slots.mustRead.sidebar,
        ...slots.moreStories
      ].filter((article): article is SelfReference => article !== undefined);

      expect(new Set(all.map((article) => article.id)).size).toBe(all.length);
      for (const article of featured.slice(6)) {
        expect(all.filter((candidate) => candidate.id === article.id)).toHaveLength(1);
      }
    });
  });

  describe('queue fill order', () => {
    it('fills Landing slots before Must Read and More Stories', () => {
      // 40 non-featured articles numbered 1–40.
      const articles = Array.from({ length: 40 }, (_, i) =>
        makeRef(
          i + 1,
          // Make IDs deterministic by using a fixed past timestamp with a minute offset.
          { publishedAt: new Date(NOW.getTime() - (i + 100) * 60_000).toISOString() }
        )
      );
      const slots = distributeHomepageArticles(articles, NOW);

      // The first queue article lands in headline1 (featured slot falls back to queue).
      expect(slots.landing.headline1?.id).toBe(articles[0].id);

      // Must Read lead should come after all Landing queue slots are filled.
      const landingIds = new Set([
        slots.landing.headline1?.id,
        ...slots.landing.sub1.map((a: SelfReference) => a.id),
        slots.landing.card5?.id,
        slots.landing.headline6?.id,
        ...slots.landing.topStories.map((a: SelfReference) => a.id)
      ]);
      const mustReadLeadIdx = articles.findIndex((a) => a.id === slots.mustRead.lead?.id);
      const lastLandingIdx = Math.max(
        ...articles
          .map((a, i) => (landingIds.has(a.id) ? i : -1))
          .filter((i) => i >= 0)
      );
      expect(mustReadLeadIdx).toBeGreaterThan(lastLandingIdx);
    });
  });

  describe('breaking news', () => {
    it('does not reserve queue articles for breakingNewsSnacks when showBreakingNews=true', () => {
      const articles = makeQueue(40);
      const slots = distributeHomepageArticles(articles, NOW, true);

      expect(slots.breakingNewsSnacks).toHaveLength(0);
    });

    it('returns empty breakingNewsSnacks when showBreakingNews=false', () => {
      const articles = makeQueue(20);
      const slots = distributeHomepageArticles(articles, NOW, false);

      expect(slots.breakingNewsSnacks).toHaveLength(0);
    });

    it('does not shift Landing / Must Read / More Stories slots when Breaking News is active', () => {
      const articles = makeQueue(40);
      const slotsNoBreaking = distributeHomepageArticles(articles, NOW, false);
      const slotsWithBreaking = distributeHomepageArticles(articles, NOW, true);

      expect(slotsWithBreaking.landing.headline1?.id).toBe(
        slotsNoBreaking.landing.headline1?.id
      );
    });
  });
});
