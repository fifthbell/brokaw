import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import audioHbs from '../../src/templates/partials/blocks/audio.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(audioHbs);

const meta = {
  title: 'Partials/Blocks/Audio',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('audio') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
