import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import footerFullHbs from '../../src/templates/partials/footers/footer-full.hbs?raw';

const template = Handlebars.compile(footerFullHbs);

const meta = {
  title: 'Partials/Footers/Full',
  render: (args) => template(args),
  args: {},
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
