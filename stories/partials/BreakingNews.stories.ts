import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import breakingNewsHbs from '../../src/templates/partials/components/breaking-news.hbs?raw';
import liveUpdatesColumnHbs from '../../src/templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import scrollAreaHbs from '../../src/templates/partials/components/ui/scroll-area.hbs?raw';
import { loadBreakingNewsPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

Handlebars.registerPartial('components/breaking-news/live-updates-column', liveUpdatesColumnHbs);
Handlebars.registerPartial('components/snack', snackHbs);
Handlebars.registerPartial('components/ui/scroll-area', scrollAreaHbs);

const template = Handlebars.compile(breakingNewsHbs);

function buildLongUpdates(updates: Array<Record<string, unknown>>): Array<Record<string, unknown>> {
  const source = updates.length > 0 ? updates : [{ time: 'Just now', text: 'Live coverage is starting.' }];

  return Array.from({ length: 18 }, (_, index) => ({
    ...source[index % source.length],
    timestamp: undefined,
    time: `${index + 1} min ago`,
    text: `Extended live update ${index + 1}: ${String(source[index % source.length]?.text ?? 'More details are developing.')}`
  }));
}

const meta = {
  title: 'Partials/BreakingNews',
  loaders: [async () => ({ breakingNews: await loadBreakingNewsPreviewData() })],
  render: (args, { loaded }) => template({ ...loaded.breakingNews, ...args })
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};

export const OverflowingLiveUpdates: Story = {
  render: (args, { loaded }) =>
    template({
      ...loaded.breakingNews,
      ...args,
      updates: buildLongUpdates((loaded.breakingNews.updates || []) as Array<Record<string, unknown>>)
    })
};
