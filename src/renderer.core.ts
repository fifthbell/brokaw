import Handlebars from 'handlebars';
import { canonicalArticleSchema, type CanonicalArticle } from './types/canonical-article.js';
import { distributeHomepageArticles } from './homepage-distributor.js';

export type LayoutName = CanonicalArticle['layout'];

export type RendererAssets = {
  layouts: Record<LayoutName, string>;
  partials: Record<string, string>;
  styles: string;
};

let initialized = false;
const layoutCache = new Map<LayoutName, HandlebarsTemplateDelegate>();
let runtimeStyles = '';
const removedBlockTypes = new Set(['truthSocial', 'truthsocial', 'truth-social', 'truth_social']);
const siteTitlesByLanguage: Record<CanonicalArticle['language'], string> = {
  en: 'fifthbell - Breaking News & Current Events',
  es: 'fifthbell - Noticias de última hora y actualidad',
  it: 'fifthbell - Ultime notizie e attualità'
};

function normalizeDocument(doc: CanonicalArticle): CanonicalArticle {
  const rawBody = (doc as { body?: unknown }).body;
  if (!Array.isArray(rawBody)) return doc;

  return {
    ...doc,
    body: rawBody.filter((block) => {
      if (!block || typeof block !== 'object') return true;
      const type = (block as { type?: unknown }).type;
      return typeof type !== 'string' || !removedBlockTypes.has(type);
    }) as CanonicalArticle['body']
  };
}

function registerHelpers(): void {
  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
  Handlebars.registerHelper('slice', (items: unknown, start: number, end?: number) => {
    if (!Array.isArray(items)) return [];
    return items.slice(start, end);
  });
  Handlebars.registerHelper('uppercase', (value: unknown) => String(value ?? '').toUpperCase());
  Handlebars.registerHelper('coalesce', (...args: unknown[]) => {
    const values = args.slice(0, -1);
    for (const value of values) {
      if (value === null || value === undefined) continue;
      if (typeof value === 'string' && value.trim().length === 0) continue;
      if (Array.isArray(value) && value.length === 0) continue;
      return value;
    }
    return '';
  });
  Handlebars.registerHelper('formatDate', (isoString: string) => {
    if (!isoString) return '';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/New_York'
      });
    } catch {
      return isoString;
    }
  });
  Handlebars.registerHelper('xStatusUrl', (url: string) => {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      if (parsed.hostname === 'x.com' || parsed.hostname === 'www.x.com') {
        return `https://twitter.com${parsed.pathname}`;
      }
      return url;
    } catch {
      return url;
    }
  });
  Handlebars.registerHelper('xEmbedUrl', (url: string) => {
    if (!url) return '';

    const buildEmbedUrl = (tweetId: string) => `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`;
    const idFromRaw = url.match(/status\/(\d+)/)?.[1];

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host === 'x.com' || host === 'twitter.com') {
        const tweetId = parsed.pathname.match(/\/[^/]+\/status\/(\d+)/)?.[1];
        if (tweetId) return buildEmbedUrl(tweetId);
      }
      return idFromRaw ? buildEmbedUrl(idFromRaw) : '';
    } catch {
      return idFromRaw ? buildEmbedUrl(idFromRaw) : '';
    }
  });
  Handlebars.registerHelper('xTweetId', (url: string) => {
    if (!url) return '';
    const idFromRaw = url.match(/status\/(\d+)/)?.[1];
    if (idFromRaw) return idFromRaw;

    try {
      const parsed = new URL(url);
      const host = parsed.hostname.replace(/^www\./, '');
      if (host === 'x.com' || host === 'twitter.com') {
        return parsed.pathname.match(/\/[^/]+\/status\/(\d+)/)?.[1] ?? '';
      }
      return '';
    } catch {
      return '';
    }
  });
  Handlebars.registerHelper('instagramEmbedUrl', (url: string) => {
    if (!url) return '';
    const normalized = url.endsWith('/') ? url : `${url}/`;
    return `${normalized}embed/`;
  });
  Handlebars.registerHelper('tiktokEmbedUrl', (url: string) => {
    if (!url) return '';
    const match = url.match(/\/video\/(\d+)/);
    if (!match) return url;
    return `https://www.tiktok.com/embed/v2/${match[1]}`;
  });
  Handlebars.registerHelper('resolveHeadTitle', (doc: unknown) => {
    if (!doc || typeof doc !== 'object') return 'fifthbell';
    const page = doc as Partial<CanonicalArticle>;

    if (page.layout === 'homepage') {
      const language = page.language === 'es' || page.language === 'it' ? page.language : 'en';
      return siteTitlesByLanguage[language];
    }

    if (page.layout === 'category-page') {
      const categoryName = page.categories?.[0]?.name?.trim();
      const baseTitle = categoryName || page.title?.trim() || 'Category';
      return `${baseTitle} | fifthbell`;
    }

    if (page.layout === 'article-page') {
      const baseTitle = page.title?.trim() || 'Article';
      return `${baseTitle} | fifthbell`;
    }

    if (page.layout === '404') {
      return '404 - Page Not Found | fifthbell';
    }

    const seoTitle = page.seo?.metaTitle?.trim();
    if (seoTitle) return seoTitle;
    const baseTitle = page.title?.trim() || 'fifthbell';
    return `${baseTitle} | fifthbell`;
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
    relatedLinks: 'blocks/related-links',
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
  runtimeStyles = assets.styles;
  initialized = true;
}

export function renderWithAssets(doc: CanonicalArticle, assets: RendererAssets): string {
  if (!initialized) {
    initializeHandlebars(assets);
  }

  const requestedLayout = (doc as { layout?: string }).layout;
  if (!requestedLayout || !layoutCache.has(requestedLayout as LayoutName)) {
    throw new Error(`Unknown layout \"${requestedLayout ?? 'undefined'}\". Expected one of: article-page, homepage, category-page, 404`);
  }

  const parsed = canonicalArticleSchema.parse(normalizeDocument(doc));
  const template = layoutCache.get(parsed.layout);
  if (!template) {
    throw new Error(`Layout template missing for \"${parsed.layout}\"`);
  }

  // Build the template context, enriching homepage renders with pre-distributed
  // article slots so templates do not need to perform index arithmetic.
  const docExtra = doc as Record<string, unknown>;
  const showBreakingNews =
    parsed.layout === 'homepage' &&
    Boolean(parsed.breakingNews) &&
    docExtra['showBreakingNews'] !== false;

  const homepageSlots =
    parsed.layout === 'homepage'
      ? distributeHomepageArticles(parsed.articles ?? [], new Date(), showBreakingNews)
      : undefined;

  return template({
    ...parsed,
    ...(homepageSlots !== undefined ? { homepageSlots } : {}),
    styles: runtimeStyles,
    logoLink: parsed.language === 'en' ? '/' : `/${parsed.language}`
  });
}
