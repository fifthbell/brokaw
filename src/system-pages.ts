import type { searchCopyByLanguage } from './search-copy.js';
import type { SystemPage } from './types/cronkite-manifest.generated.js';

export type Language = keyof typeof searchCopyByLanguage;

export const systemDocument = (
  layout: '404' | 'search-page' | 'media-page',
  language: Language,
  slug: string,
  title: string,
  excerpt: string,
  extra: Record<string, unknown> = {},
) => ({
  id: `system-${layout}-${language}`,
  slug,
  canonicalUrl: `https://fifthbell.com${slug}`,
  contentVersion: '2026-09-21T00:00:00.000Z',
  publishedAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
  status: 'published',
  title,
  excerpt,
  language,
  featured: false,
  body: [],
  layout,
  authors: [{ name: 'Fifthbell Newsroom', slug: 'fifthbell-newsroom' }],
  categories: [],
  navigation: { categories: [] },
  logoLink: language === 'en' ? '/' : `/${language}`,
  seo: {
    metaTitle: `${title} | fifthbell`,
    metaDescription: excerpt,
  },
  ...extra,
});

export const mediathekSystemPage = {
  renderable: 'media-page',
  contentType: 'text/html; charset=utf-8',
  cacheControl: 'public, max-age=0, must-revalidate',
  variants: [{
    key: 'html/mediathek/index.html',
    document: systemDocument('media-page', 'en', '/mediathek', 'Mediathek', 'Browse photos from Fifthbell assignments.'),
  }],
} as const satisfies SystemPage;
