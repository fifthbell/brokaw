import type { CanonicalArticle } from '../../src/types/canonical-article';

export const articleFixture: CanonicalArticle = {
  id: 'f4fb8d3f-18da-4df2-8571-7737adc5ad0b',
  slug: '/investigations/atlantic-storm-tracker',
  layout: 'article-page',
  canonicalUrl: 'https://fifthbell.com/investigations/atlantic-storm-tracker',
  contentVersion: '2026-03-08T12:00:00.000Z',
  publishedAt: '2026-03-08T10:30:00.000Z',
  updatedAt: '2026-03-08T11:45:00.000Z',
  status: 'published',
  title: 'Atlantic storm tracker: what forecasters now expect this week',
  dek: 'Meteorologists are watching multiple systems and a tight pressure gradient off the East Coast.',
  excerpt: 'A fast-moving setup could bring strong wind, coastal flooding, and rapid weather changes across the Northeast corridor.',
  language: 'en',
  featured: true,
  authors: [
    {
      name: 'Fifthbell Desk',
      slug: 'fifthbell-desk'
    }
  ],
  categories: [
    {
      name: 'Weather',
      slug: 'weather'
    }
  ],
  featuredImage: {
    url: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1600&h=900&fit=crop',
    alt: 'Storm front over the Atlantic coast',
    caption: 'Forecast models indicate a sharp drop in pressure overnight.'
  },
  body: [
    {
      type: 'richText',
      html: '<p>Forecasters shifted guidance overnight after new runs showed a faster storm track. Coastal gusts may exceed previous projections, especially in exposed shoreline communities.</p>'
    },
    {
      type: 'heading',
      text: 'What Has Changed Since the Morning Forecast',
      level: 2
    },
    {
      type: 'keyPoints',
      title: 'Key Points',
      points: [
        'Wind timing shifted two hours earlier for coastal communities.',
        'Flood alerts were expanded to include low-lying transit corridors.',
        'School districts are deciding on evening event cancellations.'
      ]
    },
    {
      type: 'list',
      ordered: false,
      items: [
        'Secure loose objects on balconies and rooftops.',
        'Charge devices before the evening commute.',
        'Monitor local emergency alerts through midnight.'
      ]
    },
    {
      type: 'infoBox',
      tone: 'warning',
      title: 'Safety Note',
      html: '<p>Do not drive through standing water. Emergency officials say most storm-related rescues involve flooded roadways.</p>'
    },
    {
      type: 'divider'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-08T16:10:00.000Z',
      headline: 'Two commuter rail lines moving to reduced evening service',
      html: '<p>Transit officials cite forecast wind gusts exceeding operational limits on exposed bridge segments.</p>'
    },
    {
      type: 'dataTable',
      caption: 'Latest advisory by metro area',
      headers: ['Metro', 'Peak Gust', 'Coastal Flood Risk'],
      rows: [
        ['Boston', '48 mph', 'Moderate'],
        ['Providence', '52 mph', 'High'],
        ['New York City', '41 mph', 'Moderate']
      ]
    },
    {
      type: 'pullQuote',
      text: 'The highest-impact window is likely short, but intense.',
      attribution: 'National forecast briefing'
    },
    {
      type: 'image',
      url: 'https://cdn.fifthbell.com/media/2026/03/08/russell-wins-australian-grand-prix-as-mercedes-dominates-f1-season-opener-muhpTza0j5.avif',
      alt: 'Doppler radar display',
      caption: 'Radar signatures tightened after midnight updates.'
    },
    {
      type: 'youtube',
      videoId: 'dQw4w9WgXcQ'
    },
    {
      type: 'audio',
      title: 'Listen: Latest briefing from the forecast desk',
      url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      caption: 'Updated at 11:45 a.m. ET.'
    },
    {
      type: 'x',
      url: 'https://x.com/Carolina_Toha/status/14192687787'
    },
    {
      type: 'instagram',
      url: 'https://www.instagram.com/p/DSQwFLRjSKl/'
    },
    {
      type: 'tiktok',
      url: 'https://www.tiktok.com/@scout2015/video/6718335390845095173'
    },
    {
      type: 'richText',
      html: '<p>Emergency managers urged residents to secure loose outdoor items and monitor local advisories. Transit agencies are preparing contingency schedules if wind thresholds are reached.</p>'
    }
  ],
  seo: {
    metaTitle: 'Atlantic storm tracker | fifthbell',
    metaDescription: 'Latest forecast, timing, and impact details for the Atlantic storm setup.',
    ogImage: 'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=1200&h=630&fit=crop'
  },
  navigation: {
    categories: [
      { name: 'Politics', slug: 'politics' },
      { name: 'World', slug: 'world' },
      { name: 'Business', slug: 'business' },
      { name: 'Sports', slug: 'sports' },
      { name: 'Technology', slug: 'technology' },
      { name: 'Weather', slug: 'weather' }
    ]
  },
  articles: [
    {
      id: '11111111-1111-4111-8111-111111111111',
      url: '/weather/coastal-flood-watch-expanded',
      title: 'Coastal flood watch expanded across three states',
      excerpt: 'Emergency crews pre-positioned barricades as tidal surge estimates increased overnight.',
      categories: [{ name: 'Weather', slug: 'weather' }],
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1475776408506-9a5371e7a068?w=1200&h=675&fit=crop',
        alt: 'Flooded coastal roadway at dusk'
      },
      publishedAt: '2026-03-08T09:15:00.000Z',
      updatedAt: '2026-03-08T09:40:00.000Z',
      featured: false
    },
    {
      id: '22222222-2222-4222-8222-222222222222',
      url: '/weather/transit-agencies-issue-severe-weather-plan',
      title: 'Transit agencies issue severe weather contingency plans',
      excerpt: 'Rail and bus operators outlined reduced schedules and fallback routes for evening service.',
      categories: [{ name: 'Weather', slug: 'weather' }],
      featuredImage: {
        url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1200&h=675&fit=crop',
        alt: 'Commuters waiting on a windy platform'
      },
      publishedAt: '2026-03-08T08:20:00.000Z',
      updatedAt: '2026-03-08T08:55:00.000Z',
      featured: false
    }
  ]
};
