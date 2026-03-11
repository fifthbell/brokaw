import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import moreStoriesHbs from '../../src/templates/partials/components/home/more-stories.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture, FIXTURE_NOW } from '../fixtures/homepage.fixture';
import { distributeHomepageArticles } from '../../src/homepage-distributor';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(moreStoriesHbs);

const homepageSlots = distributeHomepageArticles(
  homepageFixture.articles ?? [],
  FIXTURE_NOW,
  false
);

const meta = {
  title: 'Partials/Home/MoreStories',
  render: (args) => template(args),
  args: { ...homepageFixture, homepageSlots },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
