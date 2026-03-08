import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import listHbs from '../../src/templates/partials/blocks/list.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(listHbs);

const meta = {
  title: 'Partials/Blocks/List',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'list') ?? { type: 'list', ordered: false, items: ['Field office issued an updated wind advisory', 'Transit delays expected after 7 p.m.', 'Schools monitoring early dismissal plans'] },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
