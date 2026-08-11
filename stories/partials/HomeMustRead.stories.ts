import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import mustReadHbs from '../../src/templates/partials/components/home/must-read.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture, FIXTURE_NOW } from '../fixtures/homepage.fixture';
import { distributeHomepageArticles } from '../../src/homepage-distributor';
import { loadHomepagePartialPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(mustReadHbs);

const meta = {
  title: 'Partials/Home/MustRead',
  loaders: [async () => ({ homepage: await loadHomepagePartialPreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

/** All 6 featured slots filled with recent featured articles (newest first) */
export const FeaturedSlotsActive: Story = {
  args: {
    ...homepageFixture,
    homepageSlots: distributeHomepageArticles(homepageFixture.articles ?? [], FIXTURE_NOW, false)
  }
};

/** Fallback: no recent featured — queue fills all slots */
export const NoRecentFeatured: Story = {
  args: {
    ...homepageFixture,
    homepageSlots: distributeHomepageArticles(
      (homepageFixture.articles ?? []).map((a) => ({ ...a, featured: false })),
      FIXTURE_NOW,
      false
    )
  }
};
