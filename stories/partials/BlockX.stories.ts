import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import xHbs from '../../src/templates/partials/blocks/x.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

const template = Handlebars.compile(xHbs);

const meta = {
  title: 'Partials/Blocks/X',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'x') ?? { url: 'https://x.com' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
