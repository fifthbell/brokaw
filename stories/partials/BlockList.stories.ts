import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import listHbs from '../../src/templates/partials/blocks/list.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(listHbs);

const meta = {
  title: 'Partials/Blocks/List',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('list') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
