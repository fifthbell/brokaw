import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import categoryHeaderHbs from '../../src/templates/partials/components/category/header.hbs?raw';
import { loadCategoryPreviewData } from '../preview-data';

const template = Handlebars.compile(categoryHeaderHbs);

const meta = {
  title: 'Partials/Category/Header',
  loaders: [async () => ({ category: await loadCategoryPreviewData('sports') })],
  render: (args, { loaded }) => template({ ...loaded.category, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
