import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { categoryFixture } from './fixtures/category.fixture';

const meta = {
  title: 'Pages/CategoryPage',
  render: (args) => render(args as typeof categoryFixture),
  args: categoryFixture
} satisfies Meta<typeof categoryFixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
