import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import liveUpdatesColumnHbs from '../../src/templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import scrollAreaHbs from '../../src/templates/partials/components/ui/scroll-area.hbs?raw';
import { loadBreakingNewsPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/ui/scroll-area', scrollAreaHbs);

const template = Handlebars.compile(liveUpdatesColumnHbs);

const meta = {
  title: 'Partials/BreakingNews/LiveUpdatesColumn',
  loaders: [async () => ({ breakingNews: await loadBreakingNewsPreviewData() })],
  render: (_args, { loaded }) =>
    template({
      ...(loaded.breakingNews.main || {}),
      updates: loaded.breakingNews.updates || []
    })
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
