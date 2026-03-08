import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import pullQuoteHbs from '../../src/templates/partials/blocks/pull-quote.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(pullQuoteHbs);

const meta = {
  title: 'Partials/Blocks/PullQuote',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'pullQuote') ?? { text: 'Sample quote' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
