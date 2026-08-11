import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import spotlightHeroHbs from '../../src/templates/partials/components/spotlight-hero.hbs?raw';
import headlineHbs from '../../src/templates/partials/components/headline.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/headline', headlineHbs);

const template = Handlebars.compile(spotlightHeroHbs);

const meta = {
  title: 'Partials/SpotlightHero',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => {
    const homepage = loaded.homepage;
    return template({ ...homepage, related: homepage.articles?.slice(0, 4), ...args });
  },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
