import type { CanonicalArticle, SelfReference } from '../../src/types/canonical-article';

const categories = [
  { name: 'World', slug: 'world' },
  { name: 'Sports', slug: 'sports' },
  { name: 'Business', slug: 'business' },
  { name: 'Culture', slug: 'culture' }
];

const articles: SelfReference[] = [
  {
    id: '70000000-0000-4000-8000-000000000001',
    url: '/world/summit-leaders-reach-framework',
    title: 'Leaders reach a late framework after a tense summit',
    excerpt: 'Negotiators said the agreement creates a narrow path for follow-up talks.',
    categories: [categories[0]],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=900&h=900&fit=crop',
      alt: 'City skyline at dusk'
    },
    publishedAt: '2026-04-27T12:10:00.000Z',
    updatedAt: '2026-04-27T12:28:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000002',
    url: '/sports/final-whistle-sets-up-title-run',
    title: 'Final whistle sets up a title run nobody saw coming',
    excerpt: 'The underdogs keep finding another gear in the closing minutes.',
    categories: [categories[1]],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=900&h=900&fit=crop',
      alt: 'Soccer ball on a field'
    },
    publishedAt: '2026-04-27T11:45:00.000Z',
    updatedAt: '2026-04-27T12:03:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000003',
    url: '/business/markets-open-higher-after-earnings',
    title: 'Markets open higher as earnings reset expectations',
    excerpt: 'Investors moved back into growth names after a volatile week.',
    categories: [categories[2]],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=900&h=900&fit=crop',
      alt: 'Market chart on a trading screen'
    },
    publishedAt: '2026-04-27T10:30:00.000Z',
    updatedAt: '2026-04-27T11:00:00.000Z'
  },
  {
    id: '70000000-0000-4000-8000-000000000004',
    url: '/culture/new-exhibition-reframes-modern-design',
    title: 'New exhibition reframes the quiet side of modern design',
    excerpt: 'Curators focused on everyday objects that changed public life.',
    categories: [categories[3]],
    featuredImage: {
      url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900&h=900&fit=crop',
      alt: 'Gallery interior with framed work'
    },
    publishedAt: '2026-04-27T09:20:00.000Z',
    updatedAt: '2026-04-27T09:55:00.000Z'
  }
];

export const linkInBioFixture: CanonicalArticle = {
  id: 'link-in-bio',
  slug: '/instagram',
  layout: 'link-in-bio',
  canonicalUrl: 'https://fifthbell.com/instagram',
  contentVersion: '2026-04-27T12:30:00.000Z',
  publishedAt: '2026-04-27T12:30:00.000Z',
  updatedAt: '2026-04-27T12:30:00.000Z',
  status: 'published',
  title: 'Top Stories',
  excerpt: 'Tap a story to read the full article.',
  language: 'en',
  featured: false,
  authors: [{ name: 'Fifthbell Desk', slug: 'fifthbell-desk' }],
  categories: [{ name: 'Top Stories', slug: 'top-stories' }],
  featuredImage: articles[0].featuredImage,
  body: [],
  seo: {
    metaTitle: 'Top Stories | fifthbell',
    metaDescription: 'Tap a story to read the full article.',
    ogImage: articles[0].featuredImage?.url
  },
  navigation: {
    categories
  },
  articles
};
