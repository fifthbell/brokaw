import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import landingHbs from '../../src/templates/partials/components/home/landing.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture, FIXTURE_NOW } from '../fixtures/homepage.fixture';
import { distributeHomepageArticles } from '../../src/homepage-distributor';
import { loadHomepagePartialPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(landingHbs);

const meta = {
  title: 'Partials/Home/Landing',
  loaders: [async () => ({ homepage: await loadHomepagePartialPreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: 'The editorial landing preserves its original 6/3/3 desktop balance: the lead reads first while the feature rail and top-stories column retain equal space.'
      }
    }
  }
};

/** Scenario: 8 recent featured articles — 6 go to featured slots, 2 overflow to top of queue */
export const WithFeaturedOverflow: Story = {
  args: {
    ...homepageFixture,
    homepageSlots: distributeHomepageArticles(homepageFixture.articles ?? [], FIXTURE_NOW, false)
  }
};

/** Scenario: no featured articles within 24 h — all slots filled from queue */
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
