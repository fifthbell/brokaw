import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import headingHbs from '../../src/templates/partials/blocks/heading.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(headingHbs);

const meta = {
  title: 'Partials/Blocks/Heading',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'heading') ?? { type: 'heading', text: 'Situation Room Briefing', level: 2 },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
