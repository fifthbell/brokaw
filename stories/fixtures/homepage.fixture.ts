import type { CanonicalArticle, SelfReference } from '../../src/types/canonical-article';

const categoryPool = [
  { name: 'Politics', slug: 'politics' },
  { name: 'World', slug: 'world' },
  { name: 'Business', slug: 'business' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Weather', slug: 'weather' }
];

/**
 * Reference time used for the fixture.
 * All "recent" articles are within 24 h of this instant;
 * all "older" articles are at least 48 h before it.
 */
export const FIXTURE_NOW = new Date('2026-03-11T12:00:00.000Z');

/** Timestamps that fall within the last 24 h of FIXTURE_NOW */
const recentTimestamps = [
  '2026-03-11T11:00:00.000Z', // 1 h ago
  '2026-03-11T08:00:00.000Z', // 4 h ago
  '2026-03-11T05:00:00.000Z', // 7 h ago
  '2026-03-11T02:00:00.000Z', // 10 h ago
  '2026-03-10T14:00:00.000Z', // 22 h ago
  '2026-03-10T13:00:00.000Z', // 23 h ago
  '2026-03-10T12:30:00.000Z', // 23.5 h ago
  '2026-03-10T12:10:00.000Z' // ~23.8 h ago
];

/** Timestamps that are older than 24 h (will not qualify as featured-recent) */
const olderTimestamps = [
  '2026-03-10T11:00:00.000Z', // 25 h ago
  '2026-03-09T12:00:00.000Z',
  '2026-03-08T12:00:00.000Z',
  '2026-03-07T12:00:00.000Z',
  '2026-03-06T12:00:00.000Z',
  '2026-03-05T12:00:00.000Z',
  '2026-03-04T12:00:00.000Z',
  '2026-03-03T12:00:00.000Z',
  '2026-03-02T12:00:00.000Z'
];

/**
 * Articles 0–7 are featured:true with recent timestamps so they exercise the
 * "6 featured slots + overflow goes to top of queue" path.
 * Articles 8+ are either not featured or older than 24 h.
 */
const makeArticle = (index: number): SelfReference => {
  const category = categoryPool[index % categoryPool.length];

  // First 8 articles are featured with recent timestamps (within 24 h).
  // Articles 8–16 are featured but with older timestamps.
  // The rest are not featured.
  const isRecentFeatured = index < 8;
  const isOldFeatured = index >= 8 && index < 17;

  const publishedAt = isRecentFeatured ? recentTimestamps[index % recentTimestamps.length] : olderTimestamps[(index - 8) % olderTimestamps.length];

  const updatedAt = isRecentFeatured ? recentTimestamps[index % recentTimestamps.length] : olderTimestamps[(index - 8) % olderTimestamps.length];

  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    url: `/${category.slug}/story-${index + 1}`,
    title: `${category.name} headline ${index + 1}`,
    excerpt: `Context line for ${category.name.toLowerCase()} headline ${index + 1}.`,
    categories: [category],
    featuredImage: {
      url: `https://picsum.photos/seed/fifthbell-home-${index + 1}/1280/720`,
      alt: `${category.name} visual ${index + 1}`
    },
    publishedAt,
    updatedAt,
    time: `${(index % 6) + 1} hr ago`,
    featured: isRecentFeatured || isOldFeatured
  };
};

const articles = Array.from({ length: 40 }, (_, index) => makeArticle(index));

