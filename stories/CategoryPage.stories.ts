import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { categoryFixture } from './fixtures/category.fixture';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadCategoryPreviewData } from './preview-data';

const meta = {
  title: 'Pages/CategoryPage',
  render: (args) => render(args as typeof categoryFixture),
  args: categoryFixture
} satisfies Meta<typeof categoryFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Current: Story = {
  loaders: [async () => ({ categoryPage: await loadCategoryPreviewData('sports') })],
  render: (_args, { loaded }) => render(loaded.categoryPage as CanonicalArticle),
  parameters: {
    controls: {
      disable: true
    }
  }
};
