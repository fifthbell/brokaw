import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import keyPointsHbs from '../../src/templates/partials/blocks/key-points.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';

const template = Handlebars.compile(keyPointsHbs);

const meta = {
  title: 'Partials/Blocks/KeyPoints',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('keyPoints') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