export const homepageFixture: CanonicalArticle = {
  id: '9dd95e8f-ac86-4973-a394-330707527250',
  slug: '/',
  layout: 'homepage',
  canonicalUrl: 'https://fifthbell.com/',
  contentVersion: '2026-03-08T12:00:00.000Z',
  publishedAt: '2026-03-08T08:00:00.000Z',
  updatedAt: '2026-03-08T12:00:00.000Z',
  status: 'published',
  title: 'Markets and security alliances drive a volatile weekend briefing',
  excerpt: 'Top editors are tracking new diplomatic signals, central bank remarks, and weather disruptions.',
  language: 'en',
  featured: true,
  authors: [{ name: 'Fifthbell Desk', slug: 'fifthbell-desk' }],
  categories: [{ name: 'Top Stories', slug: 'top-stories' }],
  featuredImage: {
    url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1280&h=720&fit=crop',
    alt: 'Breaking news control room'
  },
  hero: {
    url: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=1600&h=900&fit=crop',
    alt: 'Nighttime city skyline'
  },
  body: [],
  seo: {
    metaTitle: 'fifthbell - Breaking News & Current Events',
    metaDescription: 'Stay informed with breaking news, politics, business, sports, technology, and weather coverage.'
  },
  navigation: {
    categories: categoryPool
  },
  articles,
  heroSlides: [
    {
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1600&h=900&fit=crop',
      alt: 'Newsroom montage'
    },
    {
      image: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1600&h=900&fit=crop',
      alt: 'Press conference lights'
    },
    {
      image: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=1600&h=900&fit=crop',
      alt: 'Studio camera'
    }
  ],
  breakingNews: {
    displayClass: '',
    sidebarFeature: {
      category: 'LIVE',
      title: 'Developing situation at regional transport hubs',
      url: '/world/transport-live',
      image: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?w=900&h=700&fit=crop',
      excerpt: 'Terminals reported rolling delays after weather warnings expanded.',
      publishedAt: '2026-03-11T11:30:00.000Z'
    },
    sidebarSub: {
      category: 'World',
      title: 'Officials issue advisory for coastal operations',
      url: '/world/coastal-advisory',
      image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&h=700&fit=crop',
      alt: 'Satellite image',
      readTime: '2 hr ago',
      excerpt: 'Ports and ferry operators are revising schedules before peak traffic.'
    },
    main: {
      category: 'Live Updates',
      title: 'Minute-by-minute coverage of developing response',
      url: '/world/live-response',
      image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1200&h=800&fit=crop',
      alt: 'Field reporting setup',
      excerpt: 'Editors and correspondents are publishing confirmed updates in sequence.'
    },
    updates: [
      { time: '12 min ago', text: 'Emergency managers opened two additional shelters.' },
      { time: '25 min ago', text: 'Transit authority activated alternate routes for commuter lines.' },
      { time: '41 min ago', text: 'Power operators reported localized outages in coastal districts.' }
    ],
    snacks: [
      {
        category: 'Politics',
        readTime: '58 min ago',
        title: 'Legislators request a joint briefing',
        url: '/politics/joint-briefing',
        excerpt: 'Committee chairs asked agencies for synchronized updates.',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=480&fit=crop',
        alt: 'Government building'
      },
      {
        category: 'Business',
        readTime: '1 hr ago',
        title: 'Shipping insurers raise short-term risk guidance',
        url: '/business/shipping-risk',
        excerpt: 'Premium assumptions moved higher in afternoon trading.',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=640&h=480&fit=crop',
        alt: 'Cargo containers'
      },
      {
        category: 'Technology',
        readTime: '1 hr ago',
        title: 'Grid telemetry dashboards show elevated loads',
        url: '/technology/grid-telemetry',
        excerpt: 'Peak demand clusters are appearing earlier than expected.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=480&fit=crop',
        alt: 'Operations center displays'
      },
      {
        category: 'Sports',
        readTime: '1 hr ago',
        title: 'League delays two match windows after storm alerts',
        url: '/sports/match-window-delays',
        excerpt: 'Organizers shifted kickoff timing as regional travel advisories expanded.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=640&h=480&fit=crop',
        alt: 'Stadium under cloudy skies'
      },
      {
        category: 'Weather',
        readTime: '2 hr ago',
        title: 'Forecasters extend severe watch into overnight hours',
        url: '/weather/severe-watch-extended',
        excerpt: 'Meteorologists cited a slow-moving front and saturated ground conditions.',
        image: 'https://images.unsplash.com/photo-1500740516770-92bd004b996e?w=640&h=480&fit=crop',
        alt: 'Dark storm clouds'
      }
    ]
  }
};
