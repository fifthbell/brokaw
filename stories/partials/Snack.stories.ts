import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadHomepagePreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(snackHbs);
const meta = {
  title: 'Partials/Snack',
  loaders: [async () => ({ homepage: await loadHomepagePreviewData() })],
  render: (args, { loaded }) => template({ ...(loaded.homepage.articles?.[0] ?? {}), ...args }),
  args: { isLast: false, showImage: true },
  argTypes: {
    showImage: { control: 'boolean' }
  }
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
