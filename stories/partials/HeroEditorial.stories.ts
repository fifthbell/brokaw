import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import editorialHeroHbs from '../../src/templates/partials/components/editorial-hero.hbs?raw';
import headlineHbs from '../../src/templates/partials/components/headline.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/headline', headlineHbs);

const template = Handlebars.compile(editorialHeroHbs);

const meta = {
  title: 'Partials/EditorialHero',
  render: (args) => template(args),
  args: {
    title: homepageFixture.title,
    slug: homepageFixture.slug,
    excerpt: homepageFixture.excerpt,
    hero: homepageFixture.hero,
    slides: homepageFixture.heroSlides,
    related: homepageFixture.articles?.slice(0, 4)
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
