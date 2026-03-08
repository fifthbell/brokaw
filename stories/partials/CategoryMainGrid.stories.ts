import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryMainGridHbs from '../../src/templates/partials/components/category/main-grid.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { categoryFixture } from '../fixtures/category.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(categoryMainGridHbs);

const meta = {
  title: 'Partials/Category/MainGrid',
  render: (args) => template(args),
  args: categoryFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
