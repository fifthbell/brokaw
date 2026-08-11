import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadCategoryPreviewData } from './preview-data';

const meta = {
  title: 'Pages/CategoryPage',
  loaders: [async () => ({ categoryPage: await loadCategoryPreviewData('sports') })],
  render: (args, { loaded }) => render({ ...(loaded.categoryPage as CanonicalArticle), ...args })
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Current: Story = {
  render: (_args, { loaded }) => render(loaded.categoryPage as CanonicalArticle),
  parameters: {
    controls: {
      disable: true
    }
  }
};
