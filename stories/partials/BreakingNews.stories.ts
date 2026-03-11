import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import breakingNewsHbs from '../../src/templates/partials/components/breaking-news.hbs?raw';
import primaryHbs from '../../src/templates/partials/components/breaking-news/primary.hbs?raw';
import secondaryHbs from '../../src/templates/partials/components/breaking-news/secondary.hbs?raw';
import liveUpdatesColumnHbs from '../../src/templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import candyBarHbs from '../../src/templates/partials/components/breaking-news/candy-bar.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

Handlebars.registerPartial('components/breaking-news/primary', primaryHbs);
Handlebars.registerPartial('components/breaking-news/secondary', secondaryHbs);
Handlebars.registerPartial('components/breaking-news/live-updates-column', liveUpdatesColumnHbs);
Handlebars.registerPartial('components/breaking-news/candy-bar', candyBarHbs);
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(breakingNewsHbs);

const meta = {
  title: 'Partials/BreakingNews',
  render: (args) => template(args),
  args: homepageFixture.breakingNews
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
