import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import trendingHbs from '../../src/templates/partials/components/trending.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(trendingHbs);

const meta = {
  title: 'Partials/Trending',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
