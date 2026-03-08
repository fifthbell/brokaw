import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import richTextHbs from '../../src/templates/partials/blocks/rich-text.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(richTextHbs);

const meta = {
  title: 'Partials/Blocks/RichText',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'richText') ?? { html: '<p>Sample rich text.</p>' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
