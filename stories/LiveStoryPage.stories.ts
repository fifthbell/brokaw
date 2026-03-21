import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { loadLiveStoryPreviewData } from './preview-data';

const meta = {
  title: 'Pages/LiveStoryPage',
  loaders: [async () => ({ liveStory: await loadLiveStoryPreviewData() })],
  render: (_args, { loaded }) => render(loaded.liveStory)
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
