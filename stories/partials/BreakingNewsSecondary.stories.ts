import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import officialsIssueHbs from '../../src/templates/partials/components/breaking-news/secondary.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(officialsIssueHbs);

const meta = {
  title: 'Partials/BreakingNews/Secondary',
  render: (args) => template(args),
  args: homepageFixture.breakingNews.sidebarSub
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
