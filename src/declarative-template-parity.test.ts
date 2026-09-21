import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Handlebars from 'handlebars';
import { describe, expect, it } from 'vitest';
import { cronkiteManifest } from './cronkite-manifest.js';
import { distributeHomepageArticles } from './homepage-distributor.js';
import { render } from './renderer.node.js';
import { searchCopyByLanguage } from './search-copy.js';
import type { CanonicalArticle } from './types/canonical-article.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rendering = cronkiteManifest.templateRendering;
type Renderable = (typeof rendering.renderables)[keyof typeof rendering.renderables];
type EmbedDefinition = (typeof rendering.embedRegistry)[keyof typeof rendering.embedRegistry];

function createDeclarativeEnvironment() {
  const environment = Handlebars.create();
  environment.unregisterHelper('log');
  environment.registerHelper('eq', (left, right) => left === right);
  environment.registerHelper('add', (left, right) => Number(left) + Number(right));
  environment.registerHelper('slice', (value, start, end) => {
    if (typeof value !== 'string' && !Array.isArray(value)) throw new Error('slice requires a string or array');
    return value.slice(Number(start), typeof end === 'object' ? undefined : Number(end));
  });
  environment.registerHelper('uppercase', (value) => String(value).toLocaleUpperCase(rendering.helperConfig.dateLocale));
  environment.registerHelper('coalesce', (...values: unknown[]) => {
    values.pop();
    return values.find((value) => value !== null && value !== undefined) ?? null;
  });
  environment.registerHelper('jsonString', (value) => new environment.SafeString(JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`)));
  environment.registerHelper('embedUrl', (name: unknown, options: Handlebars.HelperOptions) => {
    if (typeof name !== 'string') throw new Error('embed provider must be a string');
    const definition = (rendering.embedRegistry as Record<string, EmbedDefinition>)[name];
    if (!definition) throw new Error(`unknown embed provider ${name}`);
    return definition.urlTemplate.replace(/\{([A-Za-z][A-Za-z0-9]*)\}/g, (_token: string, parameter: string) => {
      const parameters = definition.parameters as Record<string, { default?: string | number }>;
      const value = options.hash[parameter] ?? parameters[parameter]?.default;
      if (value === undefined) throw new Error(`missing ${name}.${parameter}`);
      return encodeURIComponent(String(value));
    });
  });
  environment.registerHelper('formatDate', (value) => new Intl.DateTimeFormat(rendering.helperConfig.dateLocale, {
    dateStyle: 'long',
    timeZone: rendering.helperConfig.timeZone,
  }).format(new Date(String(value))));
  const socialImage = (value: unknown) => {
    const image = (value as { seo?: { socialImage?: { url?: unknown; alt?: unknown } } })?.seo?.socialImage;
    return image && typeof image.url === 'string' && image.url.trim() ? image : null;
  };
  environment.registerHelper('socialImageUrl', (value) => socialImage(value)?.url ?? rendering.helperConfig.defaultSocialImageUrl);
  environment.registerHelper('socialImageAlt', (value) => {
    const document = value as { title?: unknown };
    const image = socialImage(value);
    return typeof image?.alt === 'string' && image.alt.trim() ? image.alt : String(document.title);
  });

  for (const [name, definition] of Object.entries(rendering.partials)) {
    environment.registerPartial(name, fs.readFileSync(path.join(projectRoot, definition.entry), 'utf8'));
  }
  return environment;
}

function declarativeRender(name: string, document: CanonicalArticle): string {
  const definition = (rendering.renderables as Record<string, Renderable>)[name];
  if (!definition) throw new Error(`missing declarative renderable ${name}`);
  const environment = createDeclarativeEnvironment();
  const source = fs.readFileSync(path.join(projectRoot, definition.template.entry), 'utf8');
  return environment.compile(source)(document);
}

const baseFixture: CanonicalArticle = {
  id: 'parity-fixture',
  slug: '/world/parity',
  canonicalUrl: 'https://fifthbell.com/world/parity',
  contentVersion: '2026-09-21T12:00:00.000Z',
  publishedAt: '2026-09-21T12:00:00.000Z',
  updatedAt: '2026-09-21T12:00:00.000Z',
  status: 'published',
  title: 'Parity fixture',
  excerpt: 'A deterministic rendering fixture.',
  language: 'en',
  featured: false,
  authors: [{ name: 'Fifthbell Newsroom', slug: 'fifthbell-newsroom' }],
  categories: [{ name: 'World', slug: 'world' }],
  body: [],
  layout: 'article-page',
  navigation: { categories: [{ name: 'World', slug: 'world' }] },
  articles: [],
  logoLink: '/',
  seo: {
    metaTitle: 'Parity fixture | fifthbell',
    metaDescription: 'A deterministic rendering fixture.',
    socialImage: { url: 'https://cdn.fifthbell.com/content/default-og.jpg', alt: 'Parity fixture' },
  },
};

const articleFixture: CanonicalArticle = {
  ...baseFixture,
  body: [
    { type: 'richText', html: '<p>Declarative article body.</p>' },
    { type: 'x', url: 'https://x.com/fifthbell/status/1234567890', tweetId: '1234567890' },
    { type: 'tiktok', url: 'https://www.tiktok.com/@fifthbell/video/1234567890', videoId: '1234567890' },
  ],
};

const homepageFixture: CanonicalArticle = {
  ...baseFixture,
  slug: '/',
  canonicalUrl: 'https://fifthbell.com/',
  layout: 'homepage',
  homepageSlots: distributeHomepageArticles([], new Date('2026-09-21T12:00:00.000Z'), false),
  showHero: false,
  showEditorialHero: false,
  showBreakingNews: false,
  showLanding: false,
  showMustRead: false,
  showMoreStories: false,
};

const categoryFixture: CanonicalArticle = {
  ...baseFixture,
  slug: '/world',
  canonicalUrl: 'https://fifthbell.com/world',
  layout: 'category-page',
};

const searchFixture: CanonicalArticle = {
  ...baseFixture,
  id: 'search-parity',
  slug: '/search',
  canonicalUrl: 'https://fifthbell.com/search',
  layout: 'search-page',
  title: 'Search',
  excerpt: 'Search stories from Fifthbell.',
  body: [],
  searchCopy: searchCopyByLanguage.en,
  seo: { metaTitle: 'Search | fifthbell', metaDescription: 'Search stories from Fifthbell.' },
};

const linkInBioFixture: CanonicalArticle = {
  ...baseFixture,
  slug: '/instagram',
  canonicalUrl: 'https://fifthbell.com/instagram',
  layout: 'link-in-bio',
};

describe('declarative template output parity', () => {
  it.each([
    ['article-page', articleFixture],
    ['homepage', homepageFixture],
    ['category-page', categoryFixture],
    ['search-page', searchFixture],
    ['link-in-bio', linkInBioFixture],
  ] as const)('matches the legacy local renderer for %s', (renderable, fixture) => {
    expect(declarativeRender(renderable, fixture)).toBe(render(fixture));
  });
});
