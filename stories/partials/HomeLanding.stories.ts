import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import landingHbs from '../../src/templates/partials/components/home/landing.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(landingHbs);

const meta = {
  title: 'Partials/Home/Landing',
  render: (args) => template(args),
  args: homepageFixture,
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
