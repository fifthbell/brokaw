import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import navCategoriesHbs from '../../src/templates/partials/nav/nav-categories.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(navCategoriesHbs);

const meta = {
  title: 'Partials/Nav/Categories',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
