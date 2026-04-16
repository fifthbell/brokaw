import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';

const nowIso = new Date().toISOString();

const searchPageFixture: CanonicalArticle = {
  id: 'search-story',
  slug: '/search',
  layout: 'search-page',
  canonicalUrl: 'https://fifthbell.com/search',
  contentVersion: nowIso,
  publishedAt: nowIso,
  updatedAt: nowIso,
  status: 'published',
  title: 'Search',
  excerpt: 'Search current-language stories from Fifthbell.',
  language: 'en',
  featured: false,
  authors: [{ name: 'Fifthbell Desk', slug: 'fifthbell-desk' }],
  categories: [{ name: 'Top Stories', slug: 'top-stories' }],
  body: [],
  seo: {
    metaTitle: 'Search | fifthbell',
    metaDescription: 'Search current-language stories from Fifthbell.'
  },
  navigation: {
    categories: [
      { name: 'World', slug: 'world' },
      { name: 'Business', slug: 'business' },
      { name: 'Sports', slug: 'sports' }
    ]
  },
  articles: []
};

const meta = {
  title: 'Pages/SearchPage',
  render: (args) => render(args as CanonicalArticle),
  args: searchPageFixture
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClientSideOnly: Story = {
  name: 'Client-side only submit',
  args: {
    ...searchPageFixture
  },
  parameters: {
    docs: {
      description: {
        story:
          'When rendered on /search, submit updates query params and reruns results client-side. Matching results are shown newest-first by published date. If rendered outside search route context, normal navigation is allowed.'
      }
    }
  }
};
