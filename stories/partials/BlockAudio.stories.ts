import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import audioHbs from '../../src/templates/partials/blocks/audio.hbs?raw';
import { articleFixture } from '../fixtures/article.fixture';

const template = Handlebars.compile(audioHbs);

const meta = {
  title: 'Partials/Blocks/Audio',
  render: (args) => template(args),
  args: articleFixture.body.find((block) => block.type === 'audio') ?? { type: 'audio', title: 'Listen: Reporter briefing from the weather desk', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', caption: '3-minute briefing recorded at 11:42 a.m. ET.' },
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
