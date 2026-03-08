import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import footerMinimalHbs from '../../src/templates/partials/footers/footer-minimal.hbs?raw';

const template = Handlebars.compile(footerMinimalHbs);

const meta = {
  title: 'Partials/Footers/Minimal',
  render: (args) => template(args),
  args: {},
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
