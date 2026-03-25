import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import accordionHbs from '../../src/templates/partials/components/ui/accordion.hbs?raw';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(accordionHbs);

const baseItems = [
  {
    title: 'What is changing in Breaking News?',
    subtitle: 'Layout update',
    content:
      '<p>The section now uses two columns: pre-live content on the left and live updates on the right.</p>',
    open: true
  },
  {
    title: 'Does this affect homepage article distribution?',
    subtitle: 'Queue behavior',
    content:
      '<p>No queue reservation is needed now that the candybar is removed, so slot distribution stays stable.</p>'
  },
  {
    title: 'Can editors keep sending legacy fields?',
    subtitle: 'Compatibility',
    content:
      '<p>Yes. Legacy fields can still exist in payloads, but they are no longer rendered in the new layout.</p>'
  }
];

const meta = {
  title: 'Partials/UI/Accordion',
  render: (args) => template(args),
  args: {
    items: baseItems
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const Collapsed: Story = {
  args: {
    items: baseItems.map((item) => ({ ...item, open: false }))
  }
};
