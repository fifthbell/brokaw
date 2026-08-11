import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import tiktokHbs from '../../src/templates/partials/blocks/tiktok.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(tiktokHbs);

const meta = {
  title: 'Partials/Blocks/TikTok',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('tiktok') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
