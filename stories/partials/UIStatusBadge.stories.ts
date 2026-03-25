import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import statusBadgeHbs from '../../src/templates/partials/components/ui/status-badge.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(statusBadgeHbs);

const meta = {
  title: 'Partials/UI/StatusBadge',
  render: (args) => template(args),
  args: {
    label: 'Live',
    variant: 'live',
    description: 'Feed connected'
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Live: Story = {};

export const Offline: Story = {
  args: {
    label: 'Offline',
    variant: 'offline',
    description: 'No signal'
  }
};

export const Warning: Story = {
  args: {
    label: 'Degraded',
    variant: 'warning',
    description: 'Delayed updates'
  }
};

export const Info: Story = {
  args: {
    label: 'Info',
    variant: 'info',
    description: 'Background sync enabled'
  }
};

export const Default: Story = {
  args: {
    label: 'Idle',
    variant: 'default',
    description: 'No active stream'
  }
};
