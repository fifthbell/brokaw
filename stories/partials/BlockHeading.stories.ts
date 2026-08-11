import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headingHbs from '../../src/templates/partials/blocks/heading.hbs?raw';
import { loadContentBlockPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(headingHbs);

const meta = {
  title: 'Partials/Blocks/Heading',
  loaders: [async () => ({ block: await loadContentBlockPreviewData('heading') })],
  render: (args, { loaded }) => template({ ...loaded.block, ...args }),
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
