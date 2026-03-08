import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryMoreGridHbs from '../../src/templates/partials/components/category/more-grid.hbs?raw';
import { categoryFixture } from '../fixtures/category.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(categoryMoreGridHbs);

const meta = {
  title: 'Partials/Category/MoreGrid',
  render: (args) => template(args),
  args: categoryFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
