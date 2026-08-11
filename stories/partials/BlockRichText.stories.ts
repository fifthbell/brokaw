import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import richTextHbs from '../../src/templates/partials/blocks/rich-text.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(richTextHbs);

const meta = {
  title: 'Partials/Blocks/RichText',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('richText') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
