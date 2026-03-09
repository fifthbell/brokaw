import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headlineHbs from '../../src/templates/partials/components/headline.hbs?raw';
import { homepageFixture } from '../fixtures/homepage.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(headlineHbs);
const item = homepageFixture.articles?.[0];

const meta = {
  title: 'Partials/Headline',
  render: (args) => template(args),
  args: {
    url: item?.url ?? '/story',
    title: item?.title ?? 'Headline title',
    time: item?.time ?? '1 hr ago',
    image: item?.featuredImage?.url,
    featuredImage: item?.featuredImage,
    showImage: true
  },
  argTypes: {
    showImage: { control: 'boolean' }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
