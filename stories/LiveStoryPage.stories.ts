import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { liveStoryFixture } from './fixtures/live-story.fixture';

const meta = {
  title: 'Pages/LiveStoryPage',
  render: (args) => render(args as typeof liveStoryFixture),
  args: liveStoryFixture
} satisfies Meta<typeof liveStoryFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
