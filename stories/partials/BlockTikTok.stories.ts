import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import tiktokHbs from '../../src/templates/partials/blocks/tiktok.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(tiktokHbs);

const meta = {
  title: 'Partials/Blocks/TikTok',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'tiktok') ?? { url: 'https://www.tiktok.com' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
