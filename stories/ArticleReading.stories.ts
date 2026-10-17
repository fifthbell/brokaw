import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { canonicalArticleSchema, type CanonicalArticle } from '../src/types/canonical-article';
import fixture from './fixtures/article-reading.fixture.json';

// These published contract-1 documents need no preview-data service.
const meta = {
  title: 'Pages/Article reading',
  args: canonicalArticleSchema.parse(fixture.document),
  render: (args) => render(canonicalArticleSchema.parse(args)),
  parameters: { controls: { disable: true } }
} satisfies Meta<CanonicalArticle>;

export default meta;
type Story = StoryObj<typeof meta>;

// Inspect direct iframes at 236px, 306px, 390px, 768px and 1440px.
export const PublishedStory: Story = {};
export const WithLeadImage: Story = { args: { featuredImage: fixture.photo } };
export const WithUpdatedVersion: Story = { args: { updatedVersion: fixture.update } };
export const LongUnbrokenHeadline: Story = {
  args: {
    title: 'FictionalSupercalifragilisticexpialidociousNewsroomInvestigation',
    excerpt: 'FictionalUnbrokenExcerptRemainsReadableWithoutChangingItsSavedWords'
  }
};
export const MultipleAuthors: Story = {
  args: {
    authors: [
      { name: 'Elena Ortiz', slug: 'elena-ortiz' },
      { name: 'Marcus Chen', slug: 'marcus-chen' }
    ]
  }
};
