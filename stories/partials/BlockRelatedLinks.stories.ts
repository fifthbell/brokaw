import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import relatedLinksHbs from '../../src/templates/partials/blocks/related-links.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(relatedLinksHbs);

const meta = {
  title: 'Partials/Blocks/RelatedLinks',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'relatedLinks') ?? { type: 'relatedLinks', title: 'Related Coverage', links: [{ label: 'How utilities stage crews before major storms', url: 'https://fifthbell.com/business/grid-readiness' }, { label: 'Transit agencies publish severe-weather playbook', url: 'https://fifthbell.com/politics/transit-severe-weather-plan' }] },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
