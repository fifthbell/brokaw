import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import liveUpdateHbs from '../../src/templates/partials/blocks/live-update.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(liveUpdateHbs);

const meta = {
  title: 'Partials/Blocks/LiveUpdate',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'liveUpdate') ?? { type: 'liveUpdate', timestamp: '2026-03-08T15:20:00.000Z', headline: 'City opens two additional warming centers', html: '<p>Officials say both locations will remain open overnight as temperatures drop behind the storm front.</p>' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
