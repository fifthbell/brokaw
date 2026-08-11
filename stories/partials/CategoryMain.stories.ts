import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryMainHbs from '../../src/templates/partials/components/category/main.hbs?raw';
import categoryHeaderHbs from '../../src/templates/partials/components/category/header.hbs?raw';
import categoryMainGridHbs from '../../src/templates/partials/components/category/main-grid.hbs?raw';
import categoryMoreGridHbs from '../../src/templates/partials/components/category/more-grid.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadCategoryPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/category/header', categoryHeaderHbs);
Handlebars.registerPartial('components/category/main-grid', categoryMainGridHbs);
Handlebars.registerPartial('components/category/more-grid', categoryMoreGridHbs);
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(categoryMainHbs);

const meta = {
  title: 'Partials/Category/Main',
  loaders: [async () => ({ category: await loadCategoryPreviewData('sports') })],
  render: (args, { loaded }) => template({ ...loaded.category, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
