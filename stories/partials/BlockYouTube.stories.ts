import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import youtubeHbs from '../../src/templates/partials/blocks/youtube.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(youtubeHbs);

const meta = {
  title: 'Partials/Blocks/YouTube',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('youtube') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
