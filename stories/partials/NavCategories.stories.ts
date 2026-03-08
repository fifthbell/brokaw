import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import navCategoriesHbs from '../../src/templates/partials/nav/nav-categories.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(navCategoriesHbs);

const meta = {
  title: 'Partials/Nav/Categories',
  render: (args) => template(args),
  args: homepageFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
