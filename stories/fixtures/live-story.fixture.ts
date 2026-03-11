import type { CanonicalArticle, SelfReference } from '../../src/types/canonical-article';

const navigationCategories = [
  { name: 'Politics', slug: 'politics' },
  { name: 'World', slug: 'world' },
  { name: 'Business', slug: 'business' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Technology', slug: 'technology' },
  { name: 'Weather', slug: 'weather' }
];

const relatedArticles: SelfReference[] = [
  {
    id: '20000000-0000-4000-8000-000000000001',
    url: '/world/strait-of-hormuz-explainer',
    title: 'What is the Strait of Hormuz and why does it matter?',
    excerpt: "A fifth of the world's seaborne oil passes through this narrow waterway.",
    categories: [{ name: 'World', slug: 'world' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-1/400/225',
      alt: 'Map showing Strait of Hormuz'
    },
    publishedAt: '2026-03-09T08:00:00.000Z',
    updatedAt: '2026-03-09T10:30:00.000Z',
    time: '1 day ago'
  },
  {
    id: '20000000-0000-4000-8000-000000000002',
    url: '/world/iran-us-tensions-timeline',
    title: 'A timeline of U.S.–Iran tensions over the past decade',
    excerpt: 'From nuclear negotiations to proxy conflicts, a decade of escalation and diplomacy.',
    categories: [{ name: 'World', slug: 'world' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-2/400/225',
      alt: 'Diplomatic meeting'
    },
    publishedAt: '2026-03-08T14:00:00.000Z',
    updatedAt: '2026-03-08T16:00:00.000Z',
    time: '2 days ago'
  },
  {
    id: '20000000-0000-4000-8000-000000000003',
    url: '/business/oil-markets-hormuz-risk',
    title: 'Oil markets brace for extended disruption as Hormuz fears mount',
    excerpt: "Brent crude futures have climbed more than 6% since Monday's session close.",
    categories: [{ name: 'Business', slug: 'business' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-3/400/225',
      alt: 'Oil refinery at night'
    },
    publishedAt: '2026-03-10T09:30:00.000Z',
    updatedAt: '2026-03-10T11:00:00.000Z',
    time: '3 hr ago'
  },
  {
    id: '20000000-0000-4000-8000-000000000004',
    url: '/politics/congress-iran-briefing',
    title: 'Congress demands classified briefing on Hormuz strikes',
    excerpt: 'Senior lawmakers on both sides of the aisle are pressing the White House for details.',
    categories: [{ name: 'Politics', slug: 'politics' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-4/400/225',
      alt: 'Capitol building'
    },
    publishedAt: '2026-03-10T11:45:00.000Z',
    updatedAt: '2026-03-10T12:30:00.000Z',
    time: '1 hr ago'
  },
  {
    id: '20000000-0000-4000-8000-000000000005',
    url: '/world/eu-middle-east-response',
    title: 'EU calls for emergency consultations on Middle East security',
    excerpt: "The bloc's foreign policy chief convened an urgent videoconference with regional envoys.",
    categories: [{ name: 'World', slug: 'world' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-5/400/225',
      alt: 'EU flag and flags of member states'
    },
    publishedAt: '2026-03-10T10:15:00.000Z',
    updatedAt: '2026-03-10T10:15:00.000Z',
    time: '4 hr ago'
  },
  {
    id: '20000000-0000-4000-8000-000000000006',
    url: '/world/iran-proxy-networks-explainer',
    title: "Iran's regional network: who are the affiliated groups?",
    excerpt: 'An explainer on the interconnected proxy forces Tehran uses across the Middle East.',
    categories: [{ name: 'World', slug: 'world' }],
    featuredImage: {
      url: 'https://picsum.photos/seed/livestory-rel-6/400/225',
      alt: 'Middle East political map'
    },
    publishedAt: '2026-03-07T12:00:00.000Z',
    updatedAt: '2026-03-07T14:00:00.000Z',
    time: '3 days ago'
  }
];

export const liveStoryFixture: CanonicalArticle = {
  id: 'b2a14e6c-7f3d-4a90-bc11-f9d2e3a7b5c0',
  slug: '/world/hormuz-strikes-live-march-10',
  layout: 'live-story',
  canonicalUrl: 'https://fifthbell.com/world/hormuz-strikes-live-march-10',
  contentVersion: '2026-03-10T14:00:00.000Z',
  publishedAt: '2026-03-10T06:00:00.000Z',
  updatedAt: '2026-03-10T13:45:00.000Z',
  status: 'published',
  title: 'Middle East Live Updates: U.S. Says It Struck 16 Mine-Laying Vessels Near the Strait of Hormuz',
  dek: 'Follow the latest on a fast-moving military and diplomatic situation.',
  excerpt:
    'The United States military confirmed strikes on 16 vessels identified as Iranian-affiliated mine-laying ships in international waters near the Strait of Hormuz, as regional tensions enter a new phase.',
  language: 'en',
  featured: true,
  authors: [
    { name: 'International Desk', slug: 'international-desk' },
    { name: 'Security Correspondent', slug: 'security-desk' }
  ],
  categories: [{ name: 'World', slug: 'world' }],
  featuredImage: {
    url: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5ce?w=1600&h=900&fit=crop',
    alt: 'Warships at sea at dusk near the Gulf of Oman'
  },
  navigation: { categories: navigationCategories },
  seo: {
    metaTitle: 'Middle East Live Updates: U.S. Strikes Mine-Laying Vessels | fifthbell',
    metaDescription: 'Live coverage of U.S. military strikes on mine-laying vessels near the Strait of Hormuz and the diplomatic fallout across the region.'
  },
  liveStory: {
    lastUpdated: 'March 10, 2026 at 1:45 PM ET',
    keyPoints: [
      'U.S. Central Command confirmed strikes on 16 Iranian-affiliated mine-laying vessels in international waters near the Strait of Hormuz.',
      "Iran's foreign ministry called the strikes 'an unprovoked act of aggression' and summoned the Swiss ambassador.",
      'Crude oil futures rose more than 4% on news of the strikes, with Brent crude approaching $112 per barrel.',
      'All U.S. personnel involved in the operation returned safely, according to a Pentagon spokesperson.',
      'The European Union called for emergency consultations among member states with naval assets in the region.',
      'Several major shipping companies have begun temporarily rerouting tankers away from the strait as a precautionary measure.'
    ]
  },
  body: [
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T13:45:00.000Z',
      headline: 'U.S. Central Command releases post-strike damage assessment',
      html: '<p>Officials confirmed all 16 vessels were destroyed or disabled, with no U.S. personnel injured in the operation. The assessment was conducted using surveillance imagery from assets operating in the area. A full operational briefing is expected before the end of the business day.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T12:30:00.000Z',
      headline: 'Crude oil prices spike more than 4% on Strait closure fears',
      html: '<p>Brent crude futures surged to $111.80 per barrel in midday trading, a gain of 4.2% from Monday\'s close. Analysts cited uncertainty over tanker traffic through the Strait of Hormuz, which handles approximately 20% of global seaborne oil trade.</p><p>"Markets are pricing in a disruption scenario," said one energy analyst at a major investment bank. "The question is how sustained it will be."</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T11:55:00.000Z',
      headline: "Iran summons Swiss ambassador, condemns strikes as 'flagrant violation'",
      html: '<p>Iran\'s foreign ministry summoned the Swiss ambassador — who represents U.S. interests in Tehran — to formally protest the military action. A ministry spokesperson described the strikes as "a flagrant violation of international law and an unprovoked act of aggression," adding that Iran reserves the right to respond.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T11:10:00.000Z',
      headline: 'Pentagon holds press briefing, confirms operation details',
      html: '<p>The Defense Department confirmed that strikes were carried out targeting vessels assessed to be engaged in mine-laying operations in international waters. A spokesperson said the action was taken in accordance with the laws of armed conflict and in defense of freedom of navigation. No information was provided on casualties aboard the targeted vessels.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T10:20:00.000Z',
      headline: 'European Union calls for urgent de-escalation',
      html: '<p>The EU\'s High Representative for Foreign Affairs issued a statement calling for "urgent de-escalation" and announcing an emergency consultation among member states with naval assets currently deployed to the region. The EU\'s maritime security mission has been operating in the area for the past 14 months.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T09:05:00.000Z',
      headline: 'White House confirms president approved the operation in advance',
      html: '<p>A senior administration official said the president was briefed and approved the military strikes as a proportional response to what was characterized as "an imminent threat to freedom of navigation in international waters." Congressional leaders on key security committees are expected to receive classified briefings later in the day.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T07:38:00.000Z',
      headline: 'Shipping companies begin rerouting tankers away from the Strait',
      html: '<p>Several major oil tanker operators have begun temporarily rerouting vessels away from the Strait of Hormuz as a precautionary measure. Industry group INTERTANKO said it was closely monitoring the situation and advising members to follow their risk-assessment protocols. The longer Cape of Good Hope route adds approximately 10–15 days to journeys from the Gulf to European markets.</p>'
    },
    {
      type: 'liveUpdate',
      timestamp: '2026-03-10T06:15:00.000Z',
      headline: 'U.S. military confirms overnight strikes on 16 mine-laying vessels',
      html: "<p>U.S. Central Command released a statement in the early morning hours confirming that American naval forces struck 16 vessels identified as Iranian-affiliated mine-laying ships in international waters near the Strait of Hormuz. The statement described the operation as a defensive measure intended to protect freedom of navigation in one of the world's most critical shipping lanes.</p>"
    }
  ],
  articles: relatedArticles
};
