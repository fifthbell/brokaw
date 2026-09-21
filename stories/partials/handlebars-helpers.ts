import Handlebars from 'handlebars';
import bodyBlockHbs from '../../src/templates/partials/components/body-block.hbs?raw';
import snackHbs from '../../src/templates/partials/components/snack.hbs?raw';
import snackMetaImageRowHbs from '../../src/templates/partials/components/snack-meta-image-row.hbs?raw';
import snackMetaInlineHbs from '../../src/templates/partials/components/snack-meta-inline.hbs?raw';
import snackTopStoryHbs from '../../src/templates/partials/components/snack-top-story.hbs?raw';
import spotlightHeroSlidesHbs from '../../src/templates/partials/components/spotlight-hero-slides.hbs?raw';
import statusBadgeHbs from '../../src/templates/partials/components/ui/status-badge.hbs?raw';
import audioHbs from '../../src/templates/partials/blocks/audio.hbs?raw';
import dataTableHbs from '../../src/templates/partials/blocks/data-table.hbs?raw';
import dividerHbs from '../../src/templates/partials/blocks/divider.hbs?raw';
import headingHbs from '../../src/templates/partials/blocks/heading.hbs?raw';
import imageHbs from '../../src/templates/partials/blocks/image.hbs?raw';
import infoBoxHbs from '../../src/templates/partials/blocks/info-box.hbs?raw';
import instagramHbs from '../../src/templates/partials/blocks/instagram.hbs?raw';
import keyPointsHbs from '../../src/templates/partials/blocks/key-points.hbs?raw';
import listHbs from '../../src/templates/partials/blocks/list.hbs?raw';
import liveUpdateHbs from '../../src/templates/partials/blocks/live-update.hbs?raw';
import pullQuoteHbs from '../../src/templates/partials/blocks/pull-quote.hbs?raw';
import richTextHbs from '../../src/templates/partials/blocks/rich-text.hbs?raw';
import tiktokHbs from '../../src/templates/partials/blocks/tiktok.hbs?raw';
import xHbs from '../../src/templates/partials/blocks/x.hbs?raw';
import youtubeHbs from '../../src/templates/partials/blocks/youtube.hbs?raw';

let initialized = false;

export function registerCommonHelpers(): void {
  const partials: Record<string, string> = {
    'components/body-block': bodyBlockHbs,
    'components/snack': snackHbs,
    'components/snack-meta-image-row': snackMetaImageRowHbs,
    'components/snack-meta-inline': snackMetaInlineHbs,
    'components/snack-top-story': snackTopStoryHbs,
    'components/spotlight-hero-slides': spotlightHeroSlidesHbs,
    'components/ui/status-badge': statusBadgeHbs,
    'blocks/audio': audioHbs,
    'blocks/data-table': dataTableHbs,
    'blocks/divider': dividerHbs,
    'blocks/heading': headingHbs,
    'blocks/image': imageHbs,
    'blocks/info-box': infoBoxHbs,
    'blocks/instagram': instagramHbs,
    'blocks/key-points': keyPointsHbs,
    'blocks/list': listHbs,
    'blocks/live-update': liveUpdateHbs,
    'blocks/pull-quote': pullQuoteHbs,
    'blocks/rich-text': richTextHbs,
    'blocks/tiktok': tiktokHbs,
    'blocks/x': xHbs,
    'blocks/youtube': youtubeHbs
  };
  for (const [name, source] of Object.entries(partials)) Handlebars.registerPartial(name, source);
  if (initialized) return;

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('add', (a: unknown, b: unknown) => Number(a) + Number(b));
  Handlebars.registerHelper('slice', (items: unknown, start: number, end?: number) => {
    if (!Array.isArray(items)) return [];
    return items.slice(start, end);
  });
  Handlebars.registerHelper('uppercase', (value: unknown) => String(value ?? '').toLocaleUpperCase('en-US'));
  Handlebars.registerHelper('coalesce', (...args: unknown[]) => args.slice(0, -1).find((value) => value !== null && value !== undefined) ?? null);
  Handlebars.registerHelper('embedUrl', (name: unknown, options: Handlebars.HelperOptions) => {
    const templates: Record<string, string> = {
      'x-embed': 'https://platform.twitter.com/embed/Tweet.html?id={id}&dnt=true',
      tiktok: 'https://www.tiktok.com/embed/v2/{id}',
      'sofascore-widget': 'https://widgets.sofascore.com/embed/attackMomentum?id={id}&widgetTheme={widgetTheme}',
      'sofascore-match': 'https://www.sofascore.com/football/match#id:{id}'
    };
    const template = typeof name === 'string' ? templates[name] : undefined;
    if (!template) throw new Error(`Unknown embed provider "${String(name)}"`);
    return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_token, parameter: string) => encodeURIComponent(String(options.hash[parameter])));
  });
  Handlebars.registerHelper('formatDate', (isoString: string) => {
    if (!isoString) return '';
    try {
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeZone: 'America/New_York'
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  });
  Handlebars.registerHelper('jsonString', (value: unknown) => {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error('jsonString cannot serialize this value');
    return new Handlebars.SafeString(serialized.replace(/[<>&\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`));
  });

  initialized = true;
}
