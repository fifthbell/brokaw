import { searchCopyByLanguage } from './search-copy.js';
import type { CronkiteDeclarativeTemplateManifest, SystemVariant } from './types/cronkite-manifest.generated.js';
import { version } from './version.js';

const pagePartials = [
  'shell/doc-start-standard',
  'headers/header-main',
  'footers/footer-full',
  'shell/doc-end',
] as const;

const partialDependencies: Record<string, readonly string[]> = {
  'shell/doc-start-standard': ['shell/rum-loader'],
  'shell/doc-start-404': ['shell/rum-loader'],
  'shell/rum-loader': [],
  'headers/header-main': [],
  'headers/header-minimal': [],
  'footers/footer-full': [],
  'shell/doc-end': [],
  'components/article-main': ['components/body-block', 'components/snack'],
  'components/body-block': [
    'blocks/audio', 'blocks/data-table', 'blocks/divider', 'blocks/heading',
    'blocks/image', 'blocks/info-box', 'blocks/instagram', 'blocks/key-points',
    'blocks/list', 'blocks/live-update', 'blocks/pull-quote', 'blocks/rich-text',
    'blocks/tiktok', 'blocks/x', 'blocks/youtube',
  ],
  'blocks/audio': [],
  'blocks/data-table': [],
  'blocks/divider': [],
  'blocks/heading': [],
  'blocks/image': [],
  'blocks/info-box': [],
  'blocks/instagram': [],
  'blocks/key-points': [],
  'blocks/list': [],
  'blocks/live-update': [],
  'blocks/pull-quote': [],
  'blocks/rich-text': [],
  'blocks/tiktok': [],
  'blocks/x': [],
  'blocks/youtube': [],
  'components/snack': ['components/snack-meta-image-row', 'components/snack-meta-inline'],
  'components/snack-top-story': ['components/snack'],
  'components/snack-meta-image-row': [],
  'components/snack-meta-inline': [],
  'components/category/main': ['components/category/header', 'components/category/main-grid', 'components/category/more-grid'],
  'components/category/header': [],
  'components/category/main-grid': ['components/snack'],
  'components/category/more-grid': [],
  'components/search/main': [],
  'components/not-found/main': [],
  'components/home/main': [
    'components/spotlight-hero', 'components/spotlight-hero-slides', 'components/trending',
    'components/editorial-hero', 'components/breaking-news', 'components/home/landing',
    'components/home/must-read', 'components/home/more-stories',
  ],
  'components/spotlight-hero': ['components/headline'],
  'components/spotlight-hero-slides': ['components/spotlight-hero'],
  'components/trending': [],
  'components/headline': [],
  'components/editorial-hero': ['components/headline'],
  'components/breaking-news': ['components/breaking-news/live-updates-column'],
  'components/breaking-news/live-updates-column': [],
  'components/home/landing': ['components/snack', 'components/snack-top-story'],
  'components/home/must-read': ['components/snack'],
  'components/home/more-stories': ['components/snack'],
  'components/live-story/main': ['components/ui/status-badge', 'components/body-block', 'components/snack'],
  'components/ui/status-badge': [],
  'components/media/main': [],
  'components/standalone-main': ['components/body-block'],
};

const partials = Object.fromEntries(
  Object.entries(partialDependencies).map(([name, dependencies]) => [
    name,
    {
      entry: `src/templates/partials/${name}.hbs`,
      partials: [...dependencies],
    },
  ]),
);

const page = (layout: string, dependencies: readonly string[]) => ({
  template: {
    entry: `src/templates/layouts/${layout}.hbs`,
    partials: [...dependencies],
  },
  inputSchema: 'dist/schemas/canonical-document.schema.json',
  contentType: 'text/html; charset=utf-8',
});

type Language = keyof typeof searchCopyByLanguage;

const localizedSystemCopy = {
  en: {
    notFound: ['Page Not Found', 'The page you are looking for does not exist.', 'Go to Homepage', 'Or explore our categories:'],
    search: ['Search', 'Search stories from Fifthbell.'],
  },
  es: {
    notFound: ['Página no encontrada', 'La página que buscas no existe.', 'Ir al inicio', 'O explora nuestras categorías:'],
    search: ['Buscar', 'Busca noticias de Fifthbell.'],
  },
  it: {
    notFound: ['Pagina non trovata', 'La pagina che stai cercando non esiste.', 'Vai alla home page', 'Oppure esplora le nostre categorie:'],
    search: ['Cerca', 'Cerca notizie Fifthbell.'],
  },
} as const;

