import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import instagramHbs from '../../src/templates/partials/blocks/instagram.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(instagramHbs);

const meta = {
  title: 'Partials/Blocks/Instagram',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('instagram') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
