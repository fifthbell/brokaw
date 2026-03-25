import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import iconButtonHbs from '../../src/templates/partials/components/ui/icon-button.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(iconButtonHbs);

const plusIcon = `
<svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5" aria-hidden="true">
  <path fill-rule="evenodd" d="M10 4.25a.75.75 0 0 1 .75.75v4.25H15a.75.75 0 0 1 0 1.5h-4.25V15a.75.75 0 0 1-1.5 0v-4.25H5a.75.75 0 0 1 0-1.5h4.25V5a.75.75 0 0 1 .75-.75Z" clip-rule="evenodd"></path>
</svg>
`;

const meta = {
  title: 'Partials/UI/IconButton',
  render: (args) => template(args),
  args: {
    icon: plusIcon,
    ariaLabel: 'Add item',
    title: 'Add item'
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const AsLink: Story = {
  args: {
    icon: plusIcon,
    href: '/new',
    ariaLabel: 'Create new record',
    title: 'Create new record'
  }
};

export const Rounded: Story = {
  args: {
    icon: plusIcon,
    shape: 'rounded',
    ariaLabel: 'Add item',
    title: 'Add item'
  }
};

export const Square: Story = {
  args: {
    icon: plusIcon,
    shape: 'square',
    ariaLabel: 'Add item',
    title: 'Add item'
  }
};
