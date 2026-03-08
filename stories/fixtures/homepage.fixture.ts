import type { CanonicalArticle, SelfReference } from '../../src/types/canonical-article';

const categoryPool = [
  { name: 'Politics', slug: 'politics' },
  { name: 'World', slug: 'world' },
  { name: 'Business', slug: 'business' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Weather', slug: 'weather' }
];

const makeArticle = (index: number): SelfReference => {
  const category = categoryPool[index % categoryPool.length];
  const day = String((index % 9) + 1).padStart(2, '0');

  return {
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    slug: `/${category.slug}/story-${index + 1}`,
    title: `${category.name} headline ${index + 1}`,
    excerpt: `Context line for ${category.name.toLowerCase()} headline ${index + 1}.`,
    categories: [category],
    featuredImage: {
      url: `https://picsum.photos/seed/fifthbell-home-${index + 1}/1280/720`,
      alt: `${category.name} visual ${index + 1}`
    },
    publishedAt: `2026-03-${day}T09:00:00.000Z`,
    updatedAt: `2026-03-${day}T11:30:00.000Z`,
    time: `${(index % 6) + 1} hr ago`
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
      slug: '/world/transport-live',
      image: 'https://images.unsplash.com/photo-1465447142348-e9952c393450?w=900&h=700&fit=crop',
      excerpt: 'Terminals reported rolling delays after weather warnings expanded.'
    },
    sidebarSub: {
      category: 'World',
      title: 'Officials issue advisory for coastal operations',
      slug: '/world/coastal-advisory',
      image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&h=700&fit=crop',
      alt: 'Satellite image',
      readTime: '2 hr ago',
      excerpt: 'Ports and ferry operators are revising schedules before peak traffic.'
    },
    main: {
      category: 'Live Updates',
      title: 'Minute-by-minute coverage of developing response',
      slug: '/world/live-response',
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
        slug: '/politics/joint-briefing',
        excerpt: 'Committee chairs asked agencies for synchronized updates.',
        image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=640&h=480&fit=crop',
        alt: 'Government building'
      },
      {
        category: 'Business',
        readTime: '1 hr ago',
        title: 'Shipping insurers raise short-term risk guidance',
        slug: '/business/shipping-risk',
        excerpt: 'Premium assumptions moved higher in afternoon trading.',
        image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=640&h=480&fit=crop',
        alt: 'Cargo containers'
      },
      {
        category: 'Technology',
        readTime: '1 hr ago',
        title: 'Grid telemetry dashboards show elevated loads',
        slug: '/technology/grid-telemetry',
        excerpt: 'Peak demand clusters are appearing earlier than expected.',
        image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&h=480&fit=crop',
        alt: 'Operations center displays'
      },
      {
        category: 'Sports',
        readTime: '1 hr ago',
        title: 'League delays two match windows after storm alerts',
        slug: '/sports/match-window-delays',
        excerpt: 'Organizers shifted kickoff timing as regional travel advisories expanded.',
        image: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=640&h=480&fit=crop',
        alt: 'Stadium under cloudy skies'
      },
      {
        category: 'Weather',
        readTime: '2 hr ago',
        title: 'Forecasters extend severe watch into overnight hours',
        slug: '/weather/severe-watch-extended',
        excerpt: 'Meteorologists cited a slow-moving front and saturated ground conditions.',
        image: 'https://images.unsplash.com/photo-1500740516770-92bd004b996e?w=640&h=480&fit=crop',
        alt: 'Dark storm clouds'
      }
    ]
  }
};
