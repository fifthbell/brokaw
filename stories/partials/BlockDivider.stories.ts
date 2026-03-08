import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import dividerHbs from '../../src/templates/partials/blocks/divider.hbs?raw';

const template = Handlebars.compile(dividerHbs);

const meta = {
  title: 'Partials/Blocks/Divider',
  render: (args) => template(args),
  args: { type: 'divider' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
