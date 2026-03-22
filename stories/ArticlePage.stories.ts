import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { articleFixture } from './fixtures/article.fixture';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadArticlePreviewData } from './preview-data';

const meta = {
  title: 'Pages/ArticlePage',
  render: (args) => render(args as typeof articleFixture),
  args: articleFixture
} satisfies Meta<typeof articleFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Current: Story = {
  loaders: [async () => ({ articlePage: await loadArticlePreviewData() })],
  render: (_args, { loaded }) => render(loaded.articlePage as CanonicalArticle),
  parameters: {
    controls: {
      disable: true
    }
  }
};
