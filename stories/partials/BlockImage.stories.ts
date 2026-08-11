import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import imageHbs from '../../src/templates/partials/blocks/image.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(imageHbs);

const meta = {
  title: 'Partials/Blocks/Image',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('image') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
