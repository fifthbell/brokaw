import Handlebars from 'handlebars';
import { layoutNames, type LayoutName } from './layouts.js';
import { canonicalArticleSchema, type CanonicalDocument } from './types/canonical-article.js';

export type { LayoutName } from './layouts.js';

export type RendererAssets = {
  layouts: Record<LayoutName, string>;
  partials: Record<string, string>;
  styles: string;
};

let initialized = false;
const layoutCache = new Map<LayoutName, HandlebarsTemplateDelegate>();
const removedBlockTypes = new Set(['truthSocial', 'truthsocial', 'truth-social', 'truth_social']);

function normalizeDocument(doc: CanonicalDocument): CanonicalDocument {
  const rawBody = (doc as { body?: unknown }).body;
  if (!Array.isArray(rawBody)) return doc;

  return {
    ...doc,
    body: rawBody.filter((block) => {
      if (!block || typeof block !== 'object') return true;
      const type = (block as { type?: unknown }).type;
      return typeof type !== 'string' || !removedBlockTypes.has(type);
    }) as CanonicalDocument['body']
  };
}

function registerHelpers(): void {
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('add', (a: unknown, b: unknown) => Number(a) + Number(b));
  Handlebars.registerHelper('slice', (items: unknown, start: number, end?: number) => {
    if (!Array.isArray(items)) return [];
    return items.slice(start, end);
  });
  Handlebars.registerHelper('uppercase', (value: unknown) => String(value ?? '').toLocaleUpperCase('en-US'));
  Handlebars.registerHelper('coalesce', (...args: unknown[]) => args.slice(0, -1).find((value) => value !== null && value !== undefined) ?? null);
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
  Handlebars.registerHelper('embedUrl', (name: unknown, options: Handlebars.HelperOptions) => {
    const templates: Record<string, string> = {
      'x-status': 'https://twitter.com/{username}/status/{id}',
      'x-embed': 'https://platform.twitter.com/embed/Tweet.html?id={id}&dnt=true',
      instagram: 'https://www.instagram.com/p/{shortcode}/embed/',
      tiktok: 'https://www.tiktok.com/embed/v2/{id}',
      'sofascore-widget': 'https://widgets.sofascore.com/embed/attackMomentum?id={id}&widgetTheme={widgetTheme}',
      'sofascore-match': 'https://www.sofascore.com/football/match#id:{id}'
    };
    const template = typeof name === 'string' ? templates[name] : undefined;
    if (!template) throw new Error(`Unknown embed provider "${String(name)}"`);
    return template.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_token, parameter: string) => {
      const value = options.hash[parameter];
      if (value === undefined || value === null || value === '') {
        throw new Error(`Embed provider "${String(name)}" requires parameter ${parameter}`);
      }
      return encodeURIComponent(String(value));
    });
  });
  Handlebars.registerHelper('jsonString', (value: unknown) => {
    const serialized = JSON.stringify(value);
    if (serialized === undefined) throw new Error('jsonString cannot serialize this value');
    return new Handlebars.SafeString(serialized.replace(/[<>&\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`));
  });
  const socialImage = (doc: unknown) => {
    if (!doc || typeof doc !== 'object') return null;
    const image = (doc as { seo?: { socialImage?: unknown } }).seo?.socialImage;
    if (!image || typeof image !== 'object' || Array.isArray(image)) return null;
    const candidate = image as { url?: unknown; alt?: unknown };
    return typeof candidate.url === 'string' && candidate.url.trim() ? candidate : null;
  };
  Handlebars.registerHelper('socialImageUrl', (doc: unknown) => socialImage(doc)?.url ?? null);
  Handlebars.registerHelper('socialImageAlt', (doc: unknown) => {
    const document = doc as { title?: unknown };
    const image = socialImage(doc);
    return typeof image?.alt === 'string' && image.alt.trim() ? image.alt : String(document.title ?? 'fifthbell');
  });
}

function registerPartials(partials: Record<string, string>): void {
  for (const [name, template] of Object.entries(partials)) {
    Handlebars.registerPartial(name, template);
  }

  const bodyAliases: Record<string, string> = {
    richText: 'blocks/rich-text',
    heading: 'blocks/heading',
    image: 'blocks/image',
    list: 'blocks/list',
    divider: 'blocks/divider',
    infoBox: 'blocks/info-box',
    keyPoints: 'blocks/key-points',
    dataTable: 'blocks/data-table',
    liveUpdate: 'blocks/live-update',
    audio: 'blocks/audio',
    youtube: 'blocks/youtube',
    x: 'blocks/x',
    instagram: 'blocks/instagram',
    tiktok: 'blocks/tiktok',
    pullQuote: 'blocks/pull-quote'
  };

  for (const [alias, partialName] of Object.entries(bodyAliases)) {
    const source = partials[partialName];
    if (source) {
      Handlebars.registerPartial(alias, source);
    }
  }
}

function compileLayouts(layouts: Record<LayoutName, string>): void {
  for (const [name, source] of Object.entries(layouts) as [LayoutName, string][]) {
    layoutCache.set(name, Handlebars.compile(source));
  }
}

export function initializeHandlebars(assets: RendererAssets): void {
  if (initialized) return;

  registerHelpers();
  registerPartials(assets.partials);
  compileLayouts(assets.layouts);
  initialized = true;
}

export function renderWithAssets(doc: CanonicalDocument, assets: RendererAssets): string {
  if (!initialized) {
    initializeHandlebars(assets);
  }

  const requestedLayout = (doc as { layout?: string }).layout;
  if (!requestedLayout || !layoutCache.has(requestedLayout as LayoutName)) {
    throw new Error(`Unknown layout "${requestedLayout ?? 'undefined'}". Expected one of: ${layoutNames.join(', ')}`);
  }

  const parsed = canonicalArticleSchema.parse(normalizeDocument(doc));
  const template = layoutCache.get(parsed.layout as LayoutName);
  if (!template) {
    throw new Error(`Layout template missing for \"${parsed.layout}\"`);
  }

  return template(parsed);
}
