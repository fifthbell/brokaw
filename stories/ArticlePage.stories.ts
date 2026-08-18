import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadArticlePreviewData } from './preview-data';

const meta = {
  title: 'Pages/ArticlePage',
  loaders: [async () => ({ articlePage: await loadArticlePreviewData() })],
  render: (args, { loaded }) =>
    render({ ...(loaded.articlePage as CanonicalArticle), ...args })
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Current: Story = {
  render: (_args, { loaded }) => render(loaded.articlePage as CanonicalArticle),
  parameters: {
    controls: {
      disable: true
    }
  }
};

export const UpdatedVersion: Story = {
  render: (_args, { loaded }) =>
    render({
      ...(loaded.articlePage as CanonicalArticle),
      updatedVersion: {
        id: 'replacement-article',
        title: 'Atlantic storm forecast expands after overnight model shift',
        url: '/weather/atlantic-storm-forecast-update'
      }
    }),
  parameters: {
    controls: {
      disable: true
    }
  }
};
