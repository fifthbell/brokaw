import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import scrollAreaHbs from '../../src/templates/partials/components/ui/scroll-area.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(scrollAreaHbs);

const listItems = Array.from({ length: 20 }, (_, index) => {
  const item = index + 1;
  return `<li class='rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'>Live update #${item}</li>`;
}).join('');

const wideContent = `
<div class="inline-flex gap-3 pb-2">
  ${Array.from({ length: 10 }, (_, index) => `<div class="min-w-[220px] rounded-md border border-slate-200 bg-white p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">Card ${index + 1}</div>`).join('')}
</div>
`;

const meta = {
  title: 'Partials/UI/ScrollArea',
  render: (args) => template(args),
  args: {
    orientation: 'vertical',
    maxHeight: '220px',
    content: `<ul class='space-y-2'>${listItems}</ul>`,
    className: 'rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40'
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Vertical: Story = {};

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
    maxHeight: 'auto',
    content: wideContent,
    className: 'rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40'
  }
};

export const BothAxes: Story = {
  args: {
    orientation: 'both',
    maxHeight: '180px',
    content: `<div class='w-[1200px]'>${wideContent}${wideContent}</div>`,
    className: 'rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950/40'
  }
};
