import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import { expect } from 'storybook/test';
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

// gaulatti/ariston#217: Cronkite's embedUrl yields '' for a provider its
// registry does not declare. The guarded block then renders no iframe.
const undeclared = Handlebars.create();
undeclared.registerHelper('embedUrl', () => '');
const undeclaredTemplate = undeclared.compile(tiktokHbs);

export const UndeclaredProvider: Story = {
  render: (args, { loaded }) => undeclaredTemplate({ ...loaded.block, ...args }),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('iframe')).toBeNull();
    await expect(canvasElement.textContent).toContain('View post on TikTok');
  },
};
