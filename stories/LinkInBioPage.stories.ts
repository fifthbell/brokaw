import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadLinkInBioPreviewData } from './preview-data';

const meta = {
  title: 'Pages/LinkInBioPage',
  loaders: [async () => ({ linkInBio: await loadLinkInBioPreviewData() })],
  render: (args, { loaded }) => render({ ...(loaded.linkInBio as CanonicalArticle), ...args }),
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
  render: (_args, { loaded }) => {
    const current = loaded.linkInBio as CanonicalArticle;
    const articles = current.articles ?? [];
    return render({
      ...current,
      articles: [...articles, ...articles.slice(0, 8).map((article, index) => ({ ...article, id: `${article.id}-dense-${index}` }))]
    });
  }
};
