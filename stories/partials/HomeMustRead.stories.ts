import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import mustReadHbs from '../../src/templates/partials/components/home/must-read.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(mustReadHbs);

const meta = {
  title: 'Partials/Home/MustRead',
  render: (args) => template(args),
  args: homepageFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
