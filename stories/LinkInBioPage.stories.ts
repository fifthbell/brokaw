import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { linkInBioFixture } from './fixtures/link-in-bio.fixture';

const meta = {
  title: 'Pages/LinkInBioPage',
  render: (args) => render(args as CanonicalArticle),
  args: linkInBioFixture,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    }
  }
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DenseGrid: Story = {
  args: {
    ...linkInBioFixture,
    articles: [
      ...(linkInBioFixture.articles || []),
      ...(linkInBioFixture.articles || []).map((article, index) => ({
        ...article,
        id: `${article.id}-extra-${index}`,
        title: `${article.title} update`
      }))
    ]
  }
};
