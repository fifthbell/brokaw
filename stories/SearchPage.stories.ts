import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { loadSearchPagePreviewData } from './preview-data';

const meta = {
  title: 'Pages/SearchPage',
  loaders: [async () => ({ searchPage: await loadSearchPagePreviewData() })],
  render: (args, { loaded }) => render({ ...(loaded.searchPage as CanonicalArticle), ...args })
} satisfies Meta<CanonicalArticle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ClientSideOnly: Story = {
  name: 'Client-side only submit',
  parameters: {
    docs: {
      description: {
        story:
          'When rendered on /search, submit updates query params and reruns results client-side. Matching results are shown newest-first by published date. If rendered outside search route context, normal navigation is allowed.'
      }
    }
  }
};
