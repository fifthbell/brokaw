import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import youtubeHbs from '../../src/templates/partials/blocks/youtube.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(youtubeHbs);

const meta = {
  title: 'Partials/Blocks/YouTube',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'youtube') ?? { videoId: 'dQw4w9WgXcQ' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
