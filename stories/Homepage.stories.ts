import type { Meta, StoryObj } from '@storybook/html';
import { render } from '../src/renderer.browser';
import { homepageFixture } from './fixtures/homepage.fixture';

const sectionControls = {
  showHero: { control: 'boolean' },
  showEditorialHero: { control: 'boolean' },
  showBreakingNews: { control: 'boolean' },
  showTrending: { control: 'boolean' },
  showLanding: { control: 'boolean' },
  showMustRead: { control: 'boolean' },
  showMoreStories: { control: 'boolean' }
};

const meta = {
  title: 'Pages/Homepage',
  render: (args) => render(args as typeof homepageFixture),
  args: {
    ...homepageFixture,
    showHero: true,
    showEditorialHero: false,
    showBreakingNews: true,
    showTrending: true,
    showLanding: true,
    showMustRead: true,
    showMoreStories: true
  },
  argTypes: sectionControls,
  parameters: {
    controls: {
      include: ['showHero', 'showEditorialHero', 'showBreakingNews', 'showTrending', 'showLanding', 'showMustRead', 'showMoreStories']
    }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    showHero: true,
    showEditorialHero: true
  }
};
