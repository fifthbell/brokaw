import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import breadcrumbHbs from '../../src/templates/partials/components/ui/breadcrumb.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(breadcrumbHbs);

const meta = {
  title: 'Partials/UI/Breadcrumb',
  render: (args) => template(args),
  args: {
    items: [
      { label: 'Home', url: '/' },
      { label: 'World', url: '/world' },
      { label: 'Live Coverage', url: '/world/live-coverage' },
      { label: 'Storm Response Timeline', url: '/world/live-coverage/storm-response' }
    ]
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const ShortPath: Story = {
  args: {
    items: [
      { label: 'Home', url: '/' },
      { label: 'Sports', url: '/sports' },
      { label: 'Match Center', url: '/sports/match-center' }
    ]
  }
};
