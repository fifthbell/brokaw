import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryMoreGridHbs from '../../src/templates/partials/components/category/more-grid.hbs?raw';
import { loadCategoryPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(categoryMoreGridHbs);

const meta = {
  title: 'Partials/Category/MoreGrid',
  loaders: [async () => ({ category: await loadCategoryPreviewData('sports') })],
  render: (args, { loaded }) => template({ ...loaded.category, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
