import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import liveUpdatesColumnHbs from '../../src/templates/partials/components/breaking-news/live-updates-column.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(liveUpdatesColumnHbs);

const meta = {
  title: 'Partials/BreakingNews/LiveUpdatesColumn',
  render: (args) => template(args),
  args: { ...homepageFixture.breakingNews.main, updates: homepageFixture.breakingNews.updates }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
