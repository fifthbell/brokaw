import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import developingSituationHbs from '../../src/templates/partials/components/breaking-news/primary.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';

const template = Handlebars.compile(developingSituationHbs);

const meta = {
  title: 'Partials/BreakingNews/Primary',
  render: (args) => template(args),
  args: homepageFixture.breakingNews.sidebarFeature,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
