import { describe, expect, it } from 'vitest';
import { canonicalArticleSchema } from './types/canonical-article.js';

describe('updated article version', () => {
  it('preserves a valid updated-version reference for article rendering', () => {
    const parsed = canonicalArticleSchema.parse({
      id: 'source-article',
      slug: '/news/source-article',
      layout: 'article-page',
      canonicalUrl: 'https://fifthbell.com/news/source-article',
      contentVersion: '2026-08-17T12:00:00.000Z',
      publishedAt: '2026-08-17T10:00:00.000Z',
      updatedAt: '2026-08-17T12:00:00.000Z',
      status: 'published',
      title: 'Original story',
      language: 'en',
      featured: false,
      authors: [],
      categories: [],
      body: [],
      updatedVersion: {
        id: 42,
        title: 'The current version of the story',
        url: '/news/current-version'
      }
    });

    expect(parsed.updatedVersion).toEqual({
      id: '42',
      title: 'The current version of the story',
      url: '/news/current-version'
    });
  });
});
