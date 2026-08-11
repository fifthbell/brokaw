import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import pullQuoteHbs from '../../src/templates/partials/blocks/pull-quote.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(pullQuoteHbs);

const meta = {
  title: 'Partials/Blocks/PullQuote',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('pullQuote') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
