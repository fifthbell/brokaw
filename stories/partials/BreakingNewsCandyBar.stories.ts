import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import rightSidebarColumnHbs from '../../src/templates/partials/components/breaking-news/candy-bar.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(rightSidebarColumnHbs);

const meta = {
  title: 'Partials/BreakingNews/CandyBar',
  render: (args) => template(args),
  args: { snacks: homepageFixture.breakingNews.snacks }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
