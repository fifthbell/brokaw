import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { articleFixture } from './fixtures/article.fixture';

const meta = {
  title: 'Pages/ArticlePage',
  render: (args) => render(args as typeof articleFixture),
  args: articleFixture
} satisfies Meta<typeof articleFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