const systemDocument = (
  layout: '404' | 'search-page',
  language: Language,
  slug: string,
  title: string,
  excerpt: string,
  extra: Record<string, unknown> = {},
) => ({
  id: `system-${layout}-${language}`,
  slug,
  canonicalUrl: `https://fifthbell.com${slug}`,
  contentVersion: '2026-09-21T00:00:00.000Z',
  publishedAt: '2026-09-21T00:00:00.000Z',
  updatedAt: '2026-09-21T00:00:00.000Z',
  status: 'published',
  title,
  excerpt,
  language,
  featured: false,
  body: [],
  layout,
  authors: [{ name: 'Fifthbell Newsroom', slug: 'fifthbell-newsroom' }],
  categories: [],
  navigation: { categories: [] },
  logoLink: language === 'en' ? '/' : `/${language}`,
  seo: {
    metaTitle: `${title} | fifthbell`,
    metaDescription: excerpt,
  },
  ...extra,
});

const systemVariants = (
  layout: '404' | 'search-page',
  segment: string,
  createExtra: (language: Language) => Record<string, unknown> = () => ({}),
): [SystemVariant, ...SystemVariant[]] => {
  const variants = (['en', 'es', 'it'] as const).map((language) => {
    const localizedSegment = language === 'en' ? `/${segment}` : `/${language}/${segment}`;
    const copy = localizedSystemCopy[language][layout === '404' ? 'notFound' : 'search'];
    return {
      key: language === 'en' ? `html/${segment}/index.html` : `html/${language}/${segment}/index.html`,
      document: systemDocument(layout, language, localizedSegment, copy[0], copy[1], createExtra(language)),
    };
  });
  return [variants[0], ...variants.slice(1)];
};

const immutable = 'public, max-age=31536000, immutable';
const fontNames = [
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGD_jZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGFPjZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGGHiZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGGHjZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGIbkZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGL_kZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGMjkZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGOHjZtU.ttf',
  'LDIcapOFNxEwR-Bd1O9uYNmnUQomAgE25imKSbHhROjLsZBWTSrQGOHkZtU.ttf',
  'SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-2fRUAw.ttf',
  'SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-6_RUAw.ttf',
  'SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-DPNUAw.ttf',
  'SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-NfNUAw.ttf',
  'SlGDmQSNjdsmc35JDF1K5E55YMjF_7DPuGi-a_NUAw.ttf',
  'SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7c8R496.ttf',
  'SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7dbR496.ttf',
  'SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7diR496.ttf',
  'SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7e8QI96.ttf',
  'SlGFmQSNjdsmc35JDF1K5GRwUjcdlttVFm-rI7eOQI96.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs13FvgUE.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs169vgUE.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs18NvgUE.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs1_FvgUE.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs1xZogUE.ttf',
  'TK3_WkUHHAIjg75cFRf3bXL8LICs1y9ogUE.ttf',
  'j8_16_LD37rqfuwxyIuaZhE6cRXOLtm2gfTGgQ.ttf',
  'j8_46_LD37rqfuwxyIuaZhE6cRXOLtm2gfT-BYipBw.ttf',
  'j8_46_LD37rqfuwxyIuaZhE6cRXOLtm2gfT-IYmpBw.ttf',
  'j8_46_LD37rqfuwxyIuaZhE6cRXOLtm2gfT-PYqpBw.ttf',
  'j8_46_LD37rqfuwxyIuaZhE6cRXOLtm2gfT-WYupBw.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oYiRNDM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oZ8RNDM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oZ8RdDM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oZORNDM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oabQ9DM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05oaiQ9DM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05ob8Q9DM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05ob8RNDM.ttf',
  'jizMREVItHgc8qDIbSTKq4XkRiUawTk7f45UM9y05obVQ9DM.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduh8MKUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhHMWUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhLsSUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhLsWUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhcMWUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhh8KUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhrsKUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhrsWUBw.ttf',
  'jizOREVItHgc8qDIbSTKq4XkRg8T88bjFuXOnduhycKUBw.ttf',
] as const;

