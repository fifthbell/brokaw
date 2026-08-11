import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headlineHbs from '../../src/templates/partials/components/headline.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(headlineHbs);
const meta = {
  title: 'Partials/Headline',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => {
    const item = loaded.homepage.articles?.[0];
    return template({
      url: item?.url ?? '/story',
      title: item?.title ?? 'Headline title',
      time: item?.time ?? 'Current',
      timestamp: item?.updatedAt ?? item?.publishedAt,
      image: item?.featuredImage?.url,
      featuredImage: item?.featuredImage,
      ...args
    });
  },
  args: {
    showImage: true
  },
  argTypes: {
    showImage: { control: 'boolean' }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
