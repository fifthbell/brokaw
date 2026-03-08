import type { CanonicalArticle, SelfReference } from '../../src/types/canonical-article';

const category = { name: 'World', slug: 'world' };

const makeWorldArticle = (index: number): SelfReference => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  slug: `/world/dispatch-${index + 1}`,
  title: `World dispatch ${index + 1}`,
  excerpt: `Key update from international desk report ${index + 1}.`,
  categories: [category],
  featuredImage: {
    url: `https://picsum.photos/seed/fifthbell-world-${index + 1}/1280/720`,
    alt: `World report image ${index + 1}`
  },
  publishedAt: `2026-03-${String((index % 8) + 1).padStart(2, '0')}T08:00:00.000Z`,
  updatedAt: `2026-03-${String((index % 8) + 1).padStart(2, '0')}T12:00:00.000Z`
});

export const categoryFixture: CanonicalArticle = {
  id: '5f73e916-bf00-4c2d-a1cb-ce2f4573fcd1',
  slug: '/world',
  layout: 'category-page',
  canonicalUrl: 'https://fifthbell.com/world',
  contentVersion: '2026-03-08T12:00:00.000Z',
  publishedAt: '2026-03-08T07:30:00.000Z',
  updatedAt: '2026-03-08T12:00:00.000Z',
  status: 'published',
  title: 'World',
  excerpt: 'Latest global coverage and international analysis.',
  language: 'en',
  featured: true,
  authors: [{ name: 'International Desk', slug: 'international-desk' }],
  categories: [category],
  featuredImage: {
    url: 'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=1280&h=720&fit=crop',
    alt: 'Global map backdrop'
  },
  body: [],
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
  articles: Array.from({ length: 28 }, (_, index) => makeWorldArticle(index))
};