export const cronkiteManifest = {
  package: '@fifthbell/brokaw',
  version,
  templateRendering: {
    contract: 'cronkite.templates',
    contractVersion: 1,
    partials,
    helperConfig: {
      siteName: 'fifthbell',
      defaultLanguage: 'en',
      supportedLanguages: ['en', 'es', 'it'],
      prefixDefaultLocale: false,
      dateLocale: 'en-US',
      timeZone: 'America/New_York',
      homepageTitles: {
        en: 'fifthbell - Breaking News & Current Events',
        es: 'fifthbell - Noticias de última hora y actualidad',
        it: 'fifthbell - Ultime notizie e attualità',
      },
      layoutTitleFallbacks: {
        'article-page': 'Article',
        homepage: 'fifthbell',
        'category-page': 'Category',
        'search-page': 'Search',
        '404': 'Page Not Found',
        'live-story': 'Live Story',
        'link-in-bio': 'Top Stories',
        'media-page': 'Media',
        'standalone-page': 'fifthbell',
      },
      titleSeparator: ' | ',
      defaultSocialImageUrl: null,
    },
    embedRegistry: {
      'x-status': {
        urlTemplate: 'https://twitter.com/{username}/status/{id}',
        parameters: {
          username: { type: 'string', pattern: '^[A-Za-z0-9_]{1,15}$' },
          id: { type: 'string', pattern: '^[0-9]+$' },
        },
      },
      'x-embed': {
        urlTemplate: 'https://platform.twitter.com/embed/Tweet.html?id={id}&dnt=true',
        parameters: { id: { type: 'string', pattern: '^[0-9]+$' } },
      },
      instagram: {
        urlTemplate: 'https://www.instagram.com/p/{shortcode}/embed/',
        parameters: { shortcode: { type: 'string', pattern: '^[A-Za-z0-9_-]+$' } },
      },
      tiktok: {
        urlTemplate: 'https://www.tiktok.com/embed/v2/{id}',
        parameters: { id: { type: 'string', pattern: '^[0-9]+$' } },
      },
      'sofascore-widget': {
        urlTemplate: 'https://widgets.sofascore.com/embed/attackMomentum?id={id}&widgetTheme={widgetTheme}',
        parameters: {
          id: { type: 'integer', minimum: 1 },
          widgetTheme: { type: 'string', enum: ['light', 'dark'], default: 'light' },
        },
      },
      'sofascore-match': {
        urlTemplate: 'https://www.sofascore.com/football/match#id:{id}',
        parameters: { id: { type: 'integer', minimum: 1 } },
      },
    },
    renderables: {
      'article-page': page('article-page', [pagePartials[0], pagePartials[1], 'components/article-main', pagePartials[2], pagePartials[3]]),
      homepage: page('homepage', [pagePartials[0], pagePartials[1], 'components/home/main', pagePartials[2], pagePartials[3]]),
      'category-page': page('category-page', [pagePartials[0], pagePartials[1], 'components/category/main', pagePartials[2], pagePartials[3]]),
      'search-page': page('search-page', [pagePartials[0], pagePartials[1], 'components/search/main', pagePartials[2], pagePartials[3]]),
      '404': page('404', ['shell/doc-start-404', 'headers/header-minimal', 'components/not-found/main', pagePartials[2], pagePartials[3]]),
      'live-story': page('live-story', [pagePartials[0], pagePartials[1], 'components/live-story/main', pagePartials[2], pagePartials[3]]),
      'link-in-bio': page('link-in-bio', []),
      'media-page': page('media-page', [pagePartials[0], pagePartials[1], 'components/media/main', pagePartials[2], pagePartials[3]]),
      'standalone-page': page('standalone-page', [pagePartials[0], pagePartials[1], 'components/standalone-main', pagePartials[2], pagePartials[3]]),
      'social-image': {
        template: { entry: 'src/templates/templates/instagram-image.hbs', partials: [] },
        inputSchema: 'dist/schemas/social-image-input.schema.json',
        contentType: 'image/jpeg',
        raster: { format: 'jpeg', width: 1080, height: 1350 },
      },
    },
    staticAssets: {
      ...Object.fromEntries(fontNames.map((name) => [`content/fonts/${name}`, {
        source: `dist/fonts/${name}`,
        contentType: 'font/ttf',
        cacheControl: immutable,
      }])),
      'content/fonts/fonts.css': {
        source: 'dist/fonts/fonts.css',
        contentType: 'text/css; charset=utf-8',
        cacheControl: immutable,
      },
      'content/styles/brokaw.css': {
        source: 'src/styles/compiled.css',
        contentType: 'text/css; charset=utf-8',
        cacheControl: immutable,
      },
    },
    systemPages: [
      {
        renderable: '404',
        contentType: 'text/html; charset=utf-8',
        cacheControl: 'public, max-age=0, must-revalidate',
        variants: systemVariants('404', '404', (language) => ({
          homeLinkLabel: localizedSystemCopy[language].notFound[2],
          categoriesLabel: localizedSystemCopy[language].notFound[3],
        })),
      },
      {
        renderable: 'search-page',
        contentType: 'text/html; charset=utf-8',
        cacheControl: 'public, max-age=0, must-revalidate',
        variants: systemVariants('search-page', 'search', (language) => ({ searchCopy: searchCopyByLanguage[language] })),
      },
    ],
  },
} as const satisfies CronkiteDeclarativeTemplateManifest;
