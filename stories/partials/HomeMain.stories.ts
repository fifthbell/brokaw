import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import homeMainHbs from '../../src/templates/partials/components/home/main.hbs?raw';
import spotlightHeroHbs from '../../src/templates/partials/components/spotlight-hero.hbs?raw';
import breakingNewsHbs from '../../src/templates/partials/components/breaking-news.hbs?raw';
import breakingNewsLiveUpdatesColumnHbs from '../../src/templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import trendingHbs from '../../src/templates/partials/components/trending.hbs?raw';
import editorialHeroHbs from '../../src/templates/partials/components/editorial-hero.hbs?raw';
import headlineHbs from '../../src/templates/partials/components/headline.hbs?raw';
import homeLandingHbs from '../../src/templates/partials/components/home/landing.hbs?raw';
import homeMustReadHbs from '../../src/templates/partials/components/home/must-read.hbs?raw';
import homeMoreStoriesHbs from '../../src/templates/partials/components/home/more-stories.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/spotlight-hero', spotlightHeroHbs);
Handlebars.registerPartial('components/breaking-news', breakingNewsHbs);
Handlebars.registerPartial('components/breaking-news/live-updates-column', breakingNewsLiveUpdatesColumnHbs);
Handlebars.registerPartial('components/trending', trendingHbs);
Handlebars.registerPartial('components/editorial-hero', editorialHeroHbs);
Handlebars.registerPartial('components/headline', headlineHbs);
Handlebars.registerPartial('components/home/landing', homeLandingHbs);
Handlebars.registerPartial('components/home/must-read', homeMustReadHbs);
Handlebars.registerPartial('components/home/more-stories', homeMoreStoriesHbs);
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(homeMainHbs);

const sectionControls = {
  showHero: { control: 'boolean' },
  showEditorialHero: { control: 'boolean' },
  showBreakingNews: { control: 'boolean' },
  showTrending: { control: 'boolean' },
  showLanding: { control: 'boolean' },
  showMustRead: { control: 'boolean' },
  showMoreStories: { control: 'boolean' }
};

const meta = {
  title: 'Partials/Home/Main',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
  args: {
    showHero: true,
    showEditorialHero: false,
    showBreakingNews: true,
    showTrending: true,
    showLanding: true,
    showMustRead: true,
    showMoreStories: true
  },
  argTypes: sectionControls,
  parameters: {
    controls: {
      include: ['showHero', 'showEditorialHero', 'showBreakingNews', 'showTrending', 'showLanding', 'showMustRead', 'showMoreStories']
    }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
