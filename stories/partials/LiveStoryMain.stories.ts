import type { Meta, StoryObj } from '@storybook/html';
import Handlebars from 'handlebars';
import liveStoryMainHbs from '../../src/templates/partials/components/live-story/main.hbs?raw';
import richTextHbs from '../../src/templates/partials/blocks/rich-text.hbs?raw';
import headingHbs from '../../src/templates/partials/blocks/heading.hbs?raw';
import imageHbs from '../../src/templates/partials/blocks/image.hbs?raw';
import listHbs from '../../src/templates/partials/blocks/list.hbs?raw';
import dividerHbs from '../../src/templates/partials/blocks/divider.hbs?raw';
import infoBoxHbs from '../../src/templates/partials/blocks/info-box.hbs?raw';
import keyPointsHbs from '../../src/templates/partials/blocks/key-points.hbs?raw';
import relatedLinksHbs from '../../src/templates/partials/blocks/related-links.hbs?raw';
import dataTableHbs from '../../src/templates/partials/blocks/data-table.hbs?raw';
import liveUpdateHbs from '../../src/templates/partials/blocks/live-update.hbs?raw';
import audioHbs from '../../src/templates/partials/blocks/audio.hbs?raw';
import youtubeHbs from '../../src/templates/partials/blocks/youtube.hbs?raw';
import xHbs from '../../src/templates/partials/blocks/x.hbs?raw';
import instagramHbs from '../../src/templates/partials/blocks/instagram.hbs?raw';
import tiktokHbs from '../../src/templates/partials/blocks/tiktok.hbs?raw';
import pullQuoteHbs from '../../src/templates/partials/blocks/pull-quote.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import { loadLiveStoryPreviewData } from '../preview-data';
import { registerCommonHelpers } from './handlebars-helpers';

registerCommonHelpers();

Handlebars.registerPartial('richText', richTextHbs);
Handlebars.registerPartial('heading', headingHbs);
Handlebars.registerPartial('image', imageHbs);
Handlebars.registerPartial('list', listHbs);
Handlebars.registerPartial('divider', dividerHbs);
Handlebars.registerPartial('infoBox', infoBoxHbs);
Handlebars.registerPartial('keyPoints', keyPointsHbs);
Handlebars.registerPartial('relatedLinks', relatedLinksHbs);
Handlebars.registerPartial('dataTable', dataTableHbs);
Handlebars.registerPartial('liveUpdate', liveUpdateHbs);
Handlebars.registerPartial('audio', audioHbs);
Handlebars.registerPartial('youtube', youtubeHbs);
Handlebars.registerPartial('x', xHbs);
Handlebars.registerPartial('instagram', instagramHbs);
Handlebars.registerPartial('tiktok', tiktokHbs);
Handlebars.registerPartial('pullQuote', pullQuoteHbs);
Handlebars.registerPartial('components/snack', snackHbs);

const template = Handlebars.compile(liveStoryMainHbs);

const meta = {
  title: 'Partials/LiveStory/Main',
  loaders: [async () => ({ liveStory: await loadLiveStoryPreviewData() })],
  render: (_args, { loaded }) => template(loaded.liveStory)
} satisfies Meta;

export default meta;

type Story = StoryObj;

export const Default: Story = {};
