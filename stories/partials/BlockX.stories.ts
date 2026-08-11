import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import xHbs from '../../src/templates/partials/blocks/x.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(xHbs);

const meta = {
  title: 'Partials/Blocks/X',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('x') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
