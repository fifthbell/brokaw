import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import loadingSpinnerHbs from '../../src/templates/partials/components/ui/loading-spinner.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const spinnerTemplate = Handlebars.compile(loadingSpinnerHbs);
const frameTemplate = Handlebars.compile(
  "<div class='flex min-h-[120px] items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 p-6'>{{> components/ui/loading-spinner}}</div>"
);

Handlebars.registerPartial('components/ui/loading-spinner', loadingSpinnerHbs);

const meta = {
  title: 'Partials/UI/LoadingSpinner',
  render: (args) => frameTemplate(args),
  args: {
    size: 'md',
    label: 'Loading'
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Small: Story = {
  render: (args) => spinnerTemplate(args),
  args: {
    size: 'sm',
    label: 'Loading'
  }
};

export const Large: Story = {
  render: (args) => spinnerTemplate(args),
  args: {
    size: 'lg',
    label: 'Loading'
  }
};
