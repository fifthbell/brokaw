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

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The full footer is the only site footer and is used by every page layout, including the 404 page.'
      }
    }
  }
};
