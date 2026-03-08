import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryHeaderHbs from '../../src/templates/partials/components/category/header.hbs?raw';
import { categoryFixture } from '../fixtures/category.fixture';

const template = Handlebars.compile(categoryHeaderHbs);

const meta = {
  title: 'Partials/Category/Header',
  render: (args) => template(args),
  args: categoryFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
