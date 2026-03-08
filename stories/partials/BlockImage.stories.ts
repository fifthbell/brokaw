import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import imageHbs from '../../src/templates/partials/blocks/image.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(imageHbs);

const meta = {
  title: 'Partials/Blocks/Image',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'image') ?? { url: '', alt: '' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
