import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import instagramHbs from '../../src/templates/partials/blocks/instagram.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(instagramHbs);

const meta = {
  title: 'Partials/Blocks/Instagram',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'instagram') ?? { url: 'https://www.instagram.com' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  args: {
    data: {
      "type": "instagram",
      "url": "https://www.instagram.com/p/DVdDTYNjct_"
    }
  }
};
