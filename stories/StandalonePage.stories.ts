import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { completeDocument } from './complete-document';
import { articleFixture } from './fixtures/article.fixture';

const standaloneFixture: CanonicalArticle = {
  ...articleFixture,
  id: 'standalone-about-fifthbell',
  slug: '/about',
  canonicalUrl: 'https://fifthbell.com/about',
  layout: 'standalone-page',
  title: 'About Fifthbell',
  dek: 'Independent reporting built for a global audience.',
  excerpt: 'Learn how the Fifthbell newsroom works.',
  body: [
    { type: 'richText', html: '<p>Fifthbell publishes timely reporting, context, and analysis.</p>' },
    { type: 'heading', level: 2, text: 'Our standards' },
    { type: 'richText', html: '<p>Every story is reviewed for clarity, accuracy, and relevance.</p>' },
  ],
};

const meta = {
  title: 'Pages/StandalonePage',
  render: (args) => render(completeDocument(args as CanonicalArticle)),
  args: standaloneFixture,
} satisfies Meta<CanonicalArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
