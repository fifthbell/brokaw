import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import paginationHbs from '../../src/templates/partials/components/ui/pagination.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(paginationHbs);

const meta = {
  title: 'Partials/UI/Pagination',
  render: (args) => template(args),
  args: {
    prev: { url: '/page/1', label: 'Prev' },
    next: { url: '/page/3', label: 'Next' },
    pages: [
      { label: 1, url: '/page/1' },
      { label: 2, current: true },
      { label: 3, url: '/page/3' },
      { label: 4, url: '/page/4' },
      { label: 5, url: '/page/5' }
    ]
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const WithEllipsis: Story = {
  args: {
    prev: { url: '/page/8', label: 'Prev' },
    next: { url: '/page/10', label: 'Next' },
    pages: [
      { label: 1, url: '/page/1' },
      { ellipsis: true },
      { label: 8, url: '/page/8' },
      { label: 9, current: true },
      { label: 10, url: '/page/10' },
      { ellipsis: true },
      { label: 42, url: '/page/42' }
    ]
  }
};

export const EdgeDisabled: Story = {
  args: {
    prev: { label: 'Prev' },
    next: { url: '/page/2', label: 'Next' },
    pages: [
      { label: 1, current: true },
      { label: 2, url: '/page/2' },
      { label: 3, url: '/page/3' }
    ]
  }
};
