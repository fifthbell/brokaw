import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryMainGridHbs from '../../src/templates/partials/components/category/main-grid.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadCategoryPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(categoryMainGridHbs);

const meta = {
  title: 'Partials/Category/MainGrid',
  loaders: [async () => ({ category: await loadCategoryPreviewData('sports') })],
  render: (args, { loaded }) => template({ ...loaded.category, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
