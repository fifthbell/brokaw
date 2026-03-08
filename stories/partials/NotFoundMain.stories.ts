import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import notFoundMainHbs from '../../src/templates/partials/components/not-found/main.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';

const template = Handlebars.compile(notFoundMainHbs);

const meta = {
  title: 'Partials/NotFound/Main',
  render: (args) => template(args),
  args: { logoLink: '/', navigation: homepageFixture.navigation },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
