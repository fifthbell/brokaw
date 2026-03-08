import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import infoBoxHbs from '../../src/templates/partials/blocks/info-box.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();
const template = Handlebars.compile(infoBoxHbs);

const meta = {
  title: 'Partials/Blocks/InfoBox',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'infoBox') ?? { type: 'infoBox', tone: 'warning', title: 'Emergency Advisory', html: '<p>Residents in flood-prone zones should move vehicles to higher ground before sunset.</p>' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
