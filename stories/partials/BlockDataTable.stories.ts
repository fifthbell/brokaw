import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import dataTableHbs from '../../src/templates/partials/blocks/data-table.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(dataTableHbs);

const meta = {
  title: 'Partials/Blocks/DataTable',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('dataTable') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
