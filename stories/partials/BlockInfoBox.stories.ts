import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import infoBoxHbs from '../../src/templates/partials/blocks/info-box.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(infoBoxHbs);

const meta = {
  title: 'Partials/Blocks/InfoBox',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('infoBox') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
