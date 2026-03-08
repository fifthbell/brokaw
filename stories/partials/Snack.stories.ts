import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(snackHbs);
const snack = homepageFixture.breakingNews.snacks[0];

const meta = {
  title: 'Partials/Snack',
  render: (args) => template(args),
  args: { ...snack, isLast: false, showImage: true },
  argTypes: {
    showImage: { control: 'boolean' }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
