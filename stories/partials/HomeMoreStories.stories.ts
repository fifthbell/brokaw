import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import moreStoriesHbs from '../../src/templates/partials/components/home/more-stories.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadHomepagePartialPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(moreStoriesHbs);

const meta = {
  title: 'Partials/Home/MoreStories',
  loaders: [async () => ({ homepage: await loadHomepagePartialPreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.homepage, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
