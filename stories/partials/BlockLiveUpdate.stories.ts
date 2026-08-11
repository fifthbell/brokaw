import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import liveUpdateHbs from '../../src/templates/partials/blocks/live-update.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(liveUpdateHbs);

const meta = {
  title: 'Partials/Blocks/LiveUpdate',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('liveUpdate') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
