import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { loadLiveStoryPreviewData } from './preview-data';
import type { CanonicalArticle } from '../src/types/canonical-article';
import { completeDocument } from './complete-document';

const meta = {
  title: 'Pages/LiveStoryPage',
  loaders: [async () => ({ liveStory: await loadLiveStoryPreviewData() })],
  render: (_args, { loaded }) => render(completeDocument(loaded.liveStory as CanonicalArticle))
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
