import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import keyPointsHbs from '../../src/templates/partials/blocks/key-points.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(keyPointsHbs);

const meta = {
  title: 'Partials/Blocks/KeyPoints',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'keyPoints') ?? { type: 'keyPoints', title: 'Key Points', points: ['Peak gusts expected between 8 p.m. and midnight', 'Most flood alerts expire by 6 a.m.', 'Power restoration could extend into Monday morning'] },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
