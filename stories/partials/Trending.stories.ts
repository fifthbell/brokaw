import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import trendingHbs from '../../src/templates/partials/components/trending.hbs?raw';

const template = Handlebars.compile(trendingHbs);

const meta = {
  title: 'Partials/Trending',
  render: (args) => template(args),
  args: {},
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
