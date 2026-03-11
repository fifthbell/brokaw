import type { SelfReference } from './types/canonical-article.js';

/**
 * Represents the pre-distributed article slots for the homepage.
 *
 * Featured slots (Landing[0,6,7] and MustRead[16,17,18]) are filled by
 * `featured:true` articles published within the last 24 hours, ordered by
 * date descending. If no such articles exist, all slots fall back to the
 * general queue.
 *
 * The general queue contains:
 *   - Overflow featured articles (beyond the first 6, within 24h)
 *   - All remaining non-featured / older articles
 * Sorted by date descending.
 *
 * When Breaking News is active, the first 5 queue items are reserved for
 * the Breaking News candy-bar snacks before filling the Landing / Must Read /
 * More Stories slots.
 */
export interface HomepageSlots {
  landing: {
    /** Featured slot 1 — large hero article (Landing headline 1) */
    headline1: SelfReference | undefined;
    /** Sub-snacks below headline 1 (4 items from queue) */
    sub1: SelfReference[];
    /** Dark-card feature (Landing card 5) */
    card5: SelfReference | undefined;
    /** Featured slot 2 — second prominent card (Landing headline 6) */
    headline6: SelfReference | undefined;
    /** Top Stories sidebar — first item is featured slot 3, rest from queue (6 items total) */
    topStories: SelfReference[];
  };
  mustRead: {
    /** Must Read wide leader article (not a featured slot) */
    lead: SelfReference | undefined;
    /** Featured slot 4 — first two-column card (Must Read headline 16) */
    headline16: SelfReference | undefined;
    /** Featured slot 5 — second two-column card (Must Read headline 17) */
    headline17: SelfReference | undefined;
    /** Must Read sidebar — first item is featured slot 6, rest from queue (7 items total) */
    sidebar: SelfReference[];
  };
  /** More Stories grid (12 items from queue) */
  moreStories: SelfReference[];
  /**
   * Queue articles shaped for the Breaking News candy-bar snacks (5 items).
   * Populated only when `showBreakingNews` is true; empty array otherwise.
   */
  breakingNewsSnacks: SelfReference[];
}

/** Return the best available date timestamp for an article, as epoch ms. */
function articleDateMs(article: SelfReference): number {
  const ts = article.publishedAt ?? article.updatedAt;
  return ts ? new Date(ts).getTime() : 0;
}

/**
 * Distribute homepage articles into named slots.
 *
 * @param articles        Full list of article references from the document.
 * @param now             The reference time (default: current time). Exposed
 *                        as a parameter so tests can pass a fixed instant.
 * @param showBreakingNews When true, the first 5 queue items are reserved for
 *                        the Breaking News candy-bar before Landing slots are
 *                        filled.
 */
export function distributeHomepageArticles(
  articles: SelfReference[],
  now: Date = new Date(),
  showBreakingNews = false
): HomepageSlots {
  const FEATURED_SLOT_COUNT = 6;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const cutoffMs = now.getTime() - ONE_DAY_MS;

  // Articles that qualify for the 6 featured slots:
  //   featured:true AND published/updated within the last 24 hours,
  //   ordered newest-first.
  const recentFeatured = articles
    .filter((a) => a.featured === true && articleDateMs(a) >= cutoffMs)
    .sort((a, b) => articleDateMs(b) - articleDateMs(a));

  const featuredSlots = recentFeatured.slice(0, FEATURED_SLOT_COUNT);
  const overflow = recentFeatured.slice(FEATURED_SLOT_COUNT);

  const usedIds = new Set(featuredSlots.map((a) => a.id));

  // General queue: overflow featured articles (beyond the 6 slots) followed by
  // all other articles, sorted newest-first.
  const others = articles.filter((a) => !usedIds.has(a.id));
  const queue = [...overflow, ...others].sort(
    (a, b) => articleDateMs(b) - articleDateMs(a)
  );

  let qi = 0;

  const nextFromQueue = (): SelfReference | undefined => queue[qi++];
  const nextNFromQueue = (n: number): SelfReference[] => {
    const result = queue.slice(qi, qi + n);
    qi += result.length;
    return result;
  };

  // A featured slot falls back to the queue if not enough featured articles
  // are available.
  const getFeatured = (index: number): SelfReference | undefined =>
    featuredSlots[index] ?? nextFromQueue();

  // When Breaking News is active, reserve the first 5 queue items for the
  // candy-bar snacks, so those slots are filled before Landing.
  const breakingNewsSnacks = showBreakingNews ? nextNFromQueue(5) : [];

  // ── Landing ──────────────────────────────────────────────────────────────
  const headline1 = getFeatured(0);
  const sub1 = nextNFromQueue(4);
  const card5 = nextFromQueue();
  const headline6 = getFeatured(1);
  const topStoriesHead = getFeatured(2);
  const topStoriesTail = nextNFromQueue(5);
  const topStories = [topStoriesHead, ...topStoriesTail].filter(
    (a): a is SelfReference => a !== undefined
  );

  // ── Must Read ─────────────────────────────────────────────────────────────
  const lead = nextFromQueue();
  const headline16 = getFeatured(3);
  const headline17 = getFeatured(4);
  const sidebarHead = getFeatured(5);
  const sidebarTail = nextNFromQueue(6);
  const sidebar = [sidebarHead, ...sidebarTail].filter(
    (a): a is SelfReference => a !== undefined
  );

  // ── More Stories ──────────────────────────────────────────────────────────
  const moreStories = nextNFromQueue(12);

  return {
    landing: { headline1, sub1, card5, headline6, topStories },
    mustRead: { lead, headline16, headline17, sidebar },
    moreStories,
    breakingNewsSnacks
  };
}
