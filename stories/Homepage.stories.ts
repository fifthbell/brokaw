import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { homepageFixture, FIXTURE_NOW } from './fixtures/homepage.fixture';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadHomepagePreviewData } from './preview-data';

const sectionControls = {
  showHero: { control: 'boolean' },
  showEditorialHero: { control: 'boolean' },
  showBreakingNews: { control: 'boolean' },
  showTrending: { control: 'boolean' },
  showLanding: { control: 'boolean' },
  showMustRead: { control: 'boolean' },
  showMoreStories: { control: 'boolean' }
};

const meta = {
  title: 'Pages/Homepage',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => render({ ...(loaded.homepage as CanonicalArticle), ...args }),
  args: {
    showHero: true,
    showEditorialHero: false,
    showBreakingNews: true,
    showTrending: true,
    showLanding: true,
    showMustRead: true,
    showMoreStories: true
  },
  argTypes: sectionControls,
  parameters: {
    controls: {
      include: ['showHero', 'showEditorialHero', 'showBreakingNews', 'showTrending', 'showLanding', 'showMustRead', 'showMoreStories']
    }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showHero: true,
    showEditorialHero: true
  }
};

export const Current: Story = {
  name: 'Current',
  render: (_args, { loaded }) => render(loaded.homepage as CanonicalArticle),
  parameters: {
    controls: {
      disable: true
    }
  }
};

/**
 * 8 recent featured articles are available.
 * The first 6 fill the featured slots (newest-first); the remaining 2 float to
 * the top of the general queue ahead of non-featured articles.
 */
export const FeaturedOverflow: Story = {
  name: 'Featured: 8 recent (6 slots + 2 overflow to queue)',
  args: {
    showHero: false,
    showEditorialHero: false,
    showBreakingNews: false
  }
};

/**
 * All articles have featured:false so all 6 prominent slots fall back to the
 * general queue, filled by date descending.
 */
export const NoFeaturedArticles: Story = {
  name: 'Featured: none recent — all slots from queue',
  render: (args) => render(args as CanonicalArticle),
  args: {
    ...homepageFixture,
    showHero: false,
    showEditorialHero: false,
    showBreakingNews: false,
    articles: (homepageFixture.articles ?? []).map((a) => ({ ...a, featured: false }))
  }
};

/**
 * Breaking News is active: the first 5 queue articles are reserved for the
 * Breaking News candy-bar, pushing all other slots down by 5.
 */
export const WithBreakingNews: Story = {
  name: 'Breaking News: queue starts from Breaking News snacks',
  args: {
    showHero: false,
    showEditorialHero: false,
    showBreakingNews: true,
    showTrending: false
  }
};

/**
 * Verifies queue-fill order: Landing → Must Read → More Stories.
 * Only 3 featured articles exist so 3 featured slots are filled and the rest
 * come from the queue in date-desc order.
 */
export const PartialFeatured: Story = {
  name: 'Featured: 3 recent — partial fill, rest from queue',
  render: (args) => render(args as CanonicalArticle),
  args: {
    ...homepageFixture,
    showHero: false,
    showEditorialHero: false,
    showBreakingNews: false,
    articles: (homepageFixture.articles ?? []).map((a, i) => ({
      ...a,
      featured: i < 3 && new Date(a.publishedAt ?? 0).getTime() >= FIXTURE_NOW.getTime() - 24 * 3600 * 1000
    }))
  }
};
